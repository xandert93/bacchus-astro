// GET /api/availability: the wedding calendar's statuses, worked out from the
// bookings and closures in Sanity when a visitor opens the page, so the
// calendar shows what is true now rather than what was true at the last
// build. The rules are in sanity/queries/availability.ts.
//
// Public on purpose: it returns dates and statuses only, never a name, an
// email or which booking made a date busy.

import type { APIRoute } from "astro"
import { getLiveClient } from "@lib/sanity/live-client"
import {
  availabilityPolicyQuery,
  closureRangesQuery,
  deriveStatuses,
  weddingDateStatusesQuery,
  type AvailabilityInput,
  type ClosureRange,
} from "@studio/queries/availability"

export const prerender = false

/** Used where the wedding policy doesn't say. */
const DEFAULT_HORIZON_MONTHS = 24
const DEFAULT_MIN_NOTICE_MONTHS = 3

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

const monthsFrom = (date: Date, months: number) => {
  const later = new Date(date)
  later.setUTCMonth(later.getUTCMonth() + months)

  return later
}

const json = (status: number, body: Record<string, unknown>, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })

export const GET: APIRoute = async () => {
  const client = getLiveClient()
  if (!client) {
    console.error("Availability not loaded: SANITY_API_READ_TOKEN is not set.")
    return json(503, { error: "Availability can't be loaded right now." })
  }

  try {
    const policy = await client.fetch<{
      bookingHorizonMonths?: number
      minNoticeMonths?: number
    } | null>(availabilityPolicyQuery)

    const horizonMonths = policy?.bookingHorizonMonths ?? DEFAULT_HORIZON_MONTHS
    const minNoticeMonths = policy?.minNoticeMonths ?? DEFAULT_MIN_NOTICE_MONTHS

    const today = new Date()
    const from = isoDate(today)
    const to = isoDate(monthsFrom(today, horizonMonths))

    // Both in one request.
    const { bookings, closures } = await client.fetch<{
      bookings: AvailabilityInput[]
      closures: ClosureRange[]
    }>(`{ "bookings": ${weddingDateStatusesQuery}, "closures": ${closureRangesQuery} }`, {
      from,
      to,
    })

    return json(
      200,
      {
        from,
        to,
        horizonMonths,
        minNoticeMonths,
        // Only busy dates: any date not listed is available.
        statuses: deriveStatuses(bookings, closures),
      },
      // Never reused: a date can be booked at any moment, and the page asks
      // only once per visit anyway.
      { "Cache-Control": "no-store" },
    )
  } catch (error) {
    console.error("Availability not loaded: Sanity refused the query.", error)
    return json(502, { error: "Availability can't be loaded right now." })
  }
}
