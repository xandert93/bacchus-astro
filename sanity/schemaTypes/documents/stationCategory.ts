import {defineField, defineType} from 'sanity'

/**
 * A grouping of reception stations — the six tabs on the stations section.
 *
 * Two label fields, because the tab bar genuinely needs two strings. The full
 * label heads each card and serves as the tab's accessible name ("Boards &
 * Cured", "Fruits of the Sea", "Grill & Roast", "Across Asia",
 * "Pasta & Pizza"); the short label is what the tab itself displays
 * ("Boards", "Sea"). That is not a styling trick — it is how six tabs fit a
 * mobile width without the hidden-scrollbar overflow that silently clipped a
 * tab label elsewhere on the site, and a CSS truncation of the full label
 * would produce "Fruits of the…" rather than "Sea".
 *
 * A document rather than a string enum on `station`, because the categories
 * are ordered, carry two labels each, and — the part that actually forces it —
 * the six labels are an editorial change still awaiting Bacchus's sign-off.
 * They have an on-page oxblood disclaimer today, so they need somewhere to
 * carry their own provenance.
 */
export default defineType({
  name: 'stationCategory',
  title: 'Station category',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Full label',
      type: 'string',
      description: 'Heads each card and names the tab for screen readers.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortLabel',
      title: 'Tab label',
      type: 'string',
      description:
        'What the tab displays. Keep it to one short word — six of these share a mobile width.',
      validation: (Rule) => Rule.required().max(12),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'shortLabel', maxLength: 24},
      description:
        'Matches the existing `data-group` values — boards, sea, fire, afield, italian, sweet. Note "afield" currently labels "Across Asia", which is a leftover rather than a rename; keep the slug stable regardless, the deep links use it.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: 'labelProvenance',
      title: 'Label — source & confirmation',
      type: 'provenance',
      description:
        'The six category labels are our editorial grouping, not the catalogue\'s, and are still awaiting the client\'s sign-off.',
    }),
  ],
  orderings: [{title: 'Tab order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {label: 'label', short: 'shortLabel', order: 'order'},
    prepare({label, short, order}) {
      return {title: label, subtitle: `tab: ${short} · #${order}`}
    },
  },
})
