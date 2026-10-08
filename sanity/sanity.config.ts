import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"

import { schemaTypes, singletonTypes } from "./schemaTypes"
import { structure } from "./structure"

const requireEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `${name} is not set. Copy sanity/.env.example to sanity/.env.local and fill it in — see docs/planning/sanity-rollout.md, step 1.`,
    )
  }

  return value
}

/**
 * Studio configuration.
 *
 * `SANITY_STUDIO_PROJECT_ID` has no default and throws when missing, rather
 * than falling back to a placeholder. A placeholder would let the Studio start
 * and then fail confusingly against a project that does not exist; this fails
 * immediately and says which variable to set. Copy `.env.example` to
 * `.env.local` once the project exists.
 *
 *   DATASET VISIBILITY: private, decided. Every booking and waitlist entry
 *   here holds personal data, and a public dataset answers any query without
 *   a token. The site reads through a server-side token instead. (Region is
 *   not a choice: Sanity stores every dataset in the EU, in Belgium.)
 *
 *   ROLES: staff reading enquiry documents are processing personal data.
 *   Assign least-privilege roles rather than making everyone an administrator.
 *
 * `visionTool` is the GROQ playground. Useful while wiring the Astro queries;
 * consider dropping it from the production build, since it will happily run
 * any query against live enquiry data for anyone who can open the Studio.
 */
export default defineConfig({
  name: "bacchus",
  title: "Bacchus",

  projectId: requireEnv("SANITY_STUDIO_PROJECT_ID"),
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",

  plugins: [structureTool({ structure }), visionTool()],

  schema: {
    types: schemaTypes,

    // Singletons should not be creatable from the global "new document" menu —
    // there is one site settings document and one policy document, and a
    // second of either is a silent source of "why did my edit not show up".
    templates: (prev) => prev.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Same reasoning from the other direction: hide create and delete on the
    // singletons so the one document cannot be removed by accident.
    actions: (prev, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? prev.filter(({ action }) => action !== "duplicate" && action !== "delete")
        : prev,
  },
})
