import { expect, test, type Locator } from "@playwright/test"

// Reads the gold underline's left/right inset and the link's own padding.
async function underlineAndPadding(link: Locator) {
  return link.evaluate((element) => {
    const box = getComputedStyle(element)
    const underline = getComputedStyle(element, "::after")
    return {
      paddingLeft: box.paddingLeft,
      underlineLeft: underline.left,
    }
  })
}

// Regression for the 2026-10-04 fix: in the compact band (980–1179.98px)
// the split triggers' underline started 6px before the first letter because
// padding and underline inset were set by different rules. They now share
// custom properties; this checks they agree at every width the bar uses.
for (const width of [1000, 1100, 1179, 1180, 1400]) {
  test(`top-level nav underline starts under the first letter at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/corporate")

    const links = page.locator(".nav-links > li > a")
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const { paddingLeft, underlineLeft } = await underlineAndPadding(links.nth(i))
      expect(underlineLeft, `link ${i}`).toBe(paddingLeft)
    }
  })
}

test("Events is marked active on an events page", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.goto("/corporate")
  await expect(page.locator(".nav-dd-split > a", { hasText: "Events" })).toHaveClass(
    /active/,
  )
})

// Prototype bug #33: widening past the burger cutover with the drawer open
// left the overlay painted and, worse, the page scroll-locked.
test("opening the drawer then widening to desktop closes it and unlocks scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await page.goto("/")

  await page.locator("#burger").click()
  await expect(page.locator("body")).toHaveClass(/menu-open/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden")

  await page.setViewportSize({ width: 1200, height: 900 })
  await expect(page.locator("body")).not.toHaveClass(/menu-open/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("")
})
