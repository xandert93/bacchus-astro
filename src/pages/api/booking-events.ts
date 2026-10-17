// POST /api/booking-events: Sanity calls this when a booking changes in one
// of two ways that need the site to act (a webhook set up in
// sanity.io/manage; see docs/planning/sanity-rollout.md, steps 6 and 7):
//
//   - a confirmed wedding is cancelled: if that frees the date, everyone
//     confirmed on its waitlist is told (src/lib/waitlist/notify.ts);
//   - staff mark a deposit Received (a bank transfer reached the account):
//     the booking is confirmed and everyone told (src/lib/deposits/confirm.ts).

import type { APIRoute } from "astro"
import { SANITY_WEBHOOK_SECRET } from "astro:env/server"
import { DATE_BLOCKING_STATUSES, OPEN_ENQUIRY_STATUSES } from "@studio/lib/constants"
import { confirmDeposit } from "@lib/deposits/confirm"
import { loadDepositByBookingId } from "@lib/deposits/load"
import { getWriteClient } from "@lib/sanity/write-client"
import { notifyWaitlist } from "@lib/waitlist/notify"
import { verifySanityWebhook } from "@lib/webhooks/sanity"

export const prerender = false

/** The webhook's projection, set in Sanity's dashboard. */
interface BookingChange {
  _id?: string
  date?: string
  type?: string
  before?: string
  after?: string
  depositReceived?: boolean
}

const respond = (status: number, body?: Record<string, unknown>) =>
  new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: body ? { "Content-Type": "application/json" } : {},
  })

const isOneOf = (list: readonly string[], value?: string) => list.includes(value ?? "")

export const POST: APIRoute = async ({ request }) => {
  if (!SANITY_WEBHOOK_SECRET) {
    console.error("Booking change ignored: SANITY_WEBHOOK_SECRET is not set.")
    return respond(503)
  }

  // The raw text, not parsed JSON: the signature covers the exact bytes.
  const rawBody = await request.text()
  if (!(await verifySanityWebhook(rawBody, request.headers, SANITY_WEBHOOK_SECRET))) {
    return respond(401)
  }

  const change = JSON.parse(rawBody) as BookingChange
  const siteOrigin = new URL(request.url).origin

  const weddingCancelled =
    change.type === "wedding" &&
    change.after === "cancelled" &&
    isOneOf(DATE_BLOCKING_STATUSES, change.before) &&
    change.date

  const depositArrived =
    change.depositReceived && isOneOf(OPEN_ENQUIRY_STATUSES, change.after) && change._id

  // The webhook's filter should only send these two, but check: anything
  // else is acknowledged and ignored, so Sanity doesn't retry it.
  if (!weddingCancelled && !depositArrived) return respond(204)

  const client = getWriteClient()
  if (!client) return respond(503)

  try {
    if (weddingCancelled) {
      const notified = await notifyWaitlist(client, {
        date: change.date as string,
        siteOrigin,
      })
      return respond(200, { notified })
    }

    const record = await loadDepositByBookingId(client, change._id as string)
    if (!record) {
      console.error(`Deposit received for ${change._id}, which has no sent quote.`)
      return respond(204)
    }

    const outcome = await confirmDeposit(client, record, { actor: "staff", siteOrigin })
    return respond(200, { outcome })
  } catch (error) {
    // A 500 makes Sanity retry later. Both actions are safe to repeat: those
    // already told are Notified, and a confirmed booking isn't confirmed twice.
    console.error("Booking change not handled: Sanity refused a request.", error)
    return respond(500)
  }
}
