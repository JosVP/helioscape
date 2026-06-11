import { Injectable, effect, inject, untracked } from '@angular/core';
import type { ResourceStore } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

// ---------------------------------------------------------------------------
// Constants — tune after playtesting
// ---------------------------------------------------------------------------

const ENERGY_PER_BASIC_PANEL = 1e12;
const ENERGY_PER_MID_PANEL = 2.5e12;
const ENERGY_PER_HARDENED_PANEL = 5e12;

const TOTAL_PANELS_FOR_100_PERCENT = 1000;
const BASE_PANELS_PER_YEAR = 2;

/** commonOre consumed per panel added per year. NOTE: tune after playtesting. */
const ORE_PER_PANEL = 1;

/** Probability of a Coronal Mass Ejection per game year (basic tier only). */
const CME_CHANCE_PER_YEAR = 0.005;

/** Fraction of panels destroyed by a CME. */
const CME_DAMAGE_FRACTION = 0.02;

/** rareMetals + polarVolatiles cost to upgrade from basic → mid. */
const UPGRADE_COST_MID: Readonly<ResourceStore> = {
  commonOre: 0,
  rareMetals: 50,
  polarVolatiles: 0,
};

/** rareMetals + polarVolatiles cost to upgrade from mid → hardened. */
const UPGRADE_COST_HARDENED: Readonly<ResourceStore> = {
  commonOre: 0,
  rareMetals: 150,
  polarVolatiles: 20,
};

/** Dyson coverage thresholds that trigger milestone events. */
const COVERAGE_MILESTONES: ReadonlyArray<{ percent: number; milestoneId: string }> = [
  { percent: 10,  milestoneId: 'dyson_10_percent'  },
  { percent: 25,  milestoneId: 'dyson_25_percent'  },
  { percent: 50,  milestoneId: 'dyson_50_percent'  },
  { percent: 100, milestoneId: 'dyson_100_percent' },
] as const;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * DysonService — manages Dyson sphere construction and energy output.
 *
 * Responsibilities:
 *  - Add panels each year (base rate + Mercury building bonus) if ore allows.
 *  - Apply CME damage (basic tier only, 0.5% chance per year).
 *  - Recompute energy output and commit to GameStateService.
 *  - Emit `dysonEnergyUpdated$` and `milestoneReached$` at coverage thresholds.
 *  - Expose `upgradeTier()` for the UI to call when the player chooses to upgrade.
 *
 * Milestone processing (KardashevService unlocking level etc.) is handled by
 * KardashevService, which subscribes to `milestoneReached$` — see PROMPTS.md 3.6.
 *
 * State lives entirely in GameStateService; this service holds no local state.
 */
@Injectable({ providedIn: 'root' })
export class DysonService {
  private readonly gameState = inject(GameStateService);
  private readonly eventBus = inject(EventBusService);
  private readonly data = inject(DataService);

  constructor() {
    effect(() => {
      const year = this.gameState.gameYear();
      // Read all signals we need inside untracked() so they don't become
      // reactive dependencies of this effect (prevents circular re-triggering).
      untracked(() => this.processYear(year));
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Processes one year of Dyson sphere construction.
   * Called automatically via the gameYear effect.
   */
  processYear(_year: number): void {
    const currentPanels = this.gameState.dysonPanelCount();
    const tier          = this.gameState.dysonPanelTier();
    const resources     = this.gameState.mercuryResources();

    // 1. Building bonus — sum dyson_panels_per_year effects from operational buildings.
    const buildings = this.gameState.mercuryBuildings();
    const bonusPanels = buildings
      .filter((b) => b.status === 'operational')
      .reduce((sum, b) => {
        const def = this.data.getMercuryBuilding(b.buildingId);
        if (!def) return sum;
        return (
          sum +
          def.effects
            .filter((e) => e.type === 'dyson_panels_per_year')
            .reduce((s, e) => s + (e.amount ?? 0), 0)
        );
      }, 0);

    // 2. Panels requested this year.
    let panelsToAdd = BASE_PANELS_PER_YEAR + bonusPanels;

    // 3. Ore check — reduce panelsToAdd if insufficient commonOre.
    const oreRequired = panelsToAdd * ORE_PER_PANEL;
    if (resources.commonOre < oreRequired) {
      panelsToAdd = Math.floor(resources.commonOre / ORE_PER_PANEL);
    }
    if (panelsToAdd > 0) {
      this.gameState.updateMercuryResources({ commonOre: -(panelsToAdd * ORE_PER_PANEL) });
    }

    // 4. CME — basic tier only; destroys a fraction of existing panels.
    let cmeLoss = 0;
    if (tier === 'basic' && Math.random() < CME_CHANCE_PER_YEAR) {
      cmeLoss = Math.round(currentPanels * CME_DAMAGE_FRACTION);
    }

    // 5. New panel count — capped at 100%.
    const newCount = Math.min(
      Math.max(0, currentPanels + panelsToAdd - cmeLoss),
      TOTAL_PANELS_FOR_100_PERCENT,
    );

    // 6. Energy and coverage.
    const energyPerPanel = this._energyPerPanel(tier);
    const newCoverage    = (newCount / TOTAL_PANELS_FOR_100_PERCENT) * 100;
    const newWatts       = newCount * energyPerPanel;

    // 7. Commit state.
    this.gameState.setDysonState(newCount, newCoverage, newWatts);

    // 8. Bus.
    this.eventBus.dysonEnergyUpdated$.next(newWatts);

    // 9. Milestones — fire each threshold exactly once.
    const completedMilestones = this.gameState.completedMilestones();
    for (const { percent, milestoneId } of COVERAGE_MILESTONES) {
      if (newCoverage >= percent && !completedMilestones.includes(milestoneId)) {
        this.gameState.completeMilestone(milestoneId);
        this.eventBus.milestoneReached$.next(milestoneId);
      }
    }
  }

  /**
   * Upgrades the Dyson sphere tier to `'mid'` or `'hardened'`.
   *
   * Guards:
   *  - basic → mid only; mid → hardened only (no skipping).
   *  - Resources must be sufficient; no partial deduction on failure.
   */
  upgradeTier(tier: 'mid' | 'hardened'): void {
    const currentTier = this.gameState.dysonPanelTier();
    const expectedFrom = tier === 'mid' ? 'basic' : 'mid';
    if (currentTier !== expectedFrom) return;

    const cost     = tier === 'mid' ? UPGRADE_COST_MID : UPGRADE_COST_HARDENED;
    const resources = this.gameState.mercuryResources();

    // Validate all resource keys — no partial deduction on failure.
    const keys = Object.keys(cost) as (keyof ResourceStore)[];
    for (const key of keys) {
      if (resources[key] < cost[key]) return;
    }

    // Deduct.
    const delta: Partial<ResourceStore> = {};
    for (const key of keys) {
      if (cost[key] > 0) delta[key] = -cost[key];
    }
    this.gameState.updateMercuryResources(delta);

    // Upgrade.
    this.gameState.setDysonPanelTier(tier);

    // Recompute energy immediately with new tier.
    const panels     = this.gameState.dysonPanelCount();
    const coverage   = this.gameState.dysonCoveragePercent();
    const newWatts   = panels * this._energyPerPanel(tier);
    this.gameState.setDysonState(panels, coverage, newWatts);
    this.eventBus.dysonEnergyUpdated$.next(newWatts);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _energyPerPanel(tier: 'basic' | 'mid' | 'hardened'): number {
    switch (tier) {
      case 'mid':      return ENERGY_PER_MID_PANEL;
      case 'hardened': return ENERGY_PER_HARDENED_PANEL;
      default:         return ENERGY_PER_BASIC_PANEL;
    }
  }
}
