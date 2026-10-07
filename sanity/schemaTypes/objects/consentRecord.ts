import { defineField, defineType } from "sanity"

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
      title: "Consent given",
      type: "boolean",
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "givenAt",
      title: "Given at",
      type: "datetime",
      description: "Set by the submission handler, not by hand.",
    }),
    defineField({
      name: "wording",
      title: "Wording shown at the time",
      type: "text",
      rows: 3,
      description:
        "Captured verbatim from the form at submission. Edit the form copy freely afterwards — this stays as it was.",
    }),
    defineField({
      name: "sourcePage",
      title: "Submitted from",
      type: "string",
      description: "The page path the form was on. Five pages carry the wizard.",
    }),
    defineField({
      name: "retentionReviewAt",
      title: "Retention review date",
      type: "date",
      description:
        "When this record should be reviewed for deletion. Set from the policy default on creation; the scheduled purge reads this field.",
    }),
  ],
  preview: {
    select: { given: "given", at: "givenAt", page: "sourcePage" },
    prepare: ({ given, at, page }) => ({
      title: given ? "Consent given" : "No consent recorded",
      subtitle: [at ? new Date(at).toLocaleDateString("en-GB") : null, page]
        .filter(Boolean)
        .join(" — "),
    }),
  },
})
