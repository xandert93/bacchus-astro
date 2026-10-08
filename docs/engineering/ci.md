# Continuous integration (CI)

Every push to GitHub runs the project's checks on GitHub's own machines
(GitHub Actions), so the laptop doesn't have to. The workflow is
`.github/workflows/checks.yml`.

---

## What runs

Two jobs, side by side, on every push to any branch:

- **Format, lint and types**: `format:check`, `lint` (ESLint and Stylelint),
  `check`. A couple of minutes, most of it installing packages.
- **Build and end-to-end tests**: the live build (no drafts; it fails if one
  gets in), then the full Playwright suite against the draft build. Slower:
  it installs Chrome each time. The resized photos are cached between runs,
  so only changed photos are re-encoded.

A newer push to the same branch cancels the older run.

---

## Reading the result

- **On GitHub**: the repo's **Actions** tab lists every run. A green tick
  passed; a red cross failed, and clicking it shows the step and its output.
  The same tick or cross shows beside each commit and branch.
- **A failed test run** attaches the Playwright report (screenshots and
  traces) as `playwright-report`, at the bottom of the run's page.
- **From the terminal**, with the GitHub CLI (`gh`):
  - `gh run list --branch <branch>`: the latest runs for a branch.
  - `gh run watch`: follow a run live until it finishes.
  - `gh run view --log-failed`: just the output of what failed.

---

## The workflow, in short

1. Branch, change, commit.
2. Locally, only the quick checks (see `CLAUDE.md`, "Git workflow").
3. `git push -u origin <branch>`: CI starts.
4. Green: merge with `--no-ff`, push `main` (CI runs again there), delete
   the branch locally and on GitHub. Red: fix on the branch and push again.

Node's version is pinned in `.nvmrc`, which CI reads, so the laptop and CI
run the same one.

---

## Secrets

The build reads content from Sanity's private dataset, so CI needs
`SANITY_API_READ_TOKEN`. It's stored on GitHub (the repo's Settings → Secrets
and variables → Actions) and passed to every job by the `env` block at the
top of the workflow. GitHub hides its value in logs (`***`). To replace it:
`gh secret set SANITY_API_READ_TOKEN`, then paste the token when asked.
