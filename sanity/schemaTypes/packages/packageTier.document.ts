import { defineArrayMember, defineField, defineType } from "sanity"

/**
 * One tier or category within a package — Daisy, Lavender, Rose; Orchid,
 * Dahlia, Sunflower; Jasmine, Hibiscus, Tulip; or one of Beverage's four
 * categories.
 *
 * A DOCUMENT rather than an object inside `weddingPackage`, for one decisive
 * reason: quotes have to reference a tier ("Food — Banquet, Dahlia tier"), and
 * Sanity cannot reference into an array item. Two supporting reasons — a tier
 * carries six menu groups of up to ten items each, so three tiers inline would
 * make a package document unwieldy to edit and uncomfortably large; and tiers
 * are deep-linked (`/weddings/packages/reception#rose`), so they need a slug
 * of their own.
 *
 * Tiers stay a hash fragment rather than becoming routes, deliberately:
 * Daisy/Lavender/Rose are a comparison, not three destinations. The slug here
 * is the fragment, not a path segment.
 *
 * `price` is optional, and that is not an oversight. Beverage's catalogue
 * carries no prices at all, and the figures shown on that page come from the
 * client quote instead — so the price and its provenance travel together, and
 * a tier with no trustworthy price simply has none rather than inheriting a
 * guess. The corkage figure is the sharpest case: it exists, and it is held
 * back by `provenance.blocksPublication` because its source never said whether
 * it was per bottle or per person.
 *
 * Pricing resolves in two layers. `price` is the base and applies all year;
 * `seasonalRates` override it for dates inside a season, since Bacchus's
 * pricing is generated internally and varies by month. Every tier is on its
 * base price today, because no rate card has been supplied — the structure is
 * in place so adding one later is data entry rather than a schema change. The
 * resolver is `resolvePriceForDate` in `queries/pricing.ts`.
 */
export default defineType({
  name: "packageTier",
  title: "Tier / category",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "menu", title: "Menu" },
  ],
  fields: [
    defineField({
      name: "package",
      title: "Package",
      type: "reference",
      group: "content",
      to: [{ type: "weddingPackage" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      description: "Daisy, Lavender, Rose, Orchid, Local Wine, Themed Bars…",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "name", maxLength: 48 },
      description: "Used as the in-page anchor — #rose, #dahlia.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "content",
      description:
        "Ascending. For ranked tiers this is the ranking; for Beverage's categories it is only display order.",
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "summary",
      title: "Card description",
      type: "text",
      group: "content",
      rows: 3,
      description:
        'Shown on the tier card — e.g. "An elegant opening tier: ten cold and ten hot canapés, a three-dish flying buffet, four desserts, coffee and the wedding cake."',
    }),
    defineField({
      name: "price",
      title: "Base price",
      type: "price",
      group: "content",
      description:
        "Optional. A tier whose price is not trustworthy has none rather than a guess — see the note on this type. Applies all year unless a seasonal rate below covers the date.",
    }),
    defineField({
      name: "seasonalRates",
      title: "Seasonal rates",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "seasonalRate" })],
      description:
        "Overrides the base price for dates inside a season. Leave empty and the base price applies all year, which is where every tier stands today — Bacchus has not supplied a rate card.",
    }),

    // --- Menu ---------------------------------------------------------------
    defineField({
      name: "menuGroups",
      title: "Menu groups",
      type: "array",
      group: "menu",
      of: [defineArrayMember({ type: "menuGroup" })],
      description:
        'Cold Canapés, Hot Canapés, Flying Buffet, Desserts, Coffee Station, Wedding Cake — or, on Beverage, the wine packages. Read from the RENDERED catalogue pages, never from a text extraction: an automated pull drops every accented character and in places whole words ("Goat\'s Cheese" vanished from an Orchid line, "Gavi Di Gavi" from a wine name).',
    }),
    defineField({
      name: "signatureDishes",
      title: "Signature dishes",
      type: "array",
      group: "menu",
      of: [defineArrayMember({ type: "signatureDish" })],
      description:
        'The three photographed tiles above the menu columns. Only Reception has real photography; the other three render placeholder tiles, and Beverage has none at all because "signature dishes" is the wrong frame for a wine list.',
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: "includedNote",
      title: "What the tier includes",
      type: "text",
      group: "menu",
      rows: 3,
      description:
        "Anything true of the whole tier rather than one group. In-house cake is included in the reception package price, for instance.",
    }),
  ],
  // Orderings sort on the document's own fields only — Sanity cannot sort a
  // list by a field behind a reference, so there is no "group by package"
  // ordering here. The twelve tiers are a flat list in the Studio; if that
  // becomes awkward, the fix is a per-package child list in `structure.ts`,
  // not a denormalised package name copied onto every tier.
  orderings: [
    { title: "Tier order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: {
      name: "name",
      amount: "price.amount",
      unit: "price.unit",
      status: "price.provenance.status",
      blocked: "price.provenance.blocksPublication",
    },
    prepare: ({ name, amount, unit, status, blocked }) => {
      const price = amount
        ? `€${Number(amount).toFixed(2)} ${unit === "per-person" ? "pp" : (unit ?? "")}`.trim()
        : "no price"
      return {
        title: name,
        subtitle: [
          price,
          blocked ? "withheld" : null,
          status && status !== "confirmed" ? status : null,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
