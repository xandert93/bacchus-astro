import { defineField, defineType } from "sanity"

/**
 * Someone waiting on a date that is currently taken.
 *
 * Reached from the popover anchored to a booked cell in the availability
 * calendar — hover on a mouse, tap on touch — which is live everywhere the
 * calendar appears. Deliberately not the full enquiry wizard: the wizard
 * assumes an active enquiry against a date that is still open, and this is the
 * opposite situation.
 *
 * The flow this feeds: when a booking transitions confirmed -> cancelled, a
 * Sanity webhook calls a serverless function, which queries `active` entries
 * for that date and emails them. That is why `status` is stored on the entry
 * rather than derived — unlike availability, "has this person been told yet"
 * is a fact about the person, not about the date, and it cannot be recomputed
 * from anything else.
 *
 * Three guards, none of which Sanity can enforce on its own:
 *
 *   - Double opt-in. `verifiedAt` is empty until the visitor clicks the link
 *     in a confirmation email, and the notification query must filter on it.
 *     This is the anti-spam mechanism the project asked for, and it is also
 *     the clean answer for GDPR — an unverified address is one anybody could
 *     have typed in.
 *
 *   - A per-email cap, generous (5–10) and aimed at bots rather than at a
 *     couple genuinely comparing a few candidate dates. Enforced in the
 *     submission handler, since a cap across documents is not expressible in
 *     document validation.
 *
 *   - Name is collected but NOT required, and is no longer labelled "optional"
 *     on the form. Worth confirming that was the intent before this goes
 *     further; the schema follows the form as built.
 *
 * Still open, and not modelled either way: whether "Enquiries received" dates
 * should also offer the waitlist. Only Booked is wired today, and an
 * enquiries-received date is still actionable through a normal enquiry — so
 * offering both on one cell would be two competing calls to action.
 */
export default defineType({
  name: "waitlistEntry",
  title: "Waitlist entry",
  type: "document",
  fields: [
    defineField({
      name: "eventDate",
      title: "Date wanted",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Not required. See the note on this type.",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Active — waiting", value: "active" },
          { title: "Notified — date freed up, email sent", value: "notified" },
          { title: "Converted — became an enquiry", value: "converted" },
          { title: "Lapsed — date has passed", value: "lapsed" },
          { title: "Unsubscribed", value: "unsubscribed" },
        ],
        layout: "radio",
      },
      initialValue: "active",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "verifiedAt",
      title: "Email verified at",
      type: "datetime",
      description:
        "Empty means unverified. The notification query MUST filter on this — an unverified address is one anybody could have typed in.",
    }),
    defineField({
      name: "notifiedAt",
      title: "Notified at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "convertedBooking",
      title: "Became this enquiry",
      type: "reference",
      to: [{ type: "booking" }],
      description: "Set if they came back and enquired after being notified.",
    }),
    defineField({
      name: "consent",
      title: "Consent",
      type: "consentRecord",
    }),
    defineField({
      name: "sourcePage",
      title: "Joined from",
      type: "string",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "Date wanted, soonest first",
      name: "eventDateAsc",
      by: [{ field: "eventDate", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      date: "eventDate",
      email: "email",
      name: "name",
      status: "status",
      verified: "verifiedAt",
    },
    prepare({ date, email, name, status, verified }) {
      const when = date ? new Date(date).toLocaleDateString("en-GB") : "no date"
      return {
        title: `${when} — ${name || email}`,
        subtitle: [status, verified ? null : "unverified"].filter(Boolean).join(" · "),
      }
    },
  },
})
