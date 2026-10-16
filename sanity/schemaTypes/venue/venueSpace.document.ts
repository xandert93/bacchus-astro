import { defineArrayMember, defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { joinParts, optionTitle } from "../../lib/preview"

/**
 * One space on the estate — the Secret Garden, the Prince De Redin Hall, the
 * Terrace, the two vaulted chambers.
 *
 * Referenced from four directions, which is why it is a document and not a
 * list of strings: the enquiry wizard's "Which spaces interest you?" cards,
 * quote line items (exclusivity fees are per space), the proposed
 * `/events/spaces` page, and the closure records.
 *
 * `includedInStandardPackage` is a genuinely confirmed fact and a commercially
 * important one: per client correspondence the standard non-exclusive package
 * includes the Terrace AND the ballroom — the indoor hall is always included
 * alongside the outdoor space, usable simultaneously in good weather, not just
 * as a wet-weather fallback — while the SECRET GARDEN IS NOT INCLUDED by
 * default. Full venue exclusivity requires the exclusivity fee. Anything
 * written about the Secret Garden has to say so, or it manufactures exactly
 * the mismatched expectation the project avoids elsewhere.
 *
 * `nameProvenance` exists because the naming itself is an open item. The
 * wedding, corporate and celebrations copy uses Secret Garden / Prince De
 * Redin Hall / Terrace throughout, sourced from the catalogue rather than
 * confirmed directly. Correspondence refers to "the Terrace and the ballroom",
 * which lines up with the "De Redin Ballroom" of the exclusivity-fee line
 * items but is not yet a confirmed 1:1 match to "Prince De Redin Hall". So the
 * schema can hold a display name and an alias without pretending to know which
 * is official.
 *
 * `exclusivityFee` is left optional and unconfirmed on purpose. Per-space fees
 * of €500 appear for Secret Garden / De Redin Ballroom / Chambers / Small
 * Terrace, but one real booking's "Terrace & Lawns" line showed a flat €4,500
 * instead. Whether venue pricing scales flat, per space or per guest is not
 * settled, so this must not be presented as a rule.
 */
const SETTINGS = [
  { title: "Indoor", value: "indoor" },
  { title: "Outdoor", value: "outdoor" },
  { title: "Covered Outdoor", value: "covered-outdoor" },
] as const

export default defineType({
  name: "venueSpace",
  title: "Venue Space",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "facts", title: "Facts & Pricing" },
    { name: "seo", title: "Search & Social" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "name", maxLength: 64 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "aliases",
      title: "Also Known As",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      description: help(
        'Other names this space goes by, e.g. "De Redin Ballroom" and "the ballroom" for the Prince De Redin Hall.',
        "Helps match quotes and emails to the right space.",
      ),
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "string",
      group: "content",
      description:
        'The line under the name on the enquiry form, e.g. "Open air, bastion views".',
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "content",
      rows: 6,
    }),
    defineField({
      name: "setting",
      title: "Setting",
      type: "string",
      group: "facts",
      options: { list: [...SETTINGS], layout: "radio" },
      description:
        'Also decides which spaces appear for "outdoor wedding venue" searches.',
    }),
    defineField({
      name: "capacity",
      title: "Capacity",
      type: "capacity",
      group: "facts",
      description: "How many guests this space holds.",
    }),
    defineField({
      name: "includedInStandardPackage",
      title: "Included in the Standard Package",
      type: "boolean",
      group: "facts",
      initialValue: false,
      description: help(
        "The Terrace and ballroom are included, the Secret Garden isn't.",
        "Anything written about a space that isn't included must say so clearly.",
      ),
    }),
    defineField({
      name: "inclusionNote",
      title: "Inclusion Note",
      type: "text",
      group: "facts",
      rows: 3,
      description:
        "Any detail, e.g. Bacchus's suggestion of using the Secret Garden as a chill-out or shisha area.",
    }),
    defineField({
      name: "exclusivityFee",
      title: "Exclusivity Fee",
      type: "price",
      group: "facts",
    }),
    defineField({
      name: "curfewNote",
      title: "Music Curfew",
      type: "string",
      group: "facts",
      description: help(
        "Outdoor entertainment until 11pm, indoor until 4am.",
        "Set for each space, so the right time shows on the right page.",
      ),
    }),
    defineField({
      name: "images",
      title: "Photographs",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "galleryImage" }] })],
      description: help(
        "Chosen from the gallery, so each photo is only uploaded once.",
        "There is no photo of the vaulted chambers yet.",
      ),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "content",
      validation: (Rule) => Rule.integer(),
    }),
    defineField({
      name: "seo",
      title: "Search & Social",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: {
      name: "name",
      setting: "setting",
      included: "includedInStandardPackage",
      max: "capacity.max",
      basis: "capacity.basis",
    },
    prepare: ({ name, setting, included, max, basis }) => ({
      title: name,
      subtitle: joinParts(
        optionTitle(SETTINGS, setting),
        max
          ? `Up to ${max} ${basis === "either" ? "guests" : (basis ?? "")}`.trim()
          : null,
        included ? "In standard package" : "Not in standard package",
      ),
    }),
  },
})
