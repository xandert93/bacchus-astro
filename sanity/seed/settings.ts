/**
 * The two settings documents, which the Studio edits in place under fixed
 * ids (see structure.ts), and the extra fields filled in on the content
 * copied from production.
 *
 * Settings use the facts we have, each with its provenance. Two things are
 * deliberately not real: the notification address (an example.com inbox, so
 * nothing sent from development can reach Bacchus) and the bank details.
 */
import { SEASON_IDS } from "./venue"
import { fromEmails, invented, keyed, price, provenance, reference } from "./lib"

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
  phone: "+356 2145 4981",
  email: "events@bacchus.com.mt",
  address: "1 Inguanez Street, Mdina MDN 1000, Malta",
  facebookUrl: "https://www.facebook.com/bacchusMdina",
  instagramUrl: "https://www.instagram.com/bacchus_mdina/",
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
  minNoticeProvenance: invented("no minimum notice has been given"),
  weddingsPerDay: 1,
  waitlistCapPerEmail: 8,
  estateCapacity: {
    _type: "capacity",
    min: 50,
    max: 800,
    basis: "standing",
    layoutNote: "The layout is adjusted to the guest count.",
    provenance: fromEmails("Capacity: 50–800 guests, standing"),
  },
  standardDurationHours: 5,
  maxAdvisedDurationHours: 8,
  outdoorMusicCurfew: "23:00",
  indoorMusicCurfew: "04:00",
  restaurantClosesAboveGuests: 150,
  coordinatorIncluded: true,
  coupleSourcesThemselves:
    "Flowers, entertainment (a DJ or band, including any stage) and a photographer. A photobooth is a common extra.",
  depositPercent: 30,
  balanceDueDays: 14,
  depositTermsProvenance: provenance(
    "contested",
    "catalogue",
    "30% deposit, balance 14 days out",
    {
      conflictingValue: "Terms described as 'quite flexible'",
      conflictingSource: "Client correspondence, 17 September 2026",
    },
  ),
  depositHoldDays: 7,
  depositHoldProvenance: invented("illustrative hold period on the deposit page"),
  bankTransferDetails: {
    accountName: "Bacchus Ltd",
    iban: "MT99 BACC 0000 0000 0000 0000 0000 000",
    bic: "BACCMTMT",
    bankName: "Example Bank",
    areReal: false,
  },
  tastingFee: price(
    40,
    "per-person",
    provenance(
      "unconfirmed",
      "correspondence",
      "About €40 per person, deducted if they book",
    ),
  ),
  tastingNote:
    "Request in advance. The couple picks 16 items from their package: 6 hot, 6 cold, 4 desserts. Stations can't be tasted.",
  cakeNote:
    "An in-house cake is included in the Reception package: in practice always a three-tier display cake. Couples may bring their own.",
  corkageNote:
    "Applies only to drinks a couple brings themselves. The quote's €6.50 doesn't say per bottle or per person, so it isn't published.",
  dietaryNote: "Vegetarian, vegan and gluten-free needs are catered for.",
  accessibilityNote: "A stairlift, and staff help guests with any needs.",
  parkingNote: "Guests can book 'the Tomba'. Nobody has said what that is.",
  parkingProvenance: provenance(
    "unconfirmed",
    "correspondence",
    "'Guests can book the Tomba'",
  ),
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
      heroHeading: "Our Reception Menus",
      heroIntro:
        "Canapés passed by hand, a flying buffet, desserts and the wedding cake, taken standing rather than at a seated breakfast.",
      allergenNote:
        "Menu items may contain or come into contact with allergens. Please discuss requirements with the Bacchus sales team.",
    },
  ],
  [
    "weddingPackage-banquet",
    {
      cardSummary:
        "A seated six-course dinner, from a welcome canapé to the cutting of the cake.",
      heroHeading: "Our Banquet Menus",
      heroIntro:
        "A seated dinner in the De Redin ballroom: six courses, from a welcome canapé to the cutting of the cake.",
    },
  ],
  [
    "weddingPackage-high-tea",
    {
      cardSummary:
        "An afternoon alternative to the formal banquet: dainty sandwiches, hot savouries and sweets.",
      heroHeading: "Our High Tea Menus",
      heroIntro:
        "Dainty sandwiches, hot savouries and a table of sweets: an afternoon alternative to the formal banquet.",
    },
  ],
  [
    "weddingPackage-beverage",
    {
      cardSummary:
        "Wine, bar and themed-bar packages, chosen alongside your meal format.",
      heroHeading: "Our Beverage Menus",
      heroIntro:
        "Wine, bar and themed-bar packages, chosen alongside whichever meal format your wedding takes, not instead of one.",
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
      seasonalRates: keyed([
        {
          _type: "seasonalRate",
          season: reference(SEASON_IDS.peak),
          price: price(amount, "per-person", invented("no seasonal rate card exists")),
        },
      ]),
    },
  ]),

  // Corrections awaiting the client's approval, modelled on the ones in
  // docs/content/catalogue-copy.md, so the Studio's list of them has entries.
  // The "as printed" wording is approximate.
  ...(
    [
      [
        "menuDish-chicken-curry-capsicum-and-pine-nut-roll",
        "Chicken Curry, Capsicum & Pine Not Roll",
        "correction",
        "Misspelling",
      ],
      [
        "menuDish-assorted-macarons",
        "Assorted Macaroons",
        "correction",
        "Macaroons are a different biscuit",
      ],
      [
        "menuDish-pancetta-and-caramelised-onion-quiche",
        "Pancetta & Caramelized Onion Quiche",
        "normalisation",
        "British English",
      ],
      ["station-bbq-table", "Barbeque Table", "rewrite", "Renamed on request"],
    ] as const
  ).map(([id, asPrinted, kind, reason]): [string, Record<string, unknown>] => [
    id,
    {
      catalogueVariance: {
        _type: "catalogueVariance",
        asPrinted,
        kind,
        reason,
        clientApproved: false,
      },
    },
  ]),
]

export const settingsDocuments = [siteSettings, weddingPolicy]
