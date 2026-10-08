// Structured data: facts about the venue and each page, written as JSON-LD
// (a script element of JSON in the head) in schema.org's vocabulary, which
// Google, Bing and AI search read to show a business panel, breadcrumbs and
// the like in their results. SiteHead renders the venue's on the homepage;
// PageHero renders each subpage's breadcrumbs.
//
// ONLY CONFIRMED FACTS GO HERE. A search engine repeats this as settled,
// with no oxblood note beside it. So: no capacity, no prices, no opening
// hours and no space names until Bacchus confirms them
// (docs/content/client-facts.md).
//
// Left out on purpose:
//   • Event: for public events with a date anyone can attend. Private
//     weddings aren't, and Google's guidelines rule it out for anything else.
//   • FAQPage: since 2023 Google only shows FAQ results for government and
//     health sites, so it would do nothing here.
import { CONTACT } from "@data/contact"

export type StructuredData = Record<string, unknown>

// The venue itself: a restaurant that is also an events venue. Rendered on
// the homepage, which is the page that represents the business.
export const venueStructuredData = (site: URL, imageUrl: string): StructuredData => ({
  "@context": "https://schema.org",
  "@type": ["Restaurant", "EventVenue"],
  "@id": new URL("/#venue", site).href,
  name: "Bacchus",
  url: site.href,
  image: imageUrl,
  telephone: CONTACT.phone.display,
  email: CONTACT.email.display,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address.street,
    addressLocality: CONTACT.address.locality,
    postalCode: CONTACT.address.postcode,
    addressCountry: CONTACT.address.countryCode,
  },
  sameAs: Object.values(CONTACT.social),
})

export interface BreadcrumbStep {
  name: string
  // Omitted for the last step, the page itself.
  path?: string
}

// The trail above a page ("Home › Weddings › Banquet Menus"), which search
// results show in place of the bare URL.
export const breadcrumbStructuredData = (
  site: URL,
  steps: BreadcrumbStep[],
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: steps.map((step, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: step.name,
    ...(step.path ? { item: new URL(step.path, site).href } : {}),
  })),
})
