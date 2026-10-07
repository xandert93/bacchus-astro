# Tech stack

The one place for everything about platforms: what the live site runs on, the
options weighed, what we chose and why, and how payments will work. Feature
order is in `docs/planning/roadmap.md`.

Figures marked as estimates are unverified. Confirm them before sharing with
the client.

---

## Contents

1. [What we chose](#what-we-chose)
2. [Options weighed](#options-weighed)
3. [Hosting](#hosting)
4. [The live site today](#the-live-site-today)
5. [Payments](#payments)

---

## What we chose

**Astro + Sanity + Stripe, hosted on Cloudflare.** One tool per job.

- **Astro** (this repo): the site. Ships almost no JavaScript by default, and
  the prototype's vanilla JS carried over without a framework rewrite.

- **Sanity**: the CMS for anything staff should edit. Schemas are drafted in
  `sanity/` at the repo root (34 types, Studio structure, GROQ queries) but
  not connected to a project yet. **Read its `README.md` before touching
  it.** Three decisions to know:
  - **Every unconfirmed fact carries a `provenance`** (confirmed, unconfirmed,
    contested, placeholder). The bronze and oxblood notes then come from the
    data, and a disclaimer disappears when the client confirms the fact.
  - **Derive availability, snapshot money.** There's no availability
    document: the calendar is computed from bookings. Quotes store every
    figure as sent, since prices change by season.
  - **Navigation isn't editable**: its item counts matter, and an editable nav
    is an easy way to break the grid. `venueClosure` is the one type added
    beyond what was agreed; it isn't wired in yet.

- **Cloudflare Workers**: hosting, plus server functions (forms, quotes,
  payments) through Astro's API routes and the Cloudflare adapter. No need
  for Next.js. See [Hosting](#hosting).
  - **Analytics**: Cloudflare Web Analytics (no cookies, so no consent
    banner), which also reports real visitors' page speed. See
    `docs/operations/analytics-and-measurement.md`.

- **Stripe** for card deposits, alongside bank transfer. See
  [Payments](#payments).

- **Tableo stays** for table bookings (about €90–140 a month, three tiers).
  Building a replacement was considered and rejected: it's a mature product
  and switching gains little.

---

## Options weighed

| Option                         | Verdict                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| **Astro + Sanity + Stripe**    | **Chosen.** Clean separation, two paid services.                                        |
| Astro + Shopify Storefront API | Rejected. Fine for commerce, but Shopify's content tools are too thin for package data. |
| Astro + Sanity + Shopify       | Rejected. Most capable, but three services to run and pay for, for one deposit payment. |
| Content as files in the repo   | Rejected. Every edit would need a developer, a commit and a rebuild.                    |

**Why content files lose**: staff can already edit the live site with no
rebuild through Shopify's admin. Making every change a code change would be a
step backwards.

**How Sanity publishing can work:**

- **Static build**: staff edit in Sanity; publishing triggers an automatic
  rebuild (a short delay, no code).
- **Server-rendered**: edits appear immediately, at the cost of pricier hosting
  and more complexity.

**Why not keep Shopify for payments**: Shopify is built around products,
stock and shipping. A deposit would need a fake "product" as a workaround.

---

## Hosting

**Cloudflare Workers, deployed by Workers Builds.** Every push to `main`
builds the site on Cloudflare and puts it live on its `workers.dev` address;
the result shows as a "Workers Builds" check on the commit in GitHub. This is
Workers with static assets, not the older Cloudflare Pages product.

**Why not Vercel**, the original plan: Vercel's free (Hobby) plan is for
personal, non-commercial use only, so a restaurant's site would need the Pro
plan from day one. Cloudflare's free plan has no such rule.

**What the free plan covers**, from Cloudflare's pricing page (2026-10-07;
check it again before quoting the client):

- **Static pages, images and scripts**: free and unlimited. Today that's the
  whole site.
- **Server code** (forms, quotes, payments, once built): 100,000 requests a
  day, and **10 ms of CPU time per request**. CPU time counts only work the
  code does, not time spent waiting on Sanity or Stripe, so a form handler
  fits easily.
- **Workers Paid** ($5 a month minimum): 10 million requests and 30 million
  CPU milliseconds a month included, and up to 30 seconds of CPU per request
  by default. Needed only if something outgrows the 10 ms.

**What the Workers runtime can't do.** Server code runs in Cloudflare's own
JavaScript runtime, not full Node.js: no file system and no long-running
processes, and some npm packages that rely on Node won't run (a compatibility
flag covers most of the common ones). Check each server-side dependency
before choosing it.

**PDF quotes are the case to watch.** The usual way to turn a page into a
PDF, a headless Chrome (Puppeteer), can't run inside a Worker. Two options:

- **Cloudflare Browser Rendering**: a headless Chrome Cloudflare runs for
  you. The free plan allows 10 minutes a day; Workers Paid includes 10 hours
  a month. Best if a quote should look exactly like a web page.
- **A PDF library that runs on Workers** (`pdf-lib`, for example): draws the
  PDF in code, with no browser. Free, but the layout is built by hand.

Decide when quotes are built (step 4 of the roadmap).

**Until launch, nothing is indexed.** The `workers.dev` address is public, so
`public/_headers` sends `X-Robots-Tag: noindex` with every page, telling
search engines not to list it. Removing it is on the roadmap's launch
checklist.

---

## The live site today

**bacchus.com.mt runs on Shopify.** Confirmed by `cdn.shopify.com` asset URLs,
`meta-shopify-*` tags and a working cart and checkout (a checkout API token is
in the page metadata).

- **Age**: probably built around 2021 (the earliest asset dates found are
  Sept–Nov 2021, on the pages sampled), with updates through 2024–2026. Still
  maintained.

- **Theme**: a customised Shopify Liquid theme (Shopify's standard
  templating), not Hydrogen (Shopify's React framework for fully custom front
  ends). It looks bespoke, with a custom video hero, but renders inside
  Shopify's theme system.

- **Cost (estimate)**: about €30–100 a month for the plan, plus card fees
  (roughly 1.5–2.9% + a fixed fee) on any payments, plus paid apps.

- **Commerce features look unused.** No products, collections or gift-card
  sales were found, though the shop pages couldn't be browsed directly. If
  they aren't selling anything, they're paying for a platform heavier than
  they need. Ask them (it's on the client question list).

- **Content**: no CMS. Images sit in Shopify Files, a flat bucket with no tags
  or grouping (confirmed via a gallery URL,
  `cdn.shopify.com/.../files/bacchus_events_mdina_corporate_4.webp`). Staff or
  a developer edit pages and upload files in the Shopify admin. Fine at
  today's volume; it scales badly once a gallery needs filtering or reuse.

- **Table bookings**: Tableo (see [What we chose](#what-we-chose)).

**Outside audit** (ChatGPT): "the venue is considerably more valuable than the
current website makes it feel." The site isn't bad and is reasonably
structured, but it behaves like an information site rather than a site that
sells high-value weddings.

| Area                      | Score |
| ------------------------- | ----- |
| Venue / product           | 9/10  |
| Commercial opportunity    | 9/10  |
| Brand potential           | 8/10  |
| Visual storytelling       | 6/10  |
| Wedding positioning       | 6/10  |
| Information architecture  | 6/10  |
| SEO potential             | 6/10  |
| Conversion / lead capture | 5/10  |
| Copywriting               | 5/10  |
| Trust / social proof      | 5/10  |

---

## Payments

**Deposits are taken by card (Stripe) and bank transfer.** Building them is
step 4 of the roadmap, and is blocked on the deposit-terms conflict in
`docs/content/client-facts.md`.

**Stripe**

- Available to Maltese businesses since 2020.
- Card payments with receipts and refunds built in; Payment Links or Checkout
  can take a fixed or variable deposit with little or no custom code.
- No monthly fee, only a fee per payment.
- **What it doesn't do**: Shopify's gift-card issuing, balance tracking and
  redemption. That only matters if Bacchus later wants tracked-balance gift
  vouchers run by staff with no developer.

**How the fees work**

- The customer pays the full amount; Stripe deducts its fee before it reaches
  Bacchus.
- A percentage plus a fixed amount: for example 1.5% + €0.25 leaves €98.25 of
  a €100 deposit (illustrative, not a confirmed rate). The fixed part weighs
  more on small deposits.
- Cards from outside the EU cost more, which matters since many couples pay
  from abroad. Bank and SEPA methods are usually cheaper than cards.
- **Check Stripe's current Malta pricing before quoting the client.**

**Bank transfer**

- **Baseline**: show the IBAN and a reference; staff reconcile by hand.
- **Upgrade to investigate**: "Pay by Bank" (open banking: the customer
  approves the payment in their own banking app, instantly, with no card fee,
  and it reconciles itself).
- Not the same as **SEPA Direct Debit**, which is a mandate letting the
  merchant pull money, not open banking.
- **Unconfirmed for Malta.** Stripe lists Pay by Bank as live, but open
  banking in Malta is reportedly early, with few banks covered. To settle it,
  check the payment methods in a Maltese Stripe account, or ask Stripe.
