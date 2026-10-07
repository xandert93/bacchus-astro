# Documentation

Project documentation, grouped by the question each folder answers. These
files replace the prototype's old all-in-one `CLAUDE.md` and are the source
of truth for design, content facts and bugs.

| Folder          | Answers                                  | Contents                                                                            |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `design/`       | How should it look and behave?           | `design-system.md` — the rules · `decisions.md` — settled choices and why           |
| `content/`      | What do we know about the client?        | `client-facts.md` · `catalogue-copy.md` · `testimonials-raw.md`                     |
| `engineering/`  | How is it built, and what has broken?    | `known-bugs.md` — cause, fix, test · `images.md` · `refactoring-tools.md` · `ci.md` |
| `planning/`     | What's next?                             | `roadmap.md` — migration phases, feature order, backlog                             |
| `architecture/` | How is the code laid out, and why?       | `structure.md` — where things live · `tech-stack.md` — the stack, payments          |
| `operations/`   | How do we run and measure the live site? | `analytics-and-measurement.md` — Vercel Analytics, Speed Insights, limits           |

## Not in this folder

- **`bacchus-wedding-catalogue.pdf`** lives in `public/docs/`, because the
  site serves it at `/docs/bacchus-wedding-catalogue.pdf` (linked from the
  package pages). Keeping a second copy here would let the two drift.
- **The Sanity schemas** are in `sanity/` at the repo root.
