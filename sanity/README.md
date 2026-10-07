# Bacchus — Sanity schemas

Content model for the Bacchus production stack (Astro + Sanity + Cloudflare),
designed ahead of that stack being opened. **Nothing here is connected to a
live Sanity project yet** — there is no project ID, no dataset, and no
`package.json`. These are the schema definitions, written to be dropped into a
Sanity Studio when one is created.

Authored for Sanity v4 (`defineType` / `defineField`, TypeScript). The files
will not typecheck until `sanity` is installed, because every import resolves
against that package.

---

## What's here

```
sanity/
  sanity.config.ts          Studio config skeleton (placeholder project ID)
  structure.ts              Studio sidebar, grouped by task not by type
  lib/constants.ts          Shared option lists, matched to the existing markup
  schemaTypes/
    index.ts                Registry, and the list of what is deliberately absent
    objects/                16 reusable types
    documents/              16 document types
    singletons/             2 edited-in-place documents
  queries/
    availability.ts         The calendar, derived — replaces seededStatus()
    content.ts              Page queries, plus the open-questions working list
```

## Dropping it in

```bash
npm create sanity@latest -- --template clean --typescript
```

Then copy `schemaTypes/`, `structure.ts`, `lib/` and `queries/` across, point
`sanity.config.ts` at the real project, and seed the two singletons with the
document IDs `siteSettings` and `weddingPolicy` (the structure file addresses
them by those exact IDs).

**Create the dataset in the EU region.** The default is US, and bookings,
waitlist entries and testimonials all hold personal data belonging largely to
EU residents. Moving a dataset afterwards means an export and re-import.

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
- **A seasonal rate engine.** Pricing varies by month and we have one quote as
  a single data point. `price.isIndicative` says "from" and stops there.
- **A tasting booking flow.** Whether a tasting needs its own scheduling step,
  and whether the full menu is tastable on a given day, are both unanswered.

### One addition that needs a decision

`documents/venueClosure.ts` is **not** something the project asked for. The
calendar derives purely from bookings, which assumes every unavailable date is
unavailable _because someone booked it_ — and the hall repairs expected in 2027
are a counterexample already on record. Without it, the only way to close a
date is a fake booking, which corrupts the data that quotes, testimonials and
reporting all read.

It's written, and the availability query has the merge **commented out**.
Nothing consults it until someone opts in.

---

## Open questions this surfaced

Things the schema work raised that need an answer from the client or a call
from us, beyond those already tracked in `CLAUDE.md`:

1. **Dataset region and staff roles.** EU region, and least-privilege roles
   rather than everyone-an-administrator. Both are one-time decisions.
2. **Personal-data retention.** `weddingPolicy.retentionMonths` defaults to 36
   and feeds the review date on every consent record. The number is the
   client's call; the scheduled purge needs _a_ number to work from.
3. **Waitlist double opt-in.** `verifiedAt` must gate every notification. This
   was asked for as anti-spam; it's also the only thing stopping an email
   reaching an address a stranger typed in.
4. **`partnerName` on bookings.** Quotes and the deposit page address a couple
   ("Bertha & Alex") but the wizard only collects one name. Either the form
   grows a field or quotes keep being addressed to one person.
5. **Two businesses, one address.** `siteSettings.structuredData.businessType`
   has to pick one schema.org type for a restaurant and an events venue
   sharing a building. Worth revisiting once the About page exists.
6. **"The Tomba".** The client's own term for a parking arrangement nobody has
   identified. Recorded as unconfirmed; don't publish it.
