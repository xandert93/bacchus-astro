/**
 * Which Sanity project and datasets everything talks to: the Studio, the CLI
 * and the Astro site, which imports this file as well.
 *
 * Committed rather than read from environment variables because none is a
 * secret. Both datasets are private, so knowing their names reads nothing
 * without a token. The token IS secret, and it alone lives in the
 * environment (`SANITY_API_READ_TOKEN`, see `astro.config.mjs`). One file
 * here means one place to change them, and nothing to set up per machine,
 * on GitHub or on Cloudflare.
 */
export const SANITY_PROJECT_ID = "piwjjpge"

/** The live content, and what everything reads unless told otherwise. */
export const PRODUCTION_DATASET = "production"

/**
 * A copy of the content plus invented bookings, enquiries, quotes and the
 * rest (`sanity/seed/`), for building and testing without going near the
 * client's data. The live site never reads it.
 */
export const DEVELOPMENT_DATASET = "development"

export const DATASETS = [PRODUCTION_DATASET, DEVELOPMENT_DATASET] as const

export type Dataset = (typeof DATASETS)[number]
