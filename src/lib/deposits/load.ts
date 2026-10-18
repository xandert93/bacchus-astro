// Everything the deposit page and the deposit endpoints need about one
// quote, found by the secret in its emailed link (only the hash is stored,
// as `quote.depositTokenHash`; see src/lib/tokens.ts).

import type { SanityClient } from "@sanity/client"
import { hashToken } from "@lib/tokens"

export interface DepositRecord {
  _id: string
  reference: string
  status: string
  addressedTo?: string
  event: {
    date: string
    startTime?: string
    endTime?: string
    guestCount: number
    spaces?: string[]
  }
  pricing: {
    lineItems: { label: string; amount: number }[]
    subtotal: number
    discount?: { amount?: number; reason?: string }
    total: number
    vat?: { rate?: number; amount?: number }
    perPerson?: number
    deposit: { percent?: number; amount: number }
  }
  terms?: { balanceDueDate?: string; validUntil?: string }
  booking: {
    _id: string
    status: string
    event: { type: string; date?: string }
    client: { firstName: string; lastName: string; partnerName?: string; email: string }
    payments?: { _key: string; kind: string; status: string; method: string }[]
  }
  bank?: { accountName?: string; iban?: string; bic?: string; areReal?: boolean }
}

// What each loader below fetches for one quote.
const DEPOSIT_PROJECTION = /* groq */ `{
  _id,
  reference,
  status,
  addressedTo,
  event{date, startTime, endTime, guestCount, "spaces": spaces[]->name},
  pricing{lineItems[]{label, amount}, subtotal, discount, total, vat, perPerson, deposit},
  terms,
  "booking": booking->{
    _id,
    status,
    event{type, date},
    client{firstName, lastName, partnerName, email},
    payments[]{_key, kind, status, method}
  },
  "bank": *[_id == "weddingPolicy"][0].bankTransferDetails
}`

const PUBLISHED = `!(_id in path("drafts.**"))`

/** By the secret in the deposit page's link. */
export const loadDepositByToken = async (
  client: SanityClient,
  token: unknown,
): Promise<DepositRecord | null> =>
  typeof token === "string" && token
    ? client.fetch<DepositRecord | null>(
        `*[_type == "quote" && depositTokenHash == $hash && ${PUBLISHED}][0]${DEPOSIT_PROJECTION}`,
        { hash: await hashToken(token) },
      )
    : null

/** By the quote's id, e.g. from a Sanity webhook. */
export const loadDepositByQuoteId = (client: SanityClient, quoteId: string) =>
  client.fetch<DepositRecord | null>(
    `*[_type == "quote" && _id == $id][0]${DEPOSIT_PROJECTION}`,
    { id: quoteId },
  )

/** The booking's live quote (sent or accepted, the newest), by the booking's id. */
export const loadDepositByBookingId = (client: SanityClient, bookingId: string) =>
  client.fetch<DepositRecord | null>(
    `*[_type == "quote" && booking._ref == $id && status in ["sent", "accepted"] && ${PUBLISHED}]
      | order(_createdAt desc)[0]${DEPOSIT_PROJECTION}`,
    { id: bookingId },
  )

/** "Rachel & Paul", or the quote's own wording if staff set one. */
export const coupleName = ({ addressedTo, booking }: DepositRecord) =>
  addressedTo ||
  (booking.client.partnerName
    ? `${booking.client.firstName} & ${booking.client.partnerName}`
    : `${booking.client.firstName} ${booking.client.lastName}`)

/** Whether a deposit has been paid, or the client says they've sent one. */
export const depositPayment = (record: DepositRecord, status: string) =>
  (record.booking.payments ?? []).find(
    (payment) => payment.kind === "deposit" && payment.status === status,
  )

/** The facts every deposit email draws on (lib/email/deposit-emails.ts). */
export const depositFacts = (record: DepositRecord) => ({
  couple: coupleName(record),
  firstName: record.booking.client.firstName,
  email: record.booking.client.email,
  date: record.event.date,
  reference: record.reference,
  total: record.pricing.total,
  deposit: record.pricing.deposit.amount,
  bookingId: record.booking._id,
})
