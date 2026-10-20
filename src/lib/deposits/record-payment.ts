// What a payment provider's "payment succeeded" does, for the pretend
// provider and Stripe alike: record the deposit on the booking, then confirm
// it (src/lib/deposits/confirm.ts).

import type { SanityClient } from "@sanity/client"
import type { OnlineMethod } from "@lib/payments/checkout"
import { confirmDeposit } from "./confirm"
import { loadDepositByQuoteId, type DepositRecord } from "./load"

export const recordOnlineDeposit = async (
  client: SanityClient,
  record: DepositRecord,
  {
    method,
    reference,
    gross,
    note,
    siteOrigin,
  }: {
    method: OnlineMethod
    /** The provider's id for the payment, which also spots a repeat report. */
    reference: string
    gross: number
    note?: string
    siteOrigin: string
  },
) => {
  // A provider may report one payment more than once (Stripe delivers
  // "at least once"), so a payment already on the booking is left alone.
  if (record.booking.payments?.some((payment) => payment.reference === reference)) {
    return "already-recorded" as const
  }

  // Two reports arriving at the same moment could both pass that check, so
  // the write only goes ahead if the booking is still as it was when read.
  // The loser fails, its provider retries, and the retry finds the payment.
  await client
    .patch(record.booking._id)
    .ifRevisionId(record.booking._rev)
    .setIfMissing({ payments: [] })
    .append("payments", [
      {
        _type: "paymentRecord",
        _key: crypto.randomUUID().slice(0, 12),
        method,
        kind: "deposit",
        status: "received",
        amounts: { gross },
        reference,
        receivedAt: new Date().toISOString(),
        ...(note ? { note } : {}),
      },
    ])
    .commit()

  // Reloaded, so the confirmation sees the payment just recorded.
  const updated = await loadDepositByQuoteId(client, record._id)

  return confirmDeposit(client, updated ?? record, {
    actor: "payment-webhook",
    siteOrigin,
  })
}
