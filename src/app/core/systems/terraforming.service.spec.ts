import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { TerraformingService } from './terraforming.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type { PlanetState, PlanetVisualParams, TerraformingChoice, CultureEvent } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVisualParams(overrides: Partial<PlanetVisualParams> = {}): PlanetVisualParams {
  return {
    waterGrowthRadius: 0, waterOpacity: 0,
    greenGrowthRadius: 0, greenOpacity: 0,
    lavaOpacity: 0,       lavaHueShift: 0,
    cloudOpacity: 0,      atmosphereDensity: 0,
    atmosphereColor: '#000000', cloudRotationSpeed: 0,
    axisSpinSpeed: 1,     cityLightsIntensity: 0,
    ...overrides,
    axisRotationDirection: overrides.axisRotationDirection ?? 'prograde',
  };
}

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
    visualParams: makeVisualParams(),
    terraformStartYear: 2033,
    terraformEndYear: 2033,
    marsRadiationClearYear: 0,
    ...overrides,
  };
}

function makeChoice(overrides: Partial<TerraformingChoice> = {}): TerraformingChoice {
  return { active: true, startedYear: 2033, permanent: false, ...overrides };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  planets?: Record<string, PlanetState>;
  gameYear?: number;
} = {}) {
  const planetsSignal = signal<Record<string, PlanetState>>(opts.planets ?? {});
  const gameYearSignal = signal<number>(opts.gameYear ?? 2033);

  return {
    planets: planetsSignal.asReadonly(),
    gameYear: gameYearSignal.asReadonly(),

    // Write helpers for tests
    _setPlanets: (v: Record<string, PlanetState>) => planetsSignal.set(v),
    _advanceYear: () => gameYearSignal.update((y) => y + 1),
    _setYear: (y: number) => gameYearSignal.set(y),

    // Mutation spies
    updatePlanetAtmosphere: vi.fn((planetId: string, pressureDelta: number, tempDelta: number) => {
      planetsSignal.update((planets) => {
        const planet = planets[planetId];
        if (!planet) return planets;
        return {
          ...planets,
          [planetId]: {
            ...planet,
            atmospherePressure: Math.max(0, planet.atmospherePressure + pressureDelta),
            temperatureCelsius: planet.temperatureCelsius + tempDelta,
          },
        };
      });
    }),
    setTerraformingProgress: vi.fn((planetId: string, progress: number) => {
      planetsSignal.update((planets) => {
        const planet = planets[planetId];
        if (!planet) return planets;
        return { ...planets, [planetId]: { ...planet, terraformingProgress: progress } };
      });
    }),
    advanceTerraformingPhase: vi.fn((planetId: string) => {
      planetsSignal.update((planets) => {
        const planet = planets[planetId];
        if (!planet) return planets;
        return {
          ...planets,
          [planetId]: {
            ...planet,
            terraformingPhase: planet.terraformingPhase + 1,
            terraformingProgress: 0,
          },
        };
      });
    }),
    lockOutTerraformingChoices: vi.fn(),
    setTerraformTransitionYears: vi.fn((planetId: string, start: number, end: number) => {
      planetsSignal.update((planets) => {
        const planet = planets[planetId];
        if (!planet) return planets;
        return { ...planets, [planetId]: { ...planet, terraformStartYear: start, terraformEndYear: end } };
      });
    }),
    setMarsRadiationClearYear: vi.fn(),
    applyTerraformingChoice: vi.fn((planetId: string, choiceId: string, permanent: boolean) => {
      planetsSignal.update((planets) => {
        const planet = planets[planetId];
        if (!planet) return planets;
        return {
          ...planets,
          [planetId]: {
            ...planet,
            terraformingChoices: {
              ...planet.terraformingChoices,
              [choiceId]: { active: true, startedYear: 2033, permanent },
            },
          },
        };
      });
    }),
    updatePlanetVisualParams: vi.fn(),
    addPriorityEvent: vi.fn(),
    authoriseEuropa: vi.fn(),
  };
}

function makeDataFake(events: CultureEvent[] = []) {
  return {
    getCultureEvent: vi.fn((id: string) => events.find((e) => e.id === id)),
  };
}

function makeEventBusFake() {
  return {
    terraformingPhaseChanged$: new Subject<{ planetId: string; phase: number }>(),
    terraformingChoiceApplied$: new Subject<{ planetId: string; choiceId: string }>(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('TerraformingService', () => {
  let service: TerraformingService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;

  function setup(opts: Parameters<typeof makeGameStateFake>[0] = {}, events: CultureEvent[] = []) {
    gameState = makeGameStateFake(opts);
    data = makeDataFake(events);
    eventBus = makeEventBusFake();

    TestBed.configureTestingModule({
      providers: [
        TerraformingService,
        { provide: DataService, useValue: data },
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService, useValue: eventBus },
      ],
    });

    service = TestBed.inject(TerraformingService);
  }

  beforeEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // processYear — no planets
  // -------------------------------------------------------------------------

  describe('processYear — no unlocked planets', () => {
    it('does not call updatePlanetAtmosphere when planets record is empty', () => {
      setup({ planets: {}, gameYear: 2033 });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.updatePlanetAtmosphere).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // processYear — Mars, no active choices
  // -------------------------------------------------------------------------

  describe('processYear — Mars unlocked, no active choices', () => {
    it('calls updatePlanetAtmosphere with zero deltas and does not advance progress', () => {
      const mars = makePlanetState({ terraformingChoices: {} });
      setup({ planets: { mars }, gameYear: 2033 });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.updatePlanetAtmosphere).toHaveBeenCalledWith('mars', 0, 0);
      // Progress stays 0 (min(1, 0+0) = 0)
      expect(gameState.setTerraformingProgress).toHaveBeenCalledWith('mars', 0);
      expect(gameState.advanceTerraformingPhase).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // processYear — Mars, one active choice
  // -------------------------------------------------------------------------

  describe('processYear — Mars with mars_orbital_mirrors active', () => {
    it('applies correct pressure, temperature, and progress deltas', () => {
      const mars = makePlanetState({
        terraformingProgress: 0,
        terraformingChoices: { mars_orbital_mirrors: makeChoice() },
      });
      setup({ planets: { mars }, gameYear: 2033 });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      // mars_orbital_mirrors: pressureRate=0.0001, tempRate=0.3
      expect(gameState.updatePlanetAtmosphere).toHaveBeenCalledWith('mars', 0.0001, 0.3);
      // phaseContribution=0.025; min(1, 0+0.025)=0.025
      expect(gameState.setTerraformingProgress).toHaveBeenCalledWith('mars', 0.025);
    });
  });

  // -------------------------------------------------------------------------
  // processYear — phase advances when progress >= 1
  // -------------------------------------------------------------------------

  describe('processYear — progress reaches 1.0', () => {
    it('advances phase, resets progress, emits event, and queues CE', () => {
      const phaseEvent: CultureEvent = {
        id: 'ce_mars_phase_1', title: 'Test', narratorText: 'Test',
        portrait: '', choices: [], tags: [], trigger: null as unknown as never, priority: true,
      };

      // Progress is already 0.98; one tick of polar_detonation (0.04) pushes it to 1.02 → clamped to 1.0
      // The initial effect fires with year 2100 — that is the tick that crosses 1.0.
      const mars = makePlanetState({
        terraformingProgress: 0.98,
        terraformingChoices: { mars_polar_detonation: makeChoice() },
      });
      setup({ planets: { mars }, gameYear: 2100 }, [phaseEvent]);

      const phaseChangedSpy = vi.fn();
      eventBus.terraformingPhaseChanged$.subscribe(phaseChangedSpy);

      TestBed.flushEffects(); // fires processYear(2100) — progress becomes 1.0, phase advances

      expect(gameState.advanceTerraformingPhase).toHaveBeenCalledWith('mars');
      expect(gameState.setTerraformTransitionYears).toHaveBeenCalledWith('mars', 2100, 2400);
      expect(phaseChangedSpy).toHaveBeenCalledWith({ planetId: 'mars', phase: 1 });
      expect(gameState.addPriorityEvent).toHaveBeenCalledWith('ce_mars_phase_1', 2100);
    });

    it('does not queue CE when event id is missing from data', () => {
      // data returns undefined for any CE id
      const mars = makePlanetState({
        terraformingProgress: 0.98,
        terraformingChoices: { mars_polar_detonation: makeChoice() },
      });
      setup({ planets: { mars }, gameYear: 2100 }, []); // no events in data

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.addPriorityEvent).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // processYear — progress below 1.0 does NOT advance phase
  // -------------------------------------------------------------------------

  describe('processYear — progress below 1.0', () => {
    it('does not call advanceTerraformingPhase', () => {
      const mars = makePlanetState({
        terraformingProgress: 0.5,
        terraformingChoices: { mars_orbital_mirrors: makeChoice() },
      });
      setup({ planets: { mars }, gameYear: 2033 });

      TestBed.flushEffects();
      gameState._advanceYear();
      TestBed.flushEffects();

      expect(gameState.advanceTerraformingPhase).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // applyChoice — normal choice
  // -------------------------------------------------------------------------

  describe('applyChoice — standard choice', () => {
    it('calls applyTerraformingChoice and emits terraformingChoiceApplied$', () => {
      const mars = makePlanetState();
      setup({ planets: { mars }, gameYear: 2033 });
      TestBed.flushEffects();

      const choiceSpy = vi.fn();
      eventBus.terraformingChoiceApplied$.subscribe(choiceSpy);

      service.applyChoice('mars', 'mars_orbital_mirrors', true);

      expect(gameState.applyTerraformingChoice).toHaveBeenCalledWith(
        'mars', 'mars_orbital_mirrors', true
      );
      expect(choiceSpy).toHaveBeenCalledWith({ planetId: 'mars', choiceId: 'mars_orbital_mirrors' });
    });
  });

  // -------------------------------------------------------------------------
  // applyChoice — locked-out choice is rejected silently
  // -------------------------------------------------------------------------

  describe('applyChoice — choice in lockedOutChoices', () => {
    it('does not call applyTerraformingChoice and does not emit event', () => {
      const mars = makePlanetState({ lockedOutChoices: ['mars_magnetic_umbrella'] });
      setup({ planets: { mars }, gameYear: 2033 });
      TestBed.flushEffects();

      const choiceSpy = vi.fn();
      eventBus.terraformingChoiceApplied$.subscribe(choiceSpy);

      service.applyChoice('mars', 'mars_magnetic_umbrella', false);

      expect(gameState.applyTerraformingChoice).not.toHaveBeenCalled();
      expect(choiceSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // applyChoice — mars_polar_detonation special case
  // -------------------------------------------------------------------------

  describe('applyChoice — mars_polar_detonation', () => {
    it('sets radiation clear year (+40) and locks out incompatible choices', () => {
      const mars = makePlanetState();
      setup({ planets: { mars }, gameYear: 2050 });
      TestBed.flushEffects();

      service.applyChoice('mars', 'mars_polar_detonation', true);

      expect(gameState.setMarsRadiationClearYear).toHaveBeenCalledWith('mars', 2050 + 40);
      expect(gameState.lockOutTerraformingChoices).toHaveBeenCalledWith('mars', [
        'mars_magnetic_umbrella',
        'mars_biological_seeding',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // applyChoice — venus_europa_impact special case
  // -------------------------------------------------------------------------

  describe('applyChoice — venus_europa_impact', () => {
    it('authorises Europa with impact year in range [currentYear+50, currentYear+70]', () => {
      const venus = makePlanetState({ id: 'venus' });
      setup({ planets: { venus }, gameYear: 2200 });
      TestBed.flushEffects();

      service.applyChoice('venus', 'venus_europa_impact', true);

      expect(gameState.authoriseEuropa).toHaveBeenCalledTimes(1);
      const impactYear = (gameState.authoriseEuropa as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(impactYear).toBeGreaterThanOrEqual(2200 + 50);
      expect(impactYear).toBeLessThanOrEqual(2200 + 70);
    });
  });

  // -------------------------------------------------------------------------
  // _computeAndUpdateVisualParams — phase 0, year <= startYear
  // -------------------------------------------------------------------------

  describe('_computeAndUpdateVisualParams — year before transition window', () => {
    it('sets visual params to phase-0 from-values when year <= terraformStartYear', () => {
      const mars = makePlanetState({
        terraformingPhase: 0,
        terraformStartYear: 2100,
        terraformEndYear: 2400,
      });
      // Year is 2033, before the transition window starts at 2100
      setup({ planets: { mars }, gameYear: 2033 });

      TestBed.flushEffects();

      const calls = (gameState.updatePlanetVisualParams as ReturnType<typeof vi.fn>).mock.calls;
      // There should have been at least one call (from the initial effect tick)
      expect(calls.length).toBeGreaterThan(0);
      const params = calls[calls.length - 1][1]; // last call's params arg
      // At year <= startYear, getValueAtYear returns startValue (phase-0 from values)
      expect(params.atmosphereDensity).toBeCloseTo(0.02, 5);
      expect(params.atmosphereColor).toBe('#c1440e');
    });
  });

  // -------------------------------------------------------------------------
  // _computeAndUpdateVisualParams — year at endYear
  // -------------------------------------------------------------------------

  describe('_computeAndUpdateVisualParams — year at terraformEndYear', () => {
    it('sets visual params to phase-1 to-values when year >= terraformEndYear', () => {
      const mars = makePlanetState({
        terraformingPhase: 0,
        terraformStartYear: 2100,
        terraformEndYear: 2400,
      });
      setup({ planets: { mars }, gameYear: 2400 });

      TestBed.flushEffects();

      const calls = (gameState.updatePlanetVisualParams as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const params = calls[calls.length - 1][1];
      // At year >= endYear, getValueAtYear returns endValue (phase-1 to values)
      expect(params.atmosphereDensity).toBeCloseTo(0.08, 5);
      expect(params.atmosphereColor).toBe('#d4633a');
    });
  });
});
