// @ts-check
import { defineConfig, envField } from "astro/config"
import cloudflare from "@astrojs/cloudflare"
import sitemap from "@astrojs/sitemap"
import { draftPages } from "./src/integrations/draft-pages"

// https://astro.build/config
export default defineConfig({
  // The address the site will live at, which every absolute URL is built
  // from: canonical links, link-preview images, the sitemap. Until launch
  // the site runs on workers.dev, where nothing is indexed (public/_headers),
  // so pointing these at the future address there does no harm.
  site: "https://bacchus.com.mt",
  // Every page is still built ahead of time, as static HTML. The adapter
  // only adds a Worker for the handful of routes that must run when a
  // visitor arrives (the enquiry form's endpoint), each marked with
  // `export const prerender = false`. Cloudflare serves the static files
  // first and hands anything else to the Worker.
  adapter: cloudflare({
    // Keep the image pipeline exactly as it was: every photo resized and
    // converted at build time, not by a Cloudflare service on each request.
    imageService: "compile",
    // Build the static pages in Node, as before, rather than in Cloudflare's
    // runtime: the image pipeline needs Node.
    prerenderEnvironment: "node",
  }),
  // The site keeps no per-visitor state on the server, so no session store.
  // Without this the adapter would ask Cloudflare for a KV store to hold
  // sessions nothing uses.
  session: false,
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
    // for the live site, so they're never in it. Nor are the pages reached
    // only from a private emailed link (the waitlist, the deposit page and
    // its test checkout), which are noindex too.
    sitemap({
      filter: (page) => !/\/(waitlist|secure-booking)(\/|$)/.test(new URL(page).pathname),
    }),
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
      //
      // Optional here, but required by the build all the same: the Sanity
      // client refuses to start without it (src/lib/sanity/client.ts). Every
      // secret in this schema is also checked whenever the Worker handles a
      // request, and the Worker never has this one, so marking it required
      // made every enquiry fail (docs/engineering/known-bugs.md, 3).
      SANITY_API_READ_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Which dataset the site reads. Leave it unset everywhere except your
      // own .env, where "development" points `npm run dev` at the seed data
      // (sanity/seed/). The live site and CI always read production.
      // Writes new enquiries into Sanity. Used only by the enquiry endpoint
      // while it runs on Cloudflare, never by the build, so it's optional
      // here and checked when a request arrives. A Worker secret in the
      // Cloudflare dashboard; in .dev.vars locally (never committed).
      SANITY_API_WRITE_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Sends email through Resend (src/lib/email/send.ts). A Worker secret
      // on Cloudflare, in .env locally. Without it nothing is emailed, and
      // enquiries are still stored.
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Who emails come from. Resend's shared test address until Bacchus's
      // own domain is verified with Resend (docs/planning/sanity-rollout.md,
      // step 6); that address can only deliver to the Resend account's owner.
      EMAIL_FROM: envField.string({
        context: "server",
        access: "public",
        default: "Bacchus <onboarding@resend.dev>",
      }),
      // Where emails load their pictures and links from (public/email/).
      // Email apps fetch them from the open internet, so it must be the live
      // site, even when testing locally. Becomes https://bacchus.com.mt at
      // launch (docs/planning/roadmap.md, launch checklist).
      EMAIL_SITE_ORIGIN: envField.string({
        context: "server",
        access: "public",
        default: "https://bacchus-astro.xandert-93.workers.dev",
      }),
      // Checks that a bounce report really came from Resend
      // (src/pages/api/email-events.ts). From Resend's webhook page; a
      // Worker secret on Cloudflare.
      RESEND_WEBHOOK_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Checks that a booking change really came from Sanity
      // (src/pages/api/booking-events.ts). The secret set on that webhook in
      // sanity.io/manage; a Worker secret on Cloudflare.
      SANITY_WEBHOOK_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // The Studio's address, including the workspace, for the "Open in the
      // Studio" button in the staff alert, e.g.
      // https://bacchus.sanity.studio/production. Locally,
      // http://localhost:3333/development. Without it, no button.
      STUDIO_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // When set, every email goes to this address instead of its real
      // recipient, so testing locally can never email a real person. Set it
      // in your own .env; never on the live site.
      EMAIL_TEST_RECIPIENT: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SANITY_DATASET: envField.enum({
        context: "server",
        access: "public",
        values: ["production", "development"],
        default: "production",
      }),
    },
    // Check every secret's format before the build starts.
    validateSecrets: true,
  },
  vite: {
    // The dev server runs the enquiry endpoint in Cloudflare's runtime, and
    // Vite bundles its dependencies the first time something needs them.
    // Left to find @sanity/client on the first enquiry, it re-bundles while
    // the server is running and the endpoint then asks for a file that isn't
    // there yet ("The file does not exist at .vite/deps_ssr/
    // @sanity_client.js"). Bundling it as the server starts avoids that
    // (docs/engineering/known-bugs.md, 4).
    ssr: { optimizeDeps: { include: ["@sanity/client"] } },
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
