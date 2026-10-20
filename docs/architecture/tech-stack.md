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
6. [Email](#email)
7. [Running costs](#running-costs)

---

## What we chose

**Astro + Sanity + Stripe, hosted on Cloudflare.** One tool per job.

- **Astro** (this repo): the site. Ships almost no JavaScript by default, and
  the prototype's vanilla JS carried over without a framework rewrite.

- **Sanity**: the CMS for anything staff should edit. Schemas are drafted in
  `sanity/` at the repo root (34 types, Studio structure, GROQ queries) but
  not connected to a project yet. **Read its `README.md` before touching
  it.** Three decisions to know:
  - **The Studio holds Bacchus's content, not our notes about it.** What's
    still unconfirmed is tracked in `docs/content/client-facts.md`.
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

**How a build runs.** The dashboard (Worker `bacchus-astro`, Settings,
Builds) has two tabs:

- **Production** (`main`): `npm run build`, then `npx wrangler deploy`, which
  puts it live.
- **Previews Base** (every other branch, when "Builds for Preview branches" is
  on): `npm run build`, then `npx wrangler preview`, which publishes the
  branch on its own preview address without touching the live site. Its
  build variables set `INCLUDE_DRAFTS=true`, so previews show the draft pages.

Both commands read the config the build writes (`dist/server/wrangler.json`,
made from `wrangler.jsonc` at the repo root): the Worker's name, its entry
point, the static files (`dist/client/`) and the `previews` block that
`wrangler preview` refuses to run without. Commands and build variables stay
in the dashboard.

**Static pages, plus a small Worker** (since 2026-10-16). Every page is still
built ahead of time. The Cloudflare adapter (`@astrojs/cloudflare`) adds a
Worker for the routes that must run when a visitor arrives, each marked
`export const prerender = false`: so far only `src/pages/api/enquiries.ts`.
Cloudflare serves a matching static file first and only hands the Worker
what no file answers. Two settings keep the build as it was: images are
still made at build time (`imageService: "compile"`), and the static pages
are still built in Node (`prerenderEnvironment: "node"`).

**Build variables and Worker secrets are different places.** A build
variable (Settings, Builds) is only there while the site builds:
`SANITY_API_READ_TOKEN` lives there. A Worker secret (Settings, Variables and
Secrets) is only there while the Worker answers a visitor:
`SANITY_API_WRITE_TOKEN` lives there.

A build takes about ten minutes, nearly all of it encoding photos: unlike
GitHub's checks, the Cloudflare builds checked so far (2026-10-07) re-encoded
every photo rather than reusing Astro's image cache.

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

**Paying by bank is the main route, card the convenient option** (decided
2026-10-16; by open banking rather than a transfer by hand since
2026-10-18, see "Bank" below). Bank transfer costs Bacchus almost nothing; a card fee on a
deposit of several thousand euros is real money, and EU rules don't allow it
to be passed on to the couple. The deposit system is built first as a mock
(no real money), then switched to live keys once the terms are settled.

**Stripe for card payments, for now**, for its test mode and documentation.
**Other providers may be cheaper, so revisit before going live**: Viva.com
(widely used in Malta, also for card machines) and Revolut Business both take
online card payments in Malta, and Bacchus may already have an account with
one of them (asked, `docs/content/client-facts.md`). The code talks to the
card provider through one file, so switching is contained.

**The deposit page stays.** The quote email is the notification: a short
summary and one "Review and pay" button. The page is where paying, and
declining, happen. An email can't run a payment, can't show what's true
now (a hold that has expired, a quote replaced, a date taken by another
couple), and is frozen at the moment it was sent; the page reads the quote
when it's opened.

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
- **Stripe's published online rates for EEA businesses** (its 2023 pricing
  notice, checked 2026-10-20): standard EEA cards 1.5% + €0.25, UK cards
  2.5% + €0.25, other international cards 3.25% + €0.25, and about 2% more
  when a currency is converted. **Confirm on stripe.com/mt/pricing before
  quoting the client.**
- **Worked example, a €10,000 deposit**: the couple pays €10,000 whatever
  the method; what Stripe keeps comes out of what reaches Bacchus.

  | Paid by                | Fee                                 | Stripe keeps | Bacchus gets |
  | ---------------------- | ----------------------------------- | ------------ | ------------ |
  | European card          | 1.5% + €0.25                        | €150.25      | €9,849.75    |
  | UK card                | 2.5% + €0.25                        | €250.25      | €9,749.75    |
  | Other card             | 3.25% + €0.25                       | €325.25      | €9,674.75    |
  | Other card, converted  | 3.25% + €0.25, plus about 2%        | about €525   | about €9,475 |
  | Pay by bank (Stripe)   | Not published for Malta; to confirm | ?            | ?            |
  | Bank transfer (Stripe) | Not published for Malta; to confirm | ?            | ?            |
  | Bank transfer, by hand | None from Stripe                    | €0           | €10,000      |

**Bank**

- **Pay by Bank is the main route, built in test mode (2026-10-18)** on the
  assumption it works in Malta. Open banking: the client picks their bank,
  approves the payment in its own app, and the provider tells our site
  straight away, so there's nothing for staff to match. The same provider
  and code path as card (`src/lib/payments/checkout.ts`).
- **A transfer by hand stays as the fallback**, folded away under it: the
  IBAN and a reference, and staff mark it received in the Studio.
- **Through Stripe, as a trial (2026-10-21).** Stripe's docs list only
  German and UK businesses, but a Maltese test account has Pay by Bank
  available and takes euro checkouts with it, so the site now sends "Pay by
  bank" to Stripe whenever a Stripe key is set. The catch is whose banks it
  reaches: the Dashboard lists the UK and Finland, not Malta, so it suits
  couples banking in those countries and not yet Maltese ones. Each button
  offers only its own methods, set in code (`src/lib/payments/stripe.ts`).
- **Stripe's bank transfers** are a different product: the couple sends a
  normal transfer to account details unique to their booking, and Stripe
  matches it when it arrives (usually the next working day; at once if their
  bank sends it as an instant transfer). Like card payments, the money lands
  in Bacchus's Stripe balance and reaches their bank on Stripe's payout
  schedule, a few working days.
- **Other providers** (checked 2026-10-20): PSD2 obliges every Maltese bank
  to offer the interface, and Bank of Valletta, HSBC Malta, APS Bank and
  Lombard are reported to; the question is which provider connects to them.
  TrueLayer, which runs Stripe's, doesn't list Malta. Noda (noda.live), which
  has a Maltese entity, claims 28 European countries, fees from 0.1% and no
  monthly charge, but publishes no list of Maltese banks. Settled only by
  asking a provider directly: which Maltese banks they reach for a business
  in Malta taking euros, at what fee.
- **Drawbacks to weigh**: a bank the provider doesn't reach (couples from
  outside Europe especially) falls back to card or a transfer by hand;
  banks often cap how much can be sent online in a day, and a deposit runs
  to thousands; a bank without instant payments approves straight away but
  the money arrives a day later, so whether to confirm on approval or on
  arrival is a provider-by-provider decision; and there's still a fee per
  payment, usually well under a card's.
- **The alternative if Malta isn't covered**: Stripe's bank transfers. The
  client still transfers from their own banking app, but to an account
  number unique to them, and Stripe matches it automatically and tells our
  site. Not instant, but nothing for staff to match either.
- Not the same as **SEPA Direct Debit**, which is a mandate letting the
  merchant pull money, not open banking.

---

## Email

**Resend** (resend.com) sends every email (`src/lib/email/send.ts`), from
Bacchus's own address once its domain is verified with a few DNS records.
Plans, from Resend's pricing (checked 2026-10-20):

- **Free**: 3,000 emails a month, at most 100 a day; sending pauses at the
  cap, with no bill. One domain, one webhook endpoint (the bounce report
  uses it) and logs kept for about 30 days (third-party figures).
- **Pro**: $20 a month for 50,000 emails, no daily cap.

What the site sends: an enquiry is 2 emails (enquirer and staff), a quote 1,
a reminder 1, an expiry 2, a deposit 2, and each waitlist sign-up or
notification 1. For one venue that's far below 100 a day, so Free is right
at launch; Pro only if Bacchus starts sending campaigns or the daily cap
bites. Resend also limits requests per second; `send.ts` waits and retries
when told it's going too fast.

---

## Running costs

What Bacchus pays once the site is live, for the client-facing summary
(prices checked 2026-10-20; every one to confirm before quoting).

| Service                  | What for                                           | Cost                                                                                                                                      |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Sanity                   | The Studio and all content and bookings            | Growth plan, $15 a seat a month: about $30–45 for 2–3 logins. Needed for private datasets (see `docs/planning/sanity-rollout.md`, step 8) |
| Cloudflare               | Hosting, the API routes, the daily jobs            | Free plan covers it. Workers Paid ($5 a month) only if the server code or the builds outgrow it                                           |
| Resend                   | Every email                                        | Free plan; Pro $20 a month only if needed (above)                                                                                         |
| Stripe                   | Card payments, and pay by bank if it reaches Malta | No monthly fee; per payment, as under Payments                                                                                            |
| Pay by bank              | Open banking deposits                              | Per payment; no published European rate yet, expected well under a card's                                                                 |
| Bank transfer by hand    | The fallback                                       | Free to us; only Bacchus's own bank charges                                                                                               |
| Domain, bacchus.com.mt   | The address, and the email sender                  | Already theirs: the yearly renewal they pay now                                                                                           |
| Shopify                  | The current site                                   | Ends at launch (est. €30–100 a month saved), unless they want Shopify for gift vouchers                                                   |
| Tableo                   | Table bookings                                     | Unchanged                                                                                                                                 |
| Cloudflare Web Analytics | Visitor numbers                                    | Free                                                                                                                                      |

**Optional extras**: AI-drafted replies to enquiries (an Anthropic API key;
cents per enquiry), and online booking of viewings (Cal.com's free tier).

The client-facing version is a separate page, kept in step with this
table: https://claude.ai/artifact/VKWNEeDtKpAMXpFA3fYzgS (private until shared).
