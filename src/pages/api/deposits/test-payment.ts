// POST /api/deposits/test-payment: the pretend checkout's "Pay" or "Approve"
// button (src/pages/secure-booking/test-checkout.astro), for card or pay by
// bank (`method`). Does what a real provider's "payment succeeded" webhook
// does: records the payment and confirms the booking. Refused for any way to
// pay that a real provider takes (src/lib/payments/checkout.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { recordOnlineDeposit } from "@lib/deposits/record-payment"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { isOnlineMethod, providerFor } from "@lib/payments/checkout"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    const { client, record, body } = found

    if (!isOnlineMethod(body.method) || providerFor(body.method) !== "test") {
      return json(404, { error: "Not found." })
    }

    if (toDepositView(record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    const outcome = await recordOnlineDeposit(client, record, {
      method: body.method,
      reference: `test_${crypto.randomUUID().slice(0, 8)}`,
      gross: record.pricing.deposit.amount,
      note: "Test mode: no money was taken.",
      siteOrigin: new URL(request.url).origin,
    })

    return json(200, { ok: true, outcome })
  } catch (error) {
    console.error("Test payment not recorded.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
