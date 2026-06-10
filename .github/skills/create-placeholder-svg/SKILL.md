---
name: create-placeholder-svg
description: Generate a simple, correctly-sized placeholder SVG (basic shapes) for any Helioscape visual asset so a feature is never blocked on art
---

## Role & Goal

Helioscape needs many SVG visuals — planet textures, planet-state vignettes, culture-event portraits,
tech-tree icons, UI icons, Mercury building sprites. When a prompt needs one of these and the real
art doesn't exist, generate an **obvious placeholder** made of basic shapes, at the **correct size**
and **exact path** the code references, so the user can swap it later. **Never block a feature on art.**

## Golden rules

1. **Obvious placeholder.** It must read as a placeholder, not finished art. Include a faint label
   (e.g. the asset name) and/or a dashed border. Use flat basic shapes: `<rect>`, `<circle>`,
   `<ellipse>`, `<polygon>`, `<path>`, `<line>`, simple `<linearGradient>`.
2. **Correct dimensions.** Match what the consumer expects (texture aspect ratio, icon box, vignette
   3:4, etc. — see table below). Set `viewBox` and `width`/`height`; use `preserveAspectRatio` sanely.
3. **Right path.** Save where the code looks for it (see "Where assets live"). If a JSON `planets.json`
   / `culture-events.json` field names the path, match it exactly.
4. **Self-contained & cheap.** Inline everything, no external refs/fonts (use a generic
   `font-family="monospace"`). Keep it tiny and hand-readable.
5. **Recognisable, not detailed.** Convey the subject with a few shapes — an Earth "worldmap" is a
   couple of green blobs on blue; a landscape is sky + ground + a tree + a sun. That's enough.
6. **Themeable when it's a UI/tech icon.** Prefer `fill="currentColor"` (or a token-ish hue) so it
   inherits colour, and keep a single clear glyph on a transparent background.

## Where assets live (from ARCHITECTURE.md)

```
src/assets/svg/
├── buildings/     # Mercury building sprites (isometric)
├── vignettes/     # planet-state landscape illustrations
└── icons/         # tech-tree + UI icons
```

Planet textures referenced by `planets.json` `visual.layerTextures` / `cityLightsTexture`, and
culture-event `portrait` paths, may point elsewhere — **follow the path in the data/code**, don't
assume.

## Suggested default sizes

| Asset kind                           | viewBox / size       | Notes                                                  |
| ------------------------------------ | -------------------- | ------------------------------------------------------ |
| Planet texture (equirectangular map) | `0 0 1024 512` (2:1) | Wraps a sphere in the orrery; 2:1 is the safe default. |
| City-lights texture                  | `0 0 1024 512` (2:1) | Dark map + scattered light dots.                       |
| Planet-state vignette                | `0 0 300 400` (3:4)  | Matches the vignette component's 3:4 frame.            |
| Culture-event portrait               | `0 0 256 256` (1:1)  | Square narrator/character portrait.                    |
| Tech-tree / UI icon                  | `0 0 24 24`          | Single glyph, `currentColor`, transparent bg.          |
| Mercury building sprite              | `0 0 64 64`          | Isometric footprint ~`TILE_WIDTH` (64) wide.           |

## Procedure

1. Identify the **kind**, the **exact path**, and the **size** the consumer expects (check the prompt,
   the model interface, and any JSON field naming the asset).
2. Pick a tiny shape vocabulary that reads as the subject (see recipes).
3. Create the file with `viewBox` + width/height, a placeholder marker (dashed border and/or label),
   and `<!-- PLACEHOLDER: replace with final art -->` as the first child comment.
4. Make sure the code/JSON references that path. If the path didn't exist before, add/confirm it.
5. Note in your summary that it's a placeholder so the user knows to swap it.

## Recipes (use as starting points, adapt subject/colours)

### Earth worldmap texture (`0 0 1024 512`)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512" preserveAspectRatio="none">
  <!-- PLACEHOLDER: replace with final Earth texture -->
  <rect width="1024" height="512" fill="#1c4e80"/>            <!-- ocean -->
  <ellipse cx="280" cy="200" rx="150" ry="90" fill="#3f7d3f"/> <!-- continent blob -->
  <ellipse cx="620" cy="300" rx="190" ry="110" fill="#3f7d3f"/>
  <ellipse cx="850" cy="170" rx="90"  ry="70"  fill="#3f7d3f"/>
  <rect x="0" y="0" width="1024" height="40"  fill="#dfeefc"/> <!-- ice cap N -->
  <rect x="0" y="472" width="1024" height="40" fill="#dfeefc"/> <!-- ice cap S -->
  <rect x="2" y="2" width="1020" height="508" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-dasharray="12 8"/>
  <text x="512" y="256" fill="#ffffff" fill-opacity="0.5" font-family="monospace" font-size="28" text-anchor="middle">earth texture — placeholder</text>
</svg>
```

### Mars texture (`0 0 1024 512`)

Swap ocean for `#a8431f` (rust), continents for `#7c2f15`, polar caps stay pale. Same dashed border + label.

### Planet-state vignette — terraformed landscape (`0 0 300 400`)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <!-- PLACEHOLDER: replace with final vignette -->
  <rect width="300" height="260" fill="#7fb2e6"/>               <!-- sky -->
  <circle cx="240" cy="60" r="34" fill="#ffd84d"/>              <!-- sun -->
  <rect y="260" width="300" height="140" fill="#5a9e5a"/>       <!-- grass -->
  <rect x="60"  y="210" width="14" height="60" fill="#6b4a2b"/> <!-- trunk -->
  <polygon points="67,170 40,220 94,220" fill="#3f7d3f"/>       <!-- leaves -->
  <rect x="210" y="210" width="14" height="60" fill="#6b4a2b"/>
  <polygon points="217,170 190,220 244,220" fill="#3f7d3f"/>
  <rect x="2" y="2" width="296" height="396" fill="none" stroke="#000" stroke-opacity="0.3" stroke-dasharray="10 6"/>
  <text x="150" y="380" fill="#000" fill-opacity="0.5" font-family="monospace" font-size="12" text-anchor="middle">vignette placeholder</text>
</svg>
```

For a barren state, use grey/rust ground, dark sky, no trees, small sun.

### Culture-event portrait (`0 0 256 256`)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- PLACEHOLDER: replace with final portrait -->
  <rect width="256" height="256" fill="#1e1e22"/>
  <circle cx="128" cy="104" r="46" fill="#8a8070"/>            <!-- head -->
  <path d="M64 220 a64 64 0 0 1 128 0 Z" fill="#8a8070"/>      <!-- shoulders -->
  <rect x="4" y="4" width="248" height="248" fill="none" stroke="#c8861e" stroke-opacity="0.6" stroke-dasharray="10 6"/>
  <text x="128" y="244" fill="#e8e0d4" fill-opacity="0.6" font-family="monospace" font-size="12" text-anchor="middle">portrait placeholder</text>
</svg>
```

### Tech-tree / UI icon (`0 0 24 24`, themeable)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <!-- PLACEHOLDER: replace with final icon -->
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M12 7 v10 M7 12 h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### Mercury building sprite (`0 0 64 64`, isometric)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- PLACEHOLDER: replace with final building sprite -->
  <polygon points="32,40 8,28 32,16 56,28" fill="#8a7a5a"/>     <!-- iso top -->
  <polygon points="8,28 8,44 32,56 32,40"  fill="#6f6244"/>     <!-- left face -->
  <polygon points="56,28 56,44 32,56 32,40" fill="#574d36"/>    <!-- right face -->
  <rect x="1" y="1" width="62" height="62" fill="none" stroke="#c8861e" stroke-opacity="0.5" stroke-dasharray="6 4"/>
</svg>
```

## Boundaries

- Don't chase realism — basic shapes only. A few minutes, not a session.
- Don't invent new asset folders unless the code expects them; follow existing paths.
- Always leave the `<!-- PLACEHOLDER -->` comment and a visible marker so it's never mistaken for final art.
