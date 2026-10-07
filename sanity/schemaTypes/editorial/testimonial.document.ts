import { defineField, defineType } from "sanity"

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
export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "consent", title: "Consent & publication" },
  ],
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "emphasisedQuote",
      group: "content",
      description:
        "The reviewer's own words. Mark one phrase with Gold emphasis — that is our editorial pick, not theirs, and it renders in gold in the rotator.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "authorFullName",
      title: "Full name (internal)",
      type: "string",
      group: "content",
      description: "Held on the record. Not what gets published — see below.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "displayName",
      title: "Name as published",
      type: "string",
      group: "content",
      description:
        'What appears on the site — "Mandy & Gabriel Camenzuli", or "Marvin W" where only an initial was given.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      group: "content",
      options: { list: [1, 2, 3, 4, 5] },
      initialValue: 5,
      description: "Renders as the five staggered stars.",
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "content",
      description:
        'Optional. Currently "Malta" on all four, so it differentiates nothing.',
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
      description:
        "Optional, same reason as location. Note the celebrations page had its placeholder quote removed rather than filled, because none of the four is celebration-specific.",
    }),
    defineField({
      name: "eventDate",
      title: "Event date",
      type: "date",
      group: "content",
      description: "As the reviewer gave it where they did — one cites 26 April 2014.",
    }),
    defineField({
      name: "photo",
      title: "Photograph",
      type: "image",
      group: "content",
      options: { hotspot: true },
      hidden: ({ document }) => !document?.consentPhoto,
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // --- Consent & publication ---------------------------------------------
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "consent",
      options: {
        list: [
          { title: "Submitted — awaiting review", value: "submitted" },
          { title: "Approved — cleared, not yet live", value: "approved" },
          { title: "Published", value: "published" },
          { title: "Withheld", value: "withheld" },
        ],
        layout: "radio",
      },
      initialValue: "submitted",
      description: 'Only "Published" renders. Never auto-advance this from a submission.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "consentName",
      title: "Consented to name being used",
      type: "boolean",
      group: "consent",
      initialValue: false,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { status?: string } | undefined
          if (doc?.status === "published" && !value) {
            return "Cannot publish a named testimonial without consent for the name."
          }
          return true
        }),
    }),
    defineField({
      name: "consentPhoto",
      title: "Consented to photograph being used",
      type: "boolean",
      group: "consent",
      initialValue: false,
      description:
        "Separate from the name. A reviewer may agree to one and not the other.",
    }),
    defineField({
      name: "consent",
      title: "Consent record",
      type: "consentRecord",
      group: "consent",
    }),
    defineField({
      name: "sourceBooking",
      title: "From this booking",
      type: "reference",
      group: "consent",
      to: [{ type: "booking" }],
      description:
        "Empty for the four front-loaded by hand — they predate the pipeline and have no booking record.",
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
      title: "Manual order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Event date, newest",
      name: "eventDesc",
      by: [{ field: "eventDate", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      name: "displayName",
      status: "status",
      rating: "rating",
      date: "eventDate",
    },
    prepare: ({ name, status, rating, date }) => ({
      title: name ?? "Unnamed",
      subtitle: [
        "★".repeat(Number(rating ?? 0)),
        status,
        date ? new Date(date).toLocaleDateString("en-GB") : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
})
