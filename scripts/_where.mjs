import fs from "node:fs"
import path from "node:path"
const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const map = new Map()
for (const f of walk("src").filter((f) => f.endsWith(".astro"))) {
  const t = fs.readFileSync(f, "utf8").replace(/<style[\s\S]*?<\/style>/g, "")
  const name = path.relative("src", f).split(path.sep).join("/").replace(/\.astro$/, "")
  for (const m of t.matchAll(/class(?::list)?=(?:"([^"]*)"|\{([^}]*)\})/g))
    for (const c of (m[1] ?? m[2]).match(/[\w-]+/g) || []) {
      if (!map.has(c)) map.set(c, new Set())
      map.get(c).add(name)
    }
}
for (const c of process.argv.slice(2)) console.log(c.padEnd(20), [...(map.get(c) || ["-"])].join(" "))
