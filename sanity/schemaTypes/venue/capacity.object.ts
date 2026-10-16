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
      title: "Minimum Guests",
      type: "number",
      description: "Usually empty: there is no minimum guest count or minimum spend.",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "max",
      title: "Maximum Guests",
      type: "number",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "basis",
      title: "Seating Basis",
      type: "string",
      options: {
        list: [
          { title: "Seated", value: "seated" },
          { title: "Standing", value: "standing" },
          { title: "Seated or Standing", value: "either" },
        ],
        layout: "radio",
      },
      description: "Required. A guest number means little without it.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "layoutNote",
      title: "Layout Note",
      type: "string",
      description:
        'How the number changes with the layout, e.g. "adjusted per guest count to stay comfortable at any size".',
    }),
  ],
  preview: {
    select: { min: "min", max: "max", basis: "basis" },
    prepare: ({ min, max, basis }) => {
      const range = min ? `${min}–${max}` : `Up to ${max}`

      return { title: `${range} ${basis === "either" ? "guests" : basis}` }
    },
  },
})
