# Plan — Block 9.6: GameStateService Mercury RTS Signals + Miner Assignment

**Unblocks**: Block 9.5b (miner buttons), Block 9.7 (zone selection), Block 9.8 (resource/power HUD)  
**Closes TODO**: `docs/agents/TODO.md § "GameStateService — Mercury RTS signals"`

---

## Architecture overview

```mermaid
flowchart TD
  subgraph Models
    M1[game-state.model.ts\nMercurySlotStatus · MercuryMinerState · MercuryPath\n+ 4 fields on SerializedGameState]
  end
  subgraph State
    GS[GameStateService\n4 private signals\n4 public readonly signals\nmercuryLocalPower computed\n6 mutation methods\n_unlockAdjacentSlots helper]
  end
  subgraph Consumers
    BI[building-info.component.ts\n– typed mercuryMiners()\n– assign/unassign buttons]
  end
  M1 --> GS
  GS --> BI
  GS --> |serialise/hydrate| Save
```

**Signal flow**:
- `_mercurySelectedZone` / `_mercuryMiners` / `_mercurySlotStates` / `_resourceReservations` are private writable signals on `GameStateService`.
- `mercuryLocalPower` is a `computed()` that reads `mercuryBuildings()` + the injected `DataService` (already present as `this.data`).
- Slot unlock cascade fires inside `updateBuildingStatus()` when `status === 'operational'` — this is the single code path where a grid building transitions to operational.
- `MercuryBuildService._completeBuild()` handles **orbital components**, not grid buildings. No change needed there.

---

## Active TODOs resolved by this block

- **GameStateService — Mercury RTS signals** → fully implemented here; move to Completed.

---

## Out of scope / deferred

- `mercuryPaths: Signal<MercuryPath[]>` — empty playtest stub only (no UI consumer yet; Block 9.x post-playtest).
- Zone selection UI (`ZoneSelectionComponent`) — Block 9.7.
- Resource/power HUD strip — Block 9.8.
- Miner assignment in `MercuryBuildService._completeBuild()` — that method processes **orbital components**, not grid buildings. No change required.

---

## Milestone 1 — Model (`game-state.model.ts`)

**File**: `src/app/core/models/game-state.model.ts`

### What to add

```ts
export type MercurySlotStatus = 'locked' | 'available' | 'building' | 'operational';

export interface MercuryMinerState {
  poolCount: number;                         // unassigned miners in reserve
  assignments: Record<string, number>;       // slotId → count assigned
}

export interface MercuryPath {
  id: string;
  segments: { col: number; row: number }[];  // empty for playtest
}
```

Add to `SerializedGameState`:
```ts
mercurySelectedZone: string | null;
mercuryMiners: MercuryMinerState;
mercurySlotStates: Record<string, MercurySlotStatus>;
resourceReservations: ResourceStore;
```

**Pitfalls**:
- Add after `europaState` to keep the interface readable (new Mercury-RTS section).
- `MercuryPath` is a stub — include it so the TODO-spec type exists even if no signal exposes it yet.

**Test**: TypeScript compiler is the test here — `ng build` must pass.

---

## Milestone 2 — Private signals + public readonly signals (`game-state.service.ts`)

**File**: `src/app/core/services/game-state.service.ts`

### New constants

```ts
const INITIAL_MINERS: Readonly<MercuryMinerState> = { poolCount: 3, assignments: {} };
const INITIAL_SLOT_STATES: Readonly<Record<string, MercurySlotStatus>> = {};
const INITIAL_RESERVATIONS: Readonly<ResourceStore> = { commonOre: 0, rareMetals: 0, polarVolatiles: 0 };
```

### New imports (add to the `import type` block at the top)

```ts
import type { MercuryMinerState, MercurySlotStatus } from '@app/core/models';
```

### Private signals (after `_europaState`)

```ts
private readonly _mercurySelectedZone   = signal<string | null>(null);
private readonly _mercuryMiners         = signal<MercuryMinerState>({ ...INITIAL_MINERS, assignments: {} });
private readonly _mercurySlotStates     = signal<Record<string, MercurySlotStatus>>({});
private readonly _resourceReservations  = signal<ResourceStore>({ ...INITIAL_RESERVATIONS });
```

### Public readonly signals (after `europaState`)

```ts
readonly mercurySelectedZone: Signal<string | null>       = this._mercurySelectedZone.asReadonly();
readonly mercuryMiners: Signal<MercuryMinerState>         = this._mercuryMiners.asReadonly();
readonly mercurySlotStates: Signal<Record<string, MercurySlotStatus>> = this._mercurySlotStates.asReadonly();
readonly resourceReservations: Signal<ResourceStore>      = this._resourceReservations.asReadonly();
```

**Pitfalls**:
- `DataService` is already injected as `private readonly data = inject(DataService)`. Do **not** call `inject()` inside `computed()` or mutation callbacks — read from `this.data`.
- `assignments` inside `INITIAL_MINERS` must be a fresh `{}` per signal init; use spread at call site to avoid sharing a reference.

---

## Milestone 3 — `mercuryLocalPower` computed + mutation methods

### Computed

Add to the "Computed signals" section, after `usedRpCapacity`:

```ts
/**
 * Sum of power produced/consumed by operational Mercury grid buildings.
 * energyDrawGw < 0 = power produced; energyDrawGw > 0 = power consumed.
 */
readonly mercuryLocalPower = computed<{ producedGw: number; consumedGw: number }>(() => {
  return this._computeMercuryLocalPower();
});

private _computeMercuryLocalPower(): { producedGw: number; consumedGw: number } {
  const operationalBuildings = this._mercuryBuildings()
    .filter((b) => b.status === 'operational');

  let producedGw = 0;
  let consumedGw = 0;

  for (const placed of operationalBuildings) {
    const def = this.data.getMercuryBuilding(placed.buildingId);
    if (!def) continue;
    if (def.energyDrawGw < 0) {
      producedGw += Math.abs(def.energyDrawGw);
    } else {
      consumedGw += def.energyDrawGw;
    }
  }

  return { producedGw, consumedGw };
}
```

**Pitfall**: The `computed()` callback itself cannot call `inject()`. The private helper reads `this._mercuryBuildings()` (reactive) and `this.data` (injected in constructor-scope field). This pattern is already used by `rpCapacityBoosts` — follow that exact shape.

### Mutation methods

Add a new "Mercury RTS mutations" section after the existing "Mercury / Dyson mutations":

```ts
// -------------------------------------------------------------------------
// Mercury RTS mutations
// -------------------------------------------------------------------------

/**
 * Sets the active starting zone and marks all slots belonging to that zone
 * (seedSlots + seedArea tiles with matching slots) as 'available'.
 * All other slot states are left unchanged.
 */
selectMercuryZone(zoneId: string): void {
  this._mercurySelectedZone.set(zoneId);
  const zone = this.data.getMercuryStartingZone(zoneId);
  if (!zone) return;

  this._mercurySlotStates.update((states) => {
    const next = { ...states };
    // Mark explicit seed slots
    for (const slotId of zone.seedSlots) {
      next[slotId] = 'available';
    }
    // Mark any slot whose col/row falls inside the seedArea
    const { colMin, colMax, rowMin, rowMax } = zone.seedArea;
    const allSlots = this.data.getMercuryMapData()?.slots ?? [];
    for (const slot of allSlots) {
      if (
        slot.col >= colMin && slot.col <= colMax &&
        slot.row >= rowMin && slot.row <= rowMax
      ) {
        next[slot.id] = 'available';
      }
    }
    return next;
  });
}

/** Moves one miner from the pool to the given slot. No-op if pool is empty. */
assignMiner(slotId: string): void {
  this._mercuryMiners.update((m) => {
    if (m.poolCount <= 0) return m;
    return {
      poolCount: m.poolCount - 1,
      assignments: { ...m.assignments, [slotId]: (m.assignments[slotId] ?? 0) + 1 },
    };
  });
}

/** Returns one miner from the given slot to the pool. No-op if slot has no miners. */
unassignMiner(slotId: string): void {
  this._mercuryMiners.update((m) => {
    const current = m.assignments[slotId] ?? 0;
    if (current <= 0) return m;
    return {
      poolCount: m.poolCount + 1,
      assignments: { ...m.assignments, [slotId]: current - 1 },
    };
  });
}

/** Moves one miner from one slot to another. No-op if source slot has no miners. */
reassignMiner(fromSlotId: string, toSlotId: string): void {
  this._mercuryMiners.update((m) => {
    const from = m.assignments[fromSlotId] ?? 0;
    if (from <= 0) return m;
    return {
      poolCount: m.poolCount,
      assignments: {
        ...m.assignments,
        [fromSlotId]: from - 1,
        [toSlotId]: (m.assignments[toSlotId] ?? 0) + 1,
      },
    };
  });
}

/** Sets a resource reservation amount (clamped ≥ 0). */
setResourceReservation(resource: keyof ResourceStore, amount: number): void {
  this._resourceReservations.update((r) => ({ ...r, [resource]: Math.max(0, amount) }));
}

/** Directly sets a slot's status. */
setMercurySlotState(slotId: string, status: MercurySlotStatus): void {
  this._mercurySlotStates.update((s) => ({ ...s, [slotId]: status }));
}
```

### Slot unlock cascade — patch `updateBuildingStatus`

The cascade must fire exactly once, when status transitions to `'operational'`. Modify the existing `updateBuildingStatus` method:

```ts
updateBuildingStatus(buildingId: string, status: 'building' | 'operational'): void {
  this._mercuryBuildings.update((buildings) =>
    buildings.map((b) => (b.id === buildingId ? { ...b, status } : b))
  );
  if (status === 'operational') {
    const building = this._mercuryBuildings().find((b) => b.id === buildingId);
    if (building) {
      this._unlockAdjacentSlots(building);
    }
  }
}

/** Unlocks (LOCKED → AVAILABLE) every slot adjacent to the given placed building. */
private _unlockAdjacentSlots(building: PlacedBuilding): void {
  const slot = this.data.getMercuryMapData()?.slots.find(
    (s) => s.col === building.col && s.row === building.row,
  );
  if (!slot || slot.adjacentTo.length === 0) return;

  this._mercurySlotStates.update((states) => {
    const next = { ...states };
    for (const adjId of slot.adjacentTo) {
      if ((next[adjId] ?? 'locked') === 'locked') {
        next[adjId] = 'available';
      }
    }
    return next;
  });
}
```

**Pitfall**: `this._mercuryBuildings()` is read **after** the `update()` call — the update is synchronous, so the new state is immediately available.  
**Pitfall**: `adjacentTo` in `mercury-map.json` is currently `[]` for mining slots. The cascade is a no-op for those; no defensive guard needed beyond the length check.

---

## Milestone 4 — Serialisation

### `reset()`

Add after `this._europaState.set(...)`:
```ts
this._mercurySelectedZone.set(null);
this._mercuryMiners.set({ poolCount: 3, assignments: {} });
this._mercurySlotStates.set({});
this._resourceReservations.set({ ...INITIAL_RESERVATIONS });
```

### `serialise()`

Add to the returned object after `europaState`:
```ts
mercurySelectedZone:  this._mercurySelectedZone(),
mercuryMiners:        this._mercuryMiners(),
mercurySlotStates:    this._mercurySlotStates(),
resourceReservations: this._resourceReservations(),
```

### `hydrate()`

Add after `this._europaState.set(...)`:
```ts
this._mercurySelectedZone.set(state.mercurySelectedZone ?? null);
this._mercuryMiners.set(state.mercuryMiners ?? { poolCount: 3, assignments: {} });
this._mercurySlotStates.set(state.mercurySlotStates ?? {});
this._resourceReservations.set(state.resourceReservations ?? { commonOre: 0, rareMetals: 0, polarVolatiles: 0 });
```

**Pitfall**: Old saves pre-9.6 will have `undefined` for these fields. All `??` defaults match the new-game reset values, so hydrating an old save is identical to starting a new game for these fields.

---

## Milestone 5 — Block 9.5b patch: `BuildingInfoComponent`

### `building-info.component.ts`

Replace the `assignedMiners` computed that uses `(gameState as any)` with:

```ts
readonly assignedMiners = computed<number>(
  () => this.gameState.mercuryMiners().assignments[this.slotId() ?? ''] ?? 0,
);

readonly minerPoolCount = computed<number>(
  () => this.gameState.mercuryMiners().poolCount,
);
```

### `building-info.component.html`

Replace the `building-info__miners-note` section with:

```html
@if (isRefinery()) {
  <div class="building-info__miners">
    <div class="building-info__miners-label">
      Miners assigned: <strong>{{ assignedMiners() }}</strong>
      &nbsp;(pool: {{ minerPoolCount() }})
    </div>
    <div class="building-info__miners-actions">
      <button
        class="building-info__btn building-info__btn--assign"
        (click)="gameState.assignMiner(slotId()!)"
        [disabled]="minerPoolCount() === 0"
        aria-label="Assign miner to this slot"
      >+ Assign</button>
      <button
        class="building-info__btn building-info__btn--unassign"
        (click)="gameState.unassignMiner(slotId()!)"
        [disabled]="assignedMiners() === 0"
        aria-label="Remove miner from this slot"
      >− Remove</button>
    </div>
  </div>
}
```

**Note**: `gameState` is already `private readonly` — expose it to the template by changing it to `protected readonly gameState` (or `readonly gameState` without access modifier, which Angular templates can reach). Keep it consistent with other components in the codebase.

**Pitfall**: `slotId()` may be `null` when no slot is associated (non-refinery buildings). The `@if (isRefinery())` guard and `slotId()!` non-null assertion are safe together because a slot with `slotType === 'refinery'` always has a non-null `slotId`.

---

## Milestone 6 — Update TODO.md

- Move **"GameStateService — Mercury RTS signals"** from Active → Completed with date `2026-06-14`.
- Note: `mercuryPaths` signal is **not** included (empty playtest stub — defer to post-playtest block per TODO spec). Add a brief Active TODO for it if one doesn't exist.

---

## Verification checklist

| Check | How |
|---|---|
| `ng build` passes, zero errors | `npx ng build` |
| Serialise/hydrate round-trip | Unit test: serialise a state with all 4 new fields, hydrate into fresh service, assert signals match |
| `selectMercuryZone('zone_1')` marks correct slots available | Unit test: inject DataService mock, call method, check `mercurySlotStates()` |
| `assignMiner` / `unassignMiner` pool math | Unit test: pool starts 3, assign to slotA (pool=2, slotA=1), unassign (pool=3, slotA=0) |
| `mercuryLocalPower` | Unit test: 2 operational buildings (one producer, one consumer), assert producedGw / consumedGw |
| `_unlockAdjacentSlots` cascade | Unit test: place a building with `adjacentTo: ['slot_b']`, call `updateBuildingStatus(id, 'operational')`, assert `mercurySlotStates()['slot_b'] === 'available'` |
| Assign/unassign buttons visible in BuildingInfo | Manual: open Mercury view, click a refinery tile, verify buttons and pool count appear |
| Old-save hydration | Manual / unit: hydrate `{}` (no new fields), confirm defaults |

---

## Files changed

| File | Change |
|---|---|
| `src/app/core/models/game-state.model.ts` | +3 interfaces/types, +4 fields on `SerializedGameState` |
| `src/app/core/services/game-state.service.ts` | +4 private signals, +4 public signals, +1 computed, +6 mutations, +1 private helper, patch `reset`/`serialise`/`hydrate`/`updateBuildingStatus` |
| `src/app/features/mercury/mercury-hud/building-info/building-info.component.ts` | Replace `(gameState as any)` guard, add `minerPoolCount` computed |
| `src/app/features/mercury/mercury-hud/building-info/building-info.component.html` | Replace placeholder note with assign/unassign buttons |
| `docs/agents/TODO.md` | Close Mercury RTS signals TODO |

No new files. No new components. No asset placeholders needed.
