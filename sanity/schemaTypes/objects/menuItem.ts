import {defineField, defineType} from 'sanity'

/**
 * One line on a menu — a canapé, a buffet dish, a dessert.
 *
 * `isVegetarian` is a plain boolean and that is deliberate, even though the
 * High Tea tiers have no vegetarian marks at all. The absence there is a
 * property of the SOURCE, not of each dish: the catalogue marks (V) throughout
 * Reception and Banquet and never once across Jasmine/Hibiscus/Tulip, so the
 * honest model is a package-level `dietaryMarking` field (see
 * `weddingPackage`) that suppresses every badge AND the foot-of-page legend
 * together. Making this a tri-state per item would invite someone to infer a
 * marker from a dish name, which is precisely the risk the project refused to
 * take — mislabelling a dish to a guest with a dietary requirement.
 *
 * The renderer, not the data, owns the typographic detail: the (V) marker is
 * wrapped with the item's final word in `.package-veg-marker-keep-with-word`
 * so the badge cannot orphan onto its own line. Nothing about that belongs in
 * the CMS.
 */
export default defineType({
  name: 'menuItem',
  title: 'Menu item',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Item',
      type: 'string',
      description:
        'House style: British English, accents restored on foreign-language terms. Record any departure from the catalogue below.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isVegetarian',
      title: 'Vegetarian (V)',
      type: 'boolean',
      initialValue: false,
      description:
        'Only where the source marks it. Never inferred from the dish name. Ignored entirely on packages whose source carries no markings.',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description:
        'Qualifying detail that is part of the item rather than a separate line — e.g. "one tier per one hundred contracted guests".',
    }),
    defineField({
      name: 'catalogueVariance',
      title: 'Differs from the catalogue',
      type: 'catalogueVariance',
    }),
  ],
  preview: {
    select: {name: 'name', veg: 'isVegetarian', variance: 'catalogueVariance.kind'},
    prepare({name, veg, variance}) {
      return {
        title: `${name}${veg ? ' (V)' : ''}`,
        subtitle: variance ? `${variance} vs catalogue` : undefined,
      }
    },
  },
})
