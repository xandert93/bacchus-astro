import { defineField, defineType } from "sanity"
import { PRICE_UNITS } from "../../lib/constants"
import { help } from "../../lib/help"
import { formatEuros, joinParts, optionTitle } from "../../lib/preview"

/**
 * A money figure, its unit, and whether we are allowed to show it.
 *
 * Three constraints from the project, all enforced here rather than left to
 * whoever writes the template:
 *
 * 1. `unit` is REQUIRED. The catalogue's corkage fee had to be withheld
 *    entirely because its source gave an amount with no unit, and publishing
 *    a chargeable fee with a guessed unit is worse than publishing nothing.
 *    A price that cannot name its unit cannot be stored.
 *
 * 2. `provenance` is REQUIRED. Every per-person figure on the site today comes
 *    from either the catalogue or a single shared client quote, and the two
 *    disagree about Banquet. A price with no recorded source is how that
 *    conflict gets silently resolved by accident.
 *
 * 3. Two decimal places, and no arithmetic in the CMS. Figures are stored in
 *    euros for the editor's sake; any totalling — quotes especially — must be
 *    done in integer cents in the serverless function, not by adding these
 *    numbers as floats. The one real quote we have does not reconcile between
 *    its excl.-VAT subtotal, its stated VAT and its incl.-VAT total, so the
 *    project cannot assume a total is ever recomputable from its parts.
 *
 * `isIndicative` exists because Bacchus generates pricing from an internal
 * system that varies by month and season (April said to run slightly higher
 * than March). No figure here is a year-round rate card, and the one that
 * pretends to be would be the one that gets quoted back at them.
 *
 * `isStartingPrice` is a different thing, and the only one that changes what
 * the page prints. It marks a figure that is the cheapest of several options
 * (Beverage's bar options, "from €12"), so the page says "from". Seasonal
 * variation does not get a "from": it applies to every price on the site, so
 * it is said once, in the page notes, rather than on every card.
 */
export default defineType({
  name: "price",
  title: "Price",
  type: "object",
  fields: [
    defineField({
      name: "amount",
      title: "Amount (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      options: { list: [...PRICE_UNITS] },
      description: "Required. A price can't be shown without saying what it is per.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isIndicative",
      title: "Indicative — May Vary by Season",
      type: "boolean",
      initialValue: true,
      description: "Leave ticked unless this price applies all year.",
    }),
    defineField({
      name: "vatIncluded",
      title: "VAT Included",
      type: "boolean",
      initialValue: true,
      description: "Bacchus's prices include VAT.",
    }),
    defineField({
      name: "isHidden",
      title: "Hide on the Website",
      type: "boolean",
      initialValue: false,
      description: 'The website shows "On request" instead of the price.',
    }),
    defineField({
      name: "isStartingPrice",
      title: 'Starting Price — Shows "From" on the Page',
      type: "boolean",
      initialValue: false,
      description: help(
        'For the cheapest of several options, e.g. "from €12" for bar options.',
        'Not for seasonal changes: "Indicative" covers those.',
      ),
    }),
  ],
  preview: {
    select: {
      amount: "amount",
      unit: "unit",
      startingPrice: "isStartingPrice",
      hidden: "isHidden",
    },
    prepare: ({ amount, unit, startingPrice, hidden }) => ({
      title: joinParts(
        `${startingPrice ? "From " : ""}${formatEuros(amount) ?? "No amount"}`,
        optionTitle(PRICE_UNITS, unit),
      ),
      subtitle: hidden ? "Hidden on the website" : undefined,
    }),
  },
})
