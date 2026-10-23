// The Worker's bindings (wrangler.jsonc), as server code reads them.
declare module "cloudflare:workers" {
  export const env: {
    /** Browser Rendering: Cloudflare's headless Chrome, for quote PDFs. */
    BROWSER?: import("@cloudflare/puppeteer").BrowserWorker
  }
}

// Values the build adds to import.meta.env, so TypeScript knows their types.
interface ImportMetaEnv {
  // True when draft pages are in this build (src/integrations/draft-pages.ts).
  readonly DRAFTS_INCLUDED: boolean
}
