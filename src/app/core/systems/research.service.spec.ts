import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { ResearchService } from './research.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { TechTreeService } from './tech-tree.service';
import type { ResearchTrack, ActiveResearchTrack, ResearchTrackStartedEvent, TechEffect, TechNode } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrackDef(overrides: Partial<ResearchTrack> = {}): ResearchTrack {
  return {
    id: 'test_track',
    displayName: 'Test Track',
    planet: 'mars',
    rpCost: 20,
    durationYears: 5,
    description: 'A test track.',
    prerequisiteTech: 'prereq_tech',
    onCompleteEffects: [],
    ...overrides,
  };
}

function makeActiveTrack(overrides: Partial<ActiveResearchTrack> = {}): ActiveResearchTrack {
  return {
    trackId: 'test_track',
    planetId: 'mars',
    isPaused: false,
    startYear: 2033,
    elapsedBeforeStart: 0,
    ...overrides,
  };
}

function makeTechNode(overrides: Partial<TechNode> = {}): TechNode {
  return {
    id: 'test_node',
    planet: 'earth',
    displayName: 'Test Node',
    description: 'A test tech node.',
    outcomeSummary: ['A test outcome.'],
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 20,
    durationYears: 5,
    effects: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  completedTechs?: string[];
  activeResearch?: ActiveResearchTrack[];
  usedRpCapacity?: number;
  totalRpCapacity?: number;
  gameYear?: number;
} = {}) {
  const completedTechs  = signal<string[]>(opts.completedTechs ?? []);
  const activeResearch  = signal<ActiveResearchTrack[]>(opts.activeResearch ?? []);
  const gameYearSig     = signal<number>(opts.gameYear ?? 2033);
  const usedRpCapSig    = signal<number>(opts.usedRpCapacity ?? 0);
  const totalRpCapSig   = signal<number>(opts.totalRpCapacity ?? 60);

  return {
    completedTechs:  completedTechs.asReadonly(),
    activeResearch:  activeResearch.asReadonly(),
    gameYear:        gameYearSig.asReadonly(),
    usedRpCapacity:  usedRpCapSig.asReadonly(),
    totalRpCapacity: totalRpCapSig.asReadonly(),

    _setCompletedTechs:  (v: string[]) => completedTechs.set(v),
    _setActiveResearch:  (v: ActiveResearchTrack[]) => activeResearch.set(v),
    _setUsedRpCapacity:  (v: number) => usedRpCapSig.set(v),
    _setTotalRpCapacity: (v: number) => totalRpCapSig.set(v),
    _advanceYear:        () => gameYearSig.update((y) => y + 1),

    completeResearch: vi.fn((trackId: string, _completedYear?: number) => {
      activeResearch.update((tracks) => tracks.filter((t) => t.trackId !== trackId));
      completedTechs.update((techs) => (techs.includes(trackId) ? techs : [...techs, trackId]));
    }),
    startResearch: vi.fn((trackId: string, planetId: string, startYear: number) => {
      activeResearch.update((tracks) => [
        ...tracks,
        { trackId, planetId, isPaused: false, startYear, elapsedBeforeStart: 0 },
      ]);
    }),
    pauseResearch: vi.fn((trackId: string) => {
      const year = gameYearSig();
      activeResearch.update((tracks) =>
        tracks.map((t) =>
          t.trackId === trackId
            ? { ...t, isPaused: true, elapsedBeforeStart: t.elapsedBeforeStart + (year - t.startYear), startYear: year }
            : t
        )
      );
    }),
    resumeResearch: vi.fn((trackId: string) => {
      const year = gameYearSig();
      activeResearch.update((tracks) =>
        tracks.map((t) => (t.trackId === trackId ? { ...t, isPaused: false, startYear: year } : t))
      );
    }),
  };
}

function makeDataFake(tracks: ResearchTrack[] = [], techNodes: TechNode[] = []) {
  return {
    getResearchTrack: vi.fn((id: string) => tracks.find((t) => t.id === id) ?? null),
    getTechNode:      vi.fn((id: string) => techNodes.find((node) => node.id === id) ?? null),
  };
}

function makeEventBusFake() {
  return {
    researchCompleted$: new Subject<string>(),
    researchTrackStarted$: new Subject<ResearchTrackStartedEvent>(),
  };
}

function makeTechTreeFake() {
  return {
    applyEffects:          vi.fn((_effects: TechEffect[], _planetId: string) => undefined),
    completeNodeResearch:  vi.fn((_planetId: string, _nodeId: string) => undefined),
    canUnlock:             vi.fn((_planetId: string, _nodeId: string) => false),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ResearchService', () => {
  let service: ResearchService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;
  let techTree: ReturnType<typeof makeTechTreeFake>;

  function setup(
    tracks: ResearchTrack[] = [],
    gameStateOpts: Parameters<typeof makeGameStateFake>[0] = {},
    techNodes: TechNode[] = [],
  ) {
    gameState = makeGameStateFake(gameStateOpts);
    data      = makeDataFake(tracks, techNodes);
    eventBus  = makeEventBusFake();
    techTree  = makeTechTreeFake();

    TestBed.configureTestingModule({
      providers: [
        ResearchService,
        { provide: DataService,      useValue: data },
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService,  useValue: eventBus },
        { provide: TechTreeService,  useValue: techTree },
      ],
    });

    service = TestBed.inject(ResearchService);
  }

  // -------------------------------------------------------------------------
  // processYear — via effect
  // -------------------------------------------------------------------------

  describe('processYear (via effect on gameYear)', () => {
    it('skips paused tracks', () => {
      const trackDef   = makeTrackDef({ durationYears: 10 });
      const activeTrack = makeActiveTrack({ isPaused: true, startYear: 2030, elapsedBeforeStart: 2 });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2033 });
      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.completeResearch).not.toHaveBeenCalled();
    });

    it('completes a track when elapsed years reaches durationYears', () => {
      // startYear 2028, elapsedBeforeStart 0, durationYears 5
      // at year 2033: elapsed = 2033 - 2028 = 5 >= 5 → complete
      const trackDef    = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ startYear: 2028, elapsedBeforeStart: 0 });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2033 });
      TestBed.flushEffects();

      expect(gameState.completeResearch).toHaveBeenCalledWith('test_track', 2033);
    });

    it('does not complete a track when elapsed is below durationYears', () => {
      // startYear 2030, durationYears 5
      // at year 2033: elapsed = 3 < 5 → no completion
      const trackDef    = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ startYear: 2030, elapsedBeforeStart: 0 });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2033 });
      TestBed.flushEffects();

      expect(gameState.completeResearch).not.toHaveBeenCalled();
    });

    it('counts elapsedBeforeStart when paused then resumed', () => {
      // 2 years elapsed before pause, resumed at 2031, durationYears 5
      // at year 2034: total = 2 + (2034 - 2031) = 5 → complete
      const trackDef    = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ startYear: 2031, elapsedBeforeStart: 2 });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2034 });
      TestBed.flushEffects();

      expect(gameState.completeResearch).toHaveBeenCalledWith('test_track', 2034);
    });
  });

  // -------------------------------------------------------------------------
  // _completeTrack (indirectly via processYear completion)
  // -------------------------------------------------------------------------

  describe('_completeTrack (via processYear)', () => {
    it('calls techTree.applyEffects with the track onCompleteEffects and planetId', () => {
      const effect: TechEffect = { type: 'unlock_tech', target: 'some_tech' };
      const trackDef    = makeTrackDef({ durationYears: 5, onCompleteEffects: [effect] });
      const activeTrack = makeActiveTrack({ startYear: 2028, elapsedBeforeStart: 0, planetId: 'mars' });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2033 });
      TestBed.flushEffects();

      expect(techTree.applyEffects).toHaveBeenCalledWith([effect], 'mars');
    });

    it('emits researchCompleted$ with the trackId', () => {
      const trackDef    = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ startYear: 2028, elapsedBeforeStart: 0 });

      setup([trackDef], { activeResearch: [activeTrack], gameYear: 2033 });

      const emitted: string[] = [];
      eventBus.researchCompleted$.subscribe((id) => emitted.push(id));

      TestBed.flushEffects();

      expect(emitted).toEqual(['test_track']);
    });
  });

  // -------------------------------------------------------------------------
  // canStartTrack
  // -------------------------------------------------------------------------

  describe('canStartTrack()', () => {
    it('returns false when the track is unknown', () => {
      setup([], { completedTechs: ['prereq_tech'] });
      expect(service.canStartTrack('nonexistent')).toBe(false);
    });

    it('returns false when prerequisiteTech is not in completedTechs', () => {
      const trackDef = makeTrackDef({ prerequisiteTech: 'prereq_tech' });
      setup([trackDef], { completedTechs: [] });
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns false when the track is already completed', () => {
      const trackDef = makeTrackDef();
      setup([trackDef], { completedTechs: ['prereq_tech', 'test_track'] });
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns false when the track is already running (not paused)', () => {
      const trackDef   = makeTrackDef();
      const activeTrack = makeActiveTrack({ isPaused: false });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        activeResearch:  [activeTrack],
        usedRpCapacity:  20,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns false when RP capacity would be exceeded by a new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        usedRpCapacity:  50,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns true when all conditions are met for a new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        usedRpCapacity:  30,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(true);
    });

    it('returns true for a paused track even when used capacity is near limit', () => {
      const trackDef   = makeTrackDef({ rpCost: 20 });
      const pausedTrack = makeActiveTrack({ isPaused: true });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        activeResearch:  [pausedTrack],
        usedRpCapacity:  55,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // startTrack
  // -------------------------------------------------------------------------

  describe('startTrack()', () => {
    it('calls resumeTrack when the track is currently paused', () => {
      const trackDef   = makeTrackDef({ rpCost: 20 });
      const pausedTrack = makeActiveTrack({ isPaused: true });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        activeResearch:  [pausedTrack],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
      });

      service.startTrack('test_track', 'mars');

      expect(gameState.resumeResearch).toHaveBeenCalledWith('test_track');
      expect(gameState.startResearch).not.toHaveBeenCalled();
    });

    it('calls gameState.startResearch with startYear for a valid new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
        gameYear:        2040,
      });

      service.startTrack('test_track', 'mars');

      expect(gameState.startResearch).toHaveBeenCalledWith('test_track', 'mars', 2040);
    });

    it('emits researchTrackStarted$ for a valid new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
      });
      const emitted: ResearchTrackStartedEvent[] = [];
      eventBus.researchTrackStarted$.subscribe((event) => emitted.push(event));

      service.startTrack('test_track', 'mars');

      expect(emitted).toEqual([{ trackId: 'test_track', planetId: 'mars' }]);
    });

    it('emits researchTrackStarted$ when resuming a paused track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs:  ['prereq_tech'],
        activeResearch:  [makeActiveTrack({ isPaused: true, planetId: 'mars' })],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
      });
      const emitted: ResearchTrackStartedEvent[] = [];
      eventBus.researchTrackStarted$.subscribe((event) => emitted.push(event));

      service.startTrack('test_track', 'mars');

      expect(emitted).toEqual([{ trackId: 'test_track', planetId: 'mars' }]);
    });

    it('is a no-op when canStartTrack returns false', () => {
      const trackDef = makeTrackDef();
      setup([trackDef], { completedTechs: [] });
      const emitted: ResearchTrackStartedEvent[] = [];
      eventBus.researchTrackStarted$.subscribe((event) => emitted.push(event));

      service.startTrack('test_track', 'mars');

      expect(gameState.startResearch).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // startTechTrack
  // -------------------------------------------------------------------------

  describe('startTechTrack()', () => {
    it('emits researchTrackStarted$ for a valid tech node track', () => {
      const node = makeTechNode({ id: 'test_node', planet: 'earth', rpCost: 20 });
      setup([], { usedRpCapacity: 0, totalRpCapacity: 60 }, [node]);
      techTree.canUnlock.mockReturnValue(true);
      const emitted: ResearchTrackStartedEvent[] = [];
      eventBus.researchTrackStarted$.subscribe((event) => emitted.push(event));

      service.startTechTrack('test_node', 'earth');

      expect(gameState.startResearch).toHaveBeenCalledWith('test_node', 'earth', 2033);
      expect(emitted).toEqual([{ trackId: 'test_node', planetId: 'earth' }]);
    });

    it('does not emit researchTrackStarted$ when the tech node cannot start', () => {
      const node = makeTechNode({ id: 'test_node', planet: 'earth', rpCost: 20 });
      setup([], { usedRpCapacity: 50, totalRpCapacity: 60 }, [node]);
      techTree.canUnlock.mockReturnValue(true);
      const emitted: ResearchTrackStartedEvent[] = [];
      eventBus.researchTrackStarted$.subscribe((event) => emitted.push(event));

      service.startTechTrack('test_node', 'earth');

      expect(gameState.startResearch).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // pauseTrack
  // -------------------------------------------------------------------------

  describe('pauseTrack()', () => {
    it('pauses a running track', () => {
      const trackDef = makeTrackDef();
      setup([trackDef], { activeResearch: [makeActiveTrack()] });

      service.pauseTrack('test_track');

      expect(gameState.pauseResearch).toHaveBeenCalledWith('test_track');
    });

    it('is a no-op when the track is already paused', () => {
      const trackDef = makeTrackDef();
      setup([trackDef], { activeResearch: [makeActiveTrack({ isPaused: true })] });

      service.pauseTrack('test_track');

      expect(gameState.pauseResearch).not.toHaveBeenCalled();
    });

    it('is a no-op when the track is not in activeResearch', () => {
      setup([]);

      service.pauseTrack('test_track');

      expect(gameState.pauseResearch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // resumeTrack
  // -------------------------------------------------------------------------

  describe('resumeTrack()', () => {
    it('resumes a paused track when capacity is available', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        activeResearch:  [makeActiveTrack({ isPaused: true })],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
      });

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).toHaveBeenCalledWith('test_track');
    });

    it('is a no-op when RP capacity would be exceeded', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        activeResearch:  [makeActiveTrack({ isPaused: true })],
        usedRpCapacity:  50,
        totalRpCapacity: 60,
      });

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).not.toHaveBeenCalled();
    });

    it('is a no-op when the track is not paused', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        activeResearch:  [makeActiveTrack({ isPaused: false })],
        usedRpCapacity:  0,
        totalRpCapacity: 60,
      });

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).not.toHaveBeenCalled();
    });

    it('is a no-op when the track is not in activeResearch', () => {
      setup([]);

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).not.toHaveBeenCalled();
    });
  });
});
