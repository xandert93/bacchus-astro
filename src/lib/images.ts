// Every photograph on the site, looked up by a short key that mirrors its
// folder under src/assets/images/ — "venue/ballroom-night",
// "food-and-drink/canapes-tray". Organised by SUBJECT (what the
// photo shows), not by which page uses it: most photos appear on several
// pages, and "hero" is a role a photo plays, not what it is.
//
// import.meta.glob is Vite's way of importing a whole folder at once. With
// eager: true each file arrives as image metadata (src, width, height,
// format), exactly as if it had been imported by hand — which is what
// astro:assets needs to resize it. An unknown key fails the BUILD, so a
// typo or a deleted photo can't ship as a broken image.
import type { ImageMetadata } from "astro"

const files = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/images/**/*.{jpg,png,webp}",
  { eager: true },
)

const byKey = new Map<string, ImageMetadata>()
for (const [path, mod] of Object.entries(files)) {
  const key = path.replace("../assets/images/", "").replace(/\.(jpg|png|webp)$/, "")
  byKey.set(key, mod.default)
}

export const image = (key: string): ImageMetadata => {
  const found = byKey.get(key)
  if (!found) throw new Error(`No image "${key}" in src/assets/images/`)
  return found
}

// Photos we only have as already-compressed web copies, with no untouched
// original to build from. They're served at their own size without being
// re-encoded (re-encoding a lossy file loses quality a second time), and
// only scaled-down variants are generated. This list is also the list of
// originals to request from Bacchus; delete an entry once its original is in.
// Photos stored in Sanity carry their own flag instead (RemotePhoto, below).
export const WEB_COPY_ONLY = new Set([
  "weddings/couple-outside-2",
  "weddings/oysters",
  "weddings/banquet",
  "weddings/high-tea",
  "corporate/champagne-service",
  "corporate/cocktail-tray",
  "corporate/canape-roulade",
  "celebrations/guest-laughing",
  "celebrations/tea-pour",
  "celebrations/canape-tray",
  "food-and-drink/canapes-service",
  "food-and-drink/lamb",
  "food-and-drink/seabass",
  "brand/bacchus-logo",
])

export const isWebCopyOnly = (key: string): boolean => WEB_COPY_ONLY.has(key)

// A photograph stored in Sanity rather than in src/assets/images/: the
// gallery, the signature dishes and the stations, which the client edits.
// It goes through the same pipeline as a local photo (Photo.astro), fetched
// from Sanity's CDN at build time; the width and height come from Sanity
// too, since Astro can't read them from a file it doesn't have yet.
export interface RemotePhoto {
  url: string
  width: number
  height: number
  // An already-compressed copy, served untouched (see WEB_COPY_ONLY above).
  isWebCopy: boolean
}

// What <Photo src> accepts: a key from this file, or a photo from Sanity.
export type PhotoSource = string | RemotePhoto
