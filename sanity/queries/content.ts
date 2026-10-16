/**
 * Content queries not yet used by the site.
 *
 * Written alongside the schema as a proof that it answers the pages the
 * prototype already has. Where a query encodes a rule rather than just
 * fetching fields, the rule is noted.
 *
 * Once the site reads a type, its query moves to the module that uses it, in
 * `src/lib/sanity/` (packages, stations, gallery and testimonials so far), so
 * each query has one copy, beside the code that depends on its shape.
 */

/** FAQs for a page. */
export const faqsForPageQuery = /* groq */ `
*[_type == "faq" && $page in showOnPages] | order(order asc){
  question,
  answer,
  topic
}
`

/**
 * FAQs the chat assistant may answer from.
 *
 * Only those explicitly released to the assistant. The instruction "never
 * invent pricing or availability" is not enforceable by prompt alone — if
 * the retrieval step hands the model an unsettled price, it will repeat it
 * confidently and sound right. This filter is the actual guardrail; the
 * prompt is the backup.
 *
 * Availability is deliberately NOT retrievable at all. It is derived, live,
 * and date-specific, and a model paraphrasing a calendar is a model telling
 * someone a date is free. Point the assistant at the calendar instead.
 */
export const assistantFaqsQuery = /* groq */ `
*[_type == "faq" && availableToAssistant == true]{
  question,
  answer,
  topic
}
`

/** Venue spaces for the proposed spaces page and the wizard's option cards. */
export const venueSpacesQuery = /* groq */ `
*[_type == "venueSpace"] | order(coalesce(order, 9999) asc){
  name,
  "slug": slug.current,
  aliases,
  shortDescription,
  description,
  setting,
  capacity,
  includedInStandardPackage,
  inclusionNote,
  curfewNote,
  "images": images[]->{image, "title": caption.title}
}
`
