// The published testimonials, from Sanity, in the shape Testimonials.astro
// and Testimonials.js render.
import { fetchContent } from "./client"

export interface Testimonial {
  // <em>…</em> marks the gold-emphasised phrase, which Testimonials.js turns
  // into a real <em> element.
  quote: string
  name: string
  category: string
  location: string
  date?: string
  rating: number
}

// Published AND name consent, on purpose, though validation already refuses
// to publish without it: an API write can skip validation, and this is a
// real person's name on a real website.
const TESTIMONIALS_QUERY = `
*[_type == "testimonial" && status == "published" && consentName == true]
  | order(coalesce(order, 9999) asc){
  quote,
  displayName,
  rating,
  location,
  category,
  eventDate
}
`

interface PortableTextBlock {
  children?: { text: string; marks?: string[] }[]
}

interface SanityTestimonial {
  quote: PortableTextBlock[]
  displayName: string
  rating: number
  location?: string
  category?: string
  eventDate?: string
}

// How each Studio category reads on the card. Every testimonial so far is a
// wedding; the others are ready for when that changes.
const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Wedding celebration",
  corporate: "Corporate event",
  celebration: "Private celebration",
  restaurant: "Dinner at Bacchus",
}

// The quote is rich text in Sanity so the emphasis is attached to exactly the
// words it covers. The page takes a string with <em> markers.
const toQuoteString = (blocks: PortableTextBlock[]): string =>
  blocks
    .map((block) =>
      (block.children ?? [])
        .map((span) =>
          span.marks?.includes("emphasis") ? `<em>${span.text}</em>` : span.text,
        )
        .join(""),
    )
    .join(" ")

// "2014-04-26" -> "26 April 2014".
const formatEventDate = (isoDate: string): string =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const testimonials = await fetchContent<SanityTestimonial[]>(
    "published testimonials",
    TESTIMONIALS_QUERY,
  )

  return testimonials.map((testimonial) => ({
    quote: toQuoteString(testimonial.quote),
    name: testimonial.displayName,
    category: CATEGORY_LABELS[testimonial.category ?? ""] ?? "",
    location: testimonial.location ?? "",
    date: testimonial.eventDate ? formatEventDate(testimonial.eventDate) : undefined,
    rating: testimonial.rating,
  }))
}
