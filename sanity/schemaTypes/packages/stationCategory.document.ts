import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"

/**
 * A grouping of reception stations — the six tabs on the stations section.
 *
 * Two label fields, because the tab bar genuinely needs two strings. The full
 * label heads each card and serves as the tab's accessible name ("Boards &
 * Cured", "Fruits of the Sea", "Grill & Roast", "Across Asia",
 * "Pasta & Pizza"); the short label is what the tab itself displays
 * ("Boards", "Sea"). That is not a styling trick — it is how six tabs fit a
 * mobile width without the hidden-scrollbar overflow that silently clipped a
 * tab label elsewhere on the site, and a CSS truncation of the full label
 * would produce "Fruits of the…" rather than "Sea".
 *
 * A document rather than a string enum on `station`, because the categories
 * are ordered, carry two labels each, and — the part that actually forces it —
 * the six labels are an editorial change still awaiting Bacchus's sign-off.
 * They have an on-page oxblood disclaimer today, so they need somewhere to
 * carry their own provenance.
 */
export default defineType({
  name: "stationCategory",
  title: "Station category",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Full label",
      type: "string",
      description: "The heading on each card, and the tab's name for screen readers.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "shortLabel",
      title: "Tab label",
      type: "string",
      description:
        "What the tab shows. Keep it to one short word: six tabs share a phone's width.",
      validation: (Rule) => Rule.required().max(12),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "shortLabel", maxLength: 24 },
      description: help(
        "Used in links to this category. Don't change it once set, or existing links break.",
        'e.g. "afield" for Across Asia is an old name, but changing it would break links.',
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "labelProvenance",
      title: "Label: source & confirmation",
      type: "provenance",
      description:
        "We grouped the stations into these six categories. Bacchus hasn't approved them yet.",
    }),
  ],
  orderings: [
    { title: "Tab order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { label: "label", short: "shortLabel", order: "order" },
    prepare: ({ label, short, order }) => ({
      title: label,
      subtitle: `Tab ${order ?? "?"}: "${short ?? ""}"`,
    }),
  },
})
