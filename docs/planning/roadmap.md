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
   packages, stations, gallery and testimonials from it (2026-10-08). Next:
   the rebuild-on-publish webhook, then enquiries. The route is
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
- **Submit the sitemap** (`https://bacchus.com.mt/sitemap-index.xml`) in
  Google Search Console, once the domain points here.

---

## Events features, in priority order

Restaurant features (gift vouchers and so on) wait until these are done.

### 1. Availability

- The calendar reads booking statuses. Decisions are in
  `docs/design/decisions.md`.
- **Next**: replace the fake statuses with a real query.
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

### 4. Deposits

- Card (Stripe) and bank transfer. Fees, providers and the open question
  about Pay by Bank in Malta are in `docs/architecture/tech-stack.md`.
- **Blocked** on the deposit-terms conflict (`docs/content/client-facts.md`).
- The deposit page's front end is ported to `/secure-booking` as a draft
  (on `main`, never built for the live site), with a placeholder booking. It
  stays a draft until the terms are settled and the payment side is built.

### 5. Collecting testimonials

- Some days after an event, a daily scheduled job marks the booking Completed
  and emails a review request (opt-in for name and photo). **Every submission
  is reviewed by a person before publishing.**
- Not built. The four live testimonials were supplied by hand.

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
