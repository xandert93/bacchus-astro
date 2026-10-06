import { test, expect } from "@playwright/test"

test("swiping the quote left shows the next testimonial @mobile", async ({ page }) => {
  await page.goto("/")

  const box = page.locator("#tQuoteBox")

  // essentially say, "Pretend a finger touched this element at (300, 200)."
  await box.dispatchEvent("pointerdown", {
    pointerType: "touch",
    clientX: 300,
    clientY: 200,
  })

  // essentially say, "Pretend a finger is then lifted from this element at (100, 205)."
  await box.dispatchEvent("pointerup", {
    pointerType: "touch",
    clientX: 100, // the finger moved left by 200 pixels.
    clientY: 205,
  })

  // find all testimonial card buttons and grab the second one
  // and check that it now selected
  await expect(page.locator("#tCards button").nth(1)).toHaveAttribute(
    "aria-selected",
    "true",
  )
})
