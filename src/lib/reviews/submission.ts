// A review as the /review page sends it: checked, then turned into a
// testimonial for staff to look at in the Studio.

import {
  PUBLISH_WORDING,
  REVIEW_CATEGORIES,
  REVIEW_MAXIMUM_LENGTH,
  REVIEW_MINIMUM_LENGTH,
  REVIEW_TOO_SHORT_MESSAGE,
} from "@data/reviews"
import { fullNames, reviewTestimonialId, type ReviewBooking } from "./booking-by-token"

const NAME_MAXIMUM_LENGTH = 80

export interface Review {
  rating: number
  text: string
  displayName: string
  location?: string
  publish: boolean
}

const trimmed = (value: unknown) => (typeof value === "string" ? value.trim() : "")

/** The review, or what's wrong with it, in words the page can show. */
export const validateReview = (
  body: Record<string, unknown>,
): { review: Review } | { error: string } => {
  const rating = Number(body.rating)
  const text = trimmed(body.text)
  const displayName = trimmed(body.displayName)
  const location = trimmed(body.location)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please choose a rating." }
  }
  if (text.length < REVIEW_MINIMUM_LENGTH) {
    return { error: REVIEW_TOO_SHORT_MESSAGE }
  }
  if (text.length > REVIEW_MAXIMUM_LENGTH) {
    return { error: `Please keep it under ${REVIEW_MAXIMUM_LENGTH} characters.` }
  }
  if (!displayName || displayName.length > NAME_MAXIMUM_LENGTH) {
    return { error: "Please add the name to show with it." }
  }
  if (location.length > NAME_MAXIMUM_LENGTH) {
    return { error: "Please shorten where you're from." }
  }
  if (typeof body.publish !== "boolean") {
    return { error: "That couldn't be read: please try again." }
  }

  return {
    review: {
      rating,
      text,
      displayName,
      location: location || undefined,
      publish: body.publish,
    },
  }
}

const key = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12)

/** Each paragraph they typed as a block of the testimonial's quote. */
const toQuoteBlocks = (text: string) =>
  text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: key(), text: paragraph, marks: [] }],
    }))

export const toTestimonial = (review: Review, booking: ReviewBooking) => ({
  _id: reviewTestimonialId(booking._id),
  _type: "testimonial",
  status: "submitted",
  quote: toQuoteBlocks(review.text),
  rating: review.rating,
  ...(REVIEW_CATEGORIES[booking.eventType]
    ? { category: REVIEW_CATEGORIES[booking.eventType] }
    : {}),
  ...(booking.date ? { eventDate: booking.date } : {}),
  author: {
    fullName: fullNames(booking),
    displayName: review.displayName,
    ...(review.location ? { location: review.location } : {}),
  },
  permissions: { useName: review.publish, usePhoto: false },
  consent: {
    _type: "consentRecord",
    given: review.publish,
    givenAt: new Date().toISOString(),
    wording: PUBLISH_WORDING,
    sourcePage: "/review",
  },
  // Weak, so the booking can still be deleted when its retention date comes.
  sourceBooking: { _type: "reference", _ref: booking._id, _weak: true },
})
