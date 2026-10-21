// Everything the site does once a day on its own. Run by the Worker's daily
// trigger on the live site (src/worker.ts, through /api/jobs/daily) and by
// `npm run dev:daily-jobs` locally. Every job records what it has done as it
// goes, so running it twice in a day does nothing twice.

import type { SanityClient } from "@sanity/client"
import { runQuoteDeadlines } from "@lib/deposits/deadlines"
import { runEventFollowUps } from "@lib/reviews/follow-ups"

export const runDailyJobs = async (
  client: SanityClient,
  options: { siteOrigin: string },
) => ({
  quotes: await runQuoteDeadlines(client, options),
  events: await runEventFollowUps(client, options),
})
