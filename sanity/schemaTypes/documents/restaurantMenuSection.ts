import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A section of the à la carte restaurant menu.
 *
 * PARKED CONTENT, modelled now rather than later. Restaurant-side work is
 * explicitly deferred until the events side is finished, and `menu.html`
 * exists on disk but is deliberately unlinked from every navigation — deferred
 * content, not dead content. It is modelled here anyway for two reasons: the
 * content already exists in that file so the shape is known rather than
 * guessed, and the proposed whole-site navigation has a Restaurant dropdown
 * with three rows, so this becomes live sooner than the roadmap order implies.
 *
 * Kept deliberately thin. The events side has earned its elaboration —
 * contested prices, provenance, consent, audit trails — because every one of
 * those answers a problem the project has actually hit. The restaurant menu
 * has hit none of them yet, and guessing at its structure in detail would be
 * designing for requirements nobody has stated. A section, its dishes, and a
 * price is the whole of what `menu.html` currently expresses.
 *
 * One thing carried over deliberately: `price` uses the shared type, so
 * restaurant prices inherit the same required unit and the same provenance
 * discipline as everything else. Restaurant pricing is not confirmed either.
 */
export default defineType({
  name: 'restaurantMenuSection',
  title: 'Restaurant menu section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'string',
      description: 'Starters, Pasta, Mains, Desserts.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 48},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'dishes',
      title: 'Dishes',
      type: 'array',
      of: [defineArrayMember({type: 'restaurantDish'})],
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      description: 'Off until the restaurant side is actually linked back into the navigation.',
    }),
  ],
  orderings: [{title: 'Menu order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', dishes: 'dishes', published: 'isPublished'},
    prepare({title, dishes, published}) {
      const count = Array.isArray(dishes) ? dishes.length : 0
      return {
        title,
        subtitle: `${count} dish${count === 1 ? '' : 'es'}${published ? '' : ' · unpublished'}`,
      }
    },
  },
})
