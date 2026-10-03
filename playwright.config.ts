import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build (astro build + astro
// preview), not the dev server: that's what visitors get, and the dev server
// injects its own toolbar and unbundled scripts.
//
// Port 4322 so a running `npm run dev` on 4321 is never touched.
const PORT = 4322;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
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
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
