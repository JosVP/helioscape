import { Injectable, inject, computed, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import type {
  PlanetState,
  PlanetUnlockState,
  PlanetVisualParams,
  PlanetBioState,
  BioPhaseState,
  SerializedGameState,
  PendingFork,
  ResourceStore,
  PlacedBuilding,
  MercuryQueueEntry,
  EuropaState,
  ActiveResearchTrack,
  TechEffect,
  CultureEventEntry,
  CultureEventHistoryEntry,
  MercuryMinerState,
  MercurySlotStatus,
} from '@app/core/models';
import { DataService } from './data.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The game year when a new campaign begins. */
const INITIAL_YEAR = 2033;

/** Base research-point capacity before any boosts. */
const BASE_RP_CAPACITY = 60;

/** Initial Mercury resource store. */
const INITIAL_RESOURCES: Readonly<ResourceStore> = {
  commonOre: 0,
  rareMetals: 0,
  polarVolatiles: 0,
};

/** Initial Mercury miner state. */
const INITIAL_MINERS: Readonly<MercuryMinerState> = { poolCount: 3, assignments: {} };

/** Initial resource reservations (all zero). */
const INITIAL_RESERVATIONS: Readonly<ResourceStore> = {
  commonOre: 0,
  rareMetals: 0,
  polarVolatiles: 0,
};

/** Initial Europa mission state. */
const INITIAL_EUROPA: Readonly<EuropaState> = {
  missionAuthorised: false,
  impactYear: 0,
  impacted: false,
  lifeConfirmed: false,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Single source of truth for all mutable runtime game state.
 *
 * - Holds private writable signals, exposes public readonly signals.
 * - Provides typed mutation methods; no other service mutates state directly.
 * - System services react to state via effect() and call mutation methods here.
 */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly data = inject(DataService);

  // -------------------------------------------------------------------------
  // Private writable signals
  // -------------------------------------------------------------------------

  private readonly _gameYear = signal<number>(INITIAL_YEAR);
  private readonly _gameSpeed = signal<1 | 4>(1);
  private readonly _isPaused = signal<boolean>(false);
  private readonly _isFirstPlaythrough = signal<boolean>(true);
  private readonly _currentSaveSlot = signal<number>(0);

  private readonly _planets = signal<Record<string, PlanetState>>({});
  private readonly _completedTechs = signal<string[]>([]);
  private readonly _activeResearch = signal<ActiveResearchTrack[]>([]);
  private readonly _pendingFork = signal<PendingFork | null>(null);
  private readonly _planetUnlocks = signal<Record<string, PlanetUnlockState>>({});

  private readonly _mercuryResources = signal<ResourceStore>({ ...INITIAL_RESOURCES });
  private readonly _mercuryBuildings = signal<PlacedBuilding[]>([]);
  private readonly _mercuryBuildQueue = signal<MercuryQueueEntry[]>([]);

  private readonly _dysonPanelCount = signal<number>(0);
  // NOTE: No public setter for dysonPanelTier — updated via hydrate() and a future
  // DysonService upgrade method. Exposed readonly for consumers that need to render it.
  private readonly _dysonPanelTier = signal<'basic' | 'mid' | 'hardened'>('basic');
  private readonly _dysonCoveragePercent = signal<number>(0);
  private readonly _dysonEnergyWatts = signal<number>(0);

  private readonly _kardashevLevel = signal<number>(0);
  private readonly _completedMilestones = signal<string[]>([]);

  private readonly _naturalistCount = signal<number>(0);
  private readonly _architectCount = signal<number>(0);
  private readonly _colonistBonuses = signal<{ denseLiving: boolean; openEnvironment: boolean }>({
    denseLiving: false,
    openEnvironment: false,
  });
  private readonly _earthFlags = signal<Record<string, boolean>>({});

  private readonly _cultureEventQueue = signal<CultureEventEntry[]>([]);
  private readonly _cultureEventHistory = signal<CultureEventHistoryEntry[]>([]);

  private readonly _bioPhases = signal<Record<string, PlanetBioState>>({});
  private readonly _europaState = signal<EuropaState>({ ...INITIAL_EUROPA });

  // Mercury RTS (Block 9.6)
  private readonly _mercurySelectedZone = signal<string | null>(null);
  private readonly _mercuryMiners = signal<MercuryMinerState>({ ...INITIAL_MINERS, assignments: {} });
  private readonly _mercurySlotStates = signal<Record<string, MercurySlotStatus>>({});
  private readonly _resourceReservations = signal<ResourceStore>({ ...INITIAL_RESERVATIONS });

  // -------------------------------------------------------------------------
  // Public readonly signals
  // -------------------------------------------------------------------------

  readonly gameYear: Signal<number> = this._gameYear.asReadonly();
  readonly gameSpeed: Signal<1 | 4> = this._gameSpeed.asReadonly();
  readonly isPaused: Signal<boolean> = this._isPaused.asReadonly();
  readonly isFirstPlaythrough: Signal<boolean> = this._isFirstPlaythrough.asReadonly();
  readonly currentSaveSlot: Signal<number> = this._currentSaveSlot.asReadonly();

  readonly planets: Signal<Record<string, PlanetState>> = this._planets.asReadonly();
  readonly completedTechs: Signal<string[]> = this._completedTechs.asReadonly();
  readonly activeResearch: Signal<ActiveResearchTrack[]> = this._activeResearch.asReadonly();
  readonly pendingFork: Signal<PendingFork | null> = this._pendingFork.asReadonly();
  readonly planetUnlocks: Signal<Record<string, PlanetUnlockState>> = this._planetUnlocks.asReadonly();

  readonly mercuryResources: Signal<ResourceStore> = this._mercuryResources.asReadonly();
  readonly mercuryBuildings: Signal<PlacedBuilding[]> = this._mercuryBuildings.asReadonly();
  readonly mercuryBuildQueue: Signal<MercuryQueueEntry[]> = this._mercuryBuildQueue.asReadonly();

  readonly dysonPanelCount: Signal<number> = this._dysonPanelCount.asReadonly();
  readonly dysonPanelTier: Signal<'basic' | 'mid' | 'hardened'> = this._dysonPanelTier.asReadonly();
  readonly dysonCoveragePercent: Signal<number> = this._dysonCoveragePercent.asReadonly();
  readonly dysonEnergyWatts: Signal<number> = this._dysonEnergyWatts.asReadonly();

  readonly kardashevLevel: Signal<number> = this._kardashevLevel.asReadonly();
  readonly completedMilestones: Signal<string[]> = this._completedMilestones.asReadonly();

  readonly naturalistCount: Signal<number> = this._naturalistCount.asReadonly();
  readonly architectCount: Signal<number> = this._architectCount.asReadonly();
  readonly colonistBonuses: Signal<{ denseLiving: boolean; openEnvironment: boolean }> =
    this._colonistBonuses.asReadonly();
  readonly earthFlags: Signal<Record<string, boolean>> = this._earthFlags.asReadonly();

  readonly cultureEventQueue: Signal<CultureEventEntry[]> = this._cultureEventQueue.asReadonly();
  readonly cultureEventHistory: Signal<CultureEventHistoryEntry[]> =
    this._cultureEventHistory.asReadonly();

  readonly bioPhases: Signal<Record<string, PlanetBioState>> = this._bioPhases.asReadonly();
  readonly europaState: Signal<EuropaState> = this._europaState.asReadonly();

  // Mercury RTS (Block 9.6)
  readonly mercurySelectedZone: Signal<string | null> = this._mercurySelectedZone.asReadonly();
  readonly mercuryMiners: Signal<MercuryMinerState> = this._mercuryMiners.asReadonly();
  readonly mercurySlotStates: Signal<Record<string, MercurySlotStatus>> = this._mercurySlotStates.asReadonly();
  readonly resourceReservations: Signal<ResourceStore> = this._resourceReservations.asReadonly();

  // -------------------------------------------------------------------------
  // Computed signals
  // -------------------------------------------------------------------------

  /**
   * Sum of rp_capacity_boost effects from completed tech nodes and operational Mercury buildings.
   * Private — consumed only by totalRpCapacity.
   */
  private readonly rpCapacityBoosts = computed<number>(() => {
    const fromTechs = this._completedTechs()
      .flatMap((id) => this.data.getTechNode(id)?.effects ?? [])
      .filter(
        (e): e is Extract<TechEffect, { type: 'rp_capacity_boost' }> =>
          e.type === 'rp_capacity_boost'
      )
      .reduce((sum, e) => sum + e.amount, 0);

    // MercuryBuildingEffect is a flat interface (not a discriminated union), so no Extract needed.
    const fromBuildings = this._mercuryBuildings()
      .filter((b) => b.status === 'operational')
      .flatMap((b) => this.data.getMercuryBuilding(b.buildingId)?.effects ?? [])
      .filter((e) => e.type === 'rp_capacity_boost')
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);

    return fromTechs + fromBuildings;
  });

  /** Maximum research-point slots available across all active tracks. */
  readonly totalRpCapacity = computed<number>(() => BASE_RP_CAPACITY + this.rpCapacityBoosts());

  /** Research points currently allocated to running (non-paused) tracks. */
  readonly usedRpCapacity = computed<number>(() =>
    this._activeResearch()
      .filter((t) => !t.isPaused)
      .reduce((sum, t) => {
        const rpCost =
          this.data.getResearchTrack(t.trackId)?.rpCost ??
          this.data.getTechNode(t.trackId)?.rpCost ??
          0;
        return sum + rpCost;
      }, 0)
  );

  /**
   * Power balance for all operational Mercury grid buildings.
   * energyDrawGw < 0 = produced; energyDrawGw > 0 = consumed.
   */
  readonly mercuryLocalPower = computed<{ producedGw: number; consumedGw: number }>(
    () => this._computeMercuryLocalPower(),
  );

  // -------------------------------------------------------------------------
  // Core time / speed mutations
  // -------------------------------------------------------------------------

  advanceYear(): void {
    this._gameYear.update((y) => y + 1);
  }

  setSpeed(speed: 1 | 4): void {
    this._gameSpeed.set(speed);
  }

  togglePause(): void {
    this._isPaused.update((p) => !p);
  }

  // -------------------------------------------------------------------------
  // Tech & research mutations
  // -------------------------------------------------------------------------

  /** Adds techId to completedTechs (idempotent). */
  unlockTech(techId: string): void {
    this._completedTechs.update((techs) => (techs.includes(techId) ? techs : [...techs, techId]));
  }

  /** Starts a new research track. `startYear` is the current game year. */
  startResearch(trackId: string, planetId: string, startYear: number): void {
    this._activeResearch.update((tracks) => [
      ...tracks,
      { trackId, planetId, isPaused: false, startYear, elapsedBeforeStart: 0 },
    ]);
  }

  /**
   * Pauses a running research track.
   * Snapshots elapsed years so progress is not lost; resets startYear to now.
   */
  pauseResearch(trackId: string): void {
    const currentYear = this._gameYear();
    this._activeResearch.update((tracks) =>
      tracks.map((t) => {
        if (t.trackId !== trackId || t.isPaused) return t;
        const elapsed = t.elapsedBeforeStart + (currentYear - t.startYear);
        return { ...t, isPaused: true, elapsedBeforeStart: elapsed, startYear: currentYear };
      })
    );
  }

  /** Resumes a paused research track from the current year. */
  resumeResearch(trackId: string): void {
    const currentYear = this._gameYear();
    this._activeResearch.update((tracks) =>
      tracks.map((t) =>
        t.trackId === trackId && t.isPaused
          ? { ...t, isPaused: false, startYear: currentYear }
          : t
      )
    );
  }

  /** Removes the track from active research and adds its id to completedTechs. */
  completeResearch(trackId: string): void {
    this._activeResearch.update((tracks) => tracks.filter((t) => t.trackId !== trackId));
    this.unlockTech(trackId);
  }

  // -------------------------------------------------------------------------
  // Fork mutations
  // -------------------------------------------------------------------------

  setPendingFork(fork: PendingFork | null): void {
    this._pendingFork.set(fork);
  }

  /**
   * Validates that the techId/choiceId pair is known, then clears the pending fork.
   *
   * NOTE: Effect processing (tag, choice effects, unlockTech) is owned by
   * TechTreeService.completeForkChoice() — this method is a pure state-clear.
   * TechTreeService calls this AFTER applying all effects so that the pendingFork
   * gate in canUnlock() is still active while effects are being processed.
   */
  completeFork(techId: string, choiceId: string): void {
    const techNode = this.data.getTechNode(techId);
    if (!techNode) return;

    const forkEffect = techNode.effects.find(
      (e): e is Extract<TechEffect, { type: 'present_fork' }> => e.type === 'present_fork'
    );
    if (!forkEffect?.choices.find((c) => c.id === choiceId)) return;

    this._pendingFork.set(null);
  }

  // -------------------------------------------------------------------------
  // Planet unlock mutations
  // -------------------------------------------------------------------------

  getPlanetUnlockState(planetId: string): PlanetUnlockState | null {
    return this._planetUnlocks()[planetId] ?? null;
  }

  isPlanetUnlocked(planetId: string): boolean {
    return this._planetUnlocks()[planetId]?.status === 'unlocked';
  }

  isPlanetInTransit(planetId: string): boolean {
    return this._planetUnlocks()[planetId]?.status === 'in_transit';
  }

  getPlanetArrivalYear(planetId: string): number | null {
    return this._planetUnlocks()[planetId]?.arrivalYear ?? null;
  }

  commitPlanetMission(
    planetId: string,
    missionId: string,
    transitStartYear: number,
    arrivalYear: number
  ): void {
    this._planetUnlocks.update((states) => {
      const current = states[planetId];
      if (!current || current.status === 'in_transit' || current.status === 'unlocked') {
        return states;
      }
      if (current.missionId !== undefined && current.missionId !== missionId) {
        return states;
      }

      return {
        ...states,
        [planetId]: {
          ...current,
          status: 'in_transit',
          missionId,
          committedYear: transitStartYear,
          transitStartYear,
          arrivalYear,
        },
      };
    });
  }

  unlockPlanet(planetId: string, unlockedYear: number): void {
    this._planetUnlocks.update((states) => {
      const current = states[planetId];
      if (!current || current.status === 'unlocked') return states;
      return {
        ...states,
        [planetId]: {
          ...current,
          status: 'unlocked',
          unlockedYear,
        },
      };
    });
  }

  markPlanetUnlockFlagFired(planetId: string, flagOrEventId: string): void {
    this._planetUnlocks.update((states) => {
      const current = states[planetId];
      if (!current || current.firedFlags.includes(flagOrEventId)) return states;
      return {
        ...states,
        [planetId]: {
          ...current,
          firedFlags: [...current.firedFlags, flagOrEventId],
        },
      };
    });
  }

  // -------------------------------------------------------------------------
  // Terraforming mutations
  // -------------------------------------------------------------------------

  applyTerraformingChoice(planetId: string, choiceId: string, permanent: boolean): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      return {
        ...planets,
        [planetId]: {
          ...planet,
          terraformingChoices: {
            ...planet.terraformingChoices,
            [choiceId]: {
              active: true,
              startedYear: this._gameYear(),
              permanent,
            },
          },
        },
      };
    });
  }

  updatePlanetVisualParams(planetId: string, params: Partial<PlanetVisualParams>): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      return {
        ...planets,
        [planetId]: {
          ...planet,
          visualParams: { ...planet.visualParams, ...params },
        },
      };
    });
  }

  /** Applies atmosphere deltas from one year of active choices. Pressure is clamped >= 0. */
  updatePlanetAtmosphere(planetId: string, pressureDelta: number, tempDelta: number): void {
    this._planets.update((planets) => {
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
  }

  /** Directly sets terraforming progress [0–1]. Use to avoid float drift from incremental updates. */
  setTerraformingProgress(planetId: string, progress: number): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      return {
        ...planets,
        [planetId]: { ...planet, terraformingProgress: progress },
      };
    });
  }

  /** Increments terraformingPhase by 1 and resets progress to 0. */
  advanceTerraformingPhase(planetId: string): void {
    this._planets.update((planets) => {
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
  }

  /** Extends lockedOutChoices with new IDs (deduplicates). */
  lockOutTerraformingChoices(planetId: string, choiceIds: string[]): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      const merged = [...new Set([...planet.lockedOutChoices, ...choiceIds])];
      return {
        ...planets,
        [planetId]: { ...planet, lockedOutChoices: merged },
      };
    });
  }

  /** Sets the visual transition window. Call on phase advance: startYear=now, endYear=now+N. */
  setTerraformTransitionYears(planetId: string, startYear: number, endYear: number): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      return {
        ...planets,
        [planetId]: { ...planet, terraformStartYear: startYear, terraformEndYear: endYear },
      };
    });
  }

  /** Sets Mars radiation clear year (0 = no active hazard). */
  setMarsRadiationClearYear(planetId: string, year: number): void {
    this._planets.update((planets) => {
      const planet = planets[planetId];
      if (!planet) return planets;
      return {
        ...planets,
        [planetId]: { ...planet, marsRadiationClearYear: year },
      };
    });
  }

  // -------------------------------------------------------------------------
  // Culture event mutations
  // -------------------------------------------------------------------------

  addToEventQueue(entry: CultureEventEntry): void {
    this._cultureEventQueue.update((q) => [...q, entry]);
  }

  /**
   * Inserts a priority event at the front of the queue (index 0 = current event).
   * If a current event is already showing it is flagged wasInterrupted and moved to index 1.
   */
  addPriorityEvent(eventId: string, queuedAtYear: number): void {
    this._cultureEventQueue.update((queue) => {
      const priorityEntry: CultureEventEntry = {
        eventId,
        queuedAtYear,
        priority: true,
        wasInterrupted: false,
      };
      if (queue.length === 0) {
        return [priorityEntry];
      }
      const [current, ...rest] = queue;
      const interrupted: CultureEventEntry = { ...current, wasInterrupted: true };
      return [priorityEntry, interrupted, ...rest];
    });
  }

  /** Removes and returns the front of the culture event queue (the current event). */
  shiftEventQueue(): CultureEventEntry | undefined {
    let shifted: CultureEventEntry | undefined;
    this._cultureEventQueue.update((queue) => {
      if (queue.length === 0) return queue;
      const [first, ...tail] = queue;
      shifted = first;
      return tail;
    });
    return shifted;
  }

  /** Removes the first queue entry whose eventId matches. No-op if not found. */
  removeEventFromQueue(eventId: string): void {
    this._cultureEventQueue.update((q) => {
      const idx = q.findIndex((e) => e.eventId === eventId);
      if (idx === -1) return q;
      return [...q.slice(0, idx), ...q.slice(idx + 1)];
    });
  }

  recordEventHistory(entry: CultureEventHistoryEntry): void {
    this._cultureEventHistory.update((h) => [...h, entry]);
  }

  // -------------------------------------------------------------------------
  // Mercury / Dyson mutations
  // -------------------------------------------------------------------------

  /**
   * Applies a resource delta to the Mercury inventory.
   * Pass positive values to add, negative values to consume.
   */
  updateMercuryResources(delta: Partial<ResourceStore>): void {
    this._mercuryResources.update((res) => ({
      commonOre: res.commonOre + (delta.commonOre ?? 0),
      rareMetals: res.rareMetals + (delta.rareMetals ?? 0),
      polarVolatiles: res.polarVolatiles + (delta.polarVolatiles ?? 0),
    }));
  }

  placeMercuryBuilding(building: PlacedBuilding): void {
    this._mercuryBuildings.update((buildings) => [...buildings, building]);
  }

  /** Updates the status of a building instance by its unique id. */
  updateBuildingStatus(buildingId: string, status: 'building' | 'operational'): void {
    this._mercuryBuildings.update((buildings) =>
      buildings.map((b) => (b.id === buildingId ? { ...b, status } : b))
    );
    if (status === 'operational') {
      const building = this._mercuryBuildings().find((b) => b.id === buildingId);
      if (building) {
        this._unlockAdjacentSlots(building);
      }
    }
  }

  /** Updates the build progress (years) of a building instance by its unique id. */
  updateBuildingProgress(id: string, progress: number): void {
    this._mercuryBuildings.update((buildings) =>
      buildings.map((b) => (b.id === id ? { ...b, buildProgressYears: progress } : b))
    );
  }

  // -------------------------------------------------------------------------
  // Mercury orbital component queue mutations
  // -------------------------------------------------------------------------

  /** Appends an orbital component entry to the Mercury build queue. */
  enqueueMercuryComponent(entry: MercuryQueueEntry): void {
    this._mercuryBuildQueue.update((q) => [...q, entry]);
  }

  /**
   * Increments progressYears of the first queue entry by 1.
   * No-op if the queue is empty.
   */
  advanceMercuryBuildProgress(): void {
    this._mercuryBuildQueue.update((q) => {
      if (q.length === 0) return q;
      const [first, ...rest] = q;
      return [{ ...first, progressYears: first.progressYears + 1 }, ...rest];
    });
  }

  /**
   * Removes the first entry from the Mercury build queue (the completed build).
   * Returns the removed entry, or undefined if the queue is empty.
   */
  shiftMercuryBuildQueue(): MercuryQueueEntry | undefined {
    let shifted: MercuryQueueEntry | undefined;
    this._mercuryBuildQueue.update((q) => {
      if (q.length === 0) return q;
      const [first, ...rest] = q;
      shifted = first;
      return rest;
    });
    return shifted;
  }

  /**
   * Applies a completed orbital component's arrival effect to a planet's PlanetBioState.
   * Silent no-op for an unknown planetId or unrecognised componentId.
   */
  applyComponentArrival(planetId: string, componentId: string): void {
    this._bioPhases.update((phases) => {
      const planet = phases[planetId];
      if (!planet) return phases;

      switch (componentId) {
        case 'odn':
          return { ...phases, [planetId]: { ...planet, odnBuilt: true } };
        case 'precipitationEngine':
          return {
            ...phases,
            [planetId]: {
              ...planet,
              precipitationEnginesBuilt: planet.precipitationEnginesBuilt + 1,
            },
          };
        case 'atmosphericCatalystShip':
          return {
            ...phases,
            [planetId]: {
              ...planet,
              atmosphericCatalystShipsBuilt: planet.atmosphericCatalystShipsBuilt + 1,
            },
          };
        case 'bioreactor':
          return {
            ...phases,
            [planetId]: {
              ...planet,
              bioreactorBatchesActive: planet.bioreactorBatchesActive + 1,
            },
          };
        default:
          return phases;
      }
    });
  }

  setDysonState(panelCount: number, coveragePercent: number, energyWatts: number): void {
    this._dysonPanelCount.set(panelCount);
    this._dysonCoveragePercent.set(coveragePercent);
    this._dysonEnergyWatts.set(energyWatts);
  }

  setDysonPanelTier(tier: 'basic' | 'mid' | 'hardened'): void {
    this._dysonPanelTier.set(tier);
  }

  // -------------------------------------------------------------------------
  // Kardashev / milestone mutations
  // -------------------------------------------------------------------------

  setKardashevLevel(level: number): void {
    this._kardashevLevel.set(level);
  }

  /** Marks a milestone complete (idempotent). */
  completeMilestone(milestoneId: string): void {
    this._completedMilestones.update((m) => (m.includes(milestoneId) ? m : [...m, milestoneId]));
  }

  // -------------------------------------------------------------------------
  // Colonist / Earth mutations
  // -------------------------------------------------------------------------

  incrementNaturalist(): void {
    this._naturalistCount.update((n) => n + 1);
  }

  incrementArchitect(): void {
    this._architectCount.update((n) => n + 1);
  }

  setColonistBonus(bonus: 'denseLiving' | 'openEnvironment', value: boolean): void {
    this._colonistBonuses.update((b) => ({ ...b, [bonus]: value }));
  }

  setEarthFlag(flag: string, value: boolean): void {
    this._earthFlags.update((flags) => ({ ...flags, [flag]: value }));
  }

  // -------------------------------------------------------------------------
  // Bio-phase mutations
  // -------------------------------------------------------------------------

  updateBioPhase(planetId: string, phaseIndex: number, update: Partial<BioPhaseState>): void {
    this._bioPhases.update((bioPhases) => {
      const planet = bioPhases[planetId];
      if (!planet) return bioPhases;
      if (phaseIndex < 0 || phaseIndex >= planet.phases.length) return bioPhases;
      const phases = [...planet.phases];
      // Safe cast: spreading a complete BioPhaseState with a Partial produces a BioPhaseState.
      phases[phaseIndex] = { ...phases[phaseIndex], ...update } as BioPhaseState;
      return { ...bioPhases, [planetId]: { ...planet, phases } };
    });
  }

  /**
   * Replaces the entire bio-phases map.
   * Used by BioPhaseService.initNewGame() to seed a fresh campaign.
   * hydrate() already writes _bioPhases directly — this is the equivalent
   * public method for new-game initialisation.
   */
  setBioPhases(phases: Record<string, PlanetBioState>): void {
    this._bioPhases.set(phases);
  }

  /** Adds requestId to a planet's requestsSent list (idempotent). */
  addBioRequest(planetId: string, requestId: string): void {
    this._bioPhases.update((bioPhases) => {
      const planet = bioPhases[planetId];
      if (!planet || planet.requestsSent.includes(requestId)) return bioPhases;
      return {
        ...bioPhases,
        [planetId]: { ...planet, requestsSent: [...planet.requestsSent, requestId] },
      };
    });
  }

  // -------------------------------------------------------------------------
  // Europa mutation
  // -------------------------------------------------------------------------

  authoriseEuropa(impactYear: number): void {
    this._europaState.update((s) => ({ ...s, missionAuthorised: true, impactYear }));
  }

  // -------------------------------------------------------------------------
  // Mercury RTS mutations (Block 9.6)
  // -------------------------------------------------------------------------

  /**
   * Sets the active starting zone and marks all slots belonging to that zone as 'available'.
   * Slots in seedSlots and those whose col/row falls inside seedArea are unlocked.
   */
  selectMercuryZone(zoneId: string): void {
    this._mercurySelectedZone.set(zoneId);
    const zone = this.data.getMercuryStartingZone(zoneId);
    if (!zone) return;

    this._mercurySlotStates.update((states) => {
      const next = { ...states };
      for (const slotId of zone.seedSlots) {
        next[slotId] = 'available';
      }
      const { colMin, colMax, rowMin, rowMax } = zone.seedArea;
      const allSlots = this.data.getMercuryMapData()?.slots ?? [];
      for (const slot of allSlots) {
        if (
          slot.col >= colMin &&
          slot.col <= colMax &&
          slot.row >= rowMin &&
          slot.row <= rowMax
        ) {
          next[slot.id] = 'available';
        }
      }
      return next;
    });
  }

  /** Moves one miner from the pool to the given slot. No-op if pool is empty. */
  assignMiner(slotId: string): void {
    this._mercuryMiners.update((m) => {
      if (m.poolCount <= 0) return m;
      return {
        poolCount: m.poolCount - 1,
        assignments: { ...m.assignments, [slotId]: (m.assignments[slotId] ?? 0) + 1 },
      };
    });
  }

  /** Returns one miner from the given slot to the pool. No-op if slot has no miners. */
  unassignMiner(slotId: string): void {
    this._mercuryMiners.update((m) => {
      const current = m.assignments[slotId] ?? 0;
      if (current <= 0) return m;
      return {
        poolCount: m.poolCount + 1,
        assignments: { ...m.assignments, [slotId]: current - 1 },
      };
    });
  }

  /** Moves one miner directly from one slot to another. No-op if source has no miners. */
  reassignMiner(fromSlotId: string, toSlotId: string): void {
    this._mercuryMiners.update((m) => {
      const from = m.assignments[fromSlotId] ?? 0;
      if (from <= 0) return m;
      return {
        poolCount: m.poolCount,
        assignments: {
          ...m.assignments,
          [fromSlotId]: from - 1,
          [toSlotId]: (m.assignments[toSlotId] ?? 0) + 1,
        },
      };
    });
  }

  /** Sets a resource reservation amount (clamped ≥ 0). */
  setResourceReservation(resource: keyof ResourceStore, amount: number): void {
    this._resourceReservations.update((r) => ({ ...r, [resource]: Math.max(0, amount) }));
  }

  /** Directly sets a slot's status. */
  setMercurySlotState(slotId: string, status: MercurySlotStatus): void {
    this._mercurySlotStates.update((s) => ({ ...s, [slotId]: status }));
  }

  // -------------------------------------------------------------------------
  // Save / load / reset
  // -------------------------------------------------------------------------

  /**
   * Resets all signals to new-game defaults.
   * currentSaveSlot is intentionally NOT reset — it persists across new games.
   */
  reset(): void {
    this._gameYear.set(INITIAL_YEAR);
    this._gameSpeed.set(1);
    this._isPaused.set(false);
    this._isFirstPlaythrough.set(true);
    this._planets.set(this.buildInitialPlanetsRecord());
    this._completedTechs.set([]);
    this._activeResearch.set([]);
    this._pendingFork.set(null);
    this._planetUnlocks.set(this.buildInitialPlanetUnlocksRecord());
    this._mercuryResources.set({ ...INITIAL_RESOURCES });
    this._mercuryBuildings.set([]);
    this._mercuryBuildQueue.set([]);
    this._dysonPanelCount.set(0);
    this._dysonPanelTier.set('basic');
    this._dysonCoveragePercent.set(0);
    this._dysonEnergyWatts.set(0);
    this._kardashevLevel.set(0);
    this._completedMilestones.set([]);
    this._naturalistCount.set(0);
    this._architectCount.set(0);
    this._colonistBonuses.set({ denseLiving: false, openEnvironment: false });
    this._earthFlags.set({});
    this._cultureEventQueue.set([]);
    this._cultureEventHistory.set([]);
    this._bioPhases.set({});
    this._europaState.set({ ...INITIAL_EUROPA });
    this._mercurySelectedZone.set(null);
    this._mercuryMiners.set({ ...INITIAL_MINERS, assignments: {} });
    this._mercurySlotStates.set({});
    this._resourceReservations.set({ ...INITIAL_RESERVATIONS });
    // _currentSaveSlot intentionally NOT reset — see docstring above.
  }

  ensureInitialised(): void {
    if (Object.keys(this._planetUnlocks()).length > 0) return;
    this.reset();
  }

  /** Restores all signals from a loaded save file. */
  hydrate(state: SerializedGameState): void {
    this._gameYear.set(state.gameYear);
    this._gameSpeed.set(state.gameSpeed);
    this._isPaused.set(state.isPaused);
    this._isFirstPlaythrough.set(state.isFirstPlaythrough);
    this._currentSaveSlot.set(state.currentSaveSlot);
    this._planets.set(state.planets);
    this._completedTechs.set(state.completedTechs);
    this._activeResearch.set(state.activeResearch);
    this._pendingFork.set(state.pendingFork);
    this._planetUnlocks.set(state.planetUnlocks ?? this.buildInitialPlanetUnlocksRecord());
    this._mercuryResources.set(state.mercuryResources);
    this._mercuryBuildings.set(state.mercuryBuildings);
    this._mercuryBuildQueue.set(state.mercuryBuildQueue);
    this._dysonPanelCount.set(state.dysonPanelCount);
    this._dysonPanelTier.set(state.dysonPanelTier);
    this._dysonCoveragePercent.set(state.dysonCoveragePercent);
    this._dysonEnergyWatts.set(state.dysonEnergyWatts);
    this._kardashevLevel.set(state.kardashevLevel);
    this._completedMilestones.set(state.completedMilestones);
    this._naturalistCount.set(state.naturalistCount);
    this._architectCount.set(state.architectCount);
    this._colonistBonuses.set(state.colonistBonuses);
    this._earthFlags.set(state.earthFlags);
    this._cultureEventQueue.set(state.cultureEventQueue);
    this._cultureEventHistory.set(state.cultureEventHistory);
    this._bioPhases.set(state.bioPhases);
    this._europaState.set(state.europaState);
    this._mercurySelectedZone.set(state.mercurySelectedZone ?? null);
    this._mercuryMiners.set(state.mercuryMiners ?? { ...INITIAL_MINERS, assignments: {} });
    this._mercurySlotStates.set(state.mercurySlotStates ?? {});
    this._resourceReservations.set(state.resourceReservations ?? { ...INITIAL_RESERVATIONS });
  }

  /** Snapshots all signal values into a serialisable plain object. */
  serialise(): SerializedGameState {
    return {
      version: 1,
      saveTimestamp: Date.now(),
      gameYear: this._gameYear(),
      gameSpeed: this._gameSpeed(),
      isPaused: this._isPaused(),
      isFirstPlaythrough: this._isFirstPlaythrough(),
      currentSaveSlot: this._currentSaveSlot(),
      planets: this._planets(),
      completedTechs: this._completedTechs(),
      activeResearch: this._activeResearch(),
      pendingFork: this._pendingFork(),
      planetUnlocks: this._planetUnlocks(),
      mercuryResources: this._mercuryResources(),
      mercuryBuildings: this._mercuryBuildings(),
      mercuryBuildQueue: this._mercuryBuildQueue(),
      dysonPanelCount: this._dysonPanelCount(),
      dysonPanelTier: this._dysonPanelTier(),
      dysonCoveragePercent: this._dysonCoveragePercent(),
      dysonEnergyWatts: this._dysonEnergyWatts(),
      kardashevLevel: this._kardashevLevel(),
      completedMilestones: this._completedMilestones(),
      naturalistCount: this._naturalistCount(),
      architectCount: this._architectCount(),
      colonistBonuses: this._colonistBonuses(),
      earthFlags: this._earthFlags(),
      cultureEventQueue: this._cultureEventQueue(),
      cultureEventHistory: this._cultureEventHistory(),
      bioPhases: this._bioPhases(),
      europaState: this._europaState(),
      mercurySelectedZone: this._mercurySelectedZone(),
      mercuryMiners: this._mercuryMiners(),
      mercurySlotStates: this._mercurySlotStates(),
      resourceReservations: this._resourceReservations(),
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Builds the initial PlanetState record from DataService static data.
   * Called by reset() — DataService.loadAll() must have completed before this is called.
   */
  private buildInitialPlanetsRecord(): Record<string, PlanetState> {
    return this.data.getAllPlanets().reduce(
      (acc, planet) => {
        acc[planet.id] = {
          id: planet.id,
          atmospherePressure: planet.initialState.atmospherePressure,
          temperatureCelsius: planet.initialState.temperatureCelsius,
          terraformingPhase: planet.initialState.terraformingPhase,
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
            cloudOpacity: planet.id === 'earth' ? 1 : 0,
            atmosphereDensity: planet.initialState.atmosphereDensity,
            atmosphereColor: planet.initialState.atmosphereColor,
            cloudRotationSpeed: planet.initialState.cloudRotationSpeed,
            axisSpinSpeed: planet.initialState.axisSpinSpeed,
            axisRotationDirection: planet.initialState.axisRotationDirection,
            cityLightsIntensity: planet.visual.layerTextures['cityLights'] ? 1 : 0,
          },
          terraformStartYear: INITIAL_YEAR,
          terraformEndYear: INITIAL_YEAR,
          marsRadiationClearYear: 0,
        };
        return acc;
      },
      {} as Record<string, PlanetState>
    );
  }

  private buildInitialPlanetUnlocksRecord(): Record<string, PlanetUnlockState> {
    return this.data.getAllPlanets().reduce(
      (acc, planet) => {
        const unlock = planet.unlock;
        if (unlock.type === 'start_unlocked') {
          acc[planet.id] = {
            planetId: planet.id,
            status: 'unlocked',
            unlockedYear: INITIAL_YEAR,
            firedFlags: [],
          };
          return acc;
        }

        acc[planet.id] = {
          planetId: planet.id,
          status: unlock.type === 'mission' ? 'mission_available' : 'locked',
          missionId: unlock.type === 'mission' ? unlock.missionId : undefined,
          firedFlags: [],
        };
        return acc;
      },
      {} as Record<string, PlanetUnlockState>
    );
  }

  /**
   * Computes Mercury local power from operational grid buildings.
   * Called by the `mercuryLocalPower` computed — uses `this.data` injected at construction.
   */
  private _computeMercuryLocalPower(): { producedGw: number; consumedGw: number } {
    const operationalBuildings = this._mercuryBuildings().filter(
      (b) => b.status === 'operational',
    );
    let producedGw = 0;
    let consumedGw = 0;
    for (const placed of operationalBuildings) {
      const def = this.data.getMercuryBuilding(placed.buildingId);
      if (!def) continue;
      if (def.energyDrawGw < 0) {
        producedGw += Math.abs(def.energyDrawGw);
      } else {
        consumedGw += def.energyDrawGw;
      }
    }
    return { producedGw, consumedGw };
  }

  /**
   * Transitions every 'locked' slot adjacent to the given placed building to 'available'.
   * Called by `updateBuildingStatus()` when a building becomes operational.
   */
  private _unlockAdjacentSlots(building: PlacedBuilding): void {
    const slot = this.data
      .getMercuryMapData()
      ?.slots.find((s) => s.col === building.col && s.row === building.row);
    if (!slot || slot.adjacentTo.length === 0) return;

    this._mercurySlotStates.update((states) => {
      const next = { ...states };
      for (const adjId of slot.adjacentTo) {
        if ((next[adjId] ?? 'locked') === 'locked') {
          next[adjId] = 'available';
        }
      }
      return next;
    });
  }
}
