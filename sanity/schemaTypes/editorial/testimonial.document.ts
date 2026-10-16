import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { photoField } from "../../lib/photoField"
import { formatDate, joinParts, optionTitle } from "../../lib/preview"

/**
 * A real client review.
 *
 * Four exist today, client-provided, live in the rotator on the homepage and
 * the weddings page. They were front-loaded by hand from
 * `docs/testimonials-raw.md`, NOT through the collection pipeline below, which
 * is not built yet.
 *
 * The intended pipeline, for context on why the fields are shaped this way: a
 * Cloudflare Cron Trigger (a Worker run on a schedule, polling daily — not a webhook, because this
 * is a time-based trigger rather than a reaction to an event) moves a booking
 * Confirmed -> Completed some days after the event date, which triggers a
 * review-request email carrying an explicit opt-in for name and photo use.
 * Submissions are reviewed manually before publishing. Visitor-submitted
 * content is never auto-published, which is why `status` starts at `submitted`
 * and nothing renders below `published`.
 *
 * Consent is TWO separate booleans, not one. A reviewer can be happy to be
 * quoted by name and unwilling to have their photograph used, and collapsing
 * that into a single "consent" flag loses the distinction at exactly the point
 * it matters. `displayName` is separate again, so "Marvin W" can be published
 * from a full name held on the record — which is what two of the four real
 * testimonials already do.
 *
 * `category` and `location` are optional on purpose. All four current
 * testimonials read "Malta" and all four are weddings, so the fields carry no
 * information today; they are worth keeping only if a wider set eventually
 * differentiates. The rotator gives the NAME its own line above the smaller
 * category/location/date line precisely because the name is the part that
 * actually distinguishes one testimonial from another.
 */
const TESTIMONIAL_STATUSES = [
  { title: "Submitted — Awaiting Review", value: "submitted" },
  { title: "Approved — Cleared, Not Yet Live", value: "approved" },
  { title: "Published", value: "published" },
  { title: "Withheld", value: "withheld" },
] as const

export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "consent", title: "Consent & Publication" },
  ],
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "emphasisedQuote",
      group: "content",
      description: help(
        "The reviewer's own words, unchanged.",
        'Highlight one phrase with "Gold Emphasis" to show it in gold on the site.',
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      group: "content",
      options: { list: [1, 2, 3, 4, 5] },
      initialValue: 5,
      description: "Shown as stars.",
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Wedding", value: "wedding" },
          { title: "Corporate", value: "corporate" },
          { title: "Celebration", value: "celebration" },
          { title: "Restaurant", value: "restaurant" },
        ],
      },
      description: "Optional. The type of event they reviewed.",
    }),
    defineField({
      name: "eventDate",
      title: "Event Date",
      type: "date",
      group: "content",
      description: "Optional. Only if the reviewer mentioned it.",
    }),
    defineField({
      name: "author",
      title: "Reviewer",
      type: "object",
      group: "content",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "fullName",
          title: "Full Name (Internal)",
          type: "string",
          description: 'For our records. The site shows "Name as Published" instead.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "displayName",
          title: "Name as Published",
          type: "string",
          description:
            'What the site shows, e.g. "Mandy & Gabriel Camenzuli", or "Marvin W" where they only gave an initial.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "location",
          title: "Location",
          type: "string",
          description: "Optional.",
        }),
        photoField({
          name: "photo",
          title: "Photograph",
          hidden: ({ document }) =>
            !(document?.permissions as { usePhoto?: boolean } | undefined)?.usePhoto,
        }),
      ],
    }),

    // --- Consent & publication ---------------------------------------------
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "consent",
      options: { list: [...TESTIMONIAL_STATUSES], layout: "radio" },
      initialValue: "submitted",
      description: help(
        'Only "Published" testimonials appear on the site.',
        "A new submission always needs a person to review it first.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "permissions",
      title: "Permissions Given",
      type: "object",
      group: "consent",
      options: { collapsible: false, columns: 2 },
      description: "Separate permissions: they may agree to one and not the other.",
      fields: [
        defineField({
          name: "useName",
          title: "Their Name Being Used",
          type: "boolean",
          initialValue: false,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const document = context.document as { status?: string } | undefined

              return document?.status === "published" && !value
                ? "Tick this before publishing: we need their consent to use their name."
                : true
            }),
        }),
        defineField({
          name: "usePhoto",
          title: "Their Photograph Being Used",
          type: "boolean",
          initialValue: false,
        }),
      ],
    }),
    defineField({
      name: "consent",
      title: "Consent Record",
      type: "consentRecord",
      group: "consent",
    }),
    defineField({
      name: "sourceBooking",
      title: "From This Booking",
      type: "reference",
      group: "consent",
      to: [{ type: "booking" }],
      description:
        "Empty for the first four, which were added by hand before bookings were recorded here.",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "consent",
      validation: (Rule) => Rule.integer(),
    }),
  ],
  orderings: [
    {
      title: "Manual Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Event Date, Newest",
      name: "eventDesc",
      by: [{ field: "eventDate", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      name: "author.displayName",
      status: "status",
      rating: "rating",
      date: "eventDate",
    },
    prepare: ({ name, status, rating, date }) => ({
      title: name ?? "Unnamed",
      subtitle: joinParts(
        "★".repeat(Number(rating ?? 0)),
        optionTitle(TESTIMONIAL_STATUSES, status),
        formatDate(date),
      ),
    }),
  },
})
