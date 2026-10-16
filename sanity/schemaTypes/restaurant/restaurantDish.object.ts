import { defineField, defineType } from "sanity"
import { photoField } from "../../lib/photoField"
import { formatEuros, joinParts } from "../../lib/preview"

/**
 * One dish on the restaurant menu.
 *
 * Parked alongside `restaurantMenuSection` — see the note there. A separate
 * type from `menuItem` because a restaurant dish is individually priced and
 * described, where a wedding menu line is one item in an inclusive package and
 * carries no price of its own.
 */
export default defineType({
  name: "restaurantDish",
  title: "Dish",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "price",
    }),
    defineField({
      name: "isVegetarian",
      title: "Vegetarian",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isVegan",
      title: "Vegan",
      type: "boolean",
      initialValue: false,
    }),
    photoField({
      name: "image",
      title: "Photograph",
    }),
  ],
  preview: {
    select: {
      name: "name",
      amount: "price.amount",
      vegetarian: "isVegetarian",
      vegan: "isVegan",
      media: "image",
    },
    prepare: ({ name, amount, vegetarian, vegan, media }) => ({
      title: name,
      subtitle: joinParts(
        formatEuros(amount),
        vegan ? "Vegan" : vegetarian ? "Vegetarian" : undefined,
      ),
      media,
    }),
  },
})
