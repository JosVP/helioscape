// @vitest-environment jsdom

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  CultureEvent,
  PlanetData,
  PlanetState,
  PlanetTransitEvent,
  PlanetUnlockEvent,
  PlanetUnlockState,
} from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { PlanetUnlockService } from './planet-unlock.service';

function makePlanetData(overrides: Partial<PlanetData>): PlanetData {
  return {
    id: overrides.id ?? 'earth',
    displayName: overrides.displayName ?? 'Earth',
    unlock: overrides.unlock ?? { type: 'start_unlocked' },
    initialState: {
      atmospherePressure: 1,
      temperatureCelsius: 15,
      terraformingPhase: 0,
      axisSpinSpeed: 1,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0,
      atmosphereColor: '#4488ff',
      atmosphereDensity: 0.35,
    },
    visual: {
      baseColor: '#4488ff',
      layerTextures: {},
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases: [{ displayName: 'Phase 0', description: '' }, { displayName: 'Phase 1', description: '' }, { displayName: 'Phase 2', description: '' }],
    ...overrides,
  };
}

function makePlanetState(id: PlanetState['id'], terraformingPhase = 0): PlanetState {
  return {
    id,
    atmospherePressure: 0,
    temperatureCelsius: 0,
    terraformingPhase,
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
    terraformEndYear: 2033,
    marsRadiationClearYear: 0,
  };
}

function makeEvent(id: string): CultureEvent {
  return {
    id,
    title: id,
    narratorText: '',
    portrait: '',
    choices: [],
    tags: [],
    trigger: { type: 'planet_unlocked', planet: 'mercury' },
    priority: false,
  };
}

describe('PlanetUnlockService', () => {
  const gameYear = signal(2033);
  const completedTechs = signal<string[]>([]);
  const planets = signal<Record<string, PlanetState>>({});
  const planetUnlocks = signal<Record<string, PlanetUnlockState>>({});
  const cultureEventQueue = signal<{ eventId: string; queuedAtYear: number; priority: boolean; wasInterrupted: boolean }[]>([]);
  const earthFlags = signal<Record<string, boolean>>({});

  let planetTransitStarted$: Subject<PlanetTransitEvent>;
  let planetUnlocked$: Subject<PlanetUnlockEvent>;
  let lockedPlanetSelected$: Subject<unknown>;

  let planetData: PlanetData[];
  let service: PlanetUnlockService;
  let transitEvents: PlanetTransitEvent[];
  let unlockEvents: PlanetUnlockEvent[];

  beforeEach(() => {
    TestBed.resetTestingModule();
    gameYear.set(2033);
    completedTechs.set([]);
    planets.set({
      earth: makePlanetState('earth'),
      mercury: makePlanetState('mercury'),
      mars: makePlanetState('mars'),
      venus: makePlanetState('venus'),
    });
    planetUnlocks.set({
      earth: { planetId: 'earth', status: 'unlocked', unlockedYear: 2033, firedFlags: [] },
      mercury: {
        planetId: 'mercury',
        status: 'mission_available',
        missionId: 'earth_launch_mercury_mission',
        firedFlags: [],
      },
      mars: { planetId: 'mars', status: 'locked', firedFlags: [] },
      venus: { planetId: 'venus', status: 'locked', firedFlags: [] },
    });
    cultureEventQueue.set([]);
    earthFlags.set({});
    transitEvents = [];
    unlockEvents = [];
    planetTransitStarted$ = new Subject<PlanetTransitEvent>();
    planetUnlocked$ = new Subject<PlanetUnlockEvent>();
    lockedPlanetSelected$ = new Subject<unknown>();
    planetTransitStarted$.subscribe((event) => transitEvents.push(event));
    planetUnlocked$.subscribe((event) => unlockEvents.push(event));

    planetData = [
      makePlanetData({ id: 'earth', displayName: 'Earth', unlock: { type: 'start_unlocked' } }),
      makePlanetData({
        id: 'mercury',
        displayName: 'Mercury',
        unlock: {
          type: 'mission',
          missionId: 'earth_launch_mercury_mission',
          transitYears: 4,
          arrivalEventId: 'ce_mercury_landing',
        },
      }),
      makePlanetData({
        id: 'mars',
        displayName: 'Mars',
        unlock: { type: 'phase', planetId: 'mercury', phase: 2, minOperationalYears: 20 },
      }),
      makePlanetData({
        id: 'venus',
        displayName: 'Venus',
        unlock: {
          type: 'phase',
          planetId: 'mercury',
          phase: 2,
          minOperationalYears: 20,
          eventId: 'ce_venus_unlocked',
          setFlag: 'venus_opening_decision_available',
        },
      }),
    ];

    TestBed.configureTestingModule({
      providers: [
        PlanetUnlockService,
        {
          provide: DataService,
          useValue: {
            getAllPlanets: () => planetData,
            getCultureEvent: (id: string) => makeEvent(id),
          },
        },
        {
          provide: EventBusService,
          useValue: { planetTransitStarted$, planetUnlocked$, lockedPlanetSelected$ },
        },
        {
          provide: GameStateService,
          useValue: {
            gameYear: gameYear.asReadonly(),
            completedTechs: completedTechs.asReadonly(),
            planets: planets.asReadonly(),
            planetUnlocks: planetUnlocks.asReadonly(),
            cultureEventQueue: cultureEventQueue.asReadonly(),
            earthFlags: earthFlags.asReadonly(),
            commitPlanetMission: (
              planetId: string,
              missionId: string,
              transitStartYear: number,
              arrivalYear: number
            ) => {
              planetUnlocks.update((states) => ({
                ...states,
                [planetId]: {
                  ...states[planetId],
                  status: 'in_transit',
                  missionId,
                  committedYear: transitStartYear,
                  transitStartYear,
                  arrivalYear,
                },
              }));
            },
            unlockPlanet: (planetId: string, unlockedYear: number) => {
              planetUnlocks.update((states) => ({
                ...states,
                [planetId]: { ...states[planetId], status: 'unlocked', unlockedYear },
              }));
            },
            getPlanetUnlockState: (planetId: string) => planetUnlocks()[planetId] ?? null,
            addToEventQueue: (entry: { eventId: string; queuedAtYear: number; priority: boolean; wasInterrupted: boolean }) => {
              cultureEventQueue.update((queue) => [...queue, entry]);
            },
            markPlanetUnlockFlagFired: (planetId: string, flagOrEventId: string) => {
              planetUnlocks.update((states) => ({
                ...states,
                [planetId]: {
                  ...states[planetId],
                  firedFlags: [...states[planetId].firedFlags, flagOrEventId],
                },
              }));
            },
            setEarthFlag: (flag: string, value: boolean) => {
              earthFlags.update((flags) => ({ ...flags, [flag]: value }));
            },
          },
        },
      ],
    });

    service = TestBed.inject(PlanetUnlockService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts a data-driven mission transit when the configured mission tech is completed', () => {
    completedTechs.set(['earth_launch_mercury_mission']);

    service.processUnlocks(gameYear(), completedTechs(), planets(), planetUnlocks());

    expect(planetUnlocks()['mercury'].status).toBe('in_transit');
    expect(planetUnlocks()['mercury'].arrivalYear).toBe(2037);
    expect(transitEvents).toEqual([
      {
        planetId: 'mercury',
        missionId: 'earth_launch_mercury_mission',
        departureYear: 2033,
        arrivalYear: 2037,
      },
    ]);
  });

  it('unlocks an arriving mission once and queues the arrival event', () => {
    planetUnlocks.update((states) => ({
      ...states,
      mercury: {
        ...states['mercury'],
        status: 'in_transit',
        arrivalYear: 2037,
        transitStartYear: 2033,
      },
    }));

    service.processUnlocks(2037, completedTechs(), planets(), planetUnlocks());
    service.processUnlocks(2038, completedTechs(), planets(), planetUnlocks());

    expect(planetUnlocks()['mercury'].status).toBe('unlocked');
    expect(cultureEventQueue()).toEqual([
      { eventId: 'ce_mercury_landing', queuedAtYear: 2037, priority: false, wasInterrupted: false },
    ]);
    expect(unlockEvents).toEqual([{ planetId: 'mercury', unlockedYear: 2037 }]);
  });

  it('unlocks Mars and Venus only after Mercury phase and operational-year gates pass', () => {
    planetUnlocks.update((states) => ({
      ...states,
      mercury: { ...states['mercury'], status: 'unlocked', unlockedYear: 2037 },
    }));
    planets.update((states) => ({
      ...states,
      mercury: makePlanetState('mercury', 2),
    }));

    service.processUnlocks(2056, completedTechs(), planets(), planetUnlocks());

    expect(planetUnlocks()['mars'].status).toBe('locked');
    expect(planetUnlocks()['venus'].status).toBe('locked');

    service.processUnlocks(2057, completedTechs(), planets(), planetUnlocks());

    expect(planetUnlocks()['mars'].status).toBe('unlocked');
    expect(planetUnlocks()['venus'].status).toBe('unlocked');
    expect(earthFlags()['venus_opening_decision_available']).toBe(true);
  });
});