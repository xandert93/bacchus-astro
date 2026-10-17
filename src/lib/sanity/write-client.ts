// The one Sanity client allowed to write: used only by the enquiry endpoint,
// which runs on Cloudflare when a visitor sends the form. Never imported by a
// page, so the token never reaches a browser or the static build.
import type { SanityClient } from "@sanity/client"
import { SANITY_API_WRITE_TOKEN } from "astro:env/server"
import { createSanityClient } from "./create-client"

/** The client, or null when no write token is set (the endpoint then says so). */
export const getWriteClient = (): SanityClient | null =>
  SANITY_API_WRITE_TOKEN ? createSanityClient(SANITY_API_WRITE_TOKEN) : null
