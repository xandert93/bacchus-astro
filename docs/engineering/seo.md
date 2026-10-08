# Search and link previews

What every page tells search engines and link previews, where it comes from,
and the rules for adding to it. Built on 2026-10-08.

---

## What each page has

All in `src/components/layout/SiteHead.astro`, filled from the props a page
passes `BaseLayout`.

- **A description** (`description`, required): the snippet under the title
  in search results, and the text in a link preview. Aim for about 150
  characters; search engines cut at roughly 160 (the SEO test fails past
  it). Written from the page's own copy, in the client's voice.
- **A canonical address**: the one URL the page should be listed under.
- **A link preview** (Open Graph and Twitter tags): title, description and a
  1200 × 630 JPEG of `socialImage`, a photo key, usually the page's hero.
  Pages without a hero use the closest real photo (Banquet uses the banquet
  photo from the Weddings page's package cards); the fallback is
  `venue/ballroom-night`.
- **`lang="en-GB"`** on the page, for British English.

And sitewide:

- **`/sitemap-index.xml`**, every built page (`@astrojs/sitemap`). Drafts
  aren't built for the live site, so they're never in it.
- **`/robots.txt`** (`src/pages/robots.txt.ts`), which points to it.

---

## Addresses

- **`site` in `astro.config.mjs` is `https://bacchus.com.mt`**, the address
  the site will launch on, with no `www` (the live Shopify site redirects
  `www` to it). Every absolute URL is built from it.
- **Pages are `weddings.html`, served at `/weddings`**
  (`build.format: "file"`, `trailingSlash: "never"`). The folder form
  (`weddings/index.html`) made Cloudflare redirect `/weddings` to
  `/weddings/` on every visit, since every link on the site is written
  without the slash.

---

## Structured data

JSON-LD (a script element of JSON) in schema.org's vocabulary, built in
`src/lib/structured-data.ts`.

- **The homepage** describes the venue: a `Restaurant` and `EventVenue` with
  its address, phone, email and social accounts (`describesVenue` on
  `BaseLayout`).
- **Every subpage** carries its breadcrumb trail, rendered by `PageHero`
  from the same `crumb` and `parent` it shows on screen.

**Only confirmed facts.** A search engine repeats structured data as
settled, with no oxblood note beside it. No capacity, prices, opening hours
or space names until Bacchus confirms them (`docs/content/client-facts.md`).

**Left out on purpose**:

- **`Event`** is for public events anyone can attend. Private weddings
  aren't, and Google's guidelines rule it out for anything else.
- **`FAQPage`** has shown nothing in Google since 2023, except on government
  and health sites.

---

## Checking it

- `tests/e2e/seo.spec.ts`: every page in `tests/e2e/site-pages.ts` has a
  description, a canonical address and a preview image; the homepage's venue
  data and a package page's breadcrumbs parse.
- After launch: submit the sitemap in Google Search Console, and test a page
  in Google's Rich Results Test (`search.google.com/test/rich-results`).
