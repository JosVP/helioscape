import { Injectable } from '@angular/core';
import type {
  PlanetData,
  TechNode,
  ResearchTrack,
  CultureEvent,
  TechEffect,
  ResourceStore,
} from '@app/core/models';

// ---------------------------------------------------------------------------
// Inline interfaces for data types not in the model barrel.
// These describe the JSON shapes loaded at startup — not runtime state.
// ---------------------------------------------------------------------------

export interface KardashevMilestone {
  id: string;
  displayName: string;
  description: string;
  /** Human-readable condition strings (e.g. 'dyson_15_percent'). */
  conditions: string[];
  approximateYearRange: string;
  effects: TechEffect[];
}

export interface ResourceData {
  id: string;
  displayName: string;
  description: string;
  rarity: string;
  baseAccumulationRate: number;
  /** Hex colour string (e.g. '#8A8F98'). */
  color: string;
}

export interface MercuryBuildingEffect {
  type: 'resource_rate' | 'dyson_panels_per_year' | 'rp_capacity_boost';
  resourceId?: string;
  rate?: number;
  amount?: number;
}

export interface MercuryBuilding {
  id: string;
  displayName: string;
  description: string;
  category: string;
  cost: ResourceStore;
  energyDrawGw: number;
  buildTimeYears: number;
  repeatable: boolean;
  maxInstances: number | null;
  unlockCondition: string | null;
  placementRule: string;
  effects: MercuryBuildingEffect[];
}

/**
 * An orbital component that can be queued for construction in the Mercury build queue.
 * Separate from grid buildings (MercuryBuilding) — these ship to other planets.
 */
export interface MercuryComponent {
  id: string;
  displayName: string;
  description: string;
  buildTimeYears: number;
  cost: ResourceStore;
  /** A completedTech id or earthFlag key, or null if always available. */
  unlockCondition: string | null;
  /** 1 for singleton components (e.g. ODN), null for stackable. */
  maxInstances: number | null;
  targetEffect: 'odn' | 'precipitationEngine' | 'atmosphericCatalystShip' | 'bioreactor';
}

export interface BioPhaseDef {
  id: string;
  displayName: string;
  nominalDurationYears: number;
  actions: string[];
  requiresComponents: string[];
  requiresRequest?: string;
  /** Progress (0–1) at which the previous phase can hand off early. */
  canStartAtPreviousPercent?: number;
  spilloverTech?: string;
  /** Culture-event ID fired when this phase completes. */
  completeCeId: string;
}

// ---------------------------------------------------------------------------
// DataService
// ---------------------------------------------------------------------------

/**
 * Loads all static game-content JSON files at app startup.
 * Data is immutable after load — never modified at runtime.
 *
 * Call `loadAll()` from the APP_INITIALIZER token in app.config.ts so that
 * all data is available before any component renders.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private planets: Record<string, PlanetData> = {};
  private techTree: TechNode[] = [];
  private researchTracks: ResearchTrack[] = [];
  private cultureEvents: CultureEvent[] = [];
  private milestones: KardashevMilestone[] = [];
  private resources: ResourceData[] = [];
  private mercuryBuildings: MercuryBuilding[] = [];
  private mercuryComponents: MercuryComponent[] = [];
  private bioPhases: Record<string, BioPhaseDef[]> = {};

  /**
   * Fetches all game-data JSON files in parallel and stores them.
   * Throws if any file fails to load — the app must not start with partial data.
   */
  async loadAll(): Promise<void> {
    try {
      const [
        planetsArray,
        techTree,
        researchTracks,
        cultureEvents,
        milestones,
        resources,
        mercuryBuildings,
        bioPhases,
        mercuryComponents,
      ] = await Promise.all([
        this.fetchJson<PlanetData[]>('/data/planets.json'),
        this.fetchJson<TechNode[]>('/data/tech-tree.json'),
        this.fetchJson<ResearchTrack[]>('/data/research-tracks.json'),
        this.fetchJson<CultureEvent[]>('/data/culture-events.json'),
        this.fetchJson<KardashevMilestone[]>('/data/kardashev-milestones.json'),
        this.fetchJson<ResourceData[]>('/data/resources.json'),
        this.fetchJson<MercuryBuilding[]>('/data/mercury-buildings.json'),
        this.fetchJson<Record<string, BioPhaseDef[]>>('/data/bio-phases.json'),
        this.fetchJson<MercuryComponent[]>('/data/mercury-components.json'),
      ]);

      this.planets = planetsArray.reduce(
        (acc, p) => {
          acc[p.id] = p;
          return acc;
        },
        {} as Record<string, PlanetData>,
      );
      this.techTree = techTree;
      this.researchTracks = researchTracks;
      this.cultureEvents = cultureEvents;
      this.milestones = milestones;
      this.resources = resources;
      this.mercuryBuildings = mercuryBuildings;
      this.bioPhases = bioPhases;
      this.mercuryComponents = mercuryComponents;

      console.log('DataService: all game data loaded');
    } catch (error) {
      console.error('DataService: failed to load game data', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Planet accessors
  // -------------------------------------------------------------------------

  /**
   * Returns static data for a planet by id.
   * Throws if the id is unknown — a missing planet is always a bug.
   */
  getPlanet(id: string): PlanetData {
    const planet = this.planets[id];
    if (!planet) {
      throw new Error(`DataService: unknown planet id "${id}"`);
    }
    return planet;
  }

  getAllPlanets(): PlanetData[] {
    return Object.values(this.planets);
  }

  // -------------------------------------------------------------------------
  // Tech-tree accessors
  // -------------------------------------------------------------------------

  getTechNode(id: string): TechNode | undefined {
    return this.techTree.find((t) => t.id === id);
  }

  getTechNodesForPlanet(planetId: string): TechNode[] {
    return this.techTree.filter((t) => t.planet === planetId);
  }

  // -------------------------------------------------------------------------
  // Research-track accessors
  // -------------------------------------------------------------------------

  getResearchTrack(id: string): ResearchTrack | undefined {
    return this.researchTracks.find((t) => t.id === id);
  }

  getResearchTracksForPlanet(planetId: string): ResearchTrack[] {
    return this.researchTracks.filter((t) => t.planet === planetId);
  }

  // -------------------------------------------------------------------------
  // Culture-event accessors
  // -------------------------------------------------------------------------

  getCultureEvent(id: string): CultureEvent | undefined {
    return this.cultureEvents.find((e) => e.id === id);
  }

  getAllCultureEvents(): CultureEvent[] {
    return this.cultureEvents;
  }

  // -------------------------------------------------------------------------
  // Kardashev-milestone accessors
  // -------------------------------------------------------------------------

  getMilestone(id: string): KardashevMilestone | undefined {
    return this.milestones.find((m) => m.id === id);
  }

  getAllMilestones(): KardashevMilestone[] {
    return this.milestones;
  }

  // -------------------------------------------------------------------------
  // Resource accessors
  // -------------------------------------------------------------------------

  getResource(id: string): ResourceData | undefined {
    return this.resources.find((r) => r.id === id);
  }

  getAllResources(): ResourceData[] {
    return this.resources;
  }

  // -------------------------------------------------------------------------
  // Mercury-building accessors
  // -------------------------------------------------------------------------

  getMercuryBuilding(id: string): MercuryBuilding | undefined {
    return this.mercuryBuildings.find((b) => b.id === id);
  }

  getAllMercuryBuildings(): MercuryBuilding[] {
    return this.mercuryBuildings;
  }

  // -------------------------------------------------------------------------
  // Mercury-component accessors
  // -------------------------------------------------------------------------

  getMercuryComponent(id: string): MercuryComponent | undefined {
    return this.mercuryComponents.find((c) => c.id === id);
  }

  getAllMercuryComponents(): MercuryComponent[] {
    return this.mercuryComponents;
  }

  // -------------------------------------------------------------------------
  // Bio-phase accessors
  // -------------------------------------------------------------------------

  getBioPhases(planetId: string): BioPhaseDef[] {
    return this.bioPhases[planetId] ?? [];
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`DataService: HTTP ${response.status} fetching "${path}"`);
    }
    return response.json() as Promise<T>;
  }
}
