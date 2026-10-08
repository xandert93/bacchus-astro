import type { StructureResolver } from "sanity/structure"

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
 * this sidebar — which makes "Enquiries & bookings" the first thing in it, and
 * the pending list the first thing inside that.
 *
 * `Open questions` at the foot is the one entry that is not a content type. It
 * is the working list of everything still waiting on the client, built from
 * the provenance records, and it earns its place because that list is
 * otherwise only reconstructable by re-reading a 49KB project file.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Bacchus")
    .items([
      // --- Enquiries ------------------------------------------------------
      S.listItem()
        .title("Enquiries & bookings")
        .id("enquiries")
        .child(
          S.list()
            .title("Enquiries & bookings")
            .items([
              S.listItem()
                .title("Pending — need a reply")
                .id("pending")
                .child(
                  S.documentList()
                    .title("Pending enquiries")
                    .filter('_type == "booking" && status == "pending"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("Confirmed")
                .id("confirmed")
                .child(
                  S.documentList()
                    .title("Confirmed bookings")
                    .filter('_type == "booking" && status == "confirmed"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("All bookings")
                .id("all-bookings")
                .child(S.documentTypeList("booking").title("All bookings")),
              S.divider(),
              S.listItem()
                .title("Waitlist")
                .id("waitlist")
                .child(
                  S.documentList()
                    .title("Waitlist — active")
                    .filter('_type == "waitlistEntry" && status == "active"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("Closures & blackout dates")
                .id("closures")
                .child(S.documentTypeList("venueClosure").title("Closures")),
            ]),
        ),

      // --- Quotes ---------------------------------------------------------
      S.listItem()
        .title("Quotes")
        .id("quotes")
        .child(S.documentTypeList("quote").title("Quotes")),

      S.divider(),

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

      S.divider(),

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

      S.divider(),

      // --- Restaurant (parked) --------------------------------------------
      S.listItem()
        .title("Restaurant menu (parked)")
        .id("restaurant-menu")
        .child(S.documentTypeList("restaurantMenuSection").title("Restaurant menu")),

      S.divider(),

      // --- Settings -------------------------------------------------------
      S.listItem()
        .title("Wedding policy & venue facts")
        .id("wedding-policy")
        .child(S.document().schemaType("weddingPolicy").documentId("weddingPolicy")),
      S.listItem()
        .title("Site settings")
        .id("site-settings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider(),

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
