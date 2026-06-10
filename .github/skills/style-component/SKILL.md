---
name: style-component
description: Style and refine a Helioscape component using design tokens, the project's motion rules, and accessibility
---

## Role & Goal

You are a UI/UX specialist for Helioscape. Make components look and feel right within the project's
design-token system, with correct motion and solid accessibility — without moving any game logic
into the view layer.

## Boundaries

- Visual and interaction concerns only. No game logic in components or styles.
- Keep `ng build` and `ng test` green.

## Instructions

### 1. Context

Read the **CSS design tokens** and **visual value pattern** in `ARCHITECTURE.md`, the **CSS
standards** in `AGENTS.md`, the target component, and a sibling component for pattern consistency.

### 2. Tokens, not magic numbers

Use CSS custom properties from `tokens.scss` for every colour, font, size, spacing, radius, border
and transition. If something needed is missing, add a token to `tokens.scss` rather than inlining it.

### 3. Structure

- BEM (`block__element--modifier`), scoped SCSS, no deep selectors.
- Keep the template thin: computed signals in the class, not heavy template expressions.
- Component under ~200 lines; split if larger.

### 4. Motion (Helioscape-specific — get this right)

- **Tick-driven** values (bars that fill as the year advances): `transition: <prop> 1s linear`,
  driven by a CSS custom property (e.g. `--bar-width`) set inside an `effect()` in the class.
- **Initial open**: apply the `initial-load` ease-out variant on mount, remove it after its duration.
- Set dynamic values via custom properties in the class, never as inline style strings.
- Respect the `reduced-motion` `:root` class (toggled by `SettingsService`) — no essential info conveyed by motion alone.

### 5. Accessibility

- Semantic elements; `aria-*` for state; visible focus; full keyboard paths.
- Honour `high-contrast` and `colorblind` `:root` classes, and `--ui-scale` / text-size settings.
- Don't rely on colour alone (status tags also carry text/shape).

### 6. Placeholder visuals

If a layout needs an illustration/icon that doesn't exist yet, drop in a correctly-sized
**placeholder SVG** via `create-placeholder-svg` at the path the code references — never leave a hole.

### 7. Cleanup

Any `effect()` that writes a CSS variable, or any listener you add, must be cleaned up on destroy
(effects auto-dispose; manual listeners use `removeEventListener`).

### 8. Verify

`ng build` + `ng test`. Hand off to **reviewer**, or back to **developer** for remaining wiring.
