import { defineField, defineType } from "sanity"

/**
 * A named trading period that pricing varies by — peak, shoulder, off-peak,
 * or whatever Bacchus actually calls them.
 *
 * A document rather than a date range repeated on each rate, so a season is
 * defined once and every rate that uses it follows when the dates move. With
 * twelve tiers and several seasons the alternative would be dozens of copies
 * of the same two dates, and a season that got shortened in some of them and
 * not others.
 *
 * WHAT WE ACTUALLY KNOW is thin, and the schema should not pretend otherwise:
 * Bacchus generates pricing from an internal system that varies by month and
 * season, and the single worked example is that April runs slightly higher
 * than March. There is no rate card. So the periods below are a structure
 * waiting for real data, every season carries its own provenance, and until
 * the client supplies the real calendar these should sit as `unconfirmed`.
 *
 * `repeatsAnnually` covers the genuine ambiguity in that one data point. "April
 * is higher than March" might be a standing pattern that recurs every year, or
 * it might be how 2027 happens to be priced. A season can be either: a fixed
 * dated period for one year, or a month-and-day range that recurs. The
 * resolver in `queries/pricing.ts` handles both, and a recurring season is
 * matched on month and day while ignoring the year.
 */
export default defineType({
  name: "season",
  title: "Season",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'What Bacchus calls it — "Peak", "Shoulder", "Christmas period".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 48 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "From",
      type: "date",
      description:
        "For a recurring season only the month and day are used; the year is ignored.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "To (inclusive)",
      type: "date",
      description:
        "May fall before the start date on a recurring season that crosses the new year — a December-to-February period, say.",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const document = context.document as
            { startDate?: string; repeatsAnnually?: boolean } | undefined

          const endsBeforeItStarts = Boolean(
            value && document?.startDate && value < document.startDate,
          )

          if (endsBeforeItStarts && !document?.repeatsAnnually) {
            return "A one-off season cannot end before it starts. Tick 'repeats every year' if this period crosses the new year."
          }

          return true
        }),
    }),
    defineField({
      name: "repeatsAnnually",
      title: "Repeats every year",
      type: "boolean",
      initialValue: false,
      description:
        "On for a standing pattern, off for a period priced for one year only. See the note on this type for why both are supported.",
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      initialValue: 0,
      description:
        "Highest wins where two seasons overlap a date — a Christmas period inside a wider winter season, for instance. Overlaps are legitimate, so the resolver needs a tiebreak rather than an error.",
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "provenance",
      title: "Source & confirmation",
      type: "provenance",
      description:
        "Expect 'unconfirmed' until Bacchus supplies their real season calendar. Nothing here came from a rate card.",
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Start date",
      name: "startAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
    {
      title: "Priority",
      name: "priorityDesc",
      by: [{ field: "priority", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      name: "name",
      startDate: "startDate",
      endDate: "endDate",
      repeats: "repeatsAnnually",
      status: "provenance.status",
    },
    prepare: ({ name, startDate, endDate, repeats, status }) => {
      const format = (value?: string) =>
        value
          ? new Date(value).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              ...(repeats ? {} : { year: "numeric" }),
            })
          : "?"

      return {
        title: name,
        subtitle: [
          `${format(startDate)} – ${format(endDate)}`,
          repeats ? "every year" : null,
          status === "confirmed" ? null : status,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
