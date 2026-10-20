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
- **The site reads from Sanity** (step 3), and rebuilds itself when
  something is published.

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

| Command                          | What it does                                        |
| -------------------------------- | --------------------------------------------------- |
| `npm run sanity:install`         | Installs the Studio's own dependencies              |
| `npm run sanity:dev`             | Runs the Studio locally, with both datasets         |
| `npm run sanity:check`           | Typechecks the schemas and the seed                 |
| `npm run sanity:deploy`          | Publishes the Studio to its hosted URL              |
| `npm run sanity:seed`            | Rewrites the development dataset's seed data        |
| `npm run sanity:copy-production` | Copies production's content over development's copy |

Sanity commands that load the schema (`schema validate`,
`documents validate`) now ask which workspace: add `--workspace production`
or `--workspace development`.

### The development dataset

Created 2026-10-08, private, for building and testing anything that reads or
writes data without going near the client's. It holds a copy of the real
content plus seed data in every collection, as if the site had been live
for a year: 19 enquiries and bookings in every status, their quotes and
payments, the waitlist, closures, spaces, add-ons, seasons, FAQs, guide
articles, suppliers, testimonials awaiting review, the parked restaurant
menu and both settings documents. All 345 documents pass the schema's own
validation.

- **The seed** is `sanity/seed/`, one file per area, run by
  `npm run sanity:seed`. Every person in it is invented (example.com
  emails, phone numbers from the range reserved for fiction), and every
  date is relative to the day it runs, so re-running it keeps the data
  current. It refuses to write anywhere but development.
- **Private records have a dot in their id** (`booking.seed-turner-grech`),
  as the real enquiry endpoint will give them: Sanity never shows such a
  document to anyone who isn't logged in, even in a public dataset.
- **Refreshing the copied content**: `npm run sanity:copy-production`, then
  `npm run sanity:seed` again (the seed fills in a few fields the copy
  resets). Worth doing when the client has changed menus or photos and you
  want development to match, or when experiments have left development's
  copy in a mess. It copies **published content only**: packages, tiers,
  dishes, stations and their categories, and the gallery. Never bookings,
  the waitlist, quotes or testimonials, which hold real people's details;
  development keeps its invented ones. A type the site starts reading is
  added to the `--types` list in `sanity/package.json` only if it holds no
  personal data.
- **In the Studio**, switch between Production and Development at the top
  left. Only `sanity dev` shows Development (`sanity/.env.development`); the
  Studio built for staff has Production alone.
- **On the site**, `SANITY_DATASET=development` in `.env` points
  `npm run dev` and local builds at it. The live site and CI never set it,
  so they always read production.

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

**Built, 2026-10-08. Rebuild on publish added 2026-10-16.**

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

**Rebuild on publish** (set up 2026-10-16). Two settings, both in dashboards:

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

**Built, 2026-10-16.** The form posts to `src/pages/api/enquiries.ts`, which
runs on Cloudflare: it checks the enquiry (`src/lib/enquiries/validate.ts`)
and stores it as a booking with status "new" (`to-booking.ts`), so it appears
in the Studio under Enquiries, New. The venue spaces it links to were added
to production the same day (Prince De Redin Hall, the Terrace, the Secret
Garden: names, settings and inclusion only).

**To switch it on**, a write token, which never goes in the repository:

1. sanity.io/manage → the project → API → Tokens → Add API token. Name it
   `enquiry-endpoint`, permissions **Editor**. Copy it: Sanity shows it once.
2. Locally: add `SANITY_API_WRITE_TOKEN=<the token>` to `.env` at the repo
   root (`.env.example` lists every setting). Not `sanity/.env.development`:
   that file is the Studio's, and it's committed. With
   `SANITY_DATASET=development` there too, test enquiries go to development.
3. Live: Cloudflare → the Worker → Settings → Variables and Secrets → Add,
   type **Secret**, name `SANITY_API_WRITE_TOKEN`. Not under Builds: the
   build never uses it.

Without the token the endpoint answers "can't be received right now" and the
form tells the visitor to email instead.

**Spam**: a hidden field only bots fill in, and a minimum time to fill the
form; either one gets a fake "sent" and nothing is stored. Cloudflare
Turnstile is the next step if spam gets through.

What the plan asked for:

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

**Built, 2026-10-17.** The calendar fetches current statuses from
`src/pages/api/availability.ts` when the page opens, so what a visitor sees is
what is true now rather than what was true at the last deploy. The endpoint
works them out with the rules in `sanity/queries/availability.ts` and returns
dates and statuses only (no names, no emails), because its answers are public.
It also sends the wedding policy's booking horizon and minimum notice, so the
calendar's window follows the policy.

- **The Worker needs the read token too**, as a secret (Settings, Variables
  and Secrets), as well as the build variable it already was. Set on
  2026-10-17 with `npx wrangler secret put SANITY_API_READ_TOKEN`.
- **Always fresh**: straight from Sanity's database, never its CDN, and never
  reused by the browser, so a date shows as taken as soon as the enquiry is
  stored (known bug 5).
- **If it can't load**, every date shows as available and a note under the
  calendar says Bacchus will confirm the date.
- **Days can't be picked until the statuses arrive**, so nobody picks a date
  that's about to turn out booked.

**The waitlist, built 2026-10-17.** A booked date's "notify me" popover posts
to `src/pages/api/waitlist/index.ts`, which refuses a date that isn't booked
and more sign-ups per address than the wedding policy allows, stores the
person unconfirmed, and emails a link to confirm. The links in every
waitlist email open `/waitlist`, whose button (not the link itself, since
email scanners open links) confirms or removes them
(`api/waitlist/confirm.ts`, `leave.ts`). Only a hash of each link's secret
is stored. When a confirmed wedding is cancelled, Sanity calls
`src/pages/api/booking-events.ts`, which checks the date really is free and
emails everyone confirmed on its list, marking them Notified.

**To switch on the cancellation emails**, set up Sanity's webhooks (step 7,
"Sanity's webhooks").

## Step 6 — the automatic parts

**Email, started 2026-10-17.** Every email goes through `src/lib/email/send.ts`
to Resend (resend.com), with a shared frame (`layout.ts`) and one file per
email. An email that fails never undoes the enquiry it's about.

- **Enquiry confirmation** (`enquiry-confirmation.ts`), to the enquirer once
  the enquiry is stored. If it fails, the sent panel says no copy could be
  emailed.
- **Staff alert** (`enquiry-alert.ts`), to the addresses in Site Settings
  ("New-Enquiry Email Recipients"; events@bacchus.com.mt until set), with an
  "Open in the Studio" button (`STUDIO_URL`). Replying to it replies to the
  enquirer. The AI-drafted reply is still to come (it needs an Anthropic API
  key).
- **The Email Log** (since 2026-10-19): every email the site sends about a
  booking, to the client or to staff, is recorded on it ("Email Log" in the
  Studio, under Status History): which email, to whom, when, and whether it
  went (`src/lib/email/log.ts`). Waitlist emails aren't about a booking and
  aren't logged.
- **Bounces**: if an address turns out not to exist, Resend reports the
  bounce to `src/pages/api/email-events.ts`, which marks that email
  "Bounced" in the log; a bounced client email also flags the booking's card
  "Email bounced: phone them". The report is checked against Resend's
  signature, so it can't be faked.
  **To switch on**, once emails send from the live site: Resend → Webhooks →
  Add endpoint `https://<site>/api/email-events`, event `email.bounced`; then
  put its signing secret in the Worker secret `RESEND_WEBHOOK_SECRET`.

- **Settings** (`.env.example`): `RESEND_API_KEY`, a Worker secret on the
  live site; `EMAIL_TEST_RECIPIENT`, set only locally, which sends every email
  to you instead of its real recipient; `EMAIL_FROM`.
- **Until Bacchus's domain is verified with Resend**, emails come from
  Resend's shared test address, which only delivers to the Resend account's
  owner. Verifying means adding a few DNS records to `bacchus.com.mt`
  (asked, `docs/content/client-facts.md`); then `EMAIL_FROM` becomes a
  Bacchus address.

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

**The daily jobs, built 2026-10-19.** Cloudflare runs the Worker's
`scheduled` (`src/worker.ts`) every day at 07:00 UTC (the `triggers` in
`wrangler.jsonc`). It hands the run to `/api/jobs/daily` through Astro's own
handler, with a key only that Worker knows, so the jobs run like any request
and nobody else can start them. The jobs live in `src/lib/jobs/daily.ts`; the
two scheduled jobs above slot in there. Locally, `npm run dev:daily-jobs`
runs them on the dev server and prints what they did. Nothing to set up on
the live site: the timetable deploys with the Worker.

## Step 7 — quotes and deposits

**Deposits in test mode, built 2026-10-17.** Paying by bank is the main
route, card the convenient one. No real money moves yet: both go to a
pretend provider, and the bank details for a transfer by hand are the
wedding policy's (example ones until Bacchus supplies theirs, with a "do not
send funds" warning). **Nothing holds a date before a deposit**: the first
deposit to arrive secures it, and the client is told so.

1. **Staff send a quote**: set its status to Sent and publish. Sanity calls
   `src/pages/api/quote-events.ts`, which makes the quote a private link
   (only its hash is stored, as for the waitlist), gives the quote an end
   date if staff didn't (the wedding policy's "Days a Quote Stays Valid"),
   moves the booking to Awaiting Deposit and emails the client a summary
   with one button to `/secure-booking?token=…`. After that end date the
   page shows the quote as closed.
2. **The deposit page** loads the quote by that link (`api/deposits/view.ts`;
   loading and shaping in `src/lib/deposits/`). The client can:
   - **pay by card** (`checkout.ts`): sends them to Stripe's checkout when
     `STRIPE_SECRET_KEY` is set (its test key locally, so no money moves),
     or to the pretend one without it. Stripe's webhook
     (`api/payments/stripe-events.ts`) records the payment and confirms the
     booking. Locally, run `stripe listen --forward-to
localhost:3000/api/payments/stripe-events` beside `npm run dev`, and put
     the `whsec_…` it prints in `.env` as `STRIPE_WEBHOOK_SECRET`. Pay with
     Stripe's test card 4242 4242 4242 4242, any future date, any CVC;
   - **pay by bank**: Stripe's Pay by Bank when `STRIPE_SECRET_KEY` is set,
     through the same checkout, webhook and test setup as card (Stripe's
     test mode offers a pretend bank to approve in); otherwise the pretend
     checkout (`/secure-booking/test-checkout`), whose "Approve" records a
     test payment (`test-payment.ts`). Which banks it reaches is under
     "Bank" in `docs/architecture/tech-stack.md`;
   - **transfer it themselves** (folded away under Pay by bank) and say so
     (`transfer-sent.ts`): records an Awaiting bank-transfer payment on the
     booking and emails staff to look out for it;
   - **decline the quote** (`decline.ts`), after a confirmation dialog: the
     quote becomes Declined, the booking Withdrawn, staff are emailed, and
     the client gets a short email confirming it.
3. **Staff mark the transfer Received** on the booking's payment and publish.
   Sanity calls `api/booking-events.ts`, which confirms the booking.
4. **Confirming** (`src/lib/deposits/confirm.ts`), whichever way the money
   came: the booking becomes Confirmed and the quote Accepted. For a wedding,
   every other open enquiry for the date is declined and emailed that the
   date has gone; if the date was already taken, staff are emailed to refund
   instead. Client and staff both get a confirmation email.
5. **The quote's end date** (`src/lib/deposits/deadlines.ts`, run by the
   daily jobs): two days before it, if the deposit is still due, the client
   gets a reminder with a fresh link (the first still works). Once it has
   passed with nothing paid or on its way, the quote becomes Expired, the
   enquiry goes back to In Discussion, and the client and staff are emailed.

**Sanity's webhooks.** A webhook is Sanity's server calling one of the
site's API routes when a published document changes. Two drive the site:
**Booking changes** (a deposit marked received, a wedding cancelled) and
**Quote sent**. Both are defined once, in `sanity/webhooks/definitions.ts`.

- **Locally**, Sanity can't call your computer, so run
  `npm run dev:webhooks` beside `npm run dev`. It watches the development
  dataset and makes the same calls to `localhost:3000`, signed with
  `SANITY_WEBHOOK_SECRET` from `.env`. Without it, sending a quote or
  marking a deposit received in the Studio does nothing on the site.
- **On the live site**, once emails send from it: sanity.io/manage → the
  project → API → Webhooks → Create webhook, once for each. Dataset
  `production`; trigger on **Update** only; method POST; API version
  `v2025-02-19`; drafts off; the same long random secret on both, also set
  as the Worker secret `SANITY_WEBHOOK_SECRET`. The name, URL, filter and
  projection to paste are printed by `npm run dev:webhooks -- --print`.

**Trying the whole flow yourself**, on the development dataset: run
`npm run dev`, `npm run sanity:dev` and `npm run dev:webhooks`, each in its
own terminal. In the Studio, open a seeded booking's quote, set it to Sent
and publish; the quote email arrives at `EMAIL_TEST_RECIPIENT`, and its
button opens the deposit page. Pay by bank or by card through the pretend
provider, or press "I've sent the transfer" and then, in the Studio, set
that payment on the booking to Received and publish. `npm run sanity:seed`
puts everything back.

**Still to do before real money:**

- **The deposit terms**, which are contested: the catalogue says 30%
  non-refundable with the balance 14 days out, and correspondence calls the
  terms flexible without confirming that split. Do not take real money
  against an unresolved policy.
- **Bacchus's real bank details** in the wedding policy.
- **A real payment provider** for card and pay by bank: Stripe for now,
  with Viva and Revolut worth comparing on fees, and pay by bank's reach
  in Malta to confirm (`docs/architecture/tech-stack.md`). Swapping means
  `src/lib/payments/checkout.ts` plus the provider's own webhook.
- Quote PDFs: deterministic templating, never a language model.

## Step 8 — hand it to the client

**Deadline: the plan, before 7 November 2026.** The project is on Sanity's
30-day Growth trial, which ends then. Private datasets are a Growth feature:
the Free plan allows public datasets only, and **when a trial ends without
an upgrade, Sanity makes private datasets public** and turns every
non-admin into a viewer
([Sanity's trial docs](https://www.sanity.io/docs/platform-management/growth-plan-trial)).
Growth is $15 per seat a month (each person who logs in;
[sanity.io/pricing](https://www.sanity.io/pricing), checked 2026-10-08), so
about $30–45 a month for two or three logins. It should be Bacchus's
subscription, on their organisation (see the last point below).

The fallback if Bacchus won't pay: stay on Free with public datasets. Records
holding personal data already get a dot in their id, which keeps them hidden
from anyone not logged in (see "The development dataset", step 1). What it
costs: every staff member is an administrator (Free has no other editing
role), and anything created by hand in the Studio would be public unless its
id is set the same way.

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
