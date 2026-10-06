import { defineField, defineType } from "sanity"

/**
 * A priced extra that can appear on a quote — set-up items, equipment, hire
 * charges.
 *
 * Known figures, all from a single shared client quote and none confirmed as
 * current: round tables €15, chairs €5, bows €3, bistro tables €10, bar pieces
 * €250, sound €500, red carpet €150.
 *
 * Two details from client correspondence that stop these reading as a plain
 * price list, and which `description` exists to carry:
 *   - The round tables are specifically the FAMILY tables, one for the bride's
 *     family and one for the groom's, each seating up to ten. Not general
 *     seating.
 *   - "Bar pieces" are physical bar structures, used in place of a skirted
 *     low-table beverage setup.
 * Without that, a quote line reading "Round tables x 2 — €30" is unreadable to
 * anyone who was not on the call.
 *
 * `isIncludedAtNoCharge` is the more important flag. Bacchus confirmed that
 * all catering-related furniture and utensils, basic decoration, and an
 * in-house wedding coordinator are included in the hire fee at no extra
 * charge. Those belong in this list — a couple needs to see what they are NOT
 * paying for just as much as what they are — but they must never acquire a
 * priced line on a quote. Modelling them as zero-price items would risk
 * exactly that.
 *
 * The things couples typically still source themselves — flowers,
 * entertainment (DJ or band, including stage), a photographer — are
 * deliberately NOT modelled here. They are not Bacchus's to sell, and they
 * belong to the preferred-supplier directory instead.
 */
export default defineType({
  name: "addOn",
  title: "Add-on / set-up item",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Furniture", value: "furniture" },
          { title: "Decoration", value: "decoration" },
          { title: "Technical (sound, lighting)", value: "technical" },
          { title: "Bar", value: "bar" },
          { title: "Service", value: "service" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isIncludedAtNoCharge",
      title: "Included in the hire fee at no extra charge",
      type: "boolean",
      initialValue: false,
      description:
        "Confirmed for catering furniture and utensils, basic decoration, and the in-house coordinator. An item with this on must never produce a priced quote line.",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "price",
      hidden: ({ document }) => Boolean(document?.isIncludedAtNoCharge),
      description: "Per the client quote. Not confirmed as current pricing.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description:
        "What the item actually is, where the name alone would mislead. See the note on this type for the two live cases.",
    }),
    defineField({
      name: "availableForQuote",
      title: "Offer on quotes",
      type: "boolean",
      initialValue: true,
      description:
        "Off for anything recorded for reference but not currently offered. The client cautioned against couples adding much beyond a photobooth.",
    }),
  ],
  orderings: [
    {
      title: "Category, then name",
      name: "categoryName",
      by: [
        { field: "category", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      name: "name",
      category: "category",
      amount: "price.amount",
      unit: "price.unit",
      free: "isIncludedAtNoCharge",
    },
    prepare({ name, category, amount, unit, free }) {
      return {
        title: name,
        subtitle: free
          ? `${category} · included at no charge`
          : `${category} · €${Number(amount ?? 0).toFixed(2)} ${unit ?? ""}`,
      }
    },
  },
})
