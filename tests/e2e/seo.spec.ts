import { expect, test } from "@playwright/test"
import { PAGES } from "./site-pages"

// What search engines and link previews read from each page (SiteHead,
// src/lib/structured-data.ts). None of it is visible, so nothing else would
// notice it going missing.

const SITE = "https://bacchus.com.mt"

for (const { path } of PAGES.filter((page) => !page.noIndex)) {
  test(`${path} has a description, a canonical address and a link preview`, async ({
    page,
  }) => {
    await page.goto(path)

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
    expect(description?.length).toBeGreaterThan(50)
    // Search engines cut a snippet at about 160 characters.
    expect(description?.length).toBeLessThanOrEqual(160)

    // The address visitors use: no ".html", no trailing slash.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      path === "/" ? `${SITE}/` : `${SITE}${path}`,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`^${SITE}/_astro/.+\\.jpg$`),
    )
  })
}

test("the homepage describes the venue as structured data", async ({ page }) => {
  await page.goto("/")

  const json = await page.locator('script[type="application/ld+json"]').textContent()
  const venue = JSON.parse(json ?? "{}")

  expect(venue["@type"]).toContain("Restaurant")
  expect(venue.address.addressLocality).toBe("Mdina")
})

test("a package page has its breadcrumb trail as structured data", async ({ page }) => {
  await page.goto("/weddings/packages/banquet")

  const json = await page.locator('script[type="application/ld+json"]').textContent()
  const trail = JSON.parse(json ?? "{}")

  expect(trail.itemListElement.map((step: { name: string }) => step.name)).toEqual([
    "Home",
    "Weddings",
    "Banquet Menus",
  ])
})

test("robots.txt points to the sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text()

  expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`)
})
