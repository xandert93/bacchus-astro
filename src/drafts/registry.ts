// Every sandbox, written once: the draft pages built in Astro, and the frozen
// copies of the prototype's own sandboxes. Three things read it:
//   - the draft-pages integration (src/integrations/draft-pages.ts), which
//     adds each draft's route to dev and draft builds, and never to the live
//     site;
//   - the /sandboxes index page, which lists everything here by stage;
//   - tests/e2e/sandboxes.spec.ts, which checks every draft is listed and
//     loads.
// So a new draft is one entry here, and its page file in src/drafts/.

// Architecture-decision-record statuses, as the prototype's index used:
//   draft       being built or changed; not yet ready to judge
//   proposed    ready to judge, waiting on a decision
//   accepted    the decision went in its favour; the build is outstanding
//   rejected    explored and not taken forward
//   superseded  replaced by a newer version of the same thing
export type SandboxStage = "draft" | "proposed" | "accepted" | "rejected" | "superseded"

export interface Sandbox {
  name: string
  stage: SandboxStage
  type: "Page" | "Feature" | "Section"
  description: string
  href: string
  // "17 Sep 2026". Left out where it was never recorded, and the index says
  // so rather than guessing.
  started?: string
  lastWorkedOn: string
}

export interface DraftPage extends Sandbox {
  // The page file, from the project root. Kept out of src/pages/ so that
  // only the integration decides when it's built.
  entrypoint: string
}

// The index page itself. Not a sandbox, so not listed on itself.
export const SANDBOXES_INDEX = {
  href: "/sandboxes",
  entrypoint: "./src/drafts/sandboxes.astro",
}

export const DRAFT_PAGES: DraftPage[] = []

// The prototype's sandboxes, copied as they were into public/prototype/,
// which Git ignores: they exist only on the machine they were copied to. The
// index shows an entry only when its file is there. The descriptions are the
// prototype's own, so file names in them are the prototype's.
export const PROTOTYPE_ARCHIVES: Sandbox[] = [
  {
    name: "Whole-Site Navigation",
    stage: "proposed",
    type: "Feature",
    description:
      "The nav shape once the restaurant side exists alongside events: Restaurant and Events as grouped, navigable hubs, plus two buttons rather than one, since booking a table and sending an enquiry can't share a button. Merged onto the prototype's homepage on 2 Oct 2026 and now the nav on every page here; kept as the written argument for the structure, which isn't recorded in full anywhere else.",
    href: "/prototype/sandboxes/site-nav.html",
    started: "1 Oct 2026",
    lastWorkedOn: "2 Oct 2026",
  },
  {
    name: "Wedding Packages — Mobile Carousel",
    stage: "rejected",
    type: "Section",
    description:
      "The packages section with the three dining cards as a one-at-a-time swipe carousel on mobile, keeping the full-size photography at the cost of seeing all three at once. The horizontal cards won and shipped on 23 Sep; this is the alternative they were chosen over.",
    href: "/prototype/sandboxes/packages-carousel.html",
    started: "23 Sep 2026",
    lastWorkedOn: "23 Sep 2026",
  },
  {
    name: "Wedding Date Calendar Waitlist",
    stage: "rejected",
    type: "Feature",
    description:
      "Two treatments for clicking a Booked date on the venue diary: an anchored popover, or an inline panel below the grid. Rejected refers to the inline panel this page preserves, not the feature: the popover won and the waitlist is live wherever the calendar appears.",
    href: "/prototype/sandboxes/waitlist-prompt.html",
    lastWorkedOn: "21 Sep 2026",
  },
  {
    name: "Reception Menus — Stations (initial concept)",
    stage: "superseded",
    type: "Section",
    description:
      "The Stations add-on grid: sixteen tables and towers priced per person, layered onto any Reception tier. Redesigned and merged as the closing section of the Reception package page, which is where this idea lives now.",
    href: "/prototype/sandboxes/reception-stations.html",
    started: "18 Sep 2026",
    lastWorkedOn: "24 Sep 2026",
  },
]

export const SANDBOX_STAGES: { stage: SandboxStage; label: string; blurb: string }[] = [
  {
    stage: "draft",
    label: "Draft",
    blurb: "Being built or changed right now, not yet finished enough to judge.",
  },
  {
    stage: "proposed",
    label: "Proposed",
    blurb:
      "Finished enough to judge, waiting on a decision: which direction wins, or whether it goes ahead at all.",
  },
  {
    stage: "accepted",
    label: "Accepted",
    blurb:
      "The call has gone in its favour and the design is settled. What's outstanding is the build behind it, not the decision.",
  },
  {
    stage: "rejected",
    label: "Rejected",
    blurb:
      "The approach each of these shows lost to what's on the site. Not necessarily final: further testing or the client's preference could still bring one back, so they're kept as working references.",
  },
  {
    stage: "superseded",
    label: "Superseded",
    blurb:
      "Not rejected, replaced: a newer version of the same thing took over. Kept only as history.",
  },
]
