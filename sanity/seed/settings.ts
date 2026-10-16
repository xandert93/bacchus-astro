/**
 * The two settings documents, which the Studio edits in place under fixed
 * ids (see structure.ts), and the extra fields filled in on the content
 * copied from production.
 *
 * Settings use the facts we have. Two things are
 * deliberately not real: the notification address (an example.com inbox, so
 * nothing sent from development can reach Bacchus) and the bank details.
 */
import { SEASON_IDS } from "./venue"
import { keyed, price, reference } from "./lib"

const siteSettings = {
  _id: "siteSettings",
  _type: "siteSettings",
  businessName: "Bacchus",
  tagline: "Events in Mdina, Malta",
  brandBlurb:
    "A restaurant in two vaulted 17th-century chambers, and an events venue across the Hall, the Terrace and the Secret Garden, within the walls of Mdina.",
  foundedYear: 1976,
  buildingBuiltFrom: 1657,
  estateNote:
    "About 4,500 m² of grounds, including about 500 m² of covered banqueting space: roughly a twelfth of Mdina.",
  contact: {
    phone: "+356 2145 4981",
    email: "events@bacchus.com.mt",
    address: "1 Inguanez Street, Mdina MDN 1000, Malta",
  },
  social: {
    facebook: "https://www.facebook.com/bacchusMdina",
    instagram: "https://www.instagram.com/bacchus_mdina/",
  },
  enquiryNotificationEmails: ["events-inbox@example.com"],
  structuredData: {
    businessType: "Restaurant",
  },
}

const weddingPolicy = {
  _id: "weddingPolicy",
  _type: "weddingPolicy",
  bookingHorizonMonths: 24,
  minNoticeMonths: 3,
  weddingsPerDay: 1,
  waitlistCapPerEmail: 8,
  estateCapacity: {
    _type: "capacity",
    min: 50,
    max: 800,
    basis: "standing",
    layoutNote: "The layout is adjusted to the guest count.",
  },
  eventLength: { standardHours: 5, maxAdvisedHours: 8 },
  musicCurfew: { outdoor: "23:00", indoor: "04:00" },
  restaurantClosesAboveGuests: 150,
  coordinatorIncluded: true,
  coupleSourcesThemselves:
    "Flowers, entertainment (a DJ or band, including any stage) and a photographer. A photobooth is a common extra.",
  vatRate: 18,
  deposit: { percent: 30, balanceDueDays: 14, holdDays: 7 },
  bankTransferDetails: {
    accountName: "Bacchus Ltd",
    iban: "MT99 BACC 0000 0000 0000 0000 0000 000",
    bic: "BACCMTMT",
    bankName: "Example Bank",
    areReal: false,
  },
  tastingFee: price(40, "per-person"),
  tastingNote:
    "Request in advance. The couple picks 16 items from their package: 6 hot, 6 cold, 4 desserts. Stations can't be tasted.",
  cakeNote:
    "An in-house cake is included in the Reception package: in practice always a three-tier display cake. Couples may bring their own.",
  corkageNote:
    "Applies only to drinks a couple brings themselves. The quote's €6.50 doesn't say per bottle or per person, so it isn't published.",
  dietaryNote: "Vegetarian, vegan and gluten-free needs are catered for.",
  accessibilityNote: "A stairlift, and staff help guests with any needs.",
  parkingNote: "Guests can book 'the Tomba'.",
  retentionMonths: 36,
}

/**
 * Fields left empty by the migration, filled in on the copied documents.
 * Each entry is `[document id, fields to set]`.
 */
export const contentPatches: [string, Record<string, unknown>][] = [
  // Package card and hero copy, from the Weddings page and the package pages.
  [
    "weddingPackage-reception",
    {
      cardSummary:
        "A relaxed standing reception: cold and hot canapés, a flying buffet, desserts and the wedding cake.",
      hero: {
        heading: "Our Reception Menus",
        intro:
          "Canapés passed by hand, a flying buffet, desserts and the wedding cake, taken standing rather than at a seated breakfast.",
      },
      allergenNote:
        "Menu items may contain or come into contact with allergens. Please discuss requirements with the Bacchus sales team.",
    },
  ],
  [
    "weddingPackage-banquet",
    {
      cardSummary:
        "A seated six-course dinner, from a welcome canapé to the cutting of the cake.",
      hero: {
        heading: "Our Banquet Menus",
        intro:
          "A seated dinner in the De Redin ballroom: six courses, from a welcome canapé to the cutting of the cake.",
      },
    },
  ],
  [
    "weddingPackage-high-tea",
    {
      cardSummary:
        "An afternoon alternative to the formal banquet: dainty sandwiches, hot savouries and sweets.",
      hero: {
        heading: "Our High Tea Menus",
        intro:
          "Dainty sandwiches, hot savouries and a table of sweets: an afternoon alternative to the formal banquet.",
      },
    },
  ],
  [
    "weddingPackage-beverage",
    {
      cardSummary:
        "Wine, bar and themed-bar packages, chosen alongside your meal format.",
      hero: {
        heading: "Our Beverage Menus",
        intro:
          "Wine, bar and themed-bar packages, chosen alongside whichever meal format your wedding takes, not instead of one.",
      },
    },
  ],

  // A peak-season rate on each Reception tier, so the price resolver has a
  // season to resolve. Invented: there is no rate card.
  ...(
    [
      ["packageTier-reception-daisy", 57],
      ["packageTier-reception-lavender", 61],
      ["packageTier-reception-rose", 68],
    ] as const
  ).map(([id, amount]): [string, Record<string, unknown>] => [
    id,
    {
      "pricing.seasonal": keyed([
        {
          _type: "seasonalRate",
          season: reference(SEASON_IDS.peak),
          price: price(amount, "per-person"),
        },
      ]),
    },
  ]),
]

export const settingsDocuments = [siteSettings, weddingPolicy]
