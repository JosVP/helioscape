# Technical Implementation Plan: Moon Tab + Research Hub Scoping (Block 19-2)

## 0. Pre-flight: Mars/Venus Unlock Bug

This is a data-only fix, not a feature — ship it first.

**Root cause:** `public/data/planets.json` has `"phase": 2` for both Mars and Venus unlock
conditions. Mercury's phases are 0-indexed (`0 = Operational Base`, `1 = Industrial Hub`,
`2 = Ring City`). The GDD says "Mars + Venus unlock at Mercury year 20 (phase 2)" — where "phase 2"
is **1-indexed**, mapping to `terraformingPhase 1` (`Industrial Hub`) in code. The current data
gates on Ring City, which is never reached in current gameplay.

**Fix (one file, immediate):**

```json
// public/data/planets.json — Mars and Venus unlock blocks
"unlock": {
  "type": "phase",
  "planetId": "mercury",
  "phase": 1,               // ← was 2 (Ring City); now 1 (Industrial Hub)
  "minOperationalYears": 20,
  "eventId": "ce_mars_unlocked"
}
```

Same change for Venus. `minOperationalYears: 20` is correct per the GDD.

---

## 1. Architecture & Data Flow

```mermaid
graph TD
  MOON_JSON[(public/data/moon.json)] --> DS[DataService.getMoonData()]
  DS --> MOC[MoonOverviewComponent]

  GS[GameStateService] -->|planets| PP[PlanetPanelComponent]
  DS -->|getPlanet| PP
  DS --> PP

  SHELL[GameShellComponent] -->|moonTabActive input| PP
  PP -->|effect: moonTabActive → setTab moon| PP
  PP -->|isEarth| HEADER_GUARD[Research Hub button @if isEarth]
  PP -->|activeTab moon| MOC
  PP -->|activeTab research| RC[ResearchComponent]
  PP -->|activeTab bio-phases| BPC[BioPhaseComponent]
  PP -->|activeTab overview| OC[PlanetOverviewComponent]
  EB[EventBusService] -->|planetSelected / closed| SHELL
  SHELL -->|reset moonTabActive| SHELL
```

Signal/state rules:
- No new `GameStateService` signals — Moon outpost state for Block 19-2 is static/informational.
- `moonTabActive` is a transient UI signal that lives in `GameShellComponent`; it is **not** persisted.
- `MoonOverviewComponent` reads `DataService.getMoonData()` (synchronous after loadAll).
- No service mutations; no `effect()` needed in `MoonOverviewComponent`.

---

## 2. Layered Breakdown

### Layer 0 — Bug fix (no code change required for other layers)

| File | Change |
|---|---|
| `public/data/planets.json` | Mars + Venus: `"phase": 2` → `"phase": 1` |

### Layer 1 — Models

No new game-state model interfaces needed for Block 19-2 (Moon content is static display only).

Add a lightweight data model in a standalone file to type the Moon JSON:

**`src/app/core/models/moon.model.ts`** (new)
```ts
export interface MoonFacility {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface MoonData {
  readonly id: 'moon';
  readonly displayName: string;
  readonly subtitle: string;
  readonly description: string;
  readonly facilities: readonly MoonFacility[];
}
```

Export `MoonData` and `MoonFacility` from `src/app/core/models/index.ts`.

### Layer 2 — JSON data

**`public/data/moon.json`** (new)
```json
{
  "id": "moon",
  "displayName": "Moon",
  "subtitle": "Artemis Base — Shackleton Crater",
  "description": "We inherited the Artemis Accords base at game start. ...",
  "facilities": [
    {
      "id": "artemis_base",
      "displayName": "Artemis Base",
      "description": "Permanent crewed research station at the lunar south pole. ..."
    },
    {
      "id": "far_side_array",
      "displayName": "Far-Side Radio Array",
      "description": "..."
    }
  ]
}
```

Narrator voice required — first person plural ("we"), present tense, optimism from presence.
Content is intentionally minimal for now; Block 19-3 owns the vignette and atmospheric flavour pass.

### Layer 3 — Core services

**`src/app/core/services/data.service.ts`**
- Add a private `_moonData: MoonData | null = null` field (same pattern as other cached data).
- In `loadAll()`, fetch `/data/moon.json` and store it.
- Add `getMoonData(): MoonData` that throws if not loaded (same guard as other getters).
- Update the loadAll spec fixture.

No `GameStateService` changes needed.

### Layer 4 — System services

None — no game-logic effects required.

### Layer 5 — Feature components

#### 5a. New: `MoonOverviewComponent`

**Path:** `src/app/features/planet-panel/moon/moon-overview.component.ts`

Responsibility: display the Moon outpost summary from static JSON data.

```ts
@Component({
  selector: 'app-moon-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './moon-overview.component.html',
  styleUrl: './moon-overview.component.scss',
})
export class MoonOverviewComponent {
  private readonly data = inject(DataService);
  readonly moon = this.data.getMoonData();  // synchronous, constant after loadAll
}
```

Template: show `moon.subtitle`, `moon.description`, then `@for (f of moon.facilities; track f.id)`.
No dynamic/signal values — pure display.

Co-located spec: `moon-overview.component.spec.ts` — mock `DataService.getMoonData()`, assert subtitle, description, and facility count render.

**Placeholder SVG asset (not needed for this component)** — the Moon row already uses the existing `moon.svg` from the planets menu. No new icon needed.

#### 5b. Updated: `PlanetPanelComponent`

**`src/app/features/planet-panel/planet-panel.component.ts`**

1. Add `'moon'` to the `PlanetPanelTab` union:
   ```ts
   export type PlanetPanelTab = 'research' | 'bio-phases' | 'overview' | 'moon';
   ```

2. Fix `isActiveMoonTab` — it should simply reflect whether the moon tab is active:
   ```ts
   readonly isActiveMoonTab = computed(() => this.activeTab() === 'moon');
   ```

3. Add an `effect()` in the constructor to auto-switch when the shell signals Moon row was clicked:
   ```ts
   effect(() => {
     if (this.moonTabActive()) {
       untracked(() => this.activeTab.set('moon'));
     }
   });
   ```
   Pitfall: wrap the mutation in `untracked()` so reading `moonTabActive()` doesn't re-enter the effect.

4. Add `MoonOverviewComponent` to `imports`.

**`src/app/features/planet-panel/planet-panel.component.html`**

5. Fix Moon tab button: change `(click)="setTab('research')"` → `(click)="setTab('moon')"`.
   Fix aria-selected: change `[attr.aria-selected]="isActiveMoonTab()"` to use `activeTab() === 'moon'` (which is the same as `isActiveMoonTab()` after fix 2 above — no template change needed here beyond the click handler).

6. Move Research Hub button from the header into a conditional guard. The button currently has no scoping:
   ```html
   <!-- BEFORE: always visible in header -->
   <button class="planet-panel__hub-btn" ...>⚗ Research Hub</button>
   ```
   Wrap it (or add `@if (isEarth())` immediately around it). The button stays in the header area — it's just hidden for non-Earth planets:
   ```html
   @if (isEarth()) {
     <button class="planet-panel__hub-btn" ...>⚗ Research Hub</button>
   }
   ```

7. Add `@case ('moon')` in the tab content `@switch`:
   ```html
   @case ('moon') {
     <app-moon-overview />
   }
   ```

8. Remove the `[moonTabActive]="moonTabActive()"` binding from `<app-research>` since `moonTabActive` is now used only to switch tabs (not passed into the research component). Check that the Research component's template and spec don't rely on this input before removing — see pitfall below.

   **Pitfall:** `ResearchComponent` currently accepts `[moonTabActive]` as an input. If it only used this to render Moon-specific research track content, that content should move to `MoonOverviewComponent`. If the Research component has logic gated on `moonTabActive`, it should be removed — research is Earth's domain but not Moon-specific within this block. The developer should trace all usages of `moonTabActive` input in `research.component.ts` before removing.

#### 5c. Updated: `GameShellComponent`

**`src/app/features/game-shell/game-shell.component.ts`**

`moonTabActive` currently gets set to `true` via `moonTabRequested$` and never resets. Fix:

1. In `closePlanetPanel()`:
   ```ts
   closePlanetPanel(): void {
     this.selectedPlanetId.set(null);
     this.moonTabActive.set(false);   // ← add
   }
   ```

2. In `handlePlanetSelection(id)` — when selecting a non-Earth planet, clear the flag:
   ```ts
   if (id !== 'earth') {
     this.moonTabActive.set(false);
   }
   ```
   Place this before the `activeView`/`selectedPlanetId` mutations so the tab resets cleanly.

#### 5d. Updated: `PlanetPanelComponent` spec

**`src/app/features/planet-panel/planet-panel.component.spec.ts`**

Add/update tests:
- Research Hub button is NOT present in the DOM when `planetId = 'mars'`.
- Research Hub button IS present when `planetId = 'earth'`.
- Moon tab IS shown when `planetId = 'earth'`.
- Moon tab is NOT shown when `planetId = 'mars'`.
- Setting `moonTabActive` input to `true` auto-switches `activeTab()` to `'moon'`.
- `isActiveMoonTab()` returns `true` when `activeTab() === 'moon'` (not when viewing research).

The existing spec uses `compileComponents()` + fixture. The mock `DataService` will need `getMoonData()` added.

---

## 3. Assets

No new SVG assets required. The Moon row already uses `/assets/svg/planets/moon.svg`.

The Moon tab in the panel shows text + facility list — no avatar or portrait needed for Block 19-2.

---

## 4. Scope Guard

| What | Deferred to |
|---|---|
| Moon research tracks / RP mechanics | Block 20 |
| Moon atmospheric / vignette display | Block 19-3 |
| Moon population / economy signal | Block 22+ |
| Research Hub UI interior redesign | Block 20 |
| Mars/Venus terraforming tabs | Block 22 |

---

## 5. Milestones & Verification

### Milestone 0 — Bug fix (immediate, one file)
- [ ] `public/data/planets.json`: Mars + Venus `"phase": 1`, `"minOperationalYears": 20`
- [ ] Verify: build + test still green

### Milestone 1 — Moon data + model
- [ ] `src/app/core/models/moon.model.ts`
- [ ] Export from `src/app/core/models/index.ts`
- [ ] `public/data/moon.json`
- [ ] `DataService`: add `_moonData`, `loadAll()` fetch, `getMoonData()` getter
- [ ] `ng build` green

### Milestone 2 — Moon tab component
- [ ] `src/app/features/planet-panel/moon/moon-overview.component.ts/.html/.scss`
- [ ] Add to `PlanetPanelComponent` imports
- [ ] Add `'moon'` to `PlanetPanelTab`, fix `isActiveMoonTab`, add effect
- [ ] Fix Moon tab click handler in HTML
- [ ] Add `@case ('moon')` to HTML switch
- [ ] `ng build` green

### Milestone 3 — Research Hub scoping + moonTabActive reset
- [ ] Wrap Research Hub button in `@if (isEarth())`
- [ ] `GameShellComponent.closePlanetPanel()` resets `moonTabActive`
- [ ] `GameShellComponent.handlePlanetSelection()` resets `moonTabActive` for non-Earth
- [ ] Verify Research tab still shows for Earth; Research component no longer receives `moonTabActive` input (check Research component for any `moonTabActive` usages first)
- [ ] `ng build` green

### Milestone 4 — Tests
- [ ] `moon-overview.component.spec.ts` — facility list, subtitle, description
- [ ] `planet-panel.component.spec.ts` — Research Hub guard, Moon tab visibility, auto-switch effect
- [ ] `game-shell.component.spec.ts` — moonTabActive resets on close and non-Earth selection (if spec exists)
- [ ] `ng test` / `npx vitest run` green for touched files

### Manual checks
- [ ] Start new game → open Earth panel → Research Hub button visible.
- [ ] Open Mars panel → Research Hub button NOT visible. Moon tab NOT visible.
- [ ] Click Moon row in planets menu → Earth panel opens, Moon tab is active, shows Moon content.
- [ ] Switch to another tab on Earth panel — works. Moon tab returns when clicked.
- [ ] Close Earth panel, open Mercury (if unlocked), verify no Moon tab.
- [ ] Progress Mercury to Industrial Hub (terraformingPhase 1) and wait 20 game years → Mars and Venus show "Locked" status becoming accessible. (Fast-test: reduce `minOperationalYears` to 0 in JSON, confirm Mars/Venus unlock on Mercury phase 1, restore.)
