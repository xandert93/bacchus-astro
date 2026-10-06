import { defineField, defineType } from "sanity"

/**
 * One wine on the beverage list.
 *
 * A distinct type from `menuItem` rather than a set of optional fields on it,
 * because the beverage page renders a genuinely different three-line shape —
 * `.package-wine-name` / `.package-wine-meta` / `.package-wine-note` — and
 * because its presence in an array is what tells the template which shape to
 * render. Optional fields on a shared type would make that a guess.
 *
 * `meta` is stored as its two real parts rather than the single pre-joined
 * string the page shows ("Chardonnay, Girgentina · Marsovin, Malta"). The
 * middle dot is a rendering decision, and a producer worth filtering or
 * grouping by later should not have to be parsed back out of a display string.
 *
 * Names here are the project's accent-restoration rule at its most load-
 * bearing: an automated text pull of the catalogue silently drops every
 * accented character and, in places, whole words — "Gavi Di Gavi" vanished
 * from a wine name entirely. These lists were read from the RENDERED
 * catalogue pages for that reason, and must never be rebuilt from a text
 * extraction.
 */
export default defineType({
  name: "wineEntry",
  title: "Wine",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description:
        'Including any appellation as printed — e.g. "Gavi Di Gavi ‘La Giustiniana’ D.O.C.G".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "grapes",
      title: "Grape varieties",
      type: "string",
      description:
        'Comma-separated, as the catalogue lists them — e.g. "Chardonnay, Girgentina".',
    }),
    defineField({
      name: "producer",
      title: "Producer & origin",
      type: "string",
      description: 'e.g. "Marsovin, Malta".',
    }),
    defineField({
      name: "tastingNote",
      title: "Tasting note",
      type: "text",
      rows: 3,
      description: "The catalogue's own note. British English; accents restored.",
    }),
    defineField({
      name: "style",
      title: "Style",
      type: "string",
      options: {
        list: [
          { title: "White", value: "white" },
          { title: "Red", value: "red" },
          { title: "Rosé", value: "rose" },
          { title: "Sparkling", value: "sparkling" },
          { title: "Dessert / fortified", value: "dessert" },
        ],
      },
      description:
        "Not rendered today. Here so the list can be grouped or filtered later without a re-key.",
    }),
    defineField({
      name: "catalogueVariance",
      title: "Differs from the catalogue",
      type: "catalogueVariance",
    }),
  ],
  preview: {
    select: { name: "name", grapes: "grapes", producer: "producer" },
    prepare({ name, grapes, producer }) {
      return {
        title: name,
        subtitle: [grapes, producer].filter(Boolean).join(" · "),
      }
    },
  },
})
