import type { SchemaTypeDefinition } from "sanity"

// --- Reusable objects -------------------------------------------------------
import provenance from "./objects/provenance"
import price from "./objects/price"
import seo from "./objects/seo"
import capacity from "./objects/capacity"
import catalogueVariance from "./objects/catalogueVariance"
import consentRecord from "./objects/consentRecord"
import statusEvent from "./objects/statusEvent"
import menuItem from "./objects/menuItem"
import wineEntry from "./objects/wineEntry"
import menuGroup from "./objects/menuGroup"
import packageNote from "./objects/packageNote"
import signatureDish from "./objects/signatureDish"
import emphasisedQuote from "./objects/emphasisedQuote"
import quoteLineItem from "./objects/quoteLineItem"
import paymentRecord from "./objects/paymentRecord"
import restaurantDish from "./objects/restaurantDish"

// --- Documents --------------------------------------------------------------
import booking from "./documents/booking"
import waitlistEntry from "./documents/waitlistEntry"
import venueClosure from "./documents/venueClosure"
import quote from "./documents/quote"
import weddingPackage from "./documents/weddingPackage"
import packageTier from "./documents/packageTier"
import stationCategory from "./documents/stationCategory"
import station from "./documents/station"
import venueSpace from "./documents/venueSpace"
import addOn from "./documents/addOn"
import galleryImage from "./documents/galleryImage"
import testimonial from "./documents/testimonial"
import supplier from "./documents/supplier"
import guideArticle from "./documents/guideArticle"
import faq from "./documents/faq"
import restaurantMenuSection from "./documents/restaurantMenuSection"

// --- Singletons -------------------------------------------------------------
import siteSettings from "./singletons/siteSettings"
import weddingPolicy from "./singletons/weddingPolicy"

/**
 * Schema registry.
 *
 * There is deliberately NO `availability` type, and that is the single most
 * important thing to know about this schema. The public calendar's three
 * states — Available / Enquiries received / Booked — are derived at query time
 * from booking records, never stored. A calendar held as its own documents is
 * one a human has to keep in sync by hand, and it will be wrong. See
 * `queries/availability.ts` for the derivation.
 *
 * Also deliberately absent, each for its own reason:
 *
 *   navigation      Item counts are load-bearing in the proposed three-column
 *                   panels (three Restaurant rows, six Events rows), so an
 *                   editable list is an editable way to break the layout. The
 *                   structure is also not signed off. Stays in code.
 *   gift vouchers,  Restaurant-side commerce is parked, and the
 *   products        Stripe-versus-Shopify question is genuinely open. Modelling
 *                   a catalogue now would be designing for a decision nobody
 *                   has made.
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
  // Objects
  provenance,
  price,
  seo,
  capacity,
  catalogueVariance,
  consentRecord,
  statusEvent,
  menuItem,
  wineEntry,
  menuGroup,
  packageNote,
  signatureDish,
  emphasisedQuote,
  quoteLineItem,
  paymentRecord,
  restaurantDish,

  // Documents
  booking,
  waitlistEntry,
  venueClosure,
  quote,
  weddingPackage,
  packageTier,
  stationCategory,
  station,
  venueSpace,
  addOn,
  galleryImage,
  testimonial,
  supplier,
  guideArticle,
  faq,
  restaurantMenuSection,

  // Singletons
  siteSettings,
  weddingPolicy,
]

/** Types that must exist exactly once. Enforced in `structure.ts`. */
export const singletonTypes = new Set(["siteSettings", "weddingPolicy"])
