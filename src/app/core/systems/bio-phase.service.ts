import { Injectable, effect, inject, untracked } from '@angular/core';
import type { PlanetBioState } from '@app/core/models';
import type { BioPhaseDef } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Per-action speedup factor applied to effective duration.
 * effectiveDuration = nominalDuration × (1 − clamp((actionCount − 1) × SPEEDUP_PER_ACTION, 0, MAX_SPEEDUP))
 */
const SPEEDUP_PER_ACTION = 0.08;

/** Maximum total speedup — phases can never run faster than 60 % of their nominal duration. */
const MAX_SPEEDUP = 0.4;

/**
 * Planet IDs that participate in the bio-phase system.
 * Iterated in processYear and initNewGame.
 */
const BIO_PLANETS: readonly string[] = ['mars', 'venus'];

/**
 * Fallback phase definitions used when DataService returns an empty array
 * (e.g. bio-phases.json has not yet been populated or failed to load).
 * Mirrors the content of public/data/bio-phases.json.
 * Remove once JSON is canonical and trusted to always load successfully.
 */
const FALLBACK_PHASE_DEFINITIONS: Record<string, BioPhaseDef[]> = {
  mars: [
    {
      id: 'mars-bio-1',
      displayName: 'Pioneer Microbes',
      nominalDurationYears: 20,
      actions: ['seed_cyanobacteria', 'add_perchlorate_reducers', 'deploy_iron_oxidisers'],
      requiresComponents: [],
      completeCeId: 'ce_mars_bio_1_complete',
    },
    {
      id: 'mars-bio-2',
      displayName: 'Chemolithotrophs & Fixers',
      nominalDurationYears: 25,
      actions: ['add_nitrogen_fixers', 'seed_methanogens', 'add_chemolithotrophs', 'boost_soil_cycling'],
      requiresComponents: [],
      canStartAtPreviousPercent: 0.5,
      completeCeId: 'ce_mars_bio_2_complete',
    },
    {
      id: 'mars-bio-3',
      displayName: 'Early Plants & Aquatics',
      nominalDurationYears: 30,
      actions: ['introduce_mosses', 'seed_algae_mats', 'add_fungal_networks', 'deploy_decomposers'],
      requiresComponents: ['bioreactor'],
      spilloverTech: 'mars_early_biosphere',
      completeCeId: 'ce_mars_bio_3_complete',
    },
    {
      id: 'mars-bio-4',
      displayName: 'Biosphere Stabilisation',
      nominalDurationYears: 35,
      actions: ['introduce_ferns', 'add_pollinators', 'complete_food_web', 'seed_tundra_package'],
      requiresComponents: ['precipitationEngine'],
      completeCeId: 'ce_mars_bio_4_complete',
    },
  ],
  venus: [
    {
      id: 'venus-bio-1',
      displayName: 'Acid Chemistry Reducers',
      nominalDurationYears: 25,
      actions: ['seed_sulphur_reducers', 'add_chemolithotrophs', 'deploy_acid_package'],
      requiresComponents: [],
      completeCeId: 'ce_venus_bio_1_complete',
    },
    {
      id: 'venus-bio-2',
      displayName: 'Ocean Foundation Microbes',
      nominalDurationYears: 30,
      actions: ['seed_aquatic_microbes', 'add_phytoplankton', 'introduce_kelp', 'boost_ocean_buffer'],
      requiresComponents: [],
      canStartAtPreviousPercent: 0.5,
      completeCeId: 'ce_venus_bio_2_complete',
    },
    {
      id: 'venus-bio-3',
      displayName: 'Atmospheric Processors',
      nominalDurationYears: 35,
      actions: ['add_nitrogen_fixers', 'seed_mosses', 'deploy_coastal_package', 'introduce_lichens'],
      requiresComponents: ['atmosphericCatalystShip'],
      spilloverTech: 'venus_early_biosphere',
      completeCeId: 'ce_venus_bio_3_complete',
    },
    {
      id: 'venus-bio-4',
      displayName: 'Biosphere Emergence',
      nominalDurationYears: 40,
      actions: ['introduce_ferns', 'add_pollinators', 'seed_forest_understory', 'complete_food_web'],
      requiresComponents: ['atmosphericCatalystShip', 'odn'],
      completeCeId: 'ce_venus_bio_4_complete',
    },
  ],
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * BioPhaseService — drives the biological terraforming phase system.
 *
 * Holds NO state. All state lives in GameStateService._bioPhases.
 *
 * Responsibilities:
 *  - Seed initial bio state for a new campaign (initNewGame).
 *  - Tick running phases once per game year, computing effective duration from action count.
 *  - Unlock locked phases when prerequisites are met.
 *  - Expose applyAction() and sendRequest() for the UI.
 *  - Complete phases, unlock spillover techs, and emit bioPhaseCompleted$ for CultureEventService.
 *
 * Public API consumed by UI and game shell:
 *   initNewGame()                                       — call after gameState.reset()
 *   applyAction(planetId, phaseIndex, actionId)        — Ecosystem Composer
 *   sendRequest(planetId, requestId)                   — request panel
 */
@Injectable({ providedIn: 'root' })
export class BioPhaseService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  constructor() {
    effect(() => {
      const year = this.gameState.gameYear();
      untracked(() => this._processYear(year));
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Seeds initial PlanetBioState for all bio planets.
   * Must be called after gameState.reset() when starting a new campaign.
   * Do NOT call in the constructor — the game shell owns the new-game sequence.
   */
  initNewGame(): void {
    const initial: Record<string, PlanetBioState> = {};

    for (const planetId of BIO_PLANETS) {
      const defs = this._getDefsForPlanet(planetId);
      initial[planetId] = {
        currentPhaseIndex: 0,
        phases: defs.map((def, i) => ({
          // Phase 0 starts available; no prerequisites exist for Bio I on either planet.
          status: i === 0 ? 'available' : 'locked',
          actionsTaken: [],
          progressYears: 0,
          durationYears: def.nominalDurationYears,
          startedYear: 0,
          completedYear: 0,
        })),
        odnBuilt: false,
        bioreactorBatchesActive: 0,
        precipitationEnginesBuilt: 0,
        atmosphericCatalystShipsBuilt: 0,
        requestsSent: [],
        discoveredOrganisms: [],
      };
    }

    this.gameState.setBioPhases(initial);
  }

  /**
   * Records an action taken by the player on an available or running bio phase.
   *
   * If this is the first action on an 'available' phase, the phase transitions
   * to 'running' (startedYear is set) and bioPhaseStarted$ is emitted.
   * Subsequent actions on a running phase only append to actionsTaken.
   *
   * Silently no-ops if the phase/action is invalid or the action is already taken.
   */
  applyAction(planetId: string, phaseIndex: number, actionId: string): void {
    const planetState = this.gameState.bioPhases()[planetId];
    if (!planetState) return;

    const phase = planetState.phases[phaseIndex];
    if (!phase) return;
    if (phase.status !== 'available' && phase.status !== 'running') return;

    const defs = this._getDefsForPlanet(planetId);
    const def = defs[phaseIndex];
    if (!def) return;

    if (!def.actions.includes(actionId)) return;
    if (phase.actionsTaken.includes(actionId)) return;

    const isFirstAction = phase.status === 'available';

    this.gameState.updateBioPhase(planetId, phaseIndex, {
      actionsTaken: [...phase.actionsTaken, actionId],
      ...(isFirstAction
        ? { status: 'running', startedYear: this.gameState.gameYear() }
        : {}),
    });

    if (isFirstAction) {
      this.eventBus.bioPhaseStarted$.next({ planetId, phaseId: def.id });
    }
  }

  /**
   * Records that a request has been sent for a planet.
   * The availability check runs on the next tick; no event is emitted here.
   */
  sendRequest(planetId: string, requestId: string): void {
    this.gameState.addBioRequest(planetId, requestId);
  }

  // ---------------------------------------------------------------------------
  // Private — tick
  // ---------------------------------------------------------------------------

  private _processYear(year: number): void {
    const bioPhases = this.gameState.bioPhases();
    // Guard: no-op until initNewGame() has been called.
    if (Object.keys(bioPhases).length === 0) return;

    for (const planetId of Object.keys(bioPhases)) {
      this._checkAvailability(planetId);
      this._tickRunningPhases(planetId, year);
    }
  }

  /**
   * Checks all locked phases for a planet and transitions any whose
   * requirements are now met to 'available', emitting bioPhaseAvailable$.
   */
  private _checkAvailability(planetId: string): void {
    const planetState = this.gameState.bioPhases()[planetId];
    if (!planetState) return;

    const defs = this._getDefsForPlanet(planetId);

    planetState.phases.forEach((phase, index) => {
      if (phase.status !== 'locked') return;
      if (this._requirementsMet(planetId, index)) {
        this.gameState.updateBioPhase(planetId, index, { status: 'available' });
        const def = defs[index];
        if (def) {
          this.eventBus.bioPhaseAvailable$.next({ planetId, phaseId: def.id });
        }
      }
    });
  }

  /**
   * Advances progressYears for every running phase on a planet and triggers
   * _completePhase() when the effective duration is reached.
   *
   * The `year` parameter is accepted for testability but is not used in the body —
   * progress is tick-based (progressYears += 1).
   */
  private _tickRunningPhases(planetId: string, _year: number): void {
    // Snapshot phases at tick start to iterate over pre-tick values.
    const phases = this.gameState.bioPhases()[planetId]?.phases ?? [];
    const defs = this._getDefsForPlanet(planetId);

    phases.forEach((phase, index) => {
      if (phase.status !== 'running') return;

      const newProgress = phase.progressYears + 1;
      this.gameState.updateBioPhase(planetId, index, { progressYears: newProgress });

      // Effective duration formula:
      //   speedup = clamp((actionCount - 1) × SPEEDUP_PER_ACTION, 0, MAX_SPEEDUP)
      //   effectiveDuration = durationYears × (1 - speedup)
      // Each action beyond the first trims 8 %; total capped at 40 % (60 % minimum).
      const actionCount = phase.actionsTaken.length;
      const speedup = Math.min((actionCount - 1) * SPEEDUP_PER_ACTION, MAX_SPEEDUP);
      const effectiveDuration = phase.durationYears * (1 - speedup);

      const def = defs[index];
      if (def && newProgress >= effectiveDuration) {
        this._completePhase(planetId, index);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private — requirements
  // ---------------------------------------------------------------------------

  /**
   * Returns true when all prerequisites for a phase are satisfied:
   *  1. Previous phase is complete (or at canStartAtPreviousPercent threshold).
   *  2. All required orbital components are built.
   *  3. Any required request has been sent.
   */
  private _requirementsMet(planetId: string, phaseIndex: number): boolean {
    const planetState = this.gameState.bioPhases()[planetId];
    if (!planetState) return false;

    const defs = this._getDefsForPlanet(planetId);
    const def = defs[phaseIndex];
    if (!def) return false;

    // 1. Previous phase requirement.
    if (phaseIndex > 0) {
      const prevPhase = planetState.phases[phaseIndex - 1];
      if (!prevPhase) return false;

      if (def.canStartAtPreviousPercent !== undefined) {
        // Early overlap: can start once previous phase reaches the percent threshold.
        if (prevPhase.status !== 'complete') {
          const prevProgress = prevPhase.progressYears / prevPhase.durationYears;
          if (prevProgress < def.canStartAtPreviousPercent) return false;
        }
      } else {
        // Default: previous phase must be fully complete.
        if (prevPhase.status !== 'complete') return false;
      }
    }

    // 2. Component requirements.
    for (const componentId of def.requiresComponents) {
      if (!this._isComponentBuilt(componentId, planetState)) return false;
    }

    // 3. Request requirement.
    if (def.requiresRequest && !planetState.requestsSent.includes(def.requiresRequest)) {
      return false;
    }

    return true;
  }

  /**
   * Maps JSON component ID strings to concrete PlanetBioState fields.
   *
   * NOTE: All component fields remain at their zero/false defaults until the
   * Mercury orbital-components feature is built. Component-gated phases (Bio III+)
   * will stay locked until MercuryBuildService or an orbital-components service
   * writes to these fields. See TODO.md: "BioPhaseService — Mercury orbital component requirements".
   */
  private _isComponentBuilt(componentId: string, state: PlanetBioState): boolean {
    switch (componentId) {
      case 'odn':
        return state.odnBuilt;
      case 'bioreactor':
        return state.bioreactorBatchesActive > 0;
      case 'precipitationEngine':
        return state.precipitationEnginesBuilt > 0;
      case 'atmosphericCatalystShip':
        return state.atmosphericCatalystShipsBuilt > 0;
      default:
        console.warn(`[BioPhaseService] unknown component requirement: "${componentId}"`);
        return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private — completion
  // ---------------------------------------------------------------------------

  private _completePhase(planetId: string, phaseIndex: number): void {
    const defs = this._getDefsForPlanet(planetId);
    const def = defs[phaseIndex];
    if (!def) return;

    this.gameState.updateBioPhase(planetId, phaseIndex, {
      status: 'complete',
      completedYear: this.gameState.gameYear(),
    });

    if (def.spilloverTech) {
      this.gameState.unlockTech(def.spilloverTech);
    }

    // CultureEventService already subscribes to bioPhaseCompleted$ and calls
    // _checkBioCompleteTriggers(planetId, phaseId) to queue the matching CE.
    this.eventBus.bioPhaseCompleted$.next({ planetId, phaseId: def.id });
  }

  // ---------------------------------------------------------------------------
  // Private — data helper
  // ---------------------------------------------------------------------------

  /**
   * Returns phase definitions for a planet from DataService.
   * Falls back to FALLBACK_PHASE_DEFINITIONS if DataService returns an empty array
   * (i.e. bio-phases.json was empty or not yet populated).
   */
  private _getDefsForPlanet(planetId: string): BioPhaseDef[] {
    const fromData = this.data.getBioPhases(planetId);
    return fromData.length > 0 ? fromData : (FALLBACK_PHASE_DEFINITIONS[planetId] ?? []);
  }
}
