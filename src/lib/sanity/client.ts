// The one Sanity client the site uses. Only page and component frontmatter
// calls it, and frontmatter runs during the build (or on the dev server),
// never in a visitor's browser, so neither this module nor the token is
// ever sent to one. The content is baked into the HTML; publishing in the
// Studio triggers a rebuild (docs/planning/sanity-rollout.md, step 3).
import { createClient } from "@sanity/client"
import { SANITY_API_READ_TOKEN, SANITY_DATASET } from "astro:env/server"
import { SANITY_PROJECT_ID } from "@studio/lib/project"

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  // Production, unless .env says otherwise (astro.config.mjs).
  dataset: SANITY_DATASET,
  // Pinned, so a change on Sanity's side can't change what a query returns
  // without a commit here.
  apiVersion: "2025-02-19",
  // The dataset is private: without a token every query comes back empty.
  token: SANITY_API_READ_TOKEN,
  // Straight from the database, not the CDN's cache: a build should see what
  // was published a moment ago, and it only makes a handful of requests.
  useCdn: false,
  // Published documents only, never an editor's unsaved draft.
  perspective: "published",
})

// Runs a query and refuses an empty answer. A missing document would
// otherwise build a page with a hole in it and deploy it; failing the build
// keeps the last good version live instead.
export const fetchContent = async <Result>(
  description: string,
  query: string,
  params: Record<string, unknown> = {},
): Promise<Result> => {
  const result = await client.fetch<Result | null>(query, params)

  if (result === null || (Array.isArray(result) && result.length === 0)) {
    throw new Error(`Sanity returned no ${description}. Is it published?`)
  }

  return result
}
