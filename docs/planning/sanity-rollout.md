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
- **The project** (step 1): created 2026-10-08, with a private `production`
  dataset.
- **The content migration** (step 2): run, and then retired. Sanity is now the
  only copy of the packages, stations, gallery and testimonials.
- **The site reads from Sanity** (step 3), apart from the webhook that
  rebuilds it when something is published.

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

**Done, 2026-10-08.** Project `piwjjpge`, dataset `production`, set to
**private**: a public dataset answers any query without a token, which would
publish every enquiry's name and email once they arrive. There was no region
to choose: Sanity stores every dataset in the EU (Google Cloud, Belgium).

The project ID and dataset are in `sanity/lib/project.ts`, read by the Studio,
the CLI and the site alike. Neither is a secret, so they're committed rather
than set up per machine.

The schemas came through their shakeout clean: `tsc` reports 0 errors and
Sanity's own `schema validate` 0 errors and 0 warnings. One real mistake
surfaced and was fixed — `faq.showOnPages` declared both a `tags` layout and
a list of allowed values, which makes Sanity ignore the list and accept
anything typed in, so an FAQ could have been assigned to a page that does not
exist.

**The Studio is its own npm package** in `sanity/`, not a dependency of the
Astro site. Sanity v6 needs React 19, React DOM and styled-components, and
this site ships no framework JavaScript; adding all of that to serve an admin
tool the public never loads would undo that for nothing. The root
`tsconfig.json` keeps excluding `sanity/`, which typechecks itself. The site
imports only `sanity/lib/` (as `@studio/…`), which has no dependencies.

Commands from the repo root:

| Command                  | What it does                           |
| ------------------------ | -------------------------------------- |
| `npm run sanity:install` | Installs the Studio's own dependencies |
| `npm run sanity:dev`     | Runs the Studio locally                |
| `npm run sanity:check`   | Typechecks the schemas                 |
| `npm run sanity:deploy`  | Publishes the Studio to its hosted URL |

## Step 2 — move the content in

**Done, 2026-10-08, and retired.** A script (`scripts/sanity-migrate.mjs`, in
git history) turned `src/data/` into an import file: 190 dishes, 13 tiers, 4
packages, 16 stations, 6 station categories, 23 gallery images and 4
testimonials, with the 48 photos uploaded alongside. It read the proofed
content in `src/data/`, never the catalogue PDF, whose text extraction drops
accented characters and whole words.

Then the script and those data files were deleted. Two copies of the content
would drift, and the script can't be run again safely anyway: it would
overwrite whatever the client has edited since.

What the migration decided, still true of the data:

- **Dishes are shared.** 255 dish lines across all tiers became 190 dish
  documents, so a spelling fix lands everywhere at once. A dish marked
  vegetarian in any tier is marked in every tier, since the catalogue is
  inconsistent about repeating the mark.
- **Every price records its source.** All of them come from the one client
  quote and are unconfirmed; Banquet's are marked contested, with the €135
  figure and its source attached.
- **Photos keep their flags.** The sixteen station photos are marked as
  placeholders (AI stand-ins), and the photos we only have as compressed
  web copies are marked `isWebCopy`, which the Studio's open-questions query
  lists as originals to ask Bacchus for.

**Still to enter**, never having been structured data on the site: venue
spaces, the FAQ set, suppliers and the two settings documents. Small enough
to type straight into the Studio.

## Step 3 — read from Sanity

**Built, 2026-10-08, apart from the rebuild webhook.**

The package pages, Reception's stations, the gallery and the testimonials
read from Sanity. Each content type has one module in `src/lib/sanity/` that
holds its query and turns the result into the shape its components render, so
no component sees Sanity's shape. Pages still build as static HTML; nothing
queries Sanity in a visitor's browser.

- **The token.** The dataset is private, so the build reads it with a
  read-only (Viewer) token, `SANITY_API_READ_TOKEN`. It lives in three places,
  never in the repository: `.env` at the repo root (local builds and
  `npm run dev`), GitHub's Actions secrets (CI), and the Cloudflare
  dashboard (Settings → Build → Variables and secrets, for production and
  preview builds). Astro checks for it before the build starts
  (`astro.config.mjs`).
- **Missing content fails the build.** An empty answer, or a station without
  its photo, stops the build with a message naming what's missing. Cloudflare
  then keeps the last good version live, rather than deploying a page with a
  hole in it.
- **Photos** uploaded in the Studio go through the same pipeline as the rest
  (`docs/engineering/images.md`).

**Still to do: rebuild on publish.** Two settings, both in dashboards:

1. **Cloudflare**: the Worker → Settings → Builds → Deploy Hooks → create one
   for `main`, and copy its URL. A POST to it starts a production build.
2. **Sanity**: sanity.io/manage → the project → API → Webhooks → create one:
   - URL: the deploy hook; method POST; dataset `production`.
   - Trigger on create, update and delete; leave "drafts" off, so only
     publishing rebuilds.
   - Filter, so only the types the site reads trigger a build (without it,
     every enquiry would rebuild the site once they arrive):

     ```groq
     _type in ["weddingPackage", "packageTier", "menuDish", "station",
       "stationCategory", "galleryImage", "testimonial"]
     ```

     Add a type to it when the site starts reading one.

The client then sees a change live a minute or two after pressing publish.

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

**Deadline: the plan, before 7 November 2026.** The project is on Sanity's
30-day Growth trial, which ends then. Private datasets are a Growth feature:
the Free plan allows public datasets only, and `production` must stay
private once it holds enquiries. Growth is priced per seat (each person who
logs in), about $15 a month each at the time of writing; check
[sanity.io/pricing](https://www.sanity.io/pricing). It should be Bacchus's
subscription, on their organisation (see the last point below). What Sanity
does to a private dataset when a trial lapses wasn't confirmed, so don't
find out by letting it lapse.

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
