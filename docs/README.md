# Documentation

Project documentation, grouped by the question each folder answers. These
files replace the prototype's old all-in-one `CLAUDE.md` and are the source
of truth for design, content facts and known bugs.

| Folder          | Answers                                  | Contents                                                                     |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `design/`       | How should it look and behave?           | `design-system.md` — the rules · `decisions.md` — settled choices and why    |
| `content/`      | What do we know about the client?        | `client-facts.md` · `catalogue-copy.md` · `testimonials-raw.md`              |
| `engineering/`  | What has broken before?                  | `known-bugs.md` — numbered lessons, cited in code comments                   |
| `planning/`     | What's next?                             | `roadmap.md` — feature order, backlog                                        |
| `architecture/` | Why is the stack what it is?             | `tech-stack.md` — the chosen stack, options weighed, the live site, payments |
| `operations/`   | How do we run and measure the live site? | `analytics-and-measurement.md` — Vercel Analytics, Speed Insights, limits    |

## Not in this folder

- **`bacchus-wedding-catalogue.pdf`** lives in `public/docs/`, because the
  site serves it at `/docs/bacchus-wedding-catalogue.pdf` (linked from the
  package pages). Keeping a second copy here would let the two drift.
- **The Sanity schemas** are still in `../bacchus-prototype/sanity/`.
