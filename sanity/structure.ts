import type { StructureBuilder, StructureResolver } from "sanity/structure"
import {
  DATE_BLOCKING_STATUSES,
  GALLERY_CATEGORIES,
  OPEN_ENQUIRY_STATUSES,
  type BookingStatus,
} from "./lib/constants"

/**
 * Studio navigation.
 *
 * Every item has an explicit `.id()`, which becomes its part of the Studio's
 * URL. Without one, Sanity camel-cases the title, giving addresses like
 * `/structure/faQs` and `/structure/restaurantMenuParked`.
 *
 * Grouped by what a person is actually trying to do, not by schema type. The
 * reason that matters here: Sanity Studio is the whole of the staff admin
 * surface. A bespoke dashboard or CRM was explicitly deferred as likely overkill
 * for the expected volume, so approving and declining enquiries happens in
 * this sidebar — which makes Enquiries the first thing in it, and the new,
 * unanswered ones the first list inside that.
 *
 * Titled dividers name each group of the sidebar, so its order reads as
 * sections rather than arbitrary breaks. Within a section, a type with a
 * status or category is split into one list per stage, in the order work
 * moves through them, with "All" last.
 */

type Ordering = { field: string; direction: "asc" | "desc" }

/** A list of one type's documents matching a GROQ filter. */
const filteredList = (
  S: StructureBuilder,
  title: string,
  id: string,
  filter: string,
  params: Record<string, unknown> = {},
  ordering?: Ordering[],
) => {
  const list = S.documentList().title(title).filter(filter).params(params)

  return S.listItem()
    .title(title)
    .id(id)
    .child(ordering ? list.defaultOrdering(ordering) : list)
}

/** A list of bookings in the given statuses, soonest event first. */
const bookingsInStatus = (
  S: StructureBuilder,
  title: string,
  id: string,
  statuses: readonly BookingStatus[],
) =>
  filteredList(S, title, id, '_type == "booking" && status in $statuses', { statuses }, [
    { field: "event.date", direction: "asc" },
  ])

/** A list of one type's documents in the given statuses. */
const typeInStatus = (
  S: StructureBuilder,
  type: string,
  title: string,
  id: string,
  statuses: string[],
) =>
  filteredList(S, title, id, "_type == $type && status in $statuses", { type, statuses })

/**
 * Pick a parent, then see its children: tiers by package, stations by
 * category. Sanity can't sort or group a list by a field behind a reference,
 * so this is how the tiers stop being one flat list of thirteen.
 */
const childrenByParent = (
  S: StructureBuilder,
  title: string,
  id: string,
  parentType: string,
  childType: string,
  referenceField: string,
) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(
      S.documentTypeList(parentType)
        .title(title)
        .child((parentId) =>
          S.documentList()
            .title(title)
            .filter(`_type == $childType && ${referenceField}._ref == $parentId`)
            .params({ childType, parentId })
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
    )

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Bacchus")
    .items([
      S.divider().title("Sales"),

      // Enquiries and bookings are one document type that changes status, so
      // nothing is copied when an enquiry becomes a booking. These two lists
      // just split it at the deposit.
      S.listItem()
        .title("Enquiries")
        .id("enquiries")
        .child(
          S.list()
            .title("Enquiries")
            .items([
              bookingsInStatus(S, "New", "new", ["new"]),
              bookingsInStatus(S, "In discussion", "in-discussion", ["in-discussion"]),
              bookingsInStatus(S, "Awaiting deposit", "awaiting-deposit", [
                "awaiting-deposit",
              ]),
              S.divider(),
              bookingsInStatus(S, "Declined & withdrawn", "closed-enquiries", [
                "declined",
                "withdrawn",
              ]),
              bookingsInStatus(S, "All enquiries", "all-enquiries", [
                ...OPEN_ENQUIRY_STATUSES,
                "declined",
                "withdrawn",
              ]),
            ]),
        ),
      S.listItem()
        .title("Bookings")
        .id("bookings")
        .child(
          S.list()
            .title("Bookings")
            .items([
              bookingsInStatus(S, "Confirmed", "confirmed", ["confirmed"]),
              bookingsInStatus(S, "Completed", "completed", ["completed"]),
              bookingsInStatus(S, "Cancelled", "cancelled", ["cancelled"]),
              S.divider(),
              bookingsInStatus(S, "All bookings", "all-bookings", [
                ...DATE_BLOCKING_STATUSES,
                "cancelled",
              ]),
            ]),
        ),

      // Live first, because those are the quotes someone still has to act
      // on. Accepted ones belong to a confirmed booking, and the rest are
      // kept only as a record of what was sent.
      S.listItem()
        .title("Quotes")
        .id("quotes")
        .child(
          S.list()
            .title("Quotes")
            .items([
              filteredList(
                S,
                "Live: drafts & sent",
                "live-quotes",
                '_type == "quote" && status in ["draft", "sent"]',
                {},
                [{ field: "event.date", direction: "asc" }],
              ),
              typeInStatus(S, "quote", "Accepted", "accepted-quotes", ["accepted"]),
              typeInStatus(S, "quote", "Declined, expired & superseded", "past-quotes", [
                "declined",
                "expired",
                "superseded",
              ]),
              S.divider(),
              S.listItem()
                .title("All Quotes")
                .id("all-quotes")
                .child(S.documentTypeList("quote").title("All Quotes")),
            ]),
        ),
      S.listItem()
        .title("Waitlist")
        .id("waitlist")
        .child(
          S.list()
            .title("Waitlist")
            .items([
              typeInStatus(S, "waitlistEntry", "Waiting", "waiting", ["active"]),
              typeInStatus(S, "waitlistEntry", "Told the date is free", "notified", [
                "notified",
              ]),
              typeInStatus(S, "waitlistEntry", "Finished", "finished-waitlist", [
                "converted",
                "lapsed",
                "unsubscribed",
              ]),
              S.divider(),
              S.listItem()
                .title("Whole Waitlist")
                .id("all-waitlist")
                .child(S.documentTypeList("waitlistEntry").title("Whole Waitlist")),
            ]),
        ),

      S.divider().title("Venue"),

      // --- Packages -------------------------------------------------------
      S.listItem()
        .title("Packages & Menus")
        .id("packages-and-menus")
        .child(
          S.list()
            .title("Packages & Menus")
            .items([
              S.listItem()
                .title("Packages")
                .id("packages")
                .child(S.documentTypeList("weddingPackage").title("Packages")),
              childrenByParent(
                S,
                "Tiers by package",
                "tiers",
                "weddingPackage",
                "packageTier",
                "package",
              ),
              S.listItem()
                .title("Dishes")
                .id("dishes")
                .child(S.documentTypeList("menuDish").title("Dishes")),
              S.listItem()
                .title("Seasons")
                .id("seasons")
                .child(S.documentTypeList("season").title("Seasons")),
              S.divider(),
              childrenByParent(
                S,
                "Stations by category",
                "stations",
                "stationCategory",
                "station",
                "category",
              ),
              S.listItem()
                .title("Station Categories")
                .id("station-categories")
                .child(S.documentTypeList("stationCategory").title("Station Categories")),
              S.divider(),
              S.listItem()
                .title("Add-Ons & Set-Up")
                .id("add-ons")
                .child(S.documentTypeList("addOn").title("Add-Ons & Set-Up")),
            ]),
        ),

      // --- The venue ------------------------------------------------------
      S.listItem()
        .title("Spaces")
        .id("spaces")
        .child(S.documentTypeList("venueSpace").title("Spaces")),
      S.listItem()
        .title("Closures & Blackout Dates")
        .id("closures")
        .child(S.documentTypeList("venueClosure").title("Closures & Blackout Dates")),

      S.divider().title("Website"),

      // --- Editorial ------------------------------------------------------
      S.listItem()
        .title("Gallery")
        .id("gallery")
        .child(
          S.list()
            .title("Gallery")
            .items([
              ...GALLERY_CATEGORIES.map((category) =>
                filteredList(
                  S,
                  category.title,
                  category.value,
                  '_type == "galleryImage" && category == $category && image.isPlaceholder != true',
                  { category: category.value },
                  [{ field: "order", direction: "asc" }],
                ),
              ),
              filteredList(
                S,
                "Stand-ins, not shown",
                "stand-ins",
                '_type == "galleryImage" && image.isPlaceholder == true',
              ),
              S.divider(),
              S.listItem()
                .title("Whole Gallery")
                .id("all-gallery")
                .child(S.documentTypeList("galleryImage").title("Whole Gallery")),
            ]),
        ),
      S.listItem()
        .title("Testimonials")
        .id("testimonials")
        .child(
          S.list()
            .title("Testimonials")
            .items([
              typeInStatus(S, "testimonial", "Awaiting review", "awaiting-review", [
                "submitted",
              ]),
              typeInStatus(S, "testimonial", "Approved, not yet live", "approved", [
                "approved",
              ]),
              typeInStatus(S, "testimonial", "Published", "published-testimonials", [
                "published",
              ]),
              typeInStatus(S, "testimonial", "Withheld", "withheld", ["withheld"]),
              S.divider(),
              S.listItem()
                .title("All Testimonials")
                .id("all-testimonials")
                .child(S.documentTypeList("testimonial").title("All Testimonials")),
            ]),
        ),
      S.listItem()
        .title("Guide Articles")
        .id("guide-articles")
        .child(
          S.list()
            .title("Guide Articles")
            .items([
              typeInStatus(S, "guideArticle", "Ideas", "ideas", ["idea"]),
              typeInStatus(S, "guideArticle", "Drafts", "article-drafts", ["draft"]),
              typeInStatus(S, "guideArticle", "Blocked", "blocked", ["blocked"]),
              typeInStatus(S, "guideArticle", "Published", "published-articles", [
                "published",
              ]),
              S.divider(),
              S.listItem()
                .title("All Guide Articles")
                .id("all-guide-articles")
                .child(S.documentTypeList("guideArticle").title("All Guide Articles")),
            ]),
        ),
      S.listItem()
        .title("FAQs")
        .id("faqs")
        .child(S.documentTypeList("faq").title("FAQs")),
      S.listItem()
        .title("Suppliers")
        .id("suppliers")
        .child(
          S.list()
            .title("Suppliers")
            .items([
              filteredList(
                S,
                "On the website",
                "listed-suppliers",
                '_type == "supplier" && isPublished == true',
              ),
              filteredList(
                S,
                "Not on the website",
                "unlisted-suppliers",
                '_type == "supplier" && isPublished != true',
              ),
              S.divider(),
              S.listItem()
                .title("All Suppliers")
                .id("all-suppliers")
                .child(S.documentTypeList("supplier").title("All Suppliers")),
            ]),
        ),

      S.divider().title("Restaurant"),

      // --- Restaurant (parked) --------------------------------------------
      S.listItem()
        .title("Restaurant Menu (Parked)")
        .id("restaurant-menu")
        .child(S.documentTypeList("restaurantMenuSection").title("Restaurant Menu")),

      S.divider().title("Settings"),

      // --- Settings -------------------------------------------------------
      S.listItem()
        .title("Wedding Policy & Venue Facts")
        .id("wedding-policy")
        .child(S.document().schemaType("weddingPolicy").documentId("weddingPolicy")),
      S.listItem()
        .title("Site Settings")
        .id("site-settings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    ])
