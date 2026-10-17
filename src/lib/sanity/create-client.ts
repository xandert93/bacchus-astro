// How every Sanity client on the site is made: the build's, the enquiry
// endpoint's and the availability endpoint's. One place for the project,
// dataset and API version, so the three can't drift apart.
import { createClient } from "@sanity/client"
import { SANITY_DATASET } from "astro:env/server"
import { SANITY_PROJECT_ID } from "@studio/lib/project"

interface ClientOptions {
  /**
   * Read through Sanity's CDN, a cache a few seconds behind the database.
   * Right for a page a visitor is waiting on; wrong for the build, which
   * should see what was published a moment ago.
   */
  useCdn?: boolean
}

export const createSanityClient = (
  token: string,
  { useCdn = false }: ClientOptions = {},
) =>
  createClient({
    projectId: SANITY_PROJECT_ID,
    // Production, unless .env says otherwise (astro.config.mjs).
    dataset: SANITY_DATASET,
    // Pinned, so a change on Sanity's side can't change what a query
    // returns without a commit here.
    apiVersion: "2025-02-19",
    // The dataset is private: without a token every query comes back empty.
    token,
    useCdn,
    // Published documents only, never an editor's unsaved draft.
    perspective: "published",
  })
