// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanetsMenuComponent } from './planets-menu.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type { PlanetState, PlanetData, PlanetUnlockState } from '@app/core/models';

// ---------------------------------------------------------------------------
// Test helpers
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
      lavaOpacity: 0,
      lavaHueShift: 0,
      cloudOpacity: 0,
      atmosphereDensity: 0,
      atmosphereColor: '#000000',
      cloudRotationSpeed: 0,
      axisSpinSpeed: 1,
      axisRotationDirection: 'prograde',
      cityLightsIntensity: 0,
    },
    terraformStartYear: 2033,
    terraformEndYear: 2333,
    ...overrides,
  } as PlanetState;
}

function makePlanetData(id: string, phases: { displayName: string; description: string }[]): PlanetData {
  return {
    id: id as PlanetData['id'],
    displayName: id.charAt(0).toUpperCase() + id.slice(1),
    unlock: id === 'earth' ? { type: 'start_unlocked' } : { type: 'year', year: 2100 },
    initialState: {
      atmospherePressure: 0,
      temperatureCelsius: 0,
      terraformingPhase: 0,
      axisSpinSpeed: 1,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0,
      atmosphereColor: '#000000',
      atmosphereDensity: 0,
    },
    visual: {
      baseColor: '#000000',
      layerTextures: {},
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases,
  };
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const planetsSignal = signal<Record<string, PlanetState>>({
  earth: makePlanetState({ id: 'earth', terraformingPhase: 0 }),
});
const planetUnlocksSignal = signal<Record<string, PlanetUnlockState>>({
  earth: { planetId: 'earth', status: 'unlocked', unlockedYear: 2033, firedFlags: [] },
  mercury: { planetId: 'mercury', status: 'mission_available', missionId: 'earth_launch_mercury_mission', firedFlags: [] },
  mars: { planetId: 'mars', status: 'locked', firedFlags: [] },
  venus: { planetId: 'venus', status: 'locked', firedFlags: [] },
});

const planetDataMap: Record<string, PlanetData> = {
  earth:   makePlanetData('earth',   [{ displayName: 'Industrial Age', description: '' }, { displayName: 'Space Age', description: '' }]),
  mercury: makePlanetData('mercury', [{ displayName: 'Operational Base', description: '' }, { displayName: 'Industrial Hub', description: '' }, { displayName: 'Ring City', description: '' }]),
  mars:    makePlanetData('mars',    [{ displayName: 'Barren', description: '' }, { displayName: 'Thin Atmosphere', description: '' }, { displayName: 'Warming', description: '' }, { displayName: 'Wetting', description: '' }, { displayName: 'Flourishing', description: '' }]),
  venus:   makePlanetData('venus',   [{ displayName: 'Hellish', description: '' }, { displayName: 'Cooling', description: '' }, { displayName: 'Thinning', description: '' }, { displayName: 'Temperate', description: '' }, { displayName: 'Flourishing', description: '' }]),
};

const mockGameState = {
  planets: planetsSignal.asReadonly(),
  planetUnlocks: planetUnlocksSignal.asReadonly(),
};

const mockData = {
  getPlanet: (id: string) => {
    const p = planetDataMap[id];
    if (!p) throw new Error(`Unknown planet: ${id}`);
    return p;
  },
};

const planetSelected$ = new Subject<string>();
const lockedPlanetSelected$ = new Subject<unknown>();
const moonTabRequested$ = new Subject<void>();
const planetHovered$ = new Subject<string | null>();
const mockEventBus = { planetSelected$, lockedPlanetSelected$, moonTabRequested$, planetHovered$ };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setup(): PlanetsMenuComponent {
  TestBed.configureTestingModule({
    providers: [
      { provide: GameStateService, useValue: mockGameState },
      { provide: DataService, useValue: mockData },
      { provide: EventBusService, useValue: mockEventBus },
    ],
  });
  return TestBed.runInInjectionContext(() => new PlanetsMenuComponent());
}

beforeEach(() => {
  planetsSignal.set({
    earth: makePlanetState({ id: 'earth', terraformingPhase: 0 }),
    mercury: makePlanetState({ id: 'mercury', terraformingPhase: 0 }),
    mars: makePlanetState({ id: 'mars', terraformingPhase: 0 }),
    venus: makePlanetState({ id: 'venus', terraformingPhase: 0 }),
  });
  planetUnlocksSignal.set({
    earth: { planetId: 'earth', status: 'unlocked', unlockedYear: 2033, firedFlags: [] },
    mercury: { planetId: 'mercury', status: 'mission_available', missionId: 'earth_launch_mercury_mission', firedFlags: [] },
    mars: { planetId: 'mars', status: 'locked', firedFlags: [] },
    venus: { planetId: 'venus', status: 'locked', firedFlags: [] },
  });
  TestBed.resetTestingModule();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlanetsMenuComponent', () => {
  it('renders rows in display order (earth, moon, mercury, mars, venus)', () => {
    const component = setup();
    const rows = component.rows();
    expect(rows.map((r) => r.id)).toEqual(['earth', 'moon', 'mercury', 'mars', 'venus']);
  });

  it('Mercury row is mission available before transit starts', () => {
    const component = setup();
    const mercury = component.rows().find((r) => r.id === 'mercury')!;
    expect(mercury.status).toBe('mission');
    expect(mercury.phaseName).toBe('Mission available');
  });

  it('Mercury row shows arrival year while in transit', () => {
    planetUnlocksSignal.update((states) => ({
      ...states,
      mercury: { ...states['mercury'], status: 'in_transit', arrivalYear: 2037 },
    }));
    const component = setup();
    const mercury = component.rows().find((r) => r.id === 'mercury')!;
    expect(mercury.status).toBe('in_transit');
    expect(mercury.phaseName).toBe('En route - arrives Year 2037');
  });

  it('Mars phaseName is "Warming" when terraformingPhase = 2', () => {
    planetsSignal.set({
      earth: makePlanetState({ id: 'earth' }),
      mars: makePlanetState({ id: 'mars', terraformingPhase: 2 }),
      mercury: makePlanetState({ id: 'mercury' }),
      venus: makePlanetState({ id: 'venus' }),
    });
    planetUnlocksSignal.update((states) => ({
      ...states,
      mars: { ...states['mars'], status: 'unlocked', unlockedYear: 2057 },
    }));
    const component = setup();
    const mars = component.rows().find((r) => r.id === 'mars')!;
    expect(mars.phaseName).toBe('Warming');
  });

  it('Mars status is "flourishing" when terraformingPhase = 4 (last phase)', () => {
    planetsSignal.set({
      earth: makePlanetState({ id: 'earth' }),
      mars: makePlanetState({ id: 'mars', terraformingPhase: 4 }),
      mercury: makePlanetState({ id: 'mercury' }),
      venus: makePlanetState({ id: 'venus' }),
    });
    planetUnlocksSignal.update((states) => ({
      ...states,
      mars: { ...states['mars'], status: 'unlocked', unlockedYear: 2057 },
    }));
    const component = setup();
    const mars = component.rows().find((r) => r.id === 'mars')!;
    expect(mars.status).toBe('flourishing');
  });

  it('Earth status is "active" when terraformingPhase = 0 (never flourishing at phase 0)', () => {
    const component = setup();
    const earth = component.rows().find((r) => r.id === 'earth')!;
    expect(earth.status).toBe('active');
  });

  it('clicking Earth row emits planetSelected$("earth") but not moonTabRequested$', () => {
    const component = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    const moonSpy = vi.fn<() => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));
    moonTabRequested$.subscribe(() => moonSpy());

    component.onRowClick('earth');

    expect(selectedSpy).toHaveBeenCalledWith('earth');
    expect(moonSpy).not.toHaveBeenCalled();
  });

  it('clicking Moon row emits planetSelected$("earth") AND moonTabRequested$', () => {
    const component = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    const moonSpy = vi.fn<() => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));
    moonTabRequested$.subscribe(() => moonSpy());

    component.onRowClick('moon');

    expect(selectedSpy).toHaveBeenCalledWith('earth');
    expect(moonSpy).toHaveBeenCalled();
  });

  it('clicking locked Mercury row emits a locked cue instead of normal selection', () => {
    const component = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    const lockedSpy = vi.fn<(v: unknown) => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));
    lockedPlanetSelected$.subscribe((v) => lockedSpy(v));

    component.onRowClick('mercury');

    expect(selectedSpy).not.toHaveBeenCalled();
    expect(lockedSpy).toHaveBeenCalledWith({
      planetId: 'mercury',
      status: 'mission_available',
      arrivalYear: undefined,
    });
  });

});
