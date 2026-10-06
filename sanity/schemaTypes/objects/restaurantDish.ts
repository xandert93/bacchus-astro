import {defineField, defineType} from 'sanity'

/**
 * One dish on the restaurant menu.
 *
 * Parked alongside `restaurantMenuSection` — see the note there. A separate
 * type from `menuItem` because a restaurant dish is individually priced and
 * described, where a wedding menu line is one item in an inclusive package and
 * carries no price of its own.
 */
export default defineType({
  name: 'restaurantDish',
  title: 'Dish',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'price',
    }),
    defineField({
      name: 'isVegetarian',
      title: 'Vegetarian',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isVegan',
      title: 'Vegan',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'image',
      title: 'Photograph',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {name: 'name', amount: 'price.amount', media: 'image'},
    prepare({name, amount, media}) {
      return {
        title: name,
        subtitle: amount ? `€${Number(amount).toFixed(2)}` : undefined,
        media,
      }
    },
  },
})
