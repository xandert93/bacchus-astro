// Interaction states (dropdown open, drawer open, wizard steps, lightbox,
// popover, FAQ open, testimonial hover) compared between two builds.
import { chromium, devices } from "@playwright/test"
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { pageFile } from "./lib/page-file.mjs"
const T = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".png": "image/png",
}
const serve = (dir, port) =>
  http
    .createServer((q, r) => {
      const f = pageFile(dir, q.url.split("?")[0])
      if (!f) {
        r.writeHead(404)
        return r.end()
      }
      r.writeHead(200, {
        "content-type": T[path.extname(f)] || "application/octet-stream",
      })
      fs.createReadStream(f).pipe(r)
    })
    .listen(port)
const PROPS = [
  "display",
  "position",
  "width",
  "height",
  "top",
  "left",
  "opacity",
  "visibility",
  "transform",
  "color",
  "background-color",
  "border-top-color",
  "font-size",
  "font-family",
  "padding-top",
  "margin-top",
  "grid-template-rows",
  "z-index",
]
const snap = (p, scope) =>
  p.evaluate(
    ([PROPS, scope]) => {
      const out = {}
      const root = document.querySelector(scope)
      if (!root) return out
      let i = 0
      for (const el of [root, ...root.querySelectorAll("*")]) {
        const cs = getComputedStyle(el)
        out[i++ + ":" + el.tagName] = PROPS.map((k) => cs.getPropertyValue(k)).join("|")
      }
      return out
    },
    [PROPS, scope],
  )
const SCENARIOS = [
  [
    "desktop",
    "/",
    "#nav",
    async (p) => {
      await p.hover(".nav-dd >> nth=1")
      await p.waitForTimeout(600)
    },
  ],
  [
    "desktop",
    "/",
    "#nav",
    async (p) => {
      await p.click(".nav-dd-split-chevron-button >> nth=0")
      await p.waitForTimeout(600)
    },
  ],
  [
    "mobile",
    "/",
    "#mobmenu",
    async (p) => {
      await p.click("#burger")
      await p.waitForTimeout(900)
    },
  ],
  [
    "mobile",
    "/",
    "#nav",
    async (p) => {
      await p.click("#burger")
      await p.waitForTimeout(900)
    },
  ],
  [
    "desktop",
    "/corporate",
    "#enquire",
    async (p) => {
      await p.click("#chips .chip >> nth=2")
      await p.waitForTimeout(500)
      await p.fill("#dateNative", "2027-06-12")
      await p.click(".wizard-next-button")
      await p.waitForTimeout(700)
    },
  ],
  [
    "desktop",
    "/corporate",
    "#enquire",
    async (p) => {
      await p.fill("#dateNative", "2027-06-12")
      await p.click(".wizard-next-button")
      await p.waitForTimeout(700)
      await p.click("#spaces .option-card >> nth=1")
      await p.waitForTimeout(300)
    },
  ],
  [
    "mobile",
    "/weddings",
    "#enquire",
    async (p) => {
      await p.click(".wizard-next-button")
      await p.waitForTimeout(600)
    },
  ],
  [
    "desktop",
    "/gallery",
    "#lightbox",
    async (p) => {
      await p.click("#ggrid .gallery-item >> nth=2")
      await p.waitForTimeout(900)
    },
  ],
  [
    "desktop",
    "/weddings",
    "#testimonials",
    async (p) => {
      await p.$eval("#testimonials", (s) => s.scrollIntoView())
      await p.waitForTimeout(800)
      await p.hover("#tNext")
      await p.waitForTimeout(400)
    },
  ],
  [
    "desktop",
    "/corporate",
    ".faq",
    async (p) => {
      await p.click(".faq-q >> nth=0")
      await p.waitForTimeout(700)
    },
  ],
  [
    "mobile",
    "/",
    "section:has(.tabs-bar)",
    async (p) => {
      await p.click('.tabs-bar [data-tab="celebrations"]')
      await p.waitForTimeout(700)
    },
  ],
  [
    "desktop",
    "/",
    "section:has(#carView)",
    async (p) => {
      await p.click("#next")
      await p.waitForTimeout(900)
    },
  ],
  [
    "desktop",
    "/weddings",
    "#availability",
    async (p) => {
      await p.click("#avail .availability-cell:not(.taken):not(.empty) >> nth=8")
      await p.waitForTimeout(500)
    },
  ],
  [
    "mobile",
    "/weddings",
    "#availModal",
    async (p) => {
      await p.click("#availChangeBtn")
      await p.waitForTimeout(700)
    },
  ],
  [
    "mobile",
    "/gallery",
    "section:has(#ggrid)",
    async (p) => {
      await p.click('label[for="gf-venue"]')
      await p.waitForTimeout(700)
    },
  ],
  [
    "mobile",
    "/weddings",
    "#wlPopover",
    async (p) => {
      await p.click("#avail .availability-cell.taken >> nth=0")
      await p.waitForTimeout(600)
    },
  ],
  [
    "mobile",
    "/",
    "#enquire",
    async (p) => {
      await p.click("#chips .chip >> nth=0")
      await p.waitForTimeout(600)
      await p.click("#availForm .availability-cell.taken >> nth=0")
      await p.waitForTimeout(600)
    },
  ],
]
const s1 = serve(process.argv[2], 4511),
  s2 = serve(process.argv[3], 4512)
const b = await chromium.launch()
for (const [dev, route, scope, act] of SCENARIOS) {
  const res = []
  for (const port of [4511, 4512]) {
    const ctx = await b.newContext({
      ...(dev === "mobile"
        ? devices["Pixel 7"]
        : { viewport: { width: 1440, height: 900 } }),
      reducedMotion: "reduce",
    })
    const p = await ctx.newPage()
    await p.goto(`http://localhost:${port}${route}`)
    await p.waitForTimeout(500)
    try {
      await act(p)
    } catch (e) {
      res.push({ error: e.message.split("\n")[0] })
      await ctx.close()
      continue
    }
    res.push(await snap(p, scope))
    await ctx.close()
  }
  const [A, B] = res
  const diffs = []
  if (!A.error && !B.error && Object.keys(A).length !== Object.keys(B).length)
    diffs.push(`element count ${Object.keys(A).length} vs ${Object.keys(B).length}`)
  if (A.error || B.error) {
    console.log(dev, route, scope, "ERROR", A.error || B.error)
    continue
  }
  for (const k of Object.keys(A))
    if (A[k] !== B[k]) {
      const a = A[k].split("|"),
        c = (B[k] || "").split("|")
      PROPS.forEach((pr, i) => {
        if (a[i] !== c[i]) diffs.push(`${k} ${pr}: ${a[i]} -> ${c[i]}`)
      })
    }
  console.log(dev, route, scope, diffs.length ? diffs.slice(0, 8) : "same")
}
await b.close()
s1.close()
s2.close()
