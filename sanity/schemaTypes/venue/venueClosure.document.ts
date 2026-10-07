import { defineArrayMember, defineField, defineType } from "sanity"

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
export default defineType({
  name: "venueClosure",
  title: "Closure / blackout",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'Internal label — e.g. "Hall repairs, insurance claim".',
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
      title: "To (inclusive)",
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
      options: {
        list: [
          { title: "Maintenance or repairs", value: "maintenance" },
          { title: "Staff holiday / closed period", value: "closed" },
          { title: "Held for a provisional booking", value: "held" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "spaces",
      title: "Spaces affected",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
      description:
        "Leave empty for the whole estate. A closure affecting only one space should not black out a date a wedding could still use.",
    }),
    defineField({
      name: "blocksWeddings",
      title: "Blocks wedding dates",
      type: "boolean",
      initialValue: true,
      description:
        "Off for a closure that affects the restaurant only — the public wedding calendar should not react to it.",
    }),
    defineField({
      name: "showPublicly",
      title: "Give a reason publicly",
      type: "boolean",
      initialValue: false,
      description:
        "Off by default. The date is simply not offered, with no explanation — staff holidays and maintenance are not visitor-facing.",
    }),
    defineField({
      name: "publicNote",
      title: "Public note",
      type: "string",
      hidden: ({ parent }) => !parent?.showPublicly,
    }),
  ],
  orderings: [
    {
      title: "Starts soonest",
      name: "startAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", start: "startDate", end: "endDate", reason: "reason" },
    prepare: ({ title, start, end, reason }) => {
      const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB") : "?")
      return {
        title,
        subtitle: `${fmt(start)}${end && end !== start ? ` – ${fmt(end)}` : ""} · ${reason ?? ""}`,
      }
    },
  },
})
