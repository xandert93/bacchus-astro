import { defineArrayMember, defineField, defineType } from "sanity"
import { pluralise } from "../../lib/preview"

/**
 * A titled block of menu lines — "Cold Canapés", "Flying Buffet", "Desserts",
 * "Maltese Package". Renders as one `.package-menu-group`.
 *
 * The array accepts both a reference to a `menuDish` and an inline
 * `wineEntry`, so a beverage category and a dining tier can share this one
 * container — which is what the page already does structurally
 * (`.package-menu-groups` on both, three columns for dining, two for beverage
 * because the wine entries carry tasting notes). The column count is a layout
 * consequence of the content type and stays in CSS.
 *
 * The asymmetry between the two is deliberate and measured. Dishes recur
 * heavily across tiers — a third of all menu lines are repeats — so they are
 * referenced, and a spelling correction lands once. Wines do not recur: each
 * appears in exactly one of Beverage's four categories, so normalising them
 * would add a reference-picking step for no saved duplication.
 *
 * Group titles are content, not an enum: the catalogue's groups differ per
 * tier and per package, and six of them on Reception alone are already
 * tier-specific. A fixed list would be wrong by the second tier.
 */
export default defineType({
  name: "menuGroup",
  title: "Menu Group",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Group Title",
      type: "string",
      description: 'The heading above the list, e.g. "Cold Canapés" or "Coffee Station".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        defineArrayMember({ type: "reference", to: [{ type: "menuDish" }] }),
        defineArrayMember({ type: "wineEntry" }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "note",
      title: "Group Note",
      type: "string",
      description:
        'Applies to the whole group, e.g. "Served with crackers, Grissini & freshly baked bread."',
    }),
  ],
  preview: {
    select: { title: "Title", items: "items" },
    prepare: ({ title, items }) => ({
      title,
      subtitle: pluralise(Array.isArray(items) ? items.length : 0, "item"),
    }),
  },
})
