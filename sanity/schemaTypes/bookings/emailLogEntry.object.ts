import { defineField, defineType } from "sanity"
import { formatDateTime, joinParts, optionTitle } from "../../lib/preview"

/**
 * One email the site sent about a booking, to the client or to staff. The
 * site appends these itself (src/lib/email/log.ts); nobody types them.
 *
 * Resend keeps its own log, but only for a short while and outside the
 * Studio. This one answers "did they get the quote?" or "were we told the
 * transfer was coming?" from the booking itself, for as long as the booking
 * exists. A bounce reported later marks its entry (src/pages/api/
 * email-events.ts).
 */

/** Names for the emails' `kind`s (src/lib/email/), in the order they happen. */
const EMAIL_KINDS = [
  { title: "Enquiry Confirmation", value: "enquiry-confirmation" },
  { title: "New Enquiry Alert", value: "enquiry-alert" },
  { title: "Quote", value: "quote" },
  { title: "Quote Reminder", value: "quote-reminder" },
  { title: "Quote as a PDF", value: "quote-pdf" },
  { title: "Quote PDF Not Made", value: "quote-pdf-failed" },
  { title: "Transfer on Its Way", value: "transfer-notice" },
  { title: "Booking Confirmed", value: "deposit-confirmed" },
  { title: "Deposit Received", value: "deposit-received" },
  { title: "Paid for a Taken Date", value: "paid-but-taken" },
  { title: "Date No Longer Available", value: "date-taken" },
  { title: "Quote Declined", value: "quote-declined" },
  { title: "Quote Declined: Confirmation", value: "quote-declined-client" },
  { title: "Quote Expired", value: "quote-expired" },
  { title: "Quote Expired: Follow Up", value: "quote-expired-staff" },
  { title: "Review Request", value: "review-request" },
  { title: "Review Received", value: "review-received" },
] as const

const AUDIENCES = [
  { title: "Client", value: "client" },
  { title: "Staff", value: "staff" },
] as const

const STATUSES = [
  { title: "Sent", value: "sent" },
  { title: "Couldn't Be Sent", value: "failed" },
  { title: "Bounced: Address Doesn't Work", value: "bounced" },
] as const

export default defineType({
  name: "emailLogEntry",
  title: "Email",
  type: "object",
  readOnly: true,
  fields: [
    defineField({
      name: "kind",
      title: "Email",
      type: "string",
      options: { list: [...EMAIL_KINDS] },
    }),
    defineField({
      name: "audience",
      title: "To",
      type: "string",
      options: { list: [...AUDIENCES] },
    }),
    defineField({ name: "to", title: "Address", type: "string" }),
    defineField({ name: "subject", title: "Subject", type: "string" }),
    defineField({ name: "sentAt", title: "When", type: "datetime" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: [...STATUSES] },
    }),
    defineField({
      name: "note",
      title: "Reason Given",
      type: "string",
      hidden: ({ parent }) => !parent?.note,
    }),
    // Resend's id, to match a bounce report to this entry. Not for people.
    defineField({ name: "resendId", type: "string", hidden: true }),
  ],
  preview: {
    select: {
      kind: "kind",
      audience: "audience",
      sentAt: "sentAt",
      status: "status",
    },
    prepare: ({ kind, audience, sentAt, status }) => ({
      title: joinParts(
        optionTitle(EMAIL_KINDS, kind) ?? kind,
        audience && `to ${optionTitle(AUDIENCES, audience)?.toLowerCase()}`,
      ),
      subtitle: joinParts(
        formatDateTime(sentAt),
        status === "sent" ? undefined : optionTitle(STATUSES, status),
      ),
    }),
  },
})
