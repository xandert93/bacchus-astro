import { defineField, defineType } from "sanity"

/**
 * One priced line on a quote.
 *
 * Deliberately a SNAPSHOT, not a reference. A quote's lines store their own
 * label and their own amount rather than pointing at a `packageTier` or an
 * `addOn`, and that is the opposite of the rule applied to the availability
 * calendar, which derives everything and stores nothing. The reason is that
 * the two have opposite failure modes:
 *
 *   An availability calendar that stores a status goes stale and lies about
 *   the present.
 *
 *   A quote that derives its prices changes retroactively. Bacchus's pricing
 *   is generated internally and varies by season; a quote sent in March that
 *   re-renders at April's rates is a document the couple never agreed to, and
 *   the deposit page shows these exact figures to someone about to pay against
 *   them.
 *
 * So: derive availability, snapshot money. `sourceRef` keeps a soft pointer
 * back for reporting, but nothing reads it to render a price.
 *
 * The same reasoning covers why the quote stores its own computed totals. The
 * one real client quote we have does not reconcile — its excl.-VAT total,
 * stated VAT amount and incl.-VAT total do not add up to each other. Whatever
 * the cause, it means a total cannot be assumed recomputable from its lines,
 * and a PDF regenerated from first principles would silently disagree with the
 * one already in the couple's inbox.
 */
export default defineType({
  name: "quoteLineItem",
  title: "Line item",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description:
        'As it should read on the quote and the deposit page — e.g. "Food — Banquet, Dahlia tier".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Exclusive use", value: "exclusivity" },
          { title: "Food", value: "food" },
          { title: "Beverage", value: "beverage" },
          { title: "Set-up", value: "setup" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "quantity",
      title: "Quantity",
      type: "number",
      description: "Guest count for a per-person line; item count for set-up.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "unitAmount",
      title: "Unit amount (EUR)",
      type: "number",
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: "amount",
      title: "Line total (EUR)",
      type: "number",
      description:
        "Stored as sent, not recomputed from quantity x unit. See the note on this type.",
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: "sourceRef",
      title: "Priced from",
      type: "reference",
      to: [
        { type: "packageTier" },
        { type: "addOn" },
        { type: "venueSpace" },
        { type: "station" },
      ],
      description:
        "Soft pointer for reporting only. Nothing renders a price through this — the amount above is authoritative.",
    }),
  ],
  preview: {
    select: { label: "label", amount: "amount", category: "category" },
    prepare({ label, amount, category }) {
      return {
        title: label,
        subtitle: `${category} — €${Number(amount ?? 0).toFixed(2)}`,
      }
    },
  },
})
