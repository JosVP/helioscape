import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanetsPanelComponent } from './planets-panel.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type { PlanetState, PlanetData } from '@app/core/models';

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
      waterSpotRadius: 0,
      greenSpotRadius: 0,
      cloudOpacity: 0,
      atmosphereIntensity: 0,
      atmosphereHue: 0,
      lavaSpotRadius: 0,
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
    unlockCondition: id === 'earth' ? null : 'some_tech',
    initialState: {
      atmospherePressure: 0,
      temperatureCelsius: 0,
      terraformingPhase: 0,
      axisSpinSpeed: 1,
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
const selectedSignal = signal<string | null>(null);

const planetDataMap: Record<string, PlanetData> = {
  earth:   makePlanetData('earth',   [{ displayName: 'Industrial Age', description: '' }, { displayName: 'Space Age', description: '' }]),
  mercury: makePlanetData('mercury', [{ displayName: 'Operational Base', description: '' }, { displayName: 'Industrial Hub', description: '' }, { displayName: 'Ring City', description: '' }]),
  mars:    makePlanetData('mars',    [{ displayName: 'Barren', description: '' }, { displayName: 'Thin Atmosphere', description: '' }, { displayName: 'Warming', description: '' }, { displayName: 'Wetting', description: '' }, { displayName: 'Flourishing', description: '' }]),
  venus:   makePlanetData('venus',   [{ displayName: 'Hellish', description: '' }, { displayName: 'Cooling', description: '' }, { displayName: 'Thinning', description: '' }, { displayName: 'Temperate', description: '' }, { displayName: 'Flourishing', description: '' }]),
};

const mockGameState = {
  planets: planetsSignal.asReadonly(),
};

const mockData = {
  getPlanet: (id: string) => {
    const p = planetDataMap[id];
    if (!p) throw new Error(`Unknown planet: ${id}`);
    return p;
  },
};

const planetSelected$ = new Subject<string>();
const moonTabRequested$ = new Subject<void>();
const planetHovered$ = new Subject<string | null>();
const mockEventBus = { planetSelected$, moonTabRequested$, planetHovered$ };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setup(): ComponentFixture<PlanetsPanelComponent> {
  TestBed.configureTestingModule({
    imports: [PlanetsPanelComponent],
    providers: [
      { provide: GameStateService, useValue: mockGameState },
      { provide: DataService, useValue: mockData },
      { provide: EventBusService, useValue: mockEventBus },
    ],
  });
  const fixture = TestBed.createComponent(PlanetsPanelComponent);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  planetsSignal.set({ earth: makePlanetState({ id: 'earth', terraformingPhase: 0 }) });
  TestBed.resetTestingModule();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlanetsPanelComponent', () => {
  it('renders 5 rows in correct order (earth, moon, mercury, mars, venus)', () => {
    const fixture = setup();
    const rows = fixture.componentInstance.rows();
    expect(rows.map((r) => r.id)).toEqual(['earth', 'moon', 'mercury', 'mars', 'venus']);
  });

  it('Moon row is indented, labelled "Moon", status active', () => {
    const fixture = setup();
    const moon = fixture.componentInstance.rows().find((r) => r.id === 'moon')!;
    expect(moon.isIndented).toBe(true);
    expect(moon.displayName).toBe('Moon');
    expect(moon.status).toBe('active');
  });

  it('Mercury row is locked when absent from planets signal', () => {
    const fixture = setup();
    const mercury = fixture.componentInstance.rows().find((r) => r.id === 'mercury')!;
    expect(mercury.status).toBe('locked');
    expect(mercury.phaseName).toBe('Locked');
  });

  it('Mars phaseName is "Warming" when terraformingPhase = 2', () => {
    planetsSignal.set({
      earth: makePlanetState({ id: 'earth' }),
      mars: makePlanetState({ id: 'mars', terraformingPhase: 2 }),
    });
    const fixture = setup();
    fixture.detectChanges();
    const mars = fixture.componentInstance.rows().find((r) => r.id === 'mars')!;
    expect(mars.phaseName).toBe('Warming');
  });

  it('Mars status is "flourishing" when terraformingPhase = 4 (last phase)', () => {
    planetsSignal.set({
      earth: makePlanetState({ id: 'earth' }),
      mars: makePlanetState({ id: 'mars', terraformingPhase: 4 }),
    });
    const fixture = setup();
    fixture.detectChanges();
    const mars = fixture.componentInstance.rows().find((r) => r.id === 'mars')!;
    expect(mars.status).toBe('flourishing');
  });

  it('Earth status is "active" when terraformingPhase = 0 (never flourishing at phase 0)', () => {
    const fixture = setup();
    const earth = fixture.componentInstance.rows().find((r) => r.id === 'earth')!;
    expect(earth.status).toBe('active');
  });

  it('clicking Earth row emits planetSelected$("earth") but not moonTabRequested$', () => {
    const fixture = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    const moonSpy = vi.fn<() => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));
    moonTabRequested$.subscribe(() => moonSpy());

    fixture.componentInstance.onRowClick('earth');

    expect(selectedSpy).toHaveBeenCalledWith('earth');
    expect(moonSpy).not.toHaveBeenCalled();
  });

  it('clicking Moon row emits planetSelected$("earth") AND moonTabRequested$', () => {
    const fixture = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    const moonSpy = vi.fn<() => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));
    moonTabRequested$.subscribe(() => moonSpy());

    fixture.componentInstance.onRowClick('moon');

    expect(selectedSpy).toHaveBeenCalledWith('earth');
    expect(moonSpy).toHaveBeenCalled();
  });

  it('clicking locked Mercury row still emits planetSelected$("mercury")', () => {
    const fixture = setup();
    const selectedSpy = vi.fn<(v: string) => void>();
    planetSelected$.subscribe((v) => selectedSpy(v));

    fixture.componentInstance.onRowClick('mercury');

    expect(selectedSpy).toHaveBeenCalledWith('mercury');
  });

  it('Earth row isSelected when selectedPlanetId input is "earth"', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectedPlanetId', 'earth');
    fixture.detectChanges();
    const earth = fixture.componentInstance.rows().find((r) => r.id === 'earth')!;
    expect(earth.isSelected).toBe(true);
    const mercury = fixture.componentInstance.rows().find((r) => r.id === 'mercury')!;
    expect(mercury.isSelected).toBe(false);
  });

  it('Moon row isSelected when selectedPlanetId input is "earth"', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectedPlanetId', 'earth');
    fixture.detectChanges();
    const moon = fixture.componentInstance.rows().find((r) => r.id === 'moon')!;
    expect(moon.isSelected).toBe(true);
  });
});
