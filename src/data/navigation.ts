// The site's navigation: the two dropdowns and the plain links in the
// desktop bar, and the same groups and links in the mobile drawer, from one
// list so they can't drift apart.
//
// Item counts are load-bearing: each desktop panel lays its items out in a
// three-column grid, so Restaurant's three are one clean row and Events'
// six are two. Adding or removing one orphans a cell. "Book a table" is
// deliberately not a Restaurant item: the CTA pill with that exact label
// sits beside it in the bar.
//
// `unbuilt` marks a page that doesn't exist yet: the link goes nowhere
// (href="#", data-unbuilt, which site-nav.js keeps from closing the
// drawer) and wears a "Proposed" badge.

export type NavIconName =
  | "menu-card"
  | "vaults"
  | "gift"
  | "rings"
  | "building"
  | "party"
  | "pin"
  | "camera"
  | "book"

export interface NavLink {
  label: string
  href?: string
  unbuilt?: boolean
}

export interface NavMenuItem extends NavLink {
  description: string
  icon: NavIconName
  // The panel photo (and caption) this item brings up on hover; items
  // without one keep the panel's default photo.
  photo?: string
}

export interface NavPanelPhoto {
  // "default" is the photo shown when no item is hovered.
  state: string
  // A key from src/lib/images.ts.
  src: string
  caption: string
}

export interface NavMenu extends NavLink {
  heading: string
  // The menu's own landing page: the heading row's link on desktop, the
  // first row of the group in the drawer.
  hub: NavLink
  items: NavMenuItem[]
  photos: NavPanelPhoto[]
}

export const NAV_MENUS: NavMenu[] = [
  {
    label: "Restaurant",
    unbuilt: true,
    heading: "Dine at Bacchus",
    hub: { label: "The restaurant", unbuilt: true },
    items: [
      {
        label: "Menus",
        unbuilt: true,
        description: "The à la carte menu, and the cellar.",
        icon: "menu-card",
        photo: "menus",
      },
      {
        label: "The Chambers",
        unbuilt: true,
        description: "Built 1657–1660 as a gunpowder magazine.",
        icon: "vaults",
      },
      {
        label: "Gift vouchers",
        unbuilt: true,
        description: "Dinner for two, in a card.",
        icon: "gift",
      },
    ],
    photos: [
      {
        state: "default",
        src: "food-and-drink/lamb",
        caption: "Dinner beneath two stone vaults.",
      },
      {
        state: "menus",
        src: "food-and-drink/seabass",
        caption: "Caught that morning, plated that night.",
      },
    ],
  },
  {
    label: "Events",
    unbuilt: true,
    heading: "Celebrate at Bacchus",
    hub: { label: "All events", unbuilt: true },
    items: [
      {
        label: "Weddings",
        href: "/weddings",
        description: "One wedding a day, across all three spaces.",
        icon: "rings",
        photo: "weddings",
      },
      {
        label: "Corporate",
        href: "/corporate",
        description: "Launches and dinners in a 17th-century hall.",
        icon: "building",
        photo: "corporate",
      },
      {
        label: "Celebrations",
        href: "/celebrations",
        description: "Birthdays, anniversaries and christenings.",
        icon: "party",
        photo: "celebrations",
      },
      {
        label: "The spaces",
        unbuilt: true,
        description: "Secret Garden, De Redin Hall and Terrace.",
        icon: "pin",
        photo: "spaces",
      },
      {
        label: "Preferred suppliers",
        unbuilt: true,
        description: "Photographers, florists and bands.",
        icon: "camera",
      },
      // The guide articles live here rather than under About (where you read
      // about the company, not what a wedding costs) or as a top-level
      // Journal. No photo: the articles don't exist yet.
      {
        label: "Guides",
        unbuilt: true,
        description: "What a wedding here involves, and what it costs.",
        icon: "book",
      },
    ],
    photos: [
      {
        state: "default",
        src: "venue/ballroom-night",
        caption: "Gather within centuries of Maltese history.",
      },
      {
        state: "weddings",
        src: "weddings/couple-outside-2",
        caption: "One wedding a day, always yours alone.",
      },
      {
        state: "corporate",
        src: "corporate/guests-chatting",
        caption: "From boardroom to full seated gala.",
      },
      {
        state: "celebrations",
        src: "celebrations/guest-laughing",
        caption: "Every milestone, worth marking.",
      },
      {
        state: "spaces",
        src: "venue/secret-garden-night",
        caption: "A garden older than the walls around it.",
      },
    ],
  },
]

// A link's href, falling back to "#" for a page that isn't built yet.
export const hrefOf = (link: NavLink) => (link.unbuilt ? "#" : (link.href ?? "#"))

// The plain top-level links after the two dropdowns, in both bars. On
// desktop an unbuilt one wears its Proposed badge above the label, since
// the bar has no room beside it.
export const NAV_PAGES: NavLink[] = [
  { label: "Gallery", href: "/gallery" },
  { label: "About", unbuilt: true },
]

// The attribute site-nav.js looks for to keep an unbuilt link from
// jumping to the top of the page (and from closing the drawer).
export const unbuiltAttr = (link: NavLink) => (link.unbuilt ? { "data-unbuilt": "" } : {})
