// Online payments, through one provider at a time: by card, and by bank
// (open banking: the client picks their bank and approves the payment in its
// own app, and the provider tells us straight away). Every online payment
// the site takes starts in `startCheckout`, so swapping the provider (Stripe,
// or Viva or Revolut if they turn out cheaper; docs/architecture/
// tech-stack.md) changes this file and the provider's own webhook, nothing
// else. A transfer the client makes by hand isn't one of these: it has no
// checkout, and staff confirm it (src/pages/api/deposits/transfer-sent.ts).
//
// "test" is a pretend provider of our own (src/pages/secure-booking/
// test-checkout.astro): no provider, no bank, no money. It behaves like a
// real one from the page's side, so the rest of the flow is real.

/** The ways to pay online, as stored on a payment record's `method`. */
export const ONLINE_METHODS = ["card", "pay-by-bank"] as const

export type OnlineMethod = (typeof ONLINE_METHODS)[number]

export const isOnlineMethod = (value: unknown): value is OnlineMethod =>
  ONLINE_METHODS.includes(value as OnlineMethod)

/** The providers this file can talk to. Only "test" is built so far. */
type PaymentProvider = "test" | "stripe"

/** Which provider takes online payments. */
export const PAYMENT_PROVIDER: PaymentProvider = "test"

/** Where to send the client to pay their deposit. */
export const startCheckout = ({
  method,
  token,
  siteOrigin,
}: {
  method: OnlineMethod
  /** The deposit link's secret, which identifies the quote. */
  token: string
  siteOrigin: string
}) => ({
  checkoutUrl: `${siteOrigin}/secure-booking/test-checkout?method=${method}&token=${encodeURIComponent(token)}`,
})
