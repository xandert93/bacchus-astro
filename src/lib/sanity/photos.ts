// How a photograph stored in Sanity is asked for, and turned into what
// <Photo src> takes (RemotePhoto, in src/lib/images.ts).
import type { RemotePhoto } from "@lib/images"

// Spliced into a query as `image{${PHOTO_FIELDS}}`. The URL is the untouched
// upload; Astro makes the sized AVIF and WebP copies from it.
export const PHOTO_FIELDS = `
  alt,
  isWebCopy,
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
`

export interface SanityPhoto {
  alt?: string
  isWebCopy?: boolean
  url?: string
  width?: number
  height?: number
}

// A photo field with nothing uploaded comes back without a URL, which is
// treated as no photo at all.
export const toRemotePhoto = (
  photo: SanityPhoto | null | undefined,
): RemotePhoto | null =>
  photo?.url && photo.width && photo.height
    ? {
        url: photo.url,
        width: photo.width,
        height: photo.height,
        isWebCopy: photo.isWebCopy ?? false,
      }
    : null
