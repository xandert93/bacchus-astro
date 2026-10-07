# Refactoring tools

Scripts in `scripts/` for proving a refactor changed nothing it shouldn't.

---

## Moving styles

`scripts/scope-styles.mjs <target> --select <regex>` moves matching rules out
of `global.css` (or out of another file with `--from <file>`, or copies with
`--keep`) and wraps foreign elements in `:global()` itself.

`scripts/list-selectors.mjs <file>` lists a file's rules, for planning.

---

## Proving nothing changed

1. `scripts/style-snapshot.mjs` before the change, and again after.
2. `scripts/style-diff.mjs` must show 0 changes.
3. `scripts/state-diff.mjs <old dist> <new dist>` must say "same" for every
   interaction state.
4. When markup moves into components or data, also run
   `scripts/markup-diff.mjs <old dist> <new dist>`. It compares every
   element's tag, attributes and text, which the style snapshot can't see.

---

## Known noise

- A few hundredths of a pixel in mobile text widths (seen between two
  snapshots of the SAME build), and in the photo carousel's transition
  timing. Anything else is real.
- A baseline taken on an earlier DAY shows calendar cells changing state (the
  seeded statuses are relative to today), so re-take it.
- Playwright failing with "Target page, context or browser has been closed"
  is the machine running out of headroom with too many parallel browsers,
  not the site. `playwright.config.ts` now runs two at a time for this
  reason; if it still happens, close other heavy apps and re-run.
- Node in Git Bash: `/tmp` means `C:\tmp`, not Git Bash's `/tmp`.
