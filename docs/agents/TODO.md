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
- **Location**: New `applyChoice(eventId, choiceId)` public method
- **TODO**: Apply `CultureEventChoice.effects[]` (colonist tag increments, tech unlocks, etc.) when a choice is selected. Currently all choices in JSON have empty effects arrays.
- **Depends on**: Choice effects being populated in culture-events.json + TechTreeService integration
- **Prompt block**: TBD (culture event choices block)
- **Added**: 2026-06-11

### Routes — GameShellComponent stub

- **File**: src/app/features/game-shell/game-shell.component.ts
- **Location**: Whole file
- **TODO**: Replace stub with real GameShellComponent implementation
- **Depends on**: Game Shell feature block
- **Prompt block**: TBD (Game Shell block)
- **Added**: 2026-06-11

### SettingsService — Audio Volume Integration

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for masterVolume, musicVolume, sfxVolume
- **TODO**: Apply volume settings (master, music, sfx) to AudioService when it's implemented
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### SettingsService — Fullscreen Toggle

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for fullscreen
- **TODO**: Apply fullscreen setting via Tauri window API (`@tauri-apps/api/window`)
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
- **Location**: Constructor / `inject()` calls
- **TODO**: Add `inject(KardashevService)` so the service's `effect()` is active during the game
- **Depends on**: GameShellComponent (Block 14)
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

---

## Completed TODOs

_(Moved here when implemented, kept for history)_

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
