// What the deposit page shows for a quote: its state, and every figure and
// line already worded for the page. The endpoint (src/pages/api/deposits/
// view.ts) sends this, and the page's script only drops it into place, so
// all the wording lives here, on the server.

import { todayInMalta } from "@lib/dates"
import { longDate } from "@lib/dates"
import { euros, plainAmount } from "@lib/money"
import { paymentsInTestMode, providerFor } from "@lib/payments/checkout"
import { describeIncludedSetUp } from "@studio/lib/includedSetUp"
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

const TIER_WORDS: Record<number, string> = {
  1: "one-tier",
  2: "two-tier",
  3: "three-tier",
}

/** "Includes a three-tier cake: pistachio and olive oil", under the meal line. */
const cakeNote = (cake: { tiers?: number; flavour?: string } | undefined) => {
  if (!cake?.tiers && !cake?.flavour) return ""
  const size = cake.tiers ? `${TIER_WORDS[cake.tiers] ?? `${cake.tiers}-tier`} ` : ""
  return `Includes a ${size}cake${cake.flavour ? `: ${cake.flavour}` : ""}`
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
  const date = longDate(event.date)
  const spaces = event.spaces?.length ? event.spaces : []
  const balance = pricing.total - pricing.deposit.amount
  const vatRate = pricing.vat?.rate

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
    // Each line's sum shown like a receipt ("160 × €64.00"), so a couple
    // can check it; left off a single item, where it would only repeat the
    // amount.
    lineItems: [
      ...pricing.lineItems.map((item) => ({
        label: item.label,
        // Bacchus's quotes list some things at no charge, to show they're part
        // of the package (chairs, for instance).
        amount: item.amount === 0 ? "Included" : euros(item.amount),
        working:
          item.quantity && item.quantity !== 1 && item.unitAmount
            ? `${item.quantity} × ${euros(item.unitAmount)}`
            : "",
        details:
          item.source && item.source === record.menu?.mealFormat
            ? cakeNote(record.menu?.cake)
            : "",
      })),
      // What every booking includes, worked out for this one's guests.
      ...(record.includedSetUp
        ? [
            {
              label: "Chairs and bar pieces",
              amount: "Included",
              working: "",
              details: describeIncludedSetUp(record.includedSetUp),
            },
          ]
        : []),
    ],
    notes: record.clientNotes?.trim() ?? "",
    preparedBy: record.preparedBy ?? "",
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
