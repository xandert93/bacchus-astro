---
paths:
  - "src/data/**/*"
  - "src/pages/weddings/packages/**/*"
  - "src/components/packages/**/*"
---

# Package and client content

This rule loads when Claude reads or edits package data, package pages or
package components.

Before the first edit to any of these in a session, read these in full (once
per session):

- `docs/content/client-facts.md`: what is confirmed, unconfirmed or
  contested. Never present an unconfirmed fact as settled.
- `docs/content/catalogue-copy.md`: how catalogue text is proofed.
