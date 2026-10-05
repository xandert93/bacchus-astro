// Move the global.css rules that belong to one component into that
// component's scoped <style>. A rule moves only if EVERY selector in it is
// "owned" by the component: its last compound (the element being styled)
// carries a class that appears in this component's markup and nowhere else
// in the project. Compounds that aren't the component's own — an ancestor
// like `body.menu-open` or a page wrapper like `.split` — are wrapped in
// :global() so Astro's scoping leaves them alone.
//
//   node scripts/scope-styles.mjs <Component> [--dry]
//
// Always follow with a style snapshot + diff across every page; this is a
// mechanical move and the diff is what proves it changed nothing.
import fs from "node:fs"
import path from "node:path"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const [name, flag] = process.argv.slice(2)
const dry = flag === "--dry"
const SRC = "src"
const componentFile = path.join(SRC, "components", `${name}.astro`)

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    )

// Every class name a file's markup could carry: class="...", class:list
// strings, and string literals in frontmatter expressions.
// Markup only: frontmatter and comments removed, so a word in a comment
// ("one <img> per state") can't pass for markup.
function markupOf(text) {
  return text
    .replace(/^---[\s\S]*?\n---/, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}
function classesIn(text) {
  const found = new Set()
  // A class passed to a CHILD component (<SocialLinks class="menu-social">)
  // lands on the child's element, which carries the child's scoping
  // attribute, not this one's — so it doesn't count as this component's.
  const markup = markupOf(text).replace(/<[A-Z][\w.]*\b[^>]*>/g, "")
  for (const m of markup.matchAll(/class(?::list)?=(?:"([^"]*)"|\{([^}]*)\})/g)) {
    const raw = m[1] ?? m[2] ?? ""
    for (const s of raw.matchAll(/[\w-]+/g)) found.add(s[0])
  }
  return found
}
// Classes a script creates or toggles (className =, classList.add/toggle,
// el("tag", "cls")): never safe to scope, since script-made elements don't
// get Astro's attribute.
function scriptClasses(text) {
  const found = new Set()
  for (const m of text.matchAll(
    /(?:className\s*=|classList\.(?:add|toggle|remove)\(|el\(\s*"[a-z0-9]+"\s*,)\s*"([^"]+)"/g,
  ))
    for (const s of m[1].split(/\s+/)) found.add(s)
  return found
}

const files = walk(SRC)
const owners = new Map()
for (const f of files.filter((f) => f.endsWith(".astro"))) {
  for (const c of classesIn(fs.readFileSync(f, "utf8"))) {
    if (!owners.has(c)) owners.set(c, new Set())
    owners.get(c).add(path.resolve(f))
  }
}
const scripted = new Set()
for (const f of files.filter((f) => f.endsWith(".js")))
  for (const c of scriptClasses(fs.readFileSync(f, "utf8"))) scripted.add(c)
// Tags scripts write as HTML strings (innerHTML = "The <em>occasion</em>"):
// elements made that way have no scoping attribute either.
const scriptTags = new Set()
for (const f of files.filter((f) => f.endsWith(".js")))
  for (const m of fs
    .readFileSync(f, "utf8")
    .matchAll(/["'`][^"'`\n]*<([a-z][a-z0-9]*)[\s>]/g))
    scriptTags.add(m[1])

const me = path.resolve(componentFile)
const componentText = markupOf(fs.readFileSync(componentFile, "utf8"))
const mine = (cls) =>
  owners.get(cls)?.size === 1 && owners.get(cls).has(me) && !scripted.has(cls)

function convert(selector) {
  // Returns the scoped selector string, or null if this rule isn't ours.
  let ok = true
  const result = selectorParser((root) => {
    root.each((sel) => {
      // split into compounds
      const compounds = [[]]
      sel.each((node) => {
        if (node.type === "combinator") compounds.push(node, [])
        else compounds[compounds.length - 1].push(node)
      })
      const parts = compounds.filter((c) => Array.isArray(c))
      const subject = parts[parts.length - 1]
      const classesOf = (c) => c.filter((n) => n.type === "class").map((n) => n.value)
      // The styled element must be ours: either it carries one of our
      // classes, or it's a bare tag (li, svg) inside a compound that does.
      // ...and only if this component's own markup actually contains that
      // tag. An <em> a script writes into a quote has no scoping attribute,
      // so a rule for it has to stay global.
      const subjectTag = subject.find((n) => n.type === "tag")?.value
      const subjectIsBareTag =
        !classesOf(subject).length &&
        !!subjectTag &&
        new RegExp(`<${subjectTag}[\\s>/]`).test(componentText) &&
        !scriptTags.has(subjectTag)
      const ours =
        classesOf(subject).some(mine) ||
        (subjectIsBareTag && parts.slice(0, -1).some((c) => classesOf(c).some(mine)))
      if (!ours) ok = false
      // wrap any compound with no class of ours in :global()
      for (const c of parts) {
        const cls = classesOf(c)
        const hasTag = c.some((n) => n.type === "tag" || n.type === "universal")
        if (cls.some(mine)) continue
        if (!cls.length && hasTag && c !== parts[0]) continue // a bare tag inside our markup
        const text = c.map(String).join("").trim()
        const first = c[0]
        const pseudoElements = c.filter(
          (n) => n.type === "pseudo" && n.value.startsWith("::"),
        )
        const rest = c.filter((n) => !pseudoElements.includes(n))
        const wrapped = selectorParser.pseudo({ value: ":global" })
        wrapped.append(selectorParser.selector({ nodes: rest.map((n) => n.clone()) }))
        void text
        rest.forEach((n, i) => (i === 0 ? n.replaceWith(wrapped) : n.remove()))
        void first
      }
    })
  }).processSync(selector)
  return ok ? result : null
}

const globalFile = path.join(SRC, "styles", "global.css")
const root = postcss.parse(fs.readFileSync(globalFile, "utf8"))
const moved = []
root.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes/.test(rule.parent.name)) return
  // Split grouped selectors: the ones that are ours move, the rest stay.
  // Moving only whole rules left behind grouped overrides like
  // `.process-steps, .split { grid-template-columns: 1fr }` in a mobile
  // query, which then lost to the moved (now more specific) base rule.
  const pairs = rule.selectors.map((s) => [s, convert(s)])
  const ours = pairs.filter(([, scoped]) => scoped !== null)
  if (!ours.length) return
  const theirs = pairs.filter(([, scoped]) => scoped === null).map(([s]) => s)
  const clone = rule.clone({ selector: ours.map(([, s]) => s).join(", ") })
  const comments = []
  if (!theirs.length) {
    // The whole rule moves: carry the comment block immediately above.
    let prev = rule.prev()
    while (prev && prev.type === "comment") {
      comments.unshift(prev)
      prev = prev.prev()
    }
  }
  let node = clone
  let p = rule.parent
  while (p && p.type === "atrule") {
    const wrapper = p.clone({ nodes: [] })
    wrapper.append(node)
    node = wrapper
    p = p.parent
  }
  moved.push({ comments: comments.map((c) => c.clone()), node })
  if (dry) return
  if (theirs.length) {
    rule.selector = theirs.join(", ")
    return
  }
  comments.forEach((c) => c.remove())
  const parent = rule.parent
  rule.remove()
  if (parent.type === "atrule" && !parent.nodes.some((n) => n.type !== "comment"))
    parent.remove()
})

const css = moved
  .map(({ comments, node }) => [...comments.map(String), node.toString()].join("\n"))
  .join("\n")
console.log(`${name}: ${moved.length} rules`)
if (dry) {
  console.log(css)
  process.exit(0)
}
fs.writeFileSync(globalFile, root.toString())
const comp = fs.readFileSync(componentFile, "utf8").trimEnd()
const indented = css
  .split("\n")
  .map((l) => (l.trim() ? "  " + l : l))
  .join("\n")
const block = comp.includes("<style>")
  ? comp.replace(/<\/style>\s*$/, `${indented}\n</style>\n`)
  : `${comp}\n\n<style>\n  /* Scoped to this component (moved from global.css by\n     scripts/scope-styles.mjs). See FaqSection.astro for how scoping works. */\n${indented}\n</style>\n`
fs.writeFileSync(componentFile, block)
