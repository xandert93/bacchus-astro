// Turns the site's own content into a Sanity import file.
//
// Run:  node scripts/sanity-migrate.mjs            (writes sanity/import/content.ndjson)
//       node scripts/sanity-migrate.mjs --summary  (prints counts and writes nothing)
//
// WHERE THE CONTENT COMES FROM, and why it matters: `src/data/`, never the
// catalogue PDF. The port already read the rendered catalogue pages and
// proofed the result — British English applied, accents restored, real
// misspellings fixed — and a text extraction of that PDF silently drops
// accented characters and sometimes whole words. Re-reading it would throw
// all of that away. See docs/content/catalogue-copy.md.
//
// It reads those files by importing them, rather than parsing them as text.
// Node 24 strips TypeScript types natively and every import in `src/data/` is
// type-only, so the data arrives as real objects and a typo in this script
// fails loudly instead of silently matching nothing.
//
// IDs are deterministic — `menuDish-brie-candied-walnuts-leaves`, not a random
// one — so running this twice updates the same documents rather than creating
// a second copy of everything. That matters because the first run will not be
// the last: it is meant to be re-run as content is corrected.
//
// Nothing here talks to Sanity. It writes a file, which is then imported with
// `npx sanity dataset import content.ndjson <dataset>`. Keeping the two apart
// means the output can be read and checked before anything reaches a dataset.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const imagesRoot = path.join(repoRoot, "src", "assets", "images")
const outputPath = path.join(repoRoot, "sanity", "import", "content.ndjson")
const summaryOnly = process.argv.includes("--summary")

// --- Helpers ---------------------------------------------------------------

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)

const slugField = (value) => ({ _type: "slug", current: slugify(value) })

/** "€53" -> 53, "from €12" -> 12, "On request" -> null. */
const parseAmount = (price) => {
  const match = String(price ?? "").match(/([\d]+(?:[.,]\d{1,2})?)/)

  return match ? Number(match[1].replace(",", ".")) : null
}

const priceUnitFor = (unit) => (/person/i.test(unit ?? "") ? "per-person" : "flat")

/** "from €12" is the cheapest of several options; "€53" is a plain price. */
const isStartingPrice = (price) => /^from\b/i.test(String(price ?? "").trim())

/** "26 April 2014" -> "2014-04-26", the shape a Sanity date field stores. */
const toIsoDate = (displayDate) => {
  if (!displayDate) return undefined
  const parsed = new Date(`${displayDate} 12:00 UTC`)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

// The keys in src/lib/images.ts's WEB_COPY_ONLY, read from the file as text:
// it uses Vite's import.meta.glob, so Node cannot import it. These photos are
// already-compressed copies, and the flag tells the site not to compress them
// again (the stations are web copies too, by folder).
const webCopyKeys = new Set(
  [
    ...fs
      .readFileSync(path.join(repoRoot, "src", "lib", "images.ts"), "utf8")
      .matchAll(/^\s*"([a-z0-9-]+\/[a-z0-9-/]+)",$/gm),
  ].map((match) => match[1]),
)

const isWebCopy = (key) =>
  webCopyKeys.has(key) || key.startsWith("reception-menu/stations/")

/**
 * A photo by its key in src/lib/images.ts, as an image field the importer
 * uploads. `_sanityAsset` is the import tool's own convention: it uploads the
 * file, then swaps this for a reference to the stored asset. Uploads are
 * deduplicated by content, so re-running this does not store a second copy.
 */
const imageField = (key, extraFields = {}) => {
  const fileName = fs
    .readdirSync(path.join(imagesRoot, path.dirname(key)))
    .find((name) => name.replace(/\.(jpg|png|webp)$/, "") === path.basename(key))

  if (!fileName) throw new Error(`No photo "${key}" in src/assets/images/`)

  return {
    _type: "image",
    _sanityAsset: `image@${pathToFileURL(path.join(imagesRoot, path.dirname(key), fileName)).href}`,
    isWebCopy: isWebCopy(key),
    ...extraFields,
  }
}

/**
 * Every price on the site comes from one shared client quote rather than from
 * the catalogue, so none of it is confirmed and all of it is one data point:
 * pricing is generated internally and moves by season.
 */
const quotePriceProvenance = (overrides = {}) => ({
  _type: "provenance",
  status: "unconfirmed",
  source: "quote",
  sourceDetail: "The single shared client quote (PDF)",
  internalNote:
    "One data point, not a rate card. Pricing is generated internally and varies by month and season; April is said to run higher than March. Confirm before publishing as a fixed rate.",
  blocksPublication: false,
  ...overrides,
})

const buildPrice = (amount, unit, provenance, startingPrice = false) => ({
  _type: "price",
  amount,
  unit,
  isIndicative: true,
  isStartingPrice: startingPrice,
  vatIncluded: true,
  provenance,
})

/**
 * A testimonial quote carries <em>…</em> around the phrase we chose to
 * emphasise. That becomes a Portable Text block with the `emphasis` decorator
 * on exactly that span, so a word appearing twice is unambiguous — which a
 * "quote plus emphasised substring" pair could not manage ("impeccable"
 * appears twice inside one of these four).
 */
const quoteToPortableText = (quote) => {
  const spans = []
  const pattern = /<em>(.*?)<\/em>/g
  let cursor = 0
  let match

  while ((match = pattern.exec(quote)) !== null) {
    if (match.index > cursor) {
      spans.push({ text: quote.slice(cursor, match.index), marks: [] })
    }

    spans.push({ text: match[1], marks: ["emphasis"] })
    cursor = match.index + match[0].length
  }

  if (cursor < quote.length) spans.push({ text: quote.slice(cursor), marks: [] })

  return [
    {
      _type: "block",
      _key: "quote",
      style: "normal",
      markDefs: [],
      children: spans.map((span, index) => ({
        _type: "span",
        _key: `span-${index}`,
        text: span.text,
        marks: span.marks,
      })),
    },
  ]
}

// --- Load the site's content -----------------------------------------------

const load = async () => {
  const [reception, banquet, highTea, beverage, stations, gallery, testimonials] =
    await Promise.all([
      import("../src/data/packages/reception.ts"),
      import("../src/data/packages/banquet.ts"),
      import("../src/data/packages/high-tea.ts"),
      import("../src/data/packages/beverage.ts"),
      import("../src/data/packages/reception-stations.ts"),
      import("../src/data/gallery.ts"),
      import("../src/data/testimonials.ts"),
    ])

  return { reception, banquet, highTea, beverage, stations, gallery, testimonials }
}

// --- Packages ---------------------------------------------------------------

/**
 * The four packages, and the facts about each that are not in the data files
 * themselves. `dietaryMarking` is the load-bearing one: High Tea's source
 * marks no dish vegetarian, so its badges AND the foot-of-page legend are
 * suppressed together rather than markings being guessed from dish names.
 */
const PACKAGES = [
  {
    name: "Reception",
    role: "meal-format",
    tierStyle: "ranked-tiers",
    dietaryMarking: "marked",
    order: 1,
    tiersFrom: "reception",
    exportName: "RECEPTION_TIERS",
  },
  {
    name: "Banquet",
    role: "meal-format",
    tierStyle: "ranked-tiers",
    dietaryMarking: "marked",
    order: 2,
    tiersFrom: "banquet",
    exportName: "BANQUET_TIERS",
  },
  {
    name: "High Tea",
    role: "meal-format",
    tierStyle: "ranked-tiers",
    dietaryMarking: "not-marked-in-source",
    order: 3,
    tiersFrom: "highTea",
    exportName: "HIGH_TEA_TIERS",
  },
  {
    name: "Beverage",
    role: "additive",
    tierStyle: "combinable-categories",
    dietaryMarking: "not-applicable",
    order: 4,
    tiersFrom: "beverage",
    exportName: "BEVERAGE_TIERS",
  },
]

/**
 * The notes that render on a package page. Each is the only thing telling a
 * reader that the figure or absence above it is not settled, so they are
 * created with the content rather than added by hand afterwards.
 */
const PACKAGE_NOTES = {
  Banquet: [
    {
      _type: "packageNote",
      _key: "banquet-price-conflict",
      tone: "warning",
      placement: "below-tier-cards",
      body: "These per-person figures come from a client quote. Separate correspondence from Bacchus describes banqueting as beginning at around €135 per person, highly personalised and arranged through a dedicated meeting. The two have not been reconciled, so both are recorded here rather than one being chosen.",
      resolvesWith: {
        _type: "provenance",
        status: "contested",
        source: "quote",
        sourceDetail: "Client quote (PDF)",
        conflictingValue: "around €135 per person",
        conflictingSource: "Client correspondence, 17 September 2026",
        internalNote:
          "Ask Bacchus which governs before publishing any Banquet price. Do not remove the on-page callout until they answer.",
        blocksPublication: false,
      },
    },
  ],
  "High Tea": [
    {
      _type: "packageNote",
      _key: "high-tea-vegetarian",
      tone: "warning",
      placement: "above-menus",
      body: "The catalogue marks vegetarian dishes throughout the Reception and Banquet menus, but marks none across High Tea. Rather than infer which dishes qualify from their names — which risks mislabelling food for a guest with a dietary requirement — none is marked here.",
      resolvesWith: {
        _type: "provenance",
        status: "unconfirmed",
        source: "catalogue",
        sourceDetail: "No (V) marks printed anywhere in the High Tea section",
        internalNote:
          "Ask Bacchus which High Tea dishes are vegetarian. Restore the badges and the allergen legend's (V) line together.",
        blocksPublication: false,
      },
    },
  ],
  Beverage: [
    {
      _type: "packageNote",
      _key: "beverage-prices",
      tone: "warning",
      placement: "below-tier-cards",
      body: "The catalogue prints no beverage prices. The figures shown come from a client quote instead, and have not been confirmed as current.",
      resolvesWith: quotePriceProvenance(),
    },
  ],
  Reception: [
    {
      _type: "packageNote",
      _key: "reception-stations-ours",
      tone: "warning",
      placement: "page-foot",
      body: "Two things in the stations section are ours rather than the catalogue's: the six categories the stations are grouped into, and every vegetarian marking, which the catalogue does not print and which has been inferred from the dish names. Both are awaiting confirmation from Bacchus.",
      resolvesWith: {
        _type: "provenance",
        status: "unconfirmed",
        source: "assumption",
        sourceDetail:
          "The catalogue lists all sixteen stations flat and marks none vegetarian",
        internalNote:
          "Ask Bacchus to approve the six category labels and the inferred vegetarian marks. Recorded once here rather than on all sixteen stations.",
        blocksPublication: false,
      },
    },
  ],
}

// --- Build the documents ----------------------------------------------------

const build = (content) => {
  const documents = []
  const dishesBySlug = new Map()

  /** Dishes are deduplicated across every tier and package — the whole point. */
  const dishReference = (item) => {
    const slug = slugify(item.name)
    const existing = dishesBySlug.get(slug)

    if (existing) {
      // A dish marked vegetarian anywhere is vegetarian everywhere. The
      // catalogue is inconsistent about repeating the mark on later tiers.
      if (item.vegetarian) existing.isVegetarian = true
    } else {
      dishesBySlug.set(slug, {
        _id: `menuDish-${slug}`,
        _type: "menuDish",
        name: item.name,
        slug: slugField(item.name),
        isVegetarian: Boolean(item.vegetarian),
      })
    }

    return { _type: "reference", _key: `dish-${slug}`, _ref: `menuDish-${slug}` }
  }

  for (const definition of PACKAGES) {
    const packageId = `weddingPackage-${slugify(definition.name)}`
    const tiers = content[definition.tiersFrom][definition.exportName]

    documents.push({
      _id: packageId,
      _type: "weddingPackage",
      name: definition.name,
      slug: slugField(definition.name),
      role: definition.role,
      tierStyle: definition.tierStyle,
      dietaryMarking: definition.dietaryMarking,
      order: definition.order,
      notes: PACKAGE_NOTES[definition.name] ?? [],
    })

    tiers.forEach((tier, index) => {
      const tierId = `packageTier-${slugify(definition.name)}-${tier.id}`
      const amount = parseAmount(tier.price)
      const isBanquet = definition.name === "Banquet"

      const price =
        amount === null
          ? undefined
          : buildPrice(
              amount,
              priceUnitFor(tier.priceUnit),
              isBanquet
                ? quotePriceProvenance({
                    status: "contested",
                    conflictingValue: "around €135 per person",
                    conflictingSource: "Client correspondence, 17 September 2026",
                    internalNote:
                      "Contested. The quote gives this figure; correspondence says banqueting begins at around €135 per person. Do not publish either as settled.",
                  })
                : quotePriceProvenance(),
              isStartingPrice(tier.price),
            )

      documents.push({
        _id: tierId,
        _type: "packageTier",
        package: { _type: "reference", _ref: packageId },
        name: tier.name,
        slug: slugField(tier.id),
        order: index + 1,
        summary: tier.description,
        ...(tier.intro ? { intro: tier.intro } : {}),
        ...(price ? { price } : {}),
        menuGroups: tier.groups.map((group, groupIndex) => ({
          _type: "menuGroup",
          _key: `group-${groupIndex}-${slugify(group.title)}`,
          title: group.title,
          ...(group.subhead ? { note: group.subhead } : {}),
          items: group.items.map((item, itemIndex) =>
            "meta" in item
              ? {
                  _type: "wineEntry",
                  _key: `wine-${itemIndex}-${slugify(item.name)}`,
                  name: item.name,
                  // The data holds one display string, "grapes · producer".
                  grapes: item.meta.split("·")[0]?.trim() ?? "",
                  producer: item.meta.split("·")[1]?.trim() ?? "",
                  ...(item.note ? { tastingNote: item.note } : {}),
                }
              : dishReference(item),
          ),
        })),
        signatureDishes: (tier.dishes ?? []).map((dish, dishIndex) => ({
          _type: "signatureDish",
          _key: `dish-${dishIndex}-${slugify(dish.name)}`,
          name: dish.name,
          ...(dish.category ? { course: dish.category } : {}),
          ...(dish.photo
            ? { image: imageField(dish.photo.src, { alt: dish.photo.alt }) }
            : { placeholderInitials: dish.initials }),
          // No photograph yet renders a "photo to follow" tile, which is a
          // placeholder by any other name.
          isPlaceholderImage: !dish.photo,
        })),
      })
    })
  }

  // --- Stations -------------------------------------------------------------

  for (const [index, category] of content.stations.STATION_CATEGORIES.entries()) {
    documents.push({
      _id: `stationCategory-${category.id}`,
      _type: "stationCategory",
      label: category.label,
      shortLabel: category.shortLabel,
      slug: slugField(category.id),
      order: index + 1,
      labelProvenance: {
        _type: "provenance",
        status: "unconfirmed",
        source: "assumption",
        sourceDetail: "The catalogue lists all sixteen stations flat, ungrouped",
        internalNote: "Our grouping and our labels. Awaiting the client's approval.",
        blocksPublication: false,
      },
    })
  }

  const stationOrderByCategory = new Map()

  for (const station of content.stations.STATIONS) {
    const order = (stationOrderByCategory.get(station.category) ?? 0) + 1
    stationOrderByCategory.set(station.category, order)

    const amount = parseAmount(station.price)

    documents.push({
      _id: `station-${slugify(station.name)}`,
      _type: "station",
      name: station.name,
      slug: slugField(station.name),
      category: { _type: "reference", _ref: `stationCategory-${station.category}` },
      catalogueNumber: station.number,
      order,
      ...(amount === null
        ? {}
        : {
            price: buildPrice(
              amount,
              priceUnitFor(station.priceUnit),
              quotePriceProvenance({
                source: "catalogue",
                sourceDetail: "Station prices as printed in the catalogue",
              }),
            ),
          }),
      items: station.items.map((item, index) => ({
        _type: "stationItem",
        _key: `item-${index}-${slugify(item.name)}`,
        name: item.name,
        isVegetarian: Boolean(item.vegetarian),
      })),
      servingNote: station.servingNote,
      allItemsVegetarian: station.items.every((item) => item.vegetarian),
      isChefsPick: false,
      // Every station photograph is an AI-generated stand-in, approved as a
      // one-off so the section reads as finished in a pitch. The flag is what
      // keeps the on-page disclaimer attached to the image rather than to the
      // page, and puts them on the "needs a real export" list.
      image: imageField(station.photo.src, {
        isPlaceholder: true,
        alt: station.photo.alt,
      }),
    })
  }

  // --- Gallery --------------------------------------------------------------

  // The category's own name is what the caption shows unless a photo says
  // otherwise, so only the photos that differ get a label.
  const categoryTitles = {
    weddings: "Weddings",
    corporate: "Corporate",
    celebrations: "Celebrations",
    venue: "Venue",
  }

  for (const [index, photo] of content.gallery.GALLERY_PHOTOS.entries()) {
    const image = imageField(photo.src)
    const hasOwnLabel = photo.tag !== categoryTitles[photo.category]

    documents.push({
      _id: `galleryImage-${slugify(photo.src)}`,
      _type: "galleryImage",
      image: { _type: "image", _sanityAsset: image._sanityAsset },
      alt: photo.alt,
      title: photo.title,
      category: photo.category,
      ...(hasOwnLabel ? { label: photo.tag } : {}),
      ...(hasOwnLabel && photo.badge ? { shortLabel: photo.badge } : {}),
      isFeatured: Boolean(photo.wide),
      isWebCopy: image.isWebCopy,
      isPlaceholder: false,
      order: index + 1,
    })
  }

  // --- Testimonials ---------------------------------------------------------

  for (const [index, testimonial] of content.testimonials.TESTIMONIALS.entries()) {
    documents.push({
      _id: `testimonial-${slugify(testimonial.name)}`,
      _type: "testimonial",
      quote: quoteToPortableText(testimonial.quote),
      authorFullName: testimonial.name,
      displayName: testimonial.name,
      rating: testimonial.rating,
      location: testimonial.location,
      ...(toIsoDate(testimonial.date) ? { eventDate: toIsoDate(testimonial.date) } : {}),
      category: "wedding",
      // Real, client-supplied reviews, front-loaded by hand rather than
      // collected through the review-request flow — so there is no booking to
      // point at, and consent came with them rather than through a form.
      status: "published",
      consentName: true,
      consentPhoto: false,
      order: index + 1,
    })
  }

  return { documents, dishes: [...dishesBySlug.values()] }
}

// --- Run --------------------------------------------------------------------

const content = await load()
const { documents, dishes } = build(content)
const all = [...dishes, ...documents]

const counts = all.reduce((tally, document) => {
  tally[document._type] = (tally[document._type] ?? 0) + 1

  return tally
}, {})

console.log("Documents by type:")
for (const [type, count] of Object.entries(counts).sort()) {
  console.log(`  ${String(count).padStart(4)}  ${type}`)
}
console.log(`  ${String(all.length).padStart(4)}  total`)

// Every reference is checked before anything is written. A dangling one would
// import without complaint and surface later as a menu with missing lines,
// which is the failure this whole content model exists to avoid.
const ids = new Set(all.map((document) => document._id))
const problems = []

const duplicateIds = [
  ...new Set(
    all
      .map((document) => document._id)
      .filter((id, index, list) => list.indexOf(id) !== index),
  ),
]
if (duplicateIds.length > 0)
  problems.push(`Duplicate _id values: ${duplicateIds.join(", ")}`)

let referenceCount = 0

const checkReference = (reference, describe) => {
  if (!reference?._ref) return
  referenceCount += 1
  if (!ids.has(reference._ref))
    problems.push(`${describe} points at missing ${reference._ref}`)
}

for (const document of all) {
  checkReference(document.package, `${document._id}.package`)
  checkReference(document.category, `${document._id}.category`)

  for (const group of document.menuGroups ?? []) {
    for (const item of group.items ?? []) {
      checkReference(item, `${document._id} / ${group.title}`)
    }
  }
}

const dishReferences = all
  .flatMap((document) => document.menuGroups ?? [])
  .flatMap((group) => group.items ?? [])
  .filter((item) => item._type === "reference").length
const dishCount = counts.menuDish ?? 0

console.log(
  `\n${dishReferences} dish references resolve to ${dishCount} stored dishes — ` +
    `${dishReferences - dishCount} duplicate lines avoided.`,
)
console.log(`${referenceCount} references checked, all resolve.`)

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`)
  problems.forEach((problem) => console.error(`  - ${problem}`))
  process.exit(1)
}

// Exits naturally rather than through process.exit, which on Windows tears
// down libuv's handles mid-flight and trips an assertion after the work is
// already done — a success that prints like a crash.
if (!summaryOnly) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(
    outputPath,
    all.map((document) => JSON.stringify(document)).join("\n") + "\n",
  )

  console.log(`\nWritten to ${path.relative(repoRoot, outputPath)}`)
  console.log("Import it with: npx sanity dataset import content.ndjson <dataset>")
}
