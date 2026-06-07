# PROMPTS.md — Helioscape Prompt Sequence

Run prompts in the numbered order below.
Always have AGENTS.md and ARCHITECTURE.md open in your editor as context tabs in Copilot.

**Model guide:**
- **GPT-5.4** — JSON data files, simple interfaces, basic components
- **Sonnet 4.6** — services with logic, Three.js, canvas, complex components
- **GPT-5.5** — only for the most complex files if Sonnet is unavailable (costs most)

Each prompt is self-contained. Open the relevant file (or a new empty file) before pasting.

---

# BLOCK 0 — Interfaces and models

*GPT-5.4. No logic — just TypeScript interfaces. Fast and cheap.*

---

## 0.1 — `src/app/core/models/planet.model.ts`

```
Create src/app/core/models/planet.model.ts for Helioscape.

Define these exported interfaces:

PlanetId = 'earth' | 'mercury' | 'mars' | 'venus'

PlanetData — static data loaded from planets.json:
  id: PlanetId
  displayName: string
  unlockCondition: string | null   // null = always unlocked (Earth)
  initialState: PlanetInitialState
  visual: PlanetVisualData

PlanetInitialState:
  atmospherePressure: number
  temperatureCelsius: number
  terraformingPhase: number
  axisSpinSpeed: number
  cloudRotationSpeed: number
  atmosphereColor: string          // hex
  atmosphereDensity: number

PlanetVisualData:
  baseColor: string
  layerTextures: Record<string, string>   // layer name → asset path
  waterSpotUvs: [number, number][]
  greenSpotUvs: [number, number][]
  lavaSpotUvs?: [number, number][]        // mars only
  lavaHueData?: { hotHue: number; cooledHue: number }  // mars only
  cityLightsTexture?: string              // earth only

PlanetState — mutable runtime state stored in GameStateService:
  id: PlanetId
  atmospherePressure: number
  temperatureCelsius: number
  terraformingPhase: number
  terraformingProgress: number        // 0.0-1.0 within current phase
  terraformingChoices: Record<string, TerraformingChoice>
  lockedOutChoices: string[]
  population: number
  hasBiodome: boolean
  visualParams: PlanetVisualParams    // current computed shader/CSS values
  terraformStartYear: number          // for getValueAtYear() pattern
  terraformEndYear: number

TerraformingChoice:
  active: boolean
  startedYear: number
  permanent: boolean

PlanetVisualParams:
  waterGrowthRadius: number
  waterOpacity: number
  greenGrowthRadius: number
  greenOpacity: number
  lavaOpacity: number
  lavaHueShift: number               // 0 = hot red, 1 = cooled black
  cloudOpacity: number
  atmosphereDensity: number
  atmosphereColor: string            // hex, changes as planet transforms
  cloudRotationSpeed: number
  axisSpinSpeed: number
  cityLightsIntensity: number        // earth only

Export all interfaces. No classes, no logic.
```

---

## 0.2 — `src/app/core/models/tech-tree.model.ts`

```
Create src/app/core/models/tech-tree.model.ts for Helioscape.

TechNode:
  id: string
  planet: string
  displayName: string
  prerequisites: string[]
  prerequisiteMode?: 'all' | 'any'     // default 'all'
  spilloverPrerequisites: string[]
  spilloverGate?: { mode: 'min_naturalist_nodes'; count: number }
  rpCost: number
  durationYears: number
  effects: TechEffect[]
  tier?: number

TechEffect — discriminated union:
  | { type: 'unlock_tech'; target: string }
  | { type: 'emit_event'; eventId: string }
  | { type: 'spillover_unlock'; targetPlanet: string; targetTech: string }
  | { type: 'apply_terraforming_choice'; planet: string; choiceId: string; permanent: boolean }
  | { type: 'tag_decision'; tag: 'naturalist' | 'architect' }
  | { type: 'apply_colonist_bonus'; bonus: 'dense_living' | 'open_environment' }
  | { type: 'rp_capacity_boost'; amount: number }
  | { type: 'set_flag'; flag: string }
  | { type: 'present_fork'; forkId: string; choices: ForkChoice[] }

ForkChoice:
  id: string
  label: string
  tag: 'naturalist' | 'architect' | ''
  effects: TechEffect[]

ResearchTrack:
  id: string
  displayName: string
  planet: string
  rpCost: number
  durationYears: number
  description: string
  prerequisiteTech: string
  onCompleteEffects: TechEffect[]

ActiveResearchTrack:
  trackId: string
  planetId: string
  progressYears: number
  isPaused: boolean

Export all. No logic.
```

---

## 0.3 — `src/app/core/models/culture-event.model.ts`

```
Create src/app/core/models/culture-event.model.ts for Helioscape.

CultureEvent — static data from JSON:
  id: string
  title: string
  narratorText: string         // 1-3 paragraphs, \n\n between paragraphs
  portrait: string             // SVG asset path
  choices: CultureEventChoice[]
  tags: ('naturalist' | 'architect')[]
  trigger: CultureEventTrigger
  priority: boolean            // true = displaces current event

CultureEventChoice:
  id: string
  label: string
  tag: 'naturalist' | 'architect' | ''
  effects: import('./tech-tree.model').TechEffect[]

CultureEventTrigger — discriminated union:
  | { type: 'tech_completed'; techId: string }
  | { type: 'milestone_reached'; milestoneId: string }
  | { type: 'year_reached'; year: number }
  | { type: 'terraforming_choice_applied'; planet: string; choiceId: string }
  | { type: 'dyson_percent_reached'; percent: number }
  | { type: 'bio_phase_complete'; planet: string; phase: string }
  | { type: 'bio_phase_collapsed'; planet: string }

CultureEventEntry — queue item (serialised in save):
  eventId: string
  queuedAtYear: number
  priority: boolean
  wasInterrupted: boolean

Export all. No logic.
```

---

## 0.4 — `src/app/core/models/game-state.model.ts`

```
Create src/app/core/models/game-state.model.ts for Helioscape.

This file defines the shape of the full serialisable game state (what gets saved/loaded).

SerializedGameState:
  version: number
  saveTimestamp: number
  gameYear: number
  gameSpeed: 1 | 4
  isPaused: boolean
  isFirstPlaythrough: boolean
  planets: Record<string, PlanetState>   // from planet.model.ts
  completedTechs: string[]
  activeResearch: ActiveResearchTrack[]  // from tech-tree.model.ts
  pendingFork: PendingFork | null
  mercuryResources: ResourceStore
  mercuryBuildings: PlacedBuilding[]
  mercuryBuildQueue: MercuryQueueEntry[]
  dysonPanelCount: number
  dysonPanelTier: 'basic' | 'mid' | 'hardened'
  dysonCoveragePercent: number
  dysonEnergyWatts: number
  kardashevLevel: number
  completedMilestones: string[]
  naturalistCount: number
  architectCount: number
  colonistBonuses: { denseLiving: boolean; openEnvironment: boolean }
  earthFlags: Record<string, boolean>
  cultureEventQueue: CultureEventEntry[]   // from culture-event.model.ts
  cultureEventHistory: CultureEventHistoryEntry[]
  bioPhases: Record<string, PlanetBioState>
  europaState: EuropaState
  currentSaveSlot: number

PendingFork:
  techId: string
  planetId: string
  forkId: string

ResourceStore:
  commonOre: number
  rareMetals: number
  polarVolatiles: number

PlacedBuilding:
  id: string
  buildingId: string
  col: number
  row: number
  status: 'building' | 'operational'
  buildProgressYears: number
  totalBuildYears: number

MercuryQueueEntry:
  componentId: string
  targetPlanet: string
  progressYears: number
  totalYears: number

PlanetBioState:
  currentPhaseIndex: number
  phases: BioPhaseState[]
  odnBuilt: boolean
  bioreactorBatchesActive: number
  precipitationEnginesBuilt: number
  atmosphericCatalystShipsBuilt: number
  requestsSent: string[]
  discoveredOrganisms: string[]

BioPhaseState:
  status: 'locked' | 'available' | 'running' | 'complete' | 'collapsed'
  actionsTaken: string[]
  progressYears: number
  durationYears: number
  startedYear: number
  completedYear: number

CultureEventHistoryEntry:
  eventId: string
  year: number
  planetContext: string

EuropaState:
  missionAuthorised: boolean
  impactYear: number
  impacted: boolean
  lifeConfirmed: boolean

Export all. No logic.
```

---

## 0.5 — `src/app/core/models/index.ts`

```
Create src/app/core/models/index.ts.
Re-export everything from all model files in this folder:
  export * from './planet.model';
  export * from './tech-tree.model';
  export * from './culture-event.model';
  export * from './game-state.model';
```

---

## 0.6 — `src/app/shared/utils/math.utils.ts`

```
Create src/app/shared/utils/math.utils.ts for Helioscape.

Export these pure utility functions, all statically typed, with JSDoc comments:

clamp(value: number, min: number, max: number): number
lerp(start: number, end: number, t: number): number
  // t is clamped to 0-1 internally
inverseLerp(start: number, end: number, value: number): number
  // returns 0-1 indicating where value falls between start and end

getValueAtYear(
  currentYear: number,
  startYear: number,
  endYear: number,
  startValue: number,
  endValue: number
): number
  // Core pattern for all time-based value interpolation.
  // Uses clamp internally so values before startYear return startValue
  // and values after endYear return endValue.
  // Comment: this is the primary tool for safe save/load of visual transitions.

hexToRgb(hex: string): { r: number; g: number; b: number } | null
lerpColor(hexA: string, hexB: string, t: number): string
  // Lerps between two hex colours, returns hex string

radToDeg(rad: number): number
degToRad(deg: number): number

No imports. No side effects. Pure functions only.
```

---

# BLOCK 1 — Core services

*Sonnet 4.6 for all of these.*

---

## 1.1 — `src/app/core/services/settings.service.ts`

```
Create src/app/core/services/settings.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md before implementing.

@Injectable({ providedIn: 'root' }) singleton.

Responsibility: load, persist, and apply all player settings.
Settings are stored separately from game saves — they persist across all sessions.
Storage: localStorage key 'helioscape_settings' (JSON).
Tauri: when window.__TAURI__ is defined, additionally write to a settings file
via @tauri-apps/plugin-fs. For now, implement localStorage fallback only with
a comment marking where Tauri file write should be added.

Default settings object (typed as SettingsValues interface — define it in this file):
  masterVolume: number = 0.8
  musicVolume: number = 0.8
  sfxVolume: number = 0.8
  fullscreen: boolean = false
  vsync: boolean = true
  uiScale: number = 1.0      // 1.0 | 1.25 | 1.5 | 2.0
  textSizeMultiplier: number = 1.0
  colorblindMode: boolean = false
  reducedMotion: boolean = false
  highContrast: boolean = false
  autosaveIntervalYears: number = 10
  confirmIrreversible: boolean = true

Private writable signals, public readonly signals (pattern from ARCHITECTURE.md).
Expose a get(key) method and a set(key, value) method.
set() applies the setting immediately AND persists to storage.

Apply methods (called in constructor after loading):
  applyUiScale(scale): document.documentElement.style.setProperty('--ui-scale', scale.toString())
  applyReducedMotion(reduced): document.documentElement.classList.toggle('reduced-motion', reduced)
  applyColorblind(on): document.documentElement.classList.toggle('colorblind', on)
  applyHighContrast(on): document.documentElement.classList.toggle('high-contrast', on)
  Volume/audio applies: comment as TODO — AudioService not yet implemented.

resetToDefaults(): restores all settings to defaults and persists.

Export SettingsValues interface separately for use in settings component.
```

---

## 1.2 — `src/app/core/services/data.service.ts`

```
Create src/app/core/services/data.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }) singleton.

Responsibility: load all JSON data files at startup. Provide typed synchronous accessors.
Data is immutable after load — never modified at runtime.

Import types from '@app/core/models'.

Files to load (all from /data/ path):
  planets.json → Record<string, PlanetData>, keyed by planet id
  tech-tree.json → TechNode[]
  research-tracks.json → ResearchTrack[]
  culture-events.json → CultureEvent[]
  kardashev-milestones.json → KardashevMilestone[] (define this interface inline)
  resources.json → ResourceData[] (define inline)
  mercury-buildings.json → MercuryBuilding[] (define inline)
  bio-phases.json → Record<string, BioPhaseDef[]> (define inline)

KardashevMilestone: id, displayName, description, conditions: string[], approximateYearRange: string, effects: TechEffect[]
ResourceData: id, displayName, description, rarity, baseAccumulationRate, color
MercuryBuilding: id, displayName, description, category, cost: ResourceStore, energyDrawGw, buildTimeYears, repeatable, maxInstances, unlockCondition, placementRule, effects: MercuryBuildingEffect[]
MercuryBuildingEffect: type ('resource_rate'|'dyson_panels_per_year'|'rp_capacity_boost'), resourceId?, rate?, amount?
BioPhaseDef: id, displayName, nominalDurationYears, actions: string[], requiresComponents: string[], requiresRequest?: string, canStartAtPreviousPercent?: number, spilloverTech?: string, completeCeId: string

loadAll(): Promise<void>
  Fetches all files in parallel with Promise.all.
  Parses JSON and stores in private class fields.
  Call this from the APP_INITIALIZER token in app.config.ts.
  Log a console.error and throw if any file fails to load.

Typed accessors:
  getPlanet(id: string): PlanetData
  getAllPlanets(): PlanetData[]
  getTechNode(id: string): TechNode | undefined
  getTechNodesForPlanet(planetId: string): TechNode[]
  getResearchTrack(id: string): ResearchTrack | undefined
  getResearchTracksForPlanet(planetId: string): ResearchTrack[]
  getCultureEvent(id: string): CultureEvent | undefined
  getAllCultureEvents(): CultureEvent[]
  getMilestone(id: string): KardashevMilestone | undefined
  getAllMilestones(): KardashevMilestone[]
  getMercuryBuilding(id: string): MercuryBuilding | undefined
  getAllMercuryBuildings(): MercuryBuilding[]
  getBioPhases(planetId: string): BioPhaseDef[]
```

---

## 1.3 — `src/app/core/services/game-state.service.ts`

```
Create src/app/core/services/game-state.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md carefully — this is the most important service.

@Injectable({ providedIn: 'root' }) singleton.
Import all types from '@app/core/models'.

Responsibility: single source of truth for all mutable runtime game state.
Holds private writable signals, exposes public readonly signals.
Provides typed mutation methods — no other service mutates state directly.

Private signals (all typed):
  _gameYear, _gameSpeed, _isPaused, _isFirstPlaythrough, _currentSaveSlot
  _planets (Record<string, PlanetState>)
  _completedTechs (string[])
  _activeResearch (ActiveResearchTrack[])
  _pendingFork (PendingFork | null)
  _mercuryResources (ResourceStore)
  _mercuryBuildings (PlacedBuilding[])
  _mercuryBuildQueue (MercuryQueueEntry[])
  _dysonPanelCount, _dysonPanelTier, _dysonCoveragePercent, _dysonEnergyWatts
  _kardashevLevel, _completedMilestones
  _naturalistCount, _architectCount
  _colonistBonuses, _earthFlags
  _cultureEventQueue (CultureEventEntry[])
  _cultureEventHistory (CultureEventHistoryEntry[])
  _bioPhases (Record<string, PlanetBioState>)
  _europaState (EuropaState)

Public readonly signals via .asReadonly() on each private signal.

Computed signals (public):
  totalRpCapacity = computed(() => 60 + this.rpCapacityBoosts())
  usedRpCapacity = computed(() =>
    this._activeResearch().filter(t => !t.isPaused).reduce((sum, t) => sum + ..., 0)
  )
  — compute rp cost from DataService injected here

Mutation methods (one per logical operation — not setters for every field):
  advanceYear(): void — increments _gameYear by 1
  setSpeed(speed: 1 | 4): void
  togglePause(): void
  unlockTech(techId: string): void — adds to _completedTechs
  startResearch(trackId: string, planetId: string): void
  pauseResearch(trackId: string): void
  resumeResearch(trackId: string): void
  advanceResearch(trackId: string, years: number): void — increments progress
  completeResearch(trackId: string): void — removes from active, adds to completedTechs
  applyTerraformingChoice(planetId: string, choiceId: string, permanent: boolean): void
  updatePlanetVisualParams(planetId: string, params: Partial<PlanetVisualParams>): void
  addToEventQueue(entry: CultureEventEntry): void
  addPriorityEvent(eventId: string, queuedAtYear: number): void
    — if currentEvent exists, re-queue it at index 0 with wasInterrupted: true
    — then push priority event as current
  shiftEventQueue(): CultureEventEntry | undefined
  recordEventHistory(entry: CultureEventHistoryEntry): void
  setPendingFork(fork: PendingFork | null): void
  completeFork(techId: string, choiceId: string): void
  updateMercuryResources(delta: Partial<ResourceStore>): void
  placeMercuryBuilding(building: PlacedBuilding): void
  updateBuildingStatus(buildingId: string, status: 'building' | 'operational'): void
  updateBuildingProgress(id: string, progress: number): void
  setDysonState(panelCount: number, coveragePercent: number, energyWatts: number): void
  setKardashevLevel(level: number): void
  completeMilestone(milestoneId: string): void
  incrementNaturalist(): void
  incrementArchitect(): void
  setColonistBonus(bonus: 'denseLiving' | 'openEnvironment', value: boolean): void
  setEarthFlag(flag: string, value: boolean): void
  updateBioPhase(planetId: string, phaseIndex: number, update: Partial<BioPhaseState>): void
  authoriseEuropa(impactYear: number): void

reset(): void — resets all signals to initial values (new game).
  Do NOT reset currentSaveSlot.

hydrate(state: SerializedGameState): void — restores all signals from a loaded save.
serialise(): SerializedGameState — snapshot all signal values into a plain object.
```

---

## 1.4 — `src/app/core/services/game-loop.service.ts`

```
Create src/app/core/services/game-loop.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }) singleton.

Responsibility: the single game clock. Advances gameYear via GameStateService.
Uses setInterval — NOT requestAnimationFrame.
All visual animation happens in component RAF loops independently.

Inject: GameStateService, inject(DestroyRef).

Private state (not signals — internal only):
  private intervalId: ReturnType<typeof setInterval> | null = null
  private remainingMs: number = 0   // for clean pause/resume

Computed tick interval:
  readonly tickMs = computed(() =>
    this.gameState.gameSpeed() === 4 ? 500 : 1000
  );

Methods:
  start(): void — starts the interval, sets intervalId
  stop(): void — clears interval, stores remainingMs for resume
  pause(): void — same as stop but sets gameState.isPaused
  resume(): void — restarts interval, uses remainingMs to avoid losing partial tick
  setSpeed(speed: 1 | 4): void — restarts interval with new tickMs

On each tick:
  if (!this.gameState.isPaused()) {
    this.gameState.advanceYear();
    // GameLoop does NOT process year events — system services use effect() to react
  }

Watch gameSpeed changes with effect() — when speed changes, restart the interval.

Call stop() in a destroy hook (inject DestroyRef, use takeUntilDestroyed pattern).
```

---

## 1.5 — `src/app/core/services/save.service.ts`

```
Create src/app/core/services/save.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }) singleton.

Responsibility: serialise/deserialise GameStateService to/from JSON.
Detects Tauri vs browser environment and uses appropriate storage.

Inject: GameStateService, SettingsService.

const SAVE_VERSION = 1;
const MAX_SLOTS = 3;
const AUTOSAVE_SLOT = 0;

readonly isTauri: boolean = '__TAURI__' in window;

getSavePath(slot: number): string
  — slot 0: 'helioscape_autosave'
  — slot N: 'helioscape_save_N'
  — in browser: used as localStorage key
  — in Tauri: used as filename (comment: TODO add appDataDir() prefix)

save(slot: number): Promise<void>
  const state = this.gameState.serialise();
  const payload = JSON.stringify({ ...state, version: SAVE_VERSION,
    saveTimestamp: Date.now() });
  if (isTauri) { /* TODO: write via @tauri-apps/plugin-fs */ }
  else { localStorage.setItem(this.getSavePath(slot), payload); }

load(slot: number): Promise<boolean>
  Reads from storage. Parses JSON. Checks version. Calls _migrate() if needed.
  Calls this.gameState.hydrate(parsed). Returns true on success, false if not found.

autosave(): Promise<void>
  Calls save(AUTOSAVE_SLOT). Quiet — no UI feedback from this service.
  (HUD listens to a signal that this service sets after autosave.)

private _autosaveSignal = signal(0);
readonly autosaveCompleted = this._autosaveSignal.asReadonly();
After each autosave: this._autosaveSignal.update(n => n + 1);

getSlotInfo(slot: number): SlotInfo
  interface SlotInfo { exists: boolean; gameYear?: number;
    kardashevLevel?: number; saveTimestamp?: number; isAutosave: boolean; }
  Reads from storage without full deserialisation.
  Parses only top-level fields for display.

getAllSlotInfos(): SlotInfo[]  — returns array for slots 0 through MAX_SLOTS

hasSave(): boolean — true if any slot has data

delete(slot: number): void — removes from storage

private _migrate(data: any, fromVersion: number): SerializedGameState
  Stub with comment explaining version-keyed migration pattern.
```

---

## 1.6 — `src/app/core/services/event-bus.service.ts`

```
Create src/app/core/services/event-bus.service.ts for Helioscape.

@Injectable({ providedIn: 'root' }) singleton.

Thin typed event emitter using RxJS Subject.
Does NOT hold state — that is GameStateService's job.
Use for cross-feature events where a signal is insufficient
(e.g. one-shot notifications, events with payload that must be reacted to once).

Import { Subject } from 'rxjs'.

Subjects (all typed):
  readonly techUnlocked$ = new Subject<{ planetId: string; nodeId: string }>();
  readonly researchCompleted$ = new Subject<string>();  // trackId
  readonly terraformingChoiceApplied$ = new Subject<{ planetId: string; choiceId: string }>();
  readonly terraformingPhaseChanged$ = new Subject<{ planetId: string; phase: number }>();
  readonly cultureEventTriggered$ = new Subject<string>();  // eventId
  readonly milestoneReached$ = new Subject<string>();  // milestoneId
  readonly dysonEnergyUpdated$ = new Subject<number>();  // watts
  readonly bioPhaseStarted$ = new Subject<{ planetId: string; phaseId: string }>();
  readonly bioPhaseCompleted$ = new Subject<{ planetId: string; phaseId: string }>();
  readonly bioPhaseCollapsed$ = new Subject<{ planetId: string; phaseId: string }>();
  readonly mercuryBuildCompleted$ = new Subject<string>();  // componentId
  readonly planetSelected$ = new Subject<string>();  // planetId
  readonly forkPresented$ = new Subject<{ planetId: string; techId: string }>();
  readonly autosaveCompleted$ = new Subject<void>();

No other logic. No state. No methods beyond emitting via .next().
```

---

# BLOCK 2 — App configuration

*GPT-5.4.*

---

## 2.1 — `src/app/app.config.ts`

```
Create src/app/app.config.ts for Helioscape.

Use Angular's ApplicationConfig with provideRouter and APP_INITIALIZER.

Routes:
  '' → TitleScreenComponent (lazy: () => import('./features/title-screen/...'))
  'game' → GameShellComponent (lazy: () => import('./features/game-shell/...'))

APP_INITIALIZER: calls DataService.loadAll() before the app bootstraps.
  Use inject(DataService).loadAll() in the factory function.
  multi: true, useFactory pattern.

Also provide: provideHttpClient() for any future HTTP needs.
```

---

## 2.2 — `src/app/app.component.ts`

```
Create src/app/app.component.ts for Helioscape.

Minimal root component. Just a router outlet.

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100vh; width: 100vw; }']
})
export class AppComponent {}
```

---

# BLOCK 3 — System services

*Sonnet 4.6 for all. These contain game logic.*

---

## 3.1 — `src/app/core/systems/tech-tree.service.ts`

```
Create src/app/core/systems/tech-tree.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

Responsibility: tech node prerequisite checking, unlocking, fork handling, effect processing.
Never holds state — reads from and writes to GameStateService only.

canUnlock(planetId: string, nodeId: string): boolean
  Load tech node from DataService.
  Check all prerequisites in gameState.completedTechs().
  Check prerequisiteMode ('all' | 'any').
  Check spilloverPrerequisites.
  Check spilloverGate if present (naturalistCount >= gate.count).
  Return false if pendingFork is not null (must resolve fork before unlocking more).

unlockTech(planetId: string, nodeId: string): void
  Guard: if not canUnlock, return.
  If node has 'present_fork' effect: call _presentFork(), return without completing.
  Otherwise: gameState.unlockTech(nodeId).
  Process all effects via _applyEffect().
  Emit eventBus.techUnlocked$.next({ planetId, nodeId }).

completeForkChoice(planetId: string, techId: string, choiceId: string): void
  Get fork data from tech node.
  Apply chosen fork's effects via _applyEffect().
  gameState.completeFork(techId, choiceId).
  Emit techUnlocked$.

private _presentFork(planetId: string, techId: string, forkData: ForkEffect): void
  gameState.setPendingFork({ techId, planetId, forkId: forkData.forkId }).
  eventBus.forkPresented$.next({ planetId, techId }).

private _applyEffect(effect: TechEffect, planetId: string): void
  Handle all TechEffect discriminated union types:
  - unlock_tech: recursively call unlockTech
  - emit_event: gameState.addToEventQueue(...)
  - apply_terraforming_choice: import and call TerraformingService.applyChoice()
    (use inject() lazily to avoid circular dep)
  - tag_decision: gameState.incrementNaturalist/Architect
  - apply_colonist_bonus: gameState.setColonistBonus()
  - rp_capacity_boost: note this is handled via computed in GameStateService
    (store boosts in a separate signal array)
  - set_flag: gameState.setEarthFlag()
  - spillover_unlock: gameState.unlockTech() for target
  Comment each case.

getAvailableTechs(planetId: string): TechNode[]
  All nodes for this planet where canUnlock() is true.

getCompletedTechs(planetId: string): TechNode[]
  All nodes for this planet in completedTechs signal.
```

---

## 3.2 — `src/app/core/systems/research.service.ts`

```
Create src/app/core/systems/research.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService, TechTreeService.

Uses effect() to react to game year ticks.

constructor() {
  effect(() => {
    const year = inject(GameStateService).gameYear();
    untracked(() => this.processYear(year));
  });
}

processYear(year: number): void
  For each active (not paused) research track:
    gameState.advanceResearch(trackId, 1).
    Check if progressYears >= track.durationYears.
    If complete: _completeTrack(trackId).

_completeTrack(trackId: string): void
  gameState.completeResearch(trackId).
  Process onCompleteEffects via TechTreeService._applyEffect.
  eventBus.researchCompleted$.next(trackId).

canStartTrack(trackId: string): boolean
  prerequisiteTech is in completedTechs.
  Track not already active or completed.
  usedRpCapacity + track.rpCost <= totalRpCapacity.

startTrack(trackId: string, planetId: string): void
  Check if already in activeResearch with isPaused — resume instead.
  Else add new entry. gameState.startResearch().

pauseTrack(trackId: string): void
  gameState.pauseResearch(trackId).
  Frees RP capacity (handled by GameStateService.usedRpCapacity computed).

resumeTrack(trackId: string): void
  Guard: enough RP capacity available.
  gameState.resumeResearch(trackId).
```

---

## 3.3 — `src/app/core/systems/terraforming.service.ts`

```
Create src/app/core/systems/terraforming.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

Uses effect() to react to gameYear.

Rate constants (at top of file, tune after playtesting):

const CHOICE_RATES: Record<string, Record<string, ChoiceRates>> = {
  mars: {
    mars_polar_detonation:  { pressureRate: 0.0002, tempRate: 0.5, phaseContribution: 0.04 },
    mars_orbital_mirrors:   { pressureRate: 0.0001, tempRate: 0.3, phaseContribution: 0.025 },
    mars_magnetic_umbrella: { pressureRate: 0.00005, tempRate: 0.1, phaseContribution: 0.015 },
    mars_biological_seeding:{ pressureRate: 0, tempRate: 0, phaseContribution: 0.02 },
    mars_comet_water_delivery: { pressureRate: 0.00008, tempRate: 0, phaseContribution: 0.01 },
  },
  venus: {
    venus_orbital_shade_mirror:     { pressureRate: -0.0003, tempRate: -0.4, phaseContribution: 0.03 },
    venus_carbonate_sequestration:  { pressureRate: -0.0002, tempRate: -0.2, phaseContribution: 0.025 },
    venus_europa_impact:            { pressureRate: -0.001,  tempRate: -1.0, phaseContribution: 0.06 },
  }
};

interface ChoiceRates { pressureRate: number; tempRate: number; phaseContribution: number; }

processYear(year: number): void — called via effect()
  For each planet (mars, venus):
    If not unlocked (not in gameState.planets()), skip.
    Sum contributions from all active choices.
    Update atmosphere pressure and temperature.
    Increment terraforming progress.
    If progress >= 1.0: _advancePhase(planetId).
    _computeAndUpdateVisualParams(planetId, year).

_advancePhase(planetId: string): void
  Increment phase, reset progress.
  eventBus.terraformingPhaseChanged$.next({ planetId, phase: newPhase }).
  Push culture event CE to queue.

applyChoice(planetId: string, choiceId: string, permanent: boolean): void
  Called by TechTreeService.
  Validates choice not in lockedOutChoices.
  gameState.applyTerraformingChoice(...).
  Special cases:
    mars_polar_detonation: set radiation clear year (+40), add locked choices.
    venus_europa_impact: gameState.authoriseEuropa(currentYear + random(50, 70)).
  eventBus.terraformingChoiceApplied$.next({ planetId, choiceId }).

_computeAndUpdateVisualParams(planetId: string, year: number): void
  From current atmospheric data, compute PlanetVisualParams.
  Use getValueAtYear() from math.utils for each param.
  gameState.updatePlanetVisualParams(planetId, params).
  Comment each param's derivation formula.
```

---

## 3.4 — `src/app/core/systems/culture-event.service.ts`

```
Create src/app/core/systems/culture-event.service.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

readonly BREATHER_MS = 1500;
readonly INTERRUPTED_BREATHER_MS = 750;

readonly currentEvent = signal<CultureEventEntry | null>(null);
readonly isDisplayingEvent = computed(() => this.currentEvent() !== null);

Uses effect() to watch gameYear and check time-based triggers.
Uses takeUntilDestroyed subscriptions for eventBus$ subjects.

constructor() {
  effect(() => {
    const year = this.gameState.gameYear();
    untracked(() => {
      this._checkYearTriggers(year);
      this._checkEuropaTrigger(year);
    });
  });
  
  // Subscribe to all event bus subjects
  this.eventBus.techUnlocked$
    .pipe(takeUntilDestroyed())
    .subscribe(({ nodeId }) => this._checkTechTriggers(nodeId));
  
  // etc. for milestones, bio phases, dyson, terraforming choices
}

queueEvent(eventId: string, priority: boolean = false): void
  Load event from DataService. If not found, warn and return.
  If priority: gameState.addPriorityEvent(eventId, currentYear).
    — If currentEvent() is not null, it gets re-queued with wasInterrupted: true.
    — Show the priority event immediately (call _displayEvent).
  Else: gameState.addToEventQueue({ eventId, queuedAtYear, priority: false, wasInterrupted: false }).
  If no event currently displayed, call _tryShowNext().

closeCurrentEvent(): void
  If currentEvent() is null, return.
  gameState.shiftEventQueue() — removes first from unread array.
  this.currentEvent.set(null).
  const delay = lastWasInterrupted ? INTERRUPTED_BREATHER_MS : BREATHER_MS.
  setTimeout(() => this._tryShowNext(), delay).

_tryShowNext(): void
  const next = gameState.cultureEventQueue()[0].
  If exists: _displayEvent(next).

_displayEvent(entry: CultureEventEntry): void
  this.currentEvent.set(entry).
  gameState.recordEventHistory({ eventId: entry.eventId, year: currentYear, planetContext: ... }).
  eventBus.cultureEventTriggered$.next(entry.eventId).

_checkTechTriggers(nodeId: string): void
  Scan all culture events for { type: 'tech_completed', techId: nodeId }.
  queueEvent(matching event ids).

_checkYearTriggers(year: number): void
  Scan all culture events for { type: 'year_reached', year }.
  Check not already in history.

_checkEuropaTrigger(year: number): void
  If europaState.missionAuthorised and not impacted:
    If (impactYear - year) <= 15 and > 14: queueEvent('ce_europa_warning', false).
    If year >= impactYear: gameState impact event, queueEvent priority.
```

---

## 3.5 — `src/app/core/systems/dyson.service.ts`

```
Create src/app/core/systems/dyson.service.ts for Helioscape.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, EventBusService, DataService.

Uses effect() to react to gameYear.

Constants:
  ENERGY_PER_BASIC_PANEL = 1e12
  ENERGY_PER_MID_PANEL = 2.5e12
  ENERGY_PER_HARDENED_PANEL = 5e12
  TOTAL_PANELS_FOR_100_PERCENT = 1000
  BASE_PANELS_PER_YEAR = 2

processYear(): void
  Add panels from base rate + building bonus from gameState.
  Check ore availability, deduct cost.
  Recompute total energy from panel count × energy per panel (by tier).
  Update GameStateService via setDysonState().
  Emit eventBus.dysonEnergyUpdated$.next(watts).
  Check milestone thresholds (10, 25, 50, 100%). Push culture events if newly crossed.
  CME event: 0.5% chance per year (basic tier only), destroys 2% of panels.

upgradeTier(tier: 'mid' | 'hardened'): void
```

---

## 3.6 — `src/app/core/systems/kardashev.service.ts`

```
Create src/app/core/systems/kardashev.service.ts for Helioscape.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

Uses effect() to watch dysonCoveragePercent and completedMilestones.

processYear(): void — called via gameYear effect
  Update kardashevLevel:
    level = 0.73 + (dysonCoveragePercent / 100.0) * 1.27
    gameState.setKardashevLevel(level).
  Check all milestone conditions via _checkMilestones().

_checkMilestones(): void
  For each milestone in DataService:
    Skip if already completed.
    If all conditions met: _completeMilestone(milestone).

_checkCondition(conditionId: string): boolean
  Match on condition type string:
    'deuterium_fusion_online': check completedTechs
    'dyson_15_percent' etc.: check dysonCoveragePercent
    'two_habitable_worlds': check 2 planets have terraformingPhase >= threshold
    'first_self_sustaining_colony': check population threshold
    etc.

_completeMilestone(milestone: KardashevMilestone): void
  gameState.completeMilestone(milestone.id).
  Push culture event to queue.
  eventBus.milestoneReached$.next(milestone.id).
  Process milestone effects (same as TechEffect — delegate to TechTreeService._applyEffect).
```

---

## 3.7 — `src/app/core/systems/bio-phase.service.ts`

```
Create src/app/core/systems/bio-phase.service.ts for Helioscape.
This is the simplified bio phase service for the playtest build.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

Uses effect() to react to gameYear.

Phase definitions as a typed constant — same structure as the GDD design:
  4 phases per planet (mars and venus), each with:
  id, displayName, durationYears, actions (string[]),
  requiresComponents (string[]), requiresRequest?, canStartAtPreviousPercent?,
  spilloverTech?, completeCeId.

readonly PHASE_DEFINITIONS — define as a constant Record<string, BioPhaseDef[]>
matching the structure in DataService (use DataService if loaded, else fallback const).

processYear(year: number): void — via effect()
  For each planet: _checkAvailability(), _tickRunningPhases().

_checkAvailability(planetId: string): void
  For each phase in locked state:
    Check requirements met via _requirementsMet().
    If met: update status to 'available', emit bio phase available event.

_requirementsMet(planetId: string, phaseIndex: number): boolean
  Check previous phase progress/completion.
  Check components built from bioPhases state.
  Check requests sent.

applyAction(planetId: string, phaseIndex: number, actionId: string): void
  Called by UI. Validates phase is available or running.
  Adds actionId to actionsTaken.
  If first action: starts the phase (status → running, startedYear = currentYear).
  Emits bioPhaseStarted$ if newly started.

sendRequest(planetId: string, requestId: string): void

_tickRunningPhases(planetId: string, year: number): void
  For each running phase:
    Increment progressYears.
    Compute effectiveDuration = durationYears * (1 - (actionCount - 1) * 0.08) clamped to 60%.
    If progress >= effectiveDuration: _completePhase().

_completePhase(planetId: string, phaseIndex: number): void
  Update status to complete. Set completedYear.
  If spilloverTech: gameState.unlockTech(spilloverTech).
  Push complete CE to queue.
  eventBus.bioPhaseCompleted$.next({ planetId, phaseId }).
```

---

## 3.8 — `src/app/core/systems/mercury-build.service.ts`

```
Create src/app/core/systems/mercury-build.service.ts for Helioscape.

@Injectable({ providedIn: 'root' }).
Inject: GameStateService, DataService, EventBusService.

Uses effect() to react to gameYear.

Manages Mercury component build queue (ODN, engines, catalyst ships etc. —
the Mercury orbital component queue, separate from the grid building placement).

processYear(): void — via effect()
  If queue is empty, return.
  Increment first item's progressYears.
  If complete: _completeBuild(entry), remove from queue.

queueComponent(componentId: string, targetPlanet: string): boolean
  Validate component exists, unlock condition met, max instances not exceeded.
  Deduct resource costs. If insufficient: return false.
  Push to mercuryBuildQueue via gameState.
  Return true.

_completeBuild(entry: MercuryQueueEntry): void
  Apply component arrival effects to bioPhases state (ODN built, engines built etc.).
  eventBus.mercuryBuildCompleted$.next(entry.componentId).

_unlockConditionMet(condition: string): boolean
  Check against completedTechs and earthFlags.

_deductCosts(cost: ResourceStore): boolean
  Check all resources sufficient before deducting.
  Return false if insufficient.
```

---

# BLOCK 4 — Title screen and save/settings UI

*GPT-5.4.*

---

## 4.1 — `src/app/features/title-screen/title-screen.component.ts`

```
Create src/app/features/title-screen/title-screen.component.ts for Helioscape.

Read AGENTS.md — standalone, signals, OnPush, new control flow.

Inject: SaveService, Router.

Displays: game title, subtitle, buttons (New Game, Continue, Load Game, Options, Quit).
Continue only visible if hasSave(). Shows most recent save year + kardashev level below button.

On New Game: if hasSave() open SaveSlotPanelComponent in NEW_GAME mode.
  Else navigate to '/game' immediately (slot 1).
On Continue: load most recent slot, navigate to '/game'.
On Load Game: open SaveSlotPanelComponent in LOAD mode.
On Options: show SettingsComponent overlay.
On Quit: window.close() with OS.has_feature check (comment: Tauri provides proper quit).

SaveSlotPanelComponent and SettingsComponent are child components in the template,
shown via @if with a signal controlling visibility.
Pass mode as input() to SaveSlotPanelComponent.

Styling: full-screen, dark bg, centred content, warm amber title, button stack with 24px gap.
Use CSS custom properties from tokens.scss throughout — no hardcoded values.
Include the initial-load class animation for the title fading in on load.
```

---

## 4.2 — `src/app/features/title-screen/save-slot-panel/save-slot-panel.component.ts`

```
Create save-slot-panel.component.ts for Helioscape.

Input: mode = input.required<'NEW_GAME' | 'LOAD' | 'SAVE'>()
Output: slotSelected = output<number>()
Output: closed = output<void>()

Inject: SaveService, Router, GameStateService.

Show all slots (0 = autosave, 1-3 = manual).
Each slot card shows: slot label, game year, kardashev level, formatted timestamp, action button.
Autosave slot: only shown in LOAD mode.
Empty slot: show action button only in NEW_GAME/SAVE mode.
Delete button on occupied manual slots in LOAD mode with inline confirm.

On slot action:
  NEW_GAME: if occupied show overwrite confirm, then emit slotSelected and navigate '/game'.
  LOAD: SaveService.load(slot), navigate '/game'.
  SAVE: SaveService.save(slot), emit slotSelected, emit closed.

Overwrite confirm and delete confirm use a shared inline confirm pattern —
two small buttons replacing the main button temporarily.
```

---

## 4.3 — `src/app/features/settings/settings.component.ts`

```
Create settings.component.ts for Helioscape.

Output: closed = output<void>()
Inject: SettingsService.

Four tabs: Audio | Video | Accessibility | Gameplay.
All controls bind directly to SettingsService via get/set methods.
Changes apply immediately — no Apply button.
Reset to Defaults button with inline confirm.
Close button emits closed output.

Audio tab:
  Three HSlider-style range inputs (0.0–1.0, step 0.05):
  masterVolume, musicVolume, sfxVolume. Each shows percentage label.

Video tab:
  Fullscreen toggle (checkbox).
  VSync toggle (checkbox).
  UI Scale select: '100%' | '125%' | '150%' | '200%' → 1.0 | 1.25 | 1.5 | 2.0.

Accessibility tab:
  Text Size select: 'Normal' | 'Large' | 'Extra Large' → 1.0 | 1.25 | 1.5.
  Colorblind Mode toggle with description.
  Reduced Motion toggle with description.
  High Contrast toggle with description.

Gameplay tab:
  Autosave Interval select: 5 | 10 | 25 | 50 | 0 (off).
  Confirm Irreversible Actions toggle.

All descriptions from ARCHITECTURE.md copy exactly.
No pixel filter setting (removed by design).
```

---

# BLOCK 5 — Game shell and HUD

*Sonnet 4.6.*

---

## 5.1 — `src/app/features/game-shell/game-shell.component.ts`

```
Create game-shell.component.ts for Helioscape.

Root in-game layout. All in-game UI lives here.

Inject: GameLoopService, GameStateService, EventBusService.

Calls GameLoopService.start() in ngOnInit.
Calls GameLoopService.stop() in ngOnDestroy.

Template layout (CSS Grid):
  Full viewport. Three regions:
  - Left: PlanetsPanelComponent (always visible, fixed width ~220px)
  - Centre: OrreryComponent (fills remaining space)
  - Planet detail overlay: PlanetPanelComponent (slides in from right when a planet is selected)
  - Top bar: HudComponent (spans full width, above everything)
  - Culture event overlays: CultureEventCardComponent, CultureEventToastComponent
  - Pause menu overlay: PauseMenuComponent (shown via signal)

Signals:
  readonly selectedPlanetId = signal<string | null>(null)
  readonly isPauseMenuOpen = signal(false)

On EventBus.planetSelected$: set selectedPlanetId.
On Escape key (HostListener): toggle pause menu.

The PlanetPanelComponent slides in with CSS transform transition.
The panel is in the DOM always (not @if) so transition works — visibility toggled by signal.
```

---

## 5.2 — `src/app/features/hud/hud.component.ts`

```
Create hud.component.ts for Helioscape.

Inject: GameStateService, GameLoopService, SaveService, EventBusService.

Template: top bar spanning full viewport width. Dark surface background.
Contains:
  Left: year display (YearLabel component — simple span, MONO 2xl, "Year 2087")
  Centre: KardashevBarComponent
  Right: TimeControlsComponent

Autosave indicator: small "Autosaved ✓" label top-right, fades in/out.
  Listen to SaveService.autosaveCompleted signal changes.
  On change: add CSS class 'visible', remove after 2.5s.
```

---

## 5.3 — `src/app/features/hud/kardashev-bar/kardashev-bar.component.ts`

```
Create kardashev-bar.component.ts for Helioscape.

Inject: GameStateService, EventBusService.

Displays a continuous progress bar from K0.73 to K2.0+.
Bar fill is a CSS custom property driven by a computed signal:
  barPercent = computed(() => ((kardashevLevel() - 0.73) / (2.0 - 0.73)) * 100)

Three milestone markers at K1.0 (Type I), K1.5 (First Era), K2.0 (Type II).
Marker positions are fixed percentages on the bar.
On milestone reached (EventBus.milestoneReached$): add 'milestone-pulse' CSS class
to that marker, remove after 2s.

Label: "K {level.toFixed(2)}" using MONO font.

Styling: amber fill on dark background. Marker dots pulse warm white on reach.
Use CSS custom property for bar width — linear transition for smooth tick-driven updates.
```

---

## 5.4 — `src/app/features/hud/time-controls/time-controls.component.ts`

```
Create time-controls.component.ts for Helioscape.

Inject: GameStateService, GameLoopService.

Pause/Play button toggle.
Speed button (1× / 4×) — only rendered if !gameState.isFirstPlaythrough().
  Use @if — the button does not exist in the DOM on first playthrough.
  No hint that it will ever exist. No greyed-out placeholder.

On pause: GameLoopService.pause().
On speed: GameLoopService.setSpeed(current === 1 ? 4 : 1).

Sync button labels to GameStateService.isPaused() and gameSpeed() signals via computed.
```

---

## 5.5 — `src/app/features/hud/planets-panel/planets-panel.component.ts`

```
Create planets-panel.component.ts for Helioscape.

Inject: GameStateService, DataService, EventBusService.

Always visible left-side panel listing all planets + Moon.
Display order: Earth → Moon (indented under Earth) → Mercury → Mars → Venus.

Each row shows: planet name, current phase name (from PlanetState), status icon.
Status icon: locked (dim), active (accent dot), flourishing (green dot).

Locked planets: dim text, still clickable — clicking emits planetSelected$ to zoom
orrery to orbit, but PlanetPanel will show locked message.

Moon row: clicking emits planetSelected('earth') and sets a signal that Earth panel
should open at the Moon/research tab.

On click: EventBus.planetSelected$.next(planetId).
Highlight selected planet (reactive to a selectedPlanetId signal passed as input or
read from GameStateService).

Each row: phase name updates reactively when TerraformingPhaseChanged$ fires.
```

---

# BLOCK 6 — Orrery (Three.js)

*Sonnet 4.6. Most complex component.*

---

## 6.1 — `src/app/features/orrery/orrery.component.ts`

```
Create orrery.component.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md carefully. Three.js and Angular integration rules apply.

Inject: GameStateService, GameLoopService, DataService, EventBusService.
Import * as THREE from 'three'.

Owns its <canvas> element entirely (template: single <canvas #orreryCanvas>).
Initialises Three.js WebGLRenderer in ngAfterViewInit.
Cancels RAF in ngOnDestroy. Disposes renderer on destroy.

Scene setup:
  PerspectiveCamera, fixed position above ecliptic plane looking at origin.
  No OrbitControls — camera does not move except for planet zoom transition.
  AmbientLight (dim, 0.05 intensity) + DirectionalLight from sun position.

Sun:
  SphereGeometry mesh at origin. MeshStandardMaterial, emissive warm yellow.
  A second slightly-larger sphere for the Dyson swarm visual (transparent,
  no shader yet — just a placeholder comment: TODO DysonSwarm shader).

Planets (4):
  For each planet from DataService.getAllPlanets():
    Create SphereGeometry mesh. MeshStandardMaterial with base color from planet data.
    Create thin torus ring at orbit radius for orbital path (dim white, low opacity).
    Create a visible group: orbit ring (static) + planet mesh (moves).
    Planet mesh has an Area (invisible SphereGeometry slightly larger) for raycasting.

Orbital animation (in RAF loop — continuous, smooth, independent of game year):
  Each planet advances its angle by angularVelocity per frame.
  angularVelocity is proportional to 1/orbitalPeriod.
  Planet position: x = cos(angle) * radius, z = sin(angle) * radius, y = 0.
  This is VISUAL ONLY — not tied to gameYear.

Visual state updates (also in RAF, reads signals):
  Read planets() signal. For each planet, read visualParams.
  Update mesh material color from atmosphereColor.
  Comment: TODO update ShaderMaterial uniforms when planet surface shaders are added.

Click detection (Raycaster):
  On canvas click: cast ray against all planet meshes + orbit ring meshes.
  On hit: EventBus.planetSelected$.next(planetId).

Zoom (no cinematic transition for playtest build):
  On EventBus.planetSelected$: no camera animation. Planet panel opens immediately.
  Comment: TODO smooth camera zoom transition post-playtest.

RAF loop structure (from ARCHITECTURE.md):
  Read all signals into local variables at top of animate() — never mid-render.
  Update orbit angles. Update planet positions. Update visual state. Render.

Locked planets: orbit ring rendered dim/dashed (lower opacity material).
  Planet mesh: grey material. No raycasting interaction.
```

---

# BLOCK 7 — Planet panel

*Sonnet 4.6.*

---

## 7.1 — `src/app/features/planet-panel/planet-panel.component.ts`

```
Create planet-panel.component.ts for Helioscape.

Input: planetId = input<string | null>(null)
Inject: GameStateService, DataService.

Slides in from right when planetId() is not null.
CSS transform transition: translateX(100%) when null, translateX(0) when set.
Class binding: [class.is-open]="planetId() !== null"

.planet-panel { transform: translateX(100%); transition: transform 0.25s ease-in-out; }
.planet-panel.is-open { transform: translateX(0); }

On open: adds 'initial-load' class, removes after 800ms.
(initial-load class makes atmosphere bars ease-out on first render.)

Shows: planet name, current phase display name, phase description.
Tabs: Tech Tree | Research | Bio Phases | Overview.
Moon tab added for Earth (shows research tracks).

Passes planetId to child tab components.
If planet is locked: shows locked message, no tabs.

Back/close button: sets selectedPlanetId to null in GameShellComponent.
Emits via output() or EventBus as appropriate.
```

---

## 7.2 — `src/app/features/planet-panel/tech-tree/tech-tree.component.ts`

```
Create tech-tree.component.ts for Helioscape.

Input: planetId = input.required<string>()
Inject: GameStateService, DataService, TechTreeService, EventBusService.

Displays tech tree for the planet. Nodes are visual elements.
Layout: left-to-right timeline with thematic swim lanes (one per branch).

For each tech node for this planet (DataService.getTechNodesForPlanet()):
  Determine visual state:
    completed: full colour (accent)
    available (canUnlock() true): full colour, clickable, hover highlight
    one prereq away: muted (text-secondary colour)
    two prereqs away: silhouette (text-disabled, no details)
    further: hidden

On node click:
  If canUnlock(): TechTreeService.unlockTech(planetId, nodeId).
  Show tooltip with prerequisites (green if met, red if not), cost, duration.

If gameState.pendingFork() is not null and pendingFork.planetId === planetId:
  Show fork choice modal (see 7.3).

Refresh on EventBus.techUnlocked$ (filter by planetId).
```

---

## 7.3 — `src/app/features/planet-panel/tech-tree/fork-choice-modal.component.ts`

```
Create fork-choice-modal.component.ts for Helioscape.

Input: fork = input.required<PendingFork>()
Inject: TechTreeService, DataService.

Fullscreen overlay within the planet panel (not a full app overlay).
Shows the fork prompt: tech name, description of the fork, two choice buttons.

Each choice button shows: label, tag (naturalist leaf / architect gear), effect summary.

On choice click:
  TechTreeService.completeForkChoice(fork().planetId, fork().techId, choiceId).
  No cancel button — fork must be resolved.
  Comment: this is intentional — the tech has completed, a choice must be made.

This modal blocks interaction with the rest of the tech tree while visible.
```

---

## 7.4 — `src/app/features/planet-panel/research/research.component.ts`

```
Create research.component.ts for Helioscape.

Input: planetId = input.required<string>()
Inject: GameStateService, DataService, ResearchService.

Shows RP capacity bar: usedRpCapacity / totalRpCapacity.

Lists all research tracks for the planet in groups:
  Running (not paused): progress bar, ~years remaining, Pause button.
  Paused: frozen progress bar, progress %, Resume button (disabled if no RP capacity).
  Available (can start): Start button, rp cost, duration, description.
  Completed: greyed, completion year.

On start: ResearchService.startTrack(trackId, planetId).
On pause: ResearchService.pauseTrack(trackId).
On resume: ResearchService.resumeTrack(trackId).

Progress bars use tick-driven linear transition (var(--transition-tick)).
Years remaining: computed from progressYears / durationYears.

Refresh on EventBus.researchCompleted$ and on each game tick (update progress bars).
```

---

## 7.5 — `src/app/features/planet-panel/bio-phase/bio-phase.component.ts`

```
Create bio-phase.component.ts for Helioscape.

Input: planetId = input.required<string>()
Inject: GameStateService, DataService, BioPhaseService.

Shows all four bio phases as a scrollable list of cards (always visible).

Each card:
LOCKED: phase name (dim), status 'Locked', unmet requirements list.
AVAILABLE: phase name, status 'Ready', action buttons, request buttons.
RUNNING: phase name, progress bar, actions taken (ticked), remaining action buttons.
  Progress bar: tick-driven linear transition.
  Tooltip on action buttons: "Reduces phase duration by ~8%".
COMPLETE: phase name in green, 'Complete — Year {year}', actions taken list.

Action buttons call BioPhaseService.applyAction(planetId, phaseIndex, actionId).
Request buttons call BioPhaseService.sendRequest(planetId, requestId).

Requirement display:
  '🔴 ODN not built — queue in Mercury panel' (unmet)
  '🟢 Previous phase 50% complete' (met)

Refresh on game year tick (progress bar updates) and bio phase signals.
```

---

# BLOCK 8 — Culture events

*GPT-5.4.*

---

## 8.1 — `src/app/features/culture-events/culture-event-card/culture-event-card.component.ts`

```
Create culture-event-card.component.ts for Helioscape.

Inject: CultureEventService, DataService, GameStateService.

Reads CultureEventService.currentEvent() signal.
When not null: displays the event.
When null: hidden (not destroyed — keeps transition smooth).

Layout: fixed overlay (not fullscreen — centred card, 600px max width, 80vh max height).
Semi-transparent bg-overlay backdrop behind card.
Left side (35% width): portrait rectangle (ColorRect placeholder for now — accent colour).
Right side: title (MONO xl), narrator text (BODY md, RichTextLabel equivalent — use
  <p> tags per paragraph, split on '\n\n'), choices.

Typewriter effect on narrator text:
  On event open: set text character reveal via CSS animation or character-by-character
  append in a setInterval. Click anywhere on card skips to full text immediately.

No choices: show 'Continue' button.
With choices: show one button per choice (label, tag icon).

On continue/choice click: CultureEventService.closeCurrentEvent().
On choice: also dispatch tag effect (naturalist/architect increment).

Keyboard: Enter/Space = confirm/continue. Tab = cycle choices.
```

---

## 8.2 — `src/app/features/culture-events/culture-event-toast/culture-event-toast.component.ts`

```
Create culture-event-toast.component.ts for Helioscape.

Inject: CultureEventService, DataService.

Bell icon with unread count badge. Fixed bottom-left position.
Unread count: gameState.cultureEventQueue().length.

On new event queued: show a toast notification.
  Toast: slides in from left, shows event title, stays 8s, fades out.
  Toast is clickable: calls CultureEventService._tryShowNext() to display immediately.
  Multiple toasts stack vertically.

Bell icon click: toggles a small dropdown list of queued event titles.
Each list item: clickable, triggers that event immediately.

Toast animation: CSS translateX(-100%) to translateX(0) on appear, opacity 0 to 0 on disappear.
Use @if with CSS transition for enter/leave. (Angular animations optional — CSS is fine.)
```

---

# BLOCK 9 — Mercury panel

*Sonnet 4.6.*

---

## 9.1 — `src/app/features/mercury/mercury-grid/mercury-grid.component.ts`

```
Create mercury-grid.component.ts for Helioscape.

Read AGENTS.md and ARCHITECTURE.md (Mercury isometric coordinate reference).

Owns a <canvas #mercuryCanvas> element.
Inject: GameStateService, DataService, MercuryBuildService, EventBusService.

RAF loop for animations (worker movement, building construction pulses).
Cancel RAF on destroy.

Constants (at top of file):
  TILE_W = 64, TILE_H = 32
  GRID_COLS = 12, GRID_ROWS = 10
  ORIGIN_X = canvas.width / 2, ORIGIN_Y = 60

Tile terrain map: hardcoded 2D array.
  Rows 0-1: 'polar', rows 2-7: 'flat', rows 8-9: 'crater_rim'.

Pure isometric utility functions (local, or import from mercury-isometric.utils.ts):
  toScreen(col, row): { x, y }
  toGrid(screenX, screenY): { col, row }

Draw each frame:
  1. Clear canvas.
  2. Sort tiles by (col + row) ascending.
  3. For each tile: drawTile(col, row, terrain, building).
  4. For each worker/vehicle: drawWorker (placeholder — coloured dot).
  5. Draw hover preview if selectedBuilding is set.

drawTile(col, row, terrain, building):
  const { x, y } = toScreen(col, row).
  Draw diamond shape (4-point polygon) with terrain colour.
  If building placed: draw SVG/image at centre of tile, offset upward by building height.
    Load SVG via Image element, drawImage on canvas. Cache loaded images.
    If image not yet loaded: show placeholder coloured rect.
  If status === 'building': show construction progress overlay (striped rect).

Hover preview:
  On mousemove: toGrid(mouseX, mouseY), check if valid placement.
  Draw preview tile in green (valid) or red (invalid) with 60% opacity.

Click:
  toGrid(click coords).
  If building placed: show building info in parent component via output signal.
  If empty and selectedBuilding: place building via GameStateService.

Output signals:
  tileClicked = output<{ col: number; row: number; hasBuilding: boolean }>()
  
Parent (MercuryComponent) handles the building selector and info panel.
```

---

## 9.2 — `src/app/features/mercury/mercury.component.ts`

```
Create mercury.component.ts for Helioscape.

Container for the Mercury view.
Inject: GameStateService, DataService.

Tab navigation: Grid | Queue | Resources.

Grid tab: MercuryGridComponent + BuildingSelectorComponent side by side.
  BuildingSelector appears when a terrain type is selected.

Queue tab: shows MercuryBuildQueue from GameStateService.
  Each item: component name, target planet, progress bar, years remaining.

Resources tab: resource counts with rates.
  Ore: {count:.0f} (+{rate:.1f}/yr).
  Power balance: {produced - consumed} GW.

Resource rates: computed from operational buildings in gameState.mercuryBuildings().
  Sum effects of all status === 'operational' buildings.

Power balance: same computation for energyDrawGw values (negative = produces).
```

---

## 9.3 — `src/app/features/mercury/building-selector/building-selector.component.ts`

```
Create building-selector.component.ts for Helioscape.

Input: terrainType = input.required<'flat' | 'polar' | 'crater_rim'>()
Input: targetCol = input.required<number>()
Input: targetRow = input.required<number>()
Output: buildingPlaced = output<{ buildingId: string; col: number; row: number }>()
Output: cancelled = output<void>()

Inject: GameStateService, DataService.

Shows scrollable list of buildings valid for this terrain.
Filter: placementRule matches terrainType OR 'any', unlockCondition met, maxInstances not exceeded.

Each card: name, description, cost (red if cannot afford), build time, effect summary.
'Place' button: disabled if cannot afford or max exceeded. Tooltip explains why.

On place: deduct costs via GameStateService.updateMercuryResources(), 
  add PlacedBuilding to gameState, emit buildingPlaced output.
  Building starts with status 'building', buildProgressYears 0.

Empty state: "No buildings available for {terrainType} terrain."

Close button emits cancelled.
```

---

# BLOCK 10 — Pause menu and shared components

*GPT-5.4.*

---

## 10.1 — `src/app/features/pause-menu/pause-menu.component.ts`

```
Create pause-menu.component.ts for Helioscape.

Inject: GameLoopService, GameStateService, SaveService, Router.

Full-screen overlay with semi-transparent backdrop.
Centred panel (400px wide), dark bg-surface, border-accent.

Buttons: Resume | Save Game | Load Game | Options | Return to Title | Quit to Desktop.
Quit button: @if (!isTauri) hidden. Comment: Tauri provides proper quit, browser builds hide it.

On Resume: close menu, GameLoopService.resume().
On Save Game: open SaveSlotPanelComponent in SAVE mode (game stays paused).
On Load Game: show overwrite warning, then SaveSlotPanelComponent in LOAD mode.
On Options: show SettingsComponent.
On Return to Title: confirm dialog, then Router.navigate(['/']).
On Quit: confirm dialog, then (comment: tauri invoke 'quit' — implement when Tauri integrated).

Confirm dialogs are inline within the panel using the shared ConfirmDialogComponent.

Keyboard: Escape closes pause menu (returns to game).
```

---

## 10.2 — `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`

```
Create confirm-dialog.component.ts for Helioscape.

Input: message = input.required<string>()
Input: isDestructive = input<boolean>(false)
Output: confirmed = output<void>()
Output: cancelled = output<void>()

Tiny inline component (not a modal overlay — renders inside parent).
Shows message text + two buttons: Confirm (destructive style if isDestructive) + Cancel.
If isDestructive: shows 'This cannot be undone.' in var(--color-bad) beneath message.

On confirm: emit confirmed.
On cancel: emit cancelled.
```

---

# REMAINING BLOCKS

Continue in subsequent sessions with:

BLOCK 11 — Shared components (ProgressBar, StatusTag)
BLOCK 12 — Pipes (GameYear, Kardashev)  
BLOCK 13 — Vignette display (placeholder text panel)
BLOCK 14 — Wire APP_INITIALIZER and verify DataService loads
BLOCK 15 — Manual testing with debug console (browser devtools)
BLOCK 16 - Steamworks - Cloud saves, Stats and achievements
BLOCK 17 - PixiJS: for more sprite-heavy 2D animations? 

---

# Model assignment summary

| Block | Files | Model |
|---|---|---|
| 0 — Models | All model interfaces | GPT-5.4 |
| 1 — Core services | GameState, GameLoop, Data, Save, Settings, EventBus | Sonnet 4.6 |
| 2 — App config | app.config.ts, app.component.ts | GPT-5.4 |
| 3 — Systems | All system services | Sonnet 4.6 |
| 4 — Title/Settings | Title screen, save slots, settings | GPT-5.4 |
| 5 — HUD | HUD, planets panel, time controls, kardashev bar | Sonnet 4.6 |
| 6 — Orrery | Three.js orrery component | Sonnet 4.6 |
| 7 — Planet panel | Planet panel, tech tree, research, bio phase | Sonnet 4.6 |
| 8 — Culture events | Event card, toast | GPT-5.4 |
| 9 — Mercury | Grid, container, building selector | Sonnet 4.6 |
| 10 — Pause/shared | Pause menu, confirm dialog | GPT-5.4 |
