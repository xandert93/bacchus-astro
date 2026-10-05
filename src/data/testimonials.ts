// The four real client testimonials (docs/testimonials-raw.md in the
// prototype). Read by Testimonials.astro, which renders the picker cards and
// dots from it at build time, and by testimonials.js, which renders the
// active quote and its meta line in the browser (the quote has to be
// measured there to truncate at five lines).
//
// <em>…</em> in a quote marks the gold-emphasised phrase — our own
// editorial pick, not the client's — and becomes a real <em> element.
export interface Testimonial {
  quote: string
  name: string
  category: string
  location: string
  date?: string
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We would like to express our appreciation and thanks for the <em>impeccable service you offered us on our wedding day</em>.",
    name: "Mandy & Gabriel Camenzuli",
    category: "Wedding celebration",
    location: "Malta",
    date: "26 April 2014",
    rating: 5,
  },
  {
    quote:
      "Thank you from the bottom of our hearts to all who shared our marriage in presence and thought! We had a <em>magical time and are still in a trance</em>!",
    name: "Mel & James Zammit",
    category: "Wedding celebration",
    location: "Malta",
    rating: 5,
  },
  {
    quote:
      "Had our wedding at Bacchus and I would definitely recommend it. <em>Food, venue and service were impeccable.</em> Thanks to Francois and his team our special day was extra special.",
    name: "Marvin W",
    category: "Wedding celebration",
    location: "Malta",
    rating: 5,
  },
  {
    quote:
      "Cannot thank them enough. An impeccable service from start to finish. They gave us a plenty of choice and helped us all way through. <em>The service on the day was impeccable and the food was sublime</em> with good portion sizes.",
    name: "Daniela C",
    category: "Wedding celebration",
    location: "Malta",
    rating: 5,
  },
]
