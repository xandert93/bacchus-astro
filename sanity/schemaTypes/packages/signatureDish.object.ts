import { defineField, defineType } from "sanity"

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
  title: "Signature dish",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Dish name",
      type: "string",
      description: "Renders as the tile caption.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Photograph",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "What is in the photograph, for someone who cannot see it.",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "isWebCopy",
          title: "Web copy — the original is still to come",
          type: "boolean",
          initialValue: false,
          description:
            "On for an already-compressed copy. The site serves it as it is rather than compressing it a second time. Upload the original when it arrives and turn this off.",
        }),
      ],
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
      title: "Initials on the placeholder tile",
      type: "string",
      description:
        'Shown on the black "photo to follow" tile while there is no photograph, e.g. "BC" for Beef Carpaccio.',
      hidden: ({ parent }) => Boolean(parent?.image),
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: "isPlaceholderImage",
      title: "Placeholder image (not real Bacchus photography)",
      type: "boolean",
      initialValue: false,
      description:
        'On means the page shows its oxblood placeholder disclaimer and the image appears in the "needs a real export" list. See the note on this type.',
    }),
  ],
  preview: {
    select: { name: "name", media: "image", placeholder: "isPlaceholderImage" },
    prepare: ({ name, media, placeholder }) => ({
      title: name,
      subtitle: placeholder ? "placeholder image" : undefined,
      media,
    }),
  },
})
