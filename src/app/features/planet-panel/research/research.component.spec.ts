import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResearchComponent } from './research.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { ResearchService } from '@app/core/systems/research.service';
import type { ResearchTrack, ActiveResearchTrack } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrackDef(overrides: Partial<ResearchTrack> = {}): ResearchTrack {
  return {
    id: 'track_a',
    displayName: 'Track Alpha',
    planet: 'mars',
    rpCost: 20,
    durationYears: 10,
    description: 'A track about stuff.',
    prerequisiteTech: 'prereq_tech',
    onCompleteEffects: [],
    ...overrides,
  };
}

function makeActiveTrack(overrides: Partial<ActiveResearchTrack> = {}): ActiveResearchTrack {
  return {
    trackId: 'track_a',
    planetId: 'mars',
    isPaused: false,
    startYear: 2050,
    elapsedBeforeStart: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const activeResearchSig   = signal<ActiveResearchTrack[]>([]);
const completedTechsSig   = signal<string[]>(['prereq_tech']);
const gameYearSig         = signal<number>(2050);
const usedRpCapacitySig   = signal<number>(0);
const totalRpCapacitySig  = signal<number>(60);
const researchTracksSig   = signal<ResearchTrack[]>([makeTrackDef()]);

const mockGameState = {
  activeResearch:   activeResearchSig.asReadonly(),
  completedTechs:   completedTechsSig.asReadonly(),
  gameYear:         gameYearSig.asReadonly(),
  usedRpCapacity:   usedRpCapacitySig.asReadonly(),
  totalRpCapacity:  totalRpCapacitySig.asReadonly(),
};

const mockData = {
  getResearchTracksForPlanet: (_id: string) => researchTracksSig(),
};

const researchCompleted$ = new Subject<string>();
const mockEventBus = { researchCompleted$ };

const mockResearchService = {
  startTrack: vi.fn<(trackId: string, planetId: string) => void>(),
  pauseTrack:  vi.fn<(trackId: string) => void>(),
  resumeTrack: vi.fn<(trackId: string) => void>(),
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setup(planetId = 'mars'): ComponentFixture<ResearchComponent> {
  TestBed.configureTestingModule({
    imports: [ResearchComponent],
    providers: [
      { provide: GameStateService,  useValue: mockGameState },
      { provide: DataService,       useValue: mockData },
      { provide: EventBusService,   useValue: mockEventBus },
      { provide: ResearchService,   useValue: mockResearchService },
    ],
  });
  const fixture = TestBed.createComponent(ResearchComponent);
  fixture.componentRef.setInput('planetId', planetId);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  activeResearchSig.set([]);
  completedTechsSig.set(['prereq_tech']);
  gameYearSig.set(2050);
  usedRpCapacitySig.set(0);
  totalRpCapacitySig.set(60);
  researchTracksSig.set([makeTrackDef()]);
  mockResearchService.startTrack.mockReset();
  mockResearchService.pauseTrack.mockReset();
  mockResearchService.resumeTrack.mockReset();
  TestBed.resetTestingModule();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResearchComponent', () => {
  // ── Track bucketing ──────────────────────────────────────────────────────

  it('available track appears in availableTracks when prerequisite is met', () => {
    const fixture = setup();
    const avail = fixture.componentInstance.availableTracks();
    expect(avail).toHaveLength(1);
    expect(avail[0].def.id).toBe('track_a');
    expect(avail[0].status).toBe('available');
  });

  it('track with unmet prerequisite does NOT appear in availableTracks', () => {
    completedTechsSig.set([]); // prerequisite not met
    const fixture = setup();
    expect(fixture.componentInstance.availableTracks()).toHaveLength(0);
  });

  it('running track appears in runningTracks', () => {
    // elapsed = elapsedBeforeStart(0) + (2050 - 2047) = 3 years
    activeResearchSig.set([makeActiveTrack({ isPaused: false, startYear: 2047, elapsedBeforeStart: 0 })]);
    const fixture = setup();
    const running = fixture.componentInstance.runningTracks();
    expect(running).toHaveLength(1);
    expect(running[0].status).toBe('running');
    expect(running[0].progressPercent).toBeCloseTo(30);
    expect(running[0].yearsRemaining).toBe(7);
    expect(running[0].completionYear).toBe(2057); // 2050 + 7
  });

  it('paused track appears in pausedTracks', () => {
    // elapsed = elapsedBeforeStart(5) + 0 (paused) = 5 years
    activeResearchSig.set([makeActiveTrack({ isPaused: true, startYear: 2050, elapsedBeforeStart: 5 })]);
    const fixture = setup();
    const paused = fixture.componentInstance.pausedTracks();
    expect(paused).toHaveLength(1);
    expect(paused[0].status).toBe('paused');
    expect(paused[0].progressPercent).toBe(50);
    expect(paused[0].completionYear).toBeNull(); // paused → no ETA
  });

  // ── canResume ─────────────────────────────────────────────────────────────

  it('canResume is true when paused and sufficient capacity available', () => {
    activeResearchSig.set([makeActiveTrack({ isPaused: true })]);
    usedRpCapacitySig.set(0);
    totalRpCapacitySig.set(60); // free = 60, cost = 20 → ok
    const fixture = setup();
    expect(fixture.componentInstance.pausedTracks()[0].canResume).toBe(true);
  });

  it('canResume is false when paused and insufficient capacity', () => {
    activeResearchSig.set([makeActiveTrack({ isPaused: true })]);
    usedRpCapacitySig.set(50);
    totalRpCapacitySig.set(60); // free = 10, cost = 20 → blocked
    const fixture = setup();
    expect(fixture.componentInstance.pausedTracks()[0].canResume).toBe(false);
  });

  // ── Action delegation ─────────────────────────────────────────────────────

  it('start() calls ResearchService.startTrack with trackId and planetId', () => {
    const fixture = setup('mars');
    fixture.componentInstance.start('track_a');
    expect(mockResearchService.startTrack).toHaveBeenCalledWith('track_a', 'mars');
  });

  it('pause() calls ResearchService.pauseTrack with trackId', () => {
    const fixture = setup();
    fixture.componentInstance.pause('track_a');
    expect(mockResearchService.pauseTrack).toHaveBeenCalledWith('track_a');
  });

  it('resume() calls ResearchService.resumeTrack with trackId', () => {
    const fixture = setup();
    fixture.componentInstance.resume('track_a');
    expect(mockResearchService.resumeTrack).toHaveBeenCalledWith('track_a');
  });

  // ── researchCompleted$ integration ────────────────────────────────────────

  it('emitting researchCompleted$ removes track from runningTracks', () => {
    // 10 years elapsed = complete, but we simulate service completing it externally
    activeResearchSig.set([makeActiveTrack({ isPaused: false, startYear: 2040, elapsedBeforeStart: 0 })]);
    const fixture = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.runningTracks()).toHaveLength(1);

    // Simulate service completing the track: remove from active, add to completed.
    activeResearchSig.set([]);
    completedTechsSig.set(['prereq_tech', 'track_a']);
    researchCompleted$.next('track_a');
    fixture.detectChanges();

    expect(fixture.componentInstance.runningTracks()).toHaveLength(0);
  });
});
