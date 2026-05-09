# `muleMigrate` reaching into the data layer stays; no `MuleFactory` extraction

`persistence/muleMigrate.ts` calls `MuleBossSlate.from(...)`, `getBossById(...)`, and `isWorldId(...)` from inside `validateMule`. A refactor that lifts per-**Mule** validation into a `MuleFactory.from(raw)` in the data layer — with `muleMigrate` reduced to a pure schema transformer — has been considered. We are not building it: the calls into the data layer are not a leaking of persistence concerns, they're the migration boundary correctly delegating validation to the modules that own each invariant. Following ADR-0002, `MuleBossSlate.from` is _the_ validation seam for **Slate Keys**; pulling that call up into a new `MuleFactory` would re-introduce a layer that calls the same constructor with no added behaviour, satisfying the deletion test in the wrong direction.

The shape of the migration boundary today:

- `parsePayload` → schema-version dispatch into `LoadMode`. Owns the **Schema Lineage**.
- `validateMule` → type guards on the raw object, mode-specific `selectedBosses` handling, optional-field guards, **Active Default**.
- `MuleBossSlate.from` → enforces the **Selection Invariant** and trims to **Weekly Crystal Cap**.
- `isWorldId` / `getBossById` → catalog membership checks at the persistence boundary.

Each reach is the migration calling the canonical validator for _that specific kind of input_. A `MuleFactory.from(raw, { mode })` would either pass through to those same validators (zero added depth) or duplicate their logic (worse). The only candidate worth extracting is the type-guard cluster (`typeof obj.id !== 'string' || typeof obj.name !== 'string' || …`) into a typed parser — and that's a code-quality nit, not an architectural deepening.

## Considered Options

- **Extract `MuleFactory.from(raw, { mode })` in the data layer; reduce `muleMigrate` to schema transformation.** Rejected: the function would be a thin coordinator that calls `MuleBossSlate.from`, `isWorldId`, and `getBossById` at the same seam they're called today, just from a different file. Migration vocabulary (`LoadMode`, `upgradeV2Key`) would either come along or stay split — both worse than today.
- **Keep the current shape (chosen).** Migration owns schema-version dispatch and field-shape guards; data-layer modules own their own invariants and are called at the boundary that needs them. ADR-0002's stance applies here too.
- **Extract only the type-guard cluster into a `parseMuleShape(raw)` helper.** Possible code-quality follow-up; not architectural. Defer until the cluster grows.

If a second persistence path (e.g. cloud sync, **Transfer Code** import) needs the same validation pipeline and the cluster shows real duplication, revisit by extracting then — driven by a real second consumer, not a hypothetical one.
