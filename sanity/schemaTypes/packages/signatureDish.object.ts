import { defineField, defineType } from "sanity"
import { photoField } from "../../lib/photoField"
import { joinParts } from "../../lib/preview"

/**
 * One photographed dish tile above a tier's menu columns.
 *
 * `isPlaceholderImage` is the mechanism for an exception the project has
 * already had to make once, deliberately and on the record: the sixteen
 * station images are AI-generated stand-ins, approved so the section reads as
 * finished in a pitch, carrying a visible oxblood on-page disclaimer and to be
 * declared to Bacchus as placeholder. Three of the four package pages likewise
 * render placeholder dish tiles because only Reception has real photography.
 *
 * Making that a flag rather than a hand-written disclaimer matters because the
 * standing rule is the opposite one: all photography on the site is real,
 * client-provided Bacchus event photography, and fabricated imagery is not to
 * be reused. A flag keeps the exception visible, keeps the disclaimer attached
 * to the image rather than to the page, and makes "which images still need
 * replacing with real exports" a query instead of a memory.
 *
 * `alt` is required. Not a nicety — the gallery lightbox and the dish tiles
 * are the two places on the site where an image IS the content.
 */
export default defineType({
  name: "signatureDish",
  title: "Signature Dish",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Dish Name",
      type: "string",
      description: "Shown as the caption on the tile.",
      validation: (Rule) => Rule.required(),
    }),
    photoField({
      name: "image",
      title: "Photograph",
    }),
    defineField({
      name: "course",
      title: "Course",
      type: "string",
      description:
        'The small label on the photo and in the lightbox, e.g. "Cold Canapé", "Dessert".',
    }),
    defineField({
      name: "placeholderInitials",
      title: "Initials on the Placeholder Tile",
      type: "string",
      description:
        'Shown on the black "photo to follow" tile until there is a photo, e.g. "BC" for Beef Carpaccio.',
      hidden: ({ parent }) => Boolean(parent?.image),
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: "isPlaceholderImage",
      title: "Not a Real Bacchus Photo",
      type: "boolean",
      initialValue: false,
      description:
        "Tick if this is a stand-in. Untick when a real Bacchus photo replaces it.",
    }),
  ],
  preview: {
    select: { name: "name", media: "image", placeholder: "isPlaceholderImage" },
    prepare: ({ name, media, placeholder }) => ({
      title: name,
      subtitle: joinParts(placeholder ? "Placeholder image" : undefined),
      media,
    }),
  },
})
