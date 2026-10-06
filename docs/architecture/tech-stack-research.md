# bacchus.com.mt — Website & Technical Stack Review

Research notes on the _current live_ Bacchus site (bacchus.com.mt), gathered to
inform the Shopify-vs-Astro/Sanity/Stripe decisions referenced in `CLAUDE.md`.
Figures marked as estimates are unverified and should be confirmed before being
shared externally. The distilled, decision-relevant facts from this doc are
already folded into `CLAUDE.md`'s "Current tech stack" and "Planned production
stack" sections — this file is the fuller Q&A backing them.

The venue is considerably more valuable than the current website makes it feel.

# ChatGPT - current website audit

Venue/product - 9/10
Brand potential - 8/10
Visual storytelling - 6/10
Wedding positioning - 6/10
Conversion/lead generation - 5/10
Information architecture - 6/10
Copywriting - 5/10
Trust/social proof - 5/10
SEO potential - 6/10
Commercial opportunity - 9/10

The important distinction is that I wouldn't conclude the website is bad. It isn't. It has a legitimate luxury/historic venue to work with, and the site is reasonably structured.

The problem is that it behaves more like an information website than a high-value wedding-sales website.

## 1. What is the site, and what does it run on?

**Platform:** Shopify — confirmed by `cdn.shopify.com` asset URLs, `meta-shopify-*`
tags in the page source, and a functioning `/cart` and checkout flow (a checkout
API token is present in the page metadata).

**Age:** Likely built around 2021, based on the earliest asset timestamps found
on the pages sampled (Sept–Nov 2021), with ongoing content updates through
2024–2026 (new gallery photos, menu pages). This only reflects the pages that
were checked, not the full confirmed store history.

**Theme type:** A customized Shopify Liquid theme — Shopify's standard
templating system — rather than Hydrogen, Shopify's React-based framework for a
fully custom, headless front-end via the Storefront API. Liquid themes can still
look highly bespoke (as this one does, with a custom video hero and sections),
but the site is rendered inside Shopify's own theme system, not a separate
custom-built application.

**Estimated monthly cost:** Roughly €30–100/month for the Shopify plan itself,
plus standard card processing fees (roughly 1.5–2.9% + a small fixed fee per
transaction) on any payments taken through it, plus any paid apps. This is an
estimate based on typical Shopify plan tiers, not verified pricing for this
specific account.

## 2. Is Shopify's commerce engine actually being used?

No clear evidence of active product listings, a shop/collections page, or
gift-card sales was found in the pages checked — though this isn't fully
confirmed, since the shop/collections area couldn't be browsed directly during
this review. Worth asking Bacchus directly whether they sell (or plan to sell)
any products, gift vouchers, or deposits through the site.

**Why it matters:** Shopify's pricing, design, and admin tools are all built
around inventory, shipping, and fulfilling physical goods. If Bacchus isn't
using any of that — no products, no shipping, no stock — they may be paying for
a platform that's heavier (and more expensive) than what the site actually
needs.

## 3. How is content (like the photo gallery) actually managed?

No separate CMS. A real gallery image URL from the live site
(`cdn.shopify.com/.../files/bacchus_events_mdina_corporate_4.webp`) confirms
images are stored and served directly through Shopify's own built-in "Files"
library — a basic asset manager in the Shopify admin, not a headless CMS.

Shopify Files is a flat bucket of uploaded images with no tagging,
categorisation, or structure (no way to group images by "Weddings",
"Restaurant", or "Events", and no relationships between content types). A
structured CMS like Sanity would model a gallery as a defined content type with
filterable, taggable entries.

Content updates today go directly through the Shopify admin — staff or a
developer upload images via Files and edit copy via Shopify's Pages and
theme-section editor. No code changes, rebuilds, or redeployments needed for
routine content updates. This works fine at the current scale, but would become
harder to manage if the gallery or content needs grow more complex.

## 4. Could a custom front-end be used instead of the standard Shopify theme?

Shopify offers a spectrum: (1) a customized Liquid theme — what Bacchus
currently uses, allowing significant visual customization while staying inside
Shopify's own rendering system; or (2) a fully headless setup using Shopify's
Hydrogen framework and Storefront API, where a completely custom front-end
(e.g. Astro, React, Next.js) calls Shopify purely as a commerce backend and
Shopify becomes invisible to the visitor.

Astro + Shopify's Storefront API is technically workable for commerce data
(products, cart, checkout), but not realistically for general content —
Shopify's content tools (Pages, a basic blog, and "Metaobjects" for custom
structured data) are thin compared to a purpose-built CMS. Storing something
like a 40-image gallery in Shopify Metaobjects would be a stretch — forcing a
commerce-oriented tool to do a content job it wasn't designed for.

Realistic architecture options:

- **Option A — Astro + Sanity + Stripe:** clean separation, one tool per job.
- **Option B — Astro + Shopify Storefront API (commerce only):** content would
  need to live somewhere else — either Astro's own file-based content
  collections, or a separate CMS.
- **Option C — Astro + Sanity + Shopify:** content in Sanity, commerce via
  Shopify's API — most capable, but three services to run and pay for instead
  of two.

## 5. If content lived in the codebase instead of a CMS, would updates be easier?

No — the opposite. Astro's content collections are files (Markdown/MDX/JSON)
stored inside the code repository itself. Every content change means editing a
file, committing it, and rebuilding/redeploying the site — no web-based admin
panel for non-technical staff.

Comparison:

- **Astro content collections (files in repo):** cheapest and simplest
  technically, but every change is a code change — unsuitable for
  non-technical staff managing things like a gallery.
- **Astro + Sanity, static build:** staff edit content via Sanity's web
  interface; publishing still triggers a rebuild/redeploy, usually automated
  via a webhook (a short delay, no code editing required).
- **Astro + Sanity, server-rendered:** staff edits appear immediately with no
  rebuild step at all, at the cost of more expensive hosting and added
  complexity.

Given the current Shopify setup already lets staff update content live with no
rebuild at all, replacing it with a system that reintroduces a
developer-dependent workflow (like raw Astro content collections) would be a
step backwards for their day-to-day editing needs.

## 6. Right approach for a specific new feature: accepting wedding deposits

For a single deposit payment (card and/or bank transfer, nothing else),
**Stripe** — paired with whatever is already handling content (the current
Shopify front-end, or Sanity if migrated later) — is the better fit, not
Shopify's commerce engine. Shopify's pricing and product design centre on
catalogues, inventory, and shipping, none of which apply to a single deposit
payment; implementing it in Shopify usually means creating a fake "product" as
a workaround, which is a hack rather than a clean solution.

What Stripe offers for this: native card payments (receipts/refunds
out of the box), Stripe Payment Links or Checkout (a fixed or variable deposit
amount set up in minutes with minimal/no custom code), and no monthly platform
fee — only a per-transaction processing fee, generally cheaper overall than
carrying a Shopify subscription for one payment feature.

**Trade-off:** Stripe alone doesn't give Shopify's built-in gift-card issuing,
balance tracking, and redemption system. If Bacchus later wants proper gift
vouchers with tracked balances managed by non-technical staff with no developer
involvement, that specific capability is where Shopify's native tools would
genuinely save engineering effort — but for a deposit-only feature, that
capability isn't needed.

## 7. How do Stripe's fees actually work in practice?

The customer pays the full invoiced amount; Stripe deducts its fee before the
remainder reaches Bacchus. The fee is typically a percentage plus a small fixed
amount per transaction — e.g. illustratively 1.5% + €0.25 (not a confirmed
current rate) — so a €100 payment nets €100 − €1.50 − €0.25 = €98.25, not a
clean round percentage. The fixed fee matters proportionally more on smaller
deposits than larger ones.

The rate varies by card type: EU/domestic cards are typically cheaper than
non-EU/international cards (relevant for Bacchus, since wedding clients often
pay from abroad), and bank transfer/SEPA-style methods are usually cheaper than
card payments. Exact current rates for Malta should be confirmed directly on
Stripe's pricing page before quoting a number to the client — fee structures
and country/currency splits change over time.

## 8. Is open banking / "Pay by Bank" actually available for this?

SEPA Direct Debit and Stripe's actual open-banking product ("Pay by Bank") are
genuinely different things: SEPA Direct Debit is a pull-based mandate (the
customer authorises Stripe to debit their account on a schedule) — not really
open banking. "Pay by Bank" is real-time: the customer selects their bank and
approves the payment via their bank's own app/web portal, built on open banking
APIs.

Stripe is confirmed generally available for a Malta-registered business —
Stripe publicly announced GA in Malta (along with Czech Republic, Romania,
Bulgaria, and Cyprus) in 2020.

Whether "Pay by Bank" specifically is available for a Malta merchant is **not
fully confirmed either way**. Stripe's own product pages describe Pay by Bank
as a real, live open-banking payment method. However, independent market
commentary suggests open banking adoption in Malta specifically remains early,
with global providers like Stripe still mostly offering traditional payment
rails there, and a comparatively smaller set of open banking options available
locally. This is a genuine open question, not just caution — the concrete next
step is checking the payment methods section of a Malta-registered Stripe
account (or asking Stripe support directly), since that's the one place this
gets confirmed definitively rather than inferred from general commentary.
