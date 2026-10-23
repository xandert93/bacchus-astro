// What happens after an event, checked once a day by the daily jobs
// (src/lib/jobs/daily.ts):
//
//   completed       the day after the event, a Confirmed booking becomes
//                   Completed. Its date stays Booked on the calendar.
//   review request  a week after it, the client is emailed a link to /review
//                   (src/components/reviews/ReviewForm.astro). A booking
//                   staff mark Completed by hand is asked too.
//
// The status change and `reviewRequestedAt` are what a second run checks, so
// running twice in a day does nothing twice.

import type { SanityClient } from "@sanity/client"
import { changeStatus } from "@lib/bookings/status"
import { addDays, todayInMalta } from "@lib/dates"
import { longDate } from "@lib/dates"
import { sendAndLog } from "@lib/email/log"
import { reviewRequestEmail } from "@lib/email/review-emails"
import { newToken } from "@lib/tokens"

/** How many days after the event the request goes: time to get home, or back from a honeymoon. */
export const REVIEW_REQUEST_DAYS_AFTER = 7

/**
 * Events further back than this aren't asked about, so a past booking staff
 * add as Completed (an old wedding, say) doesn't send a request out of the
 * blue.
 */
const REVIEW_REQUEST_LATEST_DAYS_AFTER = 30

const PAST_CONFIRMED_BOOKINGS = /* groq */ `*[
  _type == "booking" && status == "confirmed" && event.date < $today &&
  !(_id in path("drafts.**"))
]{_id, status, "date": event.date}`

const BOOKINGS_DUE_A_REVIEW_REQUEST = /* groq */ `*[
  _type == "booking" && status == "completed" && !defined(reviewRequestedAt) &&
  event.date <= $latestDate && event.date >= $earliestDate &&
  !(_id in path("drafts.**"))
]{_id, "date": event.date, "eventType": event.type, "firstName": client.firstName, "email": client.email}`

interface PastBooking {
  _id: string
  status: string
  date: string
}

interface BookingDueARequest {
  _id: string
  date: string
  eventType: string
  firstName: string
  email: string
}

const complete = (client: SanityClient, booking: PastBooking) =>
  changeStatus(client.patch(booking._id), {
    from: booking.status,
    to: "completed",
    actor: "cron",
    reason: `The event on ${longDate(booking.date)} has taken place.`,
  }).commit()

const requestReview = async (
  client: SanityClient,
  booking: BookingDueARequest,
  { siteOrigin }: { siteOrigin: string },
) => {
  const { token, hash } = await newToken()

  // Recorded before sending, so a failed send isn't retried every day. The
  // Email Log shows whether it went.
  await client
    .patch(booking._id)
    .set({ reviewRequestedAt: new Date().toISOString(), reviewTokenHash: hash })
    .commit()

  await sendAndLog(
    client,
    { bookingId: booking._id, audience: "client" },
    reviewRequestEmail({
      to: booking.email,
      firstName: booking.firstName,
      date: booking.date,
      eventType: booking.eventType,
      reviewLink: `${siteOrigin}/review?token=${token}`,
    }),
  )
}

export const runEventFollowUps = async (
  client: SanityClient,
  { siteOrigin }: { siteOrigin: string },
) => {
  const today = todayInMalta()
  const completed: string[] = []
  const reviewsRequested: string[] = []

  const pastBookings = await client.fetch<PastBooking[]>(PAST_CONFIRMED_BOOKINGS, {
    today,
  })

  for (const booking of pastBookings) {
    // One booking failing mustn't stop the rest.
    try {
      await complete(client, booking)
      completed.push(booking._id)
    } catch (error) {
      console.error(`Booking ${booking._id} not marked Completed.`, error)
    }
  }

  const dueRequests = await client.fetch<BookingDueARequest[]>(
    BOOKINGS_DUE_A_REVIEW_REQUEST,
    {
      latestDate: addDays(today, -REVIEW_REQUEST_DAYS_AFTER),
      earliestDate: addDays(today, -REVIEW_REQUEST_LATEST_DAYS_AFTER),
    },
  )

  for (const booking of dueRequests) {
    try {
      await requestReview(client, booking, { siteOrigin })
      reviewsRequested.push(booking._id)
    } catch (error) {
      console.error(`Review not requested for ${booking._id}.`, error)
    }
  }

  return { completed, reviewsRequested }
}
