// @ts-check
import { defineConfig, envField } from "astro/config"
import sitemap from "@astrojs/sitemap"
import { draftPages } from "./src/integrations/draft-pages"

// https://astro.build/config
export default defineConfig({
  // The address the site will live at, which every absolute URL is built
  // from: canonical links, link-preview images, the sitemap. Until launch
  // the site runs on workers.dev, where nothing is indexed (public/_headers),
  // so pointing these at the future address there does no harm.
  site: "https://bacchus.com.mt",
  // Pages are built as weddings.html rather than weddings/index.html, and
  // addressed without a trailing slash (/weddings), which is how every link
  // on the site is written. Cloudflare serves weddings.html at /weddings
  // directly; the folder form made it redirect /weddings to /weddings/ on
  // every visit, and left two addresses for one page.
  build: { format: "file" },
  trailingSlash: "never",
  // Scoped component styles add NO specificity: Astro wraps its scoping
  // attribute in :where(). With the default ("attribute"), every rule moved
  // out of global.css into a component gained an attribute's worth of
  // specificity and started beating global state rules it used to lose to
  // (the nav's .active colour was the first casualty). This keeps the
  // cascade exactly as it was in one big stylesheet.
  scopedStyleStrategy: "where",
  integrations: [
    // Unfinished pages: built in dev and draft builds, never on the live site.
    draftPages(),
    // sitemap-index.xml: every page, for search engines to find them by
    // (listed in /robots.txt, src/pages/robots.txt.ts). Drafts aren't built
    // for the live site, so they're never in it.
    sitemap(),
  ],
  image: {
    // Photos the client manages in Sanity (the gallery, the signature dishes,
    // the stations) are fetched from its CDN at build time and go through
    // the same pipeline as the ones in src/assets/: AVIF and WebP, every
    // size, served from this site. Only listed domains are processed.
    domains: ["cdn.sanity.io"],
  },
  env: {
    schema: {
      // Reads the private Sanity dataset during the build. "secret" means it
      // can only be imported by server code, so it can't end up in a page's
      // JavaScript. Set in .env locally, and as a secret on GitHub and in
      // the Cloudflare dashboard (docs/planning/sanity-rollout.md, step 3).
      SANITY_API_READ_TOKEN: envField.string({ context: "server", access: "secret" }),
    },
    // Without the token every query comes back empty, so fail at the start
    // of the build rather than part-way through it.
    validateSecrets: true,
  },
  redirects: {
    // The package pages live under /weddings/packages/<leaf>, but there is no
    // packages overview page: Weddings' own packages section already is one.
    // So the bare parent path (typed, or a trimmed URL) goes there instead of
    // 404ing. In this static build Astro writes a small meta-refresh page,
    // which is what Cloudflare serves; a real HTTP redirect would need the
    // Cloudflare adapter or a public/_redirects file.
    "/weddings/packages": "/weddings#packages",
  },
})
