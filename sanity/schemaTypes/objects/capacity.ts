import { defineField, defineType } from "sanity"

/**
 * A capacity figure, with its seating basis stated.
 *
 * The site's capacity numbers are the project's longest-running unresolved
 * content item. "Up to 120 seated" and friends are placeholders carrying an
 * inline disclaimer; client correspondence has since given a real range of
 * 50–800 guests — but STANDING, which is not a like-for-like replacement for
 * a seated claim, and the project's standing decision is to keep the
 * disclaimer until Bacchus says which figures to publish.
 *
 * Hence `basis` is required and has no default. A capacity with no stated
 * basis is exactly the ambiguity that made the existing numbers unusable, and
 * a figure entered here without one would read as authoritative on the page.
 *
 * `min` is optional because a single space has a ceiling, while the estate as
 * a whole has a range (the layout is adjusted per guest count).
 */
export default defineType({
  name: "capacity",
  title: "Capacity",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({
      name: "min",
      title: "Minimum guests",
      type: "number",
      description:
        "Only where a real floor exists. Bacchus confirmed no minimum guest count and no minimum spend, so this is usually empty.",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "max",
      title: "Maximum guests",
      type: "number",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "basis",
      title: "Seating basis",
      type: "string",
      options: {
        list: [
          { title: "Seated", value: "seated" },
          { title: "Standing", value: "standing" },
          { title: "Seated or standing", value: "either" },
        ],
        layout: "radio",
      },
      description: "Required. A figure without this is not publishable.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "layoutNote",
      title: "Layout note",
      type: "string",
      description:
        'How the figure moves with the layout — e.g. "adjusted per guest count to stay comfortable at any size".',
    }),
    defineField({
      name: "provenance",
      title: "Source & confirmation",
      type: "provenance",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { min: "min", max: "max", basis: "basis", status: "provenance.status" },
    prepare({ min, max, basis, status }) {
      const range = min ? `${min}–${max}` : `up to ${max}`
      return {
        title: `${range} ${basis === "either" ? "guests" : basis}`,
        subtitle: status === "confirmed" ? undefined : `${status} — keeps the disclaimer`,
      }
    },
  },
})
