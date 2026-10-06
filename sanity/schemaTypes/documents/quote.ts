import {defineArrayMember, defineField, defineType} from 'sanity'
import {DEFAULT_VAT_RATE} from '../../lib/constants'

/**
 * A priced quote — the thing a PDF is rendered from, and the thing the deposit
 * page displays.
 *
 * Field set mirrors `sandboxes/secure-booking.html` exactly, because that page
 * is already the agreed front end for this document: quote reference, couple's
 * name, date, time window, guest count, venue, categorised line items,
 * subtotal, discount, VAT, total, per-person figure, deposit percentage and
 * deposit amount.
 *
 * Everything financial is stored, not derived. The reasoning is on
 * `quoteLineItem` and matters enough to repeat: the one real client quote we
 * have does not reconcile between its excl.-VAT subtotal, its stated VAT and
 * its incl.-VAT total, and Bacchus's pricing is generated internally and
 * varies by season. A quote that recomputes itself would therefore drift away
 * from the document the couple actually received — and this is the document
 * someone is looking at while deciding to transfer several thousand euros.
 *
 * So: `subtotal`, `discountAmount`, `vatAmount`, `total` and `depositAmount`
 * are all stored as sent. `perPersonAmount` too, which is the one that looks
 * most obviously derivable. The generator computes them once, in integer
 * cents, and writes them here; nothing recomputes them afterwards.
 *
 * PDF generation is deterministic templating — HTML/CSS through
 * Puppeteer/Playwright. Never an LLM. A pricing document is the last place
 * generated prose belongs.
 */
export default defineType({
  name: 'quote',
  title: 'Quote',
  type: 'document',
  groups: [
    {name: 'summary', title: 'Summary', default: true},
    {name: 'pricing', title: 'Pricing'},
    {name: 'terms', title: 'Terms'},
  ],
  fields: [
    defineField({
      name: 'reference',
      title: 'Quote reference',
      type: 'string',
      group: 'summary',
      description:
        'Shown to the client on the quote and the deposit page. Generated, not typed — but stored, because it appears on a document that has left the building.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'summary',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Sent', value: 'sent'},
          {title: 'Accepted', value: 'accepted'},
          {title: 'Expired', value: 'expired'},
          {title: 'Superseded by a newer quote', value: 'superseded'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'booking',
      title: 'Booking',
      type: 'reference',
      group: 'summary',
      to: [{type: 'booking'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clientDisplayName',
      title: 'Addressed to',
      type: 'string',
      group: 'summary',
      description:
        'As it heads the quote — a couple, usually ("Bertha & Alex"). Stored rather than built from the booking, so a sent quote keeps the name it was sent with.',
      validation: (Rule) => Rule.required(),
    }),

    // --- The event, as quoted ----------------------------------------------
    defineField({
      name: 'eventDate',
      title: 'Event date',
      type: 'date',
      group: 'summary',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Start time',
      type: 'string',
      group: 'summary',
      description: '24-hour, e.g. "17:00".',
    }),
    defineField({
      name: 'endTime',
      title: 'End time',
      type: 'string',
      group: 'summary',
      description:
        'Standard package runs about five hours; some extend to six or eight. Bacchus advises against going beyond eight.',
    }),
    defineField({
      name: 'guestCount',
      title: 'Guests quoted',
      type: 'number',
      group: 'summary',
      description: 'The number the per-person lines were priced against.',
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: 'spaces',
      title: 'Spaces',
      type: 'array',
      group: 'summary',
      of: [defineArrayMember({type: 'reference', to: [{type: 'venueSpace'}]})],
    }),
    defineField({
      name: 'mealFormatTier',
      title: 'Meal format & tier',
      type: 'reference',
      group: 'summary',
      to: [{type: 'packageTier'}],
      description:
        'Exactly one of Reception, Banquet or High Tea — they are mutually exclusive meal formats, not courses that combine.',
    }),
    defineField({
      name: 'beverageSelections',
      title: 'Beverage',
      type: 'array',
      group: 'summary',
      of: [defineArrayMember({type: 'reference', to: [{type: 'packageTier'}]})],
      description:
        'Additive and chosen alongside the meal format, never instead of it. More than one is allowed — the beverage categories combine freely.',
    }),

    // --- Pricing ------------------------------------------------------------
    defineField({
      name: 'lineItems',
      title: 'Line items',
      type: 'array',
      group: 'pricing',
      of: [defineArrayMember({type: 'quoteLineItem'})],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'subtotal',
      title: 'Subtotal (EUR)',
      type: 'number',
      group: 'pricing',
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: 'discountAmount',
      title: 'Discount (EUR)',
      type: 'number',
      group: 'pricing',
      description: 'A positive number; rendered as a negative line.',
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: 'discountReason',
      title: 'Discount reason',
      type: 'string',
      group: 'pricing',
      hidden: ({document}) => !document?.discountAmount,
    }),
    defineField({
      name: 'vatRate',
      title: 'VAT rate (%)',
      type: 'number',
      group: 'pricing',
      initialValue: DEFAULT_VAT_RATE,
      description:
        'Malta\'s standard rate. Client correspondence confirms quoted prices include VAT.',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'vatAmount',
      title: 'VAT amount (EUR)',
      type: 'number',
      group: 'pricing',
      description: 'As stated on the quote. Not recomputed from the rate — see the note on this type.',
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: 'total',
      title: 'Total (EUR)',
      type: 'number',
      group: 'pricing',
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: 'perPersonAmount',
      title: 'Per person (EUR)',
      type: 'number',
      group: 'pricing',
      description: 'Shown under the total. Stored as sent, even though it looks derivable.',
      validation: (Rule) => Rule.precision(2),
    }),

    // --- Terms --------------------------------------------------------------
    defineField({
      name: 'depositPercent',
      title: 'Deposit (%)',
      type: 'number',
      group: 'terms',
      description:
        'CONTESTED. The catalogue states 30% non-refundable with the balance due 14 days before the event; client correspondence describes the terms as flexible without reaffirming that split. Per quote rather than hardcoded for exactly that reason — and confirm which actually governs before wiring real deposit logic.',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'depositAmount',
      title: 'Deposit due (EUR)',
      type: 'number',
      group: 'terms',
      validation: (Rule) => Rule.precision(2),
    }),
    defineField({
      name: 'balanceDueDate',
      title: 'Balance due',
      type: 'date',
      group: 'terms',
    }),
    defineField({
      name: 'validUntil',
      title: 'Quote valid until',
      type: 'date',
      group: 'terms',
      description:
        'Worth having given pricing moves by season — a quote with no expiry is a price promise nobody agreed to make.',
    }),
    defineField({
      name: 'termsProvenance',
      title: 'Terms — source & confirmation',
      type: 'provenance',
      group: 'terms',
      description: 'Expect "contested" until the deposit/cancellation conflict is settled.',
    }),
    defineField({
      name: 'pdf',
      title: 'Generated PDF',
      type: 'file',
      group: 'terms',
      options: {accept: 'application/pdf'},
      description: 'The rendered document as sent. The archive copy, not a regenerable artefact.',
    }),
    defineField({
      name: 'internalNotes',
      title: 'Internal notes',
      type: 'text',
      group: 'terms',
      rows: 4,
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'createdDesc', by: [{field: '_createdAt', direction: 'desc'}]},
    {title: 'Event date', name: 'eventDateAsc', by: [{field: 'eventDate', direction: 'asc'}]},
  ],
  preview: {
    select: {
      reference: 'reference',
      name: 'clientDisplayName',
      total: 'total',
      status: 'status',
      date: 'eventDate',
    },
    prepare({reference, name, total, status, date}) {
      return {
        title: `${reference} — ${name ?? ''}`.trim(),
        subtitle: [
          status,
          date ? new Date(date).toLocaleDateString('en-GB') : null,
          total ? `€${Number(total).toFixed(2)}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
