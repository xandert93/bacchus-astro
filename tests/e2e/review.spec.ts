import { test, expect, type Page } from "@playwright/test"
import { REVIEW_MINIMUM_LENGTH } from "@data/reviews"

// The review page asks /api/reviews/view who its link is for. The preview
// server has no Sanity access in CI, so the test answers for it.
const answerAsAWeddingBooking = async (page: Page) => {
  await page.route("**/api/reviews/view", (route) =>
    route.fulfill({
      json: {
        firstName: "Rachel",
        date: "2026-08-29",
        occasion: "wedding",
        suggestedName: "Rachel & Paul Zammit",
        reviewSent: false,
        reviewText: "",
      },
    }),
  )
}

test("a review that's too short says how long it needs to be", async ({ page }) => {
  await answerAsAWeddingBooking(page)
  await page.goto("/review?token=test")

  await page.getByLabel("5 stars").check({ force: true })
  await page.locator("#reviewText").fill("Good")
  await page.getByRole("button", { name: "Send my review" }).click()

  await expect(page.locator("#reviewTextField .error")).toBeVisible()
  await expect(page.locator("#reviewTextField .error")).toContainText(
    `at least ${REVIEW_MINIMUM_LENGTH} characters`,
  )
})

test("the heading names the kind of event the booking was", async ({ page }) => {
  await answerAsAWeddingBooking(page)
  await page.goto("/review?token=test")

  await expect(page.locator("#reviewTitle")).toHaveText("Tell us about your wedding")
})
