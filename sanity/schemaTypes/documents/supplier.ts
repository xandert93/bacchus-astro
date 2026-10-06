import {defineField, defineType} from 'sanity'

/**
 * A preferred supplier — photographer, florist, band, DJ, photobooth.
 *
 * Roadmap step 6: low priority, low build effort, good content value. But it
 * is also the highest-leverage item on the whole search-visibility list, and
 * for a reason that is easy to miss — a supplier directory is a LINK EXCHANGE
 * in disguise. Photographers and florists linking back from their own sites is
 * worth more than any quantity of on-site copy, and that is what
 * `websiteUrl` + `linksBackUrl` are for: the second field makes "who has
 * actually reciprocated" a query rather than a spreadsheet.
 *
 * The categories follow what Bacchus confirmed couples still source
 * themselves — flowers, entertainment (DJ or band, including stage), and a
 * photographer — plus photobooth as the one common optional add. The client
 * explicitly cautioned against couples adding much beyond that, so this list
 * should stay short rather than becoming a marketplace.
 *
 * `isPreferred` separates a genuine recommendation from a supplier merely
 * recorded. Only Bacchus can make that call, which is why it defaults off: a
 * directory that silently implies endorsement of everyone in it is a liability
 * for the venue the first time a supplier disappoints.
 */
export default defineType({
  name: 'supplier',
  title: 'Supplier',
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Photographer', value: 'photographer'},
          {title: 'Videographer', value: 'videographer'},
          {title: 'Florist', value: 'florist'},
          {title: 'Band', value: 'band'},
          {title: 'DJ', value: 'dj'},
          {title: 'Photobooth', value: 'photobooth'},
          {title: 'Hair & make-up', value: 'hair-makeup'},
          {title: 'Transport', value: 'transport'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Written in the site\'s voice, not copied from the supplier\'s own marketing.',
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram',
      type: 'url',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      description: 'Internal. Not published — suppliers get enquiries through their own site.',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo or portrait',
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
    defineField({
      name: 'isPreferred',
      title: 'Preferred — Bacchus actively recommends them',
      type: 'boolean',
      initialValue: false,
      description:
        'Off by default. Only Bacchus can make this call; a directory that implies endorsement of everyone listed is a liability.',
    }),
    defineField({
      name: 'linksBackUrl',
      title: 'Where they link back from',
      type: 'url',
      description:
        'The page on their site that links to Bacchus. Makes reciprocity auditable. Internal only.',
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.integer(),
    }),
  ],
  orderings: [
    {
      title: 'Category, then name',
      name: 'categoryName',
      by: [
        {field: 'category', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      name: 'name',
      category: 'category',
      preferred: 'isPreferred',
      published: 'isPublished',
      media: 'logo',
    },
    prepare({name, category, preferred, published, media}) {
      return {
        title: name,
        subtitle: [category, preferred ? 'preferred' : null, published ? null : 'unpublished']
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
