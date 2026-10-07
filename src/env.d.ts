// Values the build adds to import.meta.env, so TypeScript knows their types.
interface ImportMetaEnv {
  // True when draft pages are in this build (src/integrations/draft-pages.ts).
  readonly DRAFTS_INCLUDED: boolean
}
