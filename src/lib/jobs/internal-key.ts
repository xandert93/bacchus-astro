// A secret only this Worker knows, so /api/jobs/daily can tell the daily
// trigger (src/worker.ts) from a request off the internet. Made on first
// use, because a Worker may not create random values while it starts up.
// Every running copy of the Worker has its own, which is fine: the trigger
// and the route it calls always run in the same copy.

/** The header the trigger sends it in. */
export const JOB_KEY_HEADER = "x-bacchus-job-key"

let key: string | undefined

export const internalJobKey = () => (key ??= crypto.randomUUID())
