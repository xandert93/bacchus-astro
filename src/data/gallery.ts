// The gallery page's filters: its own controls, so they stay in code. The
// photographs are in Sanity (src/lib/sanity/gallery.ts), and their category
// values match these ids, which the ?filter= links from each page's mini
// gallery also use.

export const GALLERY_FILTERS = [
  { id: "all", label: "All" },
  { id: "weddings", label: "Weddings" },
  { id: "corporate", label: "Corporate" },
  { id: "celebrations", label: "Celebrations" },
  { id: "venue", label: "Venue & Dining" },
] as const

export type GalleryCategory = Exclude<(typeof GALLERY_FILTERS)[number]["id"], "all">
