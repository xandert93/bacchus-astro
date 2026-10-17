// POST /api/deposits/card: the client presses "Pay by card". Answers with
// where to send them to pay (src/lib/payments/card.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { startCardCheckout } from "@lib/payments/card"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal

    if (toDepositView(found.record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    return json(
      200,
      startCardCheckout({ token: found.token, siteOrigin: new URL(request.url).origin }),
    )
  } catch (error) {
    console.error("Card checkout not started.", error)
    return json(502, { error: "Card payment can't start right now. Please try again." })
  }
}
