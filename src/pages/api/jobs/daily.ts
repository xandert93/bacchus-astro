// POST /api/jobs/daily: runs the daily jobs (src/lib/jobs/daily.ts) and
// answers with what they did. Called by the Worker's daily trigger on the
// live site (src/worker.ts), which proves itself with a key only the Worker
// knows, and by `npm run dev:daily-jobs` on the dev server. Anyone else gets
// a 404, as if it weren't here.

import type { APIRoute } from "astro"
import { EMAIL_SITE_ORIGIN } from "astro:env/server"
import { json } from "@lib/api/requests"
import { runDailyJobs } from "@lib/jobs/daily"
import { internalJobKey, JOB_KEY_HEADER } from "@lib/jobs/internal-key"
import { getWriteClient } from "@lib/sanity/write-client"
import { constantTimeEqual } from "@lib/webhooks/hmac"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const fromTrigger = constantTimeEqual(
    request.headers.get(JOB_KEY_HEADER) ?? "",
    internalJobKey(),
  )
  if (!fromTrigger && !import.meta.env.DEV) return new Response(null, { status: 404 })

  const client = getWriteClient()
  if (!client) {
    console.error("Daily jobs not run: SANITY_API_WRITE_TOKEN is not set.")
    return new Response(null, { status: 503 })
  }

  // Links in emails point at the live site, except when trying it locally.
  const siteOrigin = import.meta.env.DEV ? new URL(request.url).origin : EMAIL_SITE_ORIGIN

  const summary = await runDailyJobs(client, { siteOrigin })
  console.log("Daily jobs:", JSON.stringify(summary))

  return json(200, summary)
}
