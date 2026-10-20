// A paid Stripe checkout, recorded on its booking. Reached two ways, so a
// slow or lost webhook can't leave a couple waiting:
//
//   the webhook   Stripe tells our API route the session is paid
//                 (src/pages/api/payments/stripe-events.ts)
//   the return    the couple lands back on the deposit page with the session
//                 id in the address, and the page's first request asks Stripe
//                 about that session directly (src/pages/api/deposits/view.ts)
//
// Whichever arrives first records the payment; the other finds it already
// there (src/lib/deposits/record-payment.ts skips a payment it has seen).

import type { SanityClient } from "@sanity/client"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { recordOnlineDeposit } from "@lib/deposits/record-payment"
import { isOnlineMethod } from "./checkout"
import type { StripeDepositMetadata } from "./stripe"

/** The parts of a Checkout Session this reads. */
export interface StripeCheckoutSession {
  id: string
  livemode: boolean
  payment_status: string
  payment_intent?: string | null
  amount_total?: number | null
  metadata?: Partial<StripeDepositMetadata> | null
}

/**
 * Records a session's payment if it's paid and belongs to one of our
 * quotes. Answers what happened, for logs and the webhook's reply.
 */
export const recordPaidStripeSession = async (
  client: SanityClient,
  session: StripeCheckoutSession,
  { siteOrigin }: { siteOrigin: string },
) => {
  const quoteId = session.metadata?.quoteId
  if (session.payment_status !== "paid" || !quoteId) return "not-paid" as const

  const record = await loadDepositByQuoteId(client, quoteId)
  if (!record?.booking) {
    console.error(`Stripe payment for an unknown quote, ${quoteId}.`)
    return "unknown-quote" as const
  }

  return recordOnlineDeposit(client, record, {
    // Which button they pressed, written on the session when it started.
    method: isOnlineMethod(session.metadata?.method) ? session.metadata.method : "card",
    reference: session.payment_intent ?? session.id,
    gross: (session.amount_total ?? 0) / 100,
    note: session.livemode ? undefined : "Stripe test mode: no money was taken.",
    siteOrigin,
  })
}
