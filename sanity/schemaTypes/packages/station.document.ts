import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { photoField } from "../../lib/photoField"
import { formatEuros, joinParts, pluralise } from "../../lib/preview"

/**
 * One reception food station — Charcuterie Table, Oyster Royale, BBQ Table,
 * Macaron Tower, and the rest of the sixteen.
 *
 * THE POINT OF MOVING THESE INTO SANITY, stated plainly because it is the
 * clearest single argument in the whole migration: a station's details
 * currently exist in up to four places in one HTML file — the visible item
 * list, the `data-detail` string that feeds the lightbox caption, `data-title`,
 * and the image `alt` — and the whole card set is rendered TWICE in the file,
 * once for the mobile/tablet layout and once for desktop. That is thirty-two
 * card instances for sixteen stations, with each string duplicated across
 * them. The project has already been bitten by exactly this: a wording fix
 * ("Vegetable Stir Fried" to "Stir-Fried Vegetables") caught one of two
 * occurrences and looked like it had worked, partly because the formatter
 * line-wraps the visible copy so the phrase did not exist as a contiguous
 * string anywhere in the file.
 *
 * Here the string exists once. Which means:
 *
 *   `lightboxDetail` IS NOT A FIELD, and must not become one. The lightbox
 *   caption is composed at render time from `servingNote` plus the items
 *   joined with a middle dot — exactly as the current `data-detail` string is
 *   built by hand. Storing it would reintroduce the duplication this type
 *   exists to remove.
 *
 * `image.isPlaceholder` carries the project's one approved photography
 * exception: all sixteen station images are AI-generated stand-ins, added on
 * the user's explicit call so the section reads as finished in a pitch, with a
 * visible oxblood on-page disclaimer, to be declared to Bacchus as
 * placeholder. Everything else on the site is real client photography, so the
 * exception needs to stay visible and queryable rather than becoming a habit.
 */
export default defineType({
  name: "station",
  title: "Reception Station",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 64 },
      description:
        "Generated from the name. Used in links straight to this station. Don't change it once set.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "stationCategory" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "catalogueNumber",
      title: "Catalogue Number",
      type: "number",
      description: help(
        "The station's number in the catalogue.",
        "Each station needs its own number. Never reuse one, even after deleting a station.",
      ),
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "order",
      title: "Order Within Category",
      type: "number",
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "price",
      description: "Per person, as shown on the card, e.g. €10.50.",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [defineArrayMember({ type: "stationItem" })],
      description: "Also used for the caption when the photo is opened full size.",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "servingNote",
      title: "Serving Note",
      type: "string",
      description: help(
        'How it is served, e.g. "Served with crackers, Grissini & freshly baked bread."',
        "Starts the caption when the photo is opened full size.",
      ),
    }),
    defineField({
      name: "allItemsVegetarian",
      title: "Every Item Is Vegetarian",
      type: "boolean",
      initialValue: false,
      description: help(
        'Will let the card show one "All vegetarian" badge instead of (V) on every line, e.g. for the Macaron Tower and Doughnut Wall.',
        "Not shown on the site yet.",
      ),
    }),
    defineField({
      name: "isChefsPick",
      title: "Chef's Pick",
      type: "boolean",
      initialValue: false,
      description: help(
        "Will highlight the station to help couples choose. Not shown on the site yet.",
        'It says "Chef\'s pick" rather than "popular" because we have no figures to back up popularity.',
      ),
    }),
    photoField({
      name: "image",
      title: "Photograph",
      canBeStandIn: true,
    }),
  ],
  // Own fields only — a list cannot be sorted by a field behind a reference.
  // Category grouping happens in the site's query (src/lib/sanity/stations.ts),
  // which fetches categories and nests their stations underneath.
  orderings: [
    {
      title: "Order Within Category",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      name: "name",
      amount: "price.amount",
      category: "category.label",
      items: "items",
      media: "image",
      placeholder: "image.isPlaceholder",
      chefsPick: "isChefsPick",
    },
    prepare: ({ name, amount, category, items, media, placeholder, chefsPick }) => ({
      title: name,
      subtitle: joinParts(
        category,
        amount ? `${formatEuros(amount)} per person` : undefined,
        pluralise(Array.isArray(items) ? items.length : undefined, "item"),
        chefsPick ? "Chef's pick" : undefined,
        placeholder ? "Placeholder photo" : undefined,
      ),
      media,
    }),
  },
})
