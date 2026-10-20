// POST /api/payments/stripe-events: Stripe tells us here when a deposit has
// been paid through its checkout (src/lib/payments/stripe.ts), by card or
// by Pay by Bank. Records the payment on the booking and confirms it
// (src/lib/payments/stripe-sessions.ts), unless the deposit page's own check
// on the couple's return got there first.
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
import {
  recordPaidStripeSession,
  type StripeCheckoutSession,
} from "@lib/payments/stripe-sessions"
import { getWriteClient } from "@lib/sanity/write-client"
import { verifyStripeWebhook } from "@lib/webhooks/stripe"

export const prerender = false

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

  const event = JSON.parse(rawBody) as {
    type: string
    data: { object: StripeCheckoutSession }
  }
  if (!PAID_EVENTS.includes(event.type)) return json(200, { ignored: event.type })

  const client = getWriteClient()
  if (!client) return new Response(null, { status: 503 })

  try {
    const outcome = await recordPaidStripeSession(client, event.data.object, {
      siteOrigin: new URL(request.url).origin,
    })

    return json(200, { outcome })
  } catch (error) {
    // A 500 makes Stripe retry later, which is what we want if Sanity blipped.
    console.error("Stripe payment not recorded.", error)
    return new Response(null, { status: 500 })
  }
}
