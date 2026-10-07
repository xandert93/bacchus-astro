import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

// Checks on the source files themselves, for mistakes that only one tool
// trips over, so no page test would catch them.

const astroFiles = readdirSync("src", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".astro"))
  .map((file) => path.join("src", file))

// The dev server finds a component's scripts by searching its source for
// "<script" as plain text, comments included (known-bugs.md, 2). A script tag
// MENTIONED in a comment is read as the start of a real one, the prose after
// it fails to parse as JavaScript, and `npm run dev` prints a parse error.
// The build doesn't do this search, so every other check passes.
test("no .astro file mentions a script tag outside a real one", () => {
  // Real script elements always open their own line; take them out, and any
  // "<script" left over is a mention inside a comment or text.
  const realScriptElement = /^[ \t]*<script\b[^>]*>[\s\S]*?<\/script>/gm

  const filesWithMentions = astroFiles.filter((file) => {
    const source = readFileSync(file, "utf8").replace(realScriptElement, "")
    return source.includes("<script")
  })

  expect(filesWithMentions).toEqual([])
})
