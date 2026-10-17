// POST /api/deposits/test-card: the pretend card checkout's "Pay" button
// (src/pages/secure-booking/test-checkout.astro). Does what a real card
// provider's "payment succeeded" webhook will: records the payment and
// confirms the booking. Refused unless the site is in card test mode.

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { confirmDeposit } from "@lib/deposits/confirm"
import { loadDepositByToken } from "@lib/deposits/load"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { CARD_PROVIDER } from "@lib/payments/card"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  if (CARD_PROVIDER !== "test") return json(404, { error: "Not found." })

  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    const { client, record, token } = found

    if (toDepositView(record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    await client
      .patch(record.booking._id)
      .setIfMissing({ payments: [] })
      .append("payments", [
        {
          _type: "paymentRecord",
          _key: crypto.randomUUID().slice(0, 12),
          method: "card",
          kind: "deposit",
          status: "received",
          amounts: { gross: record.pricing.deposit.amount },
          reference: `test_${crypto.randomUUID().slice(0, 8)}`,
          receivedAt: new Date().toISOString(),
          note: "Test mode: no money was taken.",
        },
      ])
      .commit()

    // Reloaded, so the confirmation sees the payment just recorded.
    const updated = await loadDepositByToken(client, token)
    const outcome = await confirmDeposit(client, updated ?? record, {
      actor: "payment-webhook",
      siteOrigin: new URL(request.url).origin,
    })

    return json(200, { ok: true, outcome })
  } catch (error) {
    console.error("Test card payment not recorded.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
