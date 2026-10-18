/**
 * The webhooks Sanity calls on the site, defined once. A webhook is Sanity's
 * server calling one of the site's API routes when a published document
 * changes in a way the filter picks out, with the projection as its body.
 *
 * Used in two places, so they can't drift apart:
 *
 * - The live site: each is created by hand in sanity.io/manage → the project
 *   → API → Webhooks, pasting the settings that
 *   `npm run dev:webhooks -- --print` prints from this file
 *   (docs/planning/sanity-rollout.md, step 7).
 * - Local development: Sanity can't call localhost, so
 *   `relay.ts`, beside this file, watches the development dataset and
 *   makes the same calls with the same filters and projections.
 *
 * Every one is POST, on Update only, drafts off, signed with
 * `SANITY_WEBHOOK_SECRET`.
 */

export type SiteWebhook = {
  name: string
  /** The API route it calls, e.g. "/api/quote-events". */
  path: string
  /** GROQ, with before() and after() for the document either side. */
  filter: string
  projection: string
}

// How many deposit payments are marked Received. coalesce() turns a booking
// with no payments yet into 0: count() of nothing is null, not 0, and a
// comparison with null is never true.
const receivedDeposits = (version: "before" | "after") =>
  `count(coalesce(${version}().payments[kind == "deposit" && status == "received"], []))`

/** A deposit payment on the booking has just been marked Received. */
const DEPOSIT_RECEIVED = `${receivedDeposits("after")} > ${receivedDeposits("before")}`

/** A wedding that held its date on the calendar has fallen through. */
const WEDDING_CANCELLED = `event.type == "wedding" && before().status in ["confirmed", "completed"] && after().status == "cancelled"`

export const SITE_WEBHOOKS: SiteWebhook[] = [
  {
    // Confirms a booking whose deposit staff marked received, and tells a
    // cancelled wedding date's waitlist (src/pages/api/booking-events.ts).
    name: "Booking changes",
    path: "/api/booking-events",
    filter: `_type == "booking" && ((${WEDDING_CANCELLED}) || ${DEPOSIT_RECEIVED})`,
    projection: `{_id, "date": event.date, "type": event.type, "before": before().status, "after": after().status, "depositReceived": ${DEPOSIT_RECEIVED}}`,
  },
  {
    // Emails the client their quote and deposit link
    // (src/pages/api/quote-events.ts).
    name: "Quote sent",
    path: "/api/quote-events",
    filter: `_type == "quote" && before().status == "draft" && after().status == "sent"`,
    projection: `{_id, "before": before().status, "after": after().status}`,
  },
]
