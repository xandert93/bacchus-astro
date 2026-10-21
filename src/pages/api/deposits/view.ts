// POST /api/deposits/view: what the deposit page shows for its link's token
// (src/lib/deposits/view.ts). A POST so the token stays out of logs that
// record addresses.
//
// While the deposit is still due (or on its way), this first catches up with
// the payment providers, so the couple isn't left waiting on a webhook:
//
//   Stripe          back from Stripe's checkout, the page sends its session's
//                   id (`session`); this asks Stripe about it and records it
//                   (src/lib/payments/stripe-sessions.ts). Stripe's answer is
//                   trusted only for the quote this link belongs to.
//   Enable Banking  back from the couple's bank, the page sends the payment's
//                   `bankState`; with none, the latest attempt is checked
//                   (src/lib/payments/bank-payments.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { checkBankPayment } from "@lib/payments/bank-payments"
import { enableBankingConfigured } from "@lib/payments/enable-banking"
import { retrieveStripeCheckout } from "@lib/payments/stripe"
import { recordStripeSession } from "@lib/payments/stripe-sessions"

export const prerender = false

const STILL_DUE = ["pay", "transfer-sent"]

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    const { client, body } = found
    let { record } = found
    const siteOrigin = new URL(request.url).origin
    const reload = async () =>
      (record = (await loadDepositByQuoteId(client, record._id)) ?? record)

    const sessionId = body.session
    if (typeof sessionId === "string" && toDepositView(record).state === "pay") {
      try {
        const session = await retrieveStripeCheckout(sessionId)
        if (session?.metadata?.quoteId === record._id) {
          await recordStripeSession(client, session, { siteOrigin })
          await reload()
        }
      } catch (error) {
        // The webhook will still record it; the page just waits a little.
        console.error("Stripe session not checked on return.", error)
      }
    }

    if (
      enableBankingConfigured() &&
      record.bankPaymentAttempts?.length &&
      STILL_DUE.includes(toDepositView(record).state)
    ) {
      try {
        const state = typeof body.bankState === "string" ? body.bankState : undefined
        await checkBankPayment(client, record, { state, siteOrigin })
        await reload()
      } catch (error) {
        console.error("Bank payment not checked.", error)
      }
    }

    return json(200, { view: toDepositView(record) }, { "Cache-Control": "no-store" })
  } catch (error) {
    console.error("Deposit page not loaded.", error)
    return json(502, { error: "This page can't load right now." })
  }
}
