import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { DysonService } from './dyson.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type { ResourceStore, PlacedBuilding } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResources(overrides: Partial<ResourceStore> = {}): ResourceStore {
  return { commonOre: 100, rareMetals: 0, polarVolatiles: 0, ...overrides };
}

function makeBuilding(overrides: Partial<PlacedBuilding> = {}): PlacedBuilding {
  return {
    id: 'b1',
    buildingId: 'dyson_construction_yard',
    col: 0,
    row: 0,
    status: 'operational',
    buildProgressYears: 10,
    totalBuildYears: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  panelCount?: number;
  tier?: 'basic' | 'mid' | 'hardened';
  coveragePercent?: number;
  resources?: ResourceStore;
  buildings?: PlacedBuilding[];
  completedMilestones?: string[];
  gameYear?: number;
} = {}) {
  const panelCountSignal = signal<number>(opts.panelCount ?? 0);
  const tierSignal = signal<'basic' | 'mid' | 'hardened'>(opts.tier ?? 'basic');
  const coverageSignal = signal<number>(opts.coveragePercent ?? 0);
  const resourcesSignal = signal<ResourceStore>(opts.resources ?? makeResources());
  const buildingsSignal = signal<PlacedBuilding[]>(opts.buildings ?? []);
  const milestonesSignal = signal<string[]>(opts.completedMilestones ?? []);
  const gameYearSignal = signal<number>(opts.gameYear ?? 2033);

  return {
    // Public readonly signals
    dysonPanelCount: panelCountSignal.asReadonly(),
    dysonPanelTier: tierSignal.asReadonly(),
    dysonCoveragePercent: coverageSignal.asReadonly(),
    mercuryResources: resourcesSignal.asReadonly(),
    mercuryBuildings: buildingsSignal.asReadonly(),
    completedMilestones: milestonesSignal.asReadonly(),
    gameYear: gameYearSignal.asReadonly(),

    // Test write helpers (not part of real GameStateService API)
    _setPanelCount: (n: number) => panelCountSignal.set(n),
    _setTier: (t: 'basic' | 'mid' | 'hardened') => tierSignal.set(t),
    _setCoverage: (c: number) => coverageSignal.set(c),
    _setResources: (r: ResourceStore) => resourcesSignal.set(r),
    _setBuildings: (b: PlacedBuilding[]) => buildingsSignal.set(b),
    _setMilestones: (m: string[]) => milestonesSignal.set(m),
    _setYear: (y: number) => gameYearSignal.set(y),

    // Mutation spies
    setDysonState: vi.fn((panelCount: number, coveragePercent: number, energyWatts: number) => {
      panelCountSignal.set(panelCount);
      coverageSignal.set(coveragePercent);
    }),
    setDysonPanelTier: vi.fn((tier: 'basic' | 'mid' | 'hardened') => {
      tierSignal.set(tier);
    }),
    updateMercuryResources: vi.fn((delta: Partial<ResourceStore>) => {
      resourcesSignal.update((r) => ({
        commonOre: r.commonOre + (delta.commonOre ?? 0),
        rareMetals: r.rareMetals + (delta.rareMetals ?? 0),
        polarVolatiles: r.polarVolatiles + (delta.polarVolatiles ?? 0),
      }));
    }),
    completeMilestone: vi.fn((id: string) => {
      milestonesSignal.update((m) => [...m, id]);
    }),
  };
}

function makeDataFake(buildingEffects: Array<{ type: string; amount?: number }> = []) {
  return {
    getMercuryBuilding: vi.fn((_id: string) => ({
      id: 'dyson_construction_yard',
      displayName: 'Dyson Construction Yard',
      description: '',
      category: 'dyson',
      cost: makeResources({ commonOre: 5 }),
      energyDrawGw: 0,
      buildTimeYears: 10,
      repeatable: true,
      maxInstances: null,
      unlockCondition: null,
      placementRule: 'any',
      effects: buildingEffects,
    })),
  };
}

function makeEventBusFake() {
  return {
    dysonEnergyUpdated$: new Subject<number>(),
    milestoneReached$: new Subject<string>(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('DysonService', () => {
  let service: DysonService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;
  let data: ReturnType<typeof makeDataFake>;

  function createService(
    gsOpts: Parameters<typeof makeGameStateFake>[0] = {},
    buildingEffects: Array<{ type: string; amount?: number }> = [],
  ): void {
    gameState = makeGameStateFake(gsOpts);
    eventBus = makeEventBusFake();
    data = makeDataFake(buildingEffects);

    TestBed.configureTestingModule({
      providers: [
        DysonService,
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService, useValue: eventBus },
        { provide: DataService,     useValue: data },
      ],
    });
    service = TestBed.inject(DysonService);
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // processYear — panel addition
  // -------------------------------------------------------------------------

  describe('processYear()', () => {
    it('adds BASE_PANELS_PER_YEAR when ore is sufficient', () => {
      createService({ panelCount: 0, resources: makeResources({ commonOre: 10 }) });
      service.processYear(2033);

      // BASE = 2, ORE_PER_PANEL = 1 → deduct 2 ore
      expect(gameState.setDysonState).toHaveBeenCalledOnce();
      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(2);
    });

    it('adds only as many panels as ore allows', () => {
      createService({ panelCount: 0, resources: makeResources({ commonOre: 1 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(1);
    });

    it('adds no panels and deducts no ore when ore is 0', () => {
      createService({ panelCount: 5, resources: makeResources({ commonOre: 0 }) });
      service.processYear(2033);

      expect(gameState.updateMercuryResources).not.toHaveBeenCalled();
      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(5); // unchanged from CME check (see below)
    });

    it('deducts ore equal to panels added × ORE_PER_PANEL', () => {
      createService({ panelCount: 0, resources: makeResources({ commonOre: 10 }) });
      service.processYear(2033);

      // BASE=2, ORE_PER_PANEL=1 → deduct 2
      expect(gameState.updateMercuryResources).toHaveBeenCalledWith({ commonOre: -2 });
    });

    it('includes building bonus panels when buildings are operational', () => {
      createService(
        { panelCount: 0, resources: makeResources({ commonOre: 100 }),
          buildings: [makeBuilding()] },
        [{ type: 'dyson_panels_per_year', amount: 3 }],
      );
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      // BASE(2) + building bonus(3) = 5
      expect(panels).toBe(5);
    });

    it('ignores building bonus from non-operational buildings', () => {
      createService(
        { panelCount: 0, resources: makeResources({ commonOre: 100 }),
          buildings: [makeBuilding({ status: 'building' })] },
        [{ type: 'dyson_panels_per_year', amount: 3 }],
      );
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(2); // only BASE
    });

    it('does not exceed TOTAL_PANELS_FOR_100_PERCENT', () => {
      createService({ panelCount: 999, resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(1000);
    });
  });

  // -------------------------------------------------------------------------
  // processYear — energy output
  // -------------------------------------------------------------------------

  describe('energy calculation', () => {
    it('emits dysonEnergyUpdated$ with correct basic-tier energy', () => {
      createService({ panelCount: 0, resources: makeResources({ commonOre: 100 }) });
      const emitted: number[] = [];
      eventBus.dysonEnergyUpdated$.subscribe((w) => emitted.push(w));

      service.processYear(2033);

      // 2 panels × 1e12 W
      expect(emitted[0]).toBe(2 * 1e12);
    });

    it('uses ENERGY_PER_MID_PANEL for mid tier', () => {
      createService({ panelCount: 10, tier: 'mid', resources: makeResources({ commonOre: 100 }) });
      const emitted: number[] = [];
      eventBus.dysonEnergyUpdated$.subscribe((w) => emitted.push(w));

      service.processYear(2033);

      // 12 panels × 2.5e12 W
      expect(emitted[0]).toBe(12 * 2.5e12);
    });

    it('uses ENERGY_PER_HARDENED_PANEL for hardened tier', () => {
      createService({ panelCount: 10, tier: 'hardened', resources: makeResources({ commonOre: 100 }) });
      const emitted: number[] = [];
      eventBus.dysonEnergyUpdated$.subscribe((w) => emitted.push(w));

      service.processYear(2033);

      expect(emitted[0]).toBe(12 * 5e12);
    });
  });

  // -------------------------------------------------------------------------
  // processYear — CME
  // -------------------------------------------------------------------------

  describe('CME event', () => {
    it('destroys panels when Math.random() is below CME_CHANCE_PER_YEAR (basic tier)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001); // below 0.005

      createService({ panelCount: 100, resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      // 100 panels, CME destroys 2% = 2 → then +2 from BASE
      // net: 100 - 2 + 2 = 100
      expect(panels).toBe(100);
    });

    it('does not fire CME when Math.random() is above threshold', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      createService({ panelCount: 100, resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(102);
    });

    it('does NOT fire CME for mid tier even if random is low', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001);

      createService({ panelCount: 100, tier: 'mid', resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(102); // no CME damage
    });

    it('does NOT fire CME for hardened tier', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001);

      createService({ panelCount: 100, tier: 'hardened', resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      const [panels] = (gameState.setDysonState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(panels).toBe(102);
    });
  });

  // -------------------------------------------------------------------------
  // processYear — milestones
  // -------------------------------------------------------------------------

  describe('milestone detection', () => {
    it('emits milestoneReached$ when coverage crosses 10% for the first time', () => {
      // Start at 99 panels (9.9%) — adding 2 brings to 101 panels (10.1%)
      createService({ panelCount: 99, resources: makeResources({ commonOre: 100 }) });
      const fired: string[] = [];
      eventBus.milestoneReached$.subscribe((id) => fired.push(id));

      service.processYear(2033);

      expect(fired).toContain('dyson_10_percent');
    });

    it('does not re-emit a milestone already in completedMilestones', () => {
      createService({
        panelCount: 99,
        resources: makeResources({ commonOre: 100 }),
        completedMilestones: ['dyson_10_percent'],
      });
      const fired: string[] = [];
      eventBus.milestoneReached$.subscribe((id) => fired.push(id));

      service.processYear(2033);

      expect(fired).not.toContain('dyson_10_percent');
    });

    it('calls completeMilestone on GameStateService when a new threshold is crossed', () => {
      createService({ panelCount: 99, resources: makeResources({ commonOre: 100 }) });
      service.processYear(2033);

      expect(gameState.completeMilestone).toHaveBeenCalledWith('dyson_10_percent');
    });

    it('emits multiple milestones in a single year if coverage jumps far enough', () => {
      // 245 panels → +2 → 247 panels = 24.7%, below 25
      // Use 248 panels → 250 = 25%
      createService({ panelCount: 248, resources: makeResources({ commonOre: 100 }),
        completedMilestones: ['dyson_10_percent'] });
      const fired: string[] = [];
      eventBus.milestoneReached$.subscribe((id) => fired.push(id));

      service.processYear(2033);

      expect(fired).toContain('dyson_25_percent');
    });
  });

  // -------------------------------------------------------------------------
  // upgradeTier
  // -------------------------------------------------------------------------

  describe('upgradeTier()', () => {
    it('upgrades basic → mid when resources are sufficient', () => {
      createService({
        panelCount: 10,
        tier: 'basic',
        resources: makeResources({ rareMetals: 100 }),
      });
      service.upgradeTier('mid');

      expect(gameState.setDysonPanelTier).toHaveBeenCalledWith('mid');
    });

    it('deducts rareMetals cost on successful mid upgrade', () => {
      createService({
        panelCount: 10,
        tier: 'basic',
        resources: makeResources({ rareMetals: 100 }),
      });
      service.upgradeTier('mid');

      expect(gameState.updateMercuryResources).toHaveBeenCalledWith(
        expect.objectContaining({ rareMetals: -50 }),
      );
    });

    it('does not upgrade if rareMetals insufficient', () => {
      createService({
        panelCount: 10,
        tier: 'basic',
        resources: makeResources({ rareMetals: 10 }), // need 50
      });
      service.upgradeTier('mid');

      expect(gameState.setDysonPanelTier).not.toHaveBeenCalled();
      expect(gameState.updateMercuryResources).not.toHaveBeenCalled();
    });

    it('does not upgrade basic → hardened (wrong order)', () => {
      createService({
        panelCount: 10,
        tier: 'basic',
        resources: makeResources({ rareMetals: 200, polarVolatiles: 50 }),
      });
      service.upgradeTier('hardened');

      expect(gameState.setDysonPanelTier).not.toHaveBeenCalled();
    });

    it('does not upgrade if already at target tier', () => {
      createService({
        panelCount: 10,
        tier: 'mid',
        resources: makeResources({ rareMetals: 200 }),
      });
      service.upgradeTier('mid'); // already mid

      expect(gameState.setDysonPanelTier).not.toHaveBeenCalled();
    });

    it('recalculates energy after successful upgrade and emits dysonEnergyUpdated$', () => {
      createService({
        panelCount: 10,
        tier: 'basic',
        resources: makeResources({ rareMetals: 100 }),
      });
      const emitted: number[] = [];
      eventBus.dysonEnergyUpdated$.subscribe((w) => emitted.push(w));

      service.upgradeTier('mid');

      // After upgrade: 10 panels at mid-tier rate
      expect(emitted).toContain(10 * 2.5e12);
    });

    it('upgrades mid → hardened when resources sufficient', () => {
      createService({
        panelCount: 10,
        tier: 'mid',
        resources: makeResources({ rareMetals: 200, polarVolatiles: 30 }),
      });
      service.upgradeTier('hardened');

      expect(gameState.setDysonPanelTier).toHaveBeenCalledWith('hardened');
      expect(gameState.updateMercuryResources).toHaveBeenCalledWith(
        expect.objectContaining({ rareMetals: -150, polarVolatiles: -20 }),
      );
    });
  });
});
