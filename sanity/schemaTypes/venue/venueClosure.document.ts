import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { formatDate, joinParts, optionTitle } from "../../lib/preview"

/**
 * A date or range the venue cannot take a wedding, for a reason that is not a
 * booking.
 *
 * Without this, the calendar assumes every unavailable date is unavailable
 * because someone booked it. That is not true in general, and there is a
 * counterexample already on record: the vandalism damage to the main hall is
 * under insurance claim with repairs expected in 2027. If a space is out of
 * action for a fortnight, the only way to say so would be a fake booking —
 * which corrupts the records that quotes, testimonials and reporting all
 * read, and recreates exactly the hand-maintained parallel calendar the
 * single-source-of-truth rule exists to prevent.
 *
 * A closure outranks everything, a confirmed booking included. If the venue
 * is shut, that booking is a problem for staff to resolve rather than a
 * reason to show the date as free.
 *
 * The one trap to know about: an empty closure list is indistinguishable from
 * "nothing is closed". If staff never use this, a date closed in real life
 * still shows as Available, and nothing in the system can tell.
 *
 * `showPublicly` is the compromise for the awkward middle case: staff holidays
 * and maintenance are nobody's business, but a date genuinely unavailable
 * should not read as Available either. Off means the date is simply not
 * offered, with no reason given.
 */
const CLOSURE_REASONS = [
  { title: "Maintenance or Repairs", value: "maintenance" },
  { title: "Staff Holiday / Closed Period", value: "closed" },
  { title: "Held for a Provisional Booking", value: "held" },
  { title: "Other", value: "other" },
] as const

export default defineType({
  name: "venueClosure",
  title: "Closure / Blackout",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'For staff only, e.g. "Hall repairs, insurance claim".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "From",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "To (Inclusive)",
      type: "date",
      description: "Same as the start date for a single day.",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const doc = context.document as { startDate?: string } | undefined
          if (value && doc?.startDate && value < doc.startDate) {
            return "The end date cannot be before the start date."
          }
          return true
        }),
    }),
    defineField({
      name: "reason",
      title: "Reason",
      type: "string",
      options: { list: [...CLOSURE_REASONS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "spaces",
      title: "Spaces Affected",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
      description: help(
        "Leave empty if the whole venue is closed.",
        "If only some spaces are affected, choose them, so the date stays open for events that can use the others.",
      ),
    }),
    defineField({
      name: "blocksWeddings",
      title: "Blocks Wedding Dates",
      type: "boolean",
      initialValue: true,
      description:
        "Untick if this only affects the restaurant, so the wedding calendar isn't affected.",
    }),
    defineField({
      name: "showPublicly",
      title: "Give a Reason Publicly",
      type: "boolean",
      initialValue: false,
      description: help(
        "Usually left unticked: the date simply isn't offered, with no explanation.",
        "Tick to show visitors a note about why.",
      ),
    }),
    defineField({
      name: "publicNote",
      title: "Public Note",
      type: "string",
      hidden: ({ parent }) => !parent?.showPublicly,
    }),
  ],
  orderings: [
    {
      title: "Starts Soonest",
      name: "startAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "Title", start: "startDate", end: "endDate", reason: "reason" },
    prepare: ({ title, start, end, reason }) => ({
      title,
      subtitle: joinParts(
        end && end !== start
          ? `${formatDate(start) ?? "?"} – ${formatDate(end)}`
          : formatDate(start),
        optionTitle(CLOSURE_REASONS, reason),
      ),
    }),
  },
})
