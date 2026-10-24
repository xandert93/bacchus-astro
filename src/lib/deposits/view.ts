// What the deposit page shows for a quote: its state, and every figure and
// line already worded for the page. The endpoint (src/pages/api/deposits/
// view.ts) sends this, and the page's script only drops it into place, so
// all the wording lives here, on the server.

import { dayMonthYear, longDate, todayInMalta } from "@lib/dates"
import { euros, eurosCompact, plainAmount } from "@lib/money"
import { paymentsInTestMode, providerFor } from "@lib/payments/checkout"
import { eventFacts, listInWords, presentQuoteLines } from "@lib/quotes/quote-lines"
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
  const spaces = event.spaces?.length ? event.spaces : []
  const balance = pricing.total - pricing.deposit.amount
  const vatRate = pricing.vat?.rate
  const balanceNote =
    balance > 0
      ? `The remaining ${euros(balance)} is due ${
          terms?.balanceDueDate
            ? `by ${longDate(terms.balanceDueDate)}`
            : "before your event"
        }.`
      : ""

  return {
    state: stateOf(record),
    testMode: paymentsInTestMode() || !record.bank?.areReal,
    // How a bank transfer works here: through Stripe, which matches it
    // itself, or by hand, with our bank details and staff marking it.
    transferMode: providerFor("bank-transfer") === "stripe" ? "stripe" : "manual",
    // Stripe's page with a transfer's bank details, once one is on its way.
    transferInstructionsUrl: depositPayment(record, "awaiting")?.instructionsUrl ?? "",
    couple: coupleName(record),
    firstName: booking.client.firstName,
    reference: record.reference,
    occasion: OCCASIONS[booking.event.type] ?? "event",
    // "the Terrace and the Secret Garden", or the venue when none were named.
    spaces: spaces.length ? listInWords(spaces) : "Bacchus",
    date: longDate(event.date),
    // The event and the price as the PDF shows them (src/lib/quotes/
    // quote-lines.ts): the same facts, groups and small print, and whole
    // euros where there are no cents. The deposit itself keeps its cents,
    // since it's what a couple types into their banking app.
    facts: eventFacts(record),
    priceGroups: presentQuoteLines(record).map((group) => ({
      title: group.title,
      subtotal: group.subtotal === undefined ? "" : eurosCompact(group.subtotal),
      lines: group.lines.map((line) => ({
        label: line.label,
        details: line.details ?? "",
        quantity: line.quantity ? String(line.quantity) : "",
        unitPrice: line.unitAmount ? eurosCompact(line.unitAmount) : "",
        // One of something: on a phone, "1 × €4,500" would only repeat the
        // amount, so the sum is left off there.
        single: line.quantity === 1,
        // Bacchus's quotes list some things at no charge, to show they're
        // part of the package (chairs, for instance).
        amount: line.amount === undefined ? "Included" : eurosCompact(line.amount),
      })),
    })),
    notes: record.clientNotes?.trim() ?? "",
    preparedBy: record.preparedBy ?? "",
    // "24th October 2026": the day the quote was sent, as the PDF dates it.
    preparedOn: record.sentAt ? dayMonthYear(record.sentAt) : "",
    // The subtotal only matters beside a discount; without one it's the total.
    subtotal: eurosCompact(pricing.subtotal),
    discount: pricing.discount?.amount
      ? `−${eurosCompact(pricing.discount.amount)}`
      : undefined,
    total: eurosCompact(pricing.total),
    perGuest: pricing.perPerson ? eurosCompact(pricing.perPerson) : undefined,
    vat:
      vatRate !== undefined && pricing.vat?.amount !== undefined
        ? {
            label: `Includes VAT at ${vatRate}%`,
            amount: eurosCompact(pricing.vat.amount),
          }
        : undefined,
    deposit: {
      display: euros(pricing.deposit.amount),
      plain: plainAmount(pricing.deposit.amount),
      // "30% of the total. The remaining €10,226.30 is due by …", in the
      // deposit's box.
      note: [
        pricing.deposit.percent ? `${pricing.deposit.percent}% of the total.` : "",
        balanceNote,
      ]
        .filter(Boolean)
        .join(" "),
    },
    balanceNote,
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
