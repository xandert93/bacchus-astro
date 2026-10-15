import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { capitalise, joinParts, optionTitle } from "../../lib/preview"

/**
 * One confirmed fact about the venue, in question-and-answer form.
 *
 * Serves three consumers at once, which is why it is worth having as its own
 * type rather than as prose scattered through page copy:
 *
 *   1. The FAQ sections on the pages themselves, plus FAQPage structured data
 *      — one of the schema types the site carries none of today.
 *   2. The guide articles. Article 1, "the ultimate guide to getting married
 *      at Bacchus", is described as nearly free precisely because every fact
 *      it needs is already recorded: five-hour standard duration, 50–800
 *      standing, indoor and outdoor always both, the restaurant closing to the
 *      public above 150 guests, music until 11pm outdoors and 4am indoors, the
 *      three-tier dummy-cake convention, the in-house coordinator, what
 *      couples still source themselves, the stairlift, the tasting policy.
 *      Those are FAQ records, and an article assembled from them cannot
 *      contradict the pages.
 *   3. The FAQ chat assistant — a RAG pattern pulling current Sanity content
 *      into the prompt at query time, with no vector database needed at this
 *      content scale, under a strict instruction to answer only from the
 *      provided content and never invent pricing or availability.
 *
 * That third consumer is why `provenance` and `availableToAssistant` are both
 * here, and why they are the most important fields on the type. "Never invent
 * pricing or availability" is only enforceable if the retrieval step can tell
 * a confirmed fact from a gathered one — so the assistant's query filters on
 * `provenance.status == "confirmed" && availableToAssistant`. Without that,
 * the model is handed the contested Banquet price and the placeholder capacity
 * figures as though they were settled, and will repeat them confidently. The
 * guardrail belongs in the data, not only in the prompt.
 *
 * `availableToAssistant` is separate from provenance because some facts are
 * confirmed but still a bad answer for a bot to give unattended — anything
 * where the right response is "speak to the events team". Parking is the live
 * example: guests can book "the Tomba", which is the client's own term for a
 * nearby arrangement nobody has yet identified.
 */
const FAQ_TOPICS = [
  { title: "Spaces & capacity", value: "spaces" },
  { title: "Food & drink", value: "food" },
  { title: "Timings & music", value: "timings" },
  { title: "Pricing & payment", value: "pricing" },
  { title: "Planning & suppliers", value: "planning" },
  { title: "Access & practicalities", value: "practical" },
  { title: "Restaurant", value: "restaurant" },
] as const

export default defineType({
  name: "faq",
  title: "FAQ / venue fact",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      description: "Word it the way a visitor would ask it.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Paragraph", value: "normal" }],
          lists: [{ title: "Bullet", value: "bullet" }],
          marks: {
            decorators: [{ title: "Strong", value: "strong" }],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [defineField({ name: "href", title: "URL", type: "url" })],
              },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "topic",
      title: "Topic",
      type: "string",
      options: { list: [...FAQ_TOPICS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "provenance",
      title: "Source & confirmation",
      type: "provenance",
      description: help(
        "The chat assistant only uses confirmed answers.",
        "An unconfirmed answer can still appear on a page, with a warning.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "availableToAssistant",
      title: "The chat assistant may answer with this",
      type: "boolean",
      initialValue: true,
      description:
        'Untick where the right answer is "speak to the events team", even if the fact is confirmed.',
    }),
    defineField({
      name: "showOnPages",
      title: "Show on",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "Weddings", value: "weddings" },
          { title: "Corporate", value: "corporate" },
          { title: "Celebrations", value: "celebrations" },
          { title: "Package pages", value: "packages" },
          { title: "Deposit page", value: "deposit" },
          { title: "Restaurant", value: "restaurant" },
        ],
        // No `layout: "tags"` here: tags are for free-form entry, and these
        // are a fixed set of pages. Declaring both makes Sanity ignore the
        // list and accept anything typed in, which would silently let an FAQ
        // be assigned to a page that does not exist.
      },
      description:
        "Leave empty to keep it off the pages. The assistant and guide articles can still use it.",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.integer(),
    }),
  ],
  orderings: [
    {
      title: "Topic, then order",
      name: "topicOrder",
      by: [
        { field: "topic", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      question: "question",
      topic: "topic",
      status: "provenance.status",
      assistant: "availableToAssistant",
    },
    prepare: ({ question, topic, status, assistant }) => ({
      title: question,
      subtitle: joinParts(
        optionTitle(FAQ_TOPICS, topic),
        capitalise(status),
        status === "confirmed" && assistant
          ? "Used by assistant"
          : "Not used by assistant",
      ),
    }),
  },
})
