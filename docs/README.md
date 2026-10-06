# Documentation

Project documentation, grouped by the question each answers. Design decisions,
client-confirmed content facts and the known-bugs list live in the prototype's
`CLAUDE.md` (`../bacchus-prototype`), not here.

| Folder          | Answers                                   | Contents                                                                     |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `architecture/` | Why is the stack what it is?              | `tech-stack-research.md` — Astro/Sanity/Shopify/Stripe options weighed       |
| `operations/`   | How do we run and measure the live site?  | `analytics-and-measurement.md` — Vercel Analytics, Speed Insights, limits    |
| `content/`      | What is the raw client-supplied material? | `testimonials-raw.md` — the four real testimonials, before editorial picks   |

## Not in this folder

- **`bacchus-wedding-catalogue.pdf`** lives in `public/docs/`, because the
  site serves it at `/docs/bacchus-wedding-catalogue.pdf` (linked from the
  package pages). Keeping a second copy here would let the two drift.
- Never rebuild package lists from a text extraction of that PDF — it drops
  accented characters and whole words. Read the rendered pages.
