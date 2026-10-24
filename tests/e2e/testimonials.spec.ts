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

// known-bugs.md, 12: on a phone, five lines cut Daniela C's quote short and
// dropped its gold emphasis. Every live testimonial should show in full,
// with its emphasis, on a phone.
test("every testimonial shows in full, with its emphasis, on a phone @mobile", async ({
  page,
}) => {
  // The home page is heavy on an emulated phone, and this visits every quote.
  test.setTimeout(60_000)
  // The narrowest phones in common use, where quotes take the most lines.
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto("/")

  const testimonials: { quote: string }[] = JSON.parse(
    (await page.locator("#testimonialsData").textContent()) ?? "[]",
  )
  const cards = page.locator("#tCards button")
  const quote = page.locator("#tQuote")

  for (const [index, testimonial] of testimonials.entries()) {
    await cards.nth(index).click()
    await expect(cards.nth(index)).toHaveAttribute("aria-selected", "true")

    // The quote fades out and back in on a swap, so wait for the new one.
    const lastWords = testimonial.quote
      .replace(/<\/?em>/g, "")
      .trim()
      .slice(-12)
    await expect(quote).toContainText(lastWords)
    await expect(quote).not.toContainText("…")

    if (testimonial.quote.includes("<em>")) {
      await expect(quote.locator("em")).not.toHaveCount(0)
    }
  }
})
