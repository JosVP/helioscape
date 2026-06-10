# Helioscape Implementation Checklist

A thinking aid for planning and building a feature. Walk the layers top-to-bottom; skip layers a
feature doesn't touch. Mirrors the folder structure in `docs/agents/ARCHITECTURE.md`.

## Models (`src/app/core/models/`)

- [ ] Add/extend interfaces — **interfaces only, no logic, no classes**.
- [ ] `readonly` fields where they describe immutable data shapes.
- [ ] Re-export from `core/models/index.ts` (barrel).

## Data (`src/data/*.json`)

- [ ] All game content lives here — never hardcode content in TypeScript.
- [ ] New/updated JSON matches its model interface exactly (ids, enums, shapes).
- [ ] Served from `/data/...` (configured in `angular.json` assets).
- [ ] Player-facing strings use narrator voice (present tense, first person plural).

## Core services (`src/app/core/services/`)

- [ ] `GameStateService` — the **only** owner of mutable game state (private writable signals,
      public `.asReadonly()`, typed mutation methods). No derived state stored — use `computed()`.
- [ ] `DataService` — load JSON at startup via `APP_INITIALIZER`; typed synchronous accessors.
- [ ] `GameLoopService` — the **only** place a game timer (`setInterval`) runs.
- [ ] `EventBusService` — typed RxJS Subjects for cross-feature events (no state).
- [ ] `SaveService` / `SettingsService` — the **only** services that touch Tauri (guarded + browser
      `localStorage` fallback).

## System services (`src/app/core/systems/`)

- [ ] Game logic here, not in components. React to `gameYear` via `effect()` + `untracked()`.
- [ ] Read state, call `GameStateService` mutation methods; never store a parallel copy of state.

## Shared (`src/app/shared/`)

- [ ] Pure utils (`math.utils`, `year-value.utils`, `mercury-isometric.utils`) — no side effects.
- [ ] Pipes for formatting (`game-year`, `kardashev`).
- [ ] Reusable components (`progress-bar`, `status-tag`, `confirm-dialog`).

## Feature components (`src/app/features/`)

- [ ] Standalone, OnPush, `inject()`, `input()`/`output()`, `input.required()` where needed.
- [ ] `@if`/`@for` (with `track`) — never `*ngIf`/`*ngFor`.
- [ ] Thin templates; computed signals in the class. Component under ~200 lines (split if longer).
- [ ] **Canvas (orrery/Mercury):** start RAF in `ngAfterViewInit`, cancel in `ngOnDestroy`; read
      signals once at the top of the RAF callback; pause when hidden; dispose Three.js resources.

## Styles (`src/styles/`, component SCSS)

- [ ] Reference design tokens from `tokens.scss` — no hardcoded colours/fonts/spacing/transitions.
- [ ] BEM class names; scoped styles. Add missing tokens to `tokens.scss`, don't inline magic numbers.
- [ ] Correct transition variant: `1s linear` for tick-driven, ease-out `initial-load` for first open.
- [ ] Respect `reduced-motion` / `high-contrast` / `colorblind` `:root` classes and `--ui-scale`.

## Assets (`src/assets/svg/...`, audio)

- [ ] Required textures/vignettes/portraits/icons/sprites → **placeholder SVG** at the exact path
      and size (`create-placeholder-svg`).
- [ ] Required sounds → **placeholder audio** of the right length/category (`create-placeholder-audio`).

## App wiring (`src/app/app.config.ts`, `app.routes.ts`)

- [ ] Register providers/initialisers; add routes only if the feature needs one (routing is minimal).

## Memory-leak sweep (every component that subscribes/animates/listens)

- [ ] RAF cancelled; `takeUntilDestroyed()` on subscriptions; `removeEventListener` for manual
      listeners; Three.js geometry/material/texture/renderer disposed.

## Tests (co-located `*.spec.ts`, Vitest)

- [ ] Services and pure utils have meaningful unit tests.
- [ ] Components: test logic via signals, not pixel rendering.
- [ ] `ng build` clean and `ng test` green. **No E2E.**
