import { Injectable, effect, inject, untracked } from '@angular/core';
import type { KardashevMilestone } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from './tech-tree.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Kardashev level when Dyson coverage = 0 %. */
const KARDASHEV_BASE = 0.73;

/** Kardashev level span across the full 0–100 % Dyson coverage range. */
const KARDASHEV_SPAN = 1.27;

/**
 * Minimum terraformingPhase for a planet to count as "habitable".
 * NOTE: Align with GDD balance pass when terraforming thresholds are finalised.
 */
const HABITABLE_PHASE_THRESHOLD = 3;

/**
 * Minimum population for a planet to count as a self-sustaining colony.
 * NOTE: Always false in practice until a ColonyManagementService populates
 * PlanetState.population — see TODO.md.
 */
const SELF_SUSTAINING_POPULATION = 10_000;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * KardashevService — pure system service.
 *
 * Responsibilities:
 *  - Recompute `kardashevLevel` each year: 0.73 + (coverage / 100) × 1.27.
 *  - Check every Kardashev milestone each year and complete newly satisfied ones.
 *  - On completion: mark in GameStateService, apply effects via TechTreeService,
 *    emit milestoneReached$ so CultureEventService and others can react.
 *
 * This service holds NO state of its own. All state lives in GameStateService.
 */
@Injectable({ providedIn: 'root' })
export class KardashevService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);
  private readonly techTree = inject(TechTreeService);

  constructor() {
    effect(() => {
      this.gameState.gameYear(); // reactive dependency — run once per year tick
      untracked(() => this._processYear());
    });
  }

  // ---------------------------------------------------------------------------
  // Private — tick handler
  // ---------------------------------------------------------------------------

  private _processYear(): void {
    this._updateLevel();
    this._checkMilestones();
  }

  // ---------------------------------------------------------------------------
  // Private — Kardashev level
  // ---------------------------------------------------------------------------

  private _updateLevel(): void {
    const coverage = this.gameState.dysonCoveragePercent();
    const level = KARDASHEV_BASE + (coverage / 100) * KARDASHEV_SPAN;
    this.gameState.setKardashevLevel(level);
  }

  // ---------------------------------------------------------------------------
  // Private — milestone checking
  // ---------------------------------------------------------------------------

  private _checkMilestones(): void {
    const completed = this.gameState.completedMilestones();
    for (const milestone of this.data.getAllMilestones()) {
      if (completed.includes(milestone.id)) continue;
      if (milestone.conditions.every((c) => this._checkCondition(c))) {
        this._completeMilestone(milestone);
      }
    }
  }

  /**
   * Returns true when the given condition string is currently satisfied.
   *
   * Supported conditions:
   *   deuterium_fusion_online — true when earth_fusion_ignition_theory is completed.
   *     NOTE: The milestone JSON uses this logical name rather than a tech ID. Mapped
   *     to earth_fusion_ignition_theory (the second of the two deuterium techs) as the
   *     moment fusion becomes "online". Verify with product owner if the first tech
   *     (earth_deuterium_extraction) should also count.
   *
   *   dyson_N_percent — true when dysonCoveragePercent >= N (parsed from the string).
   *     Handles any percentage, e.g. dyson_15_percent, dyson_50_percent.
   *
   *   two_habitable_worlds — true when at least 2 planets have terraformingPhase >= HABITABLE_PHASE_THRESHOLD.
   *
   *   first_self_sustaining_colony — true when any planet has population >= SELF_SUSTAINING_POPULATION.
   *     NOTE: Always false in practice until population is written by a future service.
   *
   *   interstellar_seed_ship_launched — deferred; always false. See TODO.md.
   */
  private _checkCondition(conditionId: string): boolean {
    if (conditionId === 'deuterium_fusion_online') {
      // NOTE: Mapped to earth_fusion_ignition_theory — the milestone JSON uses a logical
      // name that doesn't correspond to a tech ID directly. See plan for details.
      return this.gameState.completedTechs().includes('earth_fusion_ignition_theory');
    }

    const dysonMatch = /^dyson_(\d+)_percent$/.exec(conditionId);
    if (dysonMatch) {
      const threshold = parseInt(dysonMatch[1], 10);
      return this.gameState.dysonCoveragePercent() >= threshold;
    }

    if (conditionId === 'two_habitable_worlds') {
      const planets = Object.values(this.gameState.planets());
      const habitableCount = planets.filter(
        (p) => p.terraformingPhase >= HABITABLE_PHASE_THRESHOLD,
      ).length;
      return habitableCount >= 2;
    }

    if (conditionId === 'first_self_sustaining_colony') {
      const planets = Object.values(this.gameState.planets());
      return planets.some((p) => p.population >= SELF_SUSTAINING_POPULATION);
    }

    if (conditionId === 'interstellar_seed_ship_launched') {
      // Deferred — no state or tech for this exists yet. See TODO.md.
      return false;
    }

    console.warn(`KardashevService: unknown condition "${conditionId}" — treating as false`);
    return false;
  }

  private _completeMilestone(milestone: KardashevMilestone): void {
    // 1. Mark complete in state (idempotent guard is inside GameStateService).
    this.gameState.completeMilestone(milestone.id);

    // 2. Apply effects (e.g. emit_event queues a culture event).
    //    Delegates to TechTreeService.applyEffects() for consistent effect handling.
    //    planetId is '' because milestone effects in the current data are all emit_event
    //    which ignores planetId. Revisit if planet-specific milestone effects are added.
    this.techTree.applyEffects(milestone.effects, '');

    // 3. Notify listeners (CultureEventService subscribes to react to milestone events).
    this.eventBus.milestoneReached$.next(milestone.id);
  }
}
