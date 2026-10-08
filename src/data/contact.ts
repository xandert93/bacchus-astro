// The venue's published contact details, written once. The Visit section on
// every page, the deposit page's support cards, the footer's social links
// and the structured data search engines read (src/lib/structured-data.ts)
// all use them, so a new number or address changes everywhere at once.

export const CONTACT = {
  phone: {
    display: "+356 2145 4981",
    href: "tel:+35621454981",
  },
  email: {
    display: "events@bacchus.com.mt",
    href: "mailto:events@bacchus.com.mt",
  },
  address: {
    street: "1 Inguanez Street",
    locality: "Mdina",
    postcode: "MDN 1000",
    country: "Malta",
    // ISO 3166 code, for structured data.
    countryCode: "MT",
  },
  social: {
    facebook: "https://www.facebook.com/bacchusMdina",
    instagram: "https://www.instagram.com/bacchus_mdina/",
  },
}

// "1 Inguanez Street, Mdina MDN 1000, Malta"
export const ADDRESS_LINE = `${CONTACT.address.street}, ${CONTACT.address.locality} ${CONTACT.address.postcode}, ${CONTACT.address.country}`
