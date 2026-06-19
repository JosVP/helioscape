# Plan: Timed, RP-capacity-gated research tracks (Block 20-1)

**Status:** Pending implementation  
**Scope:** Mechanism only — no Architect branch or hidden/silhouette visuals (20-2), no terraforming choices (Block 22).

---

## 1  Problem statement

Tech-node clicks call `TechTreeService.unlockTech()` directly → instant completion, no RP gating, no progress display. The existing `ResearchService` timed-track path (for research-tracks.json items) works correctly but is an isolated silo. This plan unifies both under one mechanism.

---

## 2  Architecture overview

```
Player clicks node
  └─ ResearchHub.onNodeClick(nodeId, planetId)
       └─ ResearchService.startTechTrack(nodeId, planetId)
            ├─ canStart? = techTreeService.canUnlock() && RP capacity ok
            └─ gameState.startResearch(nodeId, planetId, rpCost)   ← adds to pool

Each game year (GameLoopService tick)
  └─ ResearchService.processYear(year)
       └─ for each active track: check elapsed >= durationYears
            └─ if tech node: techTreeService.completeNodeResearch(nodeId, planetId)
                   ├─ fork? → present fork (existing path, unchanged)
                   └─ else → gameState.unlockTech() + applyEffects + emit
```

`usedRpCapacity` (GameStateService computed) reads `rpCost` from whichever data source matches
the `trackId`: `getResearchTrack()` first, then `getTechNode()` as fallback.

---

## 3  Data format change: `ActiveResearchTrack`

The current `progressYears` accumulator is integer-safe, but the prompt spec calls for
`startYear`-based derivation. Switching makes pause/resume more explicit and removes the
`advanceResearch()` mutation from the tick loop.

### New shape

```ts
// tech-tree.model.ts
export interface ActiveResearchTrack {
  readonly trackId: string;
  readonly planetId: string;
  readonly isPaused: boolean;
  /** The game year when this run (or resume) began. */
  readonly startYear: number;
  /** Years accumulated from all runs before the current `startYear`. */
  readonly elapsedBeforeStart: number;
}
```

**Derived progress** (never stored):
```ts
function elapsed(track: ActiveResearchTrack, currentYear: number): number {
  return track.elapsedBeforeStart
    + (track.isPaused ? 0 : currentYear - track.startYear);
}
```

### Save version bump: 2 → 3

`SaveService._migrate()` must handle v2 → v3:
```ts
case 2:
  if (data.activeResearch) {
    const year = data.gameYear ?? INITIAL_YEAR;
    data.activeResearch = data.activeResearch.map((t: { trackId: string; planetId: string; progressYears: number; isPaused: boolean }) => ({
      trackId: t.trackId,
      planetId: t.planetId,
      isPaused: t.isPaused,
      startYear: t.isPaused ? year : year - (t.progressYears ?? 0),
      elapsedBeforeStart: t.isPaused ? (t.progressYears ?? 0) : 0,
    }));
  }
  data.saveVersion = 3;
```

---

## 4  Layer-by-layer changes

### Layer 0 — Model: `tech-tree.model.ts`

- `ActiveResearchTrack`: replace `progressYears: number` with `startYear: number` + `elapsedBeforeStart: number` as above.
- Expose a pure `elapsedYears(track, year)` helper (not in the class — a standalone util in `year-value.utils.ts` or in the service).
- No changes needed to `TechNode` — `rpCost` and `durationYears` already exist.

### Layer 1 — GameStateService (`game-state.service.ts`)

**`usedRpCapacity` fix** — handle both track types:
```ts
readonly usedRpCapacity = computed<number>(() =>
  this._activeResearch()
    .filter(t => !t.isPaused)
    .reduce((sum, t) => {
      const rpCost =
        this.data.getResearchTrack(t.trackId)?.rpCost ??
        this.data.getTechNode(t.trackId)?.rpCost ??
        0;
      return sum + rpCost;
    }, 0)
);
```

**Mutation methods to update:**

| Method | Change |
|---|---|
| `startResearch(trackId, planetId)` | Accept `startYear: number` parameter (passed from ResearchService as `gameYear`). Store `{ trackId, planetId, isPaused: false, startYear, elapsedBeforeStart: 0 }` |
| `pauseResearch(trackId)` | Snapshot elapsed years at current `gameYear()`, set `isPaused: true`, update `elapsedBeforeStart = elapsed(track, year)`, reset `startYear = year` |
| `resumeResearch(trackId)` | Set `isPaused: false`, `startYear = gameYear()` (elapsedBeforeStart stays as-is) |
| `advanceResearch()` | **Delete** — no longer used; replaced by year-derived check |
| `completeResearch(trackId)` | Unchanged — removes from activeResearch, adds to completedTechs |

**`SerializedGameState`** — `activeResearch` array already exists; the shape changes per the model above. Save version constant `SAVE_VERSION = 3`.

**`hydrate()`** — `activeResearch` entries reconstructed from serialised data. No special handling needed beyond the migration above.

---

### Layer 2 — ResearchService (`research.service.ts`)

**New helper (private):**
```ts
private getTrackDef(trackId: string): { durationYears: number; rpCost: number } | null {
  const rt = this.data.getResearchTrack(trackId);
  if (rt) return { durationYears: rt.durationYears, rpCost: rt.rpCost };
  const tn = this.data.getTechNode(trackId);
  if (tn) return { durationYears: tn.durationYears, rpCost: tn.rpCost };
  return null;
}
```

**`processYear(year: number)`** — switch from `advanceResearch()` to elapsed check:
```ts
private processYear(year: number): void {
  const tracks = this.gameState.activeResearch();
  for (const track of tracks) {
    if (track.isPaused) continue;
    const def = this.getTrackDef(track.trackId);
    if (!def) continue;
    const totalElapsed = track.elapsedBeforeStart + (year - track.startYear);
    if (totalElapsed >= def.durationYears) {
      this._completeTrack(track.trackId, track.planetId);
    }
  }
}
```

**`_completeTrack(trackId, planetId)`** — already calls `gameState.completeResearch()` + `techTree.applyEffects()` for ResearchTracks. For TechNodes, delegate to `TechTreeService.completeNodeResearch()` (see Layer 3 below):
```ts
private _completeTrack(trackId: string, planetId: string): void {
  if (this.data.getResearchTrack(trackId)) {
    // existing research-track path
    this.gameState.completeResearch(trackId);
    const def = this.data.getResearchTrack(trackId)!;
    this.techTree.applyEffects(def.onCompleteEffects, planetId);
    this.eventBus.researchCompleted$.next(trackId);
  } else if (this.data.getTechNode(trackId)) {
    // tech-node path — delegate to TechTreeService
    this.gameState.completeResearch(trackId);  // remove from active, add to completedTechs
    this.techTree.completeNodeResearch(planetId, trackId);
  }
}
```

**`canStartTrack(trackId)`** — currently only handles ResearchTracks. Keep for ResearchTracks. Add separate method:

```ts
/**
 * Checks whether a tech node can be queued as a timed track.
 * Prereqs are verified by TechTreeService.canUnlock(); capacity is checked here.
 */
canStartTechTrack(nodeId: string, planetId: string): boolean {
  const node = this.data.getTechNode(nodeId);
  if (!node) return false;
  if (this.gameState.completedTechs().includes(nodeId)) return false;
  const alreadyActive = this.gameState.activeResearch().find(t => t.trackId === nodeId);
  if (alreadyActive && !alreadyActive.isPaused) return false;
  if (!this.techTree.canUnlock(planetId, nodeId)) return false;
  return (
    this.gameState.usedRpCapacity() + node.rpCost <= this.gameState.totalRpCapacity()
  );
}

/**
 * Starts a tech node as a timed research track.
 * If already paused (edge case), resumes instead.
 */
startTechTrack(nodeId: string, planetId: string): void {
  const existing = this.gameState.activeResearch().find(t => t.trackId === nodeId);
  if (existing?.isPaused) {
    this.resumeTrack(nodeId);
    return;
  }
  if (!this.canStartTechTrack(nodeId, planetId)) return;
  this.gameState.startResearch(nodeId, planetId, this.gameState.gameYear());
}
```

**`resumeTrack(trackId)`** — fix rpCost lookup to handle TechNodes:
```ts
const rpCost =
  this.data.getResearchTrack(trackId)?.rpCost ??
  this.data.getTechNode(trackId)?.rpCost ??
  0;
```

---

### Layer 3 — TechTreeService (`tech-tree.service.ts`)

**`unlockTech(planetId, nodeId)`** — remains intact. It is no longer called by ResearchHub but IS called by `ResearchService._completeTrack()` internally. The method signature and fork logic are unchanged.

**Add `completeNodeResearch(planetId, nodeId)`** — a thin internal wrapper that just calls `unlockTech()`:
```ts
/**
 * Called by ResearchService when a tech-node track completes.
 * Applies effects (and presents fork if required) exactly as if the player had
 * clicked an instant-unlock button — but now gated by the track timer.
 * Not for direct player use. TechTreeService.canUnlock() is NOT re-checked here
 * because the track start already validated prereqs.
 */
completeNodeResearch(planetId: string, nodeId: string): void {
  this.unlockTech(planetId, nodeId);
}
```

*(This keeps the existing fork logic working without any change.)*

---

### Layer 4 — ResearchHubComponent (`research-hub.component.ts`)

**`onNodeClick`** — route through ResearchService:
```ts
onNodeClick(nodeId: string, planetId: string): void {
  this.researchService.startTechTrack(nodeId, planetId);
  // techUnlocked$ no longer fires here on click — it fires when the track completes.
  // New badge timing: listen to a new event, or use researchStarted$ (add to EventBusService).
}
```

**`NodeEntry`** — add optional progress fields:
```ts
interface NodeEntry {
  readonly node: TechNode;
  readonly visibility: NodeVisibility;
  readonly interactive: boolean;
  readonly progressPercent?: number;  // 0–100, only set for 'in_progress'
  readonly etaYear?: number;          // only set for 'in_progress'
}
```

**`NodeVisibility`** — add new states:
```ts
export type NodeVisibility = 'completed' | 'in_progress' | 'available' | 'needs_capacity' | 'hint';
```

**`_getVisibility()`** — insert `in_progress` and `needs_capacity` before `available`:
```ts
private _getVisibility(node, completed, interactive): NodeVisibility | null {
  if (completed.includes(node.id)) return 'completed';

  // In-progress: currently running (non-paused) as a timed track
  const activeTrack = this.gameState.activeResearch().find(t => t.trackId === node.id);
  if (activeTrack && !activeTrack.isPaused) return 'in_progress';

  if (interactive) {
    const canStart = this.researchService.canStartTechTrack(node.planet, node.id);
    if (this.techTreeService.canUnlock(node.planet, node.id)) {
      return canStart ? 'available' : 'needs_capacity';
    }
  }

  const allPrereqs = [...node.prerequisites, ...node.spilloverPrerequisites];
  if (allPrereqs.some(id => completed.includes(id))) return 'hint';

  return null;
}
```

**`_buildColumnStates()`** — add progress data for `in_progress` nodes:
```ts
// Inside the loop, after determining visibility:
let progressPercent: number | undefined;
let etaYear: number | undefined;
if (visibility === 'in_progress') {
  const track = activeResearch.find(t => t.trackId === node.id)!;
  const year = this.gameState.gameYear();
  const totalElapsed = track.elapsedBeforeStart + (year - track.startYear);
  progressPercent = Math.min(100, (totalElapsed / node.durationYears) * 100);
  etaYear = year + Math.ceil(node.durationYears - totalElapsed);
}
result.set(node.id, { node, visibility, interactive, progressPercent, etaYear });
```

The `computed()` wrappers (`marsStates`, etc.) will automatically become reactive to `activeResearch()` and `gameYear()` signals since they're read inside `_buildColumnStates`.

**Inject `ResearchService`** — add to existing imports.

---

### Layer 5 — TechNodeCardComponent (`tech-node-card.component.ts` / `.html`)

Add inputs for the new display states. Keep `NodeVisibility` as-is — the card derives all display from it.

**New computed signals in the class:**
```ts
readonly isInProgress = computed(() => this.visibility() === 'in_progress');
readonly isNeedsCapacity = computed(() => this.visibility() === 'needs_capacity');
readonly progressPercent = input<number | undefined>(undefined);
readonly etaYear = input<number | undefined>(undefined);
```

**Template additions:**
- `[class.is-in-progress]="isInProgress()"` on host
- `[class.is-needs-capacity]="isNeedsCapacity()"` on host
- `@if (isInProgress()) { <div class="tech-node-card__progress-bar" ...> + <span>{{ etaYear() }}</span> }`
- For `needs_capacity`: show "⏳ Needs capacity" badge; disable click

**`nodeClicked` output** — guard to prevent clicking when not startable:
```ts
onClick(): void {
  if (this.visibility() !== 'available' || !this.interactive()) return;
  this.nodeClicked.emit(this.node().id);
}
```

---

### Layer 6 — EventBusService

Add `researchTrackStarted$: Subject<{ trackId: string; planetId: string }>` so the Research Hub can react when a track starts (e.g., for future audio).

*(Optional for this block — note it in TODO.md if deferred.)*

---

### Layer 7 — ResourcePowerBarComponent

The RP capacity bar is moving here (see item 2 of the parallel changes). Confirm:
- `rpUsed = computed(() => gameState.usedRpCapacity())` — after the fix above, this correctly includes tech-node tracks
- `rpTotal = computed(() => gameState.totalRpCapacity())`

No additional changes needed for Block 20-1 beyond what item 2 already describes.

---

### Layer 8 — Save/Load

`SaveService._migrate()`:
- Bump `SAVE_VERSION` constant to `3`
- Add `case 2:` migration (see §3 above)
- `GameStateService.hydrate()` reads `activeResearch` from serialised state — no change needed beyond the new field shape

---

## 5  Out of scope (20-2)

- Architect-branch nodes with hidden/silhouette dependents
- Visual reveal animations for unlocked nodes
- Terraforming choices (Block 22)
- ResearchHub RP capacity bar redesign — handled by parallel item 2/3 changes above

---

## 6  Milestones

| # | Description | Key files |
|---|---|---|
| M0 | Model change: `ActiveResearchTrack` shape; `SAVE_VERSION = 3`; `_migrate()` | `tech-tree.model.ts`, `save.service.ts` |
| M1 | GameStateService: fix `usedRpCapacity`, update mutation methods | `game-state.service.ts` |
| M2 | ResearchService: unified `getTrackDef()`, `startTechTrack()`, year-derived completion | `research.service.ts` |
| M3 | TechTreeService: `completeNodeResearch()` wrapper | `tech-tree.service.ts` |
| M4 | ResearchHub: route click through `startTechTrack`, new `NodeVisibility`, `in_progress` display | `research-hub.component.ts`, `tech-node-card.*` |
| M5 | Tests: GameStateService (usedRpCapacity with tech nodes), ResearchService (start/complete), ResearchHub (node states) | `*.spec.ts` |
| M6 | Build + manual test: click a node → track appears → year advances → node completes | `ng build`, `ng test` |

---

## 7  Verification checklist

- [ ] `ng build` clean (no TypeScript errors)
- [ ] `ng test --watch=false` all passing
- [ ] Click available tech node → appears as `in_progress` in Research Hub (no instant unlock)
- [ ] RP capacity bar reflects the running track's cost correctly (used capacity goes up)
- [ ] RP bar shows correct free capacity; second track blocked when total would be exceeded
- [ ] Track shown as `needs_capacity` when prereqs met but not enough RP
- [ ] After `durationYears` game ticks, node becomes `completed` and dependents become `available`
- [ ] Fork nodes: track completes → fork modal appears (not instant, same as before once timer expires)
- [ ] Existing ResearchTrack (research-tracks.json) path still works (pause/resume/complete)
- [ ] Save → load mid-track → progress correct (elapsed derived from `startYear`, not a stored float)
- [ ] Old save (v2) migrates cleanly — tracks survive the shape change
