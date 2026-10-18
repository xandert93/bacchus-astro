// Sanity's webhooks, delivered to the local dev server. Sanity can only call
// a public address, so in development nothing would reach the API routes
// that react to the Studio (a quote sent, a deposit marked received). This
// watches the development dataset instead and, for each published change a
// webhook in definitions.ts would pick out, builds the same body with
// the same filter and projection, signs it as Sanity does and posts it to
// the dev server. The Stripe CLI's `stripe listen` does the same for Stripe.
//
//   npm run dev:webhooks              relay, beside `npm run dev`
//   npm run dev:webhooks -- --print   print the settings for sanity.io/manage

import { createHmac } from "node:crypto"
import { createClient } from "@sanity/client"
import { evaluate, parse } from "groq-js"
import { DEVELOPMENT_DATASET, SANITY_PROJECT_ID } from "../lib/project.ts"
import { SITE_WEBHOOKS } from "./definitions.ts"

const DEV_SERVER = "http://localhost:3000"

if (process.argv.includes("--print")) {
  for (const webhook of SITE_WEBHOOKS) {
    console.log(`\n${webhook.name}`)
    console.log(`  URL:        https://<site>${webhook.path}`)
    console.log(`  Filter:     ${webhook.filter}`)
    console.log(`  Projection: ${webhook.projection}`)
  }
  process.exit(0)
}

process.loadEnvFile(".env")

const secret = process.env.SANITY_WEBHOOK_SECRET
const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_READ_TOKEN

if (!secret || !token) {
  console.error("Needs SANITY_WEBHOOK_SECRET and a Sanity token in .env (.env.example).")
  process.exit(1)
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  // Never production: the live site has real webhooks of its own.
  dataset: DEVELOPMENT_DATASET,
  apiVersion: "2025-02-19",
  token,
  useCdn: false,
})

// before() and after() only exist in this "delta" mode, as in a webhook.
const compiled = SITE_WEBHOOKS.map((webhook) => ({
  ...webhook,
  filterTree: parse(webhook.filter, { mode: "delta" }),
  projectionTree: parse(webhook.projection, { mode: "delta" }),
}))

const evaluateDelta = async (
  tree: ReturnType<typeof parse>,
  before: unknown,
  after: unknown,
) => (await evaluate(tree, { root: after, before, after })).get()

const deliver = async (path: string, payload: unknown) => {
  const body = JSON.stringify(payload)
  const timestamp = String(Date.now())
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("base64url")

  const response = await fetch(DEV_SERVER + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "sanity-webhook-signature": `t=${timestamp},v1=${signature}`,
    },
    body,
  })

  return `${response.status} ${await response.text()}`
}

client
  .listen(
    '*[_type in ["booking", "quote"] && !(_id in path("drafts.**"))]',
    {},
    {
      includeResult: true,
      includePreviousRevision: true,
      visibility: "query",
      events: ["mutation"],
    },
  )
  .subscribe({
    next: async (event) => {
      // Webhooks fire on Update only: a document that existed and still does.
      if (event.type !== "mutation" || event.transition !== "update") return

      const { previous: before, result: after } = event

      for (const webhook of compiled) {
        if ((await evaluateDelta(webhook.filterTree, before, after)) !== true) continue

        const payload = await evaluateDelta(webhook.projectionTree, before, after)

        try {
          console.log(
            `${webhook.name} → ${webhook.path}: ${await deliver(webhook.path, payload)}`,
          )
        } catch {
          console.log(
            `${webhook.name}: couldn't reach ${DEV_SERVER}. Is npm run dev running?`,
          )
        }
      }
    },
    error: (error) => {
      console.error("Lost the connection to Sanity:", error.message)
      process.exit(1)
    },
  })

console.log(
  `Relaying Sanity webhooks from the ${DEVELOPMENT_DATASET} dataset to ${DEV_SERVER}.`,
)
