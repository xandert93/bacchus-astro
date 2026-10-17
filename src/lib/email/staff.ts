// Who on Bacchus's team gets the site's staff emails, and the link from those
// emails into the Studio. Shared by every staff email (enquiries, deposits).

import type { SanityClient } from "@sanity/client"
import { STUDIO_URL } from "astro:env/server"
import { CONTACT } from "@data/contact"

/** Site Settings' "New-Enquiry Email Recipients", or the events inbox until set. */
export const staffRecipientsOrDefault = (recipients?: string[] | null) =>
  recipients?.length ? recipients : [CONTACT.email.display]

/** GROQ for the recipients, to fold into a query that's being made anyway. */
export const STAFF_RECIPIENTS_GROQ = `*[_id == "siteSettings"][0].enquiryNotificationEmails`

export const fetchStaffRecipients = async (client: SanityClient) =>
  staffRecipientsOrDefault(await client.fetch<string[] | null>(STAFF_RECIPIENTS_GROQ))

/** A document in the Studio, through Sanity's "open this document" link. */
export const studioLink = (documentId: string, type: string) =>
  STUDIO_URL ? `${STUDIO_URL}/intent/edit/id=${documentId};type=${type}` : undefined
