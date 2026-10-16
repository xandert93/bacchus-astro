import { at, defineMigration, set, unset, type NodePatch } from "sanity/migrate"

/**
 * Moves the content copied into production (2026-10-08) to the shapes the
 * schema has had since 2026-10-16:
 *
 *   - related fields grouped into objects: a gallery photo's alt text and
 *     flags inside `image`, its words in `caption`; a tier's `pricing` and
 *     `menu`; a package's `hero`; a testimonial's `author` and `permissions`
 *   - the provenance records (source, confirmation status, conflicts) and the
 *     catalogue-variance records removed, since the Studio no longer tracks
 *     them (`docs/content/client-facts.md` does)
 *
 * Run from `sanity/` (dry run first, which is the default):
 *
 *   npx sanity migration run group-fields-and-drop-provenance --dataset production
 *   npx sanity migration run group-fields-and-drop-provenance --dataset production --no-dry-run
 *
 * Safe to re-run: a document already in the new shape has none of the old
 * fields, so nothing is patched.
 */

type Fields = Record<string, unknown>

/** The object with undefined values dropped, or undefined if nothing is left. */
const compact = (fields: Fields) => {
  const kept = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  )

  return Object.keys(kept).length > 0 ? kept : undefined
}

const withoutProvenance = (price: unknown) => {
  if (!price || typeof price !== "object") return price

  const { provenance: _provenance, ...rest } = price as Fields

  return rest
}

const withoutVariance = (item: unknown) => {
  if (!item || typeof item !== "object") return item

  const { catalogueVariance: _variance, ...rest } = item as Fields

  return rest
}

/** Set the new object (if anything goes in it), then unset the old fields. */
const regroup = (
  document: Fields,
  target: string,
  fields: Fields,
  oldFields: string[],
): NodePatch[] => {
  const present = oldFields.filter((field) => document[field] !== undefined)
  if (present.length === 0) return []

  const grouped = compact(fields)

  return [
    ...(grouped ? [at(target, set(grouped))] : []),
    ...present.map((field) => at(field, unset())),
  ]
}

export default defineMigration({
  title: "Group related fields and drop provenance",
  documentTypes: [
    "galleryImage",
    "packageTier",
    "weddingPackage",
    "testimonial",
    "station",
    "menuDish",
    "stationCategory",
  ],

  migrate: {
    document: (document) => {
      const doc = document as Fields

      switch (doc._type) {
        case "galleryImage": {
          const image = doc.image as Fields | undefined

          return [
            ...(image && doc.alt !== undefined
              ? [
                  at(
                    "image",
                    set(
                      compact({
                        ...image,
                        alt: doc.alt,
                        isWebCopy: doc.isWebCopy,
                        isPlaceholder: doc.isPlaceholder,
                      }),
                    ),
                  ),
                ]
              : []),
            ...regroup(
              doc,
              "caption",
              { title: doc.title, label: doc.label, shortLabel: doc.shortLabel },
              ["title", "label", "shortLabel", "alt", "isWebCopy", "isPlaceholder"],
            ),
          ]
        }

        case "packageTier":
          return [
            ...regroup(
              doc,
              "pricing",
              {
                base: withoutProvenance(doc.price),
                seasonal: (doc.seasonalRates as Fields[] | undefined)?.map((rate) => ({
                  ...rate,
                  price: withoutProvenance(rate.price),
                })),
              },
              ["price", "seasonalRates"],
            ),
            ...regroup(
              doc,
              "menu",
              {
                intro: doc.intro,
                signatureDishes: doc.signatureDishes,
                groups: (doc.menuGroups as Fields[] | undefined)?.map((group) => ({
                  ...(withoutVariance(group) as Fields),
                  items: (group.items as unknown[] | undefined)?.map(withoutVariance),
                })),
                includedNote: doc.includedNote,
              },
              ["intro", "signatureDishes", "menuGroups", "includedNote"],
            ),
          ]

        case "weddingPackage":
          return [
            ...regroup(
              doc,
              "hero",
              { heading: doc.heroHeading, intro: doc.heroIntro, image: doc.heroImage },
              ["heroHeading", "heroIntro", "heroImage"],
            ),
            // Each page note pointed at the fact it described.
            ...((doc.notes as Fields[] | undefined) ?? [])
              .filter((note) => note.resolvesWith !== undefined)
              .map((note) =>
                at(["notes", { _key: note._key as string }, "resolvesWith"], unset()),
              ),
          ]

        case "testimonial": {
          const permissions = regroup(
            doc,
            "permissions",
            { useName: doc.consentName, usePhoto: doc.consentPhoto },
            ["consentName", "consentPhoto"],
          )

          return [
            ...regroup(
              doc,
              "author",
              {
                fullName: doc.authorFullName,
                displayName: doc.displayName,
                location: doc.location,
                photo: doc.photo,
              },
              ["authorFullName", "displayName", "location", "photo"],
            ),
            ...permissions,
          ]
        }

        case "station":
          return [
            ...(doc.price && (doc.price as Fields).provenance !== undefined
              ? [at("price.provenance", unset())]
              : []),
            ...(doc.catalogueVariance !== undefined
              ? [at("catalogueVariance", unset())]
              : []),
          ]

        case "menuDish":
          return doc.catalogueVariance !== undefined
            ? [at("catalogueVariance", unset())]
            : []

        case "stationCategory":
          return doc.labelProvenance !== undefined ? [at("labelProvenance", unset())] : []

        default:
          return []
      }
    },
  },
})
