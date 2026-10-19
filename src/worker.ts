// The Worker's entry point (wrangler.jsonc, "main"): Astro's own handler for
// every request, plus `scheduled`, which Cloudflare calls on the timetable in
// wrangler.jsonc's "triggers". The daily run is handed to /api/jobs/daily
// through that same handler, so the jobs run exactly as a request would,
// with the same settings and secrets, and can be tried on the dev server.

import { handle } from "@astrojs/cloudflare/handler"
import { internalJobKey, JOB_KEY_HEADER } from "@lib/jobs/internal-key"

type WorkerEnv = Parameters<typeof handle>[1]
type WorkerContext = Parameters<typeof handle>[2]

export default {
  fetch: handle,

  scheduled: (_controller: unknown, env: WorkerEnv, context: WorkerContext) => {
    // Only the path matters: the request never leaves the Worker.
    const request = new Request("https://worker.internal/api/jobs/daily", {
      method: "POST",
      headers: { [JOB_KEY_HEADER]: internalJobKey() },
    })

    context.waitUntil(
      handle(request, env, context).then((response) => {
        if (!response.ok) console.error(`Daily jobs failed: ${response.status}.`)
      }),
    )
  },
}
