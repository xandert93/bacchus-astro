// The shape of the wedding package content: Reception, Banquet and High Tea
// (three ranked tiers each, mutually exclusive meal formats) and Beverage
// (four categories, combined freely). One file per package beside this one.
//
// Content is from docs/bacchus-wedding-catalogue.pdf in the prototype, read
// from the RENDERED pages: a text extraction of that PDF silently drops
// accented characters and whole words. Spelling follows the house style
// described in the prototype's CLAUDE.md ("House style for catalogue copy").
//
// Shaped to move into Sanity in phase 3 (the drafted schemas live in the
// prototype's sanity/ folder); until then the pages import these directly.

export interface PackageMenuItem {
  name: string
  // Shows the (V) marker after the name.
  vegetarian?: boolean
}

// A wine listing: name, then grape and producer, then a tasting note.
export interface PackageWine {
  name: string
  meta: string
  note?: string
}

export interface PackageMenuGroup {
  title: string
  // An italic first line above the items ("Service of five craft cocktails").
  subhead?: string
  items: (PackageMenuItem | PackageWine)[]
}

export interface PackageDish {
  name: string
  // A real photograph, opened in the lightbox. src is a key from
  // src/lib/images.ts; category is the tile's tag and lightbox label.
  photo?: { src: string; alt: string }
  category?: string
  // No photograph yet: a black "photo to follow" tile showing these initials.
  initials?: string
}

export interface PackageTier {
  // Also the #hash that links straight to this tier.
  id: string
  name: string
  // The small label above the name on the tier card ("Reception").
  eyebrow: string
  // As displayed: "€53", "from €12", "On request".
  price: string
  priceUnit?: string
  description: string
  // A paragraph above the menu (Beverage's categories).
  intro?: string
  dishesLabel?: string
  dishes?: PackageDish[]
  groups: PackageMenuGroup[]
}

export const isWine = (item: PackageMenuItem | PackageWine): item is PackageWine =>
  "meta" in item
