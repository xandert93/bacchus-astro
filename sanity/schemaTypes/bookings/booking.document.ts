import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle"
import { CloseCircleIcon } from "@sanity/icons/CloseCircle"
import { InboxIcon } from "@sanity/icons/Inbox"
import { RemoveCircleIcon } from "@sanity/icons/RemoveCircle"
import { StarIcon } from "@sanity/icons/Star"
import type { ComponentType } from "react"
import { defineArrayMember, defineField, defineType } from "sanity"
import { BOOKING_STATUSES, EVENT_STYLES, EVENT_TYPES } from "../../lib/constants"
import { help } from "../../lib/help"
import { formatDate, joinParts, optionTitle, pluralise } from "../../lib/preview"

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
 *
 * Field notes the help text leaves out, because staff don't need them:
 *   - `statusHistory` is append-only by convention and written by the
 *     serverless layer; the deposit race and the waitlist trigger are both
 *     reconstructed from it.
 *   - `dateIsFlexible` must never count towards a date's public status, and
 *     neither may `backupDate`: the form promises it holds nothing.
 *   - `eventType` "Other" is the intake safety valve. Someone who can't see
 *     themselves in the first three options abandons the form instead.
 *   - `partnerName` lives in its own field so quotes can address a couple
 *     ("Bertha & Alex") without parsing it out of a single name.
 */

const STATUS_ICONS: Record<string, ComponentType> = {
  pending: InboxIcon,
  confirmed: CheckmarkCircleIcon,
  declined: CloseCircleIcon,
  cancelled: RemoveCircleIcon,
  completed: StarIcon,
}
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
      description: help(
        "Every change of status, recorded automatically.",
        "Don't edit or delete entries: this is how we work out later who changed what, and why.",
      ),
    }),

    // --- The event ----------------------------------------------------------
    defineField({
      name: "eventType",
      title: "Event type",
      type: "string",
      group: "event",
      options: { list: [...EVENT_TYPES], layout: "radio" },
      description:
        '"Other" covers anything else, such as a proposal, a photo shoot or a wake.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "eventDate",
      title: "Preferred date",
      type: "date",
      group: "event",
      description: help(
        "Only one wedding can be booked per day, so only weddings affect the public calendar.",
        "Other events can share a date.",
      ),
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
        "Ticked when the client hasn't chosen a date yet. Their enquiry doesn't show on the public calendar.",
    }),
    defineField({
      name: "backupDate",
      title: "Alternative date",
      type: "date",
      group: "event",
      description: help(
        "For reference only.",
        "This date is not held or reserved, and the client was told so on the form.",
      ),
    }),
    defineField({
      name: "guestCount",
      title: "Expected guests",
      type: "number",
      group: "event",
      description: help(
        "The client's estimate.",
        "Above 150 guests, the downstairs à la carte restaurant closes to the public.",
      ),
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "spacesOfInterest",
      title: "Spaces of interest",
      type: "array",
      group: "event",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
      description: help(
        "Wedding enquiries only.",
        'Empty, with the box below ticked, means the client chose "Not sure yet".',
      ),
    }),
    defineField({
      name: "spacesGuidanceRequested",
      title: "Asked us to guide them on spaces",
      type: "boolean",
      group: "event",
      initialValue: false,
      description: help(
        'The client chose "Not sure yet" and would like us to suggest spaces.',
        "Unticked with no spaces chosen means they skipped the question.",
      ),
    }),
    defineField({
      name: "eventStyle",
      title: "Tone",
      type: "string",
      group: "event",
      options: { list: [...EVENT_STYLES] },
      description: help(
        "The feel the client is after.",
        'The form calls this "a starting point, not a package", so don\'t treat it as a package choice.',
      ),
    }),
    defineField({
      name: "message",
      title: "Anything else we should know",
      type: "text",
      group: "event",
      rows: 5,
      description: help(
        "Up to 500 characters.",
        "Check here for menu tasting requests: for now, this is the only place they arrive.",
      ),
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
      description: help(
        "Optional. Mostly for weddings.",
        'When filled in, quotes are addressed to the couple, e.g. "Bertha & Alex". When empty, they are addressed to the enquirer alone.',
      ),
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
        "As the client typed it. International formats vary, so any format is accepted.",
    }),
    defineField({
      name: "consent",
      title: "Consent",
      type: "consentRecord",
      group: "client",
      description: "Recorded by the form. Don't change it by hand.",
    }),

    // --- Money --------------------------------------------------------------
    defineField({
      name: "quote",
      title: "Quote",
      type: "reference",
      group: "money",
      to: [{ type: "quote" }],
      description: help(
        "The quote sent for this booking.",
        "Its prices stay as sent, even if package prices change later.",
      ),
    }),
    defineField({
      name: "payments",
      title: "Payments",
      type: "array",
      group: "money",
      of: [defineArrayMember({ type: "paymentRecord" })],
      description: help(
        "Recorded automatically when a payment arrives.",
        "The first deposit received confirms the booking and holds the date.",
      ),
    }),
    defineField({
      name: "depositHoldExpiresAt",
      title: "Deposit hold expires",
      type: "datetime",
      group: "money",
      description: help(
        "Set automatically when the deposit link is sent.",
        "The deposit page currently says the date is held for 7 days. That is a placeholder, not yet confirmed by Bacchus.",
      ),
    }),

    // --- Admin --------------------------------------------------------------
    defineField({
      name: "sourcePage",
      title: "Submitted from",
      type: "string",
      group: "admin",
      readOnly: true,
      description: "The page the enquiry was sent from.",
    }),
    defineField({
      name: "suggestedReply",
      title: "Suggested reply (draft)",
      type: "text",
      group: "admin",
      rows: 8,
      description: help(
        "A draft reply written by AI when the enquiry arrives. It is also in the email staff receive.",
        "It is never sent automatically. Check and edit it before sending it yourself.",
      ),
    }),
    defineField({
      name: "internalNotes",
      title: "Internal notes",
      type: "text",
      group: "admin",
      rows: 5,
      description: "For staff only. Never shown to the client.",
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
    prepare: ({ first, last, date, flexible, status, type, guests }) => ({
      title: `${first ?? ""} ${last ?? ""}`.trim() || "Unnamed enquiry",
      subtitle: joinParts(
        optionTitle(BOOKING_STATUSES, status),
        optionTitle(EVENT_TYPES, type),
        formatDate(date) ?? (flexible ? "Date flexible" : "No date"),
        pluralise(guests, "guest"),
      ),
      media: STATUS_ICONS[status] ?? InboxIcon,
    }),
  },
})
