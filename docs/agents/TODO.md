# Helioscape TODO Tracker

**Single source of truth** for deferred features and integration points.

**Workflow:**

- **lead-developer** adds TODOs here during planning (before code exists)
- **developer** reads this file before implementing to understand what's deferred and why
- **developer** moves completed TODOs from "Active" to "Completed" section after implementing them
- **lead-developer** checks this file at the start of each planning session to see if blocked work is now unblocked

No inline `// TODO:` comments in code - all tracking happens here to avoid duplication.

---

## Format

```
### [Feature/Service Name] — [Brief Description]
- **File**: path/to/file.ts
- **Location**: Brief description (e.g., "in set() method", "constructor")
- **TODO**: What needs to be done
- **Depends on**: What must exist first
- **Prompt block**: Block XX (if known)
- **Added**: YYYY-MM-DD
```

---

## Active TODOs

### POST-PLAYTEST PROMPT SET (Blocks 18–25) — authored 2026 by analyst

- **What**: A new batch of build prompts lives in `docs/agents/prompts/18-*` through `25-*`, addressing the post-09-8 playtest issues: orrery visual overhaul (18), planet unlock chain + panels (19), research-as-timed-RP-tracks (20), Kardashev + eager service injection (21), the full terraforming loop incl. bio composer (22), pause + interaction lock (23), state-gated culture events (24), and Mercury RTS fixes incl. upgrades/overdrive + multi-launchpad (25).
- **Venus redesign (IMPORTANT)**: The GDD now has TWO Venus paths only — Wild Venus (~117-day solar day) and a single retrograde Europa impact (~10–20-day solar day, ~35–50% ocean). The two-moon / Callisto-into-Venus path is DROPPED. See `docs/GDD/terraforming-options.md` (v5, updated), `main-gdd.md`, `economy-logistics.md`. Update any model enums/data accordingly (see `venusSpinPath` below).
- **Prompt block**: 18–25
- **Added**: post-playtest

### GameStateModel — New fields for Jovian moons, phase events, infra health

- **File**: `src/app/core/models/game-state.model.ts`
- **Location**: `SerializedGameState` and supporting interfaces
- **TODO**: Add `JovianMoonState` (moonId, which moon assigned to which planet, commitment year, arrival year, extraction rate slider 0–1, status: `'uncommitted' | 'in_transit_to_mars' | 'in_transit_to_venus' | 'captured_mars' | 'captured_venus' | 'destroyed'`, targetPlanetId, isImpact: boolean), `PhaseEventState` (which event fired per phase per planet, response taken, outcome), `waterDeliveryRate` (slider 0–1 per planet), `infraHealth` (effectiveness 0–100 per infra type keyed by id), `powerBalanceGw`, `dysonShadeAllocation` (% panels redirected to Venus), `venusSpinPath` ('none' | 'wild_venus' | 'europa_retrograde'). NOTE: the two-moon `'callisto_europa_retrograde'` value is OBSOLETE — Venus is now two-path only (Wild Venus / single Europa impact). Add `ProbeMissionState` (probeId, targetPlanetId, status: `'in_transit_outbound' | 'at_target' | 'in_transit_return' | 'complete'`, launchYear, arrivalYear) and `probeMissions: Record<string, ProbeMissionState>`. The orrery moon-transit visualisation reads both JovianMoonState and ProbeMissionState directly.
- **Depends on**: Nothing — precedes all future model-dependent blocks
- **Prompt block**: Amendment to Block 0.4
- **Added**: 2026-06-12

### TerraformingService — Rewrite for new phase structure and choice IDs

- **File**: `src/app/core/systems/terraforming.service.ts`
- **Location**: Whole service
- **TODO**: The `CHOICE_RATES` constant uses stale flat choice IDs. New system is per-planet, per-phase: `mars_p1_{orbital_laser | mirror_array | nuclear_detonation}`, `mars_p2_{titan_nitrogen | venus_nitrogen | regolith}`, `mars_p3_{l1_shield | equatorial_ring}`, `mars_p4_{jovian_moon | asteroid_belt}` and Venus equivalents. Phase event RNG (65–70% chance per phase, percentage-based impact) needs a dedicated method. Jovian moon transit tracking must feed from `JovianMoonState`. SGGF boost needs two sub-options (long-lived CF₄/SF₆ = permanent, short-lived methane/N₂O = reversible). Titan strip must require Dyson relay station to be queued first.
- **Depends on**: GameStateModel amendment above
- **Prompt block**: Rewrite of Block 3.3 — now fully specified in Block 22 (`docs/agents/prompts/22-0`…`22-5`). Venus is TWO-PATH only (drop `callisto_europa_retrograde`).
- **Added**: 2026-06-12

### ProbeMissions — New mechanic

- **File**: New `src/app/core/systems/probe.service.ts` + `public/data/probe-missions.json`
- **Location**: New feature
- **TODO**: Unmanned probes to Mars, Venus, Europa. Each has transit time (~3–4yr each way), optional. Returns a data bonus applied to the player's chosen terraforming path on that planet. Needs: `probe-missions.json` data file, `ProbeService`, UI affordance in planet panel for sending/tracking probe, `probeMissions` state in GameStateService.
- **Depends on**: GameStateModel amendment
- **Prompt block**: New block ~07-6 (after planet panel, before Mercury grid)
- **Added**: 2026-06-12

### VenusSkyCity — Prompt block needed
### OrreryComponent — Moon transit and probe visualisation (patch to Block 6.1)

- **File**: `src/app/features/orrery/orrery.component.ts`
- **Location**: Patch to existing component — preserve all existing behaviour
- **TODO**: Add CSS2DRenderer for floating labels alongside existing WebGLRenderer. Show in-transit Jovian moons as coloured dots (blue-white for capture, amber for impact paths) travelling along Bezier arcs from Jupiter position toward target planet. Short trailing line behind each dot showing recent path. Floating persistent label showing moon name, destination, ETA, and IMPACT tag where applicable. Show captured moons as small orbiting dots near target planet (no label). Show probes as smaller grey-white dots with similar labels. Jupiter not rendered as mesh but used as Bezier P0 positional reference. Full cleanup on destroy. Full design spec in prompt file `06-1b-orrery-moon-transits.txt`.
- **Depends on**: `JovianMoonState` and `ProbeMissionState` in GameStateModel (see TODO above); `jovianMoons()` and `probeMissions()` signals on GameStateService
- **Prompt block**: Block 06-1b (patch prompt, run after Block 06-1 is confirmed working)
- **Added**: 2026-06-13

### VenusSkyCity — Prompt block needed

- **File**: New component in `src/app/features/planet-panel/`, new Mercury queue entries
- **Location**: New feature
- **TODO**: Venus sky cities design is complete in `terraforming-options.md § VENUS SKY CITIES`. Needs: sky city state in `GameStateService`, `SkyCityPanelComponent` or tab in planet panel, Mercury build queue entries for the 3-component city build, buoyancy loss trigger at Phase 2 ~30% density reduction, descent/conversion/active-lift Pause-and-present. Terminator rail city (Wild Venus only) is a separate larger queue item. Design doc: `terraforming-options.md`.
- **Depends on**: TerraformingService rewrite, GameStateModel amendment
- **Prompt block**: New block, Venus-specific, after core planet panel work
- **Added**: 2026-06-12

### CultureEventService — AudioService on event display

- **File**: src/app/core/systems/culture-event.service.ts
- **Location**: In `_displayEvent()` method
- **TODO**: Play a culture-event notification sound via AudioService when an event is displayed
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### CultureEventService — SaveService resumeQueueAfterLoad wiring

- **File**: src/app/core/services/save.service.ts (or GameShellComponent)
- **Location**: After `hydrate()` call
- **TODO**: Call `cultureEventService.resumeQueueAfterLoad()` after save data is hydrated into GameStateService, so any queued events from the save are resumed
- **Depends on**: CultureEventService, SaveService hydrate flow
- **Prompt block**: TBD (save/load block)
- **Added**: 2026-06-11

### CultureEventService — Choice effects application

- **File**: src/app/core/systems/culture-event.service.ts
- **Location**: `applyChoice()` method (now exists)
- **TODO**: Apply `CultureEventChoice.effects[]` (tech unlocks, resource bonuses, etc.) when a
  choice is selected. Tag increment (`naturalist`/`architect`) is **already implemented**
  (2026-06-13). Only `effects[]` TechTree application remains.
- **Depends on**: Choice effects being populated in culture-events.json + TechTreeService integration
- **Prompt block**: TBD (culture event choices block)
- **Added**: 2026-06-11 | **Partial**: 2026-06-13 (tag increment done)

### PlanetPanelComponent — Orbit view + city lights (Earth, Mars, Venus)

- **File**: src/app/features/planet-panel/planet-panel.component.ts (and orrery)
- **Location**: Planet panel when Earth / Mars / Venus selected
- **TODO**: Show a zoomed "from orbit" view of the selected planet inside the orrery (between the planets-menu and the planet-panel). Earth shows city lights on the dark side driven by `cityLightsIntensity` from `PlanetVisualParams`. Mars/Venus show atmospheric state visually. The orrery camera should zoom toward the selected planet so it fills the viewport between the two side panels.
- **Depends on**: OrreryComponent camera zoom (currently has a TODO comment for this), PlanetVisualParams city lights shader uniform on Earth mesh
- **Prompt block**: TBD (planet visual polish block)
- **Added**: 2026-06-12


### OrreryComponent — Three.js orrery implementation ✓ DONE 2026-06-11

- **File**: src/app/features/orrery/orrery.component.ts
- **Completed**: Full Three.js scene (sun, 4 planet meshes, orbit rings), RAF loop, raycasting,
  hover cross-talk via EventBus.planetHovered$, IntersectionObserver + ResizeObserver cleanup.

### PlanetsPanelComponent — planet list panel

- **File**: src/app/features/hud/planets-panel/planets-panel.component.ts
- **TODO**: ~~Implement per plan `docs/agents/plans/planets-panel.md`~~ — **DONE 2026-06-11**

### GameShellComponent — moonTabActive input to PlanetPanel

- **File**: src/app/features/game-shell/game-shell.component.html
- **Location**: `<app-planet-panel>` element
- **TODO**: Add `[moonTabActive]="moonTabActive()"` input binding once PlanetPanelComponent has a `moonTabActive` input. `moonTabActive` signal and `moonTabRequested$` subscription are added to GameShellComponent in the Planets Panel block.
- **Depends on**: PlanetPanelComponent full implementation (Planet Panel block)
- **Prompt block**: TBD (Planet Panel block)
- **Added**: 2026-06-11

### PlanetPanelComponent — planet detail overlay

- **File**: src/app/features/planet-panel/planet-panel.component.ts
- **Location**: Whole file (currently a stub)
- **TODO**: Tech tree, research tracks, bio-phase display, vignette. Receives planetId input.
- **Depends on**: GameShellComponent (done)
- **Prompt block**: TBD (Planet Panel block)
- **Added**: 2026-06-11

### CultureEventCardComponent — DONE 2026-06-13 / CultureEventToastComponent — DONE 2026-06-13

- **File**: src/app/features/culture-events/culture-event-card/culture-event-card.component.ts ✓ DONE
- **File**: src/app/features/culture-events/culture-event-toast/culture-event-toast.component.ts ✓ DONE
- **Completed**: Bell icon + badge in HudComponent hud__right (between research btn and time-controls), position:fixed toast stack bottom-left, dropdown, `CultureEventService.showNextEvent()` public wrapper. Component moved from GameShellComponent to HudComponent.
- **Prompt block**: 08-2
- **Added**: 2026-06-11 | **Card completed**: 2026-06-13 | **Toast completed**: 2026-06-13

### PauseMenuComponent — pause menu overlay

- **File**: src/app/features/pause-menu/pause-menu.component.ts
- **Location**: Whole file (currently a stub)
- **TODO**: Resume / Save / Load / Settings / Quit. Receives isOpen input, emits closed output.
- **Depends on**: GameShellComponent (done)
- **Prompt block**: TBD (Pause Menu block)
- **Added**: 2026-06-11

### SettingsService — Audio Volume Integration

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for masterVolume, musicVolume, sfxVolume
- **TODO**: Apply volume settings (master, music, sfx) to AudioService when it's implemented
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### SettingsService — Fullscreen + VSync Tauri Wiring

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for `fullscreen` and `vsync`
- **TODO**: Apply fullscreen via `appWindow.setFullscreen()` and VSync via Tauri window API (`@tauri-apps/api/window`)
- **Depends on**: Tauri window API integration
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

### SettingsService — Tauri File Persistence

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `persistSettings()` method
- **TODO**: Write settings to file via `@tauri-apps/plugin-fs` when Tauri is available
- **Depends on**: Tauri fs plugin setup
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

### SettingsService — Tauri File Loading

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `loadSettings()` method
- **TODO**: Load settings from Tauri file and merge with localStorage (file takes precedence)
- **Depends on**: Tauri fs plugin setup
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

### DysonService — AudioService on CME and tier upgrade

- **File**: src/app/core/systems/dyson.service.ts
- **Location**: In `processYear()` CME branch and `upgradeTier()` success path
- **TODO**: Play a sound via AudioService when a CME event fires (dramatic impact sfx) and when a tier upgrade completes (achievement sting). Currently no audio hook.
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### MercuryBuildService — AudioService on build complete

- **File**: src/app/core/systems/mercury-build.service.ts
- **Location**: In `_completeBuild()` method, after `eventBus.mercuryBuildCompleted$.next()`
- **TODO**: Play a build-complete sound (milestone/achievement sting) via AudioService when an orbital component finishes.
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### TechTreeService — TerraformingService integration

- **File**: src/app/core/systems/tech-tree.service.ts
- **Location**: `_applyEffect`, `apply_terraforming_choice` case
- **TODO**: When TerraformingService is implemented, inject it and call
  `terraformingService.applyChoice()` if it needs logic beyond
  `gameState.applyTerraformingChoice()`.
- **Depends on**: TerraformingService (Block TBD)
- **Prompt block**: 03-1 (tech-tree-service)
- **Added**: 2026-06-11

### KardashevService — interstellar_seed_ship_launched condition

- **File**: src/app/core/systems/kardashev.service.ts
- **Location**: `_checkCondition()`, `'interstellar_seed_ship_launched'` case
- **TODO**: Implement when a state flag or tech for interstellar seed ships is added; currently always returns `false`
- **Depends on**: Late-game interstellar feature (Block TBD)
- **Prompt block**: TBD
- **Added**: 2026-06-11

### KardashevService — first_self_sustaining_colony condition

- **File**: src/app/core/systems/kardashev.service.ts
- **Location**: `_checkCondition()`, `'first_self_sustaining_colony'` case
- **TODO**: Revisit `SELF_SUSTAINING_POPULATION` threshold once a ColonyManagementService populates `PlanetState.population`; currently always `false` because no service writes to `population`
- **Depends on**: Colony management system (Block TBD)
- **Prompt block**: TBD
- **Added**: 2026-06-11

### KardashevService — eager instantiation in GameShellComponent

- **File**: src/app/features/game-shell/game-shell.component.ts
- **Location**: Inject calls (GameShellComponent now implemented)
- **TODO**: Add `inject(KardashevService)` so the service's `effect()` is active during the game session
- **Depends on**: Nothing (GameShellComponent is now implemented)
- **Prompt block**: 14
- **Added**: 2026-06-11

### BioPhaseService — initNewGame() call site

- **File**: src/app/features/game-shell/game-shell.component.ts (or game init sequence)
- **Location**: After `gameState.reset()` call when starting a new campaign
- **TODO**: Call `bioPhaseService.initNewGame()` to seed initial `PlanetBioState` for all bio planets
- **Depends on**: GameShellComponent implementation
- **Prompt block**: TBD (Game Shell block)
- **Added**: 2026-06-11

### GameShellComponent — Read slot query param on new game

- **File**: src/app/features/game-shell/game-shell.component.ts
- **Location**: Constructor / init sequence
- **TODO**: Read the `slot` query param from `ActivatedRoute` (passed by TitleScreenComponent or SaveSlotPanelComponent on New Game), initialise fresh game state, and call `saveService.save(slot)` to write the initial save. Defaults to slot 1 if param absent.
- **Depends on**: GameShellComponent implementation block
- **Prompt block**: TBD (Game Shell block)
- **Added**: 2026-06-11

### BioPhaseService — Mercury orbital component requirements

- **File**: src/app/core/systems/bio-phase.service.ts
- **Location**: `_isComponentBuilt()` method
- **TODO**: `PlanetBioState.odnBuilt` / `bioreactorBatchesActive` / `precipitationEnginesBuilt` / `atmosphericCatalystShipsBuilt` are never mutated. Component-gated bio phases (Bio III+ on both planets) will remain locked until MercuryBuildService or an orbital-components service writes to these fields.
- **Depends on**: MercuryBuildService orbital-component feature
- **Prompt block**: TBD (Mercury orbitals block)
- **Added**: 2026-06-11

### MercuryGridComponent — Worker/vehicle rendering

- **File**: `src/app/features/mercury/mercury-grid/mercury-grid.component.ts`
- **Location**: `drawWorkers()` stub method
- **TODO**: Implement worker movement animations. Requires a `mercuryWorkers` signal in
  GameStateService. Workers should move between tiles over time (path-following), rendered as
  coloured moving dots in the RAF loop. Shade-aware: workers in crater tiles should tint darker.
- **Depends on**: `mercuryWorkers: Signal<MercuryWorker[]>` added to GameStateService and
  serialized in SaveService
- **Prompt block**: TBD (post-Block 9)
- **Added**: 2026-06-13

### MercuryGridComponent — Patch for RTS redesign (Block 9.1 patch)

- **File**: `src/app/features/mercury/mercury-grid/mercury-grid.component.ts`
- **Location**: Whole file — targeted extension of existing implementation
- **TODO**: The current grid (Block 9.1) is a 12×10 hardcoded map with free-placement.
  The redesign requires:
  1. **Map size 64×64**: canvas is ~4096×2200px, clipped in a scrollable viewport. Scroll
     position stored as a signal. Mini-map reflects current scroll position.
  2. **Slot-aware placement**: only valid `MercurySlot` tiles (from `mercury-map.json`) accept
     buildings of the correct type. Locked slots render dim with a lock icon.
     Reserved slots (refinery, fusion_reactor, mass_driver, solar_array) only accept their
     designated building type — other buildings cannot be placed there.
  3. **Multi-tile footprint**: 2×2 tiles per building; all footprint tiles checked for validity
  4. **`tileClicked` output** gains `terrain: string` and `slotId: string` fields
  5. **Mining location hover**: HTML overlay tooltip shows ore type ratios when mining slot hovered
  6. **Hardcoded `TERRAIN_MAP`** replaced by slot data from `mercury-map.json` via DataService
- **Depends on**: `mercury-map.json` (Block 9.0), `MercuryMapData` interface in DataService
- **Prompt block**: Block 9.1-patch (before Block 9.2)
- **Added**: 2026-06-13

### Mercury infrastructure paths (post-playtest deferral)

- **File**: New `src/app/features/mercury/mercury-hud/path-drawing/` + `GameStateService`
- **Location**: New feature
- **TODO**: Player-drawn infrastructure paths between buildings. Binary: connected = resources flow,
  unconnected = no flow. Path drawing: click source → click waypoints → click destination.
  90° or straight segments only. Segment highlights red if passing through a building.
  Power lines exempt (underground, visual only). State: `mercuryPaths: MercuryPath[]` in
  GameStateService (already reserved as empty array placeholder).
  For playtest build: resource flow is AUTOMATIC (no path required). This feature adds
  the routing requirement post-playtest.
- **Depends on**: Mercury full view (Block 9.2+), MercuryGridComponent RTS patch
- **Prompt block**: TBD (post-playtest)
- **Added**: 2026-06-13

### Miner SVG walking animation

- **File**: `src/app/features/mercury/mercury-hud/` (miner overlay component)
- **Location**: Miner HTML overlay positioned over canvas
- **TODO**: Miners are rendered as SVG `<img>` elements in an HTML overlay. For playtest:
  static positioning only (at the refinery they are assigned to). Post-playtest: CSS
  `transition` on `top`/`left` properties to animate movement between waypoints.
  Each refinery slot has a static waypoint array (refinery pos → mine pos → refinery pos).
  Miners lerp between waypoints, one segment at a time. REASSIGNING state = straight-line
  walk to new refinery; no resource contribution during transit.
- **Depends on**: Mercury full view (Block 9.2+), miner pool state in GameStateService
- **Prompt block**: TBD (post-playtest)
- **Added**: 2026-06-13

### GameStateService — Mercury RTS paths signal (post-playtest)

- **File**: `src/app/core/services/game-state.service.ts`
- **Location**: New signal + serialisation
- **TODO**: Add `mercuryPaths: Signal<MercuryPath[]>` — empty for playtest; infrastructure path drawing. `MercuryPath` type already exists in `game-state.model.ts` (Block 9.6). Add signal, serialise/hydrate, and path-drawing UI when path mechanic is designed.
- **Depends on**: Path mechanic design (post-playtest)
- **Prompt block**: TBD (post-playtest)
- **Added**: 2026-06-14

### CultureEventCardComponent — Click protection (quick fix)

- **File**: `src/app/features/culture-events/culture-event-card/culture-event-card.component.scss`
- **Location**: Root element styles
- **TODO**: Add `pointer-events: none` for 800ms on card appearance to prevent accidental clicks
  when an event pops up mid-gameplay. CSS-only, no logic change:
  ```scss
  :host { animation: event-block-clicks 0.8s step-end forwards; }
  @keyframes event-block-clicks { from { pointer-events: none; } to { pointer-events: auto; } }
  ```
- **Depends on**: Nothing — can be done immediately
- **Prompt block**: Quick fix, any block
- **Added**: 2026-06-13

---

## Completed TODOs

_(Moved here when implemented, kept for history)_

### ✅ Global resource/power HUD strip — ResourcePowerBarComponent
- **Completed**: 2026-06-14
- **Implemented in**: `src/app/shared/components/resource-power-bar/resource-power-bar.component.ts/.html/.scss`
- **Notes**: New shared standalone component. Reads `mercuryResources`, `mercuryBuildings`, `dysonEnergyWatts`, `resourceReservations` from GameStateService. Computes `resourceRates` from operational buildings via `DataService.getMercuryBuilding()`. Power bar green/amber/red via `[data-color]` attribute. Reservation inputs shown only in Mercury view via `showReservationInputs` input. Wired into `game-shell.component.html` outside both view containers (position: fixed). Tokens `--color-success/warning/danger` added to `tokens.scss`. `dysonConsumptionTw` is a 0.8 TW placeholder pending DysonService consumer registration.

### ✅ GameStateService — Mercury RTS signals
- **Completed**: 2026-06-14
- **Implemented in**: `src/app/core/services/game-state.service.ts`, `src/app/core/models/game-state.model.ts`
- **Notes**: Added `MercurySlotStatus`, `MercuryMinerState`, `MercuryPath` types. Added 4 private signals (`_mercurySelectedZone`, `_mercuryMiners`, `_mercurySlotStates`, `_resourceReservations`), 4 public readonly signals, `mercuryLocalPower` computed, 6 mutation methods (`selectMercuryZone`, `assignMiner`, `unassignMiner`, `reassignMiner`, `setResourceReservation`, `setMercurySlotState`), `_unlockAdjacentSlots` private helper wired to `updateBuildingStatus`. Serialise/hydrate/reset patched. `building-info.component.ts/.html` updated with typed signals and assign/unassign buttons (Block 9.5b patch). `mercuryPaths` deferred to post-playtest (new TODO above).

### ✅ HudComponent — full HUD implementation
- **Completed**: 2026-06-11
- **Implemented in**: `src/app/features/hud/hud.component.ts` + sub-components (Prompt 05-2)
- **Notes**: YearLabelComponent (MONO 2xl), KardashevBarComponent (tick-driven fill bar, Kardashev
  level 0.73–2.0), TimeControlsComponent (pause/resume, 1×/4× speed, 4× hidden on first playthrough).
  Autosave indicator uses `effect()` + `lastAutosaveCount` guard to skip initial run.
  `GameYearPipe` added to `src/app/shared/pipes/`. EventBusService injected for future milestone toasts.

### ✅ Routes — TitleScreenComponent stub
- **Completed**: 2026-06-11
- **Implemented in**: `src/app/features/title-screen/title-screen.component.ts` (Block 04-1)
- **Notes**: Full TitleScreen with New Game / Continue / Load Game / Options / Quit, SaveSlotPanelComponent, and SettingsComponent overlay. Plan at `docs/agents/plans/04-1-title-screen.md`.

### ✅ TechTreeService — TerraformingService integration
- **Completed**: 2026-06-11
- **Implemented in**: `TerraformingService.applyChoice()` + `TechTreeService._applyEffect()`
- **Notes**: `_applyEffect` now delegates `apply_terraforming_choice` to `terraformingService.applyChoice()`.
  TerraformingService handles validation, state write, special-case side effects (polar detonation,
  Europa impact), and `terraformingChoiceApplied$` emission.

### ✅ Routes — GameShellComponent stub
- **Completed**: 2026-06-11
- **Implemented in**: `src/app/features/game-shell/game-shell.component.ts` (Prompt 05-1)
- **Notes**: Full GameShellComponent with CSS Grid layout, `selectedPlanetId`/`isPauseMenuOpen` signals,
  EventBus `planetSelected$` subscription, `document:keydown.escape` handler, AudioService one-time init
  on first interaction, GameLoopService start/stop on init/destroy. Child components (orrery, HUD,
  panels, culture events, pause menu) created as stubs — see Active TODOs for their full implementations.
