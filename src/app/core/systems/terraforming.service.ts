import { Injectable, effect, inject, untracked } from '@angular/core';
import type { PlanetVisualParams } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { getValueAtYear, lerpColor } from '@app/shared/utils/math.utils';

// ---------------------------------------------------------------------------
// Rate constants — tune after playtesting
// ---------------------------------------------------------------------------

interface ChoiceRates {
  /** Atmospheric pressure change in atm per year. */
  pressureRate: number;
  /** Surface temperature change in °C per year. */
  tempRate: number;
  /** Fraction of 1.0 terraforming progress gained per year. */
  phaseContribution: number;
}

const CHOICE_RATES: Record<string, Record<string, ChoiceRates>> = {
  mars: {
    mars_polar_detonation:     { pressureRate: 0.0002,  tempRate: 0.5,  phaseContribution: 0.04  },
    mars_orbital_mirrors:      { pressureRate: 0.0001,  tempRate: 0.3,  phaseContribution: 0.025 },
    mars_magnetic_umbrella:    { pressureRate: 0.00005, tempRate: 0.1,  phaseContribution: 0.015 },
    mars_biological_seeding:   { pressureRate: 0,       tempRate: 0,    phaseContribution: 0.02  },
    mars_comet_water_delivery: { pressureRate: 0.00008, tempRate: 0,    phaseContribution: 0.01  },
  },
  venus: {
    venus_orbital_shade_mirror:    { pressureRate: -0.0003, tempRate: -0.4, phaseContribution: 0.03  },
    venus_carbonate_sequestration: { pressureRate: -0.0002, tempRate: -0.2, phaseContribution: 0.025 },
    venus_europa_impact:           { pressureRate: -0.001,  tempRate: -1.0, phaseContribution: 0.06  },
  },
};

/** Years over which visual params lerp after a phase advances. */
const PHASE_TRANSITION_YEARS = 300;

/** Planets driven by this service. */
const TERRAFORMED_PLANETS = ['mars', 'venus'] as const;

/** Culture event IDs fired when a phase advances. null = no event for that transition. */
const PHASE_CE_IDS: Record<string, (string | null)[]> = {
  //                  phase 0→1            phase 1→2            phase 2→3            phase 3→4
  mars:  ['ce_mars_phase_1',  'ce_mars_phase_2',  'ce_mars_phase_3',  null],
  venus: ['ce_venus_phase_1', 'ce_venus_phase_2', 'ce_venus_phase_3', null],
};

/**
 * Per-planet, per-phase visual parameter targets.
 * Index = phase number. The service lerps FROM targets[currentPhase] TO targets[currentPhase+1]
 * over [terraformStartYear, terraformEndYear]. Tune values after playtesting.
 */
const PHASE_VISUAL_TARGETS: Record<string, Partial<PlanetVisualParams>[]> = {
  mars: [
    // Phase 0: barren red Mars
    {
      waterGrowthRadius: 0,    waterOpacity: 0,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0.4,        lavaHueShift: 0,
      cloudOpacity: 0.05,      atmosphereDensity: 0.02,
      atmosphereColor: '#c1440e', cloudRotationSpeed: 0.001,
    },
    // Phase 1: thin atmosphere forming
    {
      waterGrowthRadius: 0,    waterOpacity: 0,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0.1,        lavaHueShift: 0.5,
      cloudOpacity: 0.15,      atmosphereDensity: 0.08,
      atmosphereColor: '#d4633a', cloudRotationSpeed: 0.002,
    },
    // Phase 2: liquid water appearing
    {
      waterGrowthRadius: 0.2,  waterOpacity: 0.3,
      greenGrowthRadius: 0.05, greenOpacity: 0.1,
      lavaOpacity: 0,          lavaHueShift: 1,
      cloudOpacity: 0.3,       atmosphereDensity: 0.18,
      atmosphereColor: '#c27b5a', cloudRotationSpeed: 0.003,
    },
    // Phase 3: becoming habitable
    {
      waterGrowthRadius: 0.5,  waterOpacity: 0.7,
      greenGrowthRadius: 0.35, greenOpacity: 0.5,
      lavaOpacity: 0,          lavaHueShift: 1,
      cloudOpacity: 0.55,      atmosphereDensity: 0.3,
      atmosphereColor: '#7fa8cc', cloudRotationSpeed: 0.005,
    },
    // Phase 4: Earth-like (final target)
    {
      waterGrowthRadius: 0.85, waterOpacity: 1,
      greenGrowthRadius: 0.75, greenOpacity: 0.9,
      lavaOpacity: 0,          lavaHueShift: 1,
      cloudOpacity: 0.8,       atmosphereDensity: 0.35,
      atmosphereColor: '#4488ff', cloudRotationSpeed: 0.008,
    },
  ],
  venus: [
    // Phase 0: hellish Venus — extreme pressure, thick yellow-orange clouds
    {
      waterGrowthRadius: 0,    waterOpacity: 0,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0,          cloudOpacity: 1.0,
      atmosphereDensity: 1.0,  atmosphereColor: '#c9a227', cloudRotationSpeed: 0.008,
    },
    // Phase 1: shade mirror in operation, heat gain slowing
    {
      waterGrowthRadius: 0,    waterOpacity: 0,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0,          cloudOpacity: 0.9,
      atmosphereDensity: 0.85, atmosphereColor: '#b8911e', cloudRotationSpeed: 0.006,
    },
    // Phase 2: pressure dropping, clouds thinning
    {
      waterGrowthRadius: 0,    waterOpacity: 0,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0,          cloudOpacity: 0.6,
      atmosphereDensity: 0.5,  atmosphereColor: '#8c7a4e', cloudRotationSpeed: 0.004,
    },
    // Phase 3: temperate, approaching breathable
    {
      waterGrowthRadius: 0.1,  waterOpacity: 0.2,
      greenGrowthRadius: 0,    greenOpacity: 0,
      lavaOpacity: 0,          cloudOpacity: 0.35,
      atmosphereDensity: 0.25, atmosphereColor: '#6699bb', cloudRotationSpeed: 0.003,
    },
    // Phase 4: habitable (final target)
    {
      waterGrowthRadius: 0.6,  waterOpacity: 0.8,
      greenGrowthRadius: 0.3,  greenOpacity: 0.4,
      lavaOpacity: 0,          cloudOpacity: 0.5,
      atmosphereDensity: 0.3,  atmosphereColor: '#4488ff', cloudRotationSpeed: 0.004,
    },
  ],
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * TerraformingService — year-tick engine for Mars and Venus.
 *
 * Reacts to gameYear via effect(), accumulates atmospheric changes from active
 * player choices, drives terraforming-phase advancement, fires priority culture
 * events on phase transitions, and pushes updated PlanetVisualParams to
 * GameStateService every year.
 *
 * Holds NO state of its own. All state lives in GameStateService.
 *
 * Public API:
 *   applyChoice(planetId, choiceId, permanent) — called by TechTreeService.
 */
@Injectable({ providedIn: 'root' })
export class TerraformingService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  constructor() {
    effect(() => {
      const year = this.gameState.gameYear();
      untracked(() => this.processYear(year));
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Applies a terraforming choice to a planet.
   * Called by TechTreeService when an apply_terraforming_choice effect fires.
   *
   * Validates the choice is not locked out, writes to GameStateService, handles
   * special-case side effects (polar detonation, Europa impact), and emits
   * terraformingChoiceApplied$.
   */
  applyChoice(planetId: string, choiceId: string, permanent: boolean): void {
    const planet = this.gameState.planets()[planetId];
    if (!planet) return;

    if (planet.lockedOutChoices.includes(choiceId)) return;

    this.gameState.applyTerraformingChoice(planetId, choiceId, permanent);

    // Special case: polar detonation — radiation hazard + locked choices
    if (choiceId === 'mars_polar_detonation') {
      const currentYear = this.gameState.gameYear();
      this.gameState.setMarsRadiationClearYear(planetId, currentYear + 40);
      // Magnetic umbrella is incompatible post-detonation; bio-seeding delayed by radiation.
      this.gameState.lockOutTerraformingChoices(planetId, [
        'mars_magnetic_umbrella',
        'mars_biological_seeding',
      ]);
    }

    // Special case: Europa impact — authorise the mission with a 50-70 year flight time
    if (choiceId === 'venus_europa_impact') {
      const currentYear = this.gameState.gameYear();
      const delay = Math.floor(Math.random() * 21) + 50; // 50–70 inclusive
      this.gameState.authoriseEuropa(currentYear + delay);
    }

    this.eventBus.terraformingChoiceApplied$.next({ planetId, choiceId });
  }

  // ---------------------------------------------------------------------------
  // Year tick
  // ---------------------------------------------------------------------------

  /**
   * Called once per game-year tick (via effect + untracked).
   * Processes all terraformed planets: accumulates choice contributions,
   * updates atmosphere, advances phase if progress >= 1, refreshes visual params.
   */
  private processYear(year: number): void {
    // Snapshot the planets signal once — mutations during the loop must not be re-read
    // mid-iteration to avoid inconsistent intermediate state.
    const planets = this.gameState.planets();

    for (const planetId of TERRAFORMED_PLANETS) {
      const planet = planets[planetId];
      if (!planet) continue; // not yet unlocked

      let pressureDelta = 0;
      let tempDelta = 0;
      let progressDelta = 0;

      for (const [choiceId, choice] of Object.entries(planet.terraformingChoices)) {
        if (!choice.active) continue;
        const rates = CHOICE_RATES[planetId]?.[choiceId];
        if (!rates) continue;
        pressureDelta += rates.pressureRate;
        tempDelta += rates.tempRate;
        progressDelta += rates.phaseContribution;
      }

      this.gameState.updatePlanetAtmosphere(planetId, pressureDelta, tempDelta);

      const newProgress = Math.min(1, planet.terraformingProgress + progressDelta);
      this.gameState.setTerraformingProgress(planetId, newProgress);

      if (newProgress >= 1.0) {
        this._advancePhase(planetId, year);
      }

      this._computeAndUpdateVisualParams(planetId, year);
    }
  }

  // ---------------------------------------------------------------------------
  // Phase advancement
  // ---------------------------------------------------------------------------

  private _advancePhase(planetId: string, year: number): void {
    this.gameState.advanceTerraformingPhase(planetId); // phase++, progress = 0
    this.gameState.setTerraformTransitionYears(planetId, year, year + PHASE_TRANSITION_YEARS);

    // Re-read AFTER mutation to get the true new phase number.
    const newPhase = this.gameState.planets()[planetId]?.terraformingPhase ?? 0;

    this.eventBus.terraformingPhaseChanged$.next({ planetId, phase: newPhase });

    // Queue a priority culture event if one is defined for this phase transition.
    const ceId = PHASE_CE_IDS[planetId]?.[newPhase - 1] ?? null;
    if (ceId && this.data.getCultureEvent(ceId)) {
      this.gameState.addPriorityEvent(ceId, year);
    }
  }

  // ---------------------------------------------------------------------------
  // Visual params
  // ---------------------------------------------------------------------------

  /**
   * Derives PlanetVisualParams from the current phase and the lerp window
   * [terraformStartYear, terraformEndYear]. Every param is computed via
   * getValueAtYear() — pure, deterministic, save/load-safe.
   *
   * Derivation per param:
   *  waterGrowthRadius / waterOpacity   — lerp from phase-N to phase-N+1 target
   *  greenGrowthRadius / greenOpacity   — same; non-zero only from phase 2 onwards (Mars)
   *  lavaOpacity / lavaHueShift         — Mars only; cools from detonation heat
   *  cloudOpacity                       — builds on Mars, thins on Venus
   *  atmosphereDensity                  — increases (Mars) or decreases (Venus)
   *  atmosphereColor                    — hex lerp via lerpColor()
   *  cloudRotationSpeed                 — speeds up as atmosphere thickens (Mars)
   *
   * axisSpinSpeed and cityLightsIntensity are NOT updated here; they are set
   * at init and owned by other systems.
   */
  private _computeAndUpdateVisualParams(planetId: string, year: number): void {
    const planet = this.gameState.planets()[planetId];
    if (!planet) return;

    const targets = PHASE_VISUAL_TARGETS[planetId];
    if (!targets) return;

    const phase = planet.terraformingPhase;
    const lastIdx = targets.length - 1;
    const fromParams = targets[Math.min(phase, lastIdx)];
    const toParams = targets[Math.min(phase + 1, lastIdx)];

    const lv = (from: number | undefined, to: number | undefined): number =>
      getValueAtYear(year, planet.terraformStartYear, planet.terraformEndYear, from ?? 0, to ?? 0);

    const params: Partial<PlanetVisualParams> = {
      waterGrowthRadius:  lv(fromParams.waterGrowthRadius,  toParams.waterGrowthRadius),
      waterOpacity:       lv(fromParams.waterOpacity,       toParams.waterOpacity),
      greenGrowthRadius:  lv(fromParams.greenGrowthRadius,  toParams.greenGrowthRadius),
      greenOpacity:       lv(fromParams.greenOpacity,       toParams.greenOpacity),
      lavaOpacity:        lv(fromParams.lavaOpacity,        toParams.lavaOpacity),
      lavaHueShift:       lv(fromParams.lavaHueShift,       toParams.lavaHueShift),
      cloudOpacity:       lv(fromParams.cloudOpacity,       toParams.cloudOpacity),
      atmosphereDensity:  lv(fromParams.atmosphereDensity,  toParams.atmosphereDensity),
      cloudRotationSpeed: lv(fromParams.cloudRotationSpeed, toParams.cloudRotationSpeed),
      atmosphereColor: lerpColor(
        fromParams.atmosphereColor ?? '#000000',
        toParams.atmosphereColor   ?? '#000000',
        getValueAtYear(year, planet.terraformStartYear, planet.terraformEndYear, 0, 1),
      ),
    };

    this.gameState.updatePlanetVisualParams(planetId, params);
  }
}
