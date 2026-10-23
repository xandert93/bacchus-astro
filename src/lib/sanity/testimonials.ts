// The published testimonials, from Sanity, in the shape Testimonials.astro
// and Testimonials.js render.
import { dayMonthYear } from "@lib/dates"
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
// real person's name on a real website. $category narrows it to one kind of
// event, or is null for all of them.
const TESTIMONIALS_QUERY = `
*[_type == "testimonial" && status == "published" && permissions.useName == true
  && ($category == null || category == $category)]
  | order(coalesce(order, 9999) asc){
  quote,
  "displayName": author.displayName,
  rating,
  "location": author.location,
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

/** Every published testimonial, or only those for one kind of event. */
export const getTestimonials = async (category?: string): Promise<Testimonial[]> => {
  const testimonials = await fetchContent<SanityTestimonial[]>(
    category ? `published ${category} testimonials` : "published testimonials",
    TESTIMONIALS_QUERY,
    { category: category ?? null },
  )

  return testimonials.map((testimonial) => ({
    quote: toQuoteString(testimonial.quote),
    name: testimonial.displayName,
    category: CATEGORY_LABELS[testimonial.category ?? ""] ?? "",
    location: testimonial.location ?? "",
    date: testimonial.eventDate ? dayMonthYear(testimonial.eventDate) : undefined,
    rating: testimonial.rating,
  }))
}
