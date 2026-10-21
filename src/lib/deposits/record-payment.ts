// What a payment provider's "payment succeeded" does, for the pretend
// provider and Stripe alike: record the deposit on the booking, then confirm
// it (src/lib/deposits/confirm.ts). A bank transfer through Stripe arrives
// in two steps: first "on its way" (recorded as Awaiting, with nothing to
// confirm yet), then "arrived", which turns that same payment Received and
// confirms the booking.

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
    status = "received",
    instructionsUrl,
  }: {
    method: OnlineMethod
    /** The provider's id for the payment, which also spots a repeat report. */
    reference: string
    gross: number
    note?: string
    siteOrigin: string
    /** "awaiting" for a transfer on its way; "received" once it's paid. */
    status?: "awaiting" | "received"
    /** Where the couple can see a transfer's bank details again. */
    instructionsUrl?: string
  },
) => {
  // A provider may report one payment more than once (Stripe delivers
  // "at least once"), so a payment already on the booking is left alone,
  // unless it's a transfer that was on its way and has now arrived.
  const existing = record.booking.payments?.find(
    (payment) => payment.reference === reference,
  )
  if (existing && (existing.status === "received" || status === "awaiting")) {
    return "already-recorded" as const
  }

  // Two reports arriving at the same moment could both pass that check, so
  // the write only goes ahead if the booking is still as it was when read.
  // The loser fails, its provider retries, and the retry finds the payment.
  const patch = client.patch(record.booking._id).ifRevisionId(record.booking._rev)
  const receivedAt = new Date().toISOString()

  if (existing) {
    await patch
      .set({
        [`payments[_key=="${existing._key}"].status`]: "received",
        [`payments[_key=="${existing._key}"].receivedAt`]: receivedAt,
      })
      .commit()
  } else {
    await patch
      .setIfMissing({ payments: [] })
      .append("payments", [
        {
          _type: "paymentRecord",
          _key: crypto.randomUUID().slice(0, 12),
          method,
          kind: "deposit",
          status,
          amounts: { gross },
          reference,
          ...(status === "received" ? { receivedAt } : {}),
          ...(instructionsUrl ? { instructionsUrl } : {}),
          ...(note ? { note } : {}),
        },
      ])
      .commit()
  }

  if (status === "awaiting") return "awaiting" as const

  // Reloaded, so the confirmation sees the payment just recorded.
  const updated = await loadDepositByQuoteId(client, record._id)

  return confirmDeposit(client, updated ?? record, {
    actor: "payment-webhook",
    siteOrigin,
  })
}
