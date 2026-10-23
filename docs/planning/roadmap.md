# Roadmap

What's planned, in what order, and what's waiting in the backlog. The stack
itself (what we chose, why, and how payments work) is in
`docs/architecture/tech-stack.md`.

---

## Contents

1. [Migration phases](#migration-phases)
2. [Launch checklist](#launch-checklist)
3. [Events features, in priority order](#events-features-in-priority-order)
4. [Other planned features](#other-planned-features)
5. [Backlog](#backlog)

---

## Migration phases

1. **Faithful port** (complete, 2026-10-04). Same markup, CSS and JS as the
   prototype, content hardcoded, the repetition removed into components. No
   redesigns; one new thing at a time. Every page is ported: `index`,
   `weddings`, `corporate`, `celebrations`, `gallery`, and the four
   packages at `/weddings/packages/{reception,banquet,high-tea,beverage}`.
   `menu.html` is parked restaurant content: ported to `/menu` as a draft
   (on `main`, never built for the live site) and unlinked, until the
   restaurant side is picked up.
2. **Image pipeline** (done, apart from the originals still to come from
   Bacchus). Every photo is built from its original where one exists; see
   `docs/engineering/images.md`.
3. **Sanity** (under way). The project is live and the site reads its
   packages, stations, gallery and testimonials from it (2026-10-08), and
   rebuilds on publish (2026-10-16). Next: enquiries, then live availability,
   then deposits in test mode. The route is
   `sanity-rollout.md`, which also carries the one decision it needs: the
   site is static, so the enquiry endpoint and the availability feed need the
   Cloudflare adapter on those routes alone.
4. **Forms and payments.** Hosting is done: Cloudflare builds and deploys
   `main` on every push (`docs/architecture/tech-stack.md`, "Hosting").

---

## Launch checklist

Things that are right before launch and wrong after it. Undo each one on the
day the site goes live on Bacchus's own domain.

- **Remove the `noindex` header.** `public/_headers` tells search engines not
  to list any page, because the `workers.dev` address is public. Left in
  place after launch, it would keep the real site out of Google.
- **Decide on Cloudflare Turnstile** for the enquiry form, if the hidden
  field and the timing check (`src/pages/api/enquiries.ts`) let spam through.
- **Point emails at the real domain**: set `EMAIL_SITE_ORIGIN` to
  `https://bacchus.com.mt` (`astro.config.mjs`), so their pictures and links
  stop using the `workers.dev` address.
- **Submit the sitemap** (`https://bacchus.com.mt/sitemap-index.xml`) in
  Google Search Console, once the domain points here.

---

## Events features, in priority order

Restaurant features (gift vouchers and so on) wait until these are done.

### 1. Availability

- The calendar reads booking statuses. Decisions are in
  `docs/design/decisions.md`.
- **Live** since 2026-10-17: the statuses come from the bookings in Sanity
  when the page opens (`docs/planning/sanity-rollout.md`, step 5).
- **Waitlist**: store waiting leads in Sanity (date, email, active or
  notified). When a booking is cancelled, a Sanity webhook calls a function
  that emails everyone waiting on that date.
- **Waitlist cap**: a generous per-email limit (5–10 dates), mainly to stop
  spam, with email verification. Not built.
- **Race condition**: if several enquiries are pending for one date, the first
  to pay its deposit is confirmed automatically, and the others are marked
  unavailable and told.

### 2. Package content in Sanity

- **Done** (2026-10-08): the four packages, their tiers, menus and the
  stations are in Sanity, and the package pages read them from there.
- The catalogue's prices and terms are already public, so publishing them as
  pages changes how easy they are to find, not who can see them.

### 3. Automatic PDF quotes

- Built from a fixed template (HTML and CSS rendered to PDF), **never
  AI-generated**. Needs step 2.
- **Decided, 2026-10-22: we're building them.** Why the email and the
  deposit page aren't enough:
  - **Corporate clients**: finance teams approve spending through
    purchase-order and expense systems, which take a file as an attachment,
    not an email. A formal quote also carries the client company's name and
    VAT number, which the email doesn't.
  - **No private link changes hands.** Forwarding the quote email forwards
    the deposit page's link, and with it the buttons to pay and to decline.
    A PDF can go to finance, parents or a planner without them.
  - Printing, offline reading, and a branded copy of exactly what was
    quoted, kept on the quote (its "Generated PDF" field).
- **How to make them**, compared on 2026-10-22 with the same sample quote
  drawn both ways:
  - **Browser Rendering** (Cloudflare's headless Chrome printing an HTML
    page): the template is HTML and CSS like the rest of the site, so text
    wraps, long tables and terms flow onto further pages, and design changes
    are CSS. About a second a PDF. Free plan: 10 browser minutes a day;
    paid: 10 hours a month, then $0.09 an hour.
  - **pdf-lib** (a JavaScript library inside the Worker): no service and
    a fifth of the time, but every line is placed by hand in points, with
    no wrapping, no page breaks and no gradients. Two bugs in the first
    draw (letters missing from a subsetted font, a box drawn upside down)
    show the cost.
  - The two came out nearly identical for a one-page quote. Browser
    Rendering is the recommendation, because real quotes will run to terms
    and conditions and long item lists. **Chosen by the user, 2026-10-22.**
- **The demo** (2026-10-22): a four-page PDF, the quote then the draft
  booking terms, made to show Bacchus. Its lines are the kinds a real
  quote carries at the prices on record: a Reception tier, two stations
  (couples usually choose two), wine and an open bar, a themed bar "on
  request" (the catalogue gives themed bars no price), and the set-up items
  from the real quote (round and bistro tables, bar pieces, sound, red
  carpet, chair bows). Revised the same day: prices from Bacchus's own
  quote (the gin bar is €12.50), small set-up items grouped into one
  named line, "per person" dropped (the quantity shows it), "Prepared by
  Nicholas Vella Gatt" as on their quotes, and 30-day validity.
- **What their real quote suggests for ours** (`client-facts.md`, "The real
  quote"), not built yet: who prepared it, filled in from whoever's logged
  into the Studio; a Notes field the client sees, separate from the
  internal one; an Overtime group, so the summary matches theirs (Exclusive
  Use, Food, Beverage, Set-Up, Overtime); the cake and its flavour; and the
  quote validity setting at whatever D5 settles.

### 4. Deposits

- Card (Stripe) and bank transfer. Fees, providers and the open question
  about Pay by Bank in Malta are in `docs/architecture/tech-stack.md`.
- **Blocked** on the deposit-terms conflict (`docs/content/client-facts.md`).
- Built in test mode on 2026-10-17: quote emails, the deposit page at
  `/secure-booking`, bank transfer first, a pretend card checkout, declining,
  and first-deposit-wins. What's left before real money is in
  `docs/planning/sanity-rollout.md`, step 7.

### 4b. The balance (not built)

Only the deposit is built. The rest waits on the payment schedule, one of
the two open conflicts (30/70 in the catalogue, 30/60/10 in person). Ideas,
none agreed with Bacchus yet (questions in `client-facts.md`):

- **A flexible payment plan.** Wedding venues often offer a payment plan:
  fixed instalments on set dates. A flexible one also lets the couple pay
  any amount towards the balance whenever they like (partial payments)
  before each due date. The deposit page would become their booking page
  (a client portal): paid so far, what's left (the running balance), the
  next due date, and a "make a payment" box with a sensible minimum. The
  daily jobs send a reminder before each due date, as they do for quotes.
- **Bank payments first.** Card fees are a percentage plus a fixed part on
  every payment, so many small card payments cost the most. Pay by Bank and
  bank transfer cost little or nothing per payment
  (`docs/architecture/tech-stack.md`, "Payments").
- **A discount for paying early** (suggested 2026-10-21): pay it all, or a
  large part, up front for a small discount. There's no industry standard
  rate; it's set by what it's worth to Bacchus: money in hand sooner, less
  chasing, and the card fee avoided. Offering it only for bank payment
  stops a card fee (about €150 on €10,000) eating it.
- **The risk is refunds.** The deposit is non-refundable in every version
  of the terms we've seen; what happens to later payments if a couple
  cancels isn't known (asked). The more that's paid early, the more a
  cancellation puts at stake, so the cancellation terms must be clear
  before either idea.

### 5. Collecting testimonials

- **Built** (2026-10-21): the day after an event the daily jobs mark the
  booking Completed; a week after, they email a review request. The `/review`
  form asks for a rating, the review, the name to show and permission to
  publish, and lands in the Studio as "Awaiting review". **Every submission
  is reviewed by a person before publishing.**
- Not yet: a photo upload (the schema has the permission and the field).
- The thank-you screen asks everyone to share their review on Google too,
  with it ready to copy. Its link is a stand-in, badged Proposed, until
  Bacchus supplies their Google Business profile's review link.
- The four live testimonials were supplied by hand.

### 6. Preferred supplier directory

- Photographers, florists and so on. Low effort, and the best SEO item on the
  list: suppliers linking back is worth more than any on-site copy.

---

## Other planned features

- **New-enquiry alerts**: a Sanity webhook calls a function that has a cheap,
  fast AI model draft a reply, included in the staff email for a person to
  edit and send. **Never sent automatically.**
- **FAQ chat assistant** (low priority): answers only from current Sanity
  content, never invents prices or availability. Built in-house.
- **Anniversary invitations** (proposed 2026-10-23, to raise with Bacchus;
  a question in `client-facts.md`, "For the call"). On each couple's
  wedding anniversary, an email from Bacchus: "A year ago today you
  celebrated with us: come back and toast it at the restaurant", perhaps
  with a glass of prosecco or a dessert on the house. Every year, for as
  long as they don't opt out.
  - **Why**: it lands on a day they're already feeling sentimental, it's
    personal, and it brings them back to the restaurant. Couples who return
    bring friends, and leave reviews of their own accord: the honest
    version of what a prize draw for reviews would try to buy.
  - **Cheap to build**: each wedding's date and the couple's email are
    already stored, and the daily jobs already run every morning. One more
    check in them, and one email. About a day's work.
  - **The rule**: emailing existing customers about similar services is
    allowed without asking first (the "soft opt-in"), but every email must
    offer a one-click way to stop, and stopping must be respected. A
    booking would record that they've opted out.
  - **For Bacchus to decide**: whether to offer something with it (a glass
    of prosecco, a dessert), for which events (weddings only, or
    anniversaries of any celebration), and for how many years.

---

## Backlog

### Search visibility and guide articles

The basics are built; the guides are agreed in principle, and none is
written.

- **SEO basics: done** (2026-10-08). Descriptions, canonical addresses, link
  previews, the venue's structured data, breadcrumbs and a sitemap; see
  `docs/engineering/seo.md`. `Event` and `FAQPage` were left out on purpose.
- **One page per search phrase is out.** "Wedding venues Malta", "historic
  wedding venue Malta" and similar are the same intent, and `/weddings` should
  rank for them. A page per phrase is a named Google spam pattern (doorway
  pages) and would compete with `/weddings`.
- **Some phrases are real pages**: outdoor → the spaces page; historic → the
  chambers page; small weddings → a real strength (layouts from 50 guests).
- **Five guides**, best first:
  1. **Getting married at Bacchus**: every fact is already in
     `client-facts.md`. Do first.
  2. **Secret garden weddings in Malta**: must say the garden isn't in the
     standard package.
  3. **What a wedding at Bacchus costs**: highest value, but **blocked** on
     the pricing conflict, seasonal prices and placeholder capacities.
  4. **10 reasons to marry in Mdina**: light, but safe and shareable.
  5. ~~Best historic venues in Malta~~: a venue ranking itself isn't credible.
     Write "Getting married in a historic building in Malta: what to ask"
     instead.
- **Guides go in the Events dropdown**, not under About (About is for the
  company, not for wedding planning). A top-level "Journal" makes sense once
  the writing isn't only about weddings.

### Reception stations

- **Shortlist into the enquiry** (not agreed): let visitors mark stations and
  carry the names into the enquiry. Names only, **never a running total**,
  since that would be quoting. Needs state across pages (a URL parameter).
- **Open**: deep links to a station don't work on mobile.
- **Open**: the homepage carousel arrows are a fourth, inconsistent style;
  audit all carousel arrows.
- **Ideas**: an "All vegetarian" badge where every item is (V) (Macaron
  Tower, Doughnut Wall); an asterisk on Crêpe Table's one unmarked item
  (marshmallows); "Chef's picks" badges (not "popular", which we can't
  back up).

### Package pages

- **Redesign the tier item lists** on Reception. Needs a design direction
  first.
- **Tier section scrolling** was much improved but not fully fixed. The grain
  overlay and the switcher's blur now switch off while scrolling. The main
  suspect left was image weight, which the image pipeline may have solved.
  Recheck.

### Slow connections

- On a poor signal, much of the site failed to load. Never reproduced under
  controlled conditions: test with network throttling. Image weight is now
  handled; what to show when an image request fails or stalls is not.

### Map in the Visit section

- A Mapbox map styled to the palette would fit better than a plain Google
  Maps embed, at the cost of an API key, styling and more JavaScript. Free up
  to 50,000 loads a month (needs a card on file); check current pricing
  before quoting. Worth it only if the client likes the idea. See the
  ChatGPT chat.

### Naming and spacing clean-up

The scripts ported from the prototype break two code-style rules: names are
abbreviated, and multi-line statements aren't followed by a blank line. Found
on 2026-10-06 while reviewing `Testimonials.js`.

- **Feature prefixes are left over from the prototype.** Its single shared
  `main.js` put every feature in one scope, so names were prefixed to stop
  clashes: `t` (testimonials: `tShow`, `tActive`), `lb` (lightbox), `wl`
  (waitlist), `car` (photo carousel). Each Astro script is its own module, so
  the prefixes no longer do anything. Drop them and use full names
  (`showNextTestimonial`, `activeTestimonialIndex`).
- **Short names everywhere**: `e`, `i`, `el`, `dx`, `btn`, `prevBtn`,
  `quoteEl`, `cardsWrap` and the like.
- **Several variables in one `let`** (`let a = 0, b = null, …`): 28 of
  these across 9 files. One declaration per line is easier to scan.
- **No blank line after multi-line statements**, e.g. `tPrev`/`tNext` in
  `Testimonials.js`.
- **Markup IDs have the same prefixes** (`tQuote`, `carTrack`, `wlPopover`,
  `msgCharRing`, `goToFormBtn`), so renaming touches the `.astro` file as
  well as its script. `tests/e2e/testimonials.spec.ts` selects `#tQuoteBox`
  and `#tCards` and would need updating too.

Worst first, by rough count of short names: `ReceptionStations.js`,
`AvailabilityCalendar.js`, `EnquiryForm.js`, `Testimonials.js`,
`site-nav.js`, then a long tail. Do it as one `refactor/…` branch per
component (script, markup and specs together), each a pure rename, so the
e2e suite proves nothing changed.
