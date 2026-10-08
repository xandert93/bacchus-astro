import { defineArrayMember, defineField, defineType } from "sanity"
import { GALLERY_CATEGORIES } from "../../lib/constants"

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
      description:
        "Upload the highest resolution available. Most existing event photography is 1024x1280 — fine for grids and cards, visibly soft stretched full-bleed as a hero.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        "What is in the photograph, for someone who cannot see it. Required — this is a page made of images.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        'The editorial caption shown in the lightbox — e.g. "Reception, After Dark", "The First Toast". Distinct from alt text: this is written to be read, alt text is written to be heard.',
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: { list: [...GALLERY_CATEGORIES], layout: "radio" },
      description:
        'Drives the gallery filter. "Venue" rather than "Spaces" because that is what the existing markup and the inbound ?filter= deep links use.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description:
        'Replaces the category name in the lightbox caption, e.g. "From the kitchen" on food photographed for the Venue category. Leave empty to show the category.',
    }),
    defineField({
      name: "shortLabel",
      title: "Short label",
      type: "string",
      description:
        'The badge on the photo when the label is too long for it, e.g. "Kitchen". Leave empty to use the label.',
      hidden: ({ document }) => !document?.label,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      description:
        'Free-form, for the filtering the current flat bucket cannot do — "cake", "ceremony", "golden hour", "detail".',
    }),
    defineField({
      name: "space",
      title: "Space photographed",
      type: "reference",
      to: [{ type: "venueSpace" }],
      description: "Lets a space page pull its own photographs without a second list.",
    }),
    defineField({
      name: "year",
      title: "Year taken",
      type: "number",
      description:
        "Approximate is fine. Grouping by year is one of the things the flat bucket cannot do.",
      validation: (Rule) => Rule.min(1970).max(2100).integer(),
    }),
    defineField({
      name: "credit",
      title: "Photographer",
      type: "reference",
      to: [{ type: "supplier" }],
      description:
        "A reference, not a string — see the note on this type. A credited photographer is a link-exchange opportunity.",
    }),
    defineField({
      name: "isFeatured",
      title: "Featured — gets the wide tile",
      type: "boolean",
      initialValue: false,
      description:
        "The gallery grid gives one tile a double-width span. Keep this to very few images.",
    }),
    defineField({
      name: "isWebCopy",
      title: "Web copy — the original is still to come",
      type: "boolean",
      initialValue: false,
      description:
        "On for an already-compressed copy. The site serves it as it is rather than compressing it a second time. Upload the original when it arrives and turn this off.",
    }),
    defineField({
      name: "isPlaceholder",
      title: "Placeholder image (not real Bacchus photography)",
      type: "boolean",
      initialValue: false,
      description:
        "All photography on the site is real client-provided work, with one approved exception (the station images). Anything flagged here must carry its disclaimer and should be replaced.",
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
      subtitle: [category, year].filter(Boolean).join(" · "),
      media,
    }),
  },
})
