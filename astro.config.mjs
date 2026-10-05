// @ts-check
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  // Scoped component styles add NO specificity: Astro wraps its scoping
  // attribute in :where(). With the default ("attribute"), every rule moved
  // out of global.css into a component gained an attribute's worth of
  // specificity and started beating global state rules it used to lose to
  // (the nav's .active colour was the first casualty). This keeps the
  // cascade exactly as it was in one big stylesheet.
  scopedStyleStrategy: "where",
  redirects: {
    // The package pages live under /weddings/packages/<leaf>, but there is no
    // packages overview page: Weddings' own packages section already is one.
    // So the bare parent path (typed, or a trimmed URL) goes there instead of
    // 404ing. In this static build Astro writes a small meta-refresh page;
    // on Vercel it becomes a real HTTP redirect.
    "/weddings/packages": "/weddings#packages",
  },
})
