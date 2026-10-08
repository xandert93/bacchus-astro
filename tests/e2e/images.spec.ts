import { expect, test } from "@playwright/test"

// Photos far below the fold must wait until the visitor scrolls near them
// (<Photo> is lazy by default), rather than downloading with the page.

// Chrome starts a lazy photo once it's within 1250-2500px of the screen,
// depending on connection speed, so only photos beyond that are checked.
const BEYOND_LAZY_THRESHOLD = 3000

const PAGES = ["/", "/weddings", "/gallery"]

for (const path of PAGES) {
  test(`${path} doesn't download photos far below the fold on load`, async ({ page }) => {
    const requested = new Set<string>()
    page.on("request", (request) => {
      if (request.resourceType() === "image")
        requested.add(new URL(request.url()).pathname)
    })

    await page.goto(path)
    await page.waitForLoadState("networkidle")

    const photos = await page.evaluate((threshold) => {
      const limit = window.innerHeight + threshold

      return [...document.querySelectorAll("img")].map((img) => {
        const sources = [img, ...(img.parentElement?.querySelectorAll("source") ?? [])]
        const candidates = sources.flatMap((source) =>
          (source.getAttribute("srcset") ?? "")
            .split(",")
            .map((candidate) => candidate.trim().split(" ")[0])
            .filter(Boolean),
        )

        return {
          alt: img.alt,
          candidates,
          farBelow: img.getBoundingClientRect().top > limit,
        }
      })
    }, BEYOND_LAZY_THRESHOLD)

    // A photo used twice (the logo in the header and the footer) is fetched
    // once for the copy near the top, so it can't tell us anything.
    const nearUrls = new Set(
      photos.filter((photo) => !photo.farBelow).flatMap((photo) => photo.candidates),
    )
    const farBelow = photos.filter(
      (photo) => photo.farBelow && !photo.candidates.some((url) => nearUrls.has(url)),
    )

    // Every page checked is long enough to have some, so an empty list means
    // the check itself has stopped working.
    expect(farBelow.length).toBeGreaterThan(0)

    const downloaded = farBelow.filter((photo) =>
      photo.candidates.some((url) => requested.has(new URL(url, page.url()).pathname)),
    )
    expect(downloaded.map((photo) => photo.alt)).toEqual([])
  })
}

// The originals run to 5504px. Served whole, the widest was a 1.4 MB photo
// (2 MB in the lightbox) for a sharpness gain nobody would see.
test("no photo offers a copy wider than 3200px", async ({ page }) => {
  await page.goto("/")

  const widths = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((img) => !img.closest(".hero-media"))
      .flatMap((img) => [img, ...(img.parentElement?.querySelectorAll("source") ?? [])])
      .flatMap((source) => (source.getAttribute("srcset") ?? "").match(/\d+(?=w)/g) ?? [])
      .map(Number),
  )

  expect(widths.length).toBeGreaterThan(0)
  expect(Math.max(...widths)).toBeLessThanOrEqual(3200)
})
