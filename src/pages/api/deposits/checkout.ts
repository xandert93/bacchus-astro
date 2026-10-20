// POST /api/deposits/checkout: the client presses "Pay by bank" or "Pay by
// card" (`method`). Answers with where to send them to pay
// (src/lib/payments/checkout.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { isOnlineMethod, startCheckout } from "@lib/payments/checkout"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal

    const { method } = found.body
    if (!isOnlineMethod(method)) return json(400, { error: "Choose a way to pay." })

    if (toDepositView(found.record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    return json(
      200,
      await startCheckout({
        method,
        token: found.token,
        siteOrigin: new URL(request.url).origin,
        record: found.record,
      }),
    )
  } catch (error) {
    console.error("Checkout not started.", error)
    return json(502, { error: "Payment can't start right now. Please try again." })
  }
}
