import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataService } from './data.service';
import type { PlanetData, TechNode, ResearchTrack } from '@app/core/models';

// ---------------------------------------------------------------------------
// Minimal fixture data matching the real JSON shapes
// ---------------------------------------------------------------------------

const fakePlanets: PlanetData[] = [
  {
    id: 'earth',
    displayName: 'Earth',
    unlockCondition: null,
    initialState: {
      atmospherePressure: 1.0,
      temperatureCelsius: 15,
      terraformingPhase: 0,
      axisSpinSpeed: 1.0,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0.002,
      atmosphereColor: '#4488ff',
      atmosphereDensity: 0.35,
    },
    visual: {
      baseColor: '#4a6fb3',
      layerTextures: {},
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases: [{ displayName: 'Industrial Age', description: '' }, { displayName: 'Space Age', description: '' }],
  },
  {
    id: 'mars',
    displayName: 'Mars',
    unlockCondition: 'mercury_phase_2_complete',
    initialState: {
      atmospherePressure: 0.006,
      temperatureCelsius: -60,
      terraformingPhase: 0,
      axisSpinSpeed: 0.97,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0,
      atmosphereColor: '#cc6644',
      atmosphereDensity: 0.05,
    },
    visual: {
      baseColor: '#c1440e',
      layerTextures: {},
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases: [{ displayName: 'Barren', description: '' }, { displayName: 'Flourishing', description: '' }],
  },
];

const fakeTechTree: TechNode[] = [
  {
    id: 'earth_launch_mercury_mission',
    planet: 'earth',
    displayName: 'Launch Mercury Mission',
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 0,
    durationYears: 0,
    effects: [],
  },
  {
    id: 'mars_polar_detonation',
    planet: 'mars',
    displayName: 'Polar Detonation',
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 60,
    durationYears: 20,
    effects: [{ type: 'tag_decision', tag: 'architect' }],
  },
];

const fakeResearchTracks: ResearchTrack[] = [
  {
    id: 'moon_low_grav_medicine_track',
    displayName: 'Low-Gravity Medicine Program',
    planet: 'moon',
    rpCost: 25,
    durationYears: 30,
    description: 'We study how bones adapt.',
    prerequisiteTech: 'earth_launch_mercury_mission',
    onCompleteEffects: [],
  },
];

const fakeCultureEvents = [
  {
    id: 'ce_mercury_landing',
    title: 'First Steps on Mercury',
    narratorText: 'We have touched down.',
    portrait: '/assets/svg/portraits/ce_mercury_landing.svg',
    choices: [],
    tags: [],
    trigger: { type: 'tech_completed', techId: 'earth_launch_mercury_mission' },
    priority: false,
  },
];

const fakeMilestones = [
  {
    id: 'type_1',
    displayName: 'Type I Civilisation',
    description: 'We draw on our star.',
    conditions: ['dyson_15_percent'],
    approximateYearRange: 'Year 80-120',
    effects: [],
  },
];

const fakeResources = [
  {
    id: 'common_ore',
    displayName: 'Common Ore',
    description: 'Iron',
    rarity: 'common',
    baseAccumulationRate: 10,
    color: '#8A8F98',
  },
];

// ---------------------------------------------------------------------------
// Mock fetch helper
// ---------------------------------------------------------------------------

function mockFetchFor(service: DataService, overrides: Record<string, unknown> = {}): void {
  const defaults: Record<string, unknown> = {
    '/data/planets.json': fakePlanets,
    '/data/tech-tree.json': fakeTechTree,
    '/data/research-tracks.json': fakeResearchTracks,
    '/data/culture-events.json': fakeCultureEvents,
    '/data/kardashev-milestones.json': fakeMilestones,
    '/data/resources.json': fakeResources,
    '/data/mercury-buildings.json': [],
    '/data/bio-phases.json': {},
    ...overrides,
  };

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const body = defaults[url];
      if (body === undefined) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      } as Response);
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    service = new DataService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll()', () => {
    it('fetches all 8 JSON files in parallel and logs success', async () => {
      mockFetchFor(service);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const fetchMock = vi.mocked(fetch);

      await service.loadAll();

      expect(fetchMock).toHaveBeenCalledTimes(8);
      expect(fetchMock).toHaveBeenCalledWith('/data/planets.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/tech-tree.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/mercury-buildings.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/bio-phases.json');
      expect(consoleSpy).toHaveBeenCalledWith('DataService: all game data loaded');

      consoleSpy.mockRestore();
    });

    it('throws and logs an error when a file returns a non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          url === '/data/planets.json'
            ? Promise.resolve({ ok: false, status: 500 } as Response)
            : Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([]),
              } as Response),
        ),
      );
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(service.loadAll()).rejects.toThrow(
        'DataService: HTTP 500 fetching "/data/planets.json"',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'DataService: failed to load game data',
        expect.any(Error),
      );

      errorSpy.mockRestore();
    });
  });

  describe('planet accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getPlanet() returns planet data by id', () => {
      const planet = service.getPlanet('earth');
      expect(planet.displayName).toBe('Earth');
      expect(planet.id).toBe('earth');
    });

    it('getPlanet() throws for an unknown planet id', () => {
      expect(() => service.getPlanet('neptune')).toThrow(
        'DataService: unknown planet id "neptune"',
      );
    });

    it('getAllPlanets() returns all loaded planets', () => {
      const planets = service.getAllPlanets();
      expect(planets).toHaveLength(2);
      expect(planets.map((p) => p.id)).toContain('earth');
      expect(planets.map((p) => p.id)).toContain('mars');
    });
  });

  describe('tech-tree accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getTechNode() returns a node by id', () => {
      const node = service.getTechNode('earth_launch_mercury_mission');
      expect(node).toBeDefined();
      expect(node?.displayName).toBe('Launch Mercury Mission');
    });

    it('getTechNode() returns undefined for an unknown id', () => {
      expect(service.getTechNode('nonexistent')).toBeUndefined();
    });

    it('getTechNodesForPlanet() filters correctly', () => {
      const earthNodes = service.getTechNodesForPlanet('earth');
      expect(earthNodes).toHaveLength(1);
      expect(earthNodes[0].id).toBe('earth_launch_mercury_mission');
    });

    it('getTechNodesForPlanet() returns empty array for unknown planet', () => {
      expect(service.getTechNodesForPlanet('jupiter')).toEqual([]);
    });
  });

  describe('research-track accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getResearchTrack() returns a track by id', () => {
      const track = service.getResearchTrack('moon_low_grav_medicine_track');
      expect(track).toBeDefined();
      expect(track?.displayName).toBe('Low-Gravity Medicine Program');
    });

    it('getResearchTrack() returns undefined for unknown id', () => {
      expect(service.getResearchTrack('nonexistent')).toBeUndefined();
    });

    it('getResearchTracksForPlanet() returns empty array for planet with no tracks', () => {
      expect(service.getResearchTracksForPlanet('mars')).toEqual([]);
    });
  });

  describe('culture-event accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getCultureEvent() returns an event by id', () => {
      const ev = service.getCultureEvent('ce_mercury_landing');
      expect(ev).toBeDefined();
      expect(ev?.title).toBe('First Steps on Mercury');
    });

    it('getCultureEvent() returns undefined for unknown id', () => {
      expect(service.getCultureEvent('nonexistent')).toBeUndefined();
    });

    it('getAllCultureEvents() returns all events', () => {
      expect(service.getAllCultureEvents()).toHaveLength(1);
    });
  });

  describe('milestone accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getMilestone() returns a milestone by id', () => {
      const m = service.getMilestone('type_1');
      expect(m).toBeDefined();
      expect(m?.displayName).toBe('Type I Civilisation');
    });

    it('getAllMilestones() returns all milestones', () => {
      expect(service.getAllMilestones()).toHaveLength(1);
    });
  });

  describe('Mercury-building accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getAllMercuryBuildings() returns empty array when no buildings are loaded', () => {
      expect(service.getAllMercuryBuildings()).toEqual([]);
    });

    it('getMercuryBuilding() returns undefined when no buildings are loaded', () => {
      expect(service.getMercuryBuilding('any_id')).toBeUndefined();
    });
  });

  describe('bio-phase accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getBioPhases() returns empty array for a planet with no phases', () => {
      expect(service.getBioPhases('mars')).toEqual([]);
    });

    it('getBioPhases() returns phases when present', async () => {
      service = new DataService();
      mockFetchFor(service, {
        '/data/bio-phases.json': {
          mars: [
            {
              id: 'bp_pioneer',
              displayName: 'Pioneer',
              nominalDurationYears: 50,
              actions: [],
              requiresComponents: [],
              completeCeId: 'ce_pioneer_complete',
            },
          ],
        },
      });
      await service.loadAll();
      const phases = service.getBioPhases('mars');
      expect(phases).toHaveLength(1);
      expect(phases[0].id).toBe('bp_pioneer');
    });
  });
});
