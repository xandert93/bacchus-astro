// POST /api/deposits/view: what the deposit page shows for its link's token
// (src/lib/deposits/view.ts). A POST so the token stays out of logs that
// record addresses.
//
// Back from paying through Stripe, the page also sends the checkout session's
// id (`session`). If the deposit still shows as due, this asks Stripe about
// that session directly and records the payment if it's paid, so the couple
// isn't left waiting on the webhook (src/lib/payments/stripe-sessions.ts).
// Stripe's answer is trusted only for the quote this link belongs to.

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { retrieveStripeCheckout } from "@lib/payments/stripe"
import { recordPaidStripeSession } from "@lib/payments/stripe-sessions"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    let { record } = found

    const sessionId = found.body.session
    if (typeof sessionId === "string" && toDepositView(record).state === "pay") {
      try {
        const session = await retrieveStripeCheckout(sessionId)
        if (session?.metadata?.quoteId === record._id) {
          await recordPaidStripeSession(found.client, session, {
            siteOrigin: new URL(request.url).origin,
          })
          record = (await loadDepositByQuoteId(found.client, record._id)) ?? record
        }
      } catch (error) {
        // The webhook will still record it; the page just waits a little.
        console.error("Stripe session not checked on return.", error)
      }
    }

    return json(200, { view: toDepositView(record) }, { "Cache-Control": "no-store" })
  } catch (error) {
    console.error("Deposit page not loaded.", error)
    return json(502, { error: "This page can't load right now." })
  }
}
