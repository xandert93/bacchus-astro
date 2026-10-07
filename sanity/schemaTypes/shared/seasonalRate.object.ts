import { defineField, defineType } from "sanity"

/**
 * What a tier costs during one season.
 *
 * Deliberately just a season reference plus a price. All the period logic
 * lives on the `season` document, so moving a season's dates moves every rate
 * that uses it, and a rate can never disagree with another rate about when
 * the season runs.
 *
 * How this resolves at render and quote time, which is the part worth knowing
 * before adding one: a tier's own `price` is the BASE, and a seasonal rate
 * overrides it only for dates inside its season. A tier with no seasonal rates
 * is priced at its base all year, which is the state everything is in today.
 * Where two seasons overlap a date, the higher `priority` wins. The resolver
 * is `resolvePriceForDate` in `queries/pricing.ts`.
 *
 * Note what this does NOT change: a quote still snapshots whatever figure was
 * resolved at the moment it was sent. Seasonal pricing makes the live rate
 * move, which is precisely why a sent quote must not be recomputed from it.
 */
export default defineType({
  name: "seasonalRate",
  title: "Seasonal rate",
  type: "object",
  fields: [
    defineField({
      name: "season",
      title: "Season",
      type: "reference",
      to: [{ type: "season" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "price",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      seasonName: "season.name",
      amount: "price.amount",
      unit: "price.unit",
    },
    prepare: ({ seasonName, amount, unit }) => ({
      title: seasonName ?? "Season",
      subtitle:
        `€${Number(amount ?? 0).toFixed(2)} ${unit === "per-person" ? "pp" : (unit ?? "")}`.trim(),
    }),
  },
})
