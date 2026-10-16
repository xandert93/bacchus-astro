import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle"
import { ClockIcon } from "@sanity/icons/Clock"
import { EditIcon } from "@sanity/icons/Edit"
import { EnvelopeIcon } from "@sanity/icons/Envelope"
import { RestoreIcon } from "@sanity/icons/Restore"
import type { ComponentType } from "react"
import {
  defineArrayMember,
  defineField,
  defineType,
  type ConditionalPropertyCallback,
} from "sanity"
import { QuotePricingInput } from "../../components/QuotePricingInput"
import { DEFAULT_DEPOSIT_PERCENT, DEFAULT_VAT_RATE } from "../../lib/constants"
import { help } from "../../lib/help"
import { formatDate, formatEuros, joinParts, pluralise } from "../../lib/preview"
import { isTimeOfDay, minutesSinceMidnight, timeField } from "../../lib/timeField"

/**
 * A priced quote — the thing a PDF is rendered from, and the thing the deposit
 * page displays.
 *
 * Related fields are grouped into objects (`event`, `menu`, `pricing`,
 * `terms`) so the deposit page and the PDF template read one shape, e.g.
 * `quote.pricing.total`.
 *
 * The figures are worked out, then frozen. While a quote is a draft, the
 * Pricing section sums its own lines (`components/QuotePricingInput.tsx`,
 * maths in `lib/quoteTotals.ts`). Once it is sent, every section but the
 * status locks, and the stored figures are what the client received. Nothing
 * recomputes them afterwards, because Bacchus's prices vary by season and a
 * quote that re-priced itself would drift from the document in the couple's
 * inbox — the one they are looking at while deciding to transfer several
 * thousand euros. To change a sent quote, make a new one and mark the old one
 * superseded.
 *
 * The VAT rate and deposit percentage are copied in from Settings when the
 * quote is created, for the same reason: changing a rate later must not
 * rewrite quotes already sent.
 *
 * `addressedTo` is snapshotted too: left empty, the generator composes it
 * from the booking ("Bertha & Alex" where a partner name was given, the
 * enquirer alone where not) and writes it here on send, so a later edit to
 * the booking cannot rewrite a document the client has.
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

/** "BAC-20261016-7KQ2": the day it was created, then four random characters. */
const newQuoteReference = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()

  return `BAC-${today}-${suffix}`
}

/** Everything but the status locks once the quote has left the building. */
const isLocked: ConditionalPropertyCallback = ({ document }) =>
  document?.status !== undefined && document.status !== "draft"

export default defineType({
  name: "quote",
  title: "Quote",
  type: "document",
  groups: [
    { name: "summary", title: "Summary", default: true },
    { name: "pricing", title: "Pricing" },
    { name: "terms", title: "Terms" },
  ],

  initialValue: async (_parameters, { getClient }) => {
    const defaults = await getClient({ apiVersion: "2024-10-01" }).fetch<{
      vatRate?: number
      depositPercent?: number
    }>(
      `{
        "vatRate": *[_id == "weddingPolicy"][0].vatRate,
        "depositPercent": *[_id == "weddingPolicy"][0].depositPercent
      }`,
    )

    return {
      reference: newQuoteReference(),
      status: "draft",
      pricing: {
        vat: { rate: defaults.vatRate ?? DEFAULT_VAT_RATE },
        deposit: { percent: defaults.depositPercent ?? DEFAULT_DEPOSIT_PERCENT },
      },
    }
  },

  fields: [
    // --- Summary ------------------------------------------------------------
    defineField({
      name: "reference",
      title: "Quote reference",
      type: "string",
      group: "summary",
      readOnly: true,
      description:
        "Created automatically. The client sees it on the quote and the deposit page.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "summary",
      options: { list: [...QUOTE_STATUSES], layout: "radio" },
      description: help(
        "Once a quote is sent, everything else on it locks, so it always matches what the client received.",
        "To change a sent quote, create a new one and mark this one superseded.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "booking",
      title: "Booking",
      type: "reference",
      group: "summary",
      to: [{ type: "booking" }],
      readOnly: isLocked,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "addressedTo",
      title: "Addressed to",
      type: "string",
      group: "summary",
      readOnly: isLocked,
      description: help(
        'How the quote is addressed, e.g. "Rachel & Paul".',
        "Leave empty to use the names from the booking.",
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

    defineField({
      name: "event",
      title: "The event",
      type: "object",
      group: "summary",
      readOnly: isLocked,
      options: { collapsible: false },
      fields: [
        defineField({
          name: "date",
          title: "Event date",
          type: "date",
          validation: (Rule) => Rule.required(),
        }),
        timeField({
          name: "startTime",
          title: "Start time",
        }),
        timeField({
          name: "endTime",
          title: "End time",
          description: help(
            "A standard package runs about five hours. Some extend to six or eight.",
            "Bacchus advises against going beyond eight.",
          ),

          // An end time earlier than the start is fine: the event runs past
          // midnight. So this only warns, and only about the length.
          extraValidation: (Rule) =>
            Rule.custom(async (endTime, context) => {
              const startTime = (context.parent as { startTime?: string } | undefined)
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
          description: "Used to work out the per-person price.",
          validation: (Rule) => Rule.required().min(1).integer(),
        }),
        defineField({
          name: "spaces",
          title: "Spaces",
          type: "array",
          of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
        }),
      ],
    }),

    defineField({
      name: "menu",
      title: "Menu",
      type: "object",
      group: "summary",
      readOnly: isLocked,
      options: { collapsible: false },
      fields: [
        defineField({
          name: "mealFormat",
          title: "Meal format & tier",
          type: "reference",
          to: [{ type: "packageTier" }],
          description: help(
            "Choose one: Reception, Banquet or High Tea.",
            "They are alternatives, not courses, so they can't be combined.",
          ),
        }),
        defineField({
          name: "beverages",
          title: "Beverage",
          type: "array",
          of: [defineArrayMember({ type: "reference", to: [{ type: "packageTier" }] })],
          description: help(
            "Chosen on top of the meal format, never instead of it.",
            "Add as many as the client wants: the beverage options combine freely.",
          ),
        }),
      ],
    }),

    // --- Pricing ------------------------------------------------------------
    defineField({
      name: "pricing",
      title: "Pricing",
      type: "object",
      group: "pricing",
      readOnly: isLocked,
      options: { collapsible: false },
      components: { input: QuotePricingInput },
      description:
        "Totals, VAT and the deposit are worked out automatically from the lines.",
      fields: [
        defineField({
          name: "lineItems",
          title: "Line items",
          type: "array",
          of: [defineArrayMember({ type: "quoteLineItem" })],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: "subtotal",
          title: "Subtotal (EUR)",
          type: "number",
          readOnly: true,
          description: "All the lines added up.",
        }),
        defineField({
          name: "discount",
          title: "Discount",
          type: "object",
          options: { collapsible: false, columns: 2 },
          fields: [
            defineField({
              name: "amount",
              title: "Amount (EUR)",
              type: "number",
              description: "A positive number. The quote shows it as a minus.",
              validation: (Rule) => Rule.min(0).precision(2),
            }),
            defineField({
              name: "reason",
              title: "Reason",
              type: "string",
              hidden: ({ parent }) => !parent?.amount,
            }),
          ],
        }),
        defineField({
          name: "total",
          title: "Total (EUR)",
          type: "number",
          readOnly: true,
          description: "Subtotal minus any discount. Includes VAT.",
        }),
        defineField({
          name: "vat",
          title: "VAT included in the total",
          type: "object",
          options: { collapsible: false, columns: 2 },
          fields: [
            defineField({
              name: "rate",
              title: "Rate (%)",
              type: "number",
              readOnly: true,
              description: "Copied from the wedding policy when the quote was created.",
            }),
            defineField({
              name: "amount",
              title: "Amount (EUR)",
              type: "number",
              readOnly: true,
            }),
          ],
        }),
        defineField({
          name: "perPerson",
          title: "Per person (EUR)",
          type: "number",
          readOnly: true,
          description: "The total divided by the guests quoted.",
        }),
        defineField({
          name: "deposit",
          title: "Deposit",
          type: "object",
          options: { collapsible: false, columns: 2 },
          fields: [
            defineField({
              name: "percent",
              title: "Percentage",
              type: "number",
              description:
                "Copied from the wedding policy when the quote was created. Change it here for this quote only.",
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: "amount",
              title: "Amount due (EUR)",
              type: "number",
              readOnly: true,
            }),
          ],
        }),
      ],
    }),

    // --- Terms --------------------------------------------------------------
    defineField({
      name: "terms",
      title: "Terms",
      type: "object",
      group: "terms",
      readOnly: isLocked,
      options: { collapsible: false },
      fields: [
        defineField({
          name: "balanceDueDate",
          title: "Balance due",
          type: "date",
        }),
        defineField({
          name: "validUntil",
          title: "Quote valid until",
          type: "date",
          description: help(
            "Prices change by season, so every quote should have an end date.",
            "Without one, the client could hold Bacchus to these prices indefinitely.",
          ),
        }),
      ],
    }),
    defineField({
      name: "pdf",
      title: "Generated PDF",
      type: "file",
      group: "terms",
      readOnly: isLocked,
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
      by: [{ field: "event.date", direction: "asc" }],
    },
    {
      title: "Highest value",
      name: "totalDesc",
      by: [{ field: "pricing.total", direction: "desc" }],
    },
  ],

  // No status in the subtitle, as on bookings: the icon shows it.
  preview: {
    select: {
      reference: "reference",
      addressedTo: "addressedTo",
      firstName: "booking.client.firstName",
      lastName: "booking.client.lastName",
      partnerName: "booking.client.partnerName",
      total: "pricing.total",
      status: "status",
      date: "event.date",
      guests: "event.guestCount",
    },
    prepare: ({
      reference,
      addressedTo,
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
        title: addressedTo || bookingName.trim() || "Unnamed quote",
        subtitle: joinParts(
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
