# Helioscape — Doc Amendments + Prompt Blocks 11–16

---

# PART 2 — REMAINING PROMPT BLOCKS

---

# BLOCK 11 — Shared components

*GPT-5.4.*

---

## 11.1 — `src/app/shared/components/progress-bar/progress-bar.component.ts`

```
Create progress-bar.component.ts for Helioscape.

Read AGENTS.md — standalone, OnPush, signals, new control flow.

Inputs:
  value = input.required<number>()        // 0.0–1.0
  label = input<string>('')
  variant = input<'default' | 'stability' | 'kardashev'>('default')
  animated = input<boolean>(true)         // false = no transition (for initial render)
  showPercent = input<boolean>(false)

The bar fill width is driven by a CSS custom property set in an effect():
  effect(() => {
    const pct = clamp(this.value() * 100, 0, 100);
    this.el.nativeElement.style.setProperty('--bar-fill', `${pct}%`);
  });

Variants:
  default: accent colour fill
  stability: colour transitions based on value
    < 0.4 → var(--color-bad)
    0.4–0.75 → var(--color-warn)
    > 0.75 → var(--color-good)
    Implemented as CSS: colour is a CSS custom property also set in the effect.
  kardashev: accent fill with milestone markers

CSS:
  .progress-bar__track: full width, bg-elevated, height 8px, border-radius 4px
  .progress-bar__fill: width var(--bar-fill, 0%), height 100%, border-radius 4px
    transition: width 1s linear (tick-driven)
  .progress-bar--no-animation .progress-bar__fill: transition: none

When animated() is false: add no-animation class to host.
```

---

## 11.2 — `src/app/shared/components/status-tag/status-tag.component.ts`

```
Create status-tag.component.ts for Helioscape.

Inputs:
  status = input.required<'good' | 'warn' | 'bad' | 'neutral' | 'locked'>()
  label = input.required<string>()
  icon = input<boolean>(true)   // when colorblind mode: always show icon regardless

Small pill-shaped tag. Status maps to colour + icon:
  good → var(--color-good) + ✓ icon (when icon() or colorblind mode)
  warn → var(--color-warn) + ⚠ icon
  bad → var(--color-bad) + ✗ icon
  neutral → var(--color-neutral) + • icon
  locked → var(--color-text-disabled) + 🔒 icon

Inject SettingsService to read colorblindMode setting.
When colorblind mode: always show icon, regardless of icon() input.

Template:
  <span class="status-tag status-tag--{{ status() }}">
    @if (showIcon()) { <span class="status-tag__icon">{{ iconChar() }}</span> }
    {{ label() }}
  </span>

Computed:
  showIcon = computed(() => this.icon() || this.settings.get('colorblindMode'))
  iconChar = computed(() => map status to character)

SCSS: pill shape, 4px radius, 4px h-padding, 2px v-padding, text-xs, uppercase.
```

---

## 11.3 — `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`

*(Already written in Block 10.2 — carry forward)*

---

# BLOCK 12 — Pipes

*GPT-5.4.*

---

## 12.1 — `src/app/shared/pipes/game-year.pipe.ts`

```
Create game-year.pipe.ts for Helioscape.

@Pipe({ name: 'gameYear', standalone: true, pure: true })

transform(year: number, format: 'full' | 'short' | 'year-only' = 'full'): string
  full: 'Year 2087'
  short: '2087'
  year-only: same as short (alias)

Usage in template: {{ gameState.gameYear() | gameYear }}
              or: {{ gameState.gameYear() | gameYear:'short' }}
```

---

## 12.2 — `src/app/shared/pipes/kardashev.pipe.ts`

```
Create kardashev.pipe.ts for Helioscape.

@Pipe({ name: 'kardashev', standalone: true, pure: true })

transform(level: number, format: 'label' | 'description' = 'label'): string

label format: 'K {level.toFixed(2)}'  e.g. 'K 0.73', 'K 1.24'

description format — map ranges to strings:
  < 0.80: 'Pre-Fusion Era'
  0.80–0.95: 'Fusion Age Beginning'
  0.95–1.05: 'Type I Civilisation'
  1.05–1.40: 'Solar System Expansion'
  1.40–1.60: 'First Era Complete'
  1.60–1.95: 'Dyson Age'
  >= 1.95: 'Type II Civilisation'
```

---

## 12.3 — `src/app/shared/utils/mercury-isometric.utils.ts`

```
Create mercury-isometric.utils.ts for Helioscape.

Pure utility functions for Mercury isometric grid coordinate math.
No imports. No side effects. Export all.

Constants:
  export const TILE_W = 64
  export const TILE_H = 32
  export const HALF_W = TILE_W / 2
  export const HALF_H = TILE_H / 2

toScreen(col: number, row: number, originX: number, originY: number): { x: number; y: number }
  x = originX + (col - row) * HALF_W
  y = originY + (col + row) * HALF_H

toGrid(screenX: number, screenY: number, originX: number, originY: number): { col: number; row: number }
  const dx = (screenX - originX) / HALF_W
  const dy = (screenY - originY) / HALF_H
  col = Math.round((dx + dy) / 2)
  row = Math.round((dy - dx) / 2)

drawTileDiamond(ctx: CanvasRenderingContext2D,
  cx: number, cy: number, fillColor: string, strokeColor?: string): void
  Draws a diamond shape centred at (cx, cy) using TILE_W and TILE_H.
  Uses ctx.beginPath(), moveTo, lineTo, closePath, fill, optional stroke.

isInBounds(col: number, row: number, cols: number, rows: number): boolean
  return col >= 0 && col < cols && row >= 0 && row < rows

sortByDepth<T extends { col: number; row: number }>(items: T[]): T[]
  return [...items].sort((a, b) => (a.col + a.row) - (b.col + b.row))

Add JSDoc comment on each function explaining the coordinate system.
Reference the diagram in ARCHITECTURE.md.
```

---

# BLOCK 13 — Vignette (placeholder)

*GPT-5.4.*

---

## 13.1 — `src/app/features/planet-panel/vignette/vignette.component.ts`

```
Create vignette.component.ts for Helioscape.
This is a placeholder implementation for the playtest build.
The full vignette system (animated SVG illustrations) is post-playtest.

Input: planetId = input.required<string>()
Inject: GameStateService, DataService.

Displays: planet current phase description as text.
A placeholder coloured rectangle (planet accent colour) where the illustration will go.
Phase name as a heading. One-paragraph description from the planet service equivalent.

Layout: illustration placeholder (aspect ratio 3:4, planet accent colour background,
'Illustration coming soon' text centred).
Below: phase name (MONO lg), description (BODY md).

Phase descriptions are hardcoded in this component for now as a Record<string, string[]>
keyed by planetId then phase index. Use narrator voice (first person plural, present tense).

Mars descriptions:
  0: "The surface is unchanged. Red and cold and still."
  1: "Something is happening in the atmosphere. We can measure it now."
  2: "The first readings we dared hope for."
  3: "The coast holds something we didn't plant."
  4: "It spreads inland without us."

Venus descriptions:
  0: "465 degrees. 92 atmospheres. We study it from orbit."
  1: "The cooling has begun. Slowly."
  2: "The clouds are different now. Lighter."
  3: "The sky cities are holding."
  4: "We can stand on the surface."

Earth descriptions (phase irrelevant — show civilisation state based on kardashev level):
  < 1.0: "Home. Still healing. Still hopeful."
  >= 1.0: "The planet runs on fusion now. The transformation is visible from orbit."
  >= 1.5: "Earth as designed. What we do with that is still being decided."

Mercury descriptions:
  phase 0: "The crater rim base. Forty people and a lot of machinery."
  phase 1: "The mass drivers are running. Panels reach orbit every week."
  phase 2: "Mercury doesn't sleep. Neither do we."
```

---

# BLOCK 14 — App wiring and verification

*Sonnet 4.6.*

---

## 14.1 — `src/app/app.config.ts` (final version)

```
Create the final src/app/app.config.ts for Helioscape.

This wires everything together. Read AGENTS.md and ARCHITECTURE.md.

ApplicationConfig with:

1. provideRouter with routes:
   { path: '', loadComponent: () => import('./features/title-screen/...') }
   { path: 'game', loadComponent: () => import('./features/game-shell/...') }

2. APP_INITIALIZER that calls DataService.loadAll():
   {
     provide: APP_INITIALIZER,
     useFactory: (data: DataService) => () => data.loadAll(),
     deps: [DataService],
     multi: true
   }

3. provideHttpClient()

4. provideAnimations() — for any Angular animations used in transitions.

Also ensure all system services are eager-loaded (not lazy) by injecting them
in AppComponent or GameShellComponent constructor:
  inject(TerraformingService)
  inject(TechTreeService)
  inject(ResearchService)
  inject(DysonService)
  inject(KardashevService)
  inject(CultureEventService)
  inject(BioPhaseService)
  inject(MercuryBuildService)

Comment: services with effect() need to be instantiated to start reacting.
Angular only creates 'providedIn: root' services lazily (on first inject).
Eagerly injecting them in GameShellComponent ensures their effects run
as soon as the game starts.
```

---

## 14.2 — DataService verification prompt

```
Open src/app/core/services/data.service.ts.

Add a verify() method that checks all required data loaded correctly
and logs a summary. Call this at the end of loadAll():

verify(): void {
  const planets = this.getAllPlanets();
  const techs = Object.values(this.techTree).flat();
  const events = this.getAllCultureEvents();
  
  console.group('DataService loaded:');
  console.log(`Planets: ${planets.length}`);
  console.log(`Tech nodes: ${techs.length}`);
  console.log(`Culture events: ${events.length}`);
  console.log(`Milestones: ${this.getAllMilestones().length}`);
  console.log(`Mercury buildings: ${this.getAllMercuryBuildings().length}`);
  console.groupEnd();
  
  // Warn about missing required data
  const required = ['earth', 'mercury', 'mars', 'venus'];
  for (const id of required) {
    if (!this.getPlanet(id)) {
      console.error(`Missing required planet: ${id}`);
    }
  }
}

This runs automatically in development and helps verify JSON files
loaded correctly before any game logic runs.
```

---

# BLOCK 15 — Debug utilities

*GPT-5.4.*

---

## 15.1 — `src/app/core/services/debug.service.ts`

```
Create src/app/core/services/debug.service.ts for Helioscape.

@Injectable({ providedIn: 'root' }).
Only active when isDevMode() returns true.
In production builds: all methods are no-ops.

Inject: GameStateService, GameLoopService, TechTreeService,
TerraformingService, CultureEventService, DysonService.

Expose on window.helioscape in development for browser console access:

In constructor, if isDevMode():
  (window as any).helioscape = {
    setYear: (y: number) => this.gameState.setYear(y),
    setSpeed: (s: 1 | 4) => this.gameLoop.setSpeed(s),
    completeTech: (planet: string, id: string) =>
      this.techTree.unlockTech(planet, id),
    setDyson: (pct: number) => {
      const panels = Math.round((pct / 100) * 1000);
      this.gameState.setDysonState(panels, pct, panels * 1e12);
    },
    triggerEvent: (id: string) =>
      this.cultureEvents.queueEvent(id, false),
    triggerPriorityEvent: (id: string) =>
      this.cultureEvents.queueEvent(id, true),
    setResources: (ore: number, rare: number, vol: number) =>
      this.gameState.updateMercuryResources({ commonOre: ore, rareMetals: rare, polarVolatiles: vol }),
    setBioPhase: (planet: string, phase: number, status: string) => {
      this.gameState.updateBioPhase(planet, phase, { status: status as any });
    },
    getState: () => this.gameState.serialise(),
    printState: () => console.log(JSON.stringify(this.gameState.serialise(), null, 2)),
    help: () => console.log(
      'Available commands:\n' +
      '  helioscape.setYear(2150)\n' +
      '  helioscape.setSpeed(4)\n' +
      '  helioscape.completeTech("earth", "earth_fusion_ignition_theory")\n' +
      '  helioscape.setDyson(80)  // 80% coverage\n' +
      '  helioscape.triggerEvent("ce_mars_first_liquid_water")\n' +
      '  helioscape.setResources(9999, 9999, 9999)\n' +
      '  helioscape.setBioPhase("mars", 1, "available")\n' +
      '  helioscape.getState()  // returns full game state object\n' +
      '  helioscape.printState()  // logs formatted game state'
    )
  };
  
  console.log('%c Helioscape debug console active. Type helioscape.help() to start.',
    'color: #c8861e; font-weight: bold;');

Inject DebugService eagerly in AppComponent (same pattern as system services)
so the console is available immediately.
```

---

# BLOCK 16 — Steam integration

*Sonnet 4.6. Do this block last — requires Steamworks partner account and AppID.*

---

## 16.0 — Prerequisites (manual steps before any code)

```
Before implementing Steam integration:

1. Register at https://partner.steamgames.com ($100 one-time fee per app)
2. Create your app in the Steamworks portal — you'll receive an AppID
3. Create a steam_appid.txt file in src-tauri/ containing just your AppID:
   echo "YOUR_APP_ID" > src-tauri/steam_appid.txt
   Add this file to .gitignore — it's machine-specific.

4. Install steamworks.js:
   npm install steamworks.js

5. For Tauri specifically, steamworks.js requires a native sidecar.
   Follow the steamworks.js Tauri integration guide at:
   https://github.com/ceifa/steamworks.js

   The short version: steamworks.js runs as a Rust sidecar that your
   Tauri app communicates with via IPC. This requires adding it to
   src-tauri/tauri.conf.json and Cargo.toml.
   
   Comment in code wherever Steam is called: these calls silently no-op
   when Steam is not running (dev mode). Safe to leave in production builds.
```

---

## 16.1 — `src/app/core/services/steam.service.ts`

```
Create src/app/core/services/steam.service.ts for Helioscape.

Read AGENTS.md. @Injectable({ providedIn: 'root' }).

Responsibility: all Steam SDK calls. Achievements, stats, overlay detection.
All methods silently no-op when not running inside Steam.
No other service or component touches Steam APIs directly.

private readonly isSteam: boolean = typeof window !== 'undefined' &&
  '__TAURI__' in window && /* check for steam_appid.txt presence */ true.
  Comment: refine this check once steamworks.js Tauri integration is set up.

private client: any = null.
  Comment: type as SteamworksClient once steamworks.js types are available.

async initialise(): Promise<void>
  if (!isSteam) return.
  try {
    const steamworks = await import('steamworks.js').
    this.client = steamworks.init(YOUR_APP_ID).
    this._setupOverlayDetection().
    console.log('Steam initialised. User:', this.client.localplayer.getName()).
  } catch (e) {
    console.warn('Steam init failed (expected outside Steam):', e).
    // Not an error — game runs fine without Steam.
  }

unlockAchievement(id: SteamAchievement): void
  if (!client) return.
  try { this.client.achievement.activate(id). }
  catch (e) { console.warn('Achievement error:', e). }

setStat(id: SteamStat, value: number): void
  if (!client) return.
  try { this.client.stats.setInt(id, value). this.client.stats.storeStats(). }
  catch (e) { console.warn('Stat error:', e). }

private _setupOverlayDetection(): void
  if (!client) return.
  this.client.callback.register(
    this.client.steam_api.ECallbackType.GameOverlayActivated,
    (result: { active: boolean }) => {
      inject(GameLoopService)[result.active ? 'pause' : 'resume']().
    }
  ).
  Comment: Valve requires games to pause when Steam overlay activates.

Define typed achievement IDs as a const enum — prevents typos:

export const SteamAchievement = {
  MERCURY_LANDING:          'MERCURY_LANDING',
  FIRST_TECH_UNLOCKED:      'FIRST_TECH_UNLOCKED',
  TYPE_1_CIVILISATION:      'TYPE_1_CIVILISATION',
  FIRST_ERA_COMPLETE:       'FIRST_ERA_COMPLETE',
  TYPE_2_CIVILISATION:      'TYPE_2_CIVILISATION',
  FIRST_BIO_PHASE:          'FIRST_BIO_PHASE',
  MARS_LIVING_WORLD:        'MARS_LIVING_WORLD',
  VENUS_SECOND_EARTH:       'VENUS_SECOND_EARTH',
  EUROPA_IMPACT:            'EUROPA_IMPACT',
  POLAR_DETONATION:         'POLAR_DETONATION',
  FIRST_EMERGENT_DISCOVERY: 'FIRST_EMERGENT_DISCOVERY',
  SEED_SHIP_LAUNCHED:       'SEED_SHIP_LAUNCHED',
} as const.
export type SteamAchievement = typeof SteamAchievement[keyof typeof SteamAchievement].

export const SteamStat = {
  GAME_YEARS_PLAYED:   'game_years_played',
  TECHS_UNLOCKED:      'techs_unlocked',
  CULTURE_EVENTS_READ: 'culture_events_read',
} as const.
export type SteamStat = typeof SteamStat[keyof typeof SteamStat].

These IDs must be registered in the Steamworks partner portal exactly as written here.
```

---

## 16.2 — Wiring Steam achievements into system services

```
After SteamService exists, add these calls to the relevant system services.
These are small additions — one line each where the relevant event fires.

In KardashevService._completeMilestone():
  inject(SteamService).unlockAchievement(SteamAchievement.TYPE_1_CIVILISATION)
    // only when milestone.id === 'type_1'
  inject(SteamService).unlockAchievement(SteamAchievement.FIRST_ERA_COMPLETE)
    // only when milestone.id === 'first_era_complete'
  inject(SteamService).unlockAchievement(SteamAchievement.TYPE_2_CIVILISATION)
    // only when milestone.id === 'type_2'

In TerraformingService.applyChoice():
  inject(SteamService).unlockAchievement(SteamAchievement.EUROPA_IMPACT)
    // when choiceId === 'venus_europa_impact'
  inject(SteamService).unlockAchievement(SteamAchievement.POLAR_DETONATION)
    // when choiceId === 'mars_polar_detonation'

In BioPhaseService._completePhase():
  inject(SteamService).unlockAchievement(SteamAchievement.FIRST_BIO_PHASE)
    // first time any phase completes (check if no other phases complete in history)

In CultureEventService on first tech unlock:
  inject(SteamService).unlockAchievement(SteamAchievement.MERCURY_LANDING)
    // when event ce_mercury_landing fires

In GameLoopService or GameStateService, each year tick:
  inject(SteamService).setStat(SteamStat.GAME_YEARS_PLAYED,
    this.gameYear() - 2033)  // years elapsed since game start

In CultureEventService.closeCurrentEvent():
  inject(SteamService).setStat(SteamStat.CULTURE_EVENTS_READ,
    this.gameState.cultureEventHistory().length)

Add these as small focused additions to the existing service files —
not rewrites of the whole file. Tell the agent: "Add Steam achievement
calls to [service file]. Here is the existing file: [paste file].
Add only what is specified, change nothing else."

Register all achievement IDs in the Steamworks partner portal before testing.
```

---

## 16.3 — Steam cloud saves configuration (Steamworks portal, no code)

```
Steam Cloud syncs save files automatically — no code changes to SaveService needed.

In the Steamworks partner portal for your app:
  Cloud → Add file path:
    Windows: %APPDATA%\helioscape\helioscape_saves.json
    Mac: ~/Library/Application Support/helioscape/helioscape_saves.json
    Linux: ~/.local/share/helioscape/helioscape_saves.json

These paths match where tauri-plugin-store writes files.
Steam Cloud handles upload/download/conflict resolution automatically.

Quota: set to 10MB (save files are tiny — full game state is ~50KB).
Enable: check "Enable Steam Cloud" in the portal.

Test by:
  1. Playing on machine A, saving in slot 1.
  2. Logging into Steam on machine B.
  3. Launching Helioscape — save should appear in Load Game.
```

---

# BLOCK 17 — Final checklist

```
Before running the app for the first time after all prompts:

1. Verify all data JSON files are in src/data/ and angular.json assets config
   copies them to /data/ at build time.

2. Run ng build — fix any TypeScript errors before running.
   Common issues: missing imports, interface mismatches between model files
   and what services expect.

3. Run ng serve and open browser console.
   Check for: DataService loaded summary, 'Helioscape debug console active' message.
   If DataService fails: check the JSON file paths and angular.json assets config.

4. Type helioscape.help() in the browser console to verify debug service works.

5. Type helioscape.setYear(2100) and verify HUD year label updates.

6. Type helioscape.completeTech('earth', 'earth_launch_mercury_mission')
   and verify Mercury appears as unlocked in the planets panel.

7. Type helioscape.triggerEvent('ce_mercury_landing')
   and verify a culture event card appears.

If all seven pass: the core architecture is wired correctly.
Proceed to playtesting.
```
