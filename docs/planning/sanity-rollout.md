# Getting Sanity live

What it takes to go from the schemas sitting in `sanity/` to a CMS the client
actually edits, in order, with what is done and what is not.

How the content model itself works — the types, why availability is derived,
what is deliberately not modelled — is `sanity/README.md`. This file is only
the route from here to a working system.

## Contents

- [Done](#done)
- [The one architectural decision this needs](#the-one-architectural-decision-this-needs)
- [Step 1 — create the project](#step-1--create-the-project)
- [Step 2 — move the content in](#step-2--move-the-content-in)
- [Step 3 — read from Sanity](#step-3--read-from-sanity)
- [Step 4 — take enquiries](#step-4--take-enquiries)
- [Step 5 — real availability](#step-5--real-availability)
- [Step 6 — the automatic parts](#step-6--the-automatic-parts)
- [Step 7 — quotes and deposits](#step-7--quotes-and-deposits)
- [Step 8 — hand it to the client](#step-8--hand-it-to-the-client)
- [What Bacchus has to supply](#what-bacchus-has-to-supply)

---

## Done

- **The content model.** 37 types in `sanity/schemaTypes/`, grouped by
  feature, covering bookings, the waitlist, quotes and payment, the four
  packages and their menus, the reception stations, venue spaces and
  closures, the gallery, testimonials, suppliers, guide articles, FAQs,
  seasons and two settings documents.
- **The queries.** Availability derived from bookings and closures, the
  package pages, the stations, the gallery, testimonials, the FAQ split
  between what a page may show and what the chat assistant may answer from,
  the seasonal price resolver, and a standing list of everything still
  waiting on the client.
- **Studio configuration.** A config skeleton and a sidebar grouped by task
  rather than by type, with pending enquiries first.
- **The decisions.** Why availability is derived, why quotes snapshot their
  figures, why navigation is not in the CMS, and the rest, recorded against
  the types they affect.
- **The content migration** (step 2 below). `npm run sanity:migrate` turns
  `src/data/` into an import file and checks itself; it just has no dataset to
  import into yet.

Nothing has been run. The `sanity` package is not installed and the folder is
excluded from `tsconfig.json`, so none of it has been typechecked or loaded
into a Studio. Expect a shakeout pass on first boot.

---

## The one architectural decision this needs

**The site is fully static today.** No Astro adapter, no server: Cloudflare
serves `dist/` exactly as built. That is good for the eleven content pages and
it is the reason the site is fast.

Two things Sanity brings cannot work that way:

- **The enquiry form needs somewhere to POST.** A static build has no server
  at all, so there is nothing to receive a submission and write a booking.
- **Availability cannot be baked in.** A calendar built at deploy time shows
  whatever was true when it was built. A date booked an hour ago would still
  read Available until the next deploy, and a visitor could enquire against a
  date that had already gone. The whole point of deriving the calendar is
  that it is current.

Everything else — packages, gallery, testimonials, FAQs, articles — is
perfectly happy static, rebuilt when content changes.

**Recommendation: stay static, and add a server only where it is needed.**
Install `@astrojs/cloudflare` and keep `output: "static"`, then mark the
handful of API routes `export const prerender = false`. Astro builds the
pages as it does now and runs only those endpoints on a Worker. The
alternative — switching the whole site to server rendering — would put every
page through a Worker for the sake of two endpoints, and give up the static
performance for nothing.

With that in place: content pages stay static and rebuild on a Sanity webhook,
the form posts to a real endpoint, and the calendar fetches current statuses
from a small JSON endpoint on load.

---

## Step 1 — create the project

Small, and it blocks everything else.

- Create the Sanity project and its dataset **in the EU region**. Decided, and
  it has to be set at creation: the data is largely EU residents' personal
  details, Sanity's default is the US, and changing it later means exporting
  everything and re-importing into a new project.
- Install `sanity` and `@sanity/vision`, drop `sanity` from the `exclude` list
  in `tsconfig.json` so the schemas are typechecked with everything else, and
  boot the Studio.
- Fix whatever the first boot complains about. 37 types written without ever
  being loaded will not be perfect.
- Add the project ID and dataset as environment variables, locally and in the
  Cloudflare dashboard.

## Step 2 — move the content in

**Written: `scripts/sanity-migrate.mjs`, run with `npm run sanity:migrate`.**

It reads `src/data/` and writes `sanity/import/content.ndjson`, ready for
`npx sanity dataset import`. Current output is 256 documents: 190 dishes, 13
tiers, 4 packages, 16 stations, 6 station categories, 23 gallery images and 4
testimonials.

It reads the content from `src/data/`, never the catalogue PDF. The port
already read the rendered catalogue pages and proofed the result — British
English, accents restored, real misspellings fixed — and a text extraction of
the PDF silently drops accented characters and sometimes whole words.
Re-reading it would throw all of that away.

It **imports** those files rather than parsing them as text, which turned out
to be possible because Node 24 strips TypeScript types natively and every
import in `src/data/` is type-only. So the data arrives as real objects, and a
typo in the script fails loudly instead of silently matching nothing — which
is exactly how the first run found a wrong export name.

Three things it does that are worth knowing:

- **Deduplicates dishes.** 255 dish references across all tiers resolve to 190
  stored dishes, so 65 duplicate lines disappear. A dish marked vegetarian in
  any tier is marked everywhere, since the catalogue is inconsistent about
  repeating the mark.
- **Sets provenance from what we actually know.** Every price is recorded as
  coming from the one client quote and left unconfirmed; Banquet is marked
  contested with the €135 figure and its source attached; the three oxblood
  page notes are created with the content rather than written by hand.
- **Checks every reference before writing.** A dangling reference would import
  without complaint and surface later as a menu with missing lines.

IDs are deterministic (`menuDish-brie-candied-walnuts-leaves`), so re-running
updates the same documents instead of creating a second copy of everything.
That matters because the first run will not be the last.

The output is gitignored: it is generated from `src/data/`, and committing it
would be a second copy of the content, free to drift from the first.

**Still to migrate**, because the content is not in `src/data/` in a
structured form yet: venue spaces, the FAQ set, suppliers and the two settings
documents. Those are small, and several are better typed straight into the
Studio than scripted.

## Step 3 — read from Sanity

Swap the hardcoded data for queries, one content type at a time rather than
all at once — packages first, since they are the largest and best understood.

Each page keeps building statically; a Sanity webhook pings a Cloudflare
deploy hook so publishing something rebuilds the site. The client sees their
change live a minute or two after pressing publish, without anyone touching
the code.

## Step 4 — take enquiries

The first genuinely new behaviour, and where the adapter from the decision
above gets added.

- An API route receives the wizard's submission, validates it, and writes a
  booking with status `pending`.
- It needs a write token, kept server-side only. A token that reaches the
  browser can rewrite the whole dataset.
- Spam handling, since this endpoint is public.
- The consent record is written with the exact wording shown at the time, so
  consent stays demonstrable after the form copy is next edited.

At this point staff have a real inbox: enquiries arrive in the Studio and can
be approved or declined there.

## Step 5 — real availability

Replace the fake seeded statuses with the derivation that already exists.

The calendar fetches current statuses from a small JSON endpoint when it
loads, so what a visitor sees is what is true now rather than what was true at
the last deploy. The endpoint returns dates and statuses only — no names, no
emails — because its results are public.

Then the waitlist can be wired up: a booked date offers to notify someone if
it frees up.

## Step 6 — the automatic parts

Each is small on its own and they are independent, so they can land in any
order.

- **New enquiry alert.** A webhook calls a function that asks a cheap, fast
  model for a suggested reply and emails it to staff with the enquiry. Never
  sent to the client automatically; a person edits and sends it.
- **Cancellation to waitlist.** When a booking is cancelled, everyone holding
  a verified waitlist entry for that date is emailed.
- **Confirmed to completed.** A scheduled job moves bookings on after the
  event date, which triggers the review request.
- **Data retention.** A scheduled job surfaces personal data past its review
  date for deletion.

## Step 7 — quotes and deposits

The largest remaining piece and the one with the most unknowns.

Quote generation is deterministic templating to PDF — never a language model;
it is a pricing document. The deposit page already exists as a front end. The
real work is the Stripe session, bank transfer reconciliation, and the race
where several enquiries hold the same date and the first deposit wins.

**Blocked on the client** for the deposit terms, which are contested: the
catalogue says 30% non-refundable with the balance 14 days out, and
correspondence calls the terms flexible without confirming that split. Do not
wire real money against an unresolved policy.

## Step 8 — hand it to the client

- Deploy the Studio so staff reach it at a URL rather than running it locally.
- Create accounts with least-privilege roles. Reading enquiries means
  processing personal data; not everyone should be an administrator.
- Walk them through approving an enquiry, editing a package and adding a
  gallery image. The sidebar is already ordered for this: pending enquiries
  first, settings last.
- Agree who holds the account. It should be Bacchus, with us invited.

---

## What Bacchus has to supply

Work that cannot start, or cannot finish, without them:

- **The two contested facts.** Banquet per-person pricing (€65/€85/€95 in the
  catalogue against "around €135 per person" in correspondence) and the
  deposit terms. The first blocks publishing Banquet prices and the cost
  guide; the second blocks step 7.
- **A rate card**, if seasonal pricing is to be real. The structure is built,
  but all we have is that April runs dearer than March.
- **Capacity figures** they are happy to publish. Everything on the site is
  still a placeholder.
- **Space names**, confirmed. Secret Garden, Prince De Redin Hall and Terrace
  all came from the catalogue rather than from them.
- **Real photography** for the sixteen stations, which are AI placeholders, and
  of the vaulted chambers, of which we have none.
- **Approval of the catalogue copy corrections**, which the Studio now lists
  on its own.
- **Bank details** for the deposit page, which currently shows a fictional
  IBAN behind a warning.
