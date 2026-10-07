// Draft pages: unfinished pages that live on main but never reach the live
// site. An Astro integration is a plugin that runs while Astro sets up a
// build or the dev server; this one adds the drafts' routes only when drafts
// are wanted:
//   - always in `astro dev`;
//   - in a build with INCLUDE_DRAFTS=true (the Playwright test build);
//   - in Cloudflare's preview builds, for any branch but main;
//   - never in a plain `astro build`, or Cloudflare's build of main, which is
//     what the live site runs.
// The pages themselves sit in src/drafts/, outside src/pages/, so nothing
// else can build them. See docs/architecture/structure.md, "Draft pages".
import type { AstroIntegration } from "astro"
import { DRAFT_PAGES, SANDBOXES_INDEX } from "../drafts/registry"

const DRAFT_ROUTES = [SANDBOXES_INDEX, ...DRAFT_PAGES]

// The branch Cloudflare puts live. Every other branch it builds is a preview.
const PRODUCTION_BRANCH = "main"

// Cloudflare's Workers Builds sets WORKERS_CI_BRANCH on every build it runs.
// Its dashboard has one set of build variables for every branch (its Preview
// settings are runtime variables for the Worker, which a static build never
// reads), so INCLUDE_DRAFTS can't be set there for previews alone; the branch
// name is what tells them apart.
const isCloudflarePreviewBuild = () => {
  const branch = process.env.WORKERS_CI_BRANCH

  return Boolean(branch) && branch !== PRODUCTION_BRANCH
}

// "/secure-booking" and the build's "secure-booking/" name the same page.
const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "")

export const draftPages = (): AstroIntegration => {
  let includeDrafts = false

  return {
    name: "bacchus:draft-pages",
    hooks: {
      "astro:config:setup": ({ command, injectRoute, updateConfig, logger }) => {
        includeDrafts =
          command === "dev" ||
          process.env.INCLUDE_DRAFTS === "true" ||
          isCloudflarePreviewBuild()

        // Lets components ask whether drafts are in this build, through
        // import.meta.env.DRAFTS_INCLUDED (the footer's Sandboxes link).
        updateConfig({
          vite: {
            define: { "import.meta.env.DRAFTS_INCLUDED": JSON.stringify(includeDrafts) },
          },
        })

        if (!includeDrafts) {
          logger.info("Draft pages left out of this build.")
          return
        }

        DRAFT_ROUTES.forEach((draft) => {
          injectRoute({ pattern: draft.href, entrypoint: draft.entrypoint })
        })
        logger.info(`Draft pages included: ${DRAFT_ROUTES.length} routes.`)
      },

      // A safety net for the live build: if a draft's route was built anyway
      // (say its page was copied into src/pages/), stop the build rather
      // than publish it.
      "astro:build:done": ({ pages }) => {
        if (includeDrafts) return

        const draftPaths = new Set(DRAFT_ROUTES.map((draft) => trimSlashes(draft.href)))
        const leaked = pages.filter((page) => draftPaths.has(trimSlashes(page.pathname)))

        if (leaked.length) {
          const names = leaked.map((page) => `/${trimSlashes(page.pathname)}`).join(", ")
          throw new Error(`Draft pages were built into the live site: ${names}`)
        }
      },
    },
  }
}
