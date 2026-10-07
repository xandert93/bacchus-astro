import { defineArrayMember, defineField, defineType } from "sanity"
import { BOOKING_STATUSES, EVENT_STYLES, EVENT_TYPES } from "../../lib/constants"

/**
 * An enquiry, and the booking it may become. One document, one lifecycle.
 *
 * This is the single source of truth for public availability. The calendar
 * derives its three states from these records and stores nothing of its own —
 * there is deliberately no `availability` document, because a calendar a human
 * keeps in sync by hand is a calendar that is wrong. See
 * `queries/availability.ts` for the derivation.
 *
 * A `pending` booking IS the enquiry; the vocabulary follows the project's own
 * ("the booking record itself has a status field"). Several pending bookings
 * may legitimately share one date — the whole point of showing "Enquiries
 * received" rather than hiding contested dates — and at most one may be
 * `confirmed`. That last constraint CANNOT be enforced here: Sanity validation
 * runs against one document and cannot see its siblings, and two editors can
 * publish concurrently regardless. It has to be enforced by the serverless
 * layer, and the deposit race is the reason it matters — whichever pending
 * enquiry pays first auto-confirms by webhook, and the others are marked
 * unavailable and notified rather than left dangling. The `async` custom rule
 * below surfaces a conflict in the Studio so staff are not flying blind, but
 * treat it as a warning light, not a lock.
 *
 * Field set mirrors the live four-step wizard exactly, so the submission
 * handler is a mapping rather than a redesign:
 *   step 1  eventType, eventDate (or eventDateFlexible), backupDate
 *   step 2  guestCount, spacesOfInterest, eventStyle, message
 *   step 3  firstName, lastName, email, phone, consent
 *   step 4  review only — no fields of its own
 */
export default defineType({
  name: "booking",
  title: "Booking / enquiry",
  type: "document",
  groups: [
    { name: "event", title: "The event", default: true },
    { name: "client", title: "Client" },
    { name: "lifecycle", title: "Status & history" },
    { name: "money", title: "Quote & payment" },
    { name: "admin", title: "Admin" },
  ],
  fields: [
    // --- Status -------------------------------------------------------------
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "lifecycle",
      options: { list: [...BOOKING_STATUSES], layout: "radio" },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "statusHistory",
      title: "Status history",
      type: "array",
      group: "lifecycle",
      of: [defineArrayMember({ type: "statusEvent" })],
      description:
        "Append-only by convention; written by the serverless layer. Do not prune — the deposit race and the waitlist trigger are both reconstructed from this.",
    }),

    // --- The event ----------------------------------------------------------
    defineField({
      name: "eventType",
      title: "Event type",
      type: "string",
      group: "event",
      options: { list: [...EVENT_TYPES], layout: "radio" },
      description:
        '"Other" is the intake safety valve — a proposal, a photo shoot, a wake. Someone who cannot see themselves in the first three options abandons the form instead.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "eventDate",
      title: "Preferred date",
      type: "date",
      group: "event",
      description:
        "Weddings are date-exclusive — one a day — so only weddings affect the public calendar. Every other event type can share a date.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as
            { eventType?: string; dateIsFlexible?: boolean } | undefined
          if (!value && doc?.eventType === "wedding" && !doc?.dateIsFlexible) {
            return 'A wedding enquiry needs a date, or "date is flexible" ticked.'
          }
          return true
        }),
    }),
    defineField({
      name: "dateIsFlexible",
      title: "Date is flexible / not yet chosen",
      type: "boolean",
      group: "event",
      initialValue: false,
      description:
        "A flexible enquiry must NOT contribute to any date's public status, or it marks a date contested that nobody has actually asked for.",
    }),
    defineField({
      name: "backupDate",
      title: "Alternative date",
      type: "date",
      group: "event",
      description:
        "For Bacchus's reference only. Explicitly does NOT hold or reserve a date, and must never be counted by the availability query — the form promises exactly this.",
    }),
    defineField({
      name: "guestCount",
      title: "Expected guests",
      type: "number",
      group: "event",
      description:
        "An estimate. Above 150 the downstairs à la carte restaurant closes to the public, which is worth staff seeing at a glance.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "spacesOfInterest",
      title: "Spaces of interest",
      type: "array",
      group: "event",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
      description:
        'Wedding enquiries only — the form hides this field otherwise. "Not sure yet" is a real answer and is stored by leaving this empty with the note below set.',
    }),
    defineField({
      name: "spacesGuidanceRequested",
      title: "Asked us to guide them on spaces",
      type: "boolean",
      group: "event",
      initialValue: false,
      description:
        'The form\'s "Not sure yet" option. Not the same as skipping the question.',
    }),
    defineField({
      name: "eventStyle",
      title: "Tone",
      type: "string",
      group: "event",
      options: { list: [...EVENT_STYLES] },
      description:
        'Intake colour for the events team. The form is explicit that this is "a starting point, not a package" — never treat it as a package selection.',
    }),
    defineField({
      name: "message",
      title: "Anything else we should know",
      type: "text",
      group: "event",
      rows: 5,
      description:
        "Capped at 500 characters by the form. Currently also the only place a menu-tasting request can arrive, pending confirmation of how tastings are actually scheduled.",
      validation: (Rule) => Rule.max(500),
    }),

    // --- Client -------------------------------------------------------------
    defineField({
      name: "firstName",
      title: "First name",
      type: "string",
      group: "client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lastName",
      title: "Last name",
      type: "string",
      group: "client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "partnerName",
      title: "Partner name",
      type: "string",
      group: "client",
      description:
        'Optional, and only worth asking for where it makes sense — a wedding, chiefly. Quotes and the deposit page address a couple ("Bertha & Alex"), so the second name lives here rather than being parsed back out of a single field. Left empty, a quote is addressed to the enquirer alone; nothing downstream requires it.',
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      group: "client",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      group: "client",
      description:
        "Free text — international formats vary and most clients type their own.",
    }),
    defineField({
      name: "consent",
      title: "Consent",
      type: "consentRecord",
      group: "client",
      description:
        "Personal data. See the note on the consent type before changing anything here.",
    }),

    // --- Money --------------------------------------------------------------
    defineField({
      name: "quote",
      title: "Quote",
      type: "reference",
      group: "money",
      to: [{ type: "quote" }],
      description:
        "The quote sent for this booking. Its figures are a snapshot, not a live price.",
    }),
    defineField({
      name: "payments",
      title: "Payments",
      type: "array",
      group: "money",
      of: [defineArrayMember({ type: "paymentRecord" })],
      description:
        "The first received deposit is what auto-confirms the date. Written by the payment webhook.",
    }),
    defineField({
      name: "depositHoldExpiresAt",
      title: "Deposit hold expires",
      type: "datetime",
      group: "money",
      description:
        "Set when the deposit link is issued. The deposit page currently states a 7-day hold, which is illustrative and unconfirmed — do not treat it as policy until Bacchus says so.",
    }),

    // --- Admin --------------------------------------------------------------
    defineField({
      name: "sourcePage",
      title: "Submitted from",
      type: "string",
      group: "admin",
      readOnly: true,
      description:
        "Five pages carry the wizard. Useful for knowing which entry point converts.",
    }),
    defineField({
      name: "suggestedReply",
      title: "Suggested reply (draft)",
      type: "text",
      group: "admin",
      rows: 8,
      description:
        "Drafted by a cheap/fast model when the enquiry arrives and included in the staff notification email. Never auto-sent, and never shown to the client — a human edits and sends it.",
    }),
    defineField({
      name: "internalNotes",
      title: "Internal notes",
      type: "text",
      group: "admin",
      rows: 5,
    }),
  ],

  validation: (Rule) =>
    Rule.custom(async (doc, context) => {
      // Advisory only. Two staff publishing at once will still both succeed;
      // the real guard is the serverless layer. This exists so a human in the
      // Studio is not the last to find out.
      const typed = doc as
        | { status?: string; eventType?: string; eventDate?: string; _id?: string }
        | undefined
      if (
        typed?.status !== "confirmed" ||
        typed?.eventType !== "wedding" ||
        !typed?.eventDate
      ) {
        return true
      }
      const client = context.getClient({ apiVersion: "2024-10-01" })
      const baseId = (typed._id ?? "").replace(/^drafts\./, "")
      const clash = await client.fetch<string | null>(
        `*[
          _type == "booking" &&
          eventType == "wedding" &&
          status == "confirmed" &&
          eventDate == $date &&
          !(_id in [$id, "drafts." + $id])
        ][0]._id`,
        { date: typed.eventDate, id: baseId },
      )
      return clash
        ? "Another wedding is already confirmed on this date. One wedding a day — check before publishing."
        : true
    }),

  orderings: [
    {
      title: "Event date, soonest first",
      name: "eventDateAsc",
      by: [{ field: "eventDate", direction: "asc" }],
    },
    {
      title: "Recently submitted",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],

  preview: {
    select: {
      first: "firstName",
      last: "lastName",
      date: "eventDate",
      flexible: "dateIsFlexible",
      status: "status",
      type: "eventType",
      guests: "guestCount",
    },
    prepare: ({ first, last, date, flexible, status, type, guests }) => {
      const when = date
        ? new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : flexible
          ? "date flexible"
          : "no date"
      return {
        title: `${first ?? ""} ${last ?? ""}`.trim() || "Unnamed enquiry",
        subtitle: [status, type, when, guests ? `${guests} guests` : null]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
