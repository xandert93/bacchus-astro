/**
 * Shared option lists.
 *
 * Every list here is mirrored by something that already exists in the
 * prototype — the enquiry wizard's chips, the gallery's filter radios, the
 * stations tab bar. Where a value is already written into the HTML or into
 * `main.js`, the value below matches it character for character, so the
 * migration is a lift rather than a re-keying. The comment on each list says
 * where its counterpart lives.
 */

/** Wizard step 1 chips — `data-v` on `.chip` in every enquiry form.
 */
export const EVENT_TYPES = [
  { title: "Wedding", value: "wedding" },
  { title: "Corporate", value: "corporate" },
  { title: "Celebration", value: "celebration" },
  { title: "Other", value: "other" },
] as const

/**
 * Booking lifecycle, in the order an enquiry moves through it.
 *
 * One document from first enquiry to the event: there is no separate enquiry
 * type, so nothing is copied from one to the other. The first three statuses
 * are an open enquiry, and the Studio lists them as Enquiries; the rest are
 * a booking or the end of one.
 *
 *   new               arrived, nobody has replied yet
 *   in-discussion     replied to: questions, viewings, tastings, a quote
 *   awaiting-deposit  quote accepted, deposit link sent, date held
 *   confirmed         deposit received
 *   completed         the event has happened (set by a scheduled job)
 *   declined          Bacchus said no
 *   withdrawn         the client didn't go ahead, before paying anything
 *   cancelled         was confirmed, then fell through
 *
 * Several open enquiries may share one date; at most one `confirmed` may
 * (see `queries/availability.ts` and the note on `booking.status`). Only
 * `cancelled` releases a date that was publicly shown as Booked, which is
 * the transition the waitlist webhook watches.
 *
 * What each status means for staff belongs in the staff guide written at
 * handover, not in the Studio, so the titles stay short.
 */
export const BOOKING_STATUSES = [
  { title: "New Enquiry", value: "new" },
  { title: "In Discussion", value: "in-discussion" },
  { title: "Awaiting Deposit", value: "awaiting-deposit" },
  { title: "Confirmed", value: "confirmed" },
  { title: "Completed", value: "completed" },
  { title: "Declined by Bacchus", value: "declined" },
  { title: "Withdrawn by Client", value: "withdrawn" },
  { title: "Cancelled", value: "cancelled" },
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]["value"]

/** Open enquiries: a date with one reads as "Enquiries received". */
export const OPEN_ENQUIRY_STATUSES = [
  "new",
  "in-discussion",
  "awaiting-deposit",
] as const satisfies readonly BookingStatus[]

/**
 * How an enquirer asked to be contacted: the chips on the form's details
 * step (`CONTACT_METHODS` in src/data/enquiry.ts, which adds their icons).
 */
export const CONTACT_PREFERENCES = [
  { title: "Email", value: "Email" },
  { title: "Phone", value: "Phone" },
  { title: "WhatsApp", value: "WhatsApp" },
] as const

/** Statuses that make a date read as Booked on the public calendar. */
export const DATE_BLOCKING_STATUSES = [
  "confirmed",
  "completed",
] as const satisfies readonly BookingStatus[]

/**
 * Wizard step 2, `#eventStyle` option cards — `data-v` values verbatim.
 * Intake colour for the events team, not a package selection; the field note
 * on the form says as much ("a starting point, not a package").
 */
export const EVENT_STYLES = [
  { title: "Candlelit & Ceremonial", value: "candlelit-ceremonial" },
  { title: "Garden & Golden Hour", value: "garden-golden-hour" },
  { title: "Formal & Refined", value: "formal-refined" },
  { title: "Still Exploring", value: "still-exploring" },
] as const

/**
 * `data-cat` on `.gallery-item`, and the `#gf-*` filter radios.
 *
 * "venue" rather than "spaces" because that is what the markup and the
 * `?filter=` deep links already use — renaming it would break the inbound
 * links from each page's mini-gallery ("View the full gallery").
 */
export const GALLERY_CATEGORIES = [
  { title: "Weddings", value: "weddings" },
  { title: "Corporate", value: "corporate" },
  { title: "Celebrations", value: "celebrations" },
  { title: "Venue", value: "venue" },
] as const

/**
 * Price units.
 *
 * `unit` is required on every price in this schema, and the reason is a real
 * omission: the catalogue's corkage figure (€6.50) could not be published
 * because the source never said whether it was per bottle or per person, and
 * guessing a unit on a chargeable fee is worse than omitting the fee. A price
 * that cannot state its unit cannot be entered here.
 */
export const PRICE_UNITS = [
  { title: "per person", value: "per-person" },
  { title: "per bottle", value: "per-bottle" },
  { title: "each", value: "each" },
  { title: "per hour", value: "per-hour" },
  { title: "flat fee", value: "flat" },
] as const

/** Quote line-item groupings — the labels used in `secure-booking.html`. */
export const QUOTE_LINE_CATEGORIES = [
  { title: "Exclusive Use", value: "exclusivity" },
  { title: "Food", value: "food" },
  { title: "Beverage", value: "beverage" },
  { title: "Set-Up", value: "setup" },
  { title: "Other", value: "other" },
] as const

/**
 * Malta's standard VAT rate. Staff set the live figure in Site settings; this
 * is only used where that is empty.
 */
export const DEFAULT_VAT_RATE = 18

/** Used for a new quote only where the wedding policy has no deposit set. */
export const DEFAULT_DEPOSIT_PERCENT = 30
