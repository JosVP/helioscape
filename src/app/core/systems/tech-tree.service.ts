import { Injectable, inject } from '@angular/core';
import type { TechNode, TechEffect, ForkChoice } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';

/**
 * TechTreeService — pure system service.
 *
 * Owns all tech-tree logic: prerequisite checking, unlocking, fork presentation
 * and resolution, and tech effect processing.
 *
 * This service holds NO state of its own. It reads from DataService and
 * GameStateService, calls mutation methods on GameStateService, and emits
 * notifications on EventBusService.
 *
 * Signals that depend on completedTechs (e.g. GameStateService.rpCapacityBoosts)
 * are updated automatically when unlockTech() is called — no explicit handling
 * is needed for rp_capacity_boost effects.
 */
@Injectable({ providedIn: 'root' })
export class TechTreeService {
  private readonly data = inject(DataService);
  private readonly gameState = inject(GameStateService);
  private readonly eventBus = inject(EventBusService);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the given tech node can currently be unlocked on this planet.
   *
   * Checks (in order):
   * 1. Node exists in data.
   * 2. No pending fork (must resolve fork before unlocking anything).
   * 3. Not already completed (idempotent guard).
   * 4. All standard prerequisites satisfied, respecting prerequisiteMode.
   * 5. All spilloverPrerequisites satisfied (always 'all', independent of prerequisiteMode).
   * 6. spilloverGate satisfied if present (naturalistCount >= gate.count).
   */
  canUnlock(planetId: string, nodeId: string): boolean {
    const node = this.data.getTechNode(nodeId);
    if (!node) return false;

    // A pending fork must be resolved before any further unlocks.
    if (this.gameState.pendingFork() !== null) return false;

    const completed = this.gameState.completedTechs();

    // Already unlocked — do not re-unlock.
    if (completed.includes(nodeId)) return false;

    // Check standard prerequisites using prerequisiteMode.
    if (node.prerequisites.length > 0) {
      const mode = node.prerequisiteMode ?? 'all';
      const prereqsMet =
        mode === 'any'
          ? node.prerequisites.some((id) => completed.includes(id))
          : node.prerequisites.every((id) => completed.includes(id));
      if (!prereqsMet) return false;
    }

    // Spillover prerequisites are always AND-mode regardless of prerequisiteMode.
    if (node.spilloverPrerequisites.length > 0) {
      const spilloverMet = node.spilloverPrerequisites.every((id) => completed.includes(id));
      if (!spilloverMet) return false;
    }

    // Spillover gate: minimum naturalist-tagged techs required.
    if (node.spilloverGate) {
      // Currently only 'min_naturalist_nodes' is defined in the model.
      const gatemet = this.gameState.naturalistCount() >= node.spilloverGate.count;
      if (!gatemet) return false;
    }

    return true;
  }

  /**
   * Attempts to unlock a tech node.
   *
   * - If canUnlock returns false, does nothing.
   * - If the node contains a 'present_fork' effect, presents the fork to the
   *   player and returns without adding the tech to completedTechs. The tech is
   *   added to completedTechs when completeForkChoice() is called.
   * - Otherwise, adds the tech to completedTechs, processes all effects, and
   *   emits techUnlocked$.
   */
  unlockTech(planetId: string, nodeId: string): void {
    if (!this.canUnlock(planetId, nodeId)) return;

    const node = this.data.getTechNode(nodeId)!;

    // Check for a fork effect before completing the tech.
    const forkEffect = node.effects.find(
      (e): e is Extract<TechEffect, { type: 'present_fork' }> => e.type === 'present_fork'
    );

    if (forkEffect) {
      // Present the fork; do NOT add to completedTechs yet.
      // completeForkChoice() will call gameState.unlockTech() once resolved.
      this._presentFork(planetId, nodeId, forkEffect);
      return;
    }

    // Mark as completed first so recursive unlock_tech effects can see it.
    this.gameState.unlockTech(nodeId);

    // Process non-fork effects.
    for (const effect of node.effects) {
      this._applyEffect(effect, planetId);
    }

    this.eventBus.techUnlocked$.next({ planetId, nodeId });
  }

  /**
   * Resolves a pending fork choice.
   *
   * Applies the choice's tag, applies all choice effects (which may themselves
   * call unlockTech recursively), adds the fork-bearing tech to completedTechs,
   * clears the pending fork, and emits techUnlocked$.
   */
  completeForkChoice(planetId: string, techId: string, choiceId: string): void {
    const node = this.data.getTechNode(techId);
    if (!node) return;

    const forkEffect = node.effects.find(
      (e): e is Extract<TechEffect, { type: 'present_fork' }> => e.type === 'present_fork'
    );
    if (!forkEffect) return;

    const choice = forkEffect.choices.find((c): c is ForkChoice => c.id === choiceId);
    if (!choice) return;

    // Apply the choice's tag (naturalist / architect).
    if (choice.tag === 'naturalist') {
      this.gameState.incrementNaturalist();
    } else if (choice.tag === 'architect') {
      this.gameState.incrementArchitect();
    }

    // Apply all effects carried by this fork choice.
    for (const effect of choice.effects) {
      this._applyEffect(effect, planetId);
    }

    // Add the fork-bearing tech to completedTechs now that the choice is resolved.
    this.gameState.unlockTech(techId);

    // Clear pendingFork (GameStateService.completeFork validates ids then sets null).
    this.gameState.completeFork(techId, choiceId);

    this.eventBus.techUnlocked$.next({ planetId, nodeId: techId });
  }

  /**
   * Returns all tech nodes for this planet that currently pass canUnlock().
   * Call inside a computed() in components/services that need reactive behaviour.
   */
  getAvailableTechs(planetId: string): TechNode[] {
    return this.data
      .getTechNodesForPlanet(planetId)
      .filter((node) => this.canUnlock(planetId, node.id));
  }

  /**
   * Returns all tech nodes for this planet that are in completedTechs.
   * Call inside a computed() in components/services that need reactive behaviour.
   */
  getCompletedTechs(planetId: string): TechNode[] {
    const done = new Set(this.gameState.completedTechs());
    return this.data.getTechNodesForPlanet(planetId).filter((node) => done.has(node.id));
  }

  /**
   * Applies a batch of TechEffects on behalf of another system service
   * (e.g. ResearchService processing onCompleteEffects).
   */
  applyEffects(effects: TechEffect[], planetId: string): void {
    for (const effect of effects) {
      this._applyEffect(effect, planetId);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Sets the pending fork state and notifies listeners that a fork is ready.
   * The fork-bearing tech is NOT added to completedTechs here — that happens
   * in completeForkChoice() once the player makes a selection.
   */
  private _presentFork(
    planetId: string,
    techId: string,
    forkEffect: Extract<TechEffect, { type: 'present_fork' }>
  ): void {
    this.gameState.setPendingFork({
      techId,
      planetId,
      forkId: forkEffect.forkId,
    });
    this.eventBus.forkPresented$.next({ planetId, techId });
  }

  /**
   * Applies a single TechEffect to game state.
   *
   * Each case maps to the corresponding GameStateService mutation.
   * rp_capacity_boost is intentionally a no-op here: GameStateService derives
   * the total RP capacity via a computed signal from completedTechs, so the boost
   * is reflected automatically once the associated tech is in completedTechs.
   *
   * NOTE: apply_terraforming_choice calls gameState.applyTerraformingChoice()
   * directly for now. When TerraformingService is implemented, also call
   * terraformingService.applyChoice() if additional reactive logic is needed.
   * See docs/agents/TODO.md — TechTreeService — TerraformingService integration.
   */
  private _applyEffect(effect: TechEffect, planetId: string): void {
    switch (effect.type) {
      case 'unlock_tech':
        // Recursively unlock the target tech on the same planet.
        // Circular-unlock protection is provided by the completedTechs guard in canUnlock().
        this.unlockTech(planetId, effect.target);
        break;

      case 'emit_event':
        // Queue a culture event to be displayed to the player.
        this.gameState.addToEventQueue({
          eventId: effect.eventId,
          queuedAtYear: this.gameState.gameYear(),
          priority: false,
          wasInterrupted: false,
        });
        break;

      case 'apply_terraforming_choice':
        // Apply a terraforming path choice on the specified planet.
        // NOTE: effect.planet may differ from the calling planetId (cross-planet effects).
        this.gameState.applyTerraformingChoice(effect.planet, effect.choiceId, effect.permanent);
        break;

      case 'tag_decision':
        // Increment the player's ideological alignment counter.
        if (effect.tag === 'naturalist') {
          this.gameState.incrementNaturalist();
        } else {
          this.gameState.incrementArchitect();
        }
        break;

      case 'apply_colonist_bonus':
        // Enable a colonist-lifestyle bonus on the planet.
        this.gameState.setColonistBonus(
          effect.bonus === 'dense_living' ? 'denseLiving' : 'openEnvironment',
          true
        );
        break;

      case 'rp_capacity_boost':
        // No direct mutation needed. GameStateService.rpCapacityBoosts is a computed
        // signal that sums rp_capacity_boost effects across all completedTechs.
        break;

      case 'set_flag':
        // Set a named Earth-state flag used by later-stage features.
        this.gameState.setEarthFlag(effect.flag, true);
        break;

      case 'spillover_unlock':
        // Unlock a tech on a different planet (cross-planet spillover).
        this.unlockTech(effect.targetPlanet, effect.targetTech);
        break;

      case 'present_fork':
        // Nested forks are not supported in this iteration.
        // A fork effect is handled at the unlockTech() call site, not here.
        break;
    }
  }
}
