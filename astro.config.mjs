// @ts-check
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  redirects: {
    // The package pages live under /weddings/packages/<leaf>, but there is no
    // packages overview page: Weddings' own packages section already is one.
    // So the bare parent path (typed, or a trimmed URL) goes there instead of
    // 404ing. In this static build Astro writes a small meta-refresh page;
    // on Vercel it becomes a real HTTP redirect.
    "/weddings/packages": "/weddings#packages",
  },
})
