import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { ResearchService } from './research.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { TechTreeService } from './tech-tree.service';
import type { ResearchTrack, ActiveResearchTrack, TechEffect } from '@app/core/models';

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
    progressYears: 0,
    isPaused: false,
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
  const completedTechs = signal<string[]>(opts.completedTechs ?? []);
  const activeResearch = signal<ActiveResearchTrack[]>(opts.activeResearch ?? []);
  const gameYearSig = signal<number>(opts.gameYear ?? 2033);

  // usedRpCapacity is a derived value in the real service; expose as a settable
  // signal in tests so scenarios can control it directly.
  const usedRpCapacitySig = signal<number>(opts.usedRpCapacity ?? 0);
  const totalRpCapacitySig = signal<number>(opts.totalRpCapacity ?? 60);

  return {
    completedTechs: completedTechs.asReadonly(),
    activeResearch: activeResearch.asReadonly(),
    gameYear: gameYearSig.asReadonly(),
    usedRpCapacity: usedRpCapacitySig.asReadonly(),
    totalRpCapacity: totalRpCapacitySig.asReadonly(),

    // Write helpers for tests.
    _setCompletedTechs: (v: string[]) => completedTechs.set(v),
    _setActiveResearch: (v: ActiveResearchTrack[]) => activeResearch.set(v),
    _setUsedRpCapacity: (v: number) => usedRpCapacitySig.set(v),
    _setTotalRpCapacity: (v: number) => totalRpCapacitySig.set(v),
    _advanceYear: () => gameYearSig.update((y) => y + 1),

    // Mutation spies — simulate the real side-effect for readable assertions.
    advanceResearch: vi.fn((trackId: string, years: number) => {
      activeResearch.update((tracks) =>
        tracks.map((t) =>
          t.trackId === trackId ? { ...t, progressYears: t.progressYears + years } : t
        )
      );
    }),
    completeResearch: vi.fn((trackId: string) => {
      activeResearch.update((tracks) => tracks.filter((t) => t.trackId !== trackId));
      completedTechs.update((techs) => (techs.includes(trackId) ? techs : [...techs, trackId]));
    }),
    startResearch: vi.fn((trackId: string, planetId: string) => {
      activeResearch.update((tracks) => [
        ...tracks,
        { trackId, planetId, progressYears: 0, isPaused: false },
      ]);
    }),
    pauseResearch: vi.fn((trackId: string) => {
      activeResearch.update((tracks) =>
        tracks.map((t) => (t.trackId === trackId ? { ...t, isPaused: true } : t))
      );
    }),
    resumeResearch: vi.fn((trackId: string) => {
      activeResearch.update((tracks) =>
        tracks.map((t) => (t.trackId === trackId ? { ...t, isPaused: false } : t))
      );
    }),
  };
}

function makeDataFake(tracks: ResearchTrack[] = []) {
  return {
    getResearchTrack: vi.fn((id: string) => tracks.find((t) => t.id === id)),
  };
}

function makeEventBusFake() {
  return {
    researchCompleted$: new Subject<string>(),
  };
}

function makeTechTreeFake() {
  return {
    applyEffects: vi.fn((_effects: TechEffect[], _planetId: string) => undefined),
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
    gameStateOpts: Parameters<typeof makeGameStateFake>[0] = {}
  ) {
    gameState = makeGameStateFake(gameStateOpts);
    data = makeDataFake(tracks);
    eventBus = makeEventBusFake();
    techTree = makeTechTreeFake();

    TestBed.configureTestingModule({
      providers: [
        ResearchService,
        { provide: DataService, useValue: data },
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService, useValue: eventBus },
        { provide: TechTreeService, useValue: techTree },
      ],
    });

    service = TestBed.inject(ResearchService);
  }

  // -------------------------------------------------------------------------
  // processYear — via effect
  // -------------------------------------------------------------------------

  describe('processYear (via effect on gameYear)', () => {
    it('advances progress by 1 for each non-paused track', () => {
      const trackDef = makeTrackDef({ durationYears: 10 });
      const activeTrack = makeActiveTrack({ progressYears: 2 });

      setup([trackDef], {
        activeResearch: [activeTrack],
        completedTechs: ['prereq_tech'],
      });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.advanceResearch).toHaveBeenCalledWith('test_track', 1);
    });

    it('skips paused tracks', () => {
      const trackDef = makeTrackDef({ durationYears: 10 });
      const activeTrack = makeActiveTrack({ progressYears: 2, isPaused: true });

      setup([trackDef], { activeResearch: [activeTrack] });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.advanceResearch).not.toHaveBeenCalled();
    });

    it('completes a track when progressYears reaches durationYears', () => {
      // Track needs 5 years; currently at 4 — one more tick should complete it.
      const trackDef = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ progressYears: 4 });

      setup([trackDef], { activeResearch: [activeTrack] });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.completeResearch).toHaveBeenCalledWith('test_track');
    });

    it('does not complete a track when progress is still below duration', () => {
      const trackDef = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ progressYears: 2 });

      setup([trackDef], { activeResearch: [activeTrack] });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.completeResearch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // _completeTrack (indirectly via processYear completion)
  // -------------------------------------------------------------------------

  describe('_completeTrack (via processYear)', () => {
    it('calls techTree.applyEffects with the track onCompleteEffects and planetId', () => {
      const effect: TechEffect = { type: 'unlock_tech', target: 'some_tech' };
      const trackDef = makeTrackDef({ durationYears: 5, onCompleteEffects: [effect] });
      const activeTrack = makeActiveTrack({ progressYears: 4, planetId: 'mars' });

      setup([trackDef], { activeResearch: [activeTrack] });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(techTree.applyEffects).toHaveBeenCalledWith([effect], 'mars');
    });

    it('emits researchCompleted$ with the trackId', () => {
      const trackDef = makeTrackDef({ durationYears: 5 });
      const activeTrack = makeActiveTrack({ progressYears: 4 });

      setup([trackDef], { activeResearch: [activeTrack] });

      const emitted: string[] = [];
      eventBus.researchCompleted$.subscribe((id) => emitted.push(id));

      TestBed.flushEffects();
      gameState._advanceYear();
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
      const trackDef = makeTrackDef();
      const activeTrack = makeActiveTrack({ isPaused: false });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        activeResearch: [activeTrack],
        usedRpCapacity: 20,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns false when RP capacity would be exceeded by a new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        usedRpCapacity: 50,
        totalRpCapacity: 60,
      });
      // 50 + 20 = 70 > 60
      expect(service.canStartTrack('test_track')).toBe(false);
    });

    it('returns true when all conditions are met for a new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        usedRpCapacity: 30,
        totalRpCapacity: 60,
      });
      expect(service.canStartTrack('test_track')).toBe(true);
    });

    it('returns true for a paused track even when new rpCost would fill capacity', () => {
      // Paused tracks are excluded from usedRpCapacity in the real service. Here we
      // simulate that by having usedRpCapacity already near the limit, and the paused
      // track would exceed it if it were a *new* track. canStartTrack should still
      // return true because capacity is validated at resume time, not here.
      const trackDef = makeTrackDef({ rpCost: 20 });
      const pausedTrack = makeActiveTrack({ isPaused: true });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        activeResearch: [pausedTrack],
        usedRpCapacity: 55, // would exceed 60 if we added 20
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
      const trackDef = makeTrackDef({ rpCost: 20 });
      const pausedTrack = makeActiveTrack({ isPaused: true });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        activeResearch: [pausedTrack],
        usedRpCapacity: 0,
        totalRpCapacity: 60,
      });

      service.startTrack('test_track', 'mars');

      // resumeTrack delegates to gameState.resumeResearch
      expect(gameState.resumeResearch).toHaveBeenCalledWith('test_track');
      expect(gameState.startResearch).not.toHaveBeenCalled();
    });

    it('calls gameState.startResearch for a valid new track', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        completedTechs: ['prereq_tech'],
        usedRpCapacity: 0,
        totalRpCapacity: 60,
      });

      service.startTrack('test_track', 'mars');

      expect(gameState.startResearch).toHaveBeenCalledWith('test_track', 'mars');
    });

    it('is a no-op when canStartTrack returns false', () => {
      const trackDef = makeTrackDef();
      // prerequisiteTech not met
      setup([trackDef], { completedTechs: [] });

      service.startTrack('test_track', 'mars');

      expect(gameState.startResearch).not.toHaveBeenCalled();
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
        activeResearch: [makeActiveTrack({ isPaused: true })],
        usedRpCapacity: 0,
        totalRpCapacity: 60,
      });

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).toHaveBeenCalledWith('test_track');
    });

    it('is a no-op when RP capacity would be exceeded', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        activeResearch: [makeActiveTrack({ isPaused: true })],
        usedRpCapacity: 50,
        totalRpCapacity: 60,
      });
      // 50 + 20 = 70 > 60

      service.resumeTrack('test_track');

      expect(gameState.resumeResearch).not.toHaveBeenCalled();
    });

    it('is a no-op when the track is not paused', () => {
      const trackDef = makeTrackDef({ rpCost: 20 });
      setup([trackDef], {
        activeResearch: [makeActiveTrack({ isPaused: false })],
        usedRpCapacity: 0,
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
