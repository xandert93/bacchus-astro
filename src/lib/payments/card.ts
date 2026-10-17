// Card payments, through one provider at a time. Every card payment the site
// takes goes through `startCardCheckout`, so swapping the provider (Stripe,
// or Viva or Revolut if they turn out cheaper; docs/architecture/tech-stack.md)
// changes this file and the provider's own webhook, nothing else.
//
// "test" is a pretend checkout of our own (src/pages/secure-booking/
// test-checkout.astro): no provider, no card details, no money. It behaves
// like a real one from the page's side, so the rest of the flow is real.

/** The providers this file can talk to. Only "test" is built so far. */
type CardProvider = "test" | "stripe"

/** Which provider takes card payments. */
export const CARD_PROVIDER: CardProvider = "test"

/** Where to send the client to pay their deposit by card. */
export const startCardCheckout = ({
  token,
  siteOrigin,
}: {
  /** The deposit link's secret, which identifies the quote. */
  token: string
  siteOrigin: string
}) => ({
  checkoutUrl: `${siteOrigin}/secure-booking/test-checkout?token=${encodeURIComponent(token)}`,
})
