/**
 * Which Sanity project and dataset everything talks to: the Studio, the CLI
 * and the Astro site, which imports this file as well.
 *
 * Committed rather than read from environment variables because neither is a
 * secret. The project ID is in the address of every photo the site serves,
 * and the dataset is private, so knowing both still reads nothing without a
 * token. The token IS secret, and it alone lives in the environment
 * (`SANITY_API_READ_TOKEN`, see `astro.config.mjs`). One file here means one
 * place to change them, and nothing to set up per machine, on GitHub or on
 * Cloudflare.
 */
export const SANITY_PROJECT_ID = "piwjjpge"

export const SANITY_DATASET = "production"
