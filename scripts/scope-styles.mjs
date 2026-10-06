// Move global.css rules into the file that owns them.
//
//   node scripts/scope-styles.mjs <target> [--select <regex>] [--from <source>]
//                                 [--keep] [--dry]
//
// <target> is a component name ("SiteHeader" -> src/components/layout/SiteHeader.astro),
// a path under src/ for a page ("pages/index"), or a stylesheet
// ("styles/tabs.css").
//
// Which rules move:
//   • With --select, every selector matching the regex (grouped selectors are
//     split: matching ones move, the rest stay).
//   • Without it, selectors whose styled element carries a class that appears
//     in the target's markup and in no other file's.
//
// --from takes rules out of another file's <style> instead of global.css
// (same naming as <target>) — for when markup moves into a child component
// and its rules have to follow it. Compounds already wrapped in :global()
// are left as they are.
//
// --keep copies instead of moving, leaving global.css untouched: for a rule
// two components both need (copy into the first with --keep, then move into
// the second).
//
// How a moved selector is rewritten for an .astro target: each compound
// (".nav-dd.is-open", "li", "body.menu-open") stays scoped only if the
// element it matches is rendered by the target's OWN markup — it has a class
// or id written there, or it's a bare tag written there that no child
// component and no script also renders. Every other compound is wrapped in
// :global(), because the element it matches never gets this file's scoping
// attribute: it belongs to an ancestor (body, a page wrapper), to a child
// component, or is created by a script. A .css target is plain global CSS,
// imported only where it's needed, so nothing is wrapped.
//
// Always follow with a style snapshot + diff and the state diff; this is a
// mechanical move and the diffs are what prove it changed nothing.
import fs from "node:fs"
import path from "node:path"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const args = process.argv.slice(2)
const name = args[0]
const dry = args.includes("--dry")
const keep = args.includes("--keep")
const selectIndex = args.indexOf("--select")
const select = selectIndex > -1 ? new RegExp(args[selectIndex + 1]) : null
const fromIndex = args.indexOf("--from")
const SRC = "src"
// A bare component name is looked up in any folder under src/components/.
const findComponent = (n) => {
  const hit = fs
    .readdirSync(path.join(SRC, "components"), { recursive: true })
    .find((f) => path.basename(String(f)) === `${n}.astro`)
  if (!hit) throw new Error(`No component called ${n}`)
  return path.join(SRC, "components", String(hit))
}
const fileFor = (n) =>
  n.endsWith(".css")
    ? path.join(SRC, n)
    : n.includes("/")
      ? path.join(SRC, `${n}.astro`)
      : findComponent(n)
const targetFile = fileFor(name)
const sourceFile = fromIndex > -1 ? fileFor(args[fromIndex + 1]) : null
const cssTarget = targetFile.endsWith(".css")

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    )
const files = walk(SRC)

// Markup only: frontmatter and comments removed, so a word in a comment
// ("one <img> per state") can't pass for markup.
const markupOf = (text) =>
  text
    .replace(/^---[\s\S]*?\n---/, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
// Classes and ids written on this file's own elements. A class passed to a
// CHILD component (<SocialLinks class="menu-social">) lands on the child's
// element, which carries the child's scoping attribute, so it doesn't count.
const ownMarkup = (text) => markupOf(text).replace(/<[A-Z][\w.]*\b[^>]*>/g, "")
const tokensIn = (markup, attr) => {
  const found = new Set()
  const re = new RegExp(`${attr}(?::list)?=(?:"([^"]*)"|\\{([^}]*)\\})`, "g")
  for (const m of markup.matchAll(re))
    for (const s of (m[1] ?? m[2] ?? "").matchAll(/[\w-]+/g)) found.add(s[0])
  return found
}
const tagsIn = (markup) =>
  new Set([...markup.matchAll(/<([a-z][a-z0-9]*)[\s>/]/g)].map((m) => m[1]))

// Elements scripts CREATE (createElement + className, innerHTML strings,
// el("tag", "cls")) have no scoping attribute. Classes merely toggled with
// classList on existing elements are fine and aren't listed here.
const created = new Set()
const scriptTags = new Set()
for (const f of files.filter((f) => f.endsWith(".js"))) {
  const text = fs.readFileSync(f, "utf8")
  for (const m of text.matchAll(/(?:className\s*=|el\(\s*"[a-z0-9]+"\s*,)\s*"([^"]+)"/g))
    m[1].split(/\s+/).forEach((c) => created.add(c))
  for (const m of text.matchAll(/["'`][^"'`\n]*<([a-z][a-z0-9]*)[^"'`\n]*["'`]/g)) {
    scriptTags.add(m[1])
    for (const c of m[0].matchAll(/class="([^"]+)"/g))
      c[1].split(/\s+/).forEach((x) => created.add(x))
  }
}

// Tags rendered by the child components a file uses, recursively.
const childTags = (file, seen = new Set()) => {
  const out = new Set()
  const text = fs.readFileSync(file, "utf8")
  for (const m of text.matchAll(/import (\w+) from "([^"]+\.astro)"/g)) {
    const child = path.resolve(path.dirname(file), m[2])
    if (seen.has(child) || !fs.existsSync(child)) continue
    seen.add(child)
    const childText = fs.readFileSync(child, "utf8")
    tagsIn(markupOf(childText)).forEach((t) => out.add(t))
    childTags(child, seen).forEach((t) => out.add(t))
  }
  return out
}

let localClasses = new Set()
let localIds = new Set()
let localTags = new Set()
if (!cssTarget) {
  const own = ownMarkup(fs.readFileSync(targetFile, "utf8"))
  localClasses = tokensIn(own, "class")
  localIds = tokensIn(own, "id")
  const children = childTags(targetFile)
  localTags = new Set(
    [...tagsIn(own)].filter(
      (t) => !children.has(t) && !scriptTags.has(t) && !["html", "body"].includes(t),
    ),
  )
}

// Default selection: the styled element's class is in this file's markup
// and nobody else's.
const owners = new Map()
for (const f of files.filter((f) => f.endsWith(".astro")))
  for (const c of tokensIn(ownMarkup(fs.readFileSync(f, "utf8")), "class")) {
    if (!owners.has(c)) owners.set(c, new Set())
    owners.get(c).add(path.resolve(f))
  }
const me = path.resolve(targetFile)
const uniquelyMine = (c) =>
  owners.get(c)?.size === 1 && owners.get(c).has(me) && !created.has(c)

const compoundsOf = (sel) => {
  const parts = [[]]
  sel.each((node) => {
    if (node.type === "combinator") parts.push([])
    else parts[parts.length - 1].push(node)
  })
  return parts
}
const classesOf = (c) => c.filter((n) => n.type === "class").map((n) => n.value)
const idsOf = (c) => c.filter((n) => n.type === "id").map((n) => n.value)

const isLocal = (compound) => {
  if (compound.some((n) => n.type === "pseudo" && n.value === ":global")) return true
  const cls = classesOf(compound)
  if (cls.some((c) => localClasses.has(c) && !created.has(c))) return true
  if (idsOf(compound).some((i) => localIds.has(i))) return true
  if (cls.length || idsOf(compound).length) return false
  const tag = compound.find((n) => n.type === "tag")?.value
  return !!tag && localTags.has(tag)
}

const selected = (selector) => {
  if (select) return select.test(selector)
  let ok = false
  selectorParser((root) => {
    root.each((sel) => {
      const parts = compoundsOf(sel)
      ok = classesOf(parts[parts.length - 1]).some(uniquelyMine)
    })
  }).processSync(selector)
  return ok
}

const convert = (selector) => {
  if (cssTarget) return selector
  return selectorParser((root) => {
    root.each((sel) => {
      for (const c of compoundsOf(sel)) {
        if (isLocal(c)) continue
        // :global(.x)::before — a pseudo-element has to stay outside.
        const pseudoElements = c.filter(
          (n) => n.type === "pseudo" && n.value.startsWith("::"),
        )
        const rest = c.filter((n) => !pseudoElements.includes(n))
        if (!rest.length) continue
        const wrapped = selectorParser.pseudo({ value: ":global" })
        wrapped.append(selectorParser.selector({ nodes: rest.map((n) => n.clone()) }))
        rest.forEach((n, i) => (i === 0 ? n.replaceWith(wrapped) : n.remove()))
      }
    })
  }).processSync(selector)
}

// The source: global.css, or the last <style> block of --from's file.
const globalFile = sourceFile ?? path.join(SRC, "styles", "global.css")
const sourceText = fs.readFileSync(globalFile, "utf8")
const styleMatch = sourceFile
  ? [...sourceText.matchAll(/<style>([\s\S]*?)<\/style>/g)].pop()
  : null
const root = postcss.parse(styleMatch ? styleMatch[1] : sourceText)
const moved = []
root.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes/.test(rule.parent.name)) return
  const ours = rule.selectors.filter(selected)
  if (!ours.length) return
  const theirs = rule.selectors.filter((s) => !ours.includes(s))
  const clone = rule.clone({ selector: ours.map(convert).join(",\n") })
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
  if (dry || keep) return
  if (theirs.length) {
    rule.selector = theirs.join(",\n")
    return
  }
  comments.forEach((c) => c.remove())
  let parent = rule.parent
  rule.remove()
  while (parent.type === "atrule" && !parent.nodes.some((n) => n.type !== "comment")) {
    const up = parent.parent
    parent.remove()
    parent = up
  }
})

const css = moved
  .map(({ comments, node }) => [...comments.map(String), node.toString()].join("\n"))
  .join("\n")
console.log(`${name}: ${moved.length} rules`)
if (dry) {
  console.log(css)
  process.exit(0)
}
if (!moved.length) process.exit(0)
if (!keep)
  fs.writeFileSync(
    globalFile,
    styleMatch
      ? sourceText.slice(0, styleMatch.index) +
          `<style>${root.toString()}</style>` +
          sourceText.slice(styleMatch.index + styleMatch[0].length)
      : root.toString(),
  )
if (cssTarget) {
  const existing = fs.existsSync(targetFile)
    ? fs.readFileSync(targetFile, "utf8").trimEnd() + "\n\n"
    : ""
  fs.writeFileSync(targetFile, existing + css + "\n")
} else {
  const comp = fs.readFileSync(targetFile, "utf8").trimEnd()
  const indented = css
    .split("\n")
    .map((l) => (l.trim() ? "  " + l : l))
    .join("\n")
  // Append to the file's own (last, non-global) <style>, or start one.
  const styleOpen = /<style>(?![\s\S]*<style>)/
  const block =
    styleOpen.test(comp) && /<\/style>\s*$/.test(comp)
      ? comp.replace(/<\/style>\s*$/, `${indented}\n</style>\n`)
      : `${comp}\n\n<style>\n  /* Scoped to this file (moved from global.css by\n     scripts/scope-styles.mjs). See FaqAccordion.astro for how scoping works. */\n${indented}\n</style>\n`
  fs.writeFileSync(targetFile, block)
}
