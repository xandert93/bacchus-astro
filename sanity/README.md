# Bacchus — Sanity schemas

How the content model works, and why it is shaped the way it is.

**Nothing here is connected to a live Sanity project yet** — no project ID, no
dataset, and `sanity` is not installed, so none of it has been typechecked or
loaded into a Studio. The steps to change that, in order, are
`docs/planning/sanity-rollout.md`; this file is only the model itself.

Authored for Sanity v6 (`defineType` / `defineField`, TypeScript).

**The Studio is its own npm package**, with its own `package.json`,
`tsconfig.json` and `node_modules` here in `sanity/`. It is not part of the
Astro site's dependency tree, and that is deliberate: Sanity v6 requires React
19, React DOM and styled-components, and the Astro site ships no framework
JavaScript at all. Pulling React in to serve an admin tool the public never
loads would undo that for nothing.

So the two halves stay apart. The Studio is developed and deployed on its own
(`sanity deploy` publishes it to a Sanity-hosted URL), and the Astro site will
only ever need `@sanity/client` to read content. The root `tsconfig.json`
therefore keeps excluding `sanity/` — this package typechecks itself with
`npm run sanity:check`.

---

## What's here

```
sanity/
  sanity.config.ts          Studio config skeleton (placeholder project ID)
  structure.ts              Studio sidebar, grouped by task not by type
  lib/constants.ts          Shared option lists, matched to the existing markup
  schemaTypes/
    index.ts                Registry, and the list of what is deliberately absent
    shared/                 provenance, price, seasons, SEO, catalogue variance
    bookings/               enquiries, the waitlist, consent, status history
    quotes/                 quotes, their line items, payments
    packages/               the four packages, tiers, dishes, stations
    venue/                  spaces, closures, add-ons, capacity
    editorial/              gallery, testimonials, articles, FAQs, suppliers
    restaurant/             parked until the events side is finished
    settings/               site settings and wedding policy
  queries/
    availability.ts         The calendar, derived — replaces seededStatus()
    pricing.ts              Resolving a price for a date, through seasons
    content.ts              Queries the site doesn't use yet, plus the open-questions list
```

Files are grouped by feature, because that is how they are navigated when
maintaining them. The `.document.ts` and `.object.ts` suffixes keep the
distinction the old `objects/` and `documents/` folders carried, and it
matters: a **document** is a top-level thing staff create and edit in the
sidebar, an **object** only ever exists nested inside one and never appears on
its own.

---

## The three ideas worth understanding before editing anything

### 1. Provenance is a first-class field, not a comment

`objects/provenance.ts` is attached to prices, capacities, space names, FAQs
and policy numbers. It records where a fact came from and whether Bacchus has
confirmed it — `confirmed`, `unconfirmed`, `contested` or `placeholder`.

The site already encodes this distinction visually in three separate places:
`.package-menu-note` (bronze, confirmed catalogue copy) versus
`.package-menu-note-warning` (oxblood, unconfirmed), the "illustrative only"
labels on the availability calendar, and the deposit page's warning box. Today
each of those is hand-written into the HTML across eleven pages, so nothing in
the markup knows _why_ a disclaimer is there — which means nothing can remove
it when the fact is finally signed off, and nothing stops a confirmed fact from
keeping a stale warning.

With provenance in the data, the disclaimer becomes a function of the fact. It
also gives the two consumers that must not guess a single field to filter on:
the FAQ assistant (confirmed only) and the quote generator (nothing contested).

Two `contested` records are live right now, and the project's standing decision
is **not** to resolve either by picking a side:

- **Banquet pricing** — €65/€85/€95 in the client quote, "around €135 per
  person" in client correspondence.
- **Deposit terms** — 30% non-refundable with 70% due 14 days out per the
  catalogue; "quite flexible" per correspondence, without reaffirming the split.

### 2. Derive availability, snapshot money

These look like the same problem and need opposite answers.

**There is no `availability` document.** The calendar's three states are
computed from booking records at query time. A stored calendar is one a human
keeps in sync by hand, and it will be wrong.

**A quote stores every number it was sent with**, including the ones that look
derivable (`perPersonAmount`, `vatAmount`, `depositAmount`). Bacchus's pricing
is generated internally and varies by season, so a quote that recomputed itself
would silently change after it was sent. Worse, the one real client quote we
have _does not reconcile_ — its excl.-VAT subtotal, stated VAT and incl.-VAT
total don't add up to each other — so a total cannot be assumed recomputable
from its parts at all.

Do the arithmetic in integer cents in the serverless function. Never add these
numbers as floats, and never regenerate a sent quote from current prices.

### 3. The schema is built to prevent failures the project has already had

Not hypothetical ones. Each of these is a real bug or a real near-miss:

| Guard                               | What it prevents                                                                                                                                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `price.unit` is required            | The catalogue's corkage figure had to be withheld entirely because its source never said whether €6.50 was per bottle or per person. A price that can't name its unit can't be entered.                                                                               |
| `lightboxDetail` is **not** a field | Station details currently live in up to 4 places per card, and the card set is rendered **twice** in one file — 32 instances for 16 stations. A wording fix caught one occurrence of two and looked like it had worked. The caption is composed in the query instead. |
| `weddingPackage.dietaryMarking`     | High Tea's source carries no (V) marks at all. Badges and the foot-of-page legend must be suppressed and restored _together_, and markers must never be inferred from dish names.                                                                                     |
| `capacity.basis` is required        | "Up to 120 seated" (placeholder) vs 50–800 standing (confirmed) aren't comparable. A figure without its basis reads as authoritative.                                                                                                                                 |
| `alt` required on every image       | The gallery and lightbox are pages whose entire content is images.                                                                                                                                                                                                    |
| Two separate consent booleans       | A reviewer may agree to their name being used and not their photograph.                                                                                                                                                                                               |
| `addOn.isIncludedAtNoCharge`        | Catering furniture, basic decoration and the in-house coordinator are included free. Modelling them as €0 items risks them acquiring a priced quote line.                                                                                                             |

### 4. Normalised where it pays, snapshotted where it must not change

A dish is its own document, referenced from every menu it appears on. The
measurement behind that: across the proofed Reception, Banquet and High Tea
pages, 187 menu lines resolve to 130 distinct dishes — 57 duplicates, nearly a
third — and "Brie & Candied Walnuts Leaves" appears six times across two
packages. Inline, a spelling correction has to be made once per occurrence and
a missed one is invisible, which is exactly the failure already on record from
the stations page. It also makes the list of copy changes awaiting the
client's approval one flat query instead of a traversal through every tier.

Station items stay inline, on the same evidence read the other way: they are
ingredients rather than dishes, and only four recur across all sixteen
stations. Wines stay inline too — each appears in exactly one category.

Seasons are documents for the same reason: a season's dates are defined once
and every rate referencing it follows, rather than the same two dates being
copied onto twelve tiers and then shortened in some of them.

The deliberate exception is a quote, which stores its own labels and figures
rather than referencing the tiers it was priced from. That is not redundancy —
it is a point-in-time record of a document that has left the building, and the
reasoning is in section 2 above.

---

## What is deliberately **not** modelled

Listed because the omissions are decisions, and a later reader shouldn't have
to guess whether something was forgotten.

- **Navigation.** The proposed three-column panels have load-bearing item
  counts — three Restaurant rows, six Events rows — so adding one link orphans
  a grid cell. An editable nav is an editable way to break the layout, with no
  obvious cause. The structure also isn't signed off. Stays in code; if it ever
  moves, it needs hard count validation, not a free array.
- **Gift vouchers and products.** Restaurant commerce is parked and the
  Stripe-vs-Shopify question is genuinely open.
- **Page layout** — column counts, the sticky switcher, the arch shape, reveal
  timings. All consequences of content or of measured breakpoints. Beverage has
  no sticky switcher because four `flex:1` buttons leave ~80px each on mobile;
  that's a measurement, and a CMS toggle invites someone to undo it.
- **Image variants / `srcset`.** `astro:assets` generates these from the
  original at build time.
- **A tasting booking flow.** Whether a tasting needs its own scheduling step,
  and whether the full menu is tastable on a given day, are both unanswered.

---

## Two things that are built but empty

Both are structure waiting on the client, not gaps.

**Seasonal rates.** A tier's `price` is its base and applies all year; a
`seasonalRate` overrides it for dates inside a `season`, with the higher
`priority` winning where seasons overlap. Every tier is on its base price
today, because all we have is the remark that April runs dearer than March —
no rate card. Adding one later is data entry rather than a schema change. The
resolver is `queries/pricing.ts`, kept out of the schema because it is
ordinary logic that wants unit tests.

**Venue closures.** `venue/venueClosure.document.ts` blocks dates for reasons
that are not bookings — the hall repairs expected in 2027 being the case on
record. It feeds the availability calendar and outranks everything, including
a confirmed booking: if the venue is shut, the booking is a problem for staff
rather than a reason to show the date as free. The alternative was closing
dates with fake bookings, which would corrupt the records quotes, testimonials
and reporting all read.

---

## Open questions this surfaced

Things the schema work raised that still need an answer. What the client owes
us more broadly is in `docs/planning/sanity-rollout.md`.

1. **Staff roles.** Least-privilege rather than everyone-an-administrator.
   Reading an enquiry means processing personal data. (Where the data lives
   is settled: Sanity stores every dataset in the EU, and ours is private.)
2. **Personal-data retention.** `weddingPolicy.retentionMonths` defaults to 36
   and feeds the review date on every consent record. The number is the
   client's call; the scheduled purge needs _a_ number to work from.
3. **Waitlist double opt-in.** `verifiedAt` must gate every notification. This
   was asked for as anti-spam; it's also the only thing stopping an email
   reaching an address a stranger typed in.
4. **`partnerName` on the enquiry form.** The field exists on a booking and is
   optional, and a quote composes its name from it when present. The wizard
   does not yet ask for it, so weddings are the obvious place to add the
   question.
5. **Two businesses, one address.** `siteSettings.structuredData.businessType`
   has to pick one schema.org type for a restaurant and an events venue
   sharing a building. Worth revisiting once the About page exists.
6. **"The Tomba".** The client's own term for a parking arrangement nobody has
   identified. Recorded as unconfirmed; don't publish it.
