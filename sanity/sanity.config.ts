import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"

import { schemaTypes, singletonTypes } from "./schemaTypes"
import { structure } from "./structure"

/**
 * Studio configuration. Not yet connected to a real project.
 *
 * `projectId` is a placeholder — these schemas are designed ahead of the
 * production stack being opened, so no Sanity project or dataset has been
 * created. Two decisions to make at the point one is:
 *
 *   DATASET REGION: choose EU. Every booking, waitlist entry and testimonial
 *   here holds the personal data of (largely) EU residents, and the default
 *   region is US. Moving a dataset afterwards is an export and re-import, so
 *   this is worth getting right once rather than discovering later.
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

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "REPLACE_ME",
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
