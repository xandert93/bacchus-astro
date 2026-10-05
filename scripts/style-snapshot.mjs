// Snapshot the computed styles of every element on the given pages, so a
// CSS refactor can be checked for unintended visual changes. Serves the
// current build (dist/) itself, at desktop and Pixel 7 sizes.
//
//   npm run build && node scripts/style-snapshot.mjs before.json
//   ...make the CSS change...
//   npm run build && node scripts/style-snapshot.mjs after.json
//   node scripts/style-diff.mjs before.json after.json
//
// Pages default to the four package pages; pass routes after the output
// file to snapshot others: node scripts/style-snapshot.mjs out.json / /gallery
import { chromium, devices } from "@playwright/test"
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".png": "image/png",
}
const server = http
  .createServer((req, res) => {
    let f = path.join("dist", decodeURIComponent(req.url.split("?")[0].split("#")[0]))
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html")
    if (!fs.existsSync(f)) {
      res.writeHead(404)
      return res.end()
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(f)] || "application/octet-stream",
    })
    fs.createReadStream(f).pipe(res)
  })
  .listen(4402)
const PROPS = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-transform",
  "text-align",
  "text-indent",
  "color",
  "background-color",
  "background-image",
  "border-top-width",
  "border-top-color",
  "border-left-width",
  "border-left-color",
  "border-radius",
  "opacity",
  "transform",
  "grid-template-columns",
  "gap",
  "flex-direction",
  "justify-content",
  "align-items",
  "aspect-ratio",
  "object-fit",
  "box-shadow",
  "visibility",
  "z-index",
  "overflow",
  "white-space",
  "transition",
  "animation-name",
  "filter",
  "backdrop-filter",
  "content",
]
const ROUTES =
  process.argv.length > 3
    ? process.argv.slice(3)
    : [
        "/weddings/packages/reception",
        "/weddings/packages/banquet",
        "/weddings/packages/high-tea",
        "/weddings/packages/beverage",
      ]
const b = await chromium.launch()
const out = {}
for (const [name, opts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile", devices["Pixel 7"]],
]) {
  const ctx = await b.newContext({ ...opts, reducedMotion: "reduce" })
  const p = await ctx.newPage()
  for (const r of ROUTES) {
    await p.goto("http://localhost:4402" + r, { waitUntil: "load" })
    await p.waitForTimeout(800)
    out[name + r] = await p.evaluate((PROPS) => {
      const res = {}
      const path = (el) => {
        const parts = []
        while (el && el !== document.body) {
          const i = [...el.parentElement.children].indexOf(el)
          parts.unshift(el.tagName.toLowerCase() + ":" + i)
          el = el.parentElement
        }
        return parts.join("/")
      }
      for (const el of document.body.querySelectorAll("*")) {
        if (el.closest("script,style")) continue
        const cs = getComputedStyle(el),
          o = {}
        for (const k of PROPS) o[k] = cs.getPropertyValue(k)
        for (const pe of ["::before", "::after"]) {
          const c = getComputedStyle(el, pe)
          if (c.content && c.content !== "none" && c.content !== "normal")
            for (const k of PROPS) o[pe + k] = c.getPropertyValue(k)
        }
        res[path(el) + " ." + [...el.classList].join(".")] = o
      }
      return res
    }, PROPS)
  }
  await ctx.close()
}
await b.close()
server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out))
console.log("saved", Object.keys(out).length, "page snapshots")
