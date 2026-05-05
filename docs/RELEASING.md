# Releasing

YABI uses a lightweight per-PR changeset workflow that rolls up into a new entry on the user-facing [`/changelog`](../src/routes/changelog.tsx) page.

## TL;DR — going from `1.0.0` to `1.1.0`

1. While building features, drop a markdown file in `.changes/` per change:

   ```markdown
   ---
   bump: minor
   category: feature
   ---

   Add dark mode toggle to the settings page.
   ```

2. Open and merge PRs as normal. Files accumulate in `.changes/`.
3. When you're ready to ship a release:
   ```bash
   pnpm release
   ```
   The script detects max bump = `minor`, proposes `1.1.0`, prompts for an optional headline, prepends an entry to `src/data/changelog.ts`, bumps `package.json`, deletes the `.changes/*.md` files, commits as `release: v1.1.0`, and tags `v1.1.0`.
4. Push and deploy:
   ```bash
   git push --follow-tags
   pnpm deploy:prod
   ```

## When to use `patch`, `minor`, `major`

Versions here are **communicative** — they tell users how big a release is. There's no API contract. Use this rubric:

- **`major`** — Returning user opens the app and says "whoa, this is different." Redesigns, removed features, restructured navigation, rebrands.
- **`minor`** — There's something new the user can do. New feature, new page, new toggle, new dashboard widget.
- **`patch`** — Things that worked yesterday work better today. Bug fixes, copy tweaks, small visual polish, performance, accessibility fixes.
- **No changeset** — Internal-only changes (refactors, dependency bumps, build tooling, test improvements). They don't appear on the user-facing changelog.

## When to use `feature`, `ui`, `fix`

`category` controls which section the bullet renders under on `/changelog` (Features → UI Enhancements → Bug Fixes). It's **independent** of `bump` — a small UI tweak is `bump: patch, category: ui`; a bug fix that's also a behavior change might be `bump: minor, category: fix`.

- **`feature`** — A new capability the user didn't have before. New page, new toggle, new data model field, new export.
- **`ui`** — Existing functionality, but the UI is now better/clearer/more polished. Re-positioning, visual tweaks, additive nav affordances, improved layouts.
- **`fix`** — Something was broken or behaving wrong; this corrects it. Includes restoring a regression.

Rule of thumb: if the user could already do this thing, but it now looks/feels better → `ui`. If the user couldn't do it before → `feature`. If the user _thought_ they could do it but it didn't actually work → `fix`.

The release version is the **max** of all pending bumps:

| Pending changesets         | Result            |
| -------------------------- | ----------------- |
| 3× `patch`                 | `x.y.z+1` (patch) |
| 1× `minor` + 2× `patch`    | `x.y+1.0` (minor) |
| 1× `major` + anything else | `x+1.0.0` (major) |

## Changeset file format

```
.changes/<short-slug>.md
```

```markdown
---
bump: patch
category: fix
---

One-line summary of the change. Becomes a bullet on the changelog page.
```

- **Filename** is just for human readability. Has no semantic meaning, but bullets within a category section are ordered by filename — prefix with `01-`, `02-`, etc. if you care about ordering.
- **Frontmatter** has two fields, both required: `bump` and `category`.
- **Body** is one line. Multiple lines in the body get joined with spaces.

## What `pnpm release` does

1. **Verifies the working tree is clean** outside `.changes/`. Aborts otherwise — you don't want a release commit bundling unrelated WIP.
2. **Loads pending changesets** from `.changes/*.md` (sorted by filename). Aborts if empty.
3. **Computes the proposed version** by taking the max bump and applying it to the current `package.json` version.
4. **Prompts** for an optional version override, an optional headline, and final confirmation.
5. **Writes**:
   - Prepends a new entry to `src/data/changelog.ts`.
   - Bumps `package.json`.
   - Deletes the `.changes/*.md` files (the directory itself stays, kept by `.gitkeep`).
6. **Commits** the changes with message `release: vX.Y.Z`.
7. **Tags** the commit `vX.Y.Z`.

The script does **not** push or deploy — those are separate, deliberate steps.

## Recovery

If the commit fails (e.g., a pre-commit hook rejected it), the script prints recovery instructions:

```bash
git restore --staged .
git checkout -- src/data/changelog.ts package.json
git checkout -- .changes/
```

This restores the deleted changeset files and reverts the bump.
