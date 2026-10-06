# Bacchus — Astro build

Production rebuild of the Bacchus site (restaurant + events venue, Mdina,
Malta). The vanilla HTML prototype lives next door in `../bacchus-prototype`;
it is frozen as of 2026-10-02 except for pitch-critical fixes, so changes are
not made in two places.

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
  its cause, fix and the test that guards it. Started fresh on 2026-10-06;
  "bug #N" in older code comments refers to the prototype's retired list.
- `docs/engineering/images.md`: photo keys, originals, formats and `sizes`.
- `docs/engineering/refactoring-tools.md`: the scripts that prove a style or
  markup refactor changed nothing.
- `docs/planning/roadmap.md`: migration phases, feature order and backlog.
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

- **Pages compose; components hold the markup.** Content that repeats or will
  come from Sanity lives in `src/data/`; one-off copy stays in the component
  that shows it.
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
- Links use extensionless routes (`/weddings`), not `weddings.html`. Pages not
  yet ported 404 in dev, as expected.
- **Whitespace is JSX-style (Astro 7's default `compressHTML: "jsx"`).** A
  line break between text and an inline element is DELETED, not rendered as a
  space. Write the space explicitly with `{" "}` at the end of the line
  (Prettier preserves these and adds them itself when it re-wraps a line that
  had a space). Porting the prototype lost 54 spaces this way ("ourBanquet",
  "RedLeicester"). `compressHTML: true` was tried and rejected: Prettier's
  Astro plugin formats with JSX rules, so the two would fight.
- The prototype's footer "Sandboxes" link was dropped deliberately: the
  sandboxes are pitch material, not production site.
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
- Before merging: `npm run check` at 0 errors, `npm run lint` clean,
  `npm run build` clean, and `npm run test:e2e` green when the change touches
  anything tested.
- Merge back with `git merge --no-ff <branch>` and git's default message
  (`Merge branch '<branch>'`), so the history shows each change as one
  group; then delete the branch. Merge commits are the one exception to the
  `type(scope)` format.
- `main` should always build and pass. Tiny docs-only edits to this file may
  go straight to `main`.
- **Push `main` to GitHub after every merge** (`git push origin main`).
  Feature branches stay local unless one wants review as a pull request.

## Checks and tests

- `npm run format` / `npm run format:check`: Prettier with
  `prettier-plugin-astro`, `printWidth: 90`. Format-on-save is set in
  `.vscode/settings.json`.
- `npm run lint` / `npm run lint:fix`: ESLint (`eslint.config.js`). Enforces
  arrow functions, `const`/`let` over `var`, and use before definition.
  `lint:fix` applies only fixes that can't change behaviour.
- `npm run check`: `astro check`, TypeScript across `.astro` and `.ts` files,
  including component props. Must stay at 0 errors.
- `npm run test:e2e`: Playwright, against a production build served by
  `astro preview` on port 4322 (never the dev server). Two projects:
  `desktop` runs everything; `mobile` (Pixel 7) runs only tests tagged
  `@mobile`. Specs live in `tests/e2e/`. `pages.spec.ts` loads every page and
  fails on any script error: **add each newly ported page to it.**
- When fixing a bug, add a test that fails without the fix, and confirm it
  does fail against the old code. Then add the bug to
  `docs/engineering/known-bugs.md`.
- Vitest is planned for pure logic (availability status, date maths, quote
  templating) once that logic is split out; nothing to unit test yet.

## Development

Start the dev server in background mode: `astro dev --background` (manage
with `astro dev stop`, `astro dev status`, `astro dev logs`). The user runs
`npm run dev` themselves. Build with `npm run build`.

Docs: https://docs.astro.build. This project is on Astro 7.x. Consult before
related work:
[routing](https://docs.astro.build/en/guides/routing/),
[components](https://docs.astro.build/en/basics/astro-components/),
[styling](https://docs.astro.build/en/guides/styling/),
[content collections](https://docs.astro.build/en/guides/content-collections/).
