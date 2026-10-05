// The full gallery's photographs and filters. Hardcoded until Sanity, where
// this becomes a "galleryImage" document type with category as a reference.

export const GALLERY_FILTERS = [
  { id: "all", label: "All" },
  { id: "weddings", label: "Weddings" },
  { id: "corporate", label: "Corporate" },
  { id: "celebrations", label: "Celebrations" },
  { id: "venue", label: "Venue & Dining" },
] as const

export type GalleryCategory = Exclude<(typeof GALLERY_FILTERS)[number]["id"], "all">

export interface GalleryPhoto {
  src: string
  alt: string
  // Lightbox caption title.
  title: string
  category: GalleryCategory
  // Lightbox caption tag (data-tag).
  tag: string
  // Hover badge text, when it differs from the tag ("Kitchen" vs "From the
  // kitchen", which is too long for the badge).
  badge?: string
  // Takes two grid columns on wide screens.
  wide?: boolean
  // Reveal stagger, in ms. Carried over exactly from the prototype, where
  // it restarts at each category run rather than following one formula.
  revealDelay: number
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: "venue/ballroom-night",
    alt: "The function room lit for an evening reception",
    title: "Reception, After Dark",
    category: "venue",
    tag: "Venue",
    wide: true,
    revealDelay: 0,
  },
  {
    src: "weddings/toast",
    alt: "A bride and groom clinking champagne glasses",
    title: "The First Toast",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 60,
  },
  {
    src: "weddings/cake-chandelier",
    alt: "A tiered wedding cake beneath a crystal chandelier",
    title: "The Cake, Under Crystal",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 120,
  },
  {
    src: "weddings/cake-detail",
    alt: "A wedding cake with gold leaf detailing and a whimsical bride-and-groom topper",
    title: "Cake Detail",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 180,
  },
  {
    src: "weddings/oysters",
    alt: "A tray of oysters served to guests at a wedding",
    title: "Oysters, On Ice",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 240,
  },
  {
    src: "weddings/guest-portrait",
    alt: "A guest portrait at a wedding",
    title: "A Guest, In the Garden",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 300,
  },
  {
    src: "weddings/couple-outside-2",
    alt: "The bride and groom walking hand in hand through Mdina's streets past the Bacchus sign",
    title: "Through the Old City",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 360,
  },
  {
    src: "venue/terrace-seated",
    alt: "The Terrace set for an evening wedding reception beneath string lights and a crescent moon",
    title: "The Terrace, Dressed for Evening",
    category: "weddings",
    tag: "Weddings",
    wide: true,
    revealDelay: 420,
  },
  {
    src: "venue/hall-chandeliers-banquet",
    alt: "The banquet room dressed with chair sashes and long tables",
    title: "The Banquet Room",
    category: "venue",
    tag: "Venue",
    wide: true,
    revealDelay: 0,
  },
  {
    src: "corporate/champagne-service",
    alt: "A waiter serving champagne to a guest in business attire",
    title: "Champagne on Arrival",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 60,
  },
  {
    src: "corporate/guests-chatting",
    alt: "Colleagues chatting at a corporate event",
    title: "Business, Unhurried",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 120,
  },
  {
    src: "corporate/cocktail-tray",
    alt: "A cocktail tray at a corporate reception",
    title: "The Cocktail Tray",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 180,
  },
  {
    src: "corporate/canape-roulade",
    alt: "Canapé roulades served at a corporate event",
    title: "Canapé Roulades",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 240,
  },
  {
    src: "celebrations/friends",
    alt: "Friends embracing at a long outdoor table",
    title: "Old Friends, Long Table",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 0,
  },
  {
    src: "celebrations/tea-pour",
    alt: "A guest pouring tea at an outdoor garden celebration",
    title: "An Afternoon in the Garden",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 60,
  },
  {
    src: "celebrations/guest-laughing",
    alt: "A guest laughing at a celebration",
    title: "Shared Laughter",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 120,
  },
  {
    src: "celebrations/canape-tray",
    alt: "A canapé tray at a garden celebration",
    title: "The Canapé Tray",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 180,
  },
  {
    src: "venue/terrace-celebration-reception",
    alt: "Guests gathered on the Terrace for an evening reception at dusk",
    title: "An Evening Reception",
    category: "venue",
    tag: "Venue",
    revealDelay: 0,
  },
  {
    src: "food-and-drink/champagne",
    alt: "A guest raising a glass of sparkling wine at a dressed table",
    title: "A Glass, Raised",
    category: "venue",
    tag: "Venue",
    revealDelay: 60,
  },
  {
    src: "food-and-drink/canapes-tray",
    alt: "A tray of canapés",
    title: "The Reception Tray",
    category: "venue",
    tag: "Venue",
    revealDelay: 60,
  },
  {
    src: "food-and-drink/canapes-service",
    alt: "Canapés being served to guests",
    title: "Canapés, Passed",
    category: "venue",
    tag: "Venue",
    revealDelay: 120,
  },
  {
    src: "food-and-drink/lamb",
    alt: "Slow-cooked lamb with beetroot and citrus",
    title: "Slow-Cooked Lamb",
    category: "venue",
    tag: "From the kitchen",
    badge: "Kitchen",
    revealDelay: 180,
  },
  {
    src: "food-and-drink/seabass",
    alt: "Pan-seared fish with vegetables, plated",
    title: "Seared Catch of the Day",
    category: "venue",
    tag: "From the kitchen",
    badge: "Kitchen",
    revealDelay: 240,
  },
]
