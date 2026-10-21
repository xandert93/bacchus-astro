// POST /api/deposits/banks: the banks a couple can pay their deposit from
// through Enable Banking (src/lib/payments/enable-banking.ts), for the bank
// picker (/secure-booking/choose-bank). Needs the deposit link's token, like
// every deposit route, though the list itself is the same for everyone.

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { enableBankingConfigured, listPaymentBanks } from "@lib/payments/enable-banking"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  if (!enableBankingConfigured()) return json(404, { error: "Not found." })

  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal

    return json(200, { banks: await listPaymentBanks() })
  } catch (error) {
    console.error("Bank list not loaded.", error)
    return json(502, {
      error: "The list of banks can't load right now. Please try again.",
    })
  }
}
