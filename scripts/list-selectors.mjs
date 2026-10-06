// Print every selector in a file's styles, one per line, with any wrapping
// @media / @supports noted — for planning which rules move where.
//
//   node scripts/list-selectors.mjs <file.astro | file.css>
import fs from "node:fs"
import postcss from "postcss"

const file = process.argv[2]
const text = fs.readFileSync(file, "utf8")
const style = [...text.matchAll(/<style>([\s\S]*?)<\/style>/g)].pop()
const root = postcss.parse(style ? style[1] : text)
root.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes/.test(rule.parent.name)) return
  const wrappers = []
  for (let p = rule.parent; p && p.type === "atrule"; p = p.parent)
    wrappers.unshift(`@${p.name} ${p.params}`)
  const prefix = wrappers.length ? `[${wrappers.join(" ")}] ` : ""
  console.log(prefix + rule.selector.replace(/\s+/g, " "))
})
