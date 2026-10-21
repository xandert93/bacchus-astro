// Online payments: by card, and by bank (open banking: the client picks
// their bank and approves the payment in its own app). Every online payment
// the site takes starts in `startCheckout`, so swapping a provider changes
// this file and that provider's webhook, nothing else. A transfer the
// client makes by hand isn't one of these: it has no checkout, and staff
// confirm it (src/pages/api/deposits/transfer-sent.ts).
//
// Who takes them: Stripe (src/lib/payments/stripe.ts) whenever a Stripe key
// is set, through its card checkout or its Pay by Bank; its test key
// locally, so no money moves. Without a key, the pretend provider below.
// Which banks Stripe's Pay by Bank reaches is in docs/architecture/
// tech-stack.md, "Bank": not yet Malta's own, so it's a trial for now.
//
// The pretend provider is src/pages/secure-booking/test-checkout.astro: no
// card, no bank, no money, but it behaves like a real one from the page's
// side, so the rest of the flow is real.

import { STRIPE_SECRET_KEY } from "astro:env/server"
import type { DepositRecord } from "@lib/deposits/load"
import { createStripeCheckout } from "./stripe"

/** The ways to pay online, as stored on a payment record's `method`. */
export const ONLINE_METHODS = ["card", "pay-by-bank", "bank-transfer"] as const

export type OnlineMethod = (typeof ONLINE_METHODS)[number]

export const isOnlineMethod = (value: unknown): value is OnlineMethod =>
  ONLINE_METHODS.includes(value as OnlineMethod)

type PaymentProvider = "test" | "stripe" | "manual"

// Every method goes to Stripe when there's a key. Without one, card and pay
// by bank go to the pretend provider, and a bank transfer is the manual kind:
// bank details on the page, and staff mark it received
// (src/pages/api/deposits/transfer-sent.ts).
export const providerFor = (method: OnlineMethod): PaymentProvider => {
  if (STRIPE_SECRET_KEY) return "stripe"

  return method === "bank-transfer" ? "manual" : "test"
}

/** True unless a live Stripe key is set: no real money can move. */
export const paymentsInTestMode = () => !STRIPE_SECRET_KEY?.startsWith("sk_live_")

/** Where to send the client to pay their deposit. */
export const startCheckout = async ({
  method,
  token,
  siteOrigin,
  record,
}: {
  method: OnlineMethod
  /** The deposit link's secret, which identifies the quote. */
  token: string
  siteOrigin: string
  record: DepositRecord
}) => {
  const depositPage = `${siteOrigin}/secure-booking?token=${encodeURIComponent(token)}`

  if (providerFor(method) === "stripe") {
    return {
      checkoutUrl: await createStripeCheckout({
        record,
        method,
        // `paid` tells the page the client is back from paying; Stripe
        // fills in the session's id, which the page uses to ask Stripe
        // directly rather than wait for the webhook
        // (src/pages/api/deposits/view.ts).
        successUrl: `${depositPage}&paid=1&session={CHECKOUT_SESSION_ID}`,
        cancelUrl: depositPage,
      }),
    }
  }

  return {
    checkoutUrl: `${siteOrigin}/secure-booking/test-checkout?method=${method}&token=${encodeURIComponent(token)}`,
  }
}
