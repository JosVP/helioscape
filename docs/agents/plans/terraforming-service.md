# Technical Implementation Plan: TerraformingService

**Block:** 03-3  
**Prompt file:** `docs/agents/prompts/03-3-terraforming-service.txt`

---

## 1. Architecture & Strategy

### System context

`TerraformingService` is the year-tick engine for Mars and Venus. It accumulates atmospheric
changes from active player choices, drives terraforming-phase advancement, fires priority culture
events on phase transitions, and pushes updated `PlanetVisualParams` to `GameStateService` every
year. It is a pure system service: all state stays in `GameStateService`; this service reads,
computes, then writes via typed mutation methods.

`TechTreeService` (already built) calls `TerraformingService.applyChoice()` when a
`apply_terraforming_choice` tech effect fires. This replaces the direct
`gameState.applyTerraformingChoice()` call that TechTreeService currently makes (wiring a
pre-planned TODO).

### Architecture diagram

```mermaid
graph TD
  GL[GameLoopService] -->|gameYear tick| GS[GameStateService.gameYear]
  GS -->|effect| TS[TerraformingService]
  TS -->|reads planets()| GS
  TS -->|updatePlanetAtmosphere| GS
  TS -->|setTerraformingProgress| GS
  TS -->|advanceTerraformingPhase| GS
  TS -->|setTerraformTransitionYears| GS
  TS -->|updatePlanetVisualParams| GS
  TS -->|addPriorityEvent| GS
  TS -->|terraformingPhaseChanged$.next| EB[EventBusService]
  TS -->|terraformingChoiceApplied$.next| EB
  TT[TechTreeService] -->|applyChoice| TS
  DATA[(culture-events.json)] --> DS[DataService] --> TS
```

### Key design decisions

1. **Year-rate model** — `CHOICE_RATES` defines the per-year atmosphere delta for each active
   choice. On every `processYear` call the service sums all active choice contributions and
   applies them as small increments. No stored animation state — only `PlanetState` changes.

2. **Visual params via `getValueAtYear()`** — when a phase advances, `terraformStartYear` and
   `terraformEndYear` are reset to bracket the next visual transition window
   (`PHASE_TRANSITION_YEARS = 300`). `_computeAndUpdateVisualParams` calls `getValueAtYear()` for
   every visual param, lerping between the current-phase and next-phase target values. This is
   fully save/load-safe.

3. **`applyChoice` is the single entry point** — TechTreeService will be updated to call
   `terraformingService.applyChoice()` rather than `gameState.applyTerraformingChoice()` directly.
   `applyChoice` handles both the state write **and** all special-case side-effects (radiation,
   Europa authorisation, locked choices).

4. **Phase CE IDs from constant map** — phase advancement culture events are looked up from a
   `PHASE_CE_IDS` constant. `DataService.getCultureEvent()` is used to guard against missing
   entries. If an ID is not found in the data, the phase advances silently (no crash).

---

## 2. Layers to touch

| Layer | File | Action |
|---|---|---|
| Model | `src/app/core/models/planet.model.ts` | Add `marsRadiationClearYear?: number` to `PlanetState` |
| State service | `src/app/core/services/game-state.service.ts` | Add 6 new terraforming mutations |
| State service init | `src/app/core/services/game-state.service.ts` | Add `marsRadiationClearYear: 0` to `buildInitialPlanetsRecord()` |
| System service | `src/app/core/systems/terraforming.service.ts` | **Create** |
| System service test | `src/app/core/systems/terraforming.service.spec.ts` | **Create** |
| System service | `src/app/core/systems/tech-tree.service.ts` | Wire `applyChoice`, resolve TODO |
| JSON data | `public/data/culture-events.json` | Add 7 phase-advancement culture events |
| TODO tracker | `docs/agents/TODO.md` | Mark TechTreeService integration TODO as completed |

---

## 3. Per-file subtasks

### 3.1 `src/app/core/models/planet.model.ts`

**Change:** Add one optional field to `PlanetState`.

```ts
/** Mars only: game year when polar-detonation radiation hazard clears. 0 = no active hazard. */
marsRadiationClearYear?: number;
```

**Pitfall:** All code that destructures/spreads `PlanetState` (especially `buildInitialPlanetsRecord`
and `hydrate`) must remain compatible. Adding as optional is backwards-compatible with existing
save files.

---

### 3.2 `src/app/core/services/game-state.service.ts`

**Changes:** Six new mutations added after the existing `updatePlanetVisualParams` method in the
"Terraforming mutations" section. Also one line in `buildInitialPlanetsRecord`.

#### Mutations to add

```ts
/** Adds atmosphere deltas from one year of active choices. Pressure is clamped >= 0. */
updatePlanetAtmosphere(planetId: string, pressureDelta: number, tempDelta: number): void

/** Directly sets terraforming progress [0–1]. Use instead of incremental update to avoid float drift. */
setTerraformingProgress(planetId: string, progress: number): void

/** Increments terraformingPhase by 1 and resets progress to 0. */
advanceTerraformingPhase(planetId: string): void

/** Extends lockedOutChoices with new IDs (deduplicates). */
lockOutTerraformingChoices(planetId: string, choiceIds: string[]): void

/** Sets the visual transition window. Call on phase advance: startYear=now, endYear=now+N. */
setTerraformTransitionYears(planetId: string, startYear: number, endYear: number): void

/** Sets Mars radiation clear year (0 = no hazard). */
setMarsRadiationClearYear(planetId: string, year: number): void
```

#### `buildInitialPlanetsRecord` addition

```ts
marsRadiationClearYear: 0,
```

Add alongside `terraformStartYear` / `terraformEndYear`.

**Pitfall:** `updatePlanetAtmosphere` must use `Math.max(0, ...)` on the new pressure value —
Venus pressure starts extremely high and can go negative if not guarded.

---

### 3.3 `src/app/core/systems/terraforming.service.ts` (new file)

#### Responsibility

Year-tick engine for Mars and Venus. No stored state. Reacts to `gameYear` via `effect()`.

#### Constants (at top of file, `// tune after playtesting`)

```ts
// ---------------------------------------------------------------------------
// Rate constants — tune after playtesting
// ---------------------------------------------------------------------------

interface ChoiceRates {
  pressureRate: number;   // atm per year
  tempRate: number;       // °C per year
  phaseContribution: number; // fraction of 1.0 progress per year
}

const CHOICE_RATES: Record<string, Record<string, ChoiceRates>> = {
  mars: {
    mars_polar_detonation:     { pressureRate: 0.0002, tempRate: 0.5,    phaseContribution: 0.04  },
    mars_orbital_mirrors:      { pressureRate: 0.0001, tempRate: 0.3,    phaseContribution: 0.025 },
    mars_magnetic_umbrella:    { pressureRate: 0.00005,tempRate: 0.1,    phaseContribution: 0.015 },
    mars_biological_seeding:   { pressureRate: 0,      tempRate: 0,      phaseContribution: 0.02  },
    mars_comet_water_delivery: { pressureRate: 0.00008,tempRate: 0,      phaseContribution: 0.01  },
  },
  venus: {
    venus_orbital_shade_mirror:    { pressureRate: -0.0003, tempRate: -0.4, phaseContribution: 0.03  },
    venus_carbonate_sequestration: { pressureRate: -0.0002, tempRate: -0.2, phaseContribution: 0.025 },
    venus_europa_impact:           { pressureRate: -0.001,  tempRate: -1.0, phaseContribution: 0.06  },
  },
};

/** Years over which visual params lerp after a phase advances. */
const PHASE_TRANSITION_YEARS = 300;

/** Planets driven by this service. */
const TERRAFORMED_PLANETS = ['mars', 'venus'] as const;
```

#### Phase CE IDs

```ts
/** Culture event IDs fired when a phase advances. null = no event for that transition. */
const PHASE_CE_IDS: Record<string, (string | null)[]> = {
  //                  [phase 0→1,              phase 1→2,            phase 2→3,            phase 3→4]
  mars:  ['ce_mars_phase_1', 'ce_mars_phase_2', 'ce_mars_phase_3', 'ce_mars_phase_4'],
  venus: ['ce_venus_phase_1', 'ce_venus_phase_2', 'ce_venus_phase_3', null],
};
```

#### Phase visual targets

```ts
/**
 * Per-planet, per-phase visual parameter targets.
 * Index = phase number. TerraformingService lerps FROM targets[currentPhase] TO targets[currentPhase + 1].
 * Values are tuning parameters — adjust after playtesting.
 */
const PHASE_VISUAL_TARGETS: Record<string, Partial<PlanetVisualParams>[]> = {
  mars: [
    // Phase 0: barren red Mars
    { waterGrowthRadius: 0, waterOpacity: 0, greenGrowthRadius: 0, greenOpacity: 0,
      lavaOpacity: 0.4, lavaHueShift: 0, cloudOpacity: 0.05,
      atmosphereDensity: 0.02, atmosphereColor: '#c1440e', cloudRotationSpeed: 0.001 },
    // Phase 1: thin atmosphere forming
    { waterGrowthRadius: 0, waterOpacity: 0, greenGrowthRadius: 0, greenOpacity: 0,
      lavaOpacity: 0.1, lavaHueShift: 0.5, cloudOpacity: 0.15,
      atmosphereDensity: 0.08, atmosphereColor: '#d4633a', cloudRotationSpeed: 0.002 },
    // Phase 2: liquid water appearing
    { waterGrowthRadius: 0.2, waterOpacity: 0.3, greenGrowthRadius: 0.05, greenOpacity: 0.1,
      lavaOpacity: 0, lavaHueShift: 1, cloudOpacity: 0.3,
      atmosphereDensity: 0.18, atmosphereColor: '#c27b5a', cloudRotationSpeed: 0.003 },
    // Phase 3: becoming habitable
    { waterGrowthRadius: 0.5, waterOpacity: 0.7, greenGrowthRadius: 0.35, greenOpacity: 0.5,
      lavaOpacity: 0, lavaHueShift: 1, cloudOpacity: 0.55,
      atmosphereDensity: 0.3, atmosphereColor: '#7fa8cc', cloudRotationSpeed: 0.005 },
    // Phase 4: Earth-like (final target)
    { waterGrowthRadius: 0.85, waterOpacity: 1, greenGrowthRadius: 0.75, greenOpacity: 0.9,
      lavaOpacity: 0, lavaHueShift: 1, cloudOpacity: 0.8,
      atmosphereDensity: 0.35, atmosphereColor: '#4488ff', cloudRotationSpeed: 0.008 },
  ],
  venus: [
    // Phase 0: hellish Venus — extreme pressure, extreme temp, thick yellow clouds
    { waterGrowthRadius: 0, waterOpacity: 0, greenGrowthRadius: 0, greenOpacity: 0,
      lavaOpacity: 0, cloudOpacity: 1.0,
      atmosphereDensity: 1.0, atmosphereColor: '#c9a227', cloudRotationSpeed: 0.008 },
    // Phase 1: shade mirror slowing heat gain
    { cloudOpacity: 0.9,
      atmosphereDensity: 0.85, atmosphereColor: '#b8911e', cloudRotationSpeed: 0.006 },
    // Phase 2: pressure dropping, clouds thinning
    { cloudOpacity: 0.6,
      atmosphereDensity: 0.5, atmosphereColor: '#8c7a4e', cloudRotationSpeed: 0.004 },
    // Phase 3: temperate — approaching breathable
    { waterGrowthRadius: 0.1, waterOpacity: 0.2, greenGrowthRadius: 0, greenOpacity: 0,
      cloudOpacity: 0.35,
      atmosphereDensity: 0.25, atmosphereColor: '#6699bb', cloudRotationSpeed: 0.003 },
    // Phase 4: habitable (final target)
    { waterGrowthRadius: 0.6, waterOpacity: 0.8, greenGrowthRadius: 0.3, greenOpacity: 0.4,
      cloudOpacity: 0.5,
      atmosphereDensity: 0.3, atmosphereColor: '#4488ff', cloudRotationSpeed: 0.004 },
  ],
};
```

#### `constructor`

```ts
constructor() {
  effect(() => {
    const year = this.gameState.gameYear();
    untracked(() => this.processYear(year));
  });
}
```

#### `processYear(year: number): void` (private)

```
Snapshot planets = this.gameState.planets()   // read once, never re-read inside loop

for planetId of TERRAFORMED_PLANETS:
  const planet = planets[planetId]
  if (!planet) continue          // not yet unlocked, skip

  let pressureDelta = 0, tempDelta = 0, progressDelta = 0

  for choiceId, choice of planet.terraformingChoices:
    if !choice.active continue
    const rates = CHOICE_RATES[planetId]?.[choiceId]
    if !rates continue
    pressureDelta += rates.pressureRate
    tempDelta     += rates.tempRate
    progressDelta += rates.phaseContribution

  gameState.updatePlanetAtmosphere(planetId, pressureDelta, tempDelta)

  const newProgress = Math.min(1, planet.terraformingProgress + progressDelta)
  gameState.setTerraformingProgress(planetId, newProgress)

  if newProgress >= 1.0:
    this._advancePhase(planetId, year)

  this._computeAndUpdateVisualParams(planetId, year)
```

**Pitfall:** Read `planets` into a local snapshot **once** before the loop. Do not call
`this.gameState.planets()` again inside the loop — each `gameState.update*` call may trigger a new
signal write, and re-reading within the same tick can cause inconsistency. The snapshot is safe
because this function runs synchronously within a single microtask.

#### `_advancePhase(planetId: string, year: number): void` (private)

```
gameState.advanceTerraformingPhase(planetId)          // phase++, progress = 0
gameState.setTerraformTransitionYears(planetId, year, year + PHASE_TRANSITION_YEARS)

// Re-read new phase number AFTER mutation
const newPhase = this.gameState.planets()[planetId]?.terraformingPhase ?? 0

eventBus.terraformingPhaseChanged$.next({ planetId, phase: newPhase })

// Queue priority CE if one is defined for this transition
const ceId = PHASE_CE_IDS[planetId]?.[newPhase - 1]
if (ceId && this.data.getCultureEvent(ceId)) {
  gameState.addPriorityEvent(ceId, year)
}
```

#### `applyChoice(planetId: string, choiceId: string, permanent: boolean): void` (public)

```
const planet = this.gameState.planets()[planetId]
if (!planet) return
if (planet.lockedOutChoices.includes(choiceId)) return   // silently reject locked choices

gameState.applyTerraformingChoice(planetId, choiceId, permanent)

// Special-case side effects
if (choiceId === 'mars_polar_detonation') {
  const currentYear = this.gameState.gameYear()
  gameState.setMarsRadiationClearYear(planetId, currentYear + 40)
  gameState.lockOutTerraformingChoices(planetId, ['mars_magnetic_umbrella', 'mars_biological_seeding'])
  // NOTE: magnetic umbrella is incompatible post-detonation; bio-seeding delayed by radiation
}

if (choiceId === 'venus_europa_impact') {
  const currentYear = this.gameState.gameYear()
  const delay = Math.floor(Math.random() * 21) + 50  // 50–70 inclusive
  gameState.authoriseEuropa(currentYear + delay)
}

eventBus.terraformingChoiceApplied$.next({ planetId, choiceId })
```

**Pitfall re locked choices:** The choices locked out by `mars_polar_detonation` are best-guess
values — confirm against GDD before finalising. The prompt doesn't enumerate them explicitly.

#### `_computeAndUpdateVisualParams(planetId: string, year: number): void` (private)

```
const planet = this.gameState.planets()[planetId]
if (!planet) return

const phase = planet.terraformingPhase
const targets = PHASE_VISUAL_TARGETS[planetId]
if (!targets) return

const fromParams = targets[phase]     ?? targets[targets.length - 1]
const toParams   = targets[phase + 1] ?? targets[targets.length - 1]

// t = 0 at terraformStartYear, 1 at terraformEndYear
// getValueAtYear clamps outside the window — safe.
const lerp = (from: number | undefined, to: number | undefined, t: number) =>
  getValueAtYear(year, planet.terraformStartYear, planet.terraformEndYear, from ?? 0, to ?? 0)

const params: Partial<PlanetVisualParams> = {
  // Water: grows as pressure rises above ~0.05 atm (Mars) / temp drops (Venus)
  waterGrowthRadius: lerp(fromParams.waterGrowthRadius, toParams.waterGrowthRadius, 0),
  waterOpacity:      lerp(fromParams.waterOpacity,      toParams.waterOpacity,      0),

  // Vegetation: unlocks in phase 2+
  greenGrowthRadius: lerp(fromParams.greenGrowthRadius, toParams.greenGrowthRadius, 0),
  greenOpacity:      lerp(fromParams.greenOpacity,      toParams.greenOpacity,      0),

  // Lava: cools from Mars polar detonation heat over the transition window
  lavaOpacity:  lerp(fromParams.lavaOpacity,  toParams.lavaOpacity,  0),
  lavaHueShift: lerp(fromParams.lavaHueShift, toParams.lavaHueShift, 0),

  // Clouds: thicken as atmosphere builds
  cloudOpacity:       lerp(fromParams.cloudOpacity,       toParams.cloudOpacity,       0),
  atmosphereDensity:  lerp(fromParams.atmosphereDensity,  toParams.atmosphereDensity,  0),
  cloudRotationSpeed: lerp(fromParams.cloudRotationSpeed, toParams.cloudRotationSpeed, 0),

  // Atmosphere colour: lerp via lerpColor() from math.utils
  atmosphereColor: lerpColor(
    fromParams.atmosphereColor ?? '#000000',
    toParams.atmosphereColor   ?? '#000000',
    getValueAtYear(year, planet.terraformStartYear, planet.terraformEndYear, 0, 1),
  ),
}

gameState.updatePlanetVisualParams(planetId, params)
```

**Note:** `axisSpinSpeed` and `cityLightsIntensity` are not driven by terraforming — they're set at
init and owned by other systems. Do not overwrite them here.

**Imports needed:** `getValueAtYear`, `lerpColor` from `@app/shared/utils/math.utils`.

---

### 3.4 `src/app/core/systems/tech-tree.service.ts`

**Change:** Resolve the active TODO (inject TerraformingService, forward `apply_terraforming_choice`).

```ts
// Add injection at top of class
private readonly terraformingService = inject(TerraformingService);

// In _applyEffect(), replace the apply_terraforming_choice case:
case 'apply_terraforming_choice':
  // Delegates to TerraformingService which handles choice validation,
  // state write, special-case side effects, and event emission.
  this.terraformingService.applyChoice(effect.planet, effect.choiceId, effect.permanent);
  break;
```

**Circular injection check:** `TechTreeService → TerraformingService → GameStateService`. No cycle.

**After change:** Update `docs/agents/TODO.md` — move the "TechTreeService — TerraformingService
integration" entry to the Completed section with today's date.

---

### 3.5 `public/data/culture-events.json`

Add 7 new entries for phase-advancement events. Use the same shape as existing entries.

**Mars (3 entries):**
- `ce_mars_phase_1`: "The Atmosphere Stirs" — first measurable pressure increase, narrator notes
  the CO2 beginning to build. `trigger: null` (fired directly by service, not trigger-based).
- `ce_mars_phase_2`: "First Frost, First Rain" — water ice detectable, narrator tone is wonder.
- `ce_mars_phase_3`: "The Red Gives Way" — first green patches visible from orbit.

**Venus (3 entries):**
- `ce_venus_phase_1`: "The Long Shadow" — shade mirror in full operation, first measurable cooling.
- `ce_venus_phase_2`: "The Skies Thin" — sulphuric acid clouds thinning, surface glimpsed.
- `ce_venus_phase_3`: "A Second Spring" — liquid water possible, Venus finally below 60°C.

**Portrait paths** (all placeholder SVGs to create via `create-placeholder-svg` skill):
```
/assets/svg/portraits/ce_mars_phase_1.svg   (512 × 512)
/assets/svg/portraits/ce_mars_phase_2.svg   (512 × 512)
/assets/svg/portraits/ce_mars_phase_3.svg   (512 × 512)
/assets/svg/portraits/ce_venus_phase_1.svg  (512 × 512)
/assets/svg/portraits/ce_venus_phase_2.svg  (512 × 512)
/assets/svg/portraits/ce_venus_phase_3.svg  (512 × 512)
```

**Trigger field:** Set `"trigger": null` (or omit) — these events are enqueued directly by
`TerraformingService._advancePhase`, not via the trigger-scan system.

---

### 3.6 `src/app/core/systems/terraforming.service.spec.ts` (new file)

Arrange/Act/Assert with mocked services via `TestBed` + `jasmine.createSpyObj`.

| Test | What to verify |
|---|---|
| `processYear` — no planets | `updatePlanetAtmosphere` not called |
| `processYear` — unlocked Mars, no active choices | atmosphere unchanged, progress 0 |
| `processYear` — Mars, one active choice | pressure/temp/progress increase by expected rates |
| `processYear` — progress reaches 1.0 | `advanceTerraformingPhase` called, `terraformingPhaseChanged$` emitted, CE queued |
| `processYear` — progress < 1.0 | `advanceTerraformingPhase` NOT called |
| `applyChoice` — normal choice | `applyTerraformingChoice` called, `terraformingChoiceApplied$` emitted |
| `applyChoice` — choice in lockedOutChoices | nothing called, no event |
| `applyChoice` — `mars_polar_detonation` | `setMarsRadiationClearYear` called with +40, `lockOutTerraformingChoices` called |
| `applyChoice` — `venus_europa_impact` | `authoriseEuropa` called with impactYear in range [currentYear+50, currentYear+70] |
| `_computeAndUpdateVisualParams` — phase 0, year < terraformStartYear | params equal phase-0 `from` values |
| `_computeAndUpdateVisualParams` — year at endYear | params equal phase-1 `to` values |

**Pitfall:** The `effect()` in `constructor` fires immediately during `TestBed.inject()`. Provide a
mock `GameStateService` whose `gameYear` signal returns a fixed value (e.g. 2033) to keep tests
deterministic.

---

## 4. Scope guard — explicitly out of scope

| Item | Why deferred |
|---|---|
| OrreryComponent reading `visualParams` | A later block (orrery rendering). `updatePlanetVisualParams` writes state; the orrery reads it when built. |
| UI showing current terraforming phase or progress | Planet panel block. |
| Mars radiation hazard gameplay effect (blocking choices in UI) | UI / planet-panel block. |
| Venus Europa impact *landing* / `impacted = true` logic | Handled by a future system (EuropaService or equivalent). `authoriseEuropa()` just stores the scheduled year. |
| CultureEventService trigger-scan refactor | Trigger types are evaluated by CultureEventService. The new events use `null` trigger — no change needed to that service. |
| Audio on phase change | AudioService not yet implemented (existing TODO). |

---

## 5. Milestones & verification

### Milestone 1 — Models + state mutations
- Add `marsRadiationClearYear` to `PlanetState`
- Add all 6 mutations to `GameStateService`
- Add `marsRadiationClearYear: 0` to `buildInitialPlanetsRecord()`
- ✅ `ng build` clean

### Milestone 2 — TerraformingService core
- Create `terraforming.service.ts` with constants, `effect()`, `processYear`, `_advancePhase`,
  `_computeAndUpdateVisualParams`
- Add placeholder culture event JSON entries + portraits
- ✅ `ng build` clean

### Milestone 3 — `applyChoice` + TechTreeService wiring
- Implement `applyChoice` with special cases
- Update `TechTreeService._applyEffect()` to delegate to `terraformingService.applyChoice()`
- Mark TODO complete in `docs/agents/TODO.md`
- ✅ `ng build` clean; existing TechTreeService tests still green

### Milestone 4 — Tests
- Write `terraforming.service.spec.ts`
- ✅ `ng test` all green

### Manual verification checklist

- [ ] Start a new game. Open browser devtools, add a breakpoint or log in `processYear`. Confirm
      it fires once per year tick for each of Mars and Venus once they're unlocked (not before).
- [ ] Unlock a Mars tech that applies `mars_polar_detonation` choice. Confirm `lockedOutChoices`
      array on Mars includes `mars_magnetic_umbrella`. Confirm `marsRadiationClearYear` is
      `currentYear + 40` in the Mars `PlanetState` signal.
- [ ] Advance the game several decades with the choice active. Confirm `atmospherePressure` and
      `temperatureCelsius` on Mars slowly increase by the expected rate each year.
- [ ] Advance until `terraformingProgress >= 1.0`. Confirm: phase increments, progress resets,
      `terraformingPhaseChanged$` fires, a priority culture event card appears.
- [ ] Apply `venus_europa_impact`. Confirm `europaState.missionAuthorised = true` and
      `europaState.impactYear` is 50–70 years in the future.
- [ ] Save and reload. Confirm all atmosphere values are preserved and visual lerp continues from
      the correct position.
