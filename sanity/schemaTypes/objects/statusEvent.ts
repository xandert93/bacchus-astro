import { defineField, defineType } from "sanity"

/**
 * One entry in a booking's status history.
 *
 * A booking's `status` field answers "what is it now". This answers "how did
 * it get here, and who decided", which the project needs for three concrete
 * reasons rather than as general good hygiene:
 *
 * 1. The deposit race. Several pending enquiries can share one date, and
 *    whichever pays first auto-confirms by webhook while the others are marked
 *    unavailable and notified. When a couple asks why they lost a date, the
 *    answer has to be reconstructable to the second — and the actor has to
 *    distinguish a webhook from a staff decision.
 *
 * 2. The waitlist trigger fires on a transition, not a state. Only
 *    confirmed -> cancelled releases a date that was publicly shown as Booked.
 *    A record of the transition is what lets a mis-fired notification batch be
 *    traced instead of guessed at.
 *
 * 3. Completion is automated. A Cloudflare Cron Trigger moves Confirmed -> Completed
 *    some days after the event and that triggers a review-request email. If
 *    that job runs twice, the history is what shows it.
 *
 * Append-only by convention — nothing here enforces it, because Sanity
 * documents are mutable by anyone with write access. The enforcement belongs
 * in the serverless layer, which should be the only writer.
 */
export default defineType({
  name: "statusEvent",
  title: "Status change",
  type: "object",
  fields: [
    defineField({
      name: "to",
      title: "Changed to",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "from",
      title: "Changed from",
      type: "string",
      description: "Empty on the first entry, where the booking was created.",
    }),
    defineField({
      name: "at",
      title: "When",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "actor",
      title: "Changed by",
      type: "string",
      options: {
        list: [
          { title: "Staff, in Sanity Studio", value: "staff" },
          { title: "Stripe payment webhook", value: "payment-webhook" },
          { title: "Scheduled job", value: "cron" },
          { title: "Visitor, via the site", value: "visitor" },
          { title: "Migration or manual data fix", value: "migration" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "actorDetail",
      title: "Which person or job",
      type: "string",
      description: "A staff name, or the job that ran.",
    }),
    defineField({
      name: "reason",
      title: "Reason",
      type: "text",
      rows: 2,
      description:
        "Required in practice for a decline or a cancellation — this is what a later conversation with the couple is reconstructed from.",
    }),
  ],
  preview: {
    select: { to: "to", from: "from", at: "at", actor: "actor" },
    prepare: ({ to, from, at, actor }) => ({
      title: from ? `${from} → ${to}` : `created as ${to}`,
      subtitle: [at ? new Date(at).toLocaleString("en-GB") : null, actor]
        .filter(Boolean)
        .join(" — "),
    }),
  },
})
