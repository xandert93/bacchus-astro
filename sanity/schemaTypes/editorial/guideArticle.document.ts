import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { joinParts, optionTitle } from "../../lib/preview"

/**
 * A guide article — the five agreed pieces, and whatever follows them.
 *
 * These are the half of the search-visibility work that genuinely earns new
 * pages: each is a different thing to read, and a cost guide or a guide to
 * marrying in Mdina is exactly what a photographer or planner can link to.
 * (The other half — ranking for the venue queries themselves — is a copy and
 * markup job on the existing weddings page, not a page per phrasing. A page
 * per phrasing would be the doorway-page pattern, a named Google spam policy,
 * and would cannibalise the page that should be holding those links.)
 *
 * Agreed order, best first:
 *   1. "The ultimate guide to getting married at Bacchus" — nearly free, every
 *      fact is already recorded.
 *   2. "Secret garden weddings in Malta" — must state that the Secret Garden
 *      is NOT in the standard package.
 *   3. "What does a wedding at Bacchus cost?" — highest intent, and BLOCKED.
 *   4. "10 reasons to get married in Mdina" — cheap, shareable, low risk.
 *   5. "Best historic wedding venues in Malta" — rewrite or drop. A venue
 *      ranking itself in a list it wrote is self-serving; written honestly it
 *      has to recommend competitors.
 *
 * `status: 'blocked'` exists for article 3 specifically, and is the reason this
 * type carries a publication guard at all. That article cannot be written
 * while Banquet pricing is contested (€65/€85/€95 in the catalogue versus
 * "around €135 per person" in correspondence), while pricing is seasonal and
 * internally generated, and while the site's capacity figures are still
 * placeholders. It is the one article of the five that can actively do harm,
 * so the block lives in the data rather than in someone's memory of a
 * conversation.
 *
 * `category` is what decides where these surface. All five sit in a Guides row
 * inside the Events navigation, one row below Weddings, because four of them
 * are wedding material for a couple already considering one. A top-level
 * "Journal" becomes correct the moment the writing stops being
 * wedding-specific — restaurant pieces, Mdina pieces, anything a diner would
 * read — which is what `restaurant` and `mdina` are here for.
 */
const ARTICLE_CATEGORIES = [
  { title: "Weddings", value: "weddings" },
  { title: "Mdina & the estate", value: "mdina" },
  { title: "Restaurant", value: "restaurant" },
] as const

const ARTICLE_STATUSES = [
  { title: "Idea — agreed, not written", value: "idea" },
  { title: "Draft", value: "draft" },
  { title: "Blocked — cannot be written yet", value: "blocked" },
  { title: "Published", value: "published" },
] as const

export default defineType({
  name: "guideArticle",
  title: "Guide article",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "publication", title: "Publication" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      group: "content",
      rows: 3,
      description: "Shown on the article's card. Two sentences at most.",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Heading", value: "h2" },
            { title: "Subheading", value: "h3" },
            { title: "Pull quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Emphasis", value: "em" },
              { title: "Strong", value: "strong" },
            ],
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
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "content",
      options: { list: [...ARTICLE_CATEGORIES] },
      description: "Decides where the article appears in the site's menus.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "relatedSpaces",
      title: "Related spaces",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "venueSpace" }] })],
    }),
    defineField({
      name: "relatedPackages",
      title: "Related packages",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "weddingPackage" }] })],
    }),

    // --- Publication --------------------------------------------------------
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "publication",
      options: { list: [...ARTICLE_STATUSES], layout: "radio" },
      initialValue: "idea",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "blockedReason",
      title: "Why it is blocked",
      type: "text",
      group: "publication",
      rows: 4,
      hidden: ({ document }) => document?.status !== "blocked",
      description: help(
        "What has to be settled first.",
        "For example, the cost guide is waiting on the Banquet pricing conflict, seasonal pricing and the real capacity figures.",
      ),
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { status?: string } | undefined
          if (doc?.status === "blocked" && !value) {
            return "Say what is blocking it, so we know when it can go ahead."
          }
          return true
        }),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "publication",
    }),
    defineField({
      name: "order",
      title: "Priority order",
      type: "number",
      group: "publication",
      description: "The order to write them in. 1 is the ultimate guide.",
      validation: (Rule) => Rule.integer(),
    }),
    defineField({
      name: "seo",
      title: "Search & social",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    {
      title: "Priority order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Published, newest first",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", status: "status", category: "category", order: "order" },
    prepare: ({ title, status, category, order }) => ({
      title: order ? `${order}. ${title}` : title,
      subtitle: joinParts(
        optionTitle(ARTICLE_STATUSES, status),
        optionTitle(ARTICLE_CATEGORIES, category),
      ),
    }),
  },
})
