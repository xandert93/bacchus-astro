// What the deposit page shows for a quote: its state, and every figure and
// line already worded for the page. The endpoint (src/pages/api/deposits/
// view.ts) sends this, and the page's script only drops it into place, so
// all the wording lives here, on the server.

import { todayInMalta } from "@lib/dates"
import { longDate } from "@lib/email/enquiry-details"
import { euros, plainAmount } from "@lib/money"
import { PAYMENT_PROVIDER } from "@lib/payments/checkout"
import { coupleName, depositPayment, type DepositRecord } from "./load"

/**
 * pay              the deposit is due: the summary and the ways to pay
 * transfer-sent    the client says they've sent a transfer; waiting for it
 * confirmed        the deposit has arrived and the date is theirs
 * closed           the quote was declined, replaced or has expired
 */
export type DepositState = "pay" | "transfer-sent" | "confirmed" | "closed"

const OCCASIONS: Record<string, string> = {
  wedding: "wedding day",
  corporate: "event",
  celebration: "celebration",
  other: "event",
}

const listInWords = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0]

const stateOf = (record: DepositRecord): DepositState => {
  const closedQuote = ["declined", "expired", "superseded"].includes(record.status)
  const closedBooking = ["declined", "withdrawn", "cancelled"].includes(
    record.booking.status,
  )
  if (closedQuote || closedBooking) return "closed"

  const confirmed = ["confirmed", "completed"].includes(record.booking.status)
  if (confirmed || depositPayment(record, "received")) return "confirmed"

  if (depositPayment(record, "awaiting")) return "transfer-sent"

  // Past its last day, a quote can't be paid. One whose transfer is on its
  // way (above) stays open, since the money may already have left.
  const validUntil = record.terms?.validUntil
  if (validUntil && validUntil < todayInMalta()) return "closed"

  return "pay"
}

export const toDepositView = (record: DepositRecord) => {
  const { event, pricing, terms, booking } = record
  const date = longDate(event.date)
  const spaces = event.spaces?.length ? event.spaces : []
  const balance = pricing.total - pricing.deposit.amount
  const vatRate = pricing.vat?.rate

  return {
    state: stateOf(record),
    testMode: PAYMENT_PROVIDER === "test" || !record.bank?.areReal,
    couple: coupleName(record),
    firstName: booking.client.firstName,
    reference: record.reference,
    occasion: OCCASIONS[booking.event.type] ?? "event",
    // "the Terrace and the Secret Garden", or the venue when none were named.
    spaces: spaces.length ? listInWords(spaces) : "Bacchus",
    date,
    details: [
      { icon: "calendar", label: "Date", value: date },
      ...(event.startTime && event.endTime
        ? [
            {
              icon: "clock",
              label: "Time",
              value: `${event.startTime} – ${event.endTime}`,
            },
          ]
        : []),
      { icon: "users", label: "Guests", value: String(event.guestCount) },
      {
        icon: "map-pin",
        label: "Venue",
        value: spaces.length ? `${spaces.join(", ")}, Mdina` : "Bacchus, Mdina",
      },
    ],
    lineItems: pricing.lineItems.map((item) => ({
      label: item.label,
      amount: euros(item.amount),
    })),
    subtotal: euros(pricing.subtotal),
    discount: pricing.discount?.amount ? `−${euros(pricing.discount.amount)}` : undefined,
    total: euros(pricing.total),
    perPerson: pricing.perPerson ? `${euros(pricing.perPerson)} per person` : undefined,
    vat:
      vatRate !== undefined && pricing.vat?.amount !== undefined
        ? { label: `Includes VAT (${vatRate}%)`, amount: euros(pricing.vat.amount) }
        : undefined,
    depositTerms: pricing.deposit.percent
      ? `Your deposit is ${pricing.deposit.percent}% of the total.`
      : "Your deposit secures your date.",
    deposit: {
      display: euros(pricing.deposit.amount),
      plain: plainAmount(pricing.deposit.amount),
    },
    balanceNote:
      balance > 0
        ? `The remaining ${euros(balance)} is due ${
            terms?.balanceDueDate
              ? `by ${longDate(terms.balanceDueDate)}`
              : "before your event"
          }.`
        : "",
    validUntil: terms?.validUntil ? longDate(terms.validUntil) : undefined,
    bank: {
      accountName: record.bank?.accountName ?? "",
      iban: record.bank?.iban ?? "",
      // The quote reference, so the transfer can be matched to the booking.
      reference: record.reference,
      areReal: Boolean(record.bank?.areReal),
    },
  }
}

export type DepositView = ReturnType<typeof toDepositView>
