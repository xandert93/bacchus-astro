// The one Sanity client allowed to write: used only by the enquiry endpoint,
// which runs on Cloudflare when a visitor sends the form. Never imported by a
// page, so the token never reaches a browser or the static build.
import { createClient, type SanityClient } from "@sanity/client"
import { SANITY_API_WRITE_TOKEN, SANITY_DATASET } from "astro:env/server"
import { SANITY_PROJECT_ID } from "@studio/lib/project"

/** The client, or null when no write token is set (the endpoint then says so). */
export const getWriteClient = (): SanityClient | null =>
  SANITY_API_WRITE_TOKEN
    ? createClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: "2025-02-19",
        token: SANITY_API_WRITE_TOKEN,
        useCdn: false,
      })
    : null
