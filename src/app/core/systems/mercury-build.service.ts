import { Injectable, effect, inject, untracked } from '@angular/core';
import type { MercuryQueueEntry, ResourceStore } from '@app/core/models';
import type { MercuryComponent } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

/**
 * MercuryBuildService — manages the Mercury orbital component build queue.
 *
 * Processes one queue entry per game-year tick (the head entry advances by 1 year).
 * When an entry completes, applies its arrival effect to the target planet's PlanetBioState
 * and emits mercuryBuildCompleted$ so downstream systems (future AudioService, HUD) can react.
 *
 * This service is separate from the Mercury grid-building placement system. It handles:
 *   - ODN (Orbital Deployment Network)
 *   - Precipitation Engines
 *   - Atmospheric Catalyst Ships
 *   - Orbital Bioreactors
 *
 * NOTE: This service is providedIn: 'root' but must be injected by something in the
 * application tree for its effect() to run. Wire it up in GameShellComponent once that
 * stub is replaced (see TODO.md: Routes — GameShellComponent stub).
 *
 * Public API consumed by the Mercury HUD (Block 9):
 *   queueComponent(componentId, targetPlanet): boolean
 */
@Injectable({ providedIn: 'root' })
export class MercuryBuildService {
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
   * Validates and enqueues an orbital component build for the given target planet.
   *
   * Validation order:
   *   1. Component must exist in DataService.
   *   2. Unlock condition must be met (completedTechs or earthFlags).
   *   3. maxInstances must not be exceeded (counts both in-queue and already-built).
   *   4. Mercury resources must be sufficient.
   *
   * Resources are only deducted after all other checks pass.
   *
   * Returns true on success, false on any validation failure.
   */
  queueComponent(componentId: string, targetPlanet: string): boolean {
    const component = this.data.getMercuryComponent(componentId);
    if (!component) {
      return false;
    }

    if (component.unlockCondition !== null && !this._unlockConditionMet(component.unlockCondition)) {
      return false;
    }

    if (
      component.maxInstances !== null &&
      this._countQueuedAndBuilt(componentId, targetPlanet) >= component.maxInstances
    ) {
      return false;
    }

    if (!this._deductCosts(component.cost)) {
      return false;
    }

    this.gameState.enqueueMercuryComponent({
      componentId,
      targetPlanet,
      progressYears: 0,
      totalYears: component.buildTimeYears,
    });

    return true;
  }

  // ---------------------------------------------------------------------------
  // Year processing — called via effect()
  // ---------------------------------------------------------------------------

  processYear(_year: number): void {
    const queue = this.gameState.mercuryBuildQueue();
    if (queue.length === 0) {
      return;
    }

    this.gameState.advanceMercuryBuildProgress();

    // Re-read after the update — the signal is updated synchronously.
    const updatedHead = this.gameState.mercuryBuildQueue()[0];
    if (updatedHead && updatedHead.progressYears >= updatedHead.totalYears) {
      this._completeBuild(updatedHead);
      this.gameState.shiftMercuryBuildQueue();
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _completeBuild(entry: MercuryQueueEntry): void {
    // Apply bio-state effects before emitting, so any immediate subscriber sees updated state.
    this.gameState.applyComponentArrival(entry.targetPlanet, entry.componentId);
    this.eventBus.mercuryBuildCompleted$.next(entry.componentId);
    // TODO: Play a build-complete sound via AudioService when it is implemented.
    // See docs/agents/TODO.md: "MercuryBuildService — AudioService on build complete".
  }

  /**
   * Returns true if the given condition string is satisfied.
   * A condition is met if it is either a completed tech id or a truthy earthFlag key.
   */
  private _unlockConditionMet(condition: string): boolean {
    return (
      this.gameState.completedTechs().includes(condition) ||
      this.gameState.earthFlags()[condition] === true
    );
  }

  /**
   * Deducts the given resource costs from the Mercury inventory.
   * Returns false (without deducting anything) if any resource is insufficient.
   * Returns true and applies the deduction on success.
   */
  private _deductCosts(cost: ResourceStore): boolean {
    const current = this.gameState.mercuryResources();
    if (
      current.commonOre < cost.commonOre ||
      current.rareMetals < cost.rareMetals ||
      current.polarVolatiles < cost.polarVolatiles
    ) {
      return false;
    }

    this.gameState.updateMercuryResources({
      commonOre: -cost.commonOre,
      rareMetals: -cost.rareMetals,
      polarVolatiles: -cost.polarVolatiles,
    });

    return true;
  }

  /**
   * Counts how many instances of a component are currently in-queue or already built
   * for the given target planet. Used to enforce maxInstances.
   */
  private _countQueuedAndBuilt(componentId: string, targetPlanet: string): number {
    const inQueue = this.gameState
      .mercuryBuildQueue()
      .filter((e) => e.componentId === componentId && e.targetPlanet === targetPlanet).length;

    const bio = this.gameState.bioPhases()[targetPlanet];
    let built = 0;
    if (bio) {
      switch (componentId) {
        case 'odn':
          built = bio.odnBuilt ? 1 : 0;
          break;
        case 'precipitationEngine':
          built = bio.precipitationEnginesBuilt;
          break;
        case 'atmosphericCatalystShip':
          built = bio.atmosphericCatalystShipsBuilt;
          break;
        case 'bioreactor':
          built = bio.bioreactorBatchesActive;
          break;
        default:
          built = 0;
      }
    }

    return inQueue + built;
  }

  /**
   * Returns the static component definition for a given id.
   * Used in tests to introspect component metadata without reaching into DataService.
   * @internal
   */
  _getComponentDef(componentId: string): MercuryComponent | undefined {
    return this.data.getMercuryComponent(componentId);
  }
}
