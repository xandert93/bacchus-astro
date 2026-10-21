// The site's pages are the project's own `docs/` folder, read as it is: one
// set of documents, which GitHub shows as markdown and this site shows as a
// documentation site, so nothing is written twice. Each document's first
// "# heading" becomes its page title (Starlight needs one, and the documents
// carry no frontmatter), and docs/README.md becomes the home page.

import { readdir, readFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { defineCollection } from "astro:content"
import type { Loader } from "astro/loaders"
import { docsSchema } from "@astrojs/starlight/schema"

const DOCS_FOLDER = fileURLToPath(new URL("../../docs", import.meta.url))

/** Every .md file under a folder, at any depth. */
const markdownFiles = async (folder: string): Promise<string[]> => {
  const entries = await readdir(folder, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(folder, entry.name)
      if (entry.isDirectory()) return markdownFiles(path)
      return entry.name.endsWith(".md") ? [path] : []
    }),
  )

  return nested.flat()
}

const projectDocs = (): Loader => ({
  name: "project-docs",
  load: async ({ store, parseData, renderMarkdown, watcher }) => {
    store.clear()

    for (const filePath of await markdownFiles(DOCS_FOLDER)) {
      const text = await readFile(filePath, "utf-8")
      const heading = text.match(/^# (.+)$/m)
      // The heading becomes the title, so it's taken out of the body rather
      // than shown twice.
      const body = heading ? text.replace(heading[0], "") : text
      const path = relative(DOCS_FOLDER, filePath)
        .split(sep)
        .join("/")
        .replace(/\.md$/, "")
      const id = path === "README" ? "index" : path.toLowerCase()

      store.set({
        id,
        data: await parseData({ id, data: { title: heading?.[1] ?? path } }),
        body,
        rendered: await renderMarkdown(body),
        filePath: relative(fileURLToPath(new URL("..", import.meta.url)), filePath),
      })
    }

    // Edits to the documents show up without restarting the docs site.
    watcher?.add(DOCS_FOLDER)
  },
})

export const collections = {
  docs: defineCollection({ loader: projectDocs(), schema: docsSchema() }),
}
