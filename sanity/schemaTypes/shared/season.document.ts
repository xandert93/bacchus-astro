import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { joinParts } from "../../lib/preview"

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
      description:
        'What Bacchus calls it, e.g. "Peak", "Shoulder" or "Christmas period".',
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
      description: "For a season that repeats every year, only the day and month matter.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "To (inclusive)",
      type: "date",
      description: help(
        "The last day of the season.",
        "It can be before the start date for a yearly season that crosses New Year, such as December to February.",
      ),
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
        "Tick for a season that comes round every year. Leave unticked for a one-off.",
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      initialValue: 0,
      description: help(
        "Where two seasons overlap, the higher number wins.",
        "For example, give a Christmas period a higher number than the winter season around it.",
      ),
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "provenance",
      title: "Source & confirmation",
      type: "provenance",
      description: 'Expect "unconfirmed" until Bacchus sends their real season dates.',
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
        subtitle: joinParts(
          `${format(startDate)} – ${format(endDate)}`,
          repeats ? "Every year" : "One-off",
          status === "confirmed" ? undefined : "Unconfirmed",
        ),
      }
    },
  },
})
