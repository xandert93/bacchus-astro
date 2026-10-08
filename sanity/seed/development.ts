/**
 * Fills the development dataset with seed data: every collection, as if
 * the site had been live for a year. Run from the repo root:
 *
 *   npm run sanity:seed
 *
 * (`sanity exec` runs this with your Sanity login, so it can write.)
 *
 * Safe to re-run. It removes the previous seed data and writes it again,
 * with dates moved to stay relative to today, in one transaction: either
 * everything changes or nothing does. Content copied from production (the
 * packages, stations, gallery and testimonials) is kept, apart from a few
 * empty fields it fills in (settings.ts).
 *
 * It only ever writes to the development dataset, and checks that before
 * touching anything. Fake bookings in production would land in the client's
 * inbox and show dates as booked to the public.
 */
import { getCliClient } from "sanity/cli"

import { DEVELOPMENT_DATASET } from "../lib/project"
import { bookingDocuments } from "./bookings"
import { editorialDocuments } from "./editorial"
import { isSeedId, type SeedDocument } from "./lib"
import { contentPatches, settingsDocuments } from "./settings"
import { venueDocuments } from "./venue"

const client = getCliClient({ apiVersion: "2025-02-19" }).withConfig({
  dataset: DEVELOPMENT_DATASET,
  // Drafts as well as published documents, so stale seed drafts go too.
  perspective: "raw",
})

if (client.config().dataset !== DEVELOPMENT_DATASET) {
  throw new Error(
    `Refusing to seed "${client.config().dataset}": seed data is development only.`,
  )
}

const documents: SeedDocument[] = [
  ...venueDocuments,
  ...settingsDocuments,
  ...bookingDocuments,
  ...editorialDocuments,
]

const existingIds = await client.fetch<string[]>(`*[!(_id in path("_.**"))]._id`)
const staleSeedIds = existingIds.filter(isSeedId)

const transaction = client.transaction()

// Undo the patches first: they reference seed documents (the peak season),
// and a referenced document can't be deleted.
for (const [id, fields] of contentPatches) {
  transaction.patch(id, (patch) => patch.unset(Object.keys(fields)))
}

for (const id of staleSeedIds) transaction.delete(id)

for (const document of documents) transaction.createOrReplace(document)

for (const [id, fields] of contentPatches) {
  transaction.patch(id, (patch) => patch.set(fields))
}

await transaction.commit({ visibility: "async" })

const countsByType = documents.reduce<Record<string, number>>((counts, document) => {
  counts[document._type] = (counts[document._type] ?? 0) + 1

  return counts
}, {})

console.log(`Seeded the ${DEVELOPMENT_DATASET} dataset:`)
for (const [type, count] of Object.entries(countsByType).sort()) {
  console.log(`  ${String(count).padStart(3)}  ${type}`)
}
console.log(`  ${String(contentPatches.length).padStart(3)}  copied documents filled in`)
console.log(`Removed ${staleSeedIds.length} documents from the previous seed.`)
