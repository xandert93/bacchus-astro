// Finds the booking a review link's token belongs to, and whether it has
// already left its review: shared by the review page's two endpoints.

import type { SanityClient } from "@sanity/client"
import { bookingTag } from "@lib/email/log"
import { hashToken } from "@lib/tokens"

export interface ReviewBooking {
  _id: string
  firstName: string
  lastName: string
  partnerName?: string
  email: string
  date?: string
  eventType: string
  reviewSent: boolean
  /** The review they sent, as plain text, for the thank-you screen to copy. */
  reviewText?: string
}

/**
 * One review per booking: its testimonial's id is made from the booking's,
 * so a second one can't be created. The dot keeps it out of public reads,
 * like every document holding a real person's details.
 */
export const reviewTestimonialId = (bookingId: string) =>
  `testimonial.review-${bookingTag(bookingId)}`

export const bookingByReviewToken = async (client: SanityClient, token: unknown) => {
  if (typeof token !== "string" || !token) return null

  const booking = await client.fetch<Omit<ReviewBooking, "reviewSent"> | null>(
    `*[_type == "booking" && reviewTokenHash == $hash && !(_id in path("drafts.**"))][0]{
      _id,
      "firstName": client.firstName,
      "lastName": client.lastName,
      "partnerName": client.partnerName,
      "email": client.email,
      "date": event.date,
      "eventType": event.type
    }`,
    { hash: await hashToken(token) },
  )
  if (!booking) return null

  const review = await client.fetch<{ text?: string } | null>(
    `*[_id == $id][0]{"text": pt::text(quote)}`,
    { id: reviewTestimonialId(booking._id) },
  )

  return { ...booking, reviewSent: Boolean(review), reviewText: review?.text }
}

/** "Bertha & Alex", or just "Bertha": what the page suggests as the name to show. */
export const suggestedDisplayName = (booking: ReviewBooking) =>
  booking.partnerName
    ? `${booking.firstName} & ${booking.partnerName}`
    : booking.firstName

/** Everyone the review is from, in full, for staff. */
export const fullNames = (booking: ReviewBooking) =>
  [`${booking.firstName} ${booking.lastName}`, booking.partnerName]
    .filter(Boolean)
    .join(" & ")
