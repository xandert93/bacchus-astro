import { defineArrayMember, defineField, defineType } from "sanity"
import { PRICE_UNITS } from "../../lib/constants"
import { help } from "../../lib/help"
import { capitalise, formatEuros, joinParts, optionTitle } from "../../lib/preview"

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
      description: "e.g. Daisy, Lavender, Rose, Orchid, Local Wine or Themed Bars.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "name", maxLength: 48 },
      description: "Generated from the name. Used in links to this tier, e.g. #rose.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "content",
      description: help(
        "Lowest first.",
        "For ranked tiers this is the ranking. For Beverage, it is only the order they appear in.",
      ),
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "summary",
      title: "Card description",
      type: "text",
      group: "content",
      rows: 3,
      description:
        'Shown on the tier card, e.g. "An elegant opening tier: ten cold and ten hot canapés, a three-dish flying buffet, four desserts, coffee and the wedding cake."',
    }),
    defineField({
      name: "price",
      title: "Base price",
      type: "price",
      group: "content",
      description: help(
        "Optional. Leave empty rather than guess if the price isn't reliable.",
        "Applies all year, unless a seasonal rate below covers the date.",
      ),
    }),
    defineField({
      name: "seasonalRates",
      title: "Seasonal rates",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "seasonalRate" })],
      description: help(
        "Replaces the base price for dates inside a season.",
        "Empty for every tier at the moment: Bacchus hasn't sent seasonal prices yet.",
      ),
    }),

    // --- Menu ---------------------------------------------------------------
    defineField({
      name: "menuGroups",
      title: "Menu groups",
      type: "array",
      group: "menu",
      of: [defineArrayMember({ type: "menuGroup" })],
      description: help(
        "e.g. Cold Canapés, Hot Canapés, Flying Buffet, Desserts, Coffee Station and Wedding Cake. On Beverage, the wine packages.",
        "Copy from the catalogue by reading it, not by copying and pasting from the PDF: pasting loses accents and sometimes whole words.",
      ),
    }),
    defineField({
      name: "signatureDishes",
      title: "Signature dishes",
      type: "array",
      group: "menu",
      of: [defineArrayMember({ type: "signatureDish" })],
      description: help(
        "Up to three photo tiles above the menu.",
        "Only Reception has real photos so far. The others show placeholder tiles, and Beverage has none.",
      ),
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: "intro",
      title: "Introduction",
      type: "text",
      group: "menu",
      rows: 4,
      description:
        "Optional paragraph above the menu. Used on Beverage, not on the dining tiers.",
    }),
    defineField({
      name: "includedNote",
      title: "What the tier includes",
      type: "text",
      group: "menu",
      rows: 3,
      description:
        "Anything that applies to the whole tier, e.g. the in-house cake being included in the Reception price.",
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
      packageName: "package.name",
      amount: "price.amount",
      unit: "price.unit",
      status: "price.provenance.status",
      blocked: "price.provenance.blocksPublication",
    },
    prepare: ({ name, packageName, amount, unit, status, blocked }) => ({
      title: name,
      subtitle: joinParts(
        packageName,
        amount
          ? joinParts(formatEuros(amount), optionTitle(PRICE_UNITS, unit))
          : "No price",
        blocked ? "Hidden from the site" : undefined,
        status && status !== "confirmed" ? capitalise(status) : undefined,
      ),
    }),
  },
})
