# Ubiquitous Language

## Boss Content

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Boss** | A raid encounter that drops a sellable crystal when defeated | Raid, dungeon boss |
| **Boss Family** | A group of boss difficulties that share a weekly entry slot | Boss group, boss tier |
| **Boss Difficulty** | A specific tier within a **Boss Family** (Easy, Normal, Hard, Chaos, Extreme) | Boss level, boss rank |
| **Crystal** | A tradeable item dropped by a defeated **Boss**, sold to a vendor for mesos | Boss drop, crystal drop |
| **Crystal Value** | The fixed meso amount received when selling a **Crystal** from a specific **Boss** at a specific **Boss Difficulty** | Sell price, crystal price, meso value |

## Mule Content

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Mule** | A player character tracked for its potential weekly crystal income | Alt, character, toon |
| **Mule Name** | The in-game character name of a **Mule** | Character name |
| **Mule Level** | The current level of a **Mule** (1–300, display-only) | Level |
| **Mule Class** | The job/class of a **Mule** (free text, future: dropdown) | Job, role |
| **Potential Income** | The sum of all **Crystal Values** from bosses a **Mule** can defeat in one week | Weekly income, total income, max income |

## Mule Display

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Character Card** | A portrait card (2:3 ratio) showing a **Mule's** avatar, name, level, class, and **Potential Income** | Mule card, card |
| **Grid** | The responsive wrapping layout where all **Character Cards** are arranged | Card grid, grid area |
| **Drawer** | A side panel that slides from the right for editing a **Mule's** full details | Side drawer, detail panel, modal |
| **Drag Boundary** | The visible dotted border around the **Grid** that appears during drag, indicating the confinement area | Drag area, drop zone |

## Weekly Cycle

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Weekly Reset** | The point at which boss entry slots refresh, allowing bosses to be defeated again | Reset, weekly reset time |
| **Entry Slot** | A single boss opportunity per **Weekly Reset** — only one **Boss Difficulty** per **Boss Family** can be used per week | Boss entry, boss attempt |

## Party Content

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Party** | A group of 1–6 players who defeat a **Boss** together | Group, team |
| **Party Size** | The number of players (1–6) sharing the **Crystal Value** from a defeated **Boss** | N players |

## Aggregations

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Total Weekly Income** | The sum of all **Mules'** **Potential Income** across the entire roster | Global income, overall income |
| **Mule Preset** | A saved template of pre-selected bosses used to fast-create multiple **Mules** | Template, mule template |

## Relationships

- A **Boss Family** contains one or more **Boss Difficulties**
- A **Mule** selects at most one **Boss Difficulty** per **Boss Family** per **Weekly Reset** (mutual exclusivity)
- A **Boss Difficulty** has exactly one **Crystal Value**
- A **Mule** has one **Potential Income** = sum of selected **Crystal Values**
- **Total Weekly Income** = sum of all **Mules'** **Potential Incomes**
- **Crystal Value** is divided by **Party Size** (future: 1–6, default solo)
- A **Character Card** represents exactly one **Mule** in the **Grid**
- Clicking a **Character Card** or a pie chart slice opens the **Drawer** for that **Mule**
- The **Drag Boundary** is visible only while dragging within the **Grid**
- A **Character Card** cannot be dragged outside the **Grid** (confined)

## Example dialogue

> **Dev:** "When a **Mule** has both Hard Lucid and Normal Lucid selected, which **Crystal Value** counts toward **Potential Income**?"
> **Domain expert:** "That can't happen — they're in the same **Boss Family**. Only one **Boss Difficulty** per **Boss Family** counts per **Weekly Reset**. If you select Hard, Normal is automatically deselected."
> **Dev:** "So if I have 6 **Mules** and each selects Hard Lucid, does **Total Weekly Income** show 6x the Hard Lucid **Crystal Value**?"
> **Domain expert:** "Exactly. Each **Mule** has its own **Entry Slot** for each **Boss Family**. **Potential Income** per mule is independent."
> **Dev:** "What about the **Grid** — if I drag a **Character Card** outside the **Drag Boundary**, what happens?"
> **Domain expert:** "It snaps back. **Character Cards** are confined to the **Grid**. The **Drag Boundary** appears as a dotted border during drag so you see the confinement area."
> **Dev:** "And clicking the **Character Card** opens the **Drawer** — does that conflict with the drag?"
> **Domain expert:** "No — a click opens the **Drawer**, but a drag (movement beyond 5px) initiates reordering. They're distinguished by distance."

## Flagged ambiguities

- "Income" was used inconsistently — sometimes meaning a mule's individual total, sometimes the global sum. Canonical terms: **Potential Income** (per mule) and **Total Weekly Income** (all mules). **Resolved in code:** `calculateMuleIncome` → `calculatePotentialIncome`, `totalIncome` → `totalWeeklyIncome`, local `income` → `potentialIncome`.
- "Boss" was overloaded to mean both the encounter and the crystal it drops. Canonical separation: **Boss** = the encounter, **Crystal** = the sellable item, **Crystal Value** = the mesos received. **Resolved in code:** `mesoValue` → `crystalValue` on the `Boss` type and all boss data entries.
- "Entry" and "slot" were used interchangeably. Canonical term: **Entry Slot**. Not yet in code (future enhancement for daily/weekly distinction).
- "Preset" and "template" were used interchangeably. Canonical term: **Mule Preset**. Not yet in code (future enhancement).
- "Card" was used loosely to refer to both the old horizontal MuleCard and the new portrait Character Card. Canonical term: **Character Card** (the portrait representation in the **Grid**). The old MuleCard component has been removed.
- "Drawer", "side drawer", "detail panel", and "modal" were all used to describe the right-side editing panel. Canonical term: **Drawer**.