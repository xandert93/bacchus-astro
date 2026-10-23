// Everything the deposit page and the deposit endpoints need about one
// quote, found by the secret in its emailed link (only the hash is stored,
// in `quote.depositTokenHashes`; see src/lib/tokens.ts).

import type { SanityClient } from "@sanity/client"
import type { IncludedSetUp } from "@studio/lib/includedSetUp"
import { hashToken } from "@lib/tokens"

export interface DepositRecord {
  _id: string
  reference: string
  status: string
  addressedTo?: string
  preparedBy?: string
  clientNotes?: string
  includedSetUp?: IncludedSetUp
  event: {
    date: string
    startTime?: string
    endTime?: string
    guestCount: number
    spaces?: string[]
  }
  /** When the quote was sent: the date it was issued. */
  sentAt?: string
  menu?: {
    mealFormat?: string
    /** The meal's tier and package, e.g. "Rose" of "Reception". */
    meal?: { name?: string; package?: string }
    cake?: { tiers?: number; flavour?: string }
  }
  pricing: {
    lineItems: {
      label: string
      amount: number
      quantity?: number
      unitAmount?: number
      /** Its group on the quote: food, beverage, setup and so on. */
      category?: string
      /** The package tier a line was priced from, if any. */
      source?: string
      /** What it was priced from: "packageTier", "station" and so on. */
      sourceType?: string
    }[]
    subtotal: number
    discount?: { amount?: number; reason?: string }
    total: number
    vat?: { rate?: number; amount?: number }
    perPerson?: number
    deposit: { percent?: number; amount: number }
  }
  terms?: { balanceDueDate?: string; validUntil?: string }
  reminderSentAt?: string
  bankPaymentAttempts?: { state: string; paymentId: string; bank?: string }[]
  booking: {
    _id: string
    /** Sanity's revision, so a write can refuse if the booking changed meanwhile. */
    _rev: string
    status: string
    event: { type: string; date?: string }
    client: { firstName: string; lastName: string; partnerName?: string; email: string }
    payments?: {
      _key: string
      kind: string
      status: string
      method: string
      reference?: string
      receivedAt?: string
      amounts?: { gross?: number }
      instructionsUrl?: string
    }[]
  }
  bank?: { accountName?: string; iban?: string; bic?: string; areReal?: boolean }
}

// What each loader below fetches for one quote.
const DEPOSIT_PROJECTION = /* groq */ `{
  _id,
  reference,
  status,
  addressedTo,
  preparedBy,
  clientNotes,
  includedSetUp,
  event{date, startTime, endTime, guestCount, "spaces": spaces[]->name},
  sentAt,
  menu{"mealFormat": mealFormat._ref, "meal": mealFormat->{name, "package": package->name}, cake},
  pricing{lineItems[]{label, amount, quantity, unitAmount, category, "source": sourceRef._ref, "sourceType": sourceRef->_type}, subtotal, discount, total, vat, perPerson, deposit},
  terms,
  reminderSentAt,
  bankPaymentAttempts[]{state, paymentId, bank},
  "booking": booking->{
    _id,
    _rev,
    status,
    event{type, date},
    client{firstName, lastName, partnerName, email},
    payments[]{_key, kind, status, method, reference, receivedAt, amounts, instructionsUrl}
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
        `*[_type == "quote" && $hash in depositTokenHashes && ${PUBLISHED}][0]${DEPOSIT_PROJECTION}`,
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
  balanceDueDate: record.terms?.balanceDueDate,
  depositPercent: record.pricing.deposit.percent,
  preparedBy: record.preparedBy,
})
