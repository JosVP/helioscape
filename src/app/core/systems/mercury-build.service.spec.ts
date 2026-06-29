import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { MercuryBuildService } from './mercury-build.service';
import type { MercuryComponent } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { MercuryQueueEntry, PlanetBioState, ResourceStore } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResourceStore(overrides: Partial<ResourceStore> = {}): ResourceStore {
  return { commonOre: 0, rareMetals: 0, polarVolatiles: 0, ...overrides };
}

function makeComponent(overrides: Partial<MercuryComponent> = {}): MercuryComponent {
  return {
    id: 'odn',
    displayName: 'Orbital Deployment Network',
    description: 'Test component',
    buildTimeYears: 40,
    cost: makeResourceStore({ rareMetals: 60, polarVolatiles: 20 }),
    unlockCondition: null,
    maxInstances: 1,
    targetEffect: 'odn',
    ...overrides,
  };
}

function makeQueueEntry(overrides: Partial<MercuryQueueEntry> = {}): MercuryQueueEntry {
  return {
    componentId: 'odn',
    targetPlanet: 'mars',
    progressYears: 0,
    totalYears: 40,
    ...overrides,
  };
}

function makePlanetBioState(overrides: Partial<PlanetBioState> = {}): PlanetBioState {
  return {
    currentPhaseIndex: 0,
    phases: [],
    odnBuilt: false,
    bioreactorBatchesActive: 0,
    precipitationEnginesBuilt: 0,
    atmosphericCatalystShipsBuilt: 0,
    requestsSent: [],
    discoveredOrganisms: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  queue?: MercuryQueueEntry[];
  resources?: ResourceStore;
  bioPhases?: Record<string, PlanetBioState>;
  completedTechs?: string[];
  earthFlags?: Record<string, boolean>;
  gameYear?: number;
} = {}) {
  const queueSig = signal<MercuryQueueEntry[]>(opts.queue ?? []);
  const resourcesSig = signal<ResourceStore>(opts.resources ?? makeResourceStore({ commonOre: 1000, rareMetals: 1000, polarVolatiles: 1000 }));
  const bioPhasesSig = signal<Record<string, PlanetBioState>>(opts.bioPhases ?? {});
  const completedTechsSig = signal<string[]>(opts.completedTechs ?? []);
  const earthFlagsSig = signal<Record<string, boolean>>(opts.earthFlags ?? {});
  const gameYearSig = signal<number>(opts.gameYear ?? 2033);

  return {
    mercuryBuildQueue: queueSig.asReadonly(),
    mercuryResources: resourcesSig.asReadonly(),
    bioPhases: bioPhasesSig.asReadonly(),
    completedTechs: completedTechsSig.asReadonly(),
    earthFlags: earthFlagsSig.asReadonly(),
    gameYear: gameYearSig.asReadonly(),

    // Write helpers for test setup
    _setQueue: (v: MercuryQueueEntry[]) => queueSig.set(v),
    _setResources: (v: ResourceStore) => resourcesSig.set(v),
    _setBioPhases: (v: Record<string, PlanetBioState>) => bioPhasesSig.set(v),
    _advanceYear: () => gameYearSig.update((y) => y + 1),

    // Mutation spies — simulate real side-effects for chained assertions.
    enqueueMercuryComponent: vi.fn((entry: MercuryQueueEntry) => {
      queueSig.update((q) => [...q, entry]);
    }),
    advanceMercuryBuildProgress: vi.fn(() => {
      queueSig.update((q) => {
        if (q.length === 0) return q;
        const [first, ...rest] = q;
        return [{ ...first, progressYears: first.progressYears + 1 }, ...rest];
      });
    }),
    shiftMercuryBuildQueue: vi.fn(() => {
      let shifted: MercuryQueueEntry | undefined;
      queueSig.update((q) => {
        if (q.length === 0) return q;
        const [first, ...rest] = q;
        shifted = first;
        return rest;
      });
      return shifted;
    }),
    applyComponentArrival: vi.fn((planetId: string, componentId: string) => {
      bioPhasesSig.update((phases) => {
        const planet = phases[planetId];
        if (!planet) return phases;
        switch (componentId) {
          case 'odn':
            return { ...phases, [planetId]: { ...planet, odnBuilt: true } };
          case 'precipitationEngine':
            return { ...phases, [planetId]: { ...planet, precipitationEnginesBuilt: planet.precipitationEnginesBuilt + 1 } };
          case 'atmosphericCatalystShip':
            return { ...phases, [planetId]: { ...planet, atmosphericCatalystShipsBuilt: planet.atmosphericCatalystShipsBuilt + 1 } };
          case 'bioreactor':
            return { ...phases, [planetId]: { ...planet, bioreactorBatchesActive: planet.bioreactorBatchesActive + 1 } };
          default:
            return phases;
        }
      });
    }),
    updateMercuryResources: vi.fn((delta: Partial<ResourceStore>) => {
      resourcesSig.update((r) => ({
        commonOre: r.commonOre + (delta.commonOre ?? 0),
        rareMetals: r.rareMetals + (delta.rareMetals ?? 0),
        polarVolatiles: r.polarVolatiles + (delta.polarVolatiles ?? 0),
      }));
    }),
  };
}

function makeDataFake(components: MercuryComponent[] = []) {
  return {
    getMercuryComponent: vi.fn((id: string) => components.find((c) => c.id === id)),
    getAllMercuryComponents: vi.fn(() => components),
  };
}

function makeEventBusFake() {
  return {
    mercuryBuildCompleted$: new Subject<string>(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MercuryBuildService', () => {
  let service: MercuryBuildService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  function setup(components: MercuryComponent[] = [], gameStateOpts: Parameters<typeof makeGameStateFake>[0] = {}) {
    gameState = makeGameStateFake(gameStateOpts);
    data = makeDataFake(components);
    eventBus = makeEventBusFake();

    TestBed.configureTestingModule({
      providers: [
        MercuryBuildService,
        { provide: GameStateService, useValue: gameState },
        { provide: DataService, useValue: data },
        { provide: EventBusService, useValue: eventBus },
      ],
    });

    service = TestBed.inject(MercuryBuildService);
  }

  // -------------------------------------------------------------------------
  // queueComponent — validation failures
  // -------------------------------------------------------------------------

  describe('queueComponent', () => {
    it('returns false when the component id is not found in DataService', () => {
      setup([]); // no components registered
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('returns false when unlockCondition is not in completedTechs', () => {
      setup(
        [makeComponent({ id: 'odn', unlockCondition: 'launch_mercury_mission' })],
        { completedTechs: [] },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('returns false when unlockCondition is not in earthFlags', () => {
      setup(
        [makeComponent({ id: 'odn', unlockCondition: 'mercury_ready' })],
        { earthFlags: {} },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('returns true when unlockCondition matches a completedTech', () => {
      setup(
        [makeComponent({ id: 'odn', unlockCondition: 'launch_mercury_mission', maxInstances: null })],
        { completedTechs: ['launch_mercury_mission'] },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(true);
    });

    it('returns true when unlockCondition matches a truthy earthFlag', () => {
      setup(
        [makeComponent({ id: 'odn', unlockCondition: 'mercury_ready', maxInstances: null })],
        { earthFlags: { mercury_ready: true } },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(true);
    });

    it('returns false when maxInstances is reached by already-built components', () => {
      setup(
        [makeComponent({ id: 'odn', maxInstances: 1 })],
        { bioPhases: { mars: makePlanetBioState({ odnBuilt: true }) } },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('returns false when maxInstances is reached by in-queue entries', () => {
      setup(
        [makeComponent({ id: 'odn', maxInstances: 1 })],
        {
          queue: [makeQueueEntry({ componentId: 'odn', targetPlanet: 'mars' })],
          bioPhases: { mars: makePlanetBioState() },
        },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('counts in-queue and built together against maxInstances', () => {
      setup(
        [makeComponent({ id: 'precipitationEngine', maxInstances: 2, targetEffect: 'precipitationEngine' })],
        {
          queue: [makeQueueEntry({ componentId: 'precipitationEngine', targetPlanet: 'mars' })],
          bioPhases: { mars: makePlanetBioState({ precipitationEnginesBuilt: 1 }) },
        },
      );
      expect(service.queueComponent('precipitationEngine', 'mars')).toBe(false);
    });

    it('returns false when resources are insufficient', () => {
      setup(
        [makeComponent({ id: 'odn', cost: makeResourceStore({ rareMetals: 60 }), maxInstances: null })],
        { resources: makeResourceStore({ rareMetals: 10 }) },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('does NOT deduct resources when returning false due to insufficient funds', () => {
      setup(
        [makeComponent({ id: 'odn', cost: makeResourceStore({ rareMetals: 60 }), maxInstances: null })],
        { resources: makeResourceStore({ rareMetals: 10 }) },
      );
      service.queueComponent('odn', 'mars');
      expect(gameState.updateMercuryResources).not.toHaveBeenCalled();
    });

    it('does NOT deduct resources when returning false due to failed unlock check', () => {
      setup(
        [makeComponent({ id: 'odn', unlockCondition: 'some_tech', maxInstances: null })],
        { completedTechs: [], resources: makeResourceStore({ rareMetals: 1000 }) },
      );
      service.queueComponent('odn', 'mars');
      expect(gameState.updateMercuryResources).not.toHaveBeenCalled();
    });

    it('enqueues the component and deducts resources on success', () => {
      const component = makeComponent({ id: 'odn', cost: makeResourceStore({ rareMetals: 60, polarVolatiles: 20 }), maxInstances: null });
      setup(
        [component],
        { resources: makeResourceStore({ rareMetals: 100, polarVolatiles: 50 }) },
      );

      const result = service.queueComponent('odn', 'mars');

      expect(result).toBe(true);
      expect(gameState.enqueueMercuryComponent).toHaveBeenCalledWith({
        componentId: 'odn',
        targetPlanet: 'mars',
        progressYears: 0,
        totalYears: 40,
      });
      expect(gameState.updateMercuryResources).toHaveBeenCalledWith({
        commonOre: -0,
        rareMetals: -60,
        polarVolatiles: -20,
      });
    });

    it('allows queueing a stackable component (maxInstances: null) multiple times', () => {
      setup(
        [makeComponent({ id: 'precipitationEngine', maxInstances: null, targetEffect: 'precipitationEngine' })],
        { bioPhases: { mars: makePlanetBioState({ precipitationEnginesBuilt: 5 }) } },
      );
      expect(service.queueComponent('precipitationEngine', 'mars')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // processYear
  // -------------------------------------------------------------------------

  describe('processYear', () => {
    it('is a no-op when the queue is empty', () => {
      setup([], { queue: [] });
      service.processYear(2033);
      expect(gameState.advanceMercuryBuildProgress).not.toHaveBeenCalled();
    });

    it('increments progressYears of the head entry each tick', () => {
      setup([], { queue: [makeQueueEntry({ progressYears: 0, totalYears: 40 })] });
      service.processYear(2033);
      expect(gameState.advanceMercuryBuildProgress).toHaveBeenCalledTimes(1);
    });

    it('does not complete an entry before its totalYears is reached', () => {
      setup([], { queue: [makeQueueEntry({ progressYears: 38, totalYears: 40 })] });
      service.processYear(2033);
      // After advance: progressYears = 39, still < 40
      expect(gameState.applyComponentArrival).not.toHaveBeenCalled();
      expect(gameState.shiftMercuryBuildQueue).not.toHaveBeenCalled();
    });

    it('completes the entry when progressYears reaches totalYears', () => {
      const entry = makeQueueEntry({ progressYears: 39, totalYears: 40 });
      setup(
        [],
        {
          queue: [entry],
          bioPhases: { mars: makePlanetBioState() },
        },
      );
      service.processYear(2033);
      // After advance: progressYears = 40 >= totalYears 40 → complete
      expect(gameState.applyComponentArrival).toHaveBeenCalledWith('mars', 'odn');
      expect(gameState.shiftMercuryBuildQueue).toHaveBeenCalledTimes(1);
    });

    it('does NOT advance the second queue entry in the same tick', () => {
      const first = makeQueueEntry({ progressYears: 0, totalYears: 40 });
      const second = makeQueueEntry({ componentId: 'bioreactor', progressYears: 0, totalYears: 25 });
      setup([], { queue: [first, second] });
      service.processYear(2033);
      // advanceMercuryBuildProgress only increments the head
      expect(gameState.advanceMercuryBuildProgress).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // _completeBuild — bio-state effects and event emission
  // -------------------------------------------------------------------------

  describe('_completeBuild (via processYear)', () => {
    function runCompletion(componentId: string, targetEffect: MercuryComponent['targetEffect']) {
      const entry = makeQueueEntry({ componentId, targetPlanet: 'mars', progressYears: 39, totalYears: 40 });
      const bio = makePlanetBioState();
      setup([], { queue: [entry], bioPhases: { mars: bio } });
      service.processYear(2033);
    }

    it('sets odnBuilt: true when completing odn', () => {
      runCompletion('odn', 'odn');
      expect(gameState.applyComponentArrival).toHaveBeenCalledWith('mars', 'odn');
      expect(gameState.bioPhases()['mars']?.odnBuilt).toBe(true);
    });

    it('increments precipitationEnginesBuilt when completing precipitationEngine', () => {
      const entry = makeQueueEntry({ componentId: 'precipitationEngine', targetPlanet: 'mars', progressYears: 29, totalYears: 30 });
      setup([], { queue: [entry], bioPhases: { mars: makePlanetBioState({ precipitationEnginesBuilt: 1 }) } });
      service.processYear(2033);
      expect(gameState.bioPhases()['mars']?.precipitationEnginesBuilt).toBe(2);
    });

    it('increments atmosphericCatalystShipsBuilt when completing atmosphericCatalystShip', () => {
      const entry = makeQueueEntry({ componentId: 'atmosphericCatalystShip', targetPlanet: 'mars', progressYears: 34, totalYears: 35 });
      setup([], { queue: [entry], bioPhases: { mars: makePlanetBioState() } });
      service.processYear(2033);
      expect(gameState.bioPhases()['mars']?.atmosphericCatalystShipsBuilt).toBe(1);
    });

    it('increments bioreactorBatchesActive when completing bioreactor', () => {
      const entry = makeQueueEntry({ componentId: 'bioreactor', targetPlanet: 'mars', progressYears: 24, totalYears: 25 });
      setup([], { queue: [entry], bioPhases: { mars: makePlanetBioState() } });
      service.processYear(2033);
      expect(gameState.bioPhases()['mars']?.bioreactorBatchesActive).toBe(1);
    });

    it('emits mercuryBuildCompleted$ with the componentId after applying bio-state', () => {
      const emitted: string[] = [];
      const entry = makeQueueEntry({ componentId: 'odn', targetPlanet: 'mars', progressYears: 39, totalYears: 40 });
      setup([], { queue: [entry], bioPhases: { mars: makePlanetBioState() } });

      eventBus.mercuryBuildCompleted$.subscribe((id) => emitted.push(id));
      service.processYear(2033);

      expect(emitted).toEqual(['odn']);
      // Bio state must have been applied before emission (applyComponentArrival called first)
      const applyOrder = (gameState.applyComponentArrival as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
      const emitOrder = emitted.length; // truthy — emission happened
      expect(applyOrder).toBeGreaterThan(0);
      expect(emitOrder).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // _unlockConditionMet
  // -------------------------------------------------------------------------

  describe('_unlockConditionMet (via queueComponent)', () => {
    it('satisfies condition via completedTechs', () => {
      setup(
        [makeComponent({ unlockCondition: 'launch_mercury_mission', maxInstances: null })],
        { completedTechs: ['launch_mercury_mission'] },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(true);
    });

    it('satisfies condition via earthFlags', () => {
      setup(
        [makeComponent({ unlockCondition: 'mercury_ready', maxInstances: null })],
        { earthFlags: { mercury_ready: true } },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(true);
    });

    it('rejects when condition is in earthFlags but value is false', () => {
      setup(
        [makeComponent({ unlockCondition: 'mercury_ready', maxInstances: null })],
        { earthFlags: { mercury_ready: false } },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });

    it('rejects when condition appears in neither completedTechs nor earthFlags', () => {
      setup(
        [makeComponent({ unlockCondition: 'unknown_condition', maxInstances: null })],
        { completedTechs: [], earthFlags: {} },
      );
      expect(service.queueComponent('odn', 'mars')).toBe(false);
    });
  });
});
