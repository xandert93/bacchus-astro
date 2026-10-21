// The project's documentation as a browsable site: sidebar, search and
// code blocks, like the React or Redux docs. Its pages are the repo's own
// `docs/` folder (src/content.config.ts), so this folder holds only the
// site around them. Run it with `npm run docs` from the repo root, at
// http://localhost:4400. Private for now: it's never deployed.
// docs/README.md explains the folders the sidebar follows.

import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

const section = (label, directory) => ({
  label,
  items: [{ autogenerate: { directory } }],
})

export default defineConfig({
  integrations: [
    starlight({
      title: "Bacchus: how it works",
      sidebar: [
        { label: "Start here", items: [{ label: "The docs, by folder", slug: "index" }] },
        section("Architecture", "architecture"),
        section("Planning", "planning"),
        section("Design", "design"),
        section("Engineering", "engineering"),
        section("Content", "content"),
        section("Operations", "operations"),
        section("Handover", "handover"),
      ],
    }),
  ],
})
