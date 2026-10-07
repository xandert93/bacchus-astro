// Draft pages: unfinished pages that live on main but never reach the live
// site. An Astro integration is a plugin that runs while Astro sets up a
// build or the dev server; this one adds the drafts' routes only when drafts
// are wanted:
//   - always in `astro dev`;
//   - in a build with INCLUDE_DRAFTS=true (the Playwright test build, and
//     Cloudflare's branch previews, which set it under "Previews Base");
//   - never in a plain `astro build`, which is what the live site runs.
// The pages themselves sit in src/drafts/, outside src/pages/, so nothing
// else can build them. See docs/architecture/structure.md, "Draft pages".
import type { AstroIntegration } from "astro"
import { DRAFT_PAGES, SANDBOXES_INDEX } from "../drafts/registry"

const DRAFT_ROUTES = [SANDBOXES_INDEX, ...DRAFT_PAGES]

// "/secure-booking" and the build's "secure-booking/" name the same page.
const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "")

export const draftPages = (): AstroIntegration => {
  let includeDrafts = false

  return {
    name: "bacchus:draft-pages",
    hooks: {
      "astro:config:setup": ({ command, injectRoute, updateConfig, logger }) => {
        includeDrafts = command === "dev" || process.env.INCLUDE_DRAFTS === "true"

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
