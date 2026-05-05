# Changesets

When your PR introduces a user-facing change, drop a markdown file in this directory:

```
.changes/<short-slug>.md
```

```markdown
---
bump: minor
category: feature
---

Add dark mode toggle to the settings page.
```

- **`bump`** — one of `patch`, `minor`, `major`. Drives the version number.
- **`category`** — one of `feature`, `ui`, `fix`. Drives which section the bullet renders under on `/changelog`. Independent of `bump`.
- **Body** — one line. Becomes a bullet on the changelog page.

See `docs/RELEASING.md` for when to use which `bump` and `category`.

Internal-only changes (refactors, dep bumps, build tooling, tests) don't need a changeset.

To cut a release, run `pnpm release` and follow the prompts. Full workflow: `docs/RELEASING.md`.
