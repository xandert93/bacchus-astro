// The full gallery's photographs and filters. Hardcoded until Sanity, where
// this becomes a "galleryImage" document type with category as a reference.

export const GALLERY_FILTERS = [
  { id: "all", label: "All" },
  { id: "weddings", label: "Weddings" },
  { id: "corporate", label: "Corporate" },
  { id: "celebrations", label: "Celebrations" },
  { id: "venue", label: "Venue & Dining" },
] as const;

export type GalleryCategory = Exclude<(typeof GALLERY_FILTERS)[number]["id"], "all">;

export interface GalleryPhoto {
  src: string;
  alt: string;
  // Lightbox caption title.
  title: string;
  category: GalleryCategory;
  // Lightbox caption tag (data-tag).
  tag: string;
  // Hover badge text, when it differs from the tag ("Kitchen" vs "From the
  // kitchen", which is too long for the badge).
  badge?: string;
  // Takes two grid columns on wide screens.
  wide?: boolean;
  // Reveal stagger, in ms. Carried over exactly from the prototype, where
  // it restarts at each category run rather than following one formula.
  revealDelay: number;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: "/images/shared/ballroom-night.webp",
    alt: "The function room lit for an evening reception",
    title: "Reception, After Dark",
    category: "venue",
    tag: "Venue",
    wide: true,
    revealDelay: 0,
  },
  {
    src: "/images/weddings/toast.webp",
    alt: "A bride and groom clinking champagne glasses",
    title: "The First Toast",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 60,
  },
  {
    src: "/images/weddings/cake-chandelier.webp",
    alt: "A tiered wedding cake beneath a crystal chandelier",
    title: "The Cake, Under Crystal",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 120,
  },
  {
    src: "/images/weddings/cake-detail.webp",
    alt: "A wedding cake with gold leaf detailing and a whimsical bride-and-groom topper",
    title: "Cake Detail",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 180,
  },
  {
    src: "/images/weddings/oysters.webp",
    alt: "A tray of oysters served to guests at a wedding",
    title: "Oysters, On Ice",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 240,
  },
  {
    src: "/images/weddings/guest-portrait.webp",
    alt: "A guest portrait at a wedding",
    title: "A Guest, In the Garden",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 300,
  },
  {
    src: "/images/weddings/couple-outside-2.webp",
    alt: "The bride and groom walking hand in hand through Mdina's streets past the Bacchus sign",
    title: "Through the Old City",
    category: "weddings",
    tag: "Weddings",
    revealDelay: 360,
  },
  {
    src: "/images/weddings/terrace-seated.webp",
    alt: "The Terrace set for an evening wedding reception beneath string lights and a crescent moon",
    title: "The Terrace, Dressed for Evening",
    category: "weddings",
    tag: "Weddings",
    wide: true,
    revealDelay: 420,
  },
  {
    src: "/images/shared/hall-chandeliers-banquet.webp",
    alt: "The banquet room dressed with chair sashes and long tables",
    title: "The Banquet Room",
    category: "venue",
    tag: "Venue",
    wide: true,
    revealDelay: 0,
  },
  {
    src: "/images/corporate/champagne-service.webp",
    alt: "A waiter serving champagne to a guest in business attire",
    title: "Champagne on Arrival",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 60,
  },
  {
    src: "/images/corporate/guests-chatting.webp",
    alt: "Colleagues chatting at a corporate event",
    title: "Business, Unhurried",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 120,
  },
  {
    src: "/images/corporate/cocktail-tray.webp",
    alt: "A cocktail tray at a corporate reception",
    title: "The Cocktail Tray",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 180,
  },
  {
    src: "/images/corporate/canape-roulade.webp",
    alt: "Canapé roulades served at a corporate event",
    title: "Canapé Roulades",
    category: "corporate",
    tag: "Corporate",
    revealDelay: 240,
  },
  {
    src: "/images/celebrations/friends.webp",
    alt: "Friends embracing at a long outdoor table",
    title: "Old Friends, Long Table",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 0,
  },
  {
    src: "/images/celebrations/tea-pour.webp",
    alt: "A guest pouring tea at an outdoor garden celebration",
    title: "An Afternoon in the Garden",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 60,
  },
  {
    src: "/images/celebrations/guest-laughing.webp",
    alt: "A guest laughing at a celebration",
    title: "Shared Laughter",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 120,
  },
  {
    src: "/images/celebrations/canape-tray.webp",
    alt: "A canapé tray at a garden celebration",
    title: "The Canapé Tray",
    category: "celebrations",
    tag: "Celebrations",
    revealDelay: 180,
  },
  {
    src: "/images/shared/terrace-celebration-reception.webp",
    alt: "Guests gathered on the Terrace for an evening reception at dusk",
    title: "An Evening Reception",
    category: "venue",
    tag: "Venue",
    revealDelay: 0,
  },
  {
    src: "/images/shared/champagne.webp",
    alt: "A guest raising a glass of sparkling wine at a dressed table",
    title: "A Glass, Raised",
    category: "venue",
    tag: "Venue",
    revealDelay: 60,
  },
  {
    src: "/images/shared/canapes-tray.webp",
    alt: "A tray of canapés",
    title: "The Reception Tray",
    category: "venue",
    tag: "Venue",
    revealDelay: 60,
  },
  {
    src: "/images/shared/canapes-service.jpg",
    alt: "Canapés being served to guests",
    title: "Canapés, Passed",
    category: "venue",
    tag: "Venue",
    revealDelay: 120,
  },
  {
    src: "/images/shared/lamb.jpg",
    alt: "Slow-cooked lamb with beetroot and citrus",
    title: "Slow-Cooked Lamb",
    category: "venue",
    tag: "From the kitchen",
    badge: "Kitchen",
    revealDelay: 180,
  },
  {
    src: "/images/shared/seabass.jpg",
    alt: "Pan-seared fish with vegetables, plated",
    title: "Seared Catch of the Day",
    category: "venue",
    tag: "From the kitchen",
    badge: "Kitchen",
    revealDelay: 240,
  },
];
