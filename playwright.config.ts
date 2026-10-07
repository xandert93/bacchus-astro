import { defineConfig, devices } from "@playwright/test"

// End-to-end tests run against the production build (astro build + astro
// preview), not the dev server: that's what visitors get, and the dev server
// injects its own toolbar and unbundled scripts.
//
// Port 4322 so a running `npm run dev` (port 3000) is never touched.
const PORT = 4322

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // Two browsers at a time. Playwright's default is one per two CPU cores,
  // which on this laptop, beside a dev server and the editor, slowed the
  // whole machine and made tests fail from load alone. Slower per run, but
  // the laptop stays usable and a failure means something.
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Android Chrome, matching the phone the site is actually reviewed on.
    // Only tests tagged @mobile run here; desktop-only behaviour (hover,
    // the >=980px nav) is meaningless at this size.
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT}`,
    // Tests cover the draft pages too, so this build includes them. The live
    // build never sets this (src/integrations/draft-pages.ts).
    env: { INCLUDE_DRAFTS: "true" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
