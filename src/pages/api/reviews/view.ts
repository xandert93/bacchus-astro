// POST /api/reviews/view: what the /review page shows for its link's token
// (src/components/reviews/ReviewForm.js): who it's for, their event, and
// whether they've already left their review. A POST so the token stays out
// of logs that record addresses.

import type { APIRoute } from "astro"
import { REVIEW_OCCASIONS } from "@data/reviews"
import { json, readFormPost } from "@lib/api/requests"
import { getWriteClient } from "@lib/sanity/write-client"
import { bookingByReviewToken, suggestedDisplayName } from "@lib/reviews/booking-by-token"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post.refusal

  const client = getWriteClient()
  if (!client) return json(503, { error: "This page can't load right now." })

  try {
    const booking = await bookingByReviewToken(client, post.body.token)
    if (!booking) return json(404, { error: "That link isn't valid any more." })

    return json(
      200,
      {
        firstName: booking.firstName,
        date: booking.date,
        occasion: REVIEW_OCCASIONS[booking.eventType] ?? REVIEW_OCCASIONS.other,
        suggestedName: suggestedDisplayName(booking),
        reviewSent: booking.reviewSent,
        reviewText: booking.reviewText ?? "",
      },
      { "Cache-Control": "no-store" },
    )
  } catch (error) {
    console.error("Review page not loaded.", error)
    return json(502, { error: "This page can't load right now." })
  }
}
