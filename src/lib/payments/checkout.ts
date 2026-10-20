// Online payments: by card, and by bank (open banking: the client picks
// their bank and approves the payment in its own app). Every online payment
// the site takes starts in `startCheckout`, so swapping a provider changes
// this file and that provider's webhook, nothing else. A transfer the
// client makes by hand isn't one of these: it has no checkout, and staff
// confirm it (src/pages/api/deposits/transfer-sent.ts).
//
// Who takes each:
//   card         Stripe (src/lib/payments/stripe.ts) whenever a Stripe key
//                is set: its test key locally, so no money moves. Without
//                one, the pretend provider below.
//   pay-by-bank  the pretend provider, always for now: Stripe's own Pay by
//                Bank isn't offered to businesses in Malta, and no open-
//                banking provider is chosen yet (docs/architecture/
//                tech-stack.md, "Bank").
//
// The pretend provider is src/pages/secure-booking/test-checkout.astro: no
// card, no bank, no money, but it behaves like a real one from the page's
// side, so the rest of the flow is real.

import { STRIPE_SECRET_KEY } from "astro:env/server"
import type { DepositRecord } from "@lib/deposits/load"
import { createStripeCheckout } from "./stripe"

/** The ways to pay online, as stored on a payment record's `method`. */
export const ONLINE_METHODS = ["card", "pay-by-bank"] as const

export type OnlineMethod = (typeof ONLINE_METHODS)[number]

export const isOnlineMethod = (value: unknown): value is OnlineMethod =>
  ONLINE_METHODS.includes(value as OnlineMethod)

type PaymentProvider = "test" | "stripe"

export const providerFor = (method: OnlineMethod): PaymentProvider =>
  method === "card" && STRIPE_SECRET_KEY ? "stripe" : "test"

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
        // `paid` tells the page to wait for Stripe's webhook, which can land
        // a moment after the client does.
        successUrl: `${depositPage}&paid=1`,
        cancelUrl: depositPage,
      }),
    }
  }

  return {
    checkoutUrl: `${siteOrigin}/secure-booking/test-checkout?method=${method}&token=${encodeURIComponent(token)}`,
  }
}
