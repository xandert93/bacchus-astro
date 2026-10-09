import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"

/**
 * One dish that can appear on a wedding package menu.
 *
 * A DOCUMENT rather than an inline object, because the same dish genuinely
 * recurs across tiers and packages. Measured against the proofed prototype
 * pages: 187 menu lines across Reception, Banquet and High Tea resolve to 130
 * distinct dishes, so 57 lines — nearly a third — were duplicates. "Brie &
 * Candied Walnuts Leaves" alone appeared six times, in all three Reception
 * tiers and all three Banquet tiers.
 *
 * Storing it once is worth the reference-picking in the editor for one
 * specific reason beyond tidiness: the catalogue's spelling has to be
 * corrected, and the corrections are tracked and sent to the client for
 * approval. With the dish inline, "Macarons" is fixed in as many places as it
 * appears and a missed occurrence is invisible — which is exactly the failure
 * already recorded against the stations page, where a wording fix caught one
 * of two occurrences and looked like it had worked. Here a dish has one
 * spelling, one vegetarian marking and one `catalogueVariance`, and fixing it
 * fixes every menu it appears on.
 *
 * The flipside, recorded so it is not a surprise: an editor adding a tier now
 * picks dishes from a list rather than typing them. That is slower for bulk
 * entry and better for consistency, and bulk entry is a migration script's
 * job rather than a person's.
 *
 * `isVegetarian` stays a plain boolean. The absence of (V) markings across
 * High Tea is a property of the SOURCE, not of each dish, and is handled by
 * `weddingPackage.dietaryMarking` suppressing badges and the legend together.
 * Inferring a marking from a dish name risks mislabelling food to a guest
 * with a dietary requirement, so it is never done.
 */
export default defineType({
  name: "menuDish",
  title: "Menu dish",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Dish",
      type: "string",
      description: help(
        "British English, with accents on foreign words (e.g. purée, jalapeño).",
        'If this differs from the catalogue, record it under "Differs from the catalogue" below.',
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      description: "Generated from the name. Don't change it once set.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isVegetarian",
      title: "Vegetarian (V)",
      type: "boolean",
      initialValue: false,
      description: help(
        "Tick only where the catalogue marks the dish (V). Never guess from the name.",
        "Ignored on packages whose catalogue has no (V) markings at all.",
      ),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description:
        'Extra detail that belongs with the dish, e.g. "one tier per one hundred contracted guests".',
    }),
    defineField({
      name: "catalogueVariance",
      title: "Differs from the catalogue",
      type: "catalogueVariance",
      description:
        'Fill in when our wording differs from the catalogue. It then appears under "Copy changes awaiting approval" until Bacchus agrees.',
    }),
  ],
  orderings: [
    { title: "Name", name: "nameAsc", by: [{ field: "name", direction: "asc" }] },
  ],
  preview: {
    select: {
      name: "name",
      vegetarian: "isVegetarian",
      variance: "catalogueVariance.kind",
      approved: "catalogueVariance.clientApproved",
    },
    prepare: ({ name, vegetarian, variance, approved }) => ({
      title: `${name}${vegetarian ? " (V)" : ""}`,
      subtitle: variance
        ? `Differs from the catalogue · ${approved ? "Approved" : "Awaiting approval"}`
        : undefined,
    }),
  },
})
