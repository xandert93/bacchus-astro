// Moving a booking to a new status the way the Studio shows it: the status
// itself, plus an entry in its status history saying who moved it and why.
// The history is append-only, and this is how the site adds to it.

import type { Patch } from "@sanity/client"

type Actor = "staff" | "payment-webhook" | "cron" | "visitor"

interface StatusChange {
  from: string
  to: string
  actor: Actor
  reason?: string
}

/** Applies a status change to a booking's patch (inside a transaction, say). */
export const changeStatus = (patch: Patch, { from, to, actor, reason }: StatusChange) =>
  patch
    .set({ status: to })
    .setIfMissing({ statusHistory: [] })
    .append("statusHistory", [
      {
        _type: "statusEvent",
        _key: crypto.randomUUID().slice(0, 12),
        from,
        to,
        at: new Date().toISOString(),
        actor,
        ...(reason ? { reason } : {}),
      },
    ])
