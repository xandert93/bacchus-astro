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

/** Wizard step 1 chips — `data-v` on `.chip` in every enquiry form. */
export const EVENT_TYPES = [
  { title: 'Wedding', value: 'wedding' },
  { title: 'Corporate', value: 'corporate' },
  { title: 'Celebration', value: 'celebration' },
  { title: 'Other', value: 'other' },
] as const

/**
 * Booking lifecycle.
 *
 * `pending` IS the enquiry — there is no separate enquiry type. CLAUDE.md:
 * "the booking record itself has a status field […] the public calendar just
 * reads that". Several `pending` bookings may share one date; at most one
 * `confirmed` may (see `queries/availability.ts` and the note on
 * `booking.status`).
 *
 * `cancelled` is distinct from `declined`: declined is Bacchus saying no to an
 * enquiry, cancelled is a confirmed booking falling through afterwards. Only
 * `cancelled` releases a date that was publicly shown as Booked, which is the
 * transition the waitlist webhook watches.
 */
export const BOOKING_STATUSES = [
  { title: 'Pending — enquiry received, not yet answered', value: 'pending' },
  { title: 'Confirmed — deposit received, date held', value: 'confirmed' },
  { title: 'Declined — Bacchus could not take it', value: 'declined' },
  { title: 'Cancelled — was confirmed, then fell through', value: 'cancelled' },
  { title: 'Completed — event has taken place', value: 'completed' },
] as const

/** Statuses that make a date read as Booked on the public calendar. */
export const DATE_BLOCKING_STATUSES = ['confirmed', 'completed'] as const

/**
 * Wizard step 2, `#eventStyle` option cards — `data-v` values verbatim.
 * Intake colour for the events team, not a package selection; the field note
 * on the form says as much ("a starting point, not a package").
 */
export const EVENT_STYLES = [
  { title: 'Candlelit & ceremonial', value: 'candlelit-ceremonial' },
  { title: 'Garden & golden hour', value: 'garden-golden-hour' },
  { title: 'Formal & refined', value: 'formal-refined' },
  { title: 'Still exploring', value: 'still-exploring' },
] as const

/**
 * `data-cat` on `.gallery-item`, and the `#gf-*` filter radios.
 *
 * "venue" rather than "spaces" because that is what the markup and the
 * `?filter=` deep links already use — renaming it would break the inbound
 * links from each page's mini-gallery ("View the full gallery").
 */
export const GALLERY_CATEGORIES = [
  { title: 'Weddings', value: 'weddings' },
  { title: 'Corporate', value: 'corporate' },
  { title: 'Celebrations', value: 'celebrations' },
  { title: 'Venue', value: 'venue' },
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
  { title: 'per person', value: 'per-person' },
  { title: 'per bottle', value: 'per-bottle' },
  { title: 'each', value: 'each' },
  { title: 'per hour', value: 'per-hour' },
  { title: 'flat fee', value: 'flat' },
] as const

/** Quote line-item groupings — the labels used in `secure-booking.html`. */
export const QUOTE_LINE_CATEGORIES = [
  { title: 'Exclusive use', value: 'exclusivity' },
  { title: 'Food', value: 'food' },
  { title: 'Beverage', value: 'beverage' },
  { title: 'Set-up', value: 'setup' },
  { title: 'Other', value: 'other' },
] as const

/** Malta's standard VAT rate, as shown on the deposit page. */
export const DEFAULT_VAT_RATE = 18
