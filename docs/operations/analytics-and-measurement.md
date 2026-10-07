# Analytics and measurement

Notes on what the production stack can measure, what it costs, and what is
worth saying to Bacchus about it. Written 2026-10-02. Kept out of `CLAUDE.md`
deliberately — that file is loaded on every request, and this is reference
material rather than a working constraint.

Nothing here is built. The current prototype has no analytics of any kind.

---

## What the planned stack gives us

The site is hosted on Cloudflare (`docs/architecture/tech-stack.md`), and
Cloudflare has one free product that covers both questions we care about.
This replaced the original plan of Vercel Web Analytics and Speed Insights
when hosting moved from Vercel to Cloudflare on 2026-10-07.

### Cloudflare Web Analytics

One small script tag in the root layout, plus a site entry in the Cloudflare
dashboard. Reports visitors, page views, top pages, referrers, countries, and
**device type** — which is the number we wanted when the mobile-versus-desktop
split came up during the nav work and nobody could answer it.

The important property: **it sets no cookies.** Under GDPR that means **no
consent banner**, which matters because Bacchus is an EU business and a cookie
banner is both a legal obligation and a conversion tax on a site whose job is
to produce enquiries.

### Real visitors' page speed

The same product reports **Core Web Vitals from real visitors** (LCP, INP,
CLS) — actual load and interaction timings on the devices and connections
people really have, rather than a throttled simulation in DevTools. On Vercel
this was a separate product, Speed Insights; here it comes with the
analytics.

This is the one that would properly diagnose the "site failed on a weak
underground signal" problem in the backlog. A lab test tells you what a
simulated slow connection does; this tells you what Bacchus's actual visitors
in Malta experienced.

### Cost and caveats

Free. **Check Cloudflare's current documentation before quoting anything to
the client** — same caution already applied to the Stripe fee and Mapbox load
figures elsewhere in these docs. Two things to confirm when it's set up:
exactly which breakdowns it offers, and whether figures are sampled (some
Cloudflare analytics report a sample of visits, scaled up, rather than every
one).

---

## Alternatives, if Cloudflare's analytics is ever outgrown

| Tool                         | Cost      | Cookie banner? | Notes                                                                   |
| ---------------------------- | --------- | -------------- | ----------------------------------------------------------------------- |
| **Cloudflare Web Analytics** | free      | No             | Already on the platform. Start here.                                    |
| **Plausible** or **Fathom**  | ~€9–14/mo | No             | Privacy-first, EU-hosted options, more detail than Cloudflare's.        |
| **Google Analytics 4**       | free      | **Yes**        | Far more detailed, much heavier, and the consent banner is unavoidable. |

The honest ranking for this project: start with Cloudflare's, move to
Plausible only if a specific question comes up that it cannot answer. GA4 is
hard to justify for a single-venue site given the banner.

---

## What we could actually measure once it is live

Worth knowing which of these are easy and which are not, because the
difference matters when talking to the client.

**Straightforward:**

- Traffic split by device, country, referrer
- Which pages people land on, and which they leave from
- How many people reach the enquiry form at all
- How many complete it — a real conversion rate, per event type
- Which wedding package pages get read, and for how long
- Whether the gallery filters get used, and which categories

**Harder, and worth being honest about:**

- **Attributing a booked wedding back to a traffic source.** The
  consideration cycle runs months, people switch devices, and the booking
  itself closes by email, phone and a site visit — not on the website. Any
  claim that "this channel produced this wedding" is softer than it sounds.
- **Offline conversion.** A couple who finds the venue on Instagram, reads
  the site on a phone, and then calls is invisible as a conversion.
- **Small numbers.** A venue doing a few dozen weddings a year does not
  generate statistically meaningful A/B test data. Analytics here is for
  spotting obvious problems, not for optimisation at the margin.

---

## Do clients like Bacchus actually care about this?

Honest answer: **it varies enormously, and most small hospitality businesses
are not looking at it.** They are on Shopify, which reports sessions and
device breakdown by default, but having a dashboard and reading it are
different things. There is no evidence either way in anything we have seen from
them, and this has never come up in correspondence.

Three reasons it is still worth raising with them:

1. **It reframes what the site is.** A brochure site is a cost. A site that
   reports "forty enquiries this month, twelve of them from the Weddings page,
   seventy per cent of your traffic on mobile" is an asset with a measurable
   return. For a venue where a single wedding is five figures, that framing
   changes how the project is valued.

2. **It settles arguments with evidence rather than opinion.** Questions like
   "should the Secret Garden get its own page" or "is anyone reading the
   package pages" stop being matters of taste.

3. **It is free.** One script tag on hosting that is already in place, with
   no cookie banner and no monthly fee.
   The cost of mentioning it is zero and the downside is nil.

**How to pitch it without over-promising:** offer it as visibility, not as
growth. "You will be able to see where enquiries come from and what people
read" is true and deliverable. "This will increase your bookings by X" is not
something the analytics itself does, and promising it invites being measured
against a number nobody controls.

---

## Related open items elsewhere

- The slow-connection failure in `CLAUDE.md`'s backlog is the clearest case
  for real-visitor page speed — it is currently unreproduced, and field data would
  settle it.
- The device split would also inform the image-weight work, since the
  `srcset` gap hurts mobile far more than desktop.
- Shopify admin reports sessions by device on the **current** live site. That
  is a five-minute check and would give a real baseline before the new site
  launches, which is worth having for comparison afterwards.
