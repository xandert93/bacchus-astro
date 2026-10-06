import {defineArrayMember, defineField, defineType} from 'sanity'

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
  name: 'station',
  title: 'Reception station',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 64},
      description:
        'The deep-link target — reception-package.html#<slug> today, /weddings/packages/reception#<slug> once on Astro. Note mobile deep-linking to a station is a known open bug.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'stationCategory'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order within category',
      type: 'number',
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'price',
      description: 'Per person, as the card shows it — e.g. €10.50.',
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'menuItem'})],
      description:
        'Also composed into the lightbox caption at render time. Do not maintain a second copy of this list anywhere.',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'servingNote',
      title: 'Serving note',
      type: 'string',
      description:
        'How it is served — e.g. "Served with crackers, Grissini & freshly baked bread." Leads the lightbox caption.',
    }),
    defineField({
      name: 'allItemsVegetarian',
      title: 'Every item is vegetarian',
      type: 'boolean',
      initialValue: false,
      description:
        'Lets the card show one "All vegetarian" badge instead of repeating (V) on every line — true today for Macaron Tower and Doughnut Wall. A backlog idea, not yet built; the flag is here so the data does not need revisiting when it is.',
    }),
    defineField({
      name: 'isChefsPick',
      title: "Chef's pick",
      type: 'boolean',
      initialValue: false,
      description:
        'A backlog idea for helping couples decide. Deliberately "Chef\'s pick" and not "popular" — there is nothing to back popularity as a factual claim.',
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
        defineField({
          name: 'isPlaceholder',
          title: 'Placeholder image (AI-generated stand-in)',
          type: 'boolean',
          initialValue: true,
          description:
            'True for all sixteen today. Drives the on-page disclaimer. See the note on this type.',
        }),
      ],
    }),
    defineField({
      name: 'catalogueVariance',
      title: 'Name differs from the catalogue',
      type: 'catalogueVariance',
      description:
        '"BBQ Table" is the live case — the catalogue prints "Barbeque Table", which was first corrected to "Barbecue Table" on the British-English rule and then renamed again on request. A naming choice, so flag it to the client as a change rather than a correction.',
    }),
  ],
  // Own fields only — a list cannot be sorted by a field behind a reference.
  // Category grouping happens in the query (queries/content.ts), which fetches
  // categories and nests their stations underneath.
  orderings: [{title: 'Order within category', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {
      name: 'name',
      amount: 'price.amount',
      media: 'image',
      placeholder: 'image.isPlaceholder',
      chefsPick: 'isChefsPick',
    },
    prepare({name, amount, media, placeholder, chefsPick}) {
      return {
        title: name,
        subtitle: [
          amount ? `€${Number(amount).toFixed(2)} pp` : null,
          chefsPick ? "chef's pick" : null,
          placeholder ? 'placeholder image' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
