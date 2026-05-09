# `DISPLAY_ORDER` stays in `muleBossSlate`; preset family integrity guarded by test, not refactor

`bosses.ts` (the catalog) and `bossPresets.ts` (the **Canonical Presets**) reference each other across two distinct seams, and `muleBossSlate.ts` carries `DISPLAY_ORDER` — a 32-family list driving **Boss Matrix** row order. Two refactors have been considered: (1) move `DISPLAY_ORDER` into the boss catalog as a per-boss `displayIndex` field; (2) shift `PRESET_FAMILIES` entries from family-string references (`'cygnus'`) to boss-id references (UUIDs). We are doing neither.

`DISPLAY_ORDER` is already cross-referenced at module load: `bossesByDisplayOrder = DISPLAY_ORDER.map(...)` throws `Error('DISPLAY_ORDER references unknown family: ...')` if any family slug fails to resolve. A typo or stale entry fails at boot, not silently. Moving the array onto each `Boss` as `displayIndex` would couple catalog data to a single UI's ordering (only the **Boss Matrix** consumes it) and scatter the "what comes first" question across 32 entries instead of one list.

Shifting `PRESET_FAMILIES` to boss-id references would replace human-readable slugs (`'cygnus'`, `'pink-bean'`) with UUIDs (`'a4d1238d-1519-4ea0-bada-…'`), making the preset definitions unreadable for the modest gain of catching renames at compile time. The actual problem — `entryByBossId` silently skipping `normalizeEntry` returns of `null` — is better solved by a referential-integrity test that fails loud when any preset entry's family doesn't resolve to a known boss.

## What ships

A test (next to `bossPresets.test.ts`) asserting every entry in `PRESET_FAMILIES.CRA`, `PRESET_FAMILIES.LOMIEN`, and `PRESET_FAMILIES.CTENE` resolves via `getBossByFamily(...)`. Failure mode: a renamed family slug or a typo fails the test; the silent-skip in `entryByBossId` becomes loud at CI, not at runtime.

## Considered Options

- **Move `DISPLAY_ORDER` into the boss catalog as `displayIndex`.** Rejected: catalog data shouldn't carry a single UI's ordering; the array's centralised position is correct locality for the **Boss Matrix** projection.
- **Shift `PRESET_FAMILIES` entries to boss-id references.** Rejected: UUIDs are unreadable; the silent-skip case is a test problem, not an authoring-form problem.
- **Add a referential-integrity test only (chosen).** Catches the only failure mode that's currently silent; preserves the readable preset authoring form and the centralised display order.

If a future surface needs a different boss order (e.g. a "by **Crystal Value**" view), revisit by parameterising `getFamilies` rather than reshaping the catalog.
