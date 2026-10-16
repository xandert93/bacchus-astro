import { defineArrayMember, defineField, defineType } from "sanity"
import { GALLERY_CATEGORIES } from "../../lib/constants"
import { help } from "../../lib/help"
import { photoField } from "../../lib/photoField"
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
 * The photo's own facts (alt text, web copy, stand-in) live on `image`, as on
 * every photo in the schema (`lib/photoField.ts`), and the words shown with
 * it are grouped as `caption`.
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
  title: "Gallery Image",
  type: "document",
  fields: [
    photoField({
      name: "image",
      title: "Photograph",
      required: true,
      canBeStandIn: true,
      description: help(
        "Upload the largest version you have.",
        "Most of the current event photos are fine in the gallery, but too small for a large photo at the top of a page.",
        "A photo marked as not a real Bacchus photo is left out of the gallery.",
      ),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "object",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",
          description: help(
            'Shown when the photo is opened full size, e.g. "Reception, After Dark" or "The First Toast".',
            "Different from the alt text: this is a caption to read, the alt text describes the photo.",
          ),
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
          title: "Short Label",
          type: "string",
          description: help(
            'A shorter label for the badge on the photo, e.g. "Kitchen".',
            "Leave empty to use the label.",
          ),
          hidden: ({ parent }) => !parent?.label,
        }),
      ],
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
      title: "Space Photographed",
      type: "reference",
      to: [{ type: "venueSpace" }],
      description: "Lets the space's page show this photo.",
    }),
    defineField({
      name: "year",
      title: "Year Taken",
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
      title: "Featured: Gets the Wide Tile",
      type: "boolean",
      initialValue: false,
      description: "Shown double width in the gallery. Use for very few photos.",
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
      title: "Manual Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Newest First",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "caption.title",
      alt: "image.alt",
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
