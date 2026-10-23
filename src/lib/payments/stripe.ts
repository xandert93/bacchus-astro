// Stripe's API, called with fetch: the Worker needs no Stripe library for
// the two things the site does with it, starting a checkout here and
// reading its webhooks (src/pages/api/payments/stripe-events.ts).

import { STRIPE_SECRET_KEY } from "astro:env/server"
import type { DepositRecord } from "@lib/deposits/load"
import { longDate } from "@lib/dates"
import type { OnlineMethod } from "./checkout"
import type { StripeCheckoutSession } from "./stripe-sessions"

const STRIPE_API = "https://api.stripe.com/v1"

type FormValue = string | number | boolean | FormValue[] | { [key: string]: FormValue }

/**
 * Stripe takes form-encoded bodies, with nested keys written out in
 * brackets: { line_items: [{ quantity: 1 }] } becomes line_items[0][quantity]=1.
 */
const formEncode = (
  value: FormValue,
  key = "",
  form = new URLSearchParams(),
): URLSearchParams => {
  if (typeof value !== "object") {
    form.append(key, String(value))
  } else {
    Object.entries(value).forEach(([childKey, childValue]) =>
      formEncode(childValue, key ? `${key}[${childKey}]` : childKey, form),
    )
  }

  return form
}

const stripeRequest = async <Result>(
  method: "GET" | "POST",
  path: string,
  params?: FormValue,
) => {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params === undefined ? undefined : formEncode(params),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(`Stripe answered ${response.status}: ${result.error?.message}`)
  }

  return result as Result
}

// --- Which payment methods each button offers --------------------------------
//
// Stripe no longer takes a list of payment methods per checkout; it shows
// what a "payment method configuration" switches on. So each of our buttons
// has its own configuration, created in the Stripe account the first time
// it's needed and found by name after that. What each offers is decided
// here, in code, not in the Dashboard: Bacchus's own account gets the same
// set at launch. Change a list below and bump CONFIGURATION_VERSION, so a
// fresh configuration is made rather than the old one reused.

const CONFIGURATION_VERSION = 2

/** The methods each of our buttons offers, by Stripe's names. */
const METHODS_BY_BUTTON: Record<OnlineMethod, string[]> = {
  // Apple Pay, Google Pay and Link are cards saved in a phone, a browser or
  // Stripe: same fees, one tap. Revolut Pay is Revolut's own one-tap
  // checkout, popular in Malta.
  card: ["card", "apple_pay", "google_pay", "link", "revolut_pay"],
  // Open banking: the client approves the payment in their bank's own app.
  "pay-by-bank": ["pay_by_bank"],
  // An ordinary transfer from their own banking app, to bank details unique
  // to this payment, which Stripe matches to it when the money arrives.
  "bank-transfer": ["customer_balance"],
}

/** Every method a configuration has to switch on or off explicitly. */
const ALL_METHODS = [
  "card",
  "apple_pay",
  "google_pay",
  "link",
  "revolut_pay",
  "pay_by_bank",
  "paypal",
  "samsung_pay",
  "customer_balance",
  "klarna",
]

const configurationIds = new Map<OnlineMethod, string>()

const configurationFor = async (method: OnlineMethod) => {
  const known = configurationIds.get(method)
  if (known) return known

  const name = `Bacchus website: ${method} (v${CONFIGURATION_VERSION})`
  const existing = await stripeRequest<{
    data: { id: string; name: string; active: boolean }[]
  }>("GET", "/payment_method_configurations?limit=100")
  const found = existing.data.find(
    (configuration) => configuration.active && configuration.name === name,
  )

  const id =
    found?.id ??
    (
      await stripeRequest<{ id: string }>("POST", "/payment_method_configurations", {
        name,
        ...Object.fromEntries(
          ALL_METHODS.map((stripeMethod) => [
            stripeMethod,
            {
              display_preference: {
                preference: METHODS_BY_BUTTON[method].includes(stripeMethod)
                  ? "on"
                  : "off",
              },
            },
          ]),
        ),
      })
    ).id

  configurationIds.set(method, id)

  return id
}

// --- Starting a checkout ------------------------------------------------------

/** What the webhook reads back from a session's metadata. */
export interface StripeDepositMetadata {
  quoteId: string
  bookingId: string
  method: OnlineMethod
}

/**
 * Starts a Stripe Checkout session for a quote's deposit, offering only the
 * button's own methods, and answers with the address of Stripe's payment
 * page. Stripe sends the client to `successUrl` once they've paid, or
 * `cancelUrl` if they go back.
 */
export const createStripeCheckout = async ({
  record,
  method,
  successUrl,
  cancelUrl,
}: {
  record: DepositRecord
  method: OnlineMethod
  successUrl: string
  cancelUrl: string
}) => {
  const metadata: StripeDepositMetadata = {
    quoteId: record._id,
    bookingId: record.booking._id,
    method,
  }

  // A bank transfer needs a Stripe customer, to give them their own bank
  // details; card and Pay by Bank don't.
  const bankTransfer: Record<string, FormValue> =
    method === "bank-transfer"
      ? {
          customer: (
            await stripeRequest<{ id: string }>("POST", "/customers", {
              email: record.booking.client.email,
              name: `${record.booking.client.firstName} ${record.booking.client.lastName}`,
              metadata: { bookingId: record.booking._id },
            })
          ).id,
          payment_method_options: {
            customer_balance: {
              funding_type: "bank_transfer",
              // Euro bank details from Stripe's Irish entity, which serves
              // businesses across the EU.
              bank_transfer: {
                type: "eu_bank_transfer",
                eu_bank_transfer: { country: "IE" },
              },
            },
          },
        }
      : { customer_email: record.booking.client.email }

  const session = await stripeRequest<{ url: string }>("POST", "/checkout/sessions", {
    mode: "payment",
    ...bankTransfer,
    payment_method_configuration: await configurationFor(method),
    client_reference_id: record._id,
    metadata: { ...metadata },
    payment_intent_data: {
      description: `Deposit, quote ${record.reference}`,
      metadata: { ...metadata },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          // Stripe counts in cents.
          unit_amount: Math.round(record.pricing.deposit.amount * 100),
          product_data: {
            name: `Deposit for ${longDate(record.event.date)}`,
            description: `Bacchus, Mdina · quote ${record.reference}`,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url
}

/**
 * One checkout session, as Stripe has it now: whether it's paid, and the
 * quote it belongs to. Ids that aren't a checkout session's are refused
 * before asking Stripe.
 */
export const retrieveStripeCheckout = async (sessionId: string) => {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null

  return stripeRequest<StripeCheckoutSession>("GET", `/checkout/sessions/${sessionId}`)
}

/**
 * The page where Stripe shows a bank transfer's details (account, reference,
 * amount), for the couple to come back to. Missing if Stripe hasn't made
 * one, which never stops the payment being recorded.
 */
export const retrieveTransferInstructionsUrl = async (paymentIntentId: string) => {
  try {
    const intent = await stripeRequest<{
      next_action?: {
        display_bank_transfer_instructions?: { hosted_instructions_url?: string }
      }
    }>("GET", `/payment_intents/${paymentIntentId}`)

    return intent.next_action?.display_bank_transfer_instructions?.hosted_instructions_url
  } catch (error) {
    console.error("Transfer instructions not found.", error)
    return undefined
  }
}
