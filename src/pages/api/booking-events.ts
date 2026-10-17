// POST /api/booking-events: Sanity calls this when a confirmed wedding is
// cancelled (a webhook set up in sanity.io/manage; see
// docs/planning/sanity-rollout.md, step 6). If that frees the date, everyone
// confirmed on its waitlist is emailed at once, and marked Notified.
//
// "Frees the date" is checked, not assumed: another confirmed wedding or a
// closure can still hold it, and then nobody is told.

import type { APIRoute } from "astro"
import { SANITY_WEBHOOK_SECRET } from "astro:env/server"
import { DATE_BLOCKING_STATUSES } from "@studio/lib/constants"
import { activeWaitlistForDateQuery } from "@studio/queries/availability"
import { statusOnDate } from "@lib/availability/status-on-date"
import { sendEmail } from "@lib/email/send"
import { waitlistDateFreeEmail } from "@lib/email/waitlist-emails"
import { getWriteClient } from "@lib/sanity/write-client"
import { newToken } from "@lib/waitlist/tokens"
import { verifySanityWebhook } from "@lib/webhooks/sanity"

export const prerender = false

/** The webhook's projection, set in Sanity's dashboard. */
interface BookingChange {
  date?: string
  type?: string
  before?: string
  after?: string
}

const respond = (status: number, body?: Record<string, unknown>) =>
  new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: body ? { "Content-Type": "application/json" } : {},
  })

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
  const wasBooked = (DATE_BLOCKING_STATUSES as readonly string[]).includes(
    change.before ?? "",
  )

  // The webhook's filter should only send these, but check: anything else
  // is acknowledged and ignored, so Sanity doesn't retry it.
  if (
    change.type !== "wedding" ||
    change.after !== "cancelled" ||
    !wasBooked ||
    !change.date
  ) {
    return respond(204)
  }

  const client = getWriteClient()
  if (!client) return respond(503)

  try {
    if ((await statusOnDate(client, change.date)) === "taken") {
      return respond(200, { notified: 0, reason: "The date is still booked." })
    }

    const waiting = await client.fetch<{ _id: string; email: string; name?: string }[]>(
      activeWaitlistForDateQuery,
      { date: change.date },
    )
    const siteOrigin = new URL(request.url).origin

    // One by one, each with a fresh "take me off" link. A failed email
    // leaves that person Active, so they aren't wrongly marked as told.
    let notified = 0
    for (const entry of waiting) {
      const { token, hash } = await newToken()
      const result = await sendEmail(
        waitlistDateFreeEmail({
          to: entry.email,
          name: entry.name,
          date: change.date,
          token,
          siteOrigin,
        }),
      )
      if (!result.sent) continue

      await client
        .patch(entry._id)
        .set({
          status: "notified",
          notifiedAt: new Date().toISOString(),
          tokenHash: hash,
        })
        .commit()
      notified++
    }

    return respond(200, { notified })
  } catch (error) {
    // A 500 makes Sanity retry later; those already told are Notified and
    // won't be emailed twice.
    console.error("Waitlist not notified: Sanity refused a request.", error)
    return respond(500)
  }
}
