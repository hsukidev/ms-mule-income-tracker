# Redesign: Mule Income Tracker — Soft Dusk Sky

## Context
The app is a MapleStory Reboot weekly-income tracker: cards for each mule, a donut chart of the income split, and a drawer for picking bosses per character. The design follows a **soft dusk sky** aesthetic — deep navy backgrounds fading through muted teal to warm golden amber, with soft coral-rose for destructive states. The feel is calm, atmospheric, and gently warm, like twilight settling over the world.

## Aesthetic Manifesto
- **Vision**: soft dusk sky — deep navy-blue surfaces with blue undertone, warm golden-amber primary accent, muted teal secondary, and soft amber numerics. Stats read with amber clarity against indigo surfaces. The palette traces a twilight gradient: deep navy → teal → gold → coral.
- **Type pair**: **Outfit Variable** (display, clean geometric sans) + **Manrope Variable** (body sans) + **JetBrains Mono Variable** (numerics/levels). Geometric and precise.
- **Palette**: Primary accent golden-amber `hsl(38 70% 46%)` light / `hsl(38 65% 58%)` dark. Secondary teal `hsl(175 35% 46%)` light / `hsl(175 30% 50%)` dark. Numeric display warm amber `hsl(38 65% 48%)` light / `hsl(38 55% 65%)` dark. Destructive soft coral-rose `hsl(8 65% 52%)` / `hsl(8 60% 52%)`. All neutrals carry a subtle blue undertone (hue ~228-230) for cohesion with the dusk sky atmosphere.
- **Surface philosophy**: navy-tinted darks (hue ~228, never pure gray), cards as layered dusk surfaces with subtle borders and warm amber glow effects. Hover states glow with golden light like the last rays of sun.

---

## Design Token System — [src/index.css](src/index.css)

### Semantic Color Names
- `--accent-primary`: warm golden-amber — the primary interactive accent, the "last light" in the dusk
- `--accent-secondary`: muted teal — the sky's green-teal transition zone, used for labels and secondary elements
- `--accent-numeric`: warm amber — slightly different lightness from primary, used for numeric data display
- `--surface-dim`: slightly warmer/lower surface for recessed areas

### Dark Mode (primary — `defaultTheme="dark"`):
- `--background: hsl(228 28% 10%)` deep navy · `--foreground: hsl(228 20% 94%)` soft white with blue undertone
- `--card: hsl(228 24% 13%)` · `--surface-raised: hsl(228 22% 16%)` · `--popover: hsl(228 26% 12%)`
- `--primary: hsl(38 65% 58%)` golden-amber · `--primary-foreground: hsl(228 28% 10%)` deep navy
- `--secondary: hsl(228 18% 17%)` · `--muted: hsl(228 16% 16%)` · `--muted-foreground: hsl(228 12% 56%)`
- `--accent: hsl(175 30% 50%)` teal · `--accent-foreground: hsl(175 20% 95%)`
- `--destructive: hsl(8 60% 52%)` soft coral-rose
- `--border: hsl(228 16% 20%)` · `--input: hsl(228 18% 17%)` · `--ring: hsl(38 65% 58%)`
- `--accent-primary: hsl(38 65% 58%)` · `--accent-secondary: hsl(175 30% 50%)` · `--accent-numeric: hsl(38 55% 65%)`
- `--glow: 0 0 28px -4px hsl(38 65% 58% / 0.30)` warm amber glow
- Charts: `--chart-1` golden-amber, `--chart-2` teal, `--chart-3` light navy-blue, `--chart-4` coral-rose, `--chart-5` muted lavender

### Light Mode:
- `--background: hsl(230 25% 97%)` warm cream with blue hint · `--foreground: hsl(230 30% 8%)` deep navy ink
- `--primary: hsl(38 70% 46%)` deeper amber for contrast · `--accent: hsl(175 35% 46%)` teal
- `--muted: hsl(230 12% 93%)` · `--muted-foreground: hsl(230 12% 42%)`
- `--border: hsl(230 15% 88%)` · `--input: hsl(230 15% 90%)`
- Same chart hues with adjusted lightness for cream backgrounds

### Color Space
- All semantic tokens use **HSL** (matching shadcn/ui conventions). All `color-mix()` and relative color syntax use `hsl` (e.g., `color-mix(in hsl, ...)`, `hsl(from ...)`).

### Typography:
- `--font-display: 'Outfit Variable'` — clean geometric sans
- `--font-sans: 'Manrope Variable'` — body sans
- `--font-mono: 'JetBrains Mono Variable'` — numerics/tabular
- `.font-mono-nums` uses `font-variant-numeric: tabular-nums` with tight letter-spacing

### Atmosphere:
- `body::before`: layered radial gradients — amber glow top-left (the sun), teal wash upper-right (the green band), deep navy bottom (the fading sky). Like looking at a dusk sky tilted into the interface.
- `body::after`: noise texture with blue-indigo tinting `(0.22, 0.20, 0.30)` — subtle atmospheric grain
- Light mode overrides: softer, lower-opacity versions of the same dusk gradients

---

## Per-Component Notes

### [src/App.tsx](src/App.tsx) — layout
Hero card shadow glows amber (`--accent-primary`). Gradient accents use `--accent-primary` (amber), `--accent-secondary` (teal), and `--accent-numeric` (warm gold). `color-mix()` calls use `in hsl` space. Stat accent props differentiate: secondary resolves to teal for "Active" count.

### [src/components/Header.tsx](src/components/Header.tsx)
Title dot `--accent-primary` (warm amber). Theme toggle hover uses `--accent-primary` with golden glow.

### [src/components/MuleCharacterCard.tsx](src/components/MuleCharacterCard.tsx)
Hover shadow and border glow `--accent-primary` (warm amber). Level badge `--accent-numeric` (gold). Class label `--accent-secondary` (teal). Separator line `--accent-primary`. Income value `--accent-numeric`. `color-mix` uses `in_hsl`.

### [src/components/IncomePieChart.tsx](src/components/IncomePieChart.tsx)
Empty state gradient uses `hsl(from var(--accent-primary) ...)` relative color syntax. Center label `--accent-numeric` (warm gold). Chart colors driven by `--chart-1..5` (dusk gradient: amber → teal → navy-blue → coral → lavender).

### [src/components/AddCard.tsx](src/components/AddCard.tsx)
Hover state `--accent-primary` border, background (`color-mix(in_hsl, ...)`), and warm amber glow shadow.

### [src/components/MuleDetailDrawer.tsx](src/components/MuleDetailDrawer.tsx)
Section heading rule `--accent-secondary` (teal). Gradient accents `--accent-primary` (amber). Level badge `--accent-numeric` (gold). Class label `--accent-secondary` (teal). Income badge `--accent-numeric`. Input focus borders `--accent-primary`. `color-mix` uses `in hsl`.

### [src/components/BossCheckboxList.tsx](src/components/BossCheckboxList.tsx)
Search icon `--accent-secondary` (teal). Input focus `--accent-primary` (amber). Family left accent bar `--accent-primary`/`--accent-secondary` via `color-mix(in hsl, ...)`. Selected row bg `--accent-primary` at 10% opacity. Crystal values `--accent-numeric` (gold).

---

## Package Changes
- Added: `@fontsource-variable/outfit`
- Removed: `@fontsource-variable/fraunces`