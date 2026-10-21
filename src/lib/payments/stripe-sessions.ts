// A Stripe checkout, recorded on its booking. Reached two ways, so a slow
// or lost webhook can't leave a couple waiting:
//
//   the webhook   Stripe tells our API route about the session
//                 (src/pages/api/payments/stripe-events.ts)
//   the return    the couple lands back on the deposit page with the session
//                 id in the address, and the page's first request asks Stripe
//                 about that session directly (src/pages/api/deposits/view.ts)
//
// Whichever arrives first records it; the other finds it already there
// (src/lib/deposits/record-payment.ts skips a payment it has seen).
//
// A card or Pay by Bank checkout is paid when it completes. A bank transfer's
// checkout completes unpaid: the couple has the bank details and the money
// is on its way, so it's recorded as Awaiting, and turns Received when
// Stripe reports the transfer has arrived and matched.

import type { SanityClient } from "@sanity/client"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { recordOnlineDeposit } from "@lib/deposits/record-payment"
import { isOnlineMethod } from "./checkout"
import { retrieveTransferInstructionsUrl, type StripeDepositMetadata } from "./stripe"

/** The parts of a Checkout Session this reads. */
export interface StripeCheckoutSession {
  id: string
  livemode: boolean
  status?: string
  payment_status: string
  payment_intent?: string | null
  amount_total?: number | null
  metadata?: Partial<StripeDepositMetadata> | null
}

/** Records a session's payment if it belongs to one of our quotes. */
export const recordStripeSession = async (
  client: SanityClient,
  session: StripeCheckoutSession,
  { siteOrigin }: { siteOrigin: string },
) => {
  const quoteId = session.metadata?.quoteId
  const method = isOnlineMethod(session.metadata?.method)
    ? session.metadata.method
    : "card"
  const paid = session.payment_status === "paid"
  const transferOnItsWay =
    method === "bank-transfer" && session.status === "complete" && !paid

  if (!quoteId || !(paid || transferOnItsWay)) return "not-paid" as const

  const record = await loadDepositByQuoteId(client, quoteId)
  if (!record?.booking) {
    console.error(`Stripe payment for an unknown quote, ${quoteId}.`)
    return "unknown-quote" as const
  }

  const reference = session.payment_intent ?? session.id

  return recordOnlineDeposit(client, record, {
    method,
    reference,
    gross: (session.amount_total ?? 0) / 100,
    note: session.livemode ? undefined : "Stripe test mode: no money was taken.",
    siteOrigin,
    status: paid ? "received" : "awaiting",
    instructionsUrl:
      transferOnItsWay && session.payment_intent
        ? await retrieveTransferInstructionsUrl(session.payment_intent)
        : undefined,
  })
}
