// Stripe's API, called with fetch: the Worker needs no Stripe library for
// the two things the site does with it, starting a checkout here and
// reading its webhooks (src/pages/api/payments/stripe-events.ts).

import { STRIPE_SECRET_KEY } from "astro:env/server"
import type { DepositRecord } from "@lib/deposits/load"
import { longDate } from "@lib/email/enquiry-details"

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

const stripePost = async <Result>(path: string, params: FormValue) => {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode(params),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(`Stripe answered ${response.status}: ${result.error?.message}`)
  }

  return result as Result
}

/** What the webhook reads back from a session's metadata. */
export interface StripeDepositMetadata {
  quoteId: string
  bookingId: string
}

/**
 * Starts a Stripe Checkout session for a quote's deposit, and answers with
 * the address of Stripe's payment page. Stripe sends the client to
 * `successUrl` once they've paid, or `cancelUrl` if they go back.
 */
export const createStripeCheckout = async ({
  record,
  successUrl,
  cancelUrl,
}: {
  record: DepositRecord
  successUrl: string
  cancelUrl: string
}) => {
  const metadata: StripeDepositMetadata = {
    quoteId: record._id,
    bookingId: record.booking._id,
  }

  const session = await stripePost<{ url: string }>("/checkout/sessions", {
    mode: "payment",
    // No payment_method_types: Stripe no longer takes one here. Its page
    // offers whichever methods are switched on in the Dashboard (Settings →
    // Payment methods), cards included.
    customer_email: record.booking.client.email,
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
