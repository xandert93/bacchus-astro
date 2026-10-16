// The full gallery's photographs, from Sanity, in the shape gallery.astro
// renders. The filters stay in src/data/gallery.ts: they're the page's own
// controls, not content.
import type { GalleryCategory } from "@data/gallery"
import type { RemotePhoto } from "@lib/images"
import { GALLERY_CATEGORIES } from "@studio/lib/constants"
import { fetchContent } from "./client"
import { PHOTO_FIELDS, toRemotePhoto, type SanityPhoto } from "./photos"

export interface GalleryPhoto {
  src: RemotePhoto
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
}

// Stand-ins are left out. The caption fields are flattened here so the
// components keep their own simpler shape.
const GALLERY_QUERY = `
*[_type == "galleryImage" && image.isPlaceholder != true] | order(coalesce(order, 9999) asc, _createdAt desc){
  "photo": image{${PHOTO_FIELDS}},
  "title": caption.title,
  category,
  "label": caption.label,
  "shortLabel": caption.shortLabel,
  isFeatured
}
`

interface SanityGalleryImage {
  photo: SanityPhoto
  title?: string
  category: GalleryCategory
  label?: string
  shortLabel?: string
  isFeatured?: boolean
}

const categoryTitle = (category: GalleryCategory): string =>
  GALLERY_CATEGORIES.find((option) => option.value === category)?.title ?? category

export const getGalleryPhotos = async (): Promise<GalleryPhoto[]> => {
  const images = await fetchContent<SanityGalleryImage[]>("gallery images", GALLERY_QUERY)

  const photos = images.flatMap((image) => {
    const photo = toRemotePhoto(image.photo)

    // A gallery image saved before its upload finished has nothing to show.
    if (!photo) return []

    return {
      src: photo,
      alt: image.photo.alt ?? "",
      title: image.title ?? "",
      category: image.category,
      tag: image.label ?? categoryTitle(image.category),
      badge: image.label ? image.shortLabel : undefined,
      wide: image.isFeatured,
    }
  })

  if (photos.length === 0) throw new Error("No gallery image in Sanity has a photo.")

  return photos
}
