# Decisions

Choices that were argued through and settled, with the reason, so they aren't
reopened by accident. "Not signed off" means the client hasn't approved it
yet, not that it's undecided between us.

---

## Contents

1. [Navigation](#navigation)
2. [Enquiry form](#enquiry-form)
3. [Availability calendar and waitlist](#availability-calendar-and-waitlist)
4. [Package pages](#package-pages)
5. [Testimonials](#testimonials)
6. [Photo carousel](#photo-carousel)
7. [Other](#other)

---

## Navigation

**Structure** (not signed off): **Restaurant ▾ · Events ▾ · Gallery · About**,
plus two buttons: **Book a table** (filled) and **Enquire** (outline).

- **Why two buttons**: the site now carries two businesses with different
  actions. Table booking is instant (Tableo); an event enquiry is slow. One
  button can't be both.
- **Book a table comes first**: Enquire already appears on every events page
  and in the footer; table booking had nowhere.
- **Restaurant and Events are both a page and a dropdown**: the label is a
  link and the chevron beside it opens the panel. On touch there's no hover to
  separate "open the menu" from "go to the page", so a toggle-only label
  would make the parent page unreachable. Each panel also repeats its hub page
  as a link.
- **Enquire gets its own page** (`/enquire`, not built): restaurant pages have
  no enquiry section to scroll to. The on-page enquiry sections stay, and each
  page's own button preselects its event type.
- **Package pages stay out of the nav**; they are reached from the Weddings
  page.
- **Unbuilt pages** appear with a "Proposed" badge and go nowhere.

**Panels**: a three-column grid on a dark frosted card.

- **Grid over a single column** because it absorbs new links sideways; a
  column grows longer with every page and already felt long at six.
- **Item counts matter**: Restaurant has three (one row), Events six (two
  rows). Adding or removing one leaves a gap.
- **The hub link sits in the panel's heading row**, not the grid.
- Per-row photo crossfade on hover (pure CSS) and photos that load on first
  open.

**Burger at 980px**, not 820px: four items, two buttons and the logo need
about 890px.

**Gaps it exposed**: there is no About page (the history, the family and the
estate only exist as homepage sections) and no photo of the chambers.

**Still to do**: the mobile drawer has never had a proper review.

---

## Enquiry form

A four-step wizard: **the occasion** (event type, date) → **the specifics**
(guests, spaces, message) → **your details** (name, email, phone) →
**review**.

- **"Other" is an event type** so a proposal, shoot or wake has an honest
  option instead of abandoning the form.
- **Contact details come last**: people give them more readily once they've
  already invested in the earlier questions.
- **Enter on steps 1–3 moves to the next step.** Without this, Enter would
  trigger the form's only submit button and could send the enquiry without
  ever showing Review.

---

## Availability calendar and waitlist

- **One source of truth**: the calendar reads each booking's status (pending,
  confirmed, declined, completed). Nobody maintains a separate calendar.
- **Labels: Available / Enquiries received / Booked.** "Enquiries received"
  informs without pressuring; urgency counters clash with an exclusive venue,
  but hiding the information entirely doesn't help the visitor.
- **Only weddings use the calendar**, because only weddings are one per day.
  Other event types get a plain date field.
- **About two years ahead**, a typical lead time for an exclusive venue.
- **Staff approve or decline in Sanity Studio.** A custom dashboard was
  deferred as overkill for the expected volume.
- **Waitlist**: a booked date opens a small popover (name and email) anchored
  to the date: hover with a mouse, tap on touch, with a hint by the legend. An
  inline panel under the grid was tried and rejected.
- **Open**: should "Enquiries received" dates get the waitlist too? Only Booked
  does today.
- **Open**: is the name meant to be required?

---

## Package pages

- **URLs: `/weddings/packages/{reception,banquet,high-tea,beverage}`.** They
  only make sense inside the wedding journey. "Packages", not "dining",
  because Beverage isn't dining and "packages" is the catalogue's own word. No
  `-package` suffix, since the folder already says it.
- **Tiers are a hash** (`#rose`), not separate pages: Daisy, Lavender and Rose
  are a comparison, not three destinations.
- **Beverage is built differently on purpose.** It's added on top, not chosen
  instead. Four categories that combine freely, not three ranked tiers: a 2×2
  card grid, two-column lists (wines carry tasting notes), no sticky switcher
  (four names don't fit on mobile) and no dish tiles.
- **Cross-links**: Reception, Banquet and High Tea each link to the other two
  in a plain line of text, so a visitor can compare. Beverage links back to
  the packages section instead. A photo-card version was built and reverted
  as over-engineered; keep it simple.
- **Menu items are visible by default.** No per-item entrance animation.

---

## Testimonials

- **The card row is the real picker**; the dots are decoration.
- **The name gets its own line**, above the smaller category / place / date
  line, because the name is what tells them apart. Category and place are the
  same on all four today; reconsider showing them once that changes.
- **The countdown ring is on the forward arrow only.** A matching track on
  both made the back arrow look like a timer too.
- **The ring is an SVG stroke**, not a `conic-gradient`, which filled
  inconsistently.

---

## Photo carousel

**The counter shows a range** ("1–2 / 5") when more than one photo fits, and a
single number ("2 / 5") on mobile.

- At desktop width there are four scroll positions for five photos, so no
  single number is honest.
- `index + 1` never reaches 5 / 5. "Last slide once at the end" skips a number
  and makes Next jump from 3 to 5. A position per photo makes the last Next do
  nothing visible.
- The range counts **fully** visible photos, since a third usually peeks in.

---

## Other

- **Social links** (Facebook, Instagram) sit in the footer under the brand
  text and at the bottom of the mobile drawer, matching the live site.
- **The deposit page has its own CSS namespace** (`secure-booking-*`) rather
  than sharing the site's component classes.
- **AI features**: drafting staff replies is fine (a human always sends). AI
  "visualise your wedding" images are rejected: they undercut a venue sold on
  authenticity and set false expectations. No AI anywhere near prices,
  contracts or legal text.
