// Compare the rendered markup of two builds, element by element: tag,
// attributes (minus Astro's per-file scoping attributes and image URLs,
// which change with file paths and hashes) and text. For refactors that move
// markup into components or data, where the computed-style snapshot can't
// see a changed word or attribute.
//
//   node scripts/markup-diff.mjs <distA> <distB> [route ...]
import fs from "node:fs"
import path from "node:path"
import { chromium } from "@playwright/test"

const [a, b, ...routes] = process.argv.slice(2)
const pages = routes.length
  ? routes
  : [
      "/",
      "/weddings",
      "/corporate",
      "/celebrations",
      "/gallery",
      "/weddings/packages/reception",
      "/weddings/packages/banquet",
      "/weddings/packages/high-tea",
      "/weddings/packages/beverage",
    ]

const browser = await chromium.launch()
const page = await browser.newPage()
const dump = async (dist, route) => {
  const file = path.resolve(dist, `.${route}`, "index.html")
  await page.setContent(fs.readFileSync(file, "utf8"), { waitUntil: "domcontentloaded" })
  return page.evaluate(() => {
    const out = []
    const walk = (el, depth) => {
      if (["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT"].includes(el.tagName)) return
      const attrs = [...el.attributes]
        .filter(
          (x) =>
            (!x.name.startsWith("data-astro-cid") &&
              !["src", "srcset", "href"].includes(x.name)) ||
            (x.name === "href" && !/\/_astro\//.test(x.value)),
        )
        .filter((x) => !(x.name === "src" || x.name === "srcset"))
        .map((x) => {
          const v =
            x.name === "class"
              ? x.value
                  .split(/\s+/)
                  .filter((c) => !c.startsWith("astro-"))
                  .sort()
                  .join(" ")
              : x.value
          return `${x.name}="${v}"`
        })
        .sort()
        .join(" ")
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join("")
        .replace(/\s+/g, " ")
        .trim()
      out.push(`${"  ".repeat(depth)}<${el.tagName.toLowerCase()} ${attrs}>${text}`)
      for (const c of el.children) walk(c, depth + 1)
    }
    walk(document.body, 0)
    return out
  })
}
let total = 0
for (const route of pages) {
  const [x, y] = [await dump(a, route), await dump(b, route)]
  const diffs = []
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n && diffs.length < 8; i++)
    if (x[i] !== y[i]) diffs.push(`  - ${x[i]}\n  + ${y[i]}`)
  total += diffs.length
  console.log(
    `${route}: ${x.length} vs ${y.length} elements${diffs.length ? "" : ", identical"}`,
  )
  if (diffs.length) console.log(diffs.join("\n"))
}
await browser.close()
process.exit(total ? 1 : 0)
