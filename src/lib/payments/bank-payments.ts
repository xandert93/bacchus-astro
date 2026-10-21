// Our side of an Enable Banking payment (src/lib/payments/enable-banking.ts):
// starting one for a quote, and checking it when the couple comes back.
//
// Each start is noted on the quote (`bankPaymentAttempts`) with a random
// `state` that rides along to the bank and back, so the page can say which
// attempt it's returning from. A payment the bank accepts is recorded as on
// its way, and turns Received, confirming the booking, once the bank reports
// it settled (src/lib/deposits/record-payment.ts).

import type { SanityClient } from "@sanity/client"
import { recordOnlineDeposit } from "@lib/deposits/record-payment"
import type { DepositRecord } from "@lib/deposits/load"
import {
  bankPaymentStatus,
  createBankPayment,
  ON_ITS_WAY_STATUSES,
  SETTLED_STATUSES,
  type PaymentBank,
} from "./enable-banking"

// A valid Maltese IBAN for trying the flow while the wedding policy holds
// example details, which a bank's checks would refuse (it's the registry's
// own sample, not an account).
const TRIAL_IBAN = "MT84MALT011000012345MTLCAST001S"

export const startBankPayment = async (
  client: SanityClient,
  record: DepositRecord,
  { bank, siteOrigin }: { bank: PaymentBank; siteOrigin: string },
) => {
  const state = crypto.randomUUID()
  const creditorIban =
    record.bank?.areReal && record.bank.iban
      ? record.bank.iban.replace(/\s/g, "")
      : TRIAL_IBAN

  const payment = await createBankPayment({
    record,
    bank,
    state,
    creditorIban,
    siteOrigin,
  })

  await client
    .patch(record._id)
    .setIfMissing({ bankPaymentAttempts: [] })
    .append("bankPaymentAttempts", [
      {
        _key: state.slice(0, 12),
        state,
        paymentId: payment.payment_id,
        bank: `${bank.name} (${bank.country})`,
        startedAt: new Date().toISOString(),
      },
    ])
    .commit()

  return payment.url
}

/**
 * Checks the attempt the couple is returning from (by its `state`), or with
 * none given, the latest one, and records what the bank says.
 */
export const checkBankPayment = async (
  client: SanityClient,
  record: DepositRecord,
  { state, siteOrigin }: { state?: string; siteOrigin: string },
) => {
  const attempts = record.bankPaymentAttempts ?? []
  const attempt = state ? attempts.find((each) => each.state === state) : attempts.at(-1)
  if (!attempt) return "no-attempt" as const

  const { status } = await bankPaymentStatus(attempt.paymentId)
  const settled = SETTLED_STATUSES.includes(status)
  if (!settled && !ON_ITS_WAY_STATUSES.includes(status)) return status

  return recordOnlineDeposit(client, record, {
    method: "pay-by-bank",
    reference: attempt.paymentId,
    gross: record.pricing.deposit.amount,
    note: "Enable Banking sandbox: no money was moved.",
    siteOrigin,
    status: settled ? "received" : "awaiting",
  })
}
