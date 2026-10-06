/**
 * The availability calendar, derived.
 *
 * This file is the replacement for `seededStatus()` in `main.js` — the fake
 * hash-seeded status function the prototype's calendar currently runs on. It
 * is written out here, with the schema rather than after it, because a content
 * model that cannot answer its own headline feature is not finished, and
 * because the derivation encodes several rules that are easy to get wrong.
 *
 * The three public states and what produces them:
 *
 *   Booked ("taken")             a confirmed or completed WEDDING on that date
 *   Enquiries received ("interest")  one or more pending wedding enquiries
 *   Available ("open")           neither
 *
 * Five rules that are not obvious from that table, each of which is a real
 * decision recorded elsewhere in the project:
 *
 * 1. ONLY WEDDINGS COUNT. Weddings are the single date-exclusive product —
 *    one a day — which is why the calendar appears under "Preferred date" only
 *    while Wedding is the selected event type and every other type keeps a
 *    plain native date input. A corporate booking must not grey out a date.
 *
 * 2. BACKUP DATES ARE INVISIBLE. The form promises in as many words that an
 *    alternative date "does not hold or reserve a date" and is for Bacchus's
 *    reference only. Counting it would break that promise, quietly, on a page
 *    that made it explicitly.
 *
 * 3. FLEXIBLE ENQUIRIES ARE INVISIBLE. An enquiry with no fixed date must not
 *    mark any date contested — nobody has asked for one.
 *
 * 4. DECLINED AND CANCELLED RELEASE THE DATE. Only `cancelled` releases a date
 *    that was publicly shown as Booked, which is exactly the transition the
 *    waitlist watches.
 *
 * 5. THE HORIZON AND THE NOTICE WINDOW ARE POLICY, NOT CODE. Both come from
 *    the `weddingPolicy` singleton. The minimum notice is currently a
 *    placeholder (three months) and the horizon is two years.
 *
 * One deliberate omission to decide on: `venueClosure`. The closure query is
 * written below but is NOT folded into the status map, because closures are a
 * proposed addition rather than something the project has agreed to. Opt in by
 * uncommenting the merge in `deriveStatuses`.
 */

/** The three states the calendar renders, named as the existing CSS expects. */
export type AvailabilityStatus = 'open' | 'interest' | 'taken'

export interface AvailabilityInput {
  /** ISO date, YYYY-MM-DD. */
  date: string
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed'
}

/**
 * Every wedding booking inside the window that can affect a date's status.
 *
 * Fetches only `eventDate` and `status` — no names, no emails, no messages.
 * This query's results reach the public page, and the booking documents it
 * reads are full of personal data, so the projection is the boundary. Widening
 * it to `...` would publish an enquiry list.
 *
 * `$from` and `$to` are computed from the policy singleton, not hardcoded.
 */
export const weddingDateStatusesQuery = /* groq */ `
*[
  _type == "booking" &&
  eventType == "wedding" &&
  dateIsFlexible != true &&
  defined(eventDate) &&
  eventDate >= $from &&
  eventDate <= $to &&
  status in ["pending", "confirmed", "completed"]
]{
  "date": eventDate,
  status
}
`

/** Closures overlapping the window. See rule 5 above — not yet wired in. */
export const closureRangesQuery = /* groq */ `
*[
  _type == "venueClosure" &&
  blocksWeddings == true &&
  startDate <= $to &&
  endDate >= $from
]{
  startDate,
  endDate,
  showPublicly,
  publicNote
}
`

/** The window and notice rules, read from policy rather than assumed. */
export const availabilityPolicyQuery = /* groq */ `
*[_type == "weddingPolicy"][0]{
  bookingHorizonMonths,
  minNoticeMonths
}
`

/**
 * Collapse booking rows into one status per date.
 *
 * Confirmed beats pending, which is why this cannot be a simple last-write
 * map: a date with one confirmed booking and three pending enquiries is
 * Booked, regardless of row order.
 */
export function deriveStatuses(
  rows: AvailabilityInput[],
  // closures: {startDate: string; endDate: string}[] = [],
): Record<string, AvailabilityStatus> {
  const byDate: Record<string, AvailabilityStatus> = {}

  for (const row of rows) {
    if (!row?.date) continue
    const blocking = row.status === 'confirmed' || row.status === 'completed'
    if (blocking) {
      byDate[row.date] = 'taken'
    } else if (row.status === 'pending' && byDate[row.date] !== 'taken') {
      byDate[row.date] = 'interest'
    }
  }

  // Opt in to closures by uncommenting this and the parameter above. Closures
  // win over everything, including a confirmed booking — if the venue is shut,
  // the booking is a problem to be dealt with, not a reason to show the date
  // as available.
  //
  // for (const closure of closures) {
  //   for (const iso of eachDate(closure.startDate, closure.endDate)) {
  //     byDate[iso] = 'taken'
  //   }
  // }

  return byDate
}

/** Inclusive date range as ISO strings. */
export function eachDate(startIso: string, endIso: string): string[] {
  const out: string[] = []
  const cursor = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

/**
 * Active, VERIFIED waitlist entries for a date.
 *
 * The `defined(verifiedAt)` clause is the whole anti-spam and data-protection
 * mechanism: an unverified address is one anybody could have typed into the
 * form, including someone else's. Do not relax it for convenience — emailing
 * an unverified address is the one failure mode this feature can produce that
 * reaches a stranger.
 *
 * Called by the serverless function that a Sanity webhook invokes when a
 * booking transitions confirmed -> cancelled.
 */
export const activeWaitlistForDateQuery = /* groq */ `
*[
  _type == "waitlistEntry" &&
  eventDate == $date &&
  status == "active" &&
  defined(verifiedAt)
]{
  _id,
  email,
  name
}
`

/**
 * Other pending enquiries on a date, for the deposit race.
 *
 * When one pending enquiry's deposit lands, it auto-confirms and these are the
 * records to mark unavailable and notify — rather than leaving them dangling,
 * which is the failure the project explicitly called out. Excludes the winner
 * by id.
 */
export const competingPendingBookingsQuery = /* groq */ `
*[
  _type == "booking" &&
  eventType == "wedding" &&
  status == "pending" &&
  eventDate == $date &&
  _id != $winnerId
]{
  _id,
  firstName,
  lastName,
  email
}
`
