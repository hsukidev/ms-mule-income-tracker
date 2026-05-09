# `useBulkDragPaint` stays surface-agnostic; deletability is a Dashboard concern

`useBulkDragPaint` is a 399-LOC gesture coordinator: pointer/touch state, **Original Snapshot**, **Brush** polarity, **Paint Range**, autoscroll rAF, touch long-press gate, **Scroll Preventer**. Its interface is deliberately narrow — `{ enabled, orderRef, isSelected, setSelected }` — and surface-agnostic: any element with `data-paint-target="<id>"` participates, whether it's a **Character Card**, a **List View** row, or a hypothetical future row variant. A refactor that pulled domain constraints into the hook ("can this **Mule** be deleted?", "does the paint range intersect the open **Drawer's** **Mule**?") has been considered. We are not doing it: those constraints belong to **Bulk Delete Mode**'s confirm step in **Dashboard**, not to the gesture itself. Reusing the hook for a non-delete drag-to-paint use case (e.g. drag-to-mark-active, drag-to-tag) would be impossible if delete-specific predicates lived inside it.

The hook's depth is its narrow interface. The deletion test points the right direction: removing it scatters all 399 LOC into **Dashboard** — pointer state refs, autoscroll constants, document listener attach/detach, the touch long-press timer, the **Scroll Preventer**'s non-passive `touchmove` handler. Each of those pieces is non-obvious; concentrating them behind `{ handlers, isPaintEngaged }` is exactly the leverage a deep module is supposed to deliver.

The autoscroll constants (`AUTOSCROLL_ZONE_PX = 100`, `AUTOSCROLL_MAX_PX_PER_FRAME = 14`, `TOUCH_LONG_PRESS_MS = 250`, `TOUCH_MOVE_CANCEL_PX = 5`) are tuned for the bulk-delete UX. Parameterising them without a second consumer is YAGNI; the hook can take options when a second consumer arrives.

## Considered Options

- **Surface a `canPaint(id)` predicate so the hook rejects strokes on undeletable mules / the open mule.** Rejected: those constraints are bulk-delete-specific. The hook would couple to a single use case it can otherwise host many.
- **Absorb the entire **Bulk Delete Lifecycle** (confirm step, undo, the open-mule guard) into the hook.** Rejected: the confirm step is a **Dashboard**-level coordination of selection state, the open **Drawer**, and the destructive action. Folding it into the gesture hook would conflate gesture mechanics with workflow.
- **Parameterise autoscroll tuning.** Deferred: no second consumer.
- **Keep the current shape (chosen).** Surface-agnostic gesture coordinator with a four-field domain interface; Dashboard owns deletability and confirmation.

If a second drag-to-paint use case lands (e.g. bulk **Active Toggle** flips), revisit autoscroll parameterisation then.
