import type { SchemaTypeDefinition } from "sanity"

// Shared — used across more than one feature.
import provenance from "./shared/provenance.object"
import price from "./shared/price.object"
import seo from "./shared/seo.object"
import catalogueVariance from "./shared/catalogueVariance.object"

// Bookings and the waitlist.
import booking from "./bookings/booking.document"
import waitlistEntry from "./bookings/waitlistEntry.document"
import consentRecord from "./bookings/consentRecord.object"
import statusEvent from "./bookings/statusEvent.object"

// Quotes and payment.
import quote from "./quotes/quote.document"
import quoteLineItem from "./quotes/quoteLineItem.object"
import paymentRecord from "./quotes/paymentRecord.object"

// Wedding packages, their menus and the reception stations.
import weddingPackage from "./packages/weddingPackage.document"
import packageTier from "./packages/packageTier.document"
import station from "./packages/station.document"
import stationCategory from "./packages/stationCategory.document"
import menuGroup from "./packages/menuGroup.object"
import menuItem from "./packages/menuItem.object"
import wineEntry from "./packages/wineEntry.object"
import packageNote from "./packages/packageNote.object"
import signatureDish from "./packages/signatureDish.object"

// The venue itself.
import venueSpace from "./venue/venueSpace.document"
import venueClosure from "./venue/venueClosure.document"
import addOn from "./venue/addOn.document"
import capacity from "./venue/capacity.object"

// Editorial content.
import galleryImage from "./editorial/galleryImage.document"
import testimonial from "./editorial/testimonial.document"
import guideArticle from "./editorial/guideArticle.document"
import faq from "./editorial/faq.document"
import supplier from "./editorial/supplier.document"
import emphasisedQuote from "./editorial/emphasisedQuote.object"

// Restaurant side, parked until the events side is finished.
import restaurantMenuSection from "./restaurant/restaurantMenuSection.document"
import restaurantDish from "./restaurant/restaurantDish.object"

// Edited in place, one document each.
import siteSettings from "./settings/siteSettings.document"
import weddingPolicy from "./settings/weddingPolicy.document"

/**
 * Schema registry.
 *
 * Files are grouped by feature rather than by kind, because that is the axis
 * anyone maintaining this navigates by: a change to how bookings work touches
 * the booking document, its consent record and its status history, and those
 * now sit together. The `.document.ts` and `.object.ts` suffixes keep the
 * distinction that grouping would otherwise hide, and it is a load-bearing
 * one — a document is a top-level thing staff create and edit in the sidebar,
 * an object only ever exists nested inside something else and never appears
 * on its own.
 *
 * There is deliberately NO `availability` type, and that is the single most
 * important thing to know about this schema. The public calendar's three
 * states — Available / Enquiries received / Booked — are derived at query
 * time from booking records, never stored. A calendar held as its own
 * documents is one a human has to keep in sync by hand, and it will be wrong.
 * See `queries/availability.ts` for the derivation.
 *
 * Also deliberately absent, each for its own reason:
 *
 *   navigation      Item counts are load-bearing in the three-column panels
 *                   (three Restaurant rows, six Events rows), so an editable
 *                   list is an editable way to break the layout. Stays in
 *                   code.
 *   gift vouchers,  Restaurant-side commerce is parked, and the
 *   products        Stripe-versus-Shopify question is genuinely open.
 *   page layout     Column counts, sticky switchers, the arch shape, reveal
 *                   timings. All consequences of the content or of measured
 *                   breakpoints. A CMS toggle for any of them invites someone
 *                   to re-enable a layout that was removed for a measured
 *                   reason.
 *   image variants  `astro:assets` generates resized files and `srcset` from
 *                   the original at build time.
 *   lightbox detail Composed at render time from a station's serving note and
 *                   its items. Storing it would recreate the duplication that
 *                   made a wording fix silently miss half its occurrences.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  provenance,
  price,
  seo,
  catalogueVariance,

  booking,
  waitlistEntry,
  consentRecord,
  statusEvent,

  quote,
  quoteLineItem,
  paymentRecord,

  weddingPackage,
  packageTier,
  station,
  stationCategory,
  menuGroup,
  menuItem,
  wineEntry,
  packageNote,
  signatureDish,

  venueSpace,
  venueClosure,
  addOn,
  capacity,

  galleryImage,
  testimonial,
  guideArticle,
  faq,
  supplier,
  emphasisedQuote,

  restaurantMenuSection,
  restaurantDish,

  siteSettings,
  weddingPolicy,
]

/** Types that must exist exactly once. Enforced in `structure.ts`. */
export const singletonTypes = new Set(["siteSettings", "weddingPolicy"])
