// The wedding packages' tiers, from Sanity: Reception, Banquet and High Tea
// (three ranked tiers each, mutually exclusive meal formats) and Beverage
// (four categories, combined freely).
//
// Sanity stores the content in the shape an editor works with: dishes as
// shared documents, wines split into grapes and producer, prices as
// numbers. This file turns it into the shape the package components render,
// so the components never see Sanity's.
import type { PhotoSource } from "@lib/images"
import { fetchContent } from "./client"
import { PHOTO_FIELDS, toRemotePhoto, type SanityPhoto } from "./photos"
import { PRICE_FIELDS, formatPrice, formatPriceUnit, type SanityPrice } from "./prices"

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
  // A real photograph, opened in the lightbox. category is the tile's tag
  // and lightbox label.
  photo?: { src: PhotoSource; alt: string }
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
  dishes?: PackageDish[]
  groups: PackageMenuGroup[]
}

export const isWine = (item: PackageMenuItem | PackageWine): item is PackageWine =>
  "meta" in item

// The package slugs, as in /weddings/packages/<slug>.
export type PackageSlug = "reception" | "banquet" | "high-tea" | "beverage"

// A dish is a reference to a shared menuDish document, so a spelling fix
// lands on every tier at once; a wine is stored inline, since none recurs.
const TIERS_QUERY = `
*[_type == "packageTier" && package->slug.current == $packageSlug] | order(order asc){
  "id": slug.current,
  name,
  "packageName": package->name,
  summary,
  intro,
  price{${PRICE_FIELDS}},
  menuGroups[]{
    title,
    note,
    items[]{
      _type == "reference" => @->{"kind": "dish", name, isVegetarian},
      _type == "wineEntry" => {"kind": "wine", name, grapes, producer, tastingNote}
    }
  },
  signatureDishes[]{
    name,
    course,
    placeholderInitials,
    "photo": image{${PHOTO_FIELDS}}
  }
}
`

type SanityMenuItem =
  | { kind: "dish"; name: string; isVegetarian?: boolean }
  | {
      kind: "wine"
      name: string
      grapes?: string
      producer?: string
      tastingNote?: string
    }

interface SanityTier {
  id: string
  name: string
  packageName: string
  summary: string
  intro?: string
  price?: SanityPrice
  menuGroups: { title: string; note?: string; items: SanityMenuItem[] }[]
  signatureDishes?: {
    name: string
    course?: string
    placeholderInitials?: string
    photo?: SanityPhoto
  }[]
}

const toMenuItem = (item: SanityMenuItem): PackageMenuItem | PackageWine => {
  if (item.kind === "dish") {
    return item.isVegetarian ? { name: item.name, vegetarian: true } : { name: item.name }
  }

  return {
    name: item.name,
    // The middle dot is how the page shows the two parts; Sanity stores them
    // apart so a producer can be grouped or filtered by later.
    meta: [item.grapes, item.producer].filter(Boolean).join(" · "),
    note: item.tastingNote,
  }
}

const toDish = (
  dish: NonNullable<SanityTier["signatureDishes"]>[number],
): PackageDish => {
  const photo = toRemotePhoto(dish.photo)

  return {
    name: dish.name,
    category: dish.course,
    photo: photo ? { src: photo, alt: dish.photo?.alt ?? "" } : undefined,
    initials: photo ? undefined : dish.placeholderInitials,
  }
}

const toTier = (tier: SanityTier): PackageTier => ({
  id: tier.id,
  name: tier.name,
  eyebrow: tier.packageName,
  price: formatPrice(tier.price) ?? "On request",
  priceUnit: formatPriceUnit(tier.price),
  description: tier.summary,
  intro: tier.intro,
  dishes: tier.signatureDishes?.length ? tier.signatureDishes.map(toDish) : undefined,
  groups: tier.menuGroups.map((group) => ({
    title: group.title,
    subhead: group.note,
    items: group.items.map(toMenuItem),
  })),
})

export const getPackageTiers = async (
  packageSlug: PackageSlug,
): Promise<PackageTier[]> => {
  const tiers = await fetchContent<SanityTier[]>(`${packageSlug} tiers`, TIERS_QUERY, {
    packageSlug,
  })

  return tiers.map(toTier)
}
