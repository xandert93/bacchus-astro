// Prints a page of HTML to a PDF with Cloudflare's Browser Rendering: a real
// Chrome that Cloudflare runs, reached through the Worker's BROWSER binding
// (wrangler.jsonc). Locally, `npm run dev` runs a Chrome on this machine for
// the same binding. Each PDF holds a browser open for a second or two, which
// is what Cloudflare counts (docs/architecture/tech-stack.md, "Hosting").
//
// Locally the binding is "remote" (wrangler.jsonc): the dev server borrows a
// real Cloudflare browser, because the local stand-in hangs while printing.

/** A browser that doesn't answer within this long has failed, not just slowed. */
const LOAD_TIMEOUT_MS = 20_000

/**
 * Cloudflare limits how often a new browser can be started (a few a minute on
 * the free plan) and answers 429 when that's exceeded. Quotes are sent one at
 * a time, so a short wait and another go is enough.
 */
const LAUNCH_ATTEMPTS = 3
const LAUNCH_RETRY_WAIT_MS = 10_000

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const launchBrowser = async (
  puppeteer: typeof import("@cloudflare/puppeteer").default,
  binding: import("@cloudflare/puppeteer").BrowserWorker,
  attemptsLeft = LAUNCH_ATTEMPTS,
): ReturnType<typeof puppeteer.launch> => {
  try {
    return await puppeteer.launch(binding)
  } catch (error) {
    const rateLimited = String(error).includes("429")
    if (!rateLimited || attemptsLeft <= 1) throw error

    await wait(LAUNCH_RETRY_WAIT_MS)
    return launchBrowser(puppeteer, binding, attemptsLeft - 1)
  }
}

/**
 * Chrome's own footer: the given line on the left, "Page 1 of 3" on the
 * right. It's drawn apart from the page, so it can't use the page's web
 * fonts or styles; everything it needs is inline.
 */
const footerTemplate = (footer: string) => `
  <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 16mm 4mm; font-family: Helvetica, Arial, sans-serif; font-size: 7pt; color: #6b6457;">
    <span>${footer}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`

export const printPdf = async (
  html: string,
  { footer = "" }: { footer?: string } = {},
): Promise<Uint8Array<ArrayBuffer>> => {
  const { env } = await import("cloudflare:workers")
  if (!env.BROWSER) throw new Error("Browser Rendering isn't set up: no BROWSER binding.")

  const { default: puppeteer } = await import("@cloudflare/puppeteer")
  const browser = await launchBrowser(puppeteer, env.BROWSER)

  try {
    const page = await browser.newPage()

    // "load" waits for the stylesheet and the logo, which the page fetches
    // from the web; the fonts it names then load, and are waited for too.
    await page.setContent(html, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS })
    await page.evaluate(() => document.fonts.ready)

    // SVG text doesn't size its own box: fit the title's gold phrase to its
    // words.
    await page.evaluate(() => {
      const phrase = document.getElementById("goldPhrase")
      const text = phrase?.querySelector("text")
      if (phrase && text) {
        phrase.setAttribute("width", String(Math.ceil(text.getBBox().width) + 2))
      }
    })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "16mm", bottom: "18mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerTemplate(footer),
    })
    return Uint8Array.from(pdf)
  } finally {
    await browser.close()
  }
}
