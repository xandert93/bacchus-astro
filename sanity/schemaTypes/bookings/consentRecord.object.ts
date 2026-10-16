import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { formatDate, joinParts } from "../../lib/preview"

/**
 * What a person agreed to, when, and in what words.
 *
 * Bacchus is a Malta-registered business and its enquiry traffic is largely
 * EU residents, so every name, email and phone number this schema stores is
 * personal data under GDPR. Three things follow, and they are the reason this
 * object exists rather than a bare `consent: boolean`:
 *
 * 1. Consent has to be demonstrable, which means recording the WORDING shown
 *    at the time, not just that a box was ticked. The form's consent copy will
 *    be edited at some point; a boolean recorded against copy that no longer
 *    exists proves nothing.
 *
 * 2. Consent has to be timestamped and attributable to a source, which is why
 *    `givenAt` and `sourcePage` are here. The wizard already has the checkbox
 *    (`#consent` on every enquiry form) — this is where it lands.
 *
 * 3. Personal data needs a retention horizon. `retentionReviewAt` is the hook
 *    for the scheduled purge: a Cloudflare Cron Trigger (the same mechanism roadmap
 *    step 5 uses to transition Confirmed -> Completed) queries records past
 *    their review date. Without a date on the record there is nothing to
 *    query, and "we will delete it eventually" is not a retention policy.
 *
 * Two deployment notes that belong with this type rather than in a README
 * nobody re-reads:
 *   - The Sanity dataset should be created in the EU region. Sanity offers
 *     one; the default is US. Moving a dataset afterwards is an export and
 *     re-import, so this is a decision to get right once.
 *   - Staff who can read these documents are processing personal data. Sanity
 *     role assignment is the access control, and it should be least-privilege
 *     rather than everyone-is-an-administrator.
 *
 * None of the above is legal advice, and the retention periods are the
 * client's call, not ours — but the schema should not make the compliant
 * version harder to build than the non-compliant one.
 */
export default defineType({
  name: "consentRecord",
  title: "Consent",
  type: "object",
  fields: [
    defineField({
      name: "given",
      title: "Consent Given",
      type: "boolean",
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "givenAt",
      title: "Given at",
      type: "datetime",
      description: "Recorded automatically. Don't change it by hand.",
    }),
    defineField({
      name: "wording",
      title: "Wording Shown at the Time",
      type: "text",
      rows: 3,
      description: help(
        "The exact wording the person agreed to.",
        "It stays as it was, even if the form's wording changes later.",
      ),
    }),
    defineField({
      name: "sourcePage",
      title: "Submitted From",
      type: "string",
      description: "The page the form was on.",
    }),
    defineField({
      name: "retentionReviewAt",
      title: "Retention Review Date",
      type: "date",
      description: help(
        "When this person's details should be reviewed for deletion.",
        "Set automatically. Records past this date are deleted by a scheduled job.",
      ),
    }),
  ],
  preview: {
    select: { given: "given", at: "givenAt", page: "sourcePage" },
    prepare: ({ given, at, page }) => ({
      title: given ? "Consent given" : "No consent recorded",
      subtitle: joinParts(formatDate(at), page),
    }),
  },
})
