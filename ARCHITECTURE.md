# ARCHITECTURE.md — Helioscape Angular Architecture

Read this alongside AGENTS.md before implementing any file.

---

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Angular (latest, standalone) | All UI, state, routing |
| 3D orrery | Three.js | Planet spheres, orbital animation |
| Mercury grid | Canvas 2D | Isometric tile grid, building sprites |
| Illustrations | Inline SVG | Vignettes, building sprites, icons |
| Styling | SCSS + CSS custom properties | Design tokens, component styles |
| Desktop shell | Tauri | Steam distribution, native file I/O |
| Data | JSON files | All game content, loaded at startup |
| State | Angular signals | Single source of truth |

---

## Folder structure

```
helioscape/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/               # TypeScript interfaces only, no logic
│   │   │   │   ├── planet.model.ts
│   │   │   │   ├── tech-tree.model.ts
│   │   │   │   ├── culture-event.model.ts
│   │   │   │   ├── bio-phase.model.ts
│   │   │   │   ├── game-state.model.ts
│   │   │   │   └── index.ts          # barrel export
│   │   │   ├── services/             # Singleton infrastructure services
│   │   │   │   ├── game-loop.service.ts
│   │   │   │   ├── game-state.service.ts
│   │   │   │   ├── data.service.ts
│   │   │   │   ├── event-bus.service.ts
│   │   │   │   ├── save.service.ts
│   │   │   │   └── settings.service.ts
│   │   │   └── systems/              # Game logic services
│   │   │       ├── tech-tree.service.ts
│   │   │       ├── research.service.ts
│   │   │       ├── terraforming.service.ts
│   │   │       ├── dyson.service.ts
│   │   │       ├── culture-event.service.ts
│   │   │       ├── kardashev.service.ts
│   │   │       ├── bio-phase.service.ts
│   │   │       └── mercury-build.service.ts
│   │   ├── features/
│   │   │   ├── title-screen/
│   │   │   │   ├── title-screen.component.ts
│   │   │   │   └── save-slot-panel/
│   │   │   ├── game-shell/           # Root game layout when in-game
│   │   │   │   └── game-shell.component.ts
│   │   │   ├── orrery/
│   │   │   │   └── orrery.component.ts
│   │   │   ├── hud/
│   │   │   │   ├── hud.component.ts
│   │   │   │   ├── planets-panel/
│   │   │   │   ├── kardashev-bar/
│   │   │   │   └── time-controls/
│   │   │   ├── planet-panel/
│   │   │   │   ├── planet-panel.component.ts
│   │   │   │   ├── tech-tree/
│   │   │   │   ├── research/
│   │   │   │   ├── bio-phase/
│   │   │   │   └── vignette/
│   │   │   ├── mercury/
│   │   │   │   ├── mercury.component.ts
│   │   │   │   ├── mercury-grid/
│   │   │   │   ├── mercury-hud/
│   │   │   │   └── building-selector/
│   │   │   ├── culture-events/
│   │   │   │   ├── culture-event-card/
│   │   │   │   └── culture-event-toast/
│   │   │   ├── pause-menu/
│   │   │   └── settings/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── progress-bar/
│   │   │   │   ├── status-tag/
│   │   │   │   └── confirm-dialog/
│   │   │   ├── pipes/
│   │   │   │   ├── game-year.pipe.ts     # formats 2087 → "Year 2087"
│   │   │   │   └── kardashev.pipe.ts
│   │   │   └── utils/
│   │   │       ├── math.utils.ts         # clamp, lerp, etc.
│   │   │       └── year-value.utils.ts   # getValueAtYear() pattern
│   │   └── app.component.ts
│   ├── data/                             # JSON content files
│   │   ├── planets.json
│   │   ├── tech-tree.json
│   │   ├── research-tracks.json
│   │   ├── culture-events.json
│   │   ├── kardashev-milestones.json
│   │   ├── resources.json
│   │   ├── mercury-buildings.json
│   │   ├── organisms.json
│   │   ├── bio-phases.json
│   │   └── boosters.json
│   ├── styles/
│   │   ├── tokens.scss                   # ALL design tokens as CSS custom properties
│   │   ├── reset.scss
│   │   ├── typography.scss
│   │   └── global.scss                   # imports all of the above
│   └── assets/
│       ├── fonts/
│       └── svg/
│           ├── buildings/
│           ├── vignettes/
│           └── icons/
└── src-tauri/                            # Tauri Rust backend — do not edit manually
```

---

## State architecture

### Single source of truth: GameStateService

All mutable game state lives in `GameStateService`. No other service stores game state.
Services compute derived values or call mutation methods — they never hold their own state copies.

```
GameStateService (signals)
       │
       ├── read by → Components (via computed())
       ├── read by → System services (via effect() or direct read in methods)
       ├── written by → System services (via mutation methods)
       └── serialised by → SaveService
```

### Signal hierarchy

```ts
// GameStateService — the only place these live
readonly gameYear: Signal<number>
readonly isPaused: Signal<boolean>
readonly gameSpeed: Signal<1 | 4>
readonly planets: Signal<Record<string, PlanetState>>
readonly completedTechs: Signal<string[]>
readonly activeResearch: Signal<ResearchTrack[]>
readonly dysonCoveragePercent: Signal<number>
readonly kardashevLevel: Signal<number>
readonly cultureEventQueue: Signal<CultureEventEntry[]>
readonly mercuryResources: Signal<ResourceStore>
readonly mercuryBuildings: Signal<PlacedBuilding[]>
readonly bioPhases: Signal<Record<string, PlanetBioState>>
readonly naturalistCount: Signal<number>
readonly architectCount: Signal<number>
readonly isFirstPlaythrough: Signal<boolean>
readonly currentSaveSlot: Signal<number>
```

### Derived values (computed signals in services or components)

Never store a derived value as a signal — compute it:

```ts
// CORRECT
readonly availableTechs = computed(() =>
  this.allTechs().filter(t => this.canUnlock(t.id))
);

// WRONG — storing derived state
private _availableTechs = signal<Tech[]>([]);
// then manually updating it in multiple places
```

---

## Game loop

One authoritative loop. One service. Nothing else creates timers.

```
GameLoopService
├── setInterval → advances gameYear signal every tickMs
├── tickMs = computed(() => gameSpeed === 4 ? 500 : 1000)
├── on each tick → emits via EventBusService
└── pause → clears interval, stores remaining time for clean resume
```

System services react to `gameYear` changes via `effect()`:

```ts
effect(() => {
  const year = this.gameLoop.currentYear();
  untracked(() => this.processYear(year)); // untracked prevents circular deps
});
```

**Speed**: 1× = 1 game year per second. 4× = 1 game year per 500ms.
The 4× option is hidden on first playthrough (`isFirstPlaythrough` signal).

---

## Visual value pattern

All values that change over time are computed from `gameYear` via pure functions.
No transition state is stored. Save/load is safe because the year IS the state.

```ts
// src/app/shared/utils/year-value.utils.ts

export function getValueAtYear(
  currentYear: number,
  startYear: number,
  endYear: number,
  startValue: number,
  endValue: number
): number {
  const t = clamp((currentYear - startYear) / (endYear - startYear), 0, 1);
  return lerp(startValue, endValue, t);
}

// Usage in component template via computed signal:
atmospherePressure = computed(() =>
  getValueAtYear(
    this.gameLoop.currentYear(),
    this.planet().terraformStartYear,
    this.planet().terraformEndYear,
    this.planet().startPressure,
    this.planet().targetPressure
  )
);
```

CSS reads the computed value each tick:

```ts
// In component, runs each tick via effect()
effect(() => {
  const pressure = this.atmospherePressure();
  const percent = pressureToPercent(pressure);
  this.el.nativeElement.style.setProperty('--bar-width', `${percent}%`);
});
```

```scss
// Tick-driven bar — always linear, always 1s to match tick interval
.atmosphere-bar__fill {
  width: var(--bar-width, 0%);
  transition: width 1s linear;
}

// On planet panel open — ease-out for the initial fill animation
.planet-panel.initial-load .atmosphere-bar__fill {
  transition: width 0.8s ease-out;
}
```

The `initial-load` class is added in `ngOnInit` and removed after 800ms.

---

## Event bus

`EventBusService` is a thin typed event emitter. It does not hold state.
Use it for cross-feature events that don't belong in GameStateService.

```ts
@Injectable({ providedIn: 'root' })
export class EventBusService {
  // Use RxJS Subject for events that need history/filtering
  // Use Angular signals for current-value state
  
  readonly techUnlocked$ = new Subject<{ planetId: string; nodeId: string }>();
  readonly bioPhaseStarted$ = new Subject<{ planetId: string; phaseId: string }>();
  readonly bioPhaseCollapsed$ = new Subject<{ planetId: string; phaseId: string }>();
  readonly milestoneReached$ = new Subject<string>();
  readonly priorityEventTriggered$ = new Subject<string>();
  readonly mercuryBuildComplete$ = new Subject<string>();
}
```

Components and services that subscribe to Subjects must use `takeUntilDestroyed()`:

```ts
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.eventBus.techUnlocked$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ planetId, nodeId }) => this.onTechUnlocked(planetId, nodeId));
}
```

---

## Data loading

`DataService` loads all JSON at app startup. Returns typed data synchronously after load.
Data is immutable — never modified at runtime.

```ts
@Injectable({ providedIn: 'root' })
export class DataService {
  private planets: Record<string, PlanetData> = {};
  private techTree: TechNode[] = [];
  // etc.

  async loadAll(): Promise<void> {
    const [planets, techTree, ...] = await Promise.all([
      fetch('data/planets.json').then(r => r.json()),
      fetch('data/tech-tree.json').then(r => r.json()),
      // etc.
    ]);
    this.planets = keyBy(planets, 'id');
    this.techTree = techTree;
  }

  getPlanet(id: string): PlanetData { return this.planets[id]; }
  getAllPlanets(): PlanetData[] { return Object.values(this.planets); }
  getTechNode(id: string): TechNode { return this.techTree.find(t => t.id === id)!; }
  // etc.
}
```

`DataService.loadAll()` is called in `app.config.ts` via an `APP_INITIALIZER` token
so all data is available before any component renders.

---

## Canvas components

### OrreryComponent (Three.js)

- Owns its `<canvas>` element entirely
- Initialises Three.js renderer in `ngAfterViewInit`
- Runs its own RAF loop for smooth orbital animation
- Reads `GameStateService` signals inside RAF (not via effect)
- Cancels RAF in `ngOnDestroy`
- Pauses RAF when not visible (implement via `IntersectionObserver` or route lifecycle)
- Communicates with app via Angular signals/EventBus only — never touches other DOM

```
OrreryComponent
├── Three.js scene (sun, planet meshes, orbit rings)
├── RAF loop → smooth orbit animation, shader updates
├── Raycaster → click/hover detection → emits planet selected signal
└── Reads: gameYear, planets signals for visual state
```

### MercuryGridComponent (Canvas 2D)

- Owns its `<canvas>` element
- Uses true isometric coordinate math (not CSS rotation)
- Runs RAF loop for worker/building animations
- Hit detection via inverse isometric transform on click events
- Cancels RAF in `ngOnDestroy`
- Redraws on state change AND per-frame for animations

```
Isometric math (all pure functions in mercury-isometric.utils.ts):

toScreen(col, row) → { x, y }    // grid → canvas pixels
toGrid(x, y) → { col, row }      // canvas pixels → grid (for hit detection)

TILE_WIDTH = 64    // full diamond width
TILE_HEIGHT = 32   // full diamond height (TILE_WIDTH / 2)
ORIGIN_X = canvas.width / 2  // diamond center on canvas
ORIGIN_Y = 80                 // top of diamond
```

Draw order: sort all tiles by `(col + row)`, draw back to front.
Z-ordering for buildings: `zIndex = row + col + building.heightTiles`.

---

## Culture event queue

Owned by `CultureEventService`. Persisted in save file.

```ts
interface CultureEventQueue {
  unread: CultureEventEntry[];   // persisted — survives save/load
  current: CultureEventEntry | null;
  wasInterrupted: boolean;
}

interface CultureEventEntry {
  eventId: string;
  queuedAtYear: number;
  priority: boolean;
  wasInterrupted?: boolean;    // true if displaced by a priority event
}
```

Queue rules:
- New events are pushed to back of `unread` array
- Priority events: displace current event (push to front of unread with `wasInterrupted: true`),
  then display immediately
- After closing an event: wait `BREATHER_MS` (1500) before showing next
- If next event has `wasInterrupted: true`: wait `INTERRUPTED_BREATHER_MS` (750) instead
- On save: entire queue state is serialised
- On load: if `unread.length > 0`, display first event after `BREATHER_MS`

---

## Save system

`SaveService` serialises/deserialises `GameStateService` signals to JSON.

- 3 save slots + 1 autosave slot (slot 0)
- Autosave every N game years (configurable in settings, default 10)
- Tauri: writes to OS app data folder via `@tauri-apps/plugin-fs`
- Browser (dev mode): writes to localStorage with same interface
- Save format includes `version: number` for migration

```ts
// Tauri save path
const SAVE_DIR = await appDataDir(); // e.g. C:/Users/Jos/AppData/Roaming/helioscape/
const SAVE_PATH = `${SAVE_DIR}save_slot_${slot}.json`;
```

`SaveService` detects environment and uses the correct backend:

```ts
private readonly isTauri = '__TAURI__' in window;
```

---

## Routing

Minimal routing — two routes only:

```ts
export const routes: Routes = [
  { path: '', component: TitleScreenComponent },
  { path: 'game', component: GameShellComponent },
];
```

`GameShellComponent` is the in-game layout: HUD + orrery + planet panel overlay.
Navigation to `'/game'` starts a new game or loads a save.

---

## CSS design tokens (tokens.scss)

All tokens are CSS custom properties on `:root`. Components reference them, never hardcode values.

```scss
:root {
  // Colours
  --color-bg-base:      #0d0d0f;
  --color-bg-surface:   #161618;
  --color-bg-elevated:  #1e1e22;
  --color-bg-overlay:   rgba(0,0,0,0.7);
  --color-text-primary: #e8e0d4;
  --color-text-secondary: #8a8070;
  --color-text-disabled: #4a4440;
  --color-accent:       #c8861e;
  --color-accent-dim:   #8a5c14;
  --color-accent-glow:  #e8a030;
  --color-good:         #5a9e5a;
  --color-warn:         #c8a020;
  --color-bad:          #9e3a2a;
  --color-neutral:      #4a6a8a;
  --color-tag-naturalist: #4a8a4a;
  --color-tag-architect:  #4a6ab8;
  
  // Planet accents
  --color-earth:   #3a7ab8;
  --color-mercury: #8a7a5a;
  --color-mars:    #b84a2a;
  --color-venus:   #c8a030;

  // Typography
  --font-mono: 'YourMonoFont', 'Courier New', monospace;
  --font-body: 'YourBodyFont', system-ui, sans-serif;
  --text-xs:  11px;
  --text-sm:  13px;
  --text-md:  14px;
  --text-lg:  16px;
  --text-xl:  20px;
  --text-2xl: 28px;

  // Spacing (base unit: 8px)
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;

  // Transitions
  --transition-tick:    width 1s linear;      // tick-driven values
  --transition-ui:      all 0.25s ease-out;   // UI interactions
  --transition-panel:   transform 0.25s ease-in-out; // panel slide
  --transition-initial: all 0.8s ease-out;    // initial-load state
  
  // Borders
  --radius-sm: 4px;
  --radius-md: 8px;
  --border-subtle: 1px solid rgba(255,255,255,0.06);
  --border-accent: 1px solid var(--color-accent-dim);
}
```

---

## Tauri integration points

Tauri is only invoked for:
1. **File I/O** — save/load game files via `@tauri-apps/plugin-fs`
2. **App window** — fullscreen toggle via `@tauri-apps/api/window`
3. **System info** — OS detection if needed

Everything else is pure Angular/web. Tauri commands are called only from `SaveService`
and `SettingsService`. No other service touches Tauri APIs directly.

During development (`ng serve`): Tauri is not running. `SaveService` detects this
and falls back to `localStorage`. All other functionality works in the browser.

---

## Mercury isometric coordinate reference

```
Canvas coordinate system (origin top-left):

Screen space after isometric transform:
  
         col=0,row=0
              /\
             /  \
    col=1  /      \ row=1
    row=0 /        \
          \        /
           \      /
            \    /
             \  /
              \/
           col=1,row=1

toScreen(col, row):
  x = ORIGIN_X + (col - row) * (TILE_WIDTH / 2)
  y = ORIGIN_Y + (col + row) * (TILE_HEIGHT / 2)

toGrid(screenX, screenY):
  dx = (screenX - ORIGIN_X) / (TILE_WIDTH / 2)
  dy = (screenY - ORIGIN_Y) / (TILE_HEIGHT / 2)
  col = round((dx + dy) / 2)
  row = round((dy - dx) / 2)

Draw order: sort tiles by (col + row) ascending, draw back to front.
Building z-order: zIndex = row + col + building.heightTiles
```
