import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { joinParts, optionTitle } from "../../lib/preview"

/**
 * Where a fact came from, and whether Bacchus has confirmed it.
 *
 * This is the load-bearing type in the whole schema, and it exists because the
 * project's defining content problem is not "what is the price" but "do we
 * actually know, and may we publish it". The prototype already encodes that
 * distinction visually in three separate places — `.package-menu-note`
 * (bronze/gold, confirmed catalogue copy) versus
 * `.package-menu-note-warning` (oxblood, unconfirmed or contested), the
 * "illustrative only" labels on the availability calendar, and the
 * "do not send funds to this account" box on the deposit page — but today each
 * of those is hand-written into the HTML, eleven pages deep. Nothing in the
 * markup knows WHY a disclaimer is there, so nothing can remove it when the
 * client finally signs the fact off, and nothing stops a confirmed fact from
 * keeping a stale warning (or an unconfirmed one from quietly losing its own).
 *
 * Attaching this object to a fact makes the disclaimer a function of the data:
 *
 *   confirmed              -> `.package-menu-note`, or no note at all
 *   unconfirmed, contested -> `.package-menu-note-warning` (oxblood)
 *
 * It also gives the two consumers that must not guess a single field to filter
 * on. The FAQ assistant (RAG, "never invent pricing/availability") can be
 * restricted to `status == "confirmed"`. The quote generator can refuse to
 * price anything contested. Neither needs its own allow-list.
 *
 * Two live examples of `contested`, both currently open:
 *   - Banquet per person: the client quote says €65/€85/€95, separate client
 *     correspondence says banqueting "begins at around €135 per person".
 *   - Deposit terms: the catalogue states 30% non-refundable with 70% due 14
 *     days out; correspondence describes the terms as flexible without
 *     reaffirming that split.
 * In both cases the project's standing decision is NOT to pick one. That is
 * why `contested` is a first-class status with room for the rival value,
 * rather than a note stapled to whichever figure got chosen.
 */
const CONFIRMATION_STATUSES = [
  { title: "Confirmed by Bacchus", value: "confirmed" },
  { title: "Unconfirmed — gathered, not verified", value: "unconfirmed" },
  { title: "Contested — two sources disagree", value: "contested" },
  { title: "Placeholder — invented for the pitch", value: "placeholder" },
] as const

const SOURCES = [
  { title: "Wedding catalogue PDF", value: "catalogue" },
  { title: "Client correspondence (email)", value: "correspondence" },
  { title: "Client quote (shared PDF)", value: "quote" },
  { title: "Live bacchus.com.mt", value: "live-site" },
  { title: "Web search / third party", value: "web" },
  { title: "Our own assumption", value: "assumption" },
  { title: "Invented for the pitch", value: "invented" },
] as const

export default defineType({
  name: "provenance",
  title: "Source & confirmation",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({
      name: "status",
      title: "Confirmation status",
      type: "string",
      options: { list: [...CONFIRMATION_STATUSES], layout: "radio" },
      initialValue: "unconfirmed",
      description: help(
        'Anything other than "Confirmed" shows a dark red warning note on the page.',
        "It is also kept out of the FAQ assistant's answers.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "source",
      title: "Primary source",
      type: "string",
      options: { list: [...SOURCES] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sourceDetail",
      title: "Source detail",
      type: "string",
      description:
        "Enough to find it again, such as a catalogue page, an email date or a quote reference.",
    }),
    defineField({
      name: "confirmedOn",
      title: "Confirmed on",
      type: "date",
      description: "The date Bacchus confirmed this.",
      hidden: ({ parent }) => parent?.status !== "confirmed",
    }),

    // --- Contested only -----------------------------------------------------
    defineField({
      name: "conflictingValue",
      title: "The conflicting value",
      type: "string",
      description:
        'What the other source says, as it says it — e.g. "around €135 per person".',
      hidden: ({ parent }) => parent?.status !== "contested",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { status?: string } | undefined
          if (parent?.status === "contested" && !value) {
            return "Add what the other source says, so the page can explain the difference."
          }
          return true
        }),
    }),
    defineField({
      name: "conflictingSource",
      title: "Where the conflicting value comes from",
      type: "string",
      hidden: ({ parent }) => parent?.status !== "contested",
    }),

    // --- Rendered copy ------------------------------------------------------
    defineField({
      name: "publicNote",
      title: "Public note",
      type: "text",
      rows: 3,
      description: help(
        "Shown on the website, so write it for visitors, not staff.",
        "Shown in bronze when confirmed, dark red otherwise. Leave empty for a confirmed fact that needs no explaining.",
      ),
    }),
    defineField({
      name: "internalNote",
      title: "Internal note",
      type: "text",
      rows: 3,
      description: "Never shown on the site. What to ask Bacchus, and why it matters.",
    }),
    defineField({
      name: "blocksPublication",
      title: "Block this from being published at all",
      type: "boolean",
      initialValue: false,
      description: help(
        "For a fact that mustn't appear on the site at all, even with a warning.",
        "For example, the catalogue's corkage fee doesn't say whether it is per bottle or per person, so it is held back rather than shown with a guess.",
      ),
    }),
  ],
  preview: {
    select: { status: "status", source: "source", note: "internalNote" },
    prepare: ({ status, source, note }) => ({
      title: optionTitle(CONFIRMATION_STATUSES, status) ?? "Unknown status",
      subtitle: joinParts(optionTitle(SOURCES, source), note),
    }),
  },
})
