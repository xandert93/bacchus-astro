// POST /api/deposits/bank-payment: the couple has picked their bank
// (`bank`: name and country). Starts the deposit as a payment from it through
// Enable Banking and answers with the address where they approve it
// (src/lib/payments/bank-payments.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { startBankPayment } from "@lib/payments/bank-payments"
import { enableBankingConfigured } from "@lib/payments/enable-banking"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  if (!enableBankingConfigured()) return json(404, { error: "Not found." })

  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal

    const bank = found.body.bank as { name?: unknown; country?: unknown } | undefined
    if (typeof bank?.name !== "string" || typeof bank.country !== "string") {
      return json(400, { error: "Choose your bank." })
    }

    if (toDepositView(found.record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    const approvalUrl = await startBankPayment(found.client, found.record, {
      bank: { name: bank.name, country: bank.country },
      siteOrigin: new URL(request.url).origin,
    })

    return json(200, { approvalUrl })
  } catch (error) {
    console.error("Bank payment not started.", error)
    return json(502, { error: "Your bank can't be reached right now. Please try again." })
  }
}
