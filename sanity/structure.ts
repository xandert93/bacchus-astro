import type { StructureBuilder, StructureResolver } from "sanity/structure"
import {
  DATE_BLOCKING_STATUSES,
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
 * sections rather than arbitrary breaks.
 *
 * `Open questions` at the foot is the one entry that is not a content type. It
 * is the working list of everything still waiting on the client, built from
 * the provenance records, and it earns its place because that list is
 * otherwise only reconstructable by re-reading a 49KB project file.
 */
/** A list of bookings in the given statuses, soonest event first. */
const bookingsInStatus = (
  S: StructureBuilder,
  title: string,
  id: string,
  statuses: readonly BookingStatus[],
) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == "booking" && status in $statuses')
        .params({ statuses })
        .defaultOrdering([{ field: "event.date", direction: "asc" }]),
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
              bookingsInStatus(S, "New: not replied to yet", "new", ["new"]),
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
      // on. Accepted ones belong to a confirmed booking, and expired or
      // superseded ones are kept only as a record of what was sent.
      S.listItem()
        .title("Quotes")
        .id("quotes")
        .child(
          S.list()
            .title("Quotes")
            .items([
              S.listItem()
                .title("Live: drafts & sent")
                .id("live-quotes")
                .child(
                  S.documentList()
                    .title("Live quotes")
                    .filter('_type == "quote" && status in ["draft", "sent"]')
                    .defaultOrdering([{ field: "event.date", direction: "asc" }]),
                ),
              S.listItem()
                .title("Accepted")
                .id("accepted-quotes")
                .child(
                  S.documentList()
                    .title("Accepted quotes")
                    .filter('_type == "quote" && status == "accepted"')
                    .defaultOrdering([{ field: "event.date", direction: "asc" }]),
                ),
              S.listItem()
                .title("Expired & superseded")
                .id("past-quotes")
                .child(
                  S.documentList()
                    .title("Expired & superseded quotes")
                    .filter('_type == "quote" && status in ["expired", "superseded"]')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
                ),
              S.divider(),
              S.listItem()
                .title("All quotes")
                .id("all-quotes")
                .child(S.documentTypeList("quote").title("All quotes")),
            ]),
        ),
      S.listItem()
        .title("Waitlist")
        .id("waitlist")
        .child(
          S.documentList()
            .title("Waitlist: active")
            .filter('_type == "waitlistEntry" && status == "active"')
            .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
        ),

      S.divider().title("Venue"),

      // --- Packages -------------------------------------------------------
      S.listItem()
        .title("Packages & menus")
        .id("packages-and-menus")
        .child(
          S.list()
            .title("Packages & menus")
            .items([
              S.listItem()
                .title("Packages")
                .id("packages")
                .child(S.documentTypeList("weddingPackage").title("Packages")),
              S.listItem()
                .title("Tiers & categories")
                .id("tiers")
                .child(S.documentTypeList("packageTier").title("Tiers & categories")),
              S.listItem()
                .title("Dishes")
                .id("dishes")
                .child(S.documentTypeList("menuDish").title("Dishes")),
              S.listItem()
                .title("Seasons")
                .id("seasons")
                .child(S.documentTypeList("season").title("Seasons")),
              S.divider(),
              S.listItem()
                .title("Stations")
                .id("stations")
                .child(S.documentTypeList("station").title("Stations")),
              S.listItem()
                .title("Station categories")
                .id("station-categories")
                .child(S.documentTypeList("stationCategory").title("Station categories")),
              S.divider(),
              S.listItem()
                .title("Add-ons & set-up")
                .id("add-ons")
                .child(S.documentTypeList("addOn").title("Add-ons & set-up")),
            ]),
        ),

      // --- The venue ------------------------------------------------------
      S.listItem()
        .title("Spaces")
        .id("spaces")
        .child(S.documentTypeList("venueSpace").title("Spaces")),
      S.listItem()
        .title("Closures & blackout dates")
        .id("closures")
        .child(S.documentTypeList("venueClosure").title("Closures")),

      S.divider().title("Website"),

      // --- Editorial ------------------------------------------------------
      S.listItem()
        .title("Gallery")
        .id("gallery")
        .child(S.documentTypeList("galleryImage").title("Gallery")),
      S.listItem()
        .title("Testimonials")
        .id("testimonials")
        .child(
          S.list()
            .title("Testimonials")
            .items([
              S.listItem()
                .title("Awaiting review")
                .id("awaiting-review")
                .child(
                  S.documentList()
                    .title("Awaiting review")
                    .filter('_type == "testimonial" && status == "submitted"'),
                ),
              S.listItem()
                .title("All testimonials")
                .id("all-testimonials")
                .child(S.documentTypeList("testimonial").title("All testimonials")),
            ]),
        ),
      S.listItem()
        .title("Guide articles")
        .id("guide-articles")
        .child(S.documentTypeList("guideArticle").title("Guide articles")),
      S.listItem()
        .title("FAQs")
        .id("faqs")
        .child(S.documentTypeList("faq").title("FAQs")),
      S.listItem()
        .title("Suppliers")
        .id("suppliers")
        .child(S.documentTypeList("supplier").title("Suppliers")),

      S.divider().title("Restaurant"),

      // --- Restaurant (parked) --------------------------------------------
      S.listItem()
        .title("Restaurant menu (parked)")
        .id("restaurant-menu")
        .child(S.documentTypeList("restaurantMenuSection").title("Restaurant menu")),

      S.divider().title("Settings"),

      // --- Settings -------------------------------------------------------
      S.listItem()
        .title("Wedding policy & venue facts")
        .id("wedding-policy")
        .child(S.document().schemaType("weddingPolicy").documentId("weddingPolicy")),
      S.listItem()
        .title("Site settings")
        .id("site-settings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider().title("For the build team"),

      // --- The working list -----------------------------------------------
      S.listItem()
        .title("Open questions for Bacchus")
        .id("open-questions")
        .child(
          S.list()
            .title("Open questions for Bacchus")
            .items([
              S.listItem()
                .title("Contested prices")
                .id("contested-prices")
                .child(
                  S.documentList()
                    .title("Contested prices")
                    .filter(
                      '_type == "packageTier" && price.provenance.status == "contested"',
                    ),
                ),
              S.listItem()
                .title("Unconfirmed space names")
                .id("unconfirmed-space-names")
                .child(
                  S.documentList()
                    .title("Unconfirmed space names")
                    .filter(
                      '_type == "venueSpace" && nameProvenance.status != "confirmed"',
                    ),
                ),
              S.listItem()
                .title("Placeholder images to replace")
                .id("placeholder-images")
                .child(
                  S.documentList()
                    .title("Placeholder images")
                    .filter(
                      '(_type == "galleryImage" && isPlaceholder == true) || (_type == "station" && image.isPlaceholder == true)',
                    ),
                ),
              S.listItem()
                .title("Copy changes awaiting approval")
                .id("copy-changes")
                .child(
                  // Dishes being their own documents is what lets this be one
                  // flat filter. While they were nested inside each tier's
                  // menu groups it took a traversal, and the station names
                  // were the only part a plain filter could reach.
                  S.documentList()
                    .title("Copy changes awaiting approval")
                    .filter(
                      '_type in ["menuDish", "station"] && defined(catalogueVariance) && catalogueVariance.clientApproved != true',
                    ),
                ),
              S.listItem()
                .title("Blocked articles")
                .id("blocked-articles")
                .child(
                  S.documentList()
                    .title("Blocked articles")
                    .filter('_type == "guideArticle" && status == "blocked"'),
                ),
            ]),
        ),
    ])
