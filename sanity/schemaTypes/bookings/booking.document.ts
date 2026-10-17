import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle"
import { ClockIcon } from "@sanity/icons/Clock"
import { CloseCircleIcon } from "@sanity/icons/CloseCircle"
import { CommentIcon } from "@sanity/icons/Comment"
import { InboxIcon } from "@sanity/icons/Inbox"
import { LeaveIcon } from "@sanity/icons/Leave"
import { RemoveCircleIcon } from "@sanity/icons/RemoveCircle"
import { StarIcon } from "@sanity/icons/Star"
import type { ComponentType } from "react"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  BOOKING_STATUSES,
  CONTACT_PREFERENCES,
  EVENT_STYLES,
  EVENT_TYPES,
  type BookingStatus,
} from "../../lib/constants"
import { help } from "../../lib/help"
import { formatDate, joinParts, optionTitle, pluralise } from "../../lib/preview"

/**
 * An enquiry, and the booking it may become. One document, one lifecycle:
 * the statuses and what each means are in `lib/constants.ts`.
 *
 * This is the single source of truth for public availability. The calendar
 * derives its three states from these records and stores nothing of its own —
 * there is deliberately no `availability` document, because a calendar a human
 * keeps in sync by hand is a calendar that is wrong. See
 * `queries/availability.ts` for the derivation.
 *
 * Several open enquiries may legitimately share one date — the whole point of
 * showing "Enquiries received" rather than hiding contested dates — and at
 * most one may be `confirmed`. That last constraint CANNOT be enforced here:
 * Sanity validation runs against one document and cannot see its siblings,
 * and two editors can publish concurrently regardless. It has to be enforced
 * by the serverless layer, and the deposit race is the reason it matters —
 * whichever enquiry pays first auto-confirms by webhook, and the others are
 * declined and notified rather than left dangling. The `async` custom rule
 * below surfaces a conflict in the Studio so staff are not flying blind, but
 * treat it as a warning light, not a lock.
 *
 * Related fields are grouped into objects (`client`, `event`) so the site and
 * the serverless code read one shape, e.g. `booking.event.date`. The groups
 * mirror the four-step enquiry wizard, so the submission handler is a
 * mapping rather than a redesign:
 *   step 1  event.type, event.date (or event.dateIsFlexible), event.backupDate
 *   step 2  event.guestCount, event.spaces, event.style, message
 *   step 3  client.*, consent
 *   step 4  review only — no fields of its own
 *
 * Field notes the help text leaves out, because staff don't need them:
 *   - `statusHistory` is append-only by convention and written by the
 *     serverless layer; the deposit race and the waitlist trigger are both
 *     reconstructed from it.
 *   - `event.dateIsFlexible` must never count towards a date's public status,
 *     and neither may `event.backupDate`: the form promises it holds nothing.
 *   - `event.type` "Other" is the intake safety valve. Someone who can't see
 *     themselves in the first three options abandons the form instead.
 *   - `client.partnerName` lives in its own field so quotes can address a
 *     couple ("Bertha & Alex") without parsing it out of a single name.
 */

const STATUS_ICONS: Record<BookingStatus, ComponentType> = {
  new: InboxIcon,
  "in-discussion": CommentIcon,
  "awaiting-deposit": ClockIcon,
  confirmed: CheckmarkCircleIcon,
  completed: StarIcon,
  declined: CloseCircleIcon,
  withdrawn: LeaveIcon,
  cancelled: RemoveCircleIcon,
}

type EventValue = { type?: string; date?: string; dateIsFlexible?: boolean } | undefined

export default defineType({
  name: "booking",
  title: "Enquiry / Booking",
  type: "document",
  groups: [
    { name: "enquiry", title: "Enquiry", default: true },
    { name: "history", title: "Status History" },
    { name: "money", title: "Quote & Payment" },
    { name: "admin", title: "Notes & Admin" },
  ],
  fields: [
    // --- Status -------------------------------------------------------------
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: ["enquiry", "history"],
      options: { list: [...BOOKING_STATUSES], layout: "dropdown" },
      initialValue: "new",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "statusHistory",
      title: "Status History",
      type: "array",
      group: "history",
      of: [defineArrayMember({ type: "statusEvent" })],
      description: help(
        "Every change of status, recorded automatically.",
        "Don't edit or delete entries: this is how we work out later who changed what, and why.",
      ),
    }),

    // --- The client ---------------------------------------------------------
    defineField({
      name: "client",
      title: "Client",
      type: "object",
      group: "enquiry",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "firstName",
          title: "First Name",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "lastName",
          title: "Last Name",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "partnerName",
          title: "Partner Name",
          type: "string",
          hidden: ({ document }) => (document?.event as EventValue)?.type !== "wedding",
          description: help(
            "Optional.",
            'When filled in, quotes are addressed to the couple, e.g. "Bertha & Alex". When empty, they are addressed to the enquirer alone.',
          ),
        }),
        defineField({
          name: "email",
          title: "Email",
          type: "string",
          validation: (Rule) => Rule.required().email(),
        }),
        defineField({
          name: "phone",
          title: "Phone",
          type: "string",
          description:
            "As the client typed it. International formats vary, so any format is accepted.",
        }),
        defineField({
          name: "contactPreference",
          title: "Prefers To Be Contacted By",
          type: "string",
          options: {
            list: [...CONTACT_PREFERENCES],
            layout: "radio",
            direction: "horizontal",
          },
        }),
      ],
    }),

    // --- The event ----------------------------------------------------------
    defineField({
      name: "event",
      title: "The Event",
      type: "object",
      group: "enquiry",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "type",
          title: "Event Type",
          type: "string",
          options: { list: [...EVENT_TYPES], layout: "radio", direction: "horizontal" },
          description:
            '"Other" covers anything else, such as a proposal, a photo shoot or a wake.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "date",
          title: "Preferred Date",
          type: "date",
          description: help(
            "Only one wedding can be booked per day, so only weddings affect the public calendar.",
            "Other events can share a date.",
          ),
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const event = context.parent as EventValue

              if (!value && event?.type === "wedding" && !event?.dateIsFlexible) {
                return 'A wedding enquiry needs a date, or "Date Is Flexible" ticked.'
              }

              return true
            }),
        }),
        defineField({
          name: "dateIsFlexible",
          title: "Date Is Flexible / Not Yet Chosen",
          type: "boolean",
          initialValue: false,
          description:
            "Ticked when the client hasn't chosen a date yet. Their enquiry doesn't show on the public calendar.",
        }),
        defineField({
          name: "backupDate",
          title: "Alternative Date",
          type: "date",
          description: help(
            "For reference only.",
            "This date is not held or reserved, and the client was told so on the form.",
          ),
        }),
        defineField({
          name: "guestCount",
          title: "Expected Guests",
          type: "number",
          description: help(
            "The client's estimate.",
            "Above 150 guests, the downstairs à la carte restaurant closes to the public.",
          ),
          validation: (Rule) => Rule.min(1).integer(),
        }),
        defineField({
          name: "spaces",
          title: "Spaces of Interest",
          type: "array",
          of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
          hidden: ({ parent }) => (parent as EventValue)?.type === "wedding",
          description:
            'Empty, with the box below ticked, means the client chose "Not sure yet".',
        }),
        defineField({
          name: "spacesGuidanceRequested",
          title: "Asked Us to Guide Them on Spaces",
          type: "boolean",
          initialValue: false,
          hidden: ({ parent }) => (parent as EventValue)?.type === "wedding",
          description: help(
            'The client chose "Not sure yet" and would like us to suggest spaces.',
            "Unticked with no spaces chosen means they skipped the question.",
          ),
        }),
        defineField({
          name: "style",
          title: "Tone",
          type: "string",
          hidden: ({ parent }) => (parent as EventValue)?.type !== "wedding",
          options: { list: [...EVENT_STYLES] },
          description: help(
            "The feel the client is after.",
            'The form calls this "a starting point, not a package", so don\'t treat it as a package choice.',
          ),
        }),
      ],
    }),
    defineField({
      name: "confirmationEmail",
      title: "Confirmation Email",
      type: "object",
      group: ["enquiry", "admin"],
      readOnly: true,
      options: { collapsible: false, columns: 2 },
      description: help(
        "The email the client got when they enquired. Recorded automatically.",
        "If it bounced, their email address doesn't work: phone them instead.",
      ),
      fields: [
        defineField({
          name: "status",
          title: "Status",
          type: "string",
          options: {
            list: [
              { title: "Sent", value: "sent" },
              { title: "Couldn't Be Sent", value: "failed" },
              { title: "Bounced: Address Doesn't Work", value: "bounced" },
            ],
          },
        }),
        defineField({ name: "at", title: "When", type: "datetime" }),
        defineField({ name: "note", title: "Reason Given", type: "string" }),
      ],
    }),
    defineField({
      name: "message",
      title: "Anything Else We Should Know",
      type: "text",
      group: "enquiry",
      rows: 5,
      description: help(
        "The client's message, up to 500 characters.",
        "Check here for menu tasting requests: for now, this is the only place they arrive.",
      ),
      validation: (Rule) => Rule.max(500),
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
      title: "Deposit Hold Expires",
      type: "datetime",
      group: "money",
      description: "Set automatically when the deposit link is sent.",
    }),

    // --- Notes & admin ------------------------------------------------------
    defineField({
      name: "internalNotes",
      title: "Internal Notes",
      type: "text",
      group: ["enquiry", "admin"],
      rows: 5,
      description: "For staff only. Never shown to the client.",
    }),
    defineField({
      name: "suggestedReply",
      title: "Suggested Reply (Draft)",
      type: "text",
      group: "admin",
      rows: 8,
      description: help(
        "A draft reply written by AI when the enquiry arrives. It is also in the email staff receive.",
        "It is never sent automatically. Check and edit it before sending it yourself.",
      ),
    }),
    defineField({
      name: "consent",
      title: "Consent",
      type: "consentRecord",
      group: "admin",
      description: "Recorded by the form. Don't change it by hand.",
    }),
    defineField({
      name: "sourcePage",
      title: "Submitted From",
      type: "string",
      group: "admin",
      readOnly: true,
      description: "The page the enquiry was sent from.",
    }),
  ],

  validation: (Rule) =>
    Rule.custom(async (doc, context) => {
      // Advisory only. Two staff publishing at once will still both succeed;
      // the real guard is the serverless layer. This exists so a human in the
      // Studio is not the last to find out.
      const typed = doc as
        { status?: string; event?: EventValue; _id?: string } | undefined

      if (
        typed?.status !== "confirmed" ||
        typed?.event?.type !== "wedding" ||
        !typed?.event?.date
      ) {
        return true
      }

      const client = context.getClient({ apiVersion: "2024-10-01" })
      const baseId = (typed._id ?? "").replace(/^drafts\./, "")
      const clash = await client.fetch<string | null>(
        `*[
          _type == "booking" &&
          event.type == "wedding" &&
          status == "confirmed" &&
          event.date == $date &&
          !(_id in [$id, "drafts." + $id])
        ][0]._id`,
        { date: typed.event.date, id: baseId },
      )

      return clash
        ? "Another wedding is already confirmed on this date. One wedding a day — check before publishing."
        : true
    }),

  orderings: [
    {
      title: "Event Date, Soonest First",
      name: "eventDateAsc",
      by: [{ field: "event.date", direction: "asc" }],
    },
    {
      title: "Recently Received",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],

  // No status in the subtitle: the icon shows it, and every list but "All"
  // holds a single status, where repeating it on each card is noise.
  preview: {
    select: {
      firstName: "client.firstName",
      lastName: "client.lastName",
      partnerName: "client.partnerName",
      date: "event.date",
      flexible: "event.dateIsFlexible",
      status: "status",
      type: "event.type",
      guests: "event.guestCount",
      emailStatus: "confirmationEmail.status",
    },
    prepare: ({
      firstName,
      lastName,
      partnerName,
      date,
      flexible,
      status,
      type,
      guests,
      emailStatus,
    }) => {
      const name = `${firstName ?? ""} ${lastName ?? ""}`.trim()

      return {
        title: (partnerName ? `${name} & ${partnerName}` : name) || "Unnamed enquiry",
        subtitle: joinParts(
          optionTitle(EVENT_TYPES, type),
          // Flagged on the card, so staff see it without opening the enquiry.
          emailStatus === "bounced" ? "Email bounced: phone them" : undefined,
          formatDate(date) ?? (flexible ? "Date flexible" : "No date"),
          pluralise(guests, "guest"),
        ),
        media: STATUS_ICONS[status as BookingStatus] ?? InboxIcon,
      }
    },
  },
})
