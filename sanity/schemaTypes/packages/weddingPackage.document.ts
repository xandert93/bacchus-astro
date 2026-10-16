import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { photoField } from "../../lib/photoField"
import { joinParts } from "../../lib/preview"

/**
 * One of the four wedding packages: Reception, Banquet, High Tea, Beverage.
 *
 * The central structural fact, settled per client correspondence and baked in
 * here: Reception, Banquet and High Tea are three MUTUALLY EXCLUSIVE meal
 * formats — a wedding picks one, not a combination — while Beverage is
 * ADDITIVE, chosen alongside whichever format is picked. The catalogue's own
 * copy already frames High Tea as "an alternative to the formal banquet"; the
 * assumption now extended to Reception is that it is a third alternative
 * rather than a course preceding the other two.
 *
 * `role` is what encodes that, and it is what a quote reads to validate a
 * selection: exactly one `meal-format` tier, any number of `additive` ones.
 * Without it the distinction lives only in prose and the quote generator has
 * to be told the rule separately.
 *
 * `tierStyle` is the second-order consequence and the reason Beverage looks
 * structurally different on the page. Reception/Banquet/High Tea are three
 * RANKED tiers (Daisy < Lavender < Rose, and so on) where picking one means
 * not picking the others. Beverage has four categories — Local Wine, Foreign
 * Wine, Bar Options, Themed Bars — that combine freely and are not a ranking.
 * Calling both "tiers" in the UI would be a lie about how they are chosen.
 *
 * `dietaryMarking` is the High Tea problem made explicit. The catalogue marks
 * (V) throughout Reception and Banquet and not once across
 * Jasmine/Hibiscus/Tulip. Set `not-marked-in-source` and the renderer must
 * suppress every badge AND the foot-of-page "(V) vegetarian" legend line
 * together — they are restored together or not at all, because a legend with
 * no badges explains nothing and badges with no legend are unexplained. The
 * alternative, inferring markers from dish names, risks mislabelling a dish to
 * a guest with a dietary requirement, which is why it is not on the table.
 *
 * Layout is NOT modelled here. Whether the page has a sticky tier switcher,
 * how many columns the menu groups run, whether the card grid is 3-up or 2x2
 * — all of that is a consequence of the content and belongs in CSS. Beverage
 * has no sticky switcher because four `flex:1` buttons would leave about 80px
 * each on mobile and overflow; that is a measurement, not an editorial choice,
 * and putting it in the CMS would invite someone to turn it back on.
 */
export default defineType({
  name: "weddingPackage",
  title: "Wedding Package",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "structure", title: "Structure" },
    { name: "seo", title: "Search & Social" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      description: "e.g. Reception, Banquet, High Tea or Beverage.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "name", maxLength: 48 },
      description: help(
        "The end of the page's web address, e.g. reception gives /weddings/packages/reception.",
        "Don't change it once set, or existing links break.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Meal Format — Mutually Exclusive, Pick One", value: "meal-format" },
          { title: "Additive — Chosen Alongside a Meal Format", value: "additive" },
        ],
        layout: "radio",
      },
      description: help(
        "Meal formats are alternatives: a quote has exactly one.",
        "Additive packages (Beverage) are chosen on top of a meal format.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tierStyle",
      title: "How the Options Relate",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Ranked Tiers — One Is Chosen", value: "ranked-tiers" },
          { title: "Categories — They Combine Freely", value: "combinable-categories" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dietaryMarking",
      title: "Vegetarian Marking in the Source",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Marked — (V) Appears in the Catalogue", value: "marked" },
          {
            title: "Not Marked in the Source — Suppress Badges and Legend",
            value: "not-marked-in-source",
          },
          { title: "Not Applicable — No Dishes", value: "not-applicable" },
        ],
        layout: "radio",
      },
      initialValue: "marked",
      description: help(
        "Whether the catalogue marks vegetarian dishes (V) for this package.",
        'High Tea is "not marked": the (V) badges and the key at the foot of the page are both hidden.',
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "structure",
      description:
        "The order of the package cards on the weddings page. Beverage goes last.",
      validation: (Rule) => Rule.required().integer(),
    }),

    // --- Page content -------------------------------------------------------
    defineField({
      name: "cardSummary",
      title: "Card Summary",
      type: "text",
      group: "content",
      rows: 3,
      description: "The short paragraph on the package card on the weddings page.",
    }),
    defineField({
      name: "hero",
      title: "Top of the Page",
      type: "object",
      group: "content",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "heading",
          title: "Heading",
          type: "string",
        }),
        defineField({
          name: "intro",
          title: "Intro",
          type: "text",
          rows: 4,
          description: "One paragraph under the heading.",
        }),
        photoField({
          name: "image",
          title: "Photograph",
          description: help(
            "The large photo at the top of the page. It needs a high-resolution original.",
            "Most of the current event photos are too small and look blurry at this size. Ask Bacchus for the original first.",
          ),
        }),
      ],
    }),
    defineField({
      name: "notes",
      title: "Page Notes & Callouts",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "packageNote" })],
      description: "The bronze and dark red notes on the page.",
    }),
    defineField({
      name: "allergenNote",
      title: "Allergen Note",
      type: "text",
      group: "content",
      rows: 3,
      description: help(
        "Shown at the foot of the page.",
        'The "(V) vegetarian" key is added automatically, except on packages without (V) markings.',
      ),
    }),
    defineField({
      name: "seo",
      title: "Search & Social",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    {
      title: "Package Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { name: "name", role: "role", style: "tierStyle", marking: "dietaryMarking" },
    prepare: ({ name, role, style, marking }) => ({
      title: name,
      subtitle: joinParts(
        role === "meal-format" ? "Meal format" : "Added on top",
        style === "ranked-tiers" ? "Choose one tier" : "Categories combine",
        marking === "not-marked-in-source" ? "No (V) markings" : undefined,
      ),
    }),
  },
})
