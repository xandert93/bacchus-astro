// Reception's sixteen stations and the six categories they're grouped into,
// from Sanity, in the shape the station components render.
//
// Two things here are OURS, not the catalogue's, and the page says so in
// its own notes: the categories (the catalogue lists the stations flat) and
// every vegetarian mark (the catalogue marks none on the stations). The
// photographs are AI-generated stand-ins, flagged as placeholders in Sanity.
import type { PhotoSource } from "@lib/images"
import { fetchContent } from "./client"
import { PHOTO_FIELDS, toRemotePhoto, type SanityPhoto } from "./photos"
import { PRICE_FIELDS, formatPrice, formatPriceUnit, type SanityPrice } from "./prices"
import type { PackageMenuItem } from "./packages"

export interface StationCategory {
  id: string
  // Full name, on the card eyebrow and as the tab's accessible label.
  label: string
  // The one word that fits on a tab.
  shortLabel: string
}

export interface Station {
  // The catalogue's numbering; the "add to selection" state keys off it.
  number: number
  // A StationCategory id.
  category: string
  name: string
  price: string
  priceUnit: string
  photo: { src: PhotoSource; alt: string }
  items: PackageMenuItem[]
  servingNote: string
}

export interface StationsContent {
  categories: StationCategory[]
  // In display order: grouped by category, not by number.
  stations: Station[]
}

// Categories in order, each with its own stations in order, so flattening
// the result gives the display order without sorting by a field behind a
// reference (which a GROQ order() can't do).
const STATIONS_QUERY = `
*[_type == "stationCategory"] | order(order asc){
  "id": slug.current,
  label,
  shortLabel,
  "stations": *[_type == "station" && category._ref == ^._id] | order(order asc){
    "number": catalogueNumber,
    name,
    price{${PRICE_FIELDS}},
    "photo": image{${PHOTO_FIELDS}},
    items[]{name, isVegetarian},
    servingNote
  }
}
`

interface SanityStation {
  number: number
  name: string
  price: SanityPrice
  photo: SanityPhoto
  items: { name: string; isVegetarian?: boolean }[]
  servingNote: string
}

interface SanityStationCategory extends StationCategory {
  stations: SanityStation[]
}

const toStation = (station: SanityStation, categoryId: string): Station => {
  const photo = toRemotePhoto(station.photo)

  // Every card is a photo card; a station without one is a content error
  // worth failing the build over, not a card to render broken.
  if (!photo) {
    throw new Error(`The station "${station.name}" has no photograph in Sanity.`)
  }

  return {
    number: station.number,
    category: categoryId,
    name: station.name,
    price: formatPrice(station.price, { alwaysShowCents: true }) ?? "On request",
    priceUnit: formatPriceUnit(station.price) ?? "",
    photo: { src: photo, alt: station.photo.alt ?? "" },
    items: station.items.map((item) =>
      item.isVegetarian ? { name: item.name, vegetarian: true } : { name: item.name },
    ),
    servingNote: station.servingNote,
  }
}

export const getStations = async (): Promise<StationsContent> => {
  const categories = await fetchContent<SanityStationCategory[]>(
    "station categories",
    STATIONS_QUERY,
  )

  return {
    categories: categories.map(({ id, label, shortLabel }) => ({
      id,
      label,
      shortLabel,
    })),
    stations: categories.flatMap((category) =>
      category.stations.map((station) => toStation(station, category.id)),
    ),
  }
}
