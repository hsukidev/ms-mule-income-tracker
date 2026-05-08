# List View uses a dedicated Drag Handle; Card View keeps full-surface drag

**Card View** treats the entire **Character Card** as the dnd-kit sortable handle — `useSortable`'s `attributes` and `listeners` are spread on the card root, and the **Mouse Sensor**'s `distance: 0` activation makes any mouse-press on the card a candidate drag. **List View** deliberately diverges: each row carries a per-row **Drag Handle** (40px wide in **Comfy**, 32px in **Compact**, full row-height) in its leftmost column, and reorder activates only from the handle; the rest of the row is plain click-to-open for the **Drawer**. The two **Roster Display Modes** therefore have non-uniform reorder gestures, and that non-uniformity is intentional.

The motivation is row-density precision. **List View** rows pack tightly (8px inter-row gap, ≤72px tall on **Comfy**, tighter on **Compact**), and a row's body holds three tappable affordances besides the row's own click target — **Notes Tooltip Trigger**, the **Weekly/Daily/Share** **MetricTooltips**, and the **Cap-Drop Info Tooltip Trigger**. With full-row drag activation, every miss on one of those triggers becomes a candidate reorder gesture under **Mouse Sensor** `distance: 0`, and on touch every long-press anywhere on the row engages the **Long-Press Gate**. Card View doesn't have this problem because cards are large, well-spaced, and visually unambiguous as a single hit target. Reusing "full-surface drag" in **List View** would import a **Card View** invariant into a surface where the geometry doesn't justify it.

## Considered Options

- **Use full-surface drag in **List View** to match **Card View** (keep uniformity).** Single mental model across **Roster Display Modes**, no new domain term, no new tab stop. Sacrifices row-body click precision: every row-body interaction becomes a candidate reorder, and the **Long-Press Gate** on touch fights the existing in-row tooltip triggers. Rejected.
- **Add a **Drag Handle** to **List View** rows; keep **Card View** full-surface (chosen).** Asymmetry between the two **Roster Display Modes**, but the asymmetry tracks a real geometric difference. Handle gets `setActivatorNodeRef` + `attributes` + `listeners`; row keeps `setNodeRef` plus its own `tabIndex` / `role="button"` / click-to-open. Two tab stops per row (handle for reorder, row body for drawer) — matches every "reorderable list" pattern users have seen.
- **Retrofit a **Drag Handle** into **Card View** as well (force uniformity the other direction).** Eliminates asymmetry but breaks the **Card View** card's clean visual identity, costs grid space on a layout that already pays for **Cap Drop Badge**, **Selection Indicator**, and the hover trash popover. No row-density justification for it. Rejected.

## Consequences

- **Mouse Sensor**, **Touch Sensor**, **Keyboard Sensor**, and the **Long-Press Gate** apply identically across both modes — only the activator surface changes. The **Touch Sensor**'s 250ms delay still gates the **Drag Handle** on touch.
- The "drag to reorder" hint in **Roster Header** stays static. Discoverability for **List View** rests on the **Drag Handle's** visible glyph, `cursor: grab`, hover bg-tint, and focus-visible ring.
- Two tab stops per **List View** row (handle + row body). The handle is a `<button>` for native a11y; the row body gets explicit `tabIndex={0}` + `role="button"` (previously inherited from `useSortable`'s `attributes`).
- **Bulk Delete Mode** swaps the **Drag Handle** for the **Selection Indicator** in the same column slot; column width is uniform across modes so toggling **Bulk Delete Mode** has no layout jolt.

If row geometry ever changes such that the row body has no in-row tooltip triggers — or if **Card View** density grows to match **List View**'s precision needs — revisit by collapsing the modes back to a single full-surface activation rule.
