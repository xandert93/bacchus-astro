---
paths:
  - "src/**/*.{astro,css,js,ts}"
---

# Front-end work

This rule loads when Claude reads or edits a file under `src/`.

Before the first edit under `src/` in a session, read these in full (once per
session, not before every edit):

- `docs/design/design-system.md`: the design rules.
- `docs/engineering/known-bugs.md`: past bugs and the rule each one taught.
  Check whether the change touches any of them.
- `docs/design/decisions.md`: settled UX decisions. Don't undo one without
  saying so.
