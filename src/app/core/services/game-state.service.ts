import { Injectable, inject, computed, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import type {
  PlanetState,
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
      .reduce((sum, t) => sum + (this.data.getResearchTrack(t.trackId)?.rpCost ?? 0), 0)
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

  startResearch(trackId: string, planetId: string): void {
    this._activeResearch.update((tracks) => [
      ...tracks,
      { trackId, planetId, progressYears: 0, isPaused: false },
    ]);
  }

  pauseResearch(trackId: string): void {
    this._activeResearch.update((tracks) =>
      tracks.map((t) => (t.trackId === trackId ? { ...t, isPaused: true } : t))
    );
  }

  resumeResearch(trackId: string): void {
    this._activeResearch.update((tracks) =>
      tracks.map((t) => (t.trackId === trackId ? { ...t, isPaused: false } : t))
    );
  }

  advanceResearch(trackId: string, years: number): void {
    this._activeResearch.update((tracks) =>
      tracks.map((t) =>
        t.trackId === trackId ? { ...t, progressYears: t.progressYears + years } : t
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
    // _currentSaveSlot intentionally NOT reset — see docstring above.
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
            cityLightsIntensity: planet.id === 'earth' ? 1 : 0,
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
}
