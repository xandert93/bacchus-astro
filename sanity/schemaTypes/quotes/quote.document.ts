import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle"
import { ClockIcon } from "@sanity/icons/Clock"
import { EditIcon } from "@sanity/icons/Edit"
import { EnvelopeIcon } from "@sanity/icons/Envelope"
import { RestoreIcon } from "@sanity/icons/Restore"
import type { ComponentType } from "react"
import { defineArrayMember, defineField, defineType } from "sanity"
import { DEFAULT_VAT_RATE } from "../../lib/constants"
import { help } from "../../lib/help"
import {
  formatDate,
  formatEuros,
  joinParts,
  optionTitle,
  pluralise,
} from "../../lib/preview"
import { isTimeOfDay, minutesSinceMidnight, timeField } from "../../lib/timeField"

/**
 * A priced quote — the thing a PDF is rendered from, and the thing the deposit
 * page displays.
 *
 * Field set mirrors `sandboxes/secure-booking.html` exactly, because that page
 * is already the agreed front end for this document: quote reference, couple's
 * name, date, time window, guest count, venue, categorised line items,
 * subtotal, discount, VAT, total, per-person figure, deposit percentage and
 * deposit amount.
 *
 * Everything financial is stored, not derived. The reasoning is on
 * `quoteLineItem` and matters enough to repeat: the one real client quote we
 * have does not reconcile between its excl.-VAT subtotal, its stated VAT and
 * its incl.-VAT total, and Bacchus's pricing is generated internally and
 * varies by season. A quote that recomputes itself would therefore drift away
 * from the document the couple actually received — and this is the document
 * someone is looking at while deciding to transfer several thousand euros.
 *
 * So: `subtotal`, `discountAmount`, `vatAmount`, `total` and `depositAmount`
 * are all stored as sent. `perPersonAmount` too, which is the one that looks
 * most obviously derivable. The generator computes them once, in integer
 * cents, and writes them here; nothing recomputes them afterwards.
 *
 * `clientDisplayName` is snapshotted for the same reason: left empty, the
 * generator composes it from the booking ("Bertha & Alex" where a partner
 * name was given, the enquirer alone where not) and writes it here on send,
 * so a later edit to the booking cannot rewrite a document the client has.
 *
 * PDF generation is deterministic templating — HTML/CSS through
 * Puppeteer/Playwright. Never an LLM. A pricing document is the last place
 * generated prose belongs.
 */

export const QUOTE_STATUSES = [
  { title: "Draft", value: "draft" },
  { title: "Sent", value: "sent" },
  { title: "Accepted", value: "accepted" },
  { title: "Expired", value: "expired" },
  { title: "Superseded by a newer quote", value: "superseded" },
] as const

const STATUS_ICONS: Record<string, ComponentType> = {
  draft: EditIcon,
  sent: EnvelopeIcon,
  accepted: CheckmarkCircleIcon,
  expired: ClockIcon,
  superseded: RestoreIcon,
}

/**
 * Bacchus advises against events running longer than this. The figure staff
 * edit lives on the wedding policy; this is only used if that is empty.
 */
const FALLBACK_LONGEST_ADVISED_HOURS = 8

export default defineType({
  name: "quote",
  title: "Quote",
  type: "document",
  groups: [
    { name: "summary", title: "Summary", default: true },
    { name: "pricing", title: "Pricing" },
    { name: "terms", title: "Terms" },
  ],
  fields: [
    defineField({
      name: "reference",
      title: "Quote reference",
      type: "string",
      group: "summary",
      description: help(
        "Shown to the client on the quote and the deposit page.",
        "Filled in automatically. Don't change it once the quote has been sent.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "summary",
      options: { list: [...QUOTE_STATUSES], layout: "radio" },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "booking",
      title: "Booking",
      type: "reference",
      group: "summary",
      to: [{ type: "booking" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "clientDisplayName",
      title: "Addressed to",
      type: "string",
      group: "summary",
      description: help(
        'How the quote is addressed, e.g. "Rachel & Paul".',
        "Leave empty to use the names from the booking.",
        "Fills in automatically when the quote is sent, so it always matches what the client received.",
      ),
    }),
    defineField({
      name: "internalNotes",
      title: "Internal notes",
      type: "text",
      group: "summary",
      rows: 6,
      description: "For staff only. Never shown to the client.",
    }),

    // --- The event, as quoted ----------------------------------------------
    defineField({
      name: "eventDate",
      title: "Event date",
      type: "date",
      group: "summary",
      validation: (Rule) => Rule.required(),
    }),
    timeField({
      name: "startTime",
      title: "Start time",
      group: "summary",
    }),
    timeField({
      name: "endTime",
      title: "End time",
      group: "summary",
      description: help(
        "A standard package runs about five hours. Some extend to six or eight.",
        "Bacchus advises against going beyond eight.",
      ),

      // An end time earlier than the start is fine: the event runs past
      // midnight. So this only warns, and only about the length.
      extraValidation: (Rule) =>
        Rule.custom(async (endTime, context) => {
          const startTime = (context.document as { startTime?: string } | undefined)
            ?.startTime
          if (!isTimeOfDay(startTime) || !isTimeOfDay(endTime)) return true

          const minutesInDay = 24 * 60
          const lengthInMinutes =
            (minutesSinceMidnight(endTime) -
              minutesSinceMidnight(startTime) +
              minutesInDay) %
            minutesInDay

          const longestAdvisedHours =
            (await context
              .getClient({ apiVersion: "2024-10-01" })
              .fetch<number | null>(
                `*[_id == "weddingPolicy"][0].maxAdvisedDurationHours`,
              )) ?? FALLBACK_LONGEST_ADVISED_HOURS

          return lengthInMinutes > longestAdvisedHours * 60
            ? `This runs over ${longestAdvisedHours} hours, which Bacchus advises against.`
            : true
        }).warning(),
    }),
    defineField({
      name: "guestCount",
      title: "Guests quoted",
      type: "number",
      group: "summary",
      description: "The number of guests the per-person prices were worked out for.",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "spaces",
      title: "Spaces",
      type: "array",
      group: "summary",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
    }),
    defineField({
      name: "mealFormatTier",
      title: "Meal format & tier",
      type: "reference",
      group: "summary",
      to: [{ type: "packageTier" }],
      description: help(
        "Choose one: Reception, Banquet or High Tea.",
        "They are alternatives, not courses, so they can't be combined.",
      ),
    }),
    defineField({
      name: "beverageSelections",
      title: "Beverage",
      type: "array",
      group: "summary",
      of: [defineArrayMember({ type: "reference", to: [{ type: "packageTier" }] })],
      description: help(
        "Chosen on top of the meal format, never instead of it.",
        "Add as many as the client wants: the beverage options combine freely.",
      ),
    }),

    // --- Pricing ------------------------------------------------------------
    defineField({
      name: "lineItems",
      title: "Line items",
      type: "array",
      group: "pricing",
      of: [defineArrayMember({ type: "quoteLineItem" })],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "subtotal",
      title: "Subtotal (EUR)",
      type: "number",
      group: "pricing",
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: "discountAmount",
      title: "Discount (EUR)",
      type: "number",
      group: "pricing",
      description: "Enter it as a positive number. The quote shows it as a minus.",
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: "discountReason",
      title: "Discount reason",
      type: "string",
      group: "pricing",
      hidden: ({ document }) => !document?.discountAmount,
    }),
    defineField({
      name: "vatRate",
      title: "VAT rate (%)",
      type: "number",
      group: "pricing",
      initialValue: DEFAULT_VAT_RATE,
      description: "Malta's standard rate. Quoted prices include VAT.",
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: "vatAmount",
      title: "VAT amount (EUR)",
      type: "number",
      group: "pricing",
      description: help(
        "Exactly as it appears on the quote.",
        "It isn't worked out from the rate above, so check it matches.",
      ),
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: "total",
      title: "Total (EUR)",
      type: "number",
      group: "pricing",
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: "perPersonAmount",
      title: "Per person (EUR)",
      type: "number",
      group: "pricing",
      description: help(
        "Shown under the total.",
        "Enter it exactly as on the quote. It isn't worked out automatically.",
      ),
      validation: (Rule) => Rule.precision(2),
    }),

    // --- Terms --------------------------------------------------------------
    defineField({
      name: "depositPercent",
      title: "Deposit (%)",
      type: "number",
      group: "terms",
      description: help(
        "Not yet confirmed by Bacchus.",
        "The catalogue says 30%, non-refundable, with the balance due 14 days before the event. More recent emails describe the terms as flexible, so it is set per quote until that is settled.",
      ),
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "depositAmount",
      title: "Deposit due (EUR)",
      type: "number",
      group: "terms",
      validation: (Rule) => Rule.precision(2),
    }),
    defineField({
      name: "balanceDueDate",
      title: "Balance due",
      type: "date",
      group: "terms",
    }),
    defineField({
      name: "validUntil",
      title: "Quote valid until",
      type: "date",
      group: "terms",
      description: help(
        "Prices change by season, so every quote should have an end date.",
        "Without one, the client could hold Bacchus to these prices indefinitely.",
      ),
    }),
    defineField({
      name: "termsProvenance",
      title: "Terms: source & confirmation",
      type: "provenance",
      group: "terms",
      description:
        'Expect "contested" until Bacchus settles the deposit and cancellation terms.',
    }),
    defineField({
      name: "pdf",
      title: "Generated PDF",
      type: "file",
      group: "terms",
      options: { accept: "application/pdf" },
      description: help(
        "The quote exactly as the client received it.",
        "Keep this copy: it can't be recreated later.",
      ),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Event date",
      name: "eventDateAsc",
      by: [{ field: "eventDate", direction: "asc" }],
    },
    {
      title: "Highest value",
      name: "totalDesc",
      by: [{ field: "total", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      reference: "reference",
      name: "clientDisplayName",
      firstName: "booking.firstName",
      lastName: "booking.lastName",
      partnerName: "booking.partnerName",
      total: "total",
      status: "status",
      date: "eventDate",
      guests: "guestCount",
    },
    prepare: ({
      reference,
      name,
      firstName,
      lastName,
      partnerName,
      total,
      status,
      date,
      guests,
    }) => {
      const bookingName = partnerName
        ? `${firstName ?? ""} & ${partnerName}`
        : `${firstName ?? ""} ${lastName ?? ""}`

      return {
        title: name || bookingName.trim() || "Unnamed quote",
        subtitle: joinParts(
          optionTitle(QUOTE_STATUSES, status),
          formatDate(date),
          formatEuros(total),
          pluralise(guests, "guest"),
          reference,
        ),
        media: STATUS_ICONS[status] ?? EditIcon,
      }
    },
  },
})
