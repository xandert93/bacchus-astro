import type { JSX } from "react"
import { defineField, type ConditionalProperty } from "sanity"
import { help } from "./help"

type PhotoFieldOptions = {
  name: string
  title: string
  group?: string | string[]
  description?: string | JSX.Element
  hidden?: ConditionalProperty
  required?: boolean

  /** Adds "Not a real Bacchus photo", for images that may be a stand-in. */
  canBeStandIn?: boolean
}

/**
 * A photograph, with the same fields wherever one appears: alt text, and
 * whether it is only a compressed web copy. One definition, so the site reads
 * every photo the same way (`src/lib/sanity/photos.ts`, `PHOTO_FIELDS`).
 *
 * Alt text is required on every photo: much of this site is images, and a
 * photo with no alt text is a blank to a screen reader.
 */
export const photoField = ({ required, canBeStandIn, ...field }: PhotoFieldOptions) =>
  defineField({
    ...field,
    type: "image",
    options: { hotspot: true },
    validation: required ? (Rule) => Rule.required() : undefined,
    fields: [
      defineField({
        name: "alt",
        title: "Alt Text",
        type: "string",
        description:
          "Describe what's in the photo, for people who can't see it (e.g. screen reader users).",
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: "isWebCopy",
        title: "Web Copy: The Original Is Still to Come",
        type: "boolean",
        initialValue: false,
        description: help(
          "Tick if this is a compressed copy rather than the original photo. The site then won't compress it again.",
          "When the original arrives, upload it and untick this.",
        ),
      }),
      ...(canBeStandIn
        ? [
            defineField({
              name: "isPlaceholder",
              title: "Not a Real Bacchus Photo",
              type: "boolean",
              initialValue: false,
              description:
                "Tick if this is a stand-in until a real Bacchus photo arrives.",
            }),
          ]
        : []),
    ],
  })
