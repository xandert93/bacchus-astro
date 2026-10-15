import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"

/**
 * Per-page search and social metadata.
 *
 * Verified against the prototype on 2026-10-01: none of the eleven root pages
 * carries a meta description, a rel=canonical, a single Open Graph tag, or any
 * structured data. That is the whole of the site's search surface, missing.
 * Astro does not generate any of it for free either — it still has to be
 * authored, just in one layout component instead of eleven files, which is
 * what this object feeds.
 *
 * Deliberately NOT here:
 *   - `title`. The page's own title field is the source; this object only
 *     carries an override for when the search-result title should differ from
 *     the on-page heading. Two independent required titles invites drift.
 *   - A `keywords` field. Ignored by every major engine since roughly 2009 and
 *     its presence invites keyword stuffing into a schema otherwise built to
 *     discourage it.
 *   - JSON-LD as raw text. Structured data is generated from real fields
 *     (`siteSettings` for LocalBusiness, `venueSpace` and `faq` for the rest)
 *     so it cannot drift from the page it describes. A hand-authored blob is
 *     how a page ends up claiming a capacity the page body contradicts.
 */
export default defineType({
  name: "seo",
  title: "Search & social",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Search-result title override",
      type: "string",
      description: help(
        "Only if it should differ from the page title.",
        "Keep it under 60 characters, or Google cuts it short.",
      ),
      validation: (Rule) =>
        Rule.max(70).warning("Likely to be truncated in search results."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      description: help(
        "The short summary under the title in Google. One or two sentences, written for someone deciding whether to click.",
        "Aim for 150 to 160 characters.",
      ),
      validation: (Rule) => [
        Rule.max(165).warning("Likely to be truncated in search results."),
        Rule.min(70).warning(
          "Short enough that engines may ignore it and write their own.",
        ),
      ],
    }),
    defineField({
      name: "socialImage",
      title: "Social share image",
      type: "image",
      options: { hotspot: true },
      description: help(
        "The picture shown when the page is shared on social media or in a message.",
        "Leave empty to use the page's main photo. Use a wide image, ideally 1200 × 630.",
      ),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL override",
      type: "url",
      description: "Leave empty. Only for when two pages show the same content.",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      initialValue: false,
      description: help(
        "For a page people reach by link but shouldn't find through Google.",
        "For example, the deposit page, which clients only reach from a link in their email.",
      ),
    }),
  ],
})
