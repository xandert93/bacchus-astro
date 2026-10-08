/**
 * FAQs, guide articles, suppliers, testimonials awaiting review, and the
 * parked restaurant menu.
 *
 * The FAQ answers are real facts from the client's emails and catalogue,
 * marked with how sure we are. Suppliers are invented businesses with
 * example.com addresses.
 */
import { COMPLETED_BOOKINGS } from "./bookings"
import {
  emphasisedQuote,
  fromEmails,
  isoDate,
  isoDateTime,
  keyed,
  keyedReferences,
  paragraphs,
  privateSeedId,
  provenance,
  reference,
  saturdayInMonths,
  seedId,
  thursdayInMonths,
  today,
} from "./lib"
import { SPACE_IDS } from "./venue"

// Photos already in the dataset, reused rather than uploaded again.
const ASSETS = {
  canapesService: "image-84f874e15aca1774164268977a688739b45b3c1d-1024x1280-jpg",
  canapesTray: "image-bbe444caaf27d710b3a06d5925afab3fe6ba9d50-3712x4608-jpg",
  canapeRoulade: "image-e961fa54c475b89ddfda9fd315a461ed3e7f832d-1024x1280-webp",
  cocktailTray: "image-23aff50ac38d6d0ca24a23e37e7cbb58a5496ac3-1024x1280-webp",
  seabass: "image-5ac528b2d6501181083b26ac57d2579484bd1f85-1024x600-jpg",
  lamb: "image-7c30b443f82f17aaac220b1290ed5d310a0928c9-560x680-jpg",
  hallBanquet: "image-427a817401c1fc18cec57c7dd350204ca917953c-5056x3392-jpg",
  champagne: "image-c45a014de92ac277e2f407942ab3d0fb5040eca3-1856x2304-jpg",
  toast: "image-fb5cae0c2d0cc3815ac3c3039e0a18bd68382b6b-3712x4608-jpg",
  terraceSeated: "image-0934fc499355a1aec828a1fd5343f5f1e9873b81-2400x1350-png",
}

const image = (assetId: string, alt: string) => ({
  _type: "image",
  asset: reference(assetId),
  alt,
})

// --- FAQs ------------------------------------------------------------------

const faq = (
  key: string,
  question: string,
  answer: string,
  topic: string,
  source: ReturnType<typeof provenance>,
  showOnPages: string[],
  order: number,
) => ({
  _id: seedId(`faq-${key}`),
  _type: "faq",
  question,
  answer: paragraphs(answer),
  topic,
  provenance: source,
  // Only confirmed answers are released to the chat assistant.
  availableToAssistant: source.status === "confirmed",
  showOnPages,
  order,
})

const faqs = [
  faq(
    "music",
    "How late can the music go on?",
    "Outdoor music runs until 11pm. Indoors, the music can carry on until 4am.",
    "timings",
    fromEmails("Music curfews"),
    ["weddings", "celebrations"],
    1,
  ),
  faq(
    "length",
    "How long does a wedding package last?",
    "Packages usually run for five hours. Many weddings extend to six; we'd advise against going past eight.",
    "timings",
    fromEmails("Package length and overtime"),
    ["weddings"],
    2,
  ),
  faq(
    "cake",
    "Is the wedding cake included?",
    "Yes: an in-house cake is included in the Reception package. You're also welcome to bring your own.",
    "food",
    fromEmails("Cake"),
    ["weddings", "packages"],
    3,
  ),
  faq(
    "dietary",
    "Can you cater for vegetarian, vegan and gluten-free guests?",
    "Yes. Tell us about any dietary needs when you plan your menu and the kitchen will look after them.",
    "food",
    fromEmails("Dietary requirements"),
    ["weddings", "corporate", "celebrations", "packages"],
    4,
  ),
  faq(
    "garden",
    "Is the Secret Garden part of the standard package?",
    "Not by default. It can be added, and works well as a quieter chill-out area alongside the Terrace and the hall.",
    "spaces",
    fromEmails("Secret Garden inclusion"),
    ["weddings"],
    5,
  ),
  faq(
    "bring",
    "What do we need to arrange ourselves?",
    "Flowers, entertainment (a band or DJ) and your photographer. Furniture, basic decoration and an in-house wedding coordinator are included.",
    "planning",
    fromEmails("What couples bring"),
    ["weddings"],
    6,
  ),
  faq(
    "access",
    "Is the venue accessible?",
    "There's a stairlift, and our staff will help any guest who needs it.",
    "practical",
    fromEmails("Accessibility"),
    ["weddings", "corporate", "celebrations"],
    7,
  ),
  faq(
    "tasting",
    "Can we taste the menu before we book?",
    "Yes, by arrangement. You choose 16 dishes from your package. The tasting fee is deducted from your wedding if you go on to book.",
    "food",
    provenance("unconfirmed", "correspondence", "Tasting terms", {
      internalNote: "The point at which the tasting becomes free isn't settled.",
    }),
    ["weddings", "packages"],
    8,
  ),
  faq(
    "deposit",
    "How much is the deposit?",
    "A deposit secures your date, with the balance due before the day. We'll confirm the exact terms in your quote.",
    "pricing",
    provenance("contested", "catalogue", "30% deposit, balance 14 days out", {
      conflictingValue: "Terms described as 'quite flexible'",
      conflictingSource: "Client correspondence, 17 September 2026",
    }),
    ["weddings", "deposit"],
    9,
  ),
  faq(
    "parking",
    "Is there parking?",
    "Guests can book parking nearby. We'll send the details with your confirmation.",
    "practical",
    provenance("unconfirmed", "correspondence", "'Guests can book the Tomba'", {
      internalNote: "Nobody has said what 'the Tomba' is. Ask before publishing.",
      blocksPublication: true,
    }),
    ["weddings"],
    10,
  ),
]

// --- Guide articles ----------------------------------------------------------

const guides = [
  {
    _id: seedId("guide-getting-married-at-bacchus"),
    _type: "guideArticle",
    title: "Getting married at Bacchus",
    slug: { _type: "slug", current: "getting-married-at-bacchus" },
    excerpt:
      "What a Bacchus wedding includes, what you bring, and how the day runs, from the first enquiry to the last dance.",
    heroImage: image(ASSETS.toast, "A bride and groom clinking champagne glasses"),
    body: paragraphs(
      "Weddings at Bacchus take place across the Terrace and the Prince De Redin Hall, on an estate within the walls of Mdina.",
      "Catering furniture, basic decoration and an in-house wedding coordinator are included. You bring the flowers, the music and your photographer.",
      "Outdoor music runs until 11pm; indoors, the party can carry on until 4am.",
    ),
    category: "weddings",
    relatedSpaces: keyedReferences([SPACE_IDS.terrace, SPACE_IDS.hall]),
    relatedPackages: keyedReferences([
      "weddingPackage-reception",
      "weddingPackage-banquet",
    ]),
    status: "draft",
    order: 1,
  },
  {
    _id: seedId("guide-secret-garden-weddings"),
    _type: "guideArticle",
    title: "Secret garden weddings in Malta",
    slug: { _type: "slug", current: "secret-garden-weddings-malta" },
    category: "weddings",
    relatedSpaces: keyedReferences([SPACE_IDS.garden]),
    status: "idea",
    order: 2,
  },
  {
    _id: seedId("guide-wedding-costs"),
    _type: "guideArticle",
    title: "What a wedding at Bacchus costs",
    slug: { _type: "slug", current: "wedding-costs" },
    category: "weddings",
    status: "blocked",
    blockedReason:
      "Banquet pricing is contested, prices vary by season with no rate card, and capacities are placeholders.",
    order: 3,
  },
  {
    _id: seedId("guide-reasons-mdina"),
    _type: "guideArticle",
    title: "10 reasons to marry in Mdina",
    slug: { _type: "slug", current: "reasons-to-marry-in-mdina" },
    category: "mdina",
    status: "idea",
    order: 4,
  },
  {
    _id: seedId("guide-historic-building"),
    _type: "guideArticle",
    title: "Getting married in a historic building in Malta: what to ask",
    slug: { _type: "slug", current: "historic-building-wedding-questions" },
    category: "mdina",
    status: "idea",
    order: 5,
  },
]

// --- Suppliers ----------------------------------------------------------------

const supplier = (
  name: string,
  category: string,
  description: string,
  flags: { preferred?: boolean; published?: boolean },
  order: number,
) => {
  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")

  return {
    _id: seedId(`supplier-${slug}`),
    _type: "supplier",
    name,
    slug: { _type: "slug", current: slug },
    category,
    description,
    websiteUrl: `https://${slug}.example.com`,
    contactEmail: `hello@${slug}.example.com`,
    isPreferred: flags.preferred ?? false,
    isPublished: flags.published ?? false,
    order,
  }
}

const suppliers = [
  supplier(
    "Silent City Studio",
    "photographer",
    "Documentary wedding photography.",
    { preferred: true, published: true },
    1,
  ),
  supplier(
    "Bastion Films",
    "videographer",
    "Short wedding films, delivered within a month.",
    { published: true },
    2,
  ),
  supplier(
    "Wild Caper Florals",
    "florist",
    "Seasonal Maltese flowers.",
    { preferred: true, published: true },
    3,
  ),
  supplier(
    "The Gozo Quartet",
    "band",
    "Strings for the ceremony, jazz for dinner.",
    { published: true },
    4,
  ),
  supplier("Night Shift DJs", "dj", "Dance floor through to 4am.", {}, 5),
  supplier("Snapbox Malta", "photobooth", "Photobooth with instant prints.", {}, 6),
]

// --- Testimonials awaiting review ----------------------------------------------
// None of these is published, so none reaches the site: the site reads only
// published testimonials with name consent.

const testimonial = (
  key: string,
  details: {
    quote: string
    authorFullName: string
    displayName: string
    category: string
    eventDate: Date
    status: "submitted" | "approved" | "withheld"
    consentName: boolean
    sourceBooking: string
  },
) => ({
  _id: privateSeedId("testimonial", key),
  _type: "testimonial",
  quote: emphasisedQuote(details.quote),
  authorFullName: details.authorFullName,
  displayName: details.displayName,
  rating: 5,
  location: "Malta",
  category: details.category,
  eventDate: isoDate(details.eventDate),
  status: details.status,
  consentName: details.consentName,
  consentPhoto: false,
  consent: {
    _type: "consentRecord",
    given: true,
    givenAt: isoDateTime(today(), 19),
    wording:
      "Bacchus may publish my review on its website, with my name if I've ticked the box.",
    sourcePage: "/review",
  },
  sourceBooking: reference(details.sourceBooking),
})

const testimonials = [
  testimonial("dimech-zammit", {
    quote:
      "From the first tasting to the last dance, *every detail was looked after*. Our guests are still talking about the terrace at sunset.",
    authorFullName: "Rachel Dimech",
    displayName: "Rachel & Paul",
    category: "wedding",
    eventDate: saturdayInMonths(-2),
    status: "submitted",
    consentName: true,
    sourceBooking: COMPLETED_BOOKINGS.dimechZammit,
  }),
  testimonial("brown-taylor", {
    quote: "A small wedding that *felt like a private party in a palace*.",
    authorFullName: "Alice Brown",
    displayName: "A. B.",
    category: "wedding",
    eventDate: saturdayInMonths(-5),
    status: "submitted",
    consentName: false,
    sourceBooking: COMPLETED_BOOKINGS.brownTaylor,
  }),
  testimonial("galea", {
    quote: "Forty years married, and *the best night we've had in a long time*.",
    authorFullName: "Maria Galea",
    displayName: "Maria Galea",
    category: "celebration",
    eventDate: saturdayInMonths(-3),
    status: "approved",
    consentName: true,
    sourceBooking: COMPLETED_BOOKINGS.galea,
  }),
  testimonial("cassar", {
    quote: "Great food, but *the speeches overran because the sound wasn't ready*.",
    authorFullName: "Joseph Cassar",
    displayName: "Joseph Cassar",
    category: "corporate",
    eventDate: thursdayInMonths(-1),
    status: "withheld",
    consentName: true,
    sourceBooking: COMPLETED_BOOKINGS.cassar,
  }),
]

// --- The restaurant menu (parked) -------------------------------------------------
// From the draft /menu page (MenuCourseTabs.astro). No prices: none given.

const restaurantDish = (
  name: string,
  description: string,
  assetId: string,
  alt: string,
  diet: { vegetarian?: boolean } = {},
) => ({
  _type: "restaurantDish",
  name,
  description,
  isVegetarian: diet.vegetarian ?? false,
  isVegan: false,
  image: image(assetId, alt),
})

const restaurantMenu = [
  {
    _id: seedId("restaurant-canapes"),
    _type: "restaurantMenuSection",
    title: "Canapés & Reception",
    slug: { _type: "slug", current: "canapes-and-reception" },
    dishes: keyed([
      restaurantDish(
        "Canapés, passed",
        "Built for standing receptions and drinks.",
        ASSETS.canapesService,
        "Canapés being served to guests",
      ),
      restaurantDish(
        "The reception tray",
        "A mixed cold selection, served on arrival.",
        ASSETS.canapesTray,
        "A tray of canapés",
      ),
      restaurantDish(
        "Roulade canapés",
        "A hot savoury option from the corporate menu.",
        ASSETS.canapeRoulade,
        "Canapé roulades",
      ),
      restaurantDish(
        "Cocktail reception tray",
        "Bite-sized, built for a standing crowd.",
        ASSETS.cocktailTray,
        "A cocktail reception tray",
      ),
    ]),
    order: 1,
    isPublished: false,
  },
  {
    _id: seedId("restaurant-seated"),
    _type: "restaurantMenuSection",
    title: "Seated Menu",
    slug: { _type: "slug", current: "seated-menu" },
    dishes: keyed([
      restaurantDish(
        "Seared catch of the day",
        "Spring vegetables, light pea purée, salsa verde.",
        ASSETS.seabass,
        "Pan-seared fish with vegetables, plated",
      ),
      restaurantDish(
        "Slow-cooked lamb",
        "Pistachio crust, beetroot and orange.",
        ASSETS.lamb,
        "Slow-cooked lamb with beetroot and citrus",
      ),
      restaurantDish(
        "The seated banquet",
        "Set or bespoke, tasted with you in advance.",
        ASSETS.hallBanquet,
        "The banquet room set for a seated dinner",
      ),
    ]),
    order: 2,
    isPublished: false,
  },
  {
    _id: seedId("restaurant-wine-and-bar"),
    _type: "restaurantMenuSection",
    title: "Wine & Bar",
    slug: { _type: "slug", current: "wine-and-bar" },
    intro:
      "Our in-house wine list is sourced from Maltese producers, with a private bar available for weddings, corporate evenings and larger celebrations.",
    dishes: keyed([
      restaurantDish(
        "A glass on arrival",
        "Sparkling or Maltese white, poured at the door.",
        ASSETS.champagne,
        "A guest raising a glass of sparkling wine",
        { vegetarian: true },
      ),
    ]),
    order: 3,
    isPublished: false,
  },
]

export const editorialDocuments = [
  ...faqs,
  ...guides,
  ...suppliers,
  ...testimonials,
  ...restaurantMenu,
]
