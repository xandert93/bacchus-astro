# Bacchus — Astro build

Production rebuild of the Bacchus site (restaurant + events venue, Mdina,
Malta).

Personal working preferences are in `CLAUDE.local.md` (gitignored).

This file holds only what every session needs. Detail lives in `docs/`
(indexed by `docs/README.md`); when adding something here, check whether it
belongs there instead.

## Reference docs

Not loaded at launch; read the relevant one before changing anything it
covers. Path-scoped rules in `.claude/rules/` make that automatic for the
code they cover.

- `docs/architecture/structure.md`: where everything in `src/` lives, the
  component map, `<Button>` and `<EnquirySection>`, styles and scripts
  ownership, scroll lock, lightbox, safe reveals.
- `docs/design/design-system.md`: palette, type, motion, layout, breakpoints
  and naming rules. **Read before changing anything visual.**
- `docs/design/decisions.md`: settled UX decisions and why.
- `docs/content/client-facts.md`: venue, packages, prices, policies, the open
  conflicts, what is placeholder, and questions for the client.
- `docs/content/catalogue-copy.md`: how catalogue text is proofed.
- `docs/engineering/known-bugs.md`: bugs found in the Astro build, each with
  its cause, fix and the test that guards it. Started fresh on 2026-10-06.
- `docs/engineering/images.md`: photo keys, originals, formats and `sizes`.
- `docs/engineering/ci.md`: the checks GitHub runs on every push, and how to
  read them.
- `docs/engineering/refactoring-tools.md`: the scripts that prove a style or
  markup refactor changed nothing.
- `docs/engineering/seo.md`: descriptions, canonical addresses, link
  previews, structured data and the sitemap.
- `docs/planning/roadmap.md`: migration phases, feature order and backlog.
- `docs/planning/sanity-rollout.md`: the CMS, step by step: what's built,
  the read token, the rebuild webhook, what's next.
- `docs/architecture/tech-stack.md`: the chosen stack and why, the live
  Shopify site, payments.

## Rules that apply everywhere

- **Never present an unconfirmed fact as settled** (prices, capacity, space
  names, policies). Unconfirmed or contested facts get the oxblood note; the
  two open conflicts stay flagged until the client settles them.
- **Real Bacchus photography only.** Never add fabricated imagery.
- **British English**, with accents restored on foreign words.
- **No abbreviated class names**: `.package-dining-card`, not `.pk-card`.
- **Check every breakpoint**; prefer `clamp()`; respect reduced motion.
- **Never write a media query by hand**: use the named ones from
  `src/lib/media-queries.js`, `@media (--below-desktop)`.
- **Content is visible by default**; an animation may never be what makes it
  appear.

## Where things go

The full map is `docs/architecture/structure.md`. The rules that decide it:

- **Pages compose; components hold the markup.** Content the client edits
  comes from Sanity through `src/lib/sanity/`; other repeated content lives in
  `src/data/`; one-off copy stays in the component that shows it.
- **Import with the path aliases** (`@components/…`, `@lib/…` and so on),
  never `../../../`.
- **A file with one owner sits beside it, named after it**
  (`PackageTierSection.css`, `EnquiryForm.js`); a page's own file gets a
  leading underscore (`_beverage.css`). `src/styles/` and `src/scripts/` hold
  only what has no single owner. **A new rule goes in the file that renders
  the element.**
- **Every button is `<Button>`.**
- Extract a component when the second copy is ported, not before: what
  varies between pages is only visible with two side by side.

## Conventions

- Comments in markup use `{/* */}`, not `<!-- -->`: JSX-style comments are
  stripped at build, HTML comments ship to every visitor.
- Never write a tag name with its angle bracket (a script tag, say) in a
  comment in an `.astro` file: the dev server's dependency scan reads it as a
  real one and fails (`known-bugs.md`, 2).
- Links use extensionless routes (`/weddings`), not `weddings.html`. Pages not
  yet ported 404 in dev, as expected.
- **Whitespace is JSX-style (Astro 7's default `compressHTML: "jsx"`).** A
  line break between text and an inline element is DELETED, not rendered as a
  space. Write the space explicitly with `{" "}` at the end of the line
  (Prettier preserves these and adds them itself when it re-wraps a line that
  had a space). Porting the prototype lost 54 spaces this way ("ourBanquet",
  "RedLeicester"). `compressHTML: true` was tried and rejected: Prettier's
  Astro plugin formats with JSX rules, so the two would fight.
- **Unfinished pages are drafts**, kept on `main` but never built for the
  live site: the page in `src/drafts/`, one entry in
  `src/drafts/registry.ts`. They show in `npm run dev`, listed at
  `/sandboxes` (linked from the footer only there). Details in
  `docs/architecture/structure.md`, "Draft pages".
- Commits: Conventional Commits, **always with a scope**:
  `type(scope): description`, e.g. `feat(weddings): port weddings page`.
  Lower-case imperative description, no trailing full stop. Scope is the area
  touched (a page, a component, `nav`, `enquiry`, `tooling`, `repo`). **No
  Claude co-author or attribution lines**, ever.

## Git workflow

Repo: `github.com/xandert93/bacchus-astro` (private), default branch `main`.

- **Every feature or fix gets its own branch off `main`**, named
  `type/short-description` using the same types as commits
  (`feat/gallery-page`, `fix/testimonials-touch-autoplay`). One branch per
  independent change, so each can be reviewed, merged or dropped alone. Say
  which branches were created when reporting back.
- Commit on the branch in `type(scope): description` form, as small logical
  commits.
- **Before pushing**, run only the quick checks locally: `npm run
format:check`, `npm run lint` and `npm run check`, plus the one spec file
  for what changed, if there is one. Not the full suite.
- **Push the branch; GitHub runs everything** (`.github/workflows/checks.yml`:
  the quick checks, the live build and the full Playwright suite). **Merge
  only once that run is green.** How to read it: `docs/engineering/ci.md`.
- **Fast lane**: a change only to comments, docs or copy needs just
  `format:check` and `lint` before pushing. CI still runs on it.
- The proof scripts in `docs/engineering/refactoring-tools.md` are for moving
  existing code between files, not for every change.
- Merge back with `git merge --no-ff <branch>` and git's default message
  (`Merge branch '<branch>'`), so the history shows each change as one
  group; then delete the branch. Merge commits are the one exception to the
  `type(scope)` format.
- `main` should always build and pass. Tiny docs-only edits to this file may
  go straight to `main`.
- **Push `main` to GitHub after every merge** (`git push origin main`), and
  delete the merged branch there too (`git push origin --delete <branch>`).

## Checks and tests

- `npm run format` / `npm run format:check`: Prettier with
  `prettier-plugin-astro`, `printWidth: 90`. Format-on-save is set in
  `.vscode/settings.json`.
- `npm run lint` / `npm run lint:fix`: ESLint (`eslint.config.js`) for
  scripts, then Stylelint (`stylelint.config.mjs`) for CSS, including
  `.astro` style blocks. ESLint enforces arrow functions, `const`/`let` over
  `var`, and use before definition; Stylelint enforces a blank line between
  CSS rules. `lint:fix` applies only fixes that can't change behaviour.
- `npm run check`: `astro check`, TypeScript across `.astro` and `.ts` files,
  including component props. Must stay at 0 errors.
- `npm run test:e2e`: Playwright, against a production build served by
  `astro preview` on port 4322 (never the dev server). Two projects:
  `desktop` runs everything; `mobile` (Pixel 7) runs only tests tagged
  `@mobile`. Specs live in `tests/e2e/`. `pages.spec.ts` loads every page and
  fails on any script error, and `seo.spec.ts` checks each one's search and
  link-preview tags: **add each newly ported page to
  `tests/e2e/site-pages.ts`**, the list both read.
- When fixing a bug, add a test that fails without the fix, and confirm it
  does fail against the old code. Then add the bug to
  `docs/engineering/known-bugs.md`.
- Vitest is planned for pure logic (availability status, date maths, quote
  templating) once that logic is split out; nothing to unit test yet.

## Development

Start the dev server in background mode: `astro dev --background` (manage
with `astro dev stop`, `astro dev status`, `astro dev logs`). The user runs
`npm run dev` themselves. Build with `npm run build`. Both read content from
Sanity and need `SANITY_API_READ_TOKEN` in `.env` (never committed).

Docs: https://docs.astro.build. This project is on Astro 7.x. Consult before
related work:
[routing](https://docs.astro.build/en/guides/routing/),
[components](https://docs.astro.build/en/basics/astro-components/),
[styling](https://docs.astro.build/en/guides/styling/),
[content collections](https://docs.astro.build/en/guides/content-collections/).
