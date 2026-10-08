/**
 * Content queries not yet used by the site.
 *
 * Written alongside the schema as a proof that it answers the pages the
 * prototype already has. Where a query encodes a rule rather than just
 * fetching fields, the rule is noted.
 *
 * Once the site reads a type, its query moves to the module that uses it, in
 * `src/lib/sanity/` (packages, stations, gallery and testimonials so far), so
 * each query has one copy, beside the code that depends on its shape.
 */

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
 * It also answers the standing Todo of sending the client the list of copy
 * corrections made to their catalogue text — see `unapprovedCopyChanges`
 * below, which became a flat filter once dishes were normalised into
 * documents of their own.
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
  // Photos we only have as compressed web copies: the list of originals to
  // ask Bacchus for.
  "webCopyImages": *[
    (_type == "galleryImage" && isWebCopy == true) ||
    (_type == "station" && image.isWebCopy == true) ||
    (_type == "packageTier" && count(signatureDishes[image.isWebCopy == true]) > 0)
  ]{_type, name, title},
  "blockedArticles": *[
    _type == "guideArticle" && status == "blocked"
  ]{title, blockedReason},
  // Dishes and stations are both documents carrying their variance at the top
  // level, so this is one flat filter. It used to need a separate traversal
  // through every tier's nested menu groups to reach the dishes, which is a
  // concrete second benefit of normalising them: the list of changes to send
  // the client is now a query anyone can read.
  "unapprovedCopyChanges": *[
    _type in ["menuDish", "station"] &&
    defined(catalogueVariance) &&
    catalogueVariance.clientApproved != true
  ]{
    _type,
    name,
    "wasPrinted": catalogueVariance.asPrinted,
    "kind": catalogueVariance.kind,
    "reason": catalogueVariance.reason
  },
  // Group titles are the one place a variance is still nested, since a group
  // is an inline object inside a tier rather than a document of its own.
  "unapprovedGroupTitles": *[_type == "packageTier"]{
    "tier": name,
    "groups": menuGroups[defined(catalogueVariance) && catalogueVariance.clientApproved != true]{
      title,
      "wasPrinted": catalogueVariance.asPrinted,
      "kind": catalogueVariance.kind
    }
  }[count(groups) > 0],
  "unconfirmedSeasons": *[
    _type == "season" && provenance.status != "confirmed"
  ]{name, startDate, endDate, repeatsAnnually, "status": provenance.status}
}
`
