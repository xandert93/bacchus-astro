// What the review request and the review page share: how each kind of event
// is named to the client, which testimonial category it files under, and the
// wording of the permission box. The review endpoint stores that wording with
// each review, so the permission stays provable after it changes: edit it
// here, and both follow.

/** "How was your wedding?": the event, as the email and the page name it. */
export const REVIEW_OCCASIONS: Record<string, string> = {
  wedding: "your wedding",
  corporate: "your event",
  celebration: "your celebration",
  other: "your event",
}

/** The testimonial's category for each event type ("other" has none). */
export const REVIEW_CATEGORIES: Record<string, string> = {
  wedding: "wedding",
  corporate: "corporate",
  celebration: "celebration",
}

/**
 * The permission box's wording. Unticked to start, and ticking it is the
 * only way to say yes: under GDPR consent has to be an active choice, so a
 * box ticked in advance, or "tick to keep it private" (publishing by
 * default), wouldn't count.
 */
export const PUBLISH_WORDING =
  "Bacchus may show my review on its website, with the name above. Leave this unticked and it stays between you and our team."

/**
 * Where the thank-you screen sends people to review Bacchus on Google: for
 * now, Bacchus's listing found by a Maps search, where "Write a review" is a
 * click away. Replace it with their own review link (from their Google
 * Business profile, "Ask for reviews") once they supply it, and take the
 * Proposed badge off (src/components/reviews/ReviewForm.astro).
 */
export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=Bacchus+Restaurant+Mdina+Malta"

/** The longest review the page and the endpoint accept, in characters. */
export const REVIEW_MAXIMUM_LENGTH = 1500

/** Shorter than this isn't a review yet. */
export const REVIEW_MINIMUM_LENGTH = 10
