// A read-only Sanity client for code that runs when a visitor arrives (the
// availability endpoint), as opposed to the build's (client.ts). Reads through
// Sanity's CDN: a visitor is waiting, and a few seconds behind is fine.
//
// On Cloudflare the read token is a Worker secret as well as a build
// variable (docs/planning/sanity-rollout.md, step 5).
import type { SanityClient } from "@sanity/client"
import { SANITY_API_READ_TOKEN } from "astro:env/server"
import { createSanityClient } from "./create-client"

/** The client, or null when the Worker has no read token. */
export const getLiveClient = (): SanityClient | null =>
  SANITY_API_READ_TOKEN
    ? createSanityClient(SANITY_API_READ_TOKEN, { useCdn: true })
    : null
