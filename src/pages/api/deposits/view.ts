// POST /api/deposits/view: what the deposit page shows for its link's token
// (src/lib/deposits/view.ts). A POST so the token stays out of logs that
// record addresses.

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal

    return json(
      200,
      { view: toDepositView(found.record) },
      { "Cache-Control": "no-store" },
    )
  } catch (error) {
    console.error("Deposit page not loaded.", error)
    return json(502, { error: "This page can't load right now." })
  }
}
