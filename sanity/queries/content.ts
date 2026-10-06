/**
 * Content queries for the public pages.
 *
 * Written alongside the schema as a proof that it answers the pages the
 * prototype already has. Where a query encodes a rule rather than just
 * fetching fields, the rule is noted.
 */

/**
 * One package page — Reception, Banquet, High Tea or Beverage.
 *
 * Two things this query does that a naive one would not:
 *
 *   It carries `dietaryMarking` down to the page. The renderer needs it to
 *   suppress both the (V) badges and the foot-of-page legend line together on
 *   High Tea, whose catalogue source marks no dishes at all.
 *
 *   It filters prices by `blocksPublication`. The corkage figure exists in the
 *   data and must not reach the page, because its source never said whether it
 *   was per bottle or per person. Doing that here rather than in the template
 *   means every consumer inherits it — including the PDF quote generator.
 */
export const packagePageQuery = /* groq */ `
*[_type == "weddingPackage" && slug.current == $slug][0]{
  name,
  "slug": slug.current,
  role,
  tierStyle,
  dietaryMarking,
  cardSummary,
  heroHeading,
  heroIntro,
  heroImage{..., "alt": alt},
  allergenNote,
  notes[]{tone, body, placement, resolvesWith},
  seo,
  "tiers": *[_type == "packageTier" && package._ref == ^._id] | order(order asc){
    name,
    "slug": slug.current,
    order,
    summary,
    includedNote,
    "price": select(
      price.provenance.blocksPublication != true => price{
        amount, unit, isIndicative, vatIncluded, provenance
      }
    ),
    menuGroups[]{
      title,
      note,
      items[]{
        _type,
        _type == "menuItem" => {name, isVegetarian, note},
        _type == "wineEntry" => {name, grapes, producer, tastingNote, style}
      }
    },
    signatureDishes[]{name, isPlaceholderImage, image{..., "alt": alt}}
  }
}
`

/**
 * The reception stations, grouped by category.
 *
 * `lightboxDetail` is composed HERE, not stored. It is the serving note
 * followed by the item names joined with a middle dot — the same string the
 * current `data-detail` attribute holds by hand. Composing it in the query is
 * what keeps the sixteen stations from having two copies of their own item
 * lists, which is how a wording fix previously caught one occurrence of two
 * and looked like it had worked.
 */
export const stationsQuery = /* groq */ `
*[_type == "stationCategory"] | order(order asc){
  label,
  shortLabel,
  "slug": slug.current,
  labelProvenance,
  "stations": *[_type == "station" && category._ref == ^._id] | order(order asc){
    name,
    "slug": slug.current,
    servingNote,
    allItemsVegetarian,
    isChefsPick,
    price{amount, unit},
    "items": items[].name,
    "itemsWithDiet": items[]{name, isVegetarian},
    image{..., "alt": alt, "isPlaceholder": isPlaceholder},
    "lightboxDetail": servingNote + " " + array::join(items[].name, " · ")
  }
}
`

/** The gallery, filterable. Pass `$category` as null for everything. */
export const galleryQuery = /* groq */ `
*[
  _type == "galleryImage" &&
  ($category == null || category == $category)
] | order(coalesce(order, 9999) asc, _createdAt desc){
  "id": _id,
  title,
  alt,
  category,
  tags,
  year,
  isFeatured,
  isPlaceholder,
  image,
  "space": space->{name, "slug": slug.current},
  "credit": credit->{name, websiteUrl}
}
`

/**
 * Published testimonials for the rotator.
 *
 * `status == "published"` AND `consentName` — belt and braces on purpose.
 * Document validation already refuses to publish a named testimonial without
 * name consent, but validation can be bypassed by an API write, and this is
 * someone's real name on a real website. The read path checks too.
 */
export const testimonialsQuery = /* groq */ `
*[
  _type == "testimonial" &&
  status == "published" &&
  consentName == true
] | order(coalesce(order, 9999) asc){
  "id": _id,
  quote,
  displayName,
  rating,
  location,
  category,
  eventDate,
  "photo": select(consentPhoto == true => photo{..., "alt": alt})
}
`

/**
 * FAQs for a page.
 *
 * Unconfirmed facts ARE included here — a page can show one with its oxblood
 * warning treatment, which is the established pattern. That is the difference
 * between this and the assistant query below, and it is the reason provenance
 * is a status rather than a boolean.
 */
export const faqsForPageQuery = /* groq */ `
*[_type == "faq" && $page in showOnPages] | order(order asc){
  question,
  answer,
  topic,
  provenance
}
`

/**
 * FAQs the chat assistant may answer from.
 *
 * CONFIRMED ONLY, and only where explicitly released to the assistant. The
 * instruction "never invent pricing or availability" is not enforceable by
 * prompt alone — if the retrieval step hands the model the contested Banquet
 * price or a placeholder capacity figure, it will repeat it confidently and
 * sound right. This filter is the actual guardrail; the prompt is the backup.
 *
 * Availability is deliberately NOT retrievable at all. It is derived, live,
 * and date-specific, and a model paraphrasing a calendar is a model telling
 * someone a date is free. Point the assistant at the calendar instead.
 */
export const assistantFaqsQuery = /* groq */ `
*[
  _type == "faq" &&
  availableToAssistant == true &&
  provenance.status == "confirmed"
]{
  question,
  answer,
  topic
}
`

/** Venue spaces for the proposed spaces page and the wizard's option cards. */
export const venueSpacesQuery = /* groq */ `
*[_type == "venueSpace"] | order(coalesce(order, 9999) asc){
  name,
  "slug": slug.current,
  aliases,
  shortDescription,
  description,
  setting,
  capacity,
  includedInStandardPackage,
  inclusionNote,
  curfewNote,
  nameProvenance,
  "images": images[]->{image, alt, title}
}
`

/**
 * Everything still waiting on the client.
 *
 * Not a page query — a working list, and the reason provenance was made a
 * reusable type rather than a field on one document. It answers "what do we
 * still need to ask Bacchus" across the entire content set in one request,
 * instead of by re-reading a 49KB context file and hoping nothing was missed.
 *
 * The same shape backs the standing Todo of sending the client the list of
 * copy corrections made to their catalogue text: swap the provenance filter
 * for `defined(catalogueVariance)` and `clientApproved != true`.
 */
export const unresolvedFactsQuery = /* groq */ `
{
  "contestedPrices": *[
    _type == "packageTier" && price.provenance.status == "contested"
  ]{
    "package": package->name,
    name,
    "amount": price.amount,
    "conflictsWith": price.provenance.conflictingValue,
    "note": price.provenance.internalNote
  },
  "withheldPrices": *[
    _type in ["packageTier", "addOn"] && price.provenance.blocksPublication == true
  ]{_type, name, "reason": price.provenance.internalNote},
  "unconfirmedSpaceNames": *[
    _type == "venueSpace" && nameProvenance.status != "confirmed"
  ]{name, aliases, "status": nameProvenance.status},
  "placeholderCapacities": *[
    _type == "venueSpace" && capacity.provenance.status == "placeholder"
  ]{name, "max": capacity.max, "basis": capacity.basis},
  "placeholderImages": *[
    (_type == "galleryImage" && isPlaceholder == true) ||
    (_type == "station" && image.isPlaceholder == true)
  ]{_type, name, title},
  "blockedArticles": *[
    _type == "guideArticle" && status == "blocked"
  ]{title, blockedReason},
  // Station names carry their variance at the top level of the document, so
  // these are reachable directly.
  "unapprovedStationNames": *[
    _type == "station" &&
    defined(catalogueVariance) &&
    catalogueVariance.clientApproved != true
  ]{
    name,
    "wasPrinted": catalogueVariance.asPrinted,
    "kind": catalogueVariance.kind,
    "reason": catalogueVariance.reason
  },
  // Menu item and group variances are nested two and three levels inside a
  // tier, so they need their own traversal — a top-level defined() does NOT
  // reach them, which is worth stating because a query that silently returned
  // only the station names would look like it was working.
  "unapprovedMenuCopy": *[_type == "packageTier"]{
    "package": package->name,
    "tier": name,
    "groups": menuGroups[defined(catalogueVariance) && catalogueVariance.clientApproved != true]{
      title,
      "wasPrinted": catalogueVariance.asPrinted,
      "kind": catalogueVariance.kind
    },
    "items": menuGroups[].items[defined(catalogueVariance) && catalogueVariance.clientApproved != true]{
      name,
      "wasPrinted": catalogueVariance.asPrinted,
      "kind": catalogueVariance.kind
    }
  }[count(groups) > 0 || count(items) > 0]
}
`
