/**
 * The venue: its spaces, closures, add-ons and pricing seasons.
 *
 * Spaces and add-ons use the real names and figures we have (catalogue,
 * quote and emails), with the same provenance the production documents will
 * need. Capacities, seasons and closures are invented, and say so.
 */
import {
  addDays,
  fromQuote,
  invented,
  isoDate,
  keyedReferences,
  price,
  provenance,
  saturdayInMonths,
  seedId,
  today,
} from "./lib"

export const SPACE_IDS = {
  hall: seedId("space-prince-de-redin-hall"),
  terrace: seedId("space-terrace"),
  garden: seedId("space-secret-garden"),
  smallTerrace: seedId("space-small-terrace"),
}

const fromCatalogue = (detail: string) => provenance("unconfirmed", "catalogue", detail)

const spaces = [
  {
    _id: SPACE_IDS.hall,
    _type: "venueSpace",
    name: "Prince De Redin Hall",
    slug: { _type: "slug", current: "prince-de-redin-hall" },
    aliases: ["De Redin Ballroom", "the ballroom"],
    nameProvenance: fromCatalogue(
      "Named in the catalogue; the quote says 'De Redin Ballroom'",
    ),
    shortDescription:
      "The banquet hall, named after the Grand Master who built the estate.",
    description:
      "The covered banqueting hall at the heart of the estate, used for seated dinners and as the indoor half of every wedding. Named after Grand Master Fra Martino de Redin.",
    setting: "indoor",
    capacity: {
      _type: "capacity",
      max: 250,
      basis: "seated",
      provenance: invented("no seated capacity has been given"),
    },
    includedInStandardPackage: true,
    inclusionNote:
      "Always included alongside the outdoor space, not just as a wet-weather fallback.",
    exclusivityFee: price(
      500,
      "flat",
      fromQuote("Quote line: exclusive use, De Redin Ballroom"),
    ),
    curfewNote: "Indoor music until 4am.",
    images: keyedReferences([
      "galleryImage-venue-hall-chandeliers-banquet",
      "galleryImage-venue-ballroom-night",
    ]),
    order: 1,
  },
  {
    _id: SPACE_IDS.terrace,
    _type: "venueSpace",
    name: "Terrace",
    slug: { _type: "slug", current: "terrace" },
    nameProvenance: fromCatalogue("Named in the catalogue"),
    shortDescription: "The open-air terrace for receptions and long-table dinners.",
    description:
      "The outdoor terrace, included in the standard wedding package, for drinks receptions, canapés and dinners under the sky.",
    setting: "outdoor",
    capacity: {
      _type: "capacity",
      max: 300,
      basis: "standing",
      provenance: invented("no terrace capacity has been given"),
    },
    includedInStandardPackage: true,
    curfewNote: "Outdoor music until 11pm.",
    images: keyedReferences([
      "galleryImage-venue-terrace-seated",
      "galleryImage-venue-terrace-celebration-reception",
    ]),
    order: 2,
  },
  {
    _id: SPACE_IDS.garden,
    _type: "venueSpace",
    name: "Secret Garden",
    slug: { _type: "slug", current: "secret-garden" },
    nameProvenance: fromCatalogue("Named in the catalogue"),
    shortDescription: "A walled garden with 1st-century Roman and Arab remains.",
    description:
      "A walled garden on the estate, with Roman and Arab remains from the 1st century. Not part of the standard package; Bacchus suggests it as a chill-out or shisha area.",
    setting: "outdoor",
    capacity: {
      _type: "capacity",
      max: 120,
      basis: "standing",
      provenance: invented("no garden capacity has been given"),
    },
    includedInStandardPackage: false,
    inclusionNote: "Not included by default. Suggested as a chill-out or shisha area.",
    exclusivityFee: price(
      500,
      "flat",
      fromQuote("Quote line: exclusive use, Secret Garden"),
    ),
    curfewNote: "Outdoor music until 11pm.",
    images: keyedReferences(["galleryImage-weddings-guest-portrait"]),
    order: 3,
  },
  {
    _id: SPACE_IDS.smallTerrace,
    _type: "venueSpace",
    name: "Small Terrace",
    slug: { _type: "slug", current: "small-terrace" },
    nameProvenance: provenance("unconfirmed", "quote", "Appears only as a quote line"),
    shortDescription: "A smaller terrace, priced separately on the quote.",
    setting: "outdoor",
    includedInStandardPackage: false,
    exclusivityFee: price(
      500,
      "flat",
      fromQuote("Quote line: exclusive use, Small Terrace"),
    ),
    order: 4,
  },
]

// Closures, relative to today.
const start = today()
const christmasYear =
  start.getUTCMonth() === 11 && start.getUTCDate() > 26
    ? start.getUTCFullYear() + 1
    : start.getUTCFullYear()

const closures = [
  {
    _id: seedId("closure-christmas"),
    _type: "venueClosure",
    title: "Closed for Christmas",
    startDate: `${christmasYear}-12-24`,
    endDate: `${christmasYear}-12-26`,
    reason: "closed",
    blocksWeddings: true,
    showPublicly: true,
    publicNote: "Closed for Christmas",
  },
  {
    _id: seedId("closure-garden-maintenance"),
    _type: "venueClosure",
    title: "Secret Garden: stonework repairs",
    startDate: isoDate(addDays(start, 30)),
    endDate: isoDate(addDays(start, 33)),
    reason: "maintenance",
    spaces: keyedReferences([SPACE_IDS.garden]),
    blocksWeddings: false,
    showPublicly: false,
  },
  {
    _id: seedId("closure-provisional-hold"),
    _type: "venueClosure",
    title: "Held for a provisional booking (awaiting contract)",
    startDate: isoDate(saturdayInMonths(10)),
    endDate: isoDate(saturdayInMonths(10)),
    reason: "held",
    blocksWeddings: true,
    showPublicly: false,
  },
]

const addOn = (
  name: string,
  category: string,
  details: {
    amount?: number
    unit?: "each" | "flat"
    description?: string
    included?: boolean
  },
) => ({
  _id: seedId(
    `addon-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "")}`,
  ),
  _type: "addOn",
  name,
  category,
  isIncludedAtNoCharge: details.included ?? false,
  ...(details.amount === undefined
    ? {}
    : { price: price(details.amount, details.unit ?? "each", fromQuote()) }),
  ...(details.description ? { description: details.description } : {}),
  availableForQuote: true,
})

const addOns = [
  addOn("Round family table", "furniture", {
    amount: 15,
    description: "One per family, seating up to 10.",
  }),
  addOn("Chair", "furniture", { amount: 5 }),
  addOn("Chair bow", "decoration", { amount: 3 }),
  addOn("Bistro table", "furniture", { amount: 10 }),
  addOn("Bar piece", "bar", {
    amount: 250,
    description: "A physical bar structure, in place of a skirted drinks table.",
  }),
  addOn("Sound system", "technical", { amount: 500, unit: "flat" }),
  addOn("Red carpet", "decoration", { amount: 150, unit: "flat" }),
  addOn("Catering furniture and utensils", "furniture", { included: true }),
  addOn("Basic decoration", "decoration", { included: true }),
  addOn("In-house wedding coordinator", "service", {
    included: true,
    description: "A member of Bacchus staff, not an outside planner.",
  }),
]

const season = (
  name: string,
  startMonthDay: string,
  endMonthDay: string,
  priority: number,
) => ({
  _id: seedId(`season-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
  _type: "season",
  name,
  slug: { _type: "slug", current: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
  startDate: `${start.getUTCFullYear()}-${startMonthDay}`,
  endDate: `${start.getUTCFullYear()}-${endMonthDay}`,
  repeatsAnnually: true,
  priority,
  provenance: invented("Bacchus has said only that April runs dearer than March"),
})

export const SEASON_IDS = { peak: seedId("season-peak-summer") }

const seasons = [
  season("Peak summer", "06-01", "09-30", 2),
  season("Spring shoulder", "04-01", "05-31", 1),
  season("Autumn shoulder", "10-01", "10-31", 1),
]

export const venueDocuments = [...spaces, ...closures, ...addOns, ...seasons]
