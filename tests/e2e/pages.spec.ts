import { expect, test } from "@playwright/test"

// Every ported page should load with no uncaught script errors. main.js runs
// on every page and each block has to no-op where its markup is absent
// (prototype bug #4: one null-reference throw killed everything after it,
// burger menu included), so a page-level error here is the early warning.
const PAGES = [
  { path: "/", title: /Bacchus/ },
  { path: "/weddings", title: /Weddings/ },
  { path: "/corporate", title: /Corporate/ },
  { path: "/celebrations", title: /Celebrations/ },
  { path: "/gallery", title: /Gallery/ },
  { path: "/weddings/packages/reception", title: /Reception/ },
  { path: "/weddings/packages/banquet", title: /Banquet/ },
  { path: "/weddings/packages/high-tea", title: /High Tea/ },
  { path: "/weddings/packages/beverage", title: /Beverage/ },
]

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
    // main.js adds .loaded on its first frame — proof the script ran at all.
    await expect(page.locator("body")).toHaveClass(/loaded/)
    expect(errors).toEqual([])
  })
}
