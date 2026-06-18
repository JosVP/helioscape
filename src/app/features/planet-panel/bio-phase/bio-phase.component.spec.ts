import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BioPhaseComponent } from './bio-phase.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import { BioPhaseService } from '@app/core/systems/bio-phase.service';
import type { PlanetBioState, BioPhaseState } from '@app/core/models';
import type { BioPhaseDef } from '@app/core/services/data.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePhaseDef(overrides: Partial<BioPhaseDef> = {}): BioPhaseDef {
  return {
    id: 'mars-bio-1',
    displayName: 'Pioneer Microbes',
    nominalDurationYears: 20,
    actions: ['seed_cyanobacteria', 'add_perchlorate_reducers', 'deploy_iron_oxidisers'],
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

function makePlanetBio(phases: BioPhaseState[]): PlanetBioState {
  return {
    currentPhaseIndex: 0,
    phases,
    odnBuilt: false,
    bioreactorBatchesActive: 0,
    precipitationEnginesBuilt: 0,
    atmosphericCatalystShipsBuilt: 0,
    requestsSent: [],
    discoveredOrganisms: [],
  };
}

/** Four-phase Mars setup — phase 0 available, rest locked. */
function makeMarsPhases(): BioPhaseState[] {
  return [
    makePhaseState({ status: 'available' }),
    makePhaseState({ status: 'locked', durationYears: 25 }),
    makePhaseState({ status: 'locked', durationYears: 30 }),
    makePhaseState({ status: 'locked', durationYears: 35 }),
  ];
}

const MARS_DEFS: BioPhaseDef[] = [
  makePhaseDef({ id: 'mars-bio-1', displayName: 'Pioneer Microbes', nominalDurationYears: 20 }),
  makePhaseDef({
    id: 'mars-bio-2',
    displayName: 'Chemolithotrophs & Fixers',
    nominalDurationYears: 25,
    canStartAtPreviousPercent: 0.5,
  }),
  makePhaseDef({
    id: 'mars-bio-3',
    displayName: 'Early Plants & Aquatics',
    nominalDurationYears: 30,
    requiresComponents: ['bioreactor'],
    completeCeId: 'ce_mars_bio_3_complete',
  }),
  makePhaseDef({
    id: 'mars-bio-4',
    displayName: 'Biosphere Stabilisation',
    nominalDurationYears: 35,
    requiresComponents: ['precipitationEngine'],
    completeCeId: 'ce_mars_bio_4_complete',
  }),
];

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const bioPhasesSignal = signal<Record<string, PlanetBioState>>({});
const gameYearSignal  = signal<number>(2050);

const mockGameState = {
  bioPhases: bioPhasesSignal.asReadonly(),
  gameYear:  gameYearSignal.asReadonly(),
};

const mockData = {
  getBioPhases: (_planetId: string) => MARS_DEFS,
};

const mockBioPhaseService = {
  applyAction: vi.fn<(planetId: string, phaseIndex: number, actionId: string) => void>(),
  sendRequest: vi.fn<(planetId: string, requestId: string) => void>(),
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setup(planetId = 'mars'): ComponentFixture<BioPhaseComponent> {
  TestBed.configureTestingModule({
    imports: [BioPhaseComponent],
    providers: [
      { provide: GameStateService, useValue: mockGameState },
      { provide: DataService,      useValue: mockData },
      { provide: BioPhaseService,  useValue: mockBioPhaseService },
    ],
  });
  const fixture = TestBed.createComponent(BioPhaseComponent);
  fixture.componentRef.setInput('planetId', planetId);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  bioPhasesSignal.set({ mars: makePlanetBio(makeMarsPhases()) });
  gameYearSignal.set(2050);
  mockBioPhaseService.applyAction.mockReset();
  mockBioPhaseService.sendRequest.mockReset();
  TestBed.resetTestingModule();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BioPhaseComponent', () => {
  // ── phaseVMs computed ─────────────────────────────────────────────────────

  it('returns empty array when no bio state exists for the planet', () => {
    bioPhasesSignal.set({});
    const fixture = setup();
    expect(fixture.componentInstance.phaseVMs()).toHaveLength(0);
  });

  it('renders four VM entries for Mars', () => {
    const fixture = setup();
    expect(fixture.componentInstance.phaseVMs()).toHaveLength(4);
  });

  it('phase 0 VM has status available', () => {
    const fixture = setup();
    const vm = fixture.componentInstance.phaseVMs()[0];
    expect(vm.state.status).toBe('available');
  });

  // ── LOCKED card requirement display ───────────────────────────────────────

  it('LOCKED phase with bioreactor requirement shows unmet requirement', () => {
    // Phase 2 requires bioreactor; bioreactorBatchesActive = 0 → unmet.
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'complete', completedYear: 2060 }),
        makePhaseState({ status: 'complete', completedYear: 2085 }),
        makePhaseState({ status: 'locked', durationYears: 30 }),
        makePhaseState({ status: 'locked', durationYears: 35 }),
      ]),
    });
    const fixture = setup();
    const vm = fixture.componentInstance.phaseVMs()[2];
    expect(vm.unmetRequirements.some((r) => r.includes('Bioreactor'))).toBe(true);
    expect(vm.metRequirements.some((r) => r.includes('Bioreactor'))).toBe(false);
  });

  it('LOCKED phase with bioreactor built shows met requirement', () => {
    bioPhasesSignal.set({
      mars: {
        ...makePlanetBio([
          makePhaseState({ status: 'complete', completedYear: 2060 }),
          makePhaseState({ status: 'complete', completedYear: 2085 }),
          makePhaseState({ status: 'locked', durationYears: 30 }),
          makePhaseState({ status: 'locked', durationYears: 35 }),
        ]),
        bioreactorBatchesActive: 1,
      },
    });
    const fixture = setup();
    const vm = fixture.componentInstance.phaseVMs()[2];
    expect(vm.metRequirements.some((r) => r.toLowerCase().includes('bioreactor'))).toBe(true);
    expect(vm.unmetRequirements.some((r) => r.toLowerCase().includes('bioreactor'))).toBe(false);
  });

  // ── AVAILABLE: action buttons ─────────────────────────────────────────────

  it('AVAILABLE phase lists all def actions as remainingActions', () => {
    const fixture = setup();
    const vm = fixture.componentInstance.phaseVMs()[0];
    expect(vm.remainingActions).toEqual(MARS_DEFS[0].actions);
  });

  it('clicking an action button calls bioPhaseService.applyAction with correct args', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelectorAll<HTMLButtonElement>('.bio-phases__action-btn')[0];
    btn.click();
    fixture.detectChanges();
    expect(mockBioPhaseService.applyAction).toHaveBeenCalledWith(
      'mars',
      0,
      MARS_DEFS[0].actions[0],
    );
  });

  // ── RUNNING: progress bar and remaining actions ───────────────────────────

  it('progressPercent is correct for a running phase', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'running', progressYears: 10, durationYears: 20 }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    expect(fixture.componentInstance.phaseVMs()[0].progressPercent).toBe(50);
  });

  it('RUNNING: already-taken actions are excluded from remainingActions', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({
          status: 'running',
          progressYears: 5,
          durationYears: 20,
          actionsTaken: ['seed_cyanobacteria'],
        }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    const vm = fixture.componentInstance.phaseVMs()[0];
    expect(vm.remainingActions).not.toContain('seed_cyanobacteria');
    expect(vm.remainingActions).toContain('add_perchlorate_reducers');
    expect(vm.remainingActions).toContain('deploy_iron_oxidisers');
  });

  it('RUNNING action buttons carry tooltip text', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'running', progressYears: 2, durationYears: 20 }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector<HTMLButtonElement>('.bio-phases__action-btn');
    expect(btn?.title).toContain('~8%');
  });

  // ── COMPLETE card ─────────────────────────────────────────────────────────

  it('COMPLETE phase shows completedYear in VM', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'complete', completedYear: 2070 }),
        makePhaseState({ status: 'available' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    expect(fixture.componentInstance.phaseVMs()[0].state.completedYear).toBe(2070);
  });

  it('COMPLETE card shows "Complete" status badge text', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'complete', completedYear: 2070 }),
        makePhaseState({ status: 'available' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector<HTMLElement>('.bio-phases__status-badge--complete');
    expect(badge?.textContent?.trim()).toBe('Complete');
  });

  // ── Reactivity ────────────────────────────────────────────────────────────

  it('phaseVMs recomputes when gameYear signal changes', () => {
    bioPhasesSignal.set({
      mars: makePlanetBio([
        makePhaseState({ status: 'running', progressYears: 5, durationYears: 20 }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
        makePhaseState({ status: 'locked' }),
      ]),
    });
    const fixture = setup();
    const before = fixture.componentInstance.phaseVMs()[0].progressPercent;
    // Simulate a tick: update progressYears directly via signal mutation
    bioPhasesSignal.update((prev) => ({
      ...prev,
      mars: {
        ...prev['mars']!,
        phases: [
          makePhaseState({ status: 'running', progressYears: 10, durationYears: 20 }),
          makePhaseState({ status: 'locked' }),
          makePhaseState({ status: 'locked' }),
          makePhaseState({ status: 'locked' }),
        ],
      },
    }));
    gameYearSignal.set(2051);
    fixture.detectChanges();
    const after = fixture.componentInstance.phaseVMs()[0].progressPercent;
    expect(after).toBeGreaterThan(before);
  });

  // ── formatActionLabel ─────────────────────────────────────────────────────

  it('formatActionLabel converts snake_case to Title Case', () => {
    const fixture = setup();
    expect(fixture.componentInstance.formatActionLabel('seed_cyanobacteria')).toBe('Seed Cyanobacteria');
    expect(fixture.componentInstance.formatActionLabel('add_perchlorate_reducers')).toBe('Add Perchlorate Reducers');
  });
});
