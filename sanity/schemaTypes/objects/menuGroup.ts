import { defineArrayMember, defineField, defineType } from "sanity"

/**
 * A titled block of menu lines — "Cold Canapés", "Flying Buffet", "Desserts",
 * "Maltese Package". Renders as one `.package-menu-group`.
 *
 * The array accepts both `menuItem` and `wineEntry` so a beverage category and
 * a dining tier can share this one container, which is what the page already
 * does structurally (`.package-menu-groups` on both, three columns for dining,
 * two for beverage because the wine entries carry tasting notes). The column
 * count is a layout consequence of the content type and stays in CSS.
 *
 * Group titles are content, not an enum: the catalogue's groups differ per
 * tier and per package, and six of them on Reception alone are already
 * tier-specific. A fixed list would be wrong by the second tier.
 */
export default defineType({
  name: "menuGroup",
  title: "Menu group",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Group title",
      type: "string",
      description: 'As it heads the column — e.g. "Cold Canapés", "Coffee Station".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        defineArrayMember({ type: "menuItem" }),
        defineArrayMember({ type: "wineEntry" }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "note",
      title: "Group note",
      type: "string",
      description:
        'Applies to the whole group — e.g. "Served with crackers, Grissini & freshly baked bread."',
    }),
    defineField({
      name: "catalogueVariance",
      title: "Group title differs from the catalogue",
      type: "catalogueVariance",
    }),
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare({ title, items }) {
      const count = Array.isArray(items) ? items.length : 0
      return { title, subtitle: `${count} item${count === 1 ? "" : "s"}` }
    },
  },
})
