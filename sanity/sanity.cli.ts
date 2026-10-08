import { defineCliConfig } from "sanity/cli"

import { SANITY_DATASET, SANITY_PROJECT_ID } from "./lib/project"

/**
 * Configuration for the `sanity` CLI, as opposed to the Studio itself.
 *
 * Two config files is not duplication, and the first build failed for exactly
 * this reason (`No CLI config found`). `sanity.config.ts` describes the Studio
 * a person uses — its schema, its sidebar, its plugins. This file describes
 * what the command line needs to know before any of that exists: which project
 * and dataset to act on when importing documents, deploying the Studio or
 * validating a schema.
 *
 * Both read the project from `lib/project.ts`, so there is still one source
 * of truth for it.
 *
 * `autoUpdates` is off deliberately. Left on, Sanity serves the deployed
 * Studio a newer version of itself than the one that was built and tested
 * here, which means the Studio staff use could change without anything in this
 * repository changing. Upgrades should be a commit, like every other
 * dependency bump.
 */
export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
  },
  deployment: {
    autoUpdates: false,
  },
})
