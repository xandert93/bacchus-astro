import { defineArrayMember, defineField, defineType } from "sanity"

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
  title: "Wedding package",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "structure", title: "Structure" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      description: "Reception, Banquet, High Tea, Beverage.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "name", maxLength: 48 },
      description:
        'Becomes /weddings/packages/<slug> — reception, banquet, high-tea, beverage. No "-package" or "-menus" suffix: the parent segment already says it, so /packages/reception-package would stutter.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Meal format — mutually exclusive, pick one", value: "meal-format" },
          { title: "Additive — chosen alongside a meal format", value: "additive" },
        ],
        layout: "radio",
      },
      description:
        "Read by the quote generator to validate a selection. See the note on this type.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tierStyle",
      title: "How the options relate",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Ranked tiers — one is chosen", value: "ranked-tiers" },
          { title: "Categories — they combine freely", value: "combinable-categories" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dietaryMarking",
      title: "Vegetarian marking in the source",
      type: "string",
      group: "structure",
      options: {
        list: [
          { title: "Marked — (V) appears in the catalogue", value: "marked" },
          {
            title: "Not marked in the source — suppress badges and legend",
            value: "not-marked-in-source",
          },
          { title: "Not applicable — no dishes", value: "not-applicable" },
        ],
        layout: "radio",
      },
      initialValue: "marked",
      description:
        'High Tea is "not marked in the source". Badges and the foot-of-page legend are suppressed together, and restored together.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "structure",
      description:
        "Card order in the packages section on the weddings page. Beverage sits last — it is the additive one.",
      validation: (Rule) => Rule.required().integer(),
    }),

    // --- Page content -------------------------------------------------------
    defineField({
      name: "cardSummary",
      title: "Card summary",
      type: "text",
      group: "content",
      rows: 3,
      description: "The one-paragraph pitch on the package card on the weddings page.",
    }),
    defineField({
      name: "heroHeading",
      title: "Page heading",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "heroIntro",
      title: "Page intro",
      type: "text",
      group: "content",
      rows: 4,
      description:
        "Every hero on the site is crumb, h1, one paragraph, then CTAs. One paragraph.",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      group: "content",
      options: { hotspot: true },
      description:
        "Needs a high-resolution export. Most of the existing event photography is 1024x1280, which is visibly soft stretched full-bleed — ask the client before using one as a hero.",
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: "notes",
      title: "Page notes & callouts",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "packageNote" })],
      description:
        "The bronze and oxblood callouts. Three are currently live and load-bearing — the Banquet pricing conflict, the High Tea vegetarian explanation, and the Beverage pricing source. Do not remove one while the fact behind it is unresolved: it is the only thing telling a reader the figure above it is contested.",
    }),
    defineField({
      name: "allergenNote",
      title: "Allergen note",
      type: "text",
      group: "content",
      rows: 3,
      description:
        'Foot of page. Drop the "(V) vegetarian" legend line automatically where this package has no markings.',
    }),
    defineField({
      name: "seo",
      title: "Search & social",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    {
      title: "Package order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { name: "name", role: "role", style: "tierStyle", marking: "dietaryMarking" },
    prepare: ({ name, role, style, marking }) => ({
      title: name,
      subtitle: [
        role === "meal-format" ? "meal format" : "additive",
        style === "ranked-tiers" ? "ranked tiers" : "combinable categories",
        marking === "not-marked-in-source" ? "no (V) in source" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
})
