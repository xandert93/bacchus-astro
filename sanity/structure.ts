import type { StructureResolver } from "sanity/structure"

/**
 * Studio navigation.
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
        .child(
          S.list()
            .title("Enquiries & bookings")
            .items([
              S.listItem()
                .title("Pending — need a reply")
                .child(
                  S.documentList()
                    .title("Pending enquiries")
                    .filter('_type == "booking" && status == "pending"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("Confirmed")
                .child(
                  S.documentList()
                    .title("Confirmed bookings")
                    .filter('_type == "booking" && status == "confirmed"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("All bookings")
                .child(S.documentTypeList("booking").title("All bookings")),
              S.divider(),
              S.listItem()
                .title("Waitlist")
                .child(
                  S.documentList()
                    .title("Waitlist — active")
                    .filter('_type == "waitlistEntry" && status == "active"')
                    .defaultOrdering([{ field: "eventDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("Closures & blackout dates")
                .child(S.documentTypeList("venueClosure").title("Closures")),
            ]),
        ),

      // --- Quotes ---------------------------------------------------------
      S.listItem().title("Quotes").child(S.documentTypeList("quote").title("Quotes")),

      S.divider(),

      // --- Packages -------------------------------------------------------
      S.listItem()
        .title("Packages & menus")
        .child(
          S.list()
            .title("Packages & menus")
            .items([
              S.listItem()
                .title("Packages")
                .child(S.documentTypeList("weddingPackage").title("Packages")),
              S.listItem()
                .title("Tiers & categories")
                .child(S.documentTypeList("packageTier").title("Tiers & categories")),
              S.listItem()
                .title("Dishes")
                .child(S.documentTypeList("menuDish").title("Dishes")),
              S.listItem()
                .title("Seasons")
                .child(S.documentTypeList("season").title("Seasons")),
              S.divider(),
              S.listItem()
                .title("Stations")
                .child(S.documentTypeList("station").title("Stations")),
              S.listItem()
                .title("Station categories")
                .child(S.documentTypeList("stationCategory").title("Station categories")),
              S.divider(),
              S.listItem()
                .title("Add-ons & set-up")
                .child(S.documentTypeList("addOn").title("Add-ons & set-up")),
            ]),
        ),

      // --- The venue ------------------------------------------------------
      S.listItem()
        .title("Spaces")
        .child(S.documentTypeList("venueSpace").title("Spaces")),

      S.divider(),

      // --- Editorial ------------------------------------------------------
      S.listItem()
        .title("Gallery")
        .child(S.documentTypeList("galleryImage").title("Gallery")),
      S.listItem()
        .title("Testimonials")
        .child(
          S.list()
            .title("Testimonials")
            .items([
              S.listItem()
                .title("Awaiting review")
                .child(
                  S.documentList()
                    .title("Awaiting review")
                    .filter('_type == "testimonial" && status == "submitted"'),
                ),
              S.listItem()
                .title("All testimonials")
                .child(S.documentTypeList("testimonial").title("All testimonials")),
            ]),
        ),
      S.listItem()
        .title("Guide articles")
        .child(S.documentTypeList("guideArticle").title("Guide articles")),
      S.listItem().title("FAQs").child(S.documentTypeList("faq").title("FAQs")),
      S.listItem()
        .title("Suppliers")
        .child(S.documentTypeList("supplier").title("Suppliers")),

      S.divider(),

      // --- Restaurant (parked) --------------------------------------------
      S.listItem()
        .title("Restaurant menu (parked)")
        .child(S.documentTypeList("restaurantMenuSection").title("Restaurant menu")),

      S.divider(),

      // --- Settings -------------------------------------------------------
      S.listItem()
        .title("Wedding policy & venue facts")
        .id("weddingPolicy")
        .child(S.document().schemaType("weddingPolicy").documentId("weddingPolicy")),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider(),

      // --- The working list -----------------------------------------------
      S.listItem()
        .title("Open questions for Bacchus")
        .child(
          S.list()
            .title("Open questions for Bacchus")
            .items([
              S.listItem()
                .title("Contested prices")
                .child(
                  S.documentList()
                    .title("Contested prices")
                    .filter(
                      '_type == "packageTier" && price.provenance.status == "contested"',
                    ),
                ),
              S.listItem()
                .title("Unconfirmed space names")
                .child(
                  S.documentList()
                    .title("Unconfirmed space names")
                    .filter(
                      '_type == "venueSpace" && nameProvenance.status != "confirmed"',
                    ),
                ),
              S.listItem()
                .title("Placeholder images to replace")
                .child(
                  S.documentList()
                    .title("Placeholder images")
                    .filter(
                      '(_type == "galleryImage" && isPlaceholder == true) || (_type == "station" && image.isPlaceholder == true)',
                    ),
                ),
              S.listItem().title("Copy changes awaiting approval").child(
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
                .child(
                  S.documentList()
                    .title("Blocked articles")
                    .filter('_type == "guideArticle" && status == "blocked"'),
                ),
            ]),
        ),
    ])
