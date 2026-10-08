import { expect, test } from "@playwright/test"
import { PAGES } from "./site-pages"

// A smoke test: every page, including drafts, loads with no script errors.
// One uncaught error stops every script after it on that page (in the
// prototype, a single null reference once took the burger menu down with
// it), so a page-level error here is the early warning.

for (const { path, title } of PAGES) {
  test(`${path} loads without script errors @mobile`, async ({ page }) => {
    const errors: string[] = []

    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })

    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await expect(page.locator("#nav")).toBeVisible()
    // site.js adds .loaded on its first frame: proof the scripts ran at all.
    await expect(page.locator("body")).toHaveClass(/loaded/)
    expect(errors).toEqual([])
  })
}
