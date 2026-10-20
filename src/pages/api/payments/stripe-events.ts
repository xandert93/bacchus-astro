// POST /api/payments/stripe-events: Stripe tells us here when a deposit has
// been paid through its checkout (src/lib/payments/stripe.ts). Records the
// payment on the booking and confirms it, as the pretend provider's Pay
// button does (src/lib/deposits/record-payment.ts).
//
// Locally, `stripe listen --forward-to localhost:3000/api/payments/stripe-events`
// delivers the events and prints the signing secret for
// STRIPE_WEBHOOK_SECRET. Live, a webhook endpoint in Stripe's Dashboard does
// it. Every event is answered 2xx once it's understood, so Stripe stops
// retrying it; anything that isn't a paid deposit is acknowledged and
// ignored.

import type { APIRoute } from "astro"
import { STRIPE_WEBHOOK_SECRET } from "astro:env/server"
import { json } from "@lib/api/requests"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { recordOnlineDeposit } from "@lib/deposits/record-payment"
import type { StripeDepositMetadata } from "@lib/payments/stripe"
import { getWriteClient } from "@lib/sanity/write-client"
import { verifyStripeWebhook } from "@lib/webhooks/stripe"

export const prerender = false

/** The parts of a Checkout Session event this reads. */
interface CheckoutSessionEvent {
  type: string
  livemode: boolean
  data: {
    object: {
      id: string
      payment_status: string
      payment_intent?: string
      amount_total?: number
      metadata?: Partial<StripeDepositMetadata>
    }
  }
}

// A card is paid when its checkout completes; a payment that settles later
// (a bank transfer) arrives as the second.
const PAID_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]

export const POST: APIRoute = async ({ request }) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe event ignored: STRIPE_WEBHOOK_SECRET is not set.")
    return new Response(null, { status: 503 })
  }

  // The raw text, not parsed JSON: the signature covers the exact bytes.
  const rawBody = await request.text()
  if (!(await verifyStripeWebhook(rawBody, request.headers, STRIPE_WEBHOOK_SECRET))) {
    return new Response(null, { status: 401 })
  }

  const event = JSON.parse(rawBody) as CheckoutSessionEvent
  const session = event.data.object
  const quoteId = session.metadata?.quoteId

  if (
    !PAID_EVENTS.includes(event.type) ||
    session.payment_status !== "paid" ||
    !quoteId
  ) {
    return json(200, { ignored: event.type })
  }

  const client = getWriteClient()
  if (!client) return new Response(null, { status: 503 })

  try {
    const record = await loadDepositByQuoteId(client, quoteId)
    if (!record?.booking) {
      console.error(`Stripe payment for an unknown quote, ${quoteId}.`)
      return json(200, { ignored: "unknown quote" })
    }

    const outcome = await recordOnlineDeposit(client, record, {
      method: "card",
      reference: session.payment_intent ?? session.id,
      gross: (session.amount_total ?? 0) / 100,
      note: event.livemode ? undefined : "Stripe test mode: no money was taken.",
      siteOrigin: new URL(request.url).origin,
    })

    return json(200, { outcome })
  } catch (error) {
    // A 500 makes Stripe retry later, which is what we want if Sanity blipped.
    console.error("Stripe payment not recorded.", error)
    return new Response(null, { status: 500 })
  }
}
