import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { BioPhaseService } from './bio-phase.service';
import type { BioPhaseDef } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { BioPhaseEvent, BioPhaseState, PlanetBioState } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePhaseDef(overrides: Partial<BioPhaseDef> = {}): BioPhaseDef {
  return {
    id: 'mars-bio-1',
    displayName: 'Pioneer Microbes',
    nominalDurationYears: 20,
    actions: ['seed_cyanobacteria', 'add_perchlorate_reducers'],
    requiresComponents: [],
    completeCeId: 'ce_mars_bio_1_complete',
    ...overrides,
  };
}

function makePhaseState(overrides: Partial<BioPhaseState> = {}): BioPhaseState {
  return {
    status: 'locked',
    actionsTaken: [],
    progressYears: 0,
    durationYears: 20,
    startedYear: 0,
    completedYear: 0,
    ...overrides,
  };
}

function makePlanetBioState(phases: BioPhaseState[], overrides: Partial<PlanetBioState> = {}): PlanetBioState {
  return {
    currentPhaseIndex: 0,
    phases,
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
  bioPhases?: Record<string, PlanetBioState>;
  gameYear?: number;
  completedTechs?: string[];
} = {}) {
  const bioPhasesSignal = signal<Record<string, PlanetBioState>>(opts.bioPhases ?? {});
  const gameYearSig = signal<number>(opts.gameYear ?? 2033);
  const completedTechs = signal<string[]>(opts.completedTechs ?? []);

  return {
    bioPhases: bioPhasesSignal.asReadonly(),
    gameYear: gameYearSig.asReadonly(),
    completedTechs: completedTechs.asReadonly(),

    // Write helpers
    _setBioPhases: (v: Record<string, PlanetBioState>) => bioPhasesSignal.set(v),
    _advanceYear: () => gameYearSig.update((y) => y + 1),

    // Mutation spies — simulate real side-effects where needed for chained assertions.
    setBioPhases: vi.fn((phases: Record<string, PlanetBioState>) => {
      bioPhasesSignal.set(phases);
    }),
    updateBioPhase: vi.fn((planetId: string, phaseIndex: number, update: Partial<BioPhaseState>) => {
      bioPhasesSignal.update((all) => {
        const planet = all[planetId];
        if (!planet) return all;
        const phases = [...planet.phases];
        phases[phaseIndex] = { ...phases[phaseIndex], ...update } as BioPhaseState;
        return { ...all, [planetId]: { ...planet, phases } };
      });
    }),
    addBioRequest: vi.fn((planetId: string, requestId: string) => {
      bioPhasesSignal.update((all) => {
        const planet = all[planetId];
        if (!planet || planet.requestsSent.includes(requestId)) return all;
        return { ...all, [planetId]: { ...planet, requestsSent: [...planet.requestsSent, requestId] } };
      });
    }),
    unlockTech: vi.fn((techId: string) => {
      completedTechs.update((t) => (t.includes(techId) ? t : [...t, techId]));
    }),
  };
}

function makeDataFake(defs: Record<string, BioPhaseDef[]> = {}) {
  return {
    getBioPhases: vi.fn((planetId: string) => defs[planetId] ?? []),
  };
}

function makeEventBusFake() {
  return {
    bioPhaseAvailable$: new Subject<BioPhaseEvent>(),
    bioPhaseStarted$: new Subject<BioPhaseEvent>(),
    bioPhaseCompleted$: new Subject<BioPhaseEvent>(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('BioPhaseService', () => {
  let service: BioPhaseService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;

  function setup(
    defs: Record<string, BioPhaseDef[]> = {},
    gameStateOpts: Parameters<typeof makeGameStateFake>[0] = {},
  ) {
    gameState = makeGameStateFake(gameStateOpts);
    data = makeDataFake(defs);
    eventBus = makeEventBusFake();

    TestBed.configureTestingModule({
      providers: [
        BioPhaseService,
        { provide: DataService, useValue: data },
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService, useValue: eventBus },
      ],
    });

    service = TestBed.inject(BioPhaseService);
  }

  // -------------------------------------------------------------------------
  // initNewGame
  // -------------------------------------------------------------------------

  describe('initNewGame()', () => {
    it('seeds phase 0 as available and phases 1-3 as locked', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({ id: 'mars-bio-2', nominalDurationYears: 25 });
      const def3 = makePhaseDef({ id: 'mars-bio-3', nominalDurationYears: 30 });
      const def4 = makePhaseDef({ id: 'mars-bio-4', nominalDurationYears: 35 });

      setup({ mars: [def1, def2, def3, def4] });
      service.initNewGame();

      const call = (gameState.setBioPhases as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, PlanetBioState>;
      expect(call['mars'].phases[0].status).toBe('available');
      expect(call['mars'].phases[1].status).toBe('locked');
      expect(call['mars'].phases[2].status).toBe('locked');
      expect(call['mars'].phases[3].status).toBe('locked');
    });

    it('seeds durationYears from nominalDurationYears', () => {
      const def = makePhaseDef({ nominalDurationYears: 42 });
      setup({ mars: [def] });
      service.initNewGame();

      const call = (gameState.setBioPhases as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, PlanetBioState>;
      expect(call['mars'].phases[0].durationYears).toBe(42);
    });

    it('seeds all component counters at zero / false', () => {
      setup({ mars: [makePhaseDef()] });
      service.initNewGame();

      const call = (gameState.setBioPhases as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, PlanetBioState>;
      const s = call['mars'];
      expect(s.odnBuilt).toBe(false);
      expect(s.bioreactorBatchesActive).toBe(0);
      expect(s.precipitationEnginesBuilt).toBe(0);
      expect(s.atmosphericCatalystShipsBuilt).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // _processYear — no-op guard
  // -------------------------------------------------------------------------

  describe('_processYear (via effect)', () => {
    it('does not call updateBioPhase when bioPhases is empty', () => {
      setup({}, { bioPhases: {} });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.updateBioPhase).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // _checkAvailability
  // -------------------------------------------------------------------------

  describe('_checkAvailability (via effect)', () => {
    it('does not change phase 0 when already available', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const phase0 = makePhaseState({ status: 'available' });
      const bioPhases = { mars: makePlanetBioState([phase0]) };

      setup({ mars: [def1] }, { bioPhases });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      // updateBioPhase should NOT be called with an availability change for index 0.
      const availCalls = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).status === 'available'
      );
      expect(availCalls.length).toBe(0);
    });

    it('unlocks phase 1 when phase 0 is complete', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({ id: 'mars-bio-2', nominalDurationYears: 25 });

      const phase0 = makePhaseState({ status: 'complete', durationYears: 20 });
      const phase1 = makePhaseState({ status: 'locked', durationYears: 25 });
      const bioPhases = { mars: makePlanetBioState([phase0, phase1]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def1, def2] }, { bioPhases });
      eventBus.bioPhaseAvailable$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.updateBioPhase).toHaveBeenCalledWith('mars', 1, { status: 'available' });
      expect(emitted).toEqual([{ planetId: 'mars', phaseId: 'mars-bio-2' }]);
    });

    it('unlocks phase 1 when phase 0 reaches canStartAtPreviousPercent threshold', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({ id: 'mars-bio-2', canStartAtPreviousPercent: 0.5 });

      // Phase 0: 10/20 years = 50 % — exactly at threshold.
      const phase0 = makePhaseState({ status: 'running', durationYears: 20, progressYears: 10 });
      const phase1 = makePhaseState({ status: 'locked', durationYears: 25 });
      const bioPhases = { mars: makePlanetBioState([phase0, phase1]) };

      setup({ mars: [def1, def2] }, { bioPhases });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.updateBioPhase).toHaveBeenCalledWith('mars', 1, { status: 'available' });
    });

    it('keeps phase 1 locked when phase 0 is below canStartAtPreviousPercent threshold', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({ id: 'mars-bio-2', canStartAtPreviousPercent: 0.5 });

      // Phase 0: 9/20 years = 45 % — below threshold.
      const phase0 = makePhaseState({ status: 'running', durationYears: 20, progressYears: 9 });
      const phase1 = makePhaseState({ status: 'locked' });
      const bioPhases = { mars: makePlanetBioState([phase0, phase1]) };

      setup({ mars: [def1, def2] }, { bioPhases });

      // Only flush the initial effect — this is the tick where progress is still 9/20 = 45%.
      // A second tick would advance progress to 10/20 = 50%, which would meet the threshold.
      TestBed.flushEffects();

      const availCalls = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).status === 'available'
      );
      expect(availCalls.length).toBe(0);
    });

    it('keeps phase locked when required component is not built', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({
        id: 'mars-bio-2',
        requiresComponents: ['bioreactor'],
        canStartAtPreviousPercent: undefined,
      });

      const phase0 = makePhaseState({ status: 'complete', durationYears: 20 });
      const phase1 = makePhaseState({ status: 'locked' });
      // bioreactorBatchesActive = 0 → component not built
      const bioPhases = { mars: makePlanetBioState([phase0, phase1], { bioreactorBatchesActive: 0 }) };

      setup({ mars: [def1, def2] }, { bioPhases });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      const availCalls = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).status === 'available'
      );
      expect(availCalls.length).toBe(0);
    });

    it('keeps phase locked when required request has not been sent', () => {
      const def1 = makePhaseDef({ id: 'mars-bio-1' });
      const def2 = makePhaseDef({
        id: 'mars-bio-2',
        requiresRequest: 'req_seed_delivery',
        canStartAtPreviousPercent: undefined,
      });

      const phase0 = makePhaseState({ status: 'complete', durationYears: 20 });
      const phase1 = makePhaseState({ status: 'locked' });
      // requestsSent does not include 'req_seed_delivery'
      const bioPhases = { mars: makePlanetBioState([phase0, phase1], { requestsSent: [] }) };

      setup({ mars: [def1, def2] }, { bioPhases });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      const availCalls = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).status === 'available'
      );
      expect(availCalls.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // applyAction
  // -------------------------------------------------------------------------

  describe('applyAction()', () => {
    it('transitions available phase to running on first action and emits bioPhaseStarted$', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria'] });
      const phase = makePhaseState({ status: 'available' });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases, gameYear: 2033 });
      eventBus.bioPhaseStarted$.subscribe((e) => emitted.push(e));

      service.applyAction('mars', 0, 'seed_cyanobacteria');

      expect(gameState.updateBioPhase).toHaveBeenCalledWith('mars', 0, {
        actionsTaken: ['seed_cyanobacteria'],
        status: 'running',
        startedYear: 2033,
      });
      expect(emitted).toEqual([{ planetId: 'mars', phaseId: 'mars-bio-1' }]);
    });

    it('appends action on running phase without changing status or emitting', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria', 'add_perchlorate_reducers'] });
      const phase = makePhaseState({ status: 'running', actionsTaken: ['seed_cyanobacteria'] });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases });
      eventBus.bioPhaseStarted$.subscribe((e) => emitted.push(e));

      service.applyAction('mars', 0, 'add_perchlorate_reducers');

      expect(gameState.updateBioPhase).toHaveBeenCalledWith('mars', 0, {
        actionsTaken: ['seed_cyanobacteria', 'add_perchlorate_reducers'],
      });
      expect(emitted.length).toBe(0);
    });

    it('rejects an unknown actionId without mutation', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria'] });
      const phase = makePhaseState({ status: 'available' });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      setup({ mars: [def] }, { bioPhases });
      service.applyAction('mars', 0, 'unknown_action');

      expect(gameState.updateBioPhase).not.toHaveBeenCalled();
    });

    it('rejects a duplicate actionId without mutation', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria'] });
      const phase = makePhaseState({ status: 'running', actionsTaken: ['seed_cyanobacteria'] });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      setup({ mars: [def] }, { bioPhases });
      service.applyAction('mars', 0, 'seed_cyanobacteria');

      expect(gameState.updateBioPhase).not.toHaveBeenCalled();
    });

    it('does not mutate a locked phase', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria'] });
      const phase = makePhaseState({ status: 'locked' });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      setup({ mars: [def] }, { bioPhases });
      service.applyAction('mars', 0, 'seed_cyanobacteria');

      expect(gameState.updateBioPhase).not.toHaveBeenCalled();
    });

    it('does not mutate a complete phase', () => {
      const def = makePhaseDef({ id: 'mars-bio-1', actions: ['seed_cyanobacteria'] });
      const phase = makePhaseState({ status: 'complete' });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      setup({ mars: [def] }, { bioPhases });
      service.applyAction('mars', 0, 'seed_cyanobacteria');

      expect(gameState.updateBioPhase).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // sendRequest
  // -------------------------------------------------------------------------

  describe('sendRequest()', () => {
    it('delegates to gameState.addBioRequest with correct args', () => {
      setup({});
      service.sendRequest('mars', 'req_seed_delivery');
      expect(gameState.addBioRequest).toHaveBeenCalledWith('mars', 'req_seed_delivery');
    });
  });

  // -------------------------------------------------------------------------
  // _tickRunningPhases
  // -------------------------------------------------------------------------

  describe('_tickRunningPhases (via effect)', () => {
    it('increments progressYears by 1 per tick', () => {
      const def = makePhaseDef();
      const phase = makePhaseState({ status: 'running', durationYears: 20, actionsTaken: ['seed_cyanobacteria'] });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      setup({ mars: [def] }, { bioPhases });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      const progressCall = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).progressYears !== undefined
      );
      expect((progressCall?.[2] as Partial<BioPhaseState>).progressYears).toBe(1);
    });

    it('applies no speedup with 1 action (effectiveDuration = durationYears)', () => {
      // 1 action → speedup = 0 → effective = 20. Set progressYears to 19 so tick completes it.
      const def = makePhaseDef({ completeCeId: 'ce_mars_bio_1_complete' });
      const phase = makePhaseState({
        status: 'running',
        durationYears: 20,
        progressYears: 19,
        actionsTaken: ['seed_cyanobacteria'],
      });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases });
      eventBus.bioPhaseCompleted$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(emitted.length).toBe(1);
    });

    it('applies 16% speedup with 3 actions (effectiveDuration = durationYears × 0.84)', () => {
      // 3 actions → speedup = (3-1)*0.08 = 0.16 → effective = 20 * 0.84 = 16.8
      // Set progressYears to 16 so tick (→17) crosses 16.8.
      const def = makePhaseDef();
      const phase = makePhaseState({
        status: 'running',
        durationYears: 20,
        progressYears: 16,
        actionsTaken: ['a1', 'a2', 'a3'],
      });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases });
      eventBus.bioPhaseCompleted$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(emitted.length).toBe(1);
    });

    it('caps speedup at 40% regardless of action count', () => {
      // 8 actions → (8-1)*0.08 = 0.56 → capped to 0.40 → effective = 20 * 0.60 = 12
      // Set progressYears to 11 so tick (→12) crosses 12.
      const def = makePhaseDef();
      const phase = makePhaseState({
        status: 'running',
        durationYears: 20,
        progressYears: 11,
        actionsTaken: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'],
      });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases });
      eventBus.bioPhaseCompleted$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(emitted.length).toBe(1);
    });

    it('does not complete a phase before effectiveDuration is reached', () => {
      const def = makePhaseDef();
      const phase = makePhaseState({
        status: 'running',
        durationYears: 20,
        progressYears: 0,
        actionsTaken: ['seed_cyanobacteria'],
      });
      const bioPhases = { mars: makePlanetBioState([phase]) };

      const emitted: BioPhaseEvent[] = [];
      setup({ mars: [def] }, { bioPhases });
      eventBus.bioPhaseCompleted$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(emitted.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // _completePhase
  // -------------------------------------------------------------------------

  describe('_completePhase (via tick completion)', () => {
    function setupCompletionScenario(defOverrides: Partial<BioPhaseDef> = {}) {
      const def = makePhaseDef({ ...defOverrides });
      // progressYears = durationYears - 1 so that one tick completes it (no speedup with 1 action).
      const phase = makePhaseState({
        status: 'running',
        durationYears: 20,
        progressYears: 19,
        actionsTaken: ['seed_cyanobacteria'],
      });
      const bioPhases = { mars: makePlanetBioState([phase]) };
      setup({ mars: [def] }, { bioPhases, gameYear: 2080 });
    }

    it('updates status to complete and sets completedYear', () => {
      setupCompletionScenario();
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      const completeCalls = (gameState.updateBioPhase as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => (args[2] as Partial<BioPhaseState>).status === 'complete'
      );
      expect(completeCalls.length).toBe(1);
      // The phase completes during the first tick (initial gameYear = 2080).
      expect((completeCalls[0][2] as Partial<BioPhaseState>).completedYear).toBe(2080);
    });

    it('calls unlockTech when spilloverTech is defined', () => {
      setupCompletionScenario({ spilloverTech: 'mars_early_biosphere' });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.unlockTech).toHaveBeenCalledWith('mars_early_biosphere');
    });

    it('does not call unlockTech when spilloverTech is undefined', () => {
      setupCompletionScenario({ spilloverTech: undefined });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.unlockTech).not.toHaveBeenCalled();
    });

    it('emits bioPhaseCompleted$ with correct payload', () => {
      const emitted: BioPhaseEvent[] = [];
      setupCompletionScenario({ id: 'mars-bio-1' });
      eventBus.bioPhaseCompleted$.subscribe((e) => emitted.push(e));

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(emitted).toEqual([{ planetId: 'mars', phaseId: 'mars-bio-1' }]);
    });
  });
});
