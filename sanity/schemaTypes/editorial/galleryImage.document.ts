import { defineArrayMember, defineField, defineType } from "sanity"
import { GALLERY_CATEGORIES } from "../../lib/constants"
import { help } from "../../lib/help"
import { joinParts, optionTitle } from "../../lib/preview"

/**
 * One catalogued photograph.
 *
 * This type is the single clearest justification for choosing a structured CMS
 * at all. The live client site stores its images in Shopify Files — a flat
 * bucket with no tagging, categorisation or relational structure, where
 * grouping by "Weddings", "Restaurant" or by year simply is not expressible,
 * and the only organising principle is a naming convention inside the
 * filename. That works at the current content volume and scales badly the
 * moment the gallery needs filtering, tagging or reuse across pages — which
 * the prototype's gallery already does.
 *
 * So the fields here are the structure that was missing: a real category, real
 * tags, a year, a link to the space photographed, and a credit.
 *
 * `alt` is REQUIRED, and this is the one place on the site where that is not
 * merely good practice — the gallery and its lightbox are pages whose entire
 * content is images. A photograph with no alt text is a blank page to a screen
 * reader.
 *
 * `credit` is a reference to a supplier rather than a string, because the
 * preferred-supplier directory is a link exchange in disguise: a photographer
 * credited on real photographs of this venue has a reason to link back, and
 * that is worth more to search visibility than any amount of on-site copy.
 * A plain text credit cannot be joined to the directory.
 *
 * Deliberately NOT modelled: `srcset`, widths, or any responsive-variant
 * fields. `astro:assets` generates resized variants and the `srcset` attribute
 * from the original at build time. The current prototype serves every image at
 * full resolution with no `srcset` at all, which is the prime suspect behind
 * the slow-connection failures — but the fix is the image pipeline, not
 * hand-maintained variant data in the CMS.
 */
export default defineType({
  name: "galleryImage",
  title: "Gallery image",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Photograph",
      type: "image",
      options: { hotspot: true },
      description: help(
        "Upload the largest version you have.",
        "Most of the current event photos are fine in the gallery, but too small for a large photo at the top of a page.",
      ),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        "Describe what's in the photo, for people who can't see it (e.g. screen reader users).",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: help(
        'The caption when the photo is opened full size, e.g. "Reception, After Dark" or "The First Toast".',
        "Different from the alt text: this is a caption to read, the alt text describes the photo.",
      ),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: { list: [...GALLERY_CATEGORIES], layout: "radio" },
      description: "Decides which gallery filter the photo appears under.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: help(
        'Replaces the category name in the full-size caption, e.g. "From the kitchen" for food photos in the Venue category.',
        "Leave empty to show the category.",
      ),
    }),
    defineField({
      name: "shortLabel",
      title: "Short label",
      type: "string",
      description: help(
        'A shorter label for the badge on the photo, e.g. "Kitchen".',
        "Leave empty to use the label.",
      ),
      hidden: ({ document }) => !document?.label,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      description:
        'Any words that describe the photo, e.g. "cake", "ceremony", "golden hour".',
    }),
    defineField({
      name: "space",
      title: "Space photographed",
      type: "reference",
      to: [{ type: "venueSpace" }],
      description: "Lets the space's page show this photo.",
    }),
    defineField({
      name: "year",
      title: "Year taken",
      type: "number",
      description: "A rough guess is fine.",
      validation: (Rule) => Rule.min(1970).max(2100).integer(),
    }),
    defineField({
      name: "credit",
      title: "Photographer",
      type: "reference",
      to: [{ type: "supplier" }],
      description: help(
        "Choose from the suppliers list. Add the photographer there first if they're missing.",
        "Crediting them gives them a reason to link back to Bacchus.",
      ),
    }),
    defineField({
      name: "isFeatured",
      title: "Featured: gets the wide tile",
      type: "boolean",
      initialValue: false,
      description: "Shown double width in the gallery. Use for very few photos.",
    }),
    defineField({
      name: "isWebCopy",
      title: "Web copy: the original is still to come",
      type: "boolean",
      initialValue: false,
      description: help(
        "Tick if this is a compressed copy rather than the original photo. The site then won't compress it again.",
        "When the original arrives, upload it and untick this.",
      ),
    }),
    defineField({
      name: "isPlaceholder",
      title: "Placeholder image (not real Bacchus photography)",
      type: "boolean",
      initialValue: false,
      description: help(
        "Tick if this isn't a real Bacchus photo.",
        "The site should only use real Bacchus photos. The one agreed exception is the station images. Anything ticked here shows a warning and should be replaced.",
      ),
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
      title: "Manual order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Newest first",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      alt: "alt",
      category: "category",
      media: "image",
      year: "year",
    },
    prepare: ({ title, alt, category, media, year }) => ({
      title: title || alt || "Untitled",
      subtitle: joinParts(optionTitle(GALLERY_CATEGORIES, category), year),
      media,
    }),
  },
})
