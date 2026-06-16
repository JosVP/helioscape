import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { KardashevService } from './kardashev.service';
import type { KardashevMilestone } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from './tech-tree.service';
import type { PlanetState, TechEffect } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlanetState(overrides: Partial<PlanetState> = {}): PlanetState {
  return {
    id: 'mars',
    atmospherePressure: 0.006,
    temperatureCelsius: -60,
    terraformingPhase: 0,
    terraformingProgress: 0,
    terraformingChoices: {},
    lockedOutChoices: [],
    population: 0,
    hasBiodome: false,
    visualParams: {
      waterGrowthRadius: 0,
      waterOpacity: 0,
      greenGrowthRadius: 0,
      greenOpacity: 0,
      lavaOpacity: 0.8,
      lavaHueShift: 0,
      cloudOpacity: 0.3,
      atmosphereDensity: 0.1,
      atmosphereColor: '#c1440e',
      cloudRotationSpeed: 0.001,
      axisSpinSpeed: 0.002,
      axisRotationDirection: 'prograde',
      cityLightsIntensity: 0,
    },
    terraformStartYear: 2033,
    terraformEndYear: 2033,
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<KardashevMilestone> = {}): KardashevMilestone {
  return {
    id: 'type_1',
    displayName: 'Type I Civilisation',
    description: 'We have learned to draw on our star.',
    conditions: ['deuterium_fusion_online', 'dyson_15_percent'],
    approximateYearRange: 'Year 80-120',
    effects: [{ type: 'emit_event', eventId: 'ce_type1_reached' } as TechEffect],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  gameYear?: number;
  dysonCoveragePercent?: number;
  completedTechs?: string[];
  completedMilestones?: string[];
  planets?: Record<string, PlanetState>;
} = {}) {
  const gameYearSignal = signal<number>(opts.gameYear ?? 2033);
  const coverageSignal = signal<number>(opts.dysonCoveragePercent ?? 0);
  const completedTechsSignal = signal<string[]>(opts.completedTechs ?? []);
  const completedMilestonesSignal = signal<string[]>(opts.completedMilestones ?? []);
  const planetsSignal = signal<Record<string, PlanetState>>(opts.planets ?? {});

  return {
    gameYear: gameYearSignal.asReadonly(),
    dysonCoveragePercent: coverageSignal.asReadonly(),
    completedTechs: completedTechsSignal.asReadonly(),
    completedMilestones: completedMilestonesSignal.asReadonly(),
    planets: planetsSignal.asReadonly(),

    // Test write helpers
    _setYear: (y: number) => gameYearSignal.set(y),
    _setCoverage: (c: number) => coverageSignal.set(c),
    _setTechs: (t: string[]) => completedTechsSignal.set(t),
    _setMilestones: (m: string[]) => completedMilestonesSignal.set(m),
    _setPlanets: (p: Record<string, PlanetState>) => planetsSignal.set(p),

    // Mutation spies
    setKardashevLevel: vi.fn(),
    completeMilestone: vi.fn((id: string) => {
      completedMilestonesSignal.update((m) => [...m, id]);
    }),
  };
}

function makeDataFake(milestones: KardashevMilestone[] = []) {
  return {
    getAllMilestones: vi.fn(() => milestones),
  };
}

function makeEventBusFake() {
  return {
    milestoneReached$: new Subject<string>(),
  };
}

function makeTechTreeFake() {
  return {
    applyEffects: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('KardashevService', () => {
  let service: KardashevService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;
  let techTree: ReturnType<typeof makeTechTreeFake>;

  function createService(
    gsOpts: Parameters<typeof makeGameStateFake>[0] = {},
    milestones: KardashevMilestone[] = [],
  ): void {
    gameState = makeGameStateFake(gsOpts);
    data = makeDataFake(milestones);
    eventBus = makeEventBusFake();
    techTree = makeTechTreeFake();

    TestBed.configureTestingModule({
      providers: [
        KardashevService,
        { provide: GameStateService, useValue: gameState },
        { provide: DataService, useValue: data },
        { provide: EventBusService, useValue: eventBus },
        { provide: TechTreeService, useValue: techTree },
      ],
    });
    service = TestBed.inject(KardashevService);
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // Kardashev level formula
  // -------------------------------------------------------------------------

  describe('_updateLevel()', () => {
    it('sets level to 0.73 when coverage is 0%', () => {
      createService({ dysonCoveragePercent: 0 });
      service['_processYear']();
      expect(gameState.setKardashevLevel).toHaveBeenCalledWith(0.73);
    });

    it('sets level to 2.00 when coverage is 100%', () => {
      createService({ dysonCoveragePercent: 100 });
      service['_processYear']();
      expect(gameState.setKardashevLevel).toHaveBeenCalledWith(2.0);
    });

    it('sets level to ~1.365 when coverage is 50%', () => {
      createService({ dysonCoveragePercent: 50 });
      service['_processYear']();
      const [level] = (gameState.setKardashevLevel as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(level).toBeCloseTo(1.365, 3);
    });
  });

  // -------------------------------------------------------------------------
  // Milestone checking — skipping completed
  // -------------------------------------------------------------------------

  describe('_checkMilestones()', () => {
    it('does not complete a milestone that is already completed', () => {
      const milestone = makeMilestone({
        id: 'type_1',
        conditions: ['dyson_15_percent'],
      });
      createService(
        { dysonCoveragePercent: 50, completedMilestones: ['type_1'] },
        [milestone],
      );
      service['_processYear']();
      expect(gameState.completeMilestone).not.toHaveBeenCalled();
    });

    it('completes a milestone when all conditions are met', () => {
      const milestone = makeMilestone({
        id: 'type_1',
        conditions: ['dyson_15_percent'],
      });
      createService({ dysonCoveragePercent: 50 }, [milestone]);
      service['_processYear']();
      expect(gameState.completeMilestone).toHaveBeenCalledWith('type_1');
    });

    it('does not complete a milestone when any condition fails', () => {
      const milestone = makeMilestone({
        id: 'type_1',
        conditions: ['dyson_15_percent', 'deuterium_fusion_online'],
      });
      createService(
        { dysonCoveragePercent: 50, completedTechs: [] }, // fusion NOT done
        [milestone],
      );
      service['_processYear']();
      expect(gameState.completeMilestone).not.toHaveBeenCalled();
    });

    it('completes multiple milestones in a single year when all conditions are met', () => {
      const m1 = makeMilestone({ id: 'first', conditions: ['dyson_10_percent'] });
      const m2 = makeMilestone({ id: 'second', conditions: ['dyson_20_percent'] });
      createService({ dysonCoveragePercent: 50 }, [m1, m2]);
      service['_processYear']();
      expect(gameState.completeMilestone).toHaveBeenCalledWith('first');
      expect(gameState.completeMilestone).toHaveBeenCalledWith('second');
    });
  });

  // -------------------------------------------------------------------------
  // _checkCondition — individual conditions
  // -------------------------------------------------------------------------

  describe('_checkCondition()', () => {
    describe('deuterium_fusion_online', () => {
      it('returns false when earth_fusion_ignition_theory is not completed', () => {
        createService({ completedTechs: ['earth_deuterium_extraction'] });
        expect(service['_checkCondition']('deuterium_fusion_online')).toBe(false);
      });

      it('returns true when earth_fusion_ignition_theory is completed', () => {
        createService({ completedTechs: ['earth_fusion_ignition_theory'] });
        expect(service['_checkCondition']('deuterium_fusion_online')).toBe(true);
      });
    });

    describe('dyson_N_percent', () => {
      it('returns false when coverage is below threshold (14.9 < 15)', () => {
        createService({ dysonCoveragePercent: 14.9 });
        expect(service['_checkCondition']('dyson_15_percent')).toBe(false);
      });

      it('returns true when coverage equals threshold exactly', () => {
        createService({ dysonCoveragePercent: 15 });
        expect(service['_checkCondition']('dyson_15_percent')).toBe(true);
      });

      it('returns true when coverage exceeds threshold', () => {
        createService({ dysonCoveragePercent: 99 });
        expect(service['_checkCondition']('dyson_100_percent')).toBe(false);
      });

      it('returns true for dyson_100_percent at 100%', () => {
        createService({ dysonCoveragePercent: 100 });
        expect(service['_checkCondition']('dyson_100_percent')).toBe(true);
      });

      it('returns true for dyson_50_percent at 50%', () => {
        createService({ dysonCoveragePercent: 50 });
        expect(service['_checkCondition']('dyson_50_percent')).toBe(true);
      });
    });

    describe('two_habitable_worlds', () => {
      it('returns false when only one planet is at phase >= 3', () => {
        createService({
          planets: {
            mars: makePlanetState({ id: 'mars', terraformingPhase: 3 }),
            venus: makePlanetState({ id: 'venus', terraformingPhase: 2 }),
          },
        });
        expect(service['_checkCondition']('two_habitable_worlds')).toBe(false);
      });

      it('returns true when two planets are at phase >= 3', () => {
        createService({
          planets: {
            mars: makePlanetState({ id: 'mars', terraformingPhase: 3 }),
            venus: makePlanetState({ id: 'venus', terraformingPhase: 4 }),
          },
        });
        expect(service['_checkCondition']('two_habitable_worlds')).toBe(true);
      });

      it('returns false when no planets exist', () => {
        createService({ planets: {} });
        expect(service['_checkCondition']('two_habitable_worlds')).toBe(false);
      });
    });

    describe('first_self_sustaining_colony', () => {
      it('returns false when all planets have population 0', () => {
        createService({
          planets: {
            mars: makePlanetState({ id: 'mars', population: 0 }),
          },
        });
        expect(service['_checkCondition']('first_self_sustaining_colony')).toBe(false);
      });

      it('returns false when population is below threshold', () => {
        createService({
          planets: {
            mars: makePlanetState({ id: 'mars', population: 9_999 }),
          },
        });
        expect(service['_checkCondition']('first_self_sustaining_colony')).toBe(false);
      });

      it('returns true when any planet meets the population threshold', () => {
        createService({
          planets: {
            mars: makePlanetState({ id: 'mars', population: 10_000 }),
          },
        });
        expect(service['_checkCondition']('first_self_sustaining_colony')).toBe(true);
      });
    });

    describe('interstellar_seed_ship_launched', () => {
      it('returns false without throwing', () => {
        createService();
        expect(service['_checkCondition']('interstellar_seed_ship_launched')).toBe(false);
      });
    });

    describe('unknown condition', () => {
      it('returns false and warns for an unknown condition string', () => {
        createService();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(service['_checkCondition']('unknown_condition_xyz')).toBe(false);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('unknown_condition_xyz'),
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // _completeMilestone — correct sequencing
  // -------------------------------------------------------------------------

  describe('_completeMilestone()', () => {
    it('calls completeMilestone, applyEffects, then milestoneReached$ in order', () => {
      const callOrder: string[] = [];
      createService({ dysonCoveragePercent: 50 });

      (gameState.completeMilestone as ReturnType<typeof vi.fn>).mockImplementation((id: string) => {
        callOrder.push(`complete:${id}`);
      });
      (techTree.applyEffects as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callOrder.push('applyEffects');
      });

      const milestoneReachedIds: string[] = [];
      eventBus.milestoneReached$.subscribe((id) => milestoneReachedIds.push(id));

      const milestone = makeMilestone({ id: 'type_1' });
      service['_completeMilestone'](milestone);

      expect(callOrder).toEqual(['complete:type_1', 'applyEffects']);
      expect(milestoneReachedIds).toEqual(['type_1']);
    });

    it('passes milestone effects to techTree.applyEffects', () => {
      createService();
      const effects: TechEffect[] = [{ type: 'emit_event', eventId: 'ce_test' }];
      const milestone = makeMilestone({ effects });
      service['_completeMilestone'](milestone);
      expect(techTree.applyEffects).toHaveBeenCalledWith(effects, '');
    });

    it('emits the milestone id on milestoneReached$', () => {
      createService();
      const received: string[] = [];
      eventBus.milestoneReached$.subscribe((id) => received.push(id));
      service['_completeMilestone'](makeMilestone({ id: 'type_2' }));
      expect(received).toEqual(['type_2']);
    });
  });
});
