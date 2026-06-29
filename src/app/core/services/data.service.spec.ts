import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataService } from './data.service';
import type { PlanetData, ResearchNode } from '@app/core/models';

// ---------------------------------------------------------------------------
// Minimal fixture data matching the real JSON shapes
// ---------------------------------------------------------------------------

const fakePlanets: PlanetData[] = [
  {
    id: 'earth',
    displayName: 'Earth',
    unlock: { type: 'start_unlocked' },
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
    unlock: { type: 'phase', planetId: 'mercury', phase: 2 },
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

const fakeResearchNodes: ResearchNode[] = [
  {
    id: 'earth_launch_mercury_mission',
    planet: 'earth',
    displayName: 'Launch Mercury Mission',
    category: 'capability',
    tier: 1,
    description: 'We launch the Mercury mission.',
    outcomeSummary: ['Unlocks Mercury.'],
    unlockCondition: 'Available from the beginning.',
    prerequisites: [],
    spilloverPrerequisites: [],
    durationYears: 0,
    effects: [],
  },
  {
    id: 'mars_polar_detonation',
    planet: 'mars',
    displayName: 'Polar Detonation',
    category: 'reactive',
    tier: 1,
    description: 'We choose a fast warming path for Mars.',
    outcomeSummary: ['Applies a Mars terraforming choice.'],
    unlockCondition: 'Reach Mars terraforming planning.',
    prerequisites: [],
    spilloverPrerequisites: [],
    durationYears: 20,
    effects: [{ type: 'tag_decision', tag: 'architect' }],
  },
  {
    id: 'moon_low_grav_medicine_track',
    planet: 'moon',
    displayName: 'Low-Gravity Medicine Program',
    category: 'capability',
    tier: 1,
    description: 'We study how bones adapt.',
    outcomeSummary: ['Improves lunar medicine.'],
    unlockCondition: 'Complete Launch Mercury Mission.',
    prerequisites: ['earth_launch_mercury_mission'],
    spilloverPrerequisites: [],
    durationYears: 30,
    effects: [],
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
    '/data/research-tracks.json': fakeResearchNodes,
    '/data/research-layout.json': {
      hexSize: 38,
      hexGap: 12,
      regions: [{ id: 'earth-center', displayName: 'Earth', anchor: { q: 0, r: 0 } }],
      nodes: fakeResearchNodes.map((node, index) => ({
        nodeId: node.id,
        q: index * 2,
        r: 0,
        region: 'earth-center',
      })),
    },
    '/data/research-arcs.json': [],
    '/data/culture-events.json': fakeCultureEvents,
    '/data/kardashev-milestones.json': fakeMilestones,
    '/data/resources.json': fakeResources,
    '/data/mercury-buildings.json': [],
    '/data/mercury-components.json': [],
    '/data/bio-phases.json': {},
    '/data/mercury-map.json': {
      gridCols: 128,
      gridRows: 128,
      terrainRules: [],
      craterOverrides: [],
      slots: [],
      miningLocations: [],
      startingZones: [],
    },
    '/data/moon.json': {
      id: 'moon',
      displayName: 'Moon',
      subtitle: 'Artemis Base',
      description: 'Test moon description.',
      facilities: [],
    },
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
    it('fetches all JSON files in parallel and logs success', async () => {
      mockFetchFor(service);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const fetchMock = vi.mocked(fetch);

      await service.loadAll();

      expect(fetchMock).toHaveBeenCalledTimes(12);
      expect(fetchMock).not.toHaveBeenCalledWith('/data/tech-tree.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/planets.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/research-tracks.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/research-layout.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/research-arcs.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/mercury-buildings.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/mercury-components.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/bio-phases.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/mercury-map.json');
      expect(fetchMock).toHaveBeenCalledWith('/data/moon.json');
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

  describe('research-node accessors', () => {
    beforeEach(async () => {
      mockFetchFor(service);
      await service.loadAll();
    });

    it('getResearchNode() returns a node by id', () => {
      const node = service.getResearchNode('earth_launch_mercury_mission');
      expect(node).toBeDefined();
      expect(node?.displayName).toBe('Launch Mercury Mission');
    });

    it('getResearchNode() returns undefined for an unknown id', () => {
      expect(service.getResearchNode('nonexistent')).toBeUndefined();
    });

    it('getResearchNodesForPlanet() filters correctly', () => {
      const earthNodes = service.getResearchNodesForPlanet('earth');
      expect(earthNodes).toHaveLength(1);
      expect(earthNodes[0].id).toBe('earth_launch_mercury_mission');
    });

    it('getAllResearchNodes() returns all canonical research nodes', () => {
      expect(service.getAllResearchNodes()).toHaveLength(3);
    });

    it('getResearchLayout() returns authored layout metadata', () => {
      const layout = service.getResearchLayout();
      expect(layout.hexSize).toBe(38);
      expect(layout.nodes).toHaveLength(fakeResearchNodes.length);
    });

    it('getResearchLayoutNode() returns a layout entry by node id', () => {
      const layoutNode = service.getResearchLayoutNode('earth_launch_mercury_mission');
      expect(layoutNode).toEqual({
        nodeId: 'earth_launch_mercury_mission',
        q: 0,
        r: 0,
        region: 'earth-center',
      });
    });

    it('getTechNode() temporarily returns a node by id', () => {
      const node = service.getTechNode('earth_launch_mercury_mission');
      expect(node).toBeDefined();
      expect(node?.displayName).toBe('Launch Mercury Mission');
    });

    it('getTechNode() returns undefined for an unknown id', () => {
      expect(service.getTechNode('nonexistent')).toBeUndefined();
    });

    it('getTechNodesForPlanet() temporarily filters correctly', () => {
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

    it('getResearchTracksForPlanet() temporarily returns node-backed tracks for a planet', () => {
      const tracks = service.getResearchTracksForPlanet('moon');
      expect(tracks).toHaveLength(1);
      expect(tracks[0].id).toBe('moon_low_grav_medicine_track');
    });

    it('getAllResearchArcs() returns loaded arc definitions', () => {
      expect(service.getAllResearchArcs()).toEqual([]);
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

  describe('moon accessors', () => {
    it('getMoonData() throws before loadAll() is called', () => {
      expect(() => service.getMoonData()).toThrow('DataService: moon data not loaded');
    });

    it('getMoonData() returns moon data after loadAll()', async () => {
      mockFetchFor(service);
      await service.loadAll();
      const moon = service.getMoonData();
      expect(moon.id).toBe('moon');
      expect(moon.displayName).toBe('Moon');
      expect(moon.subtitle).toBe('Artemis Base');
    });
  });
});
