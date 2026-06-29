import { Injectable, effect, inject, untracked } from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { ResearchNode, ResearchSlot } from '@app/core/models';
import { TechTreeService } from './tech-tree.service';

/**
 * ResearchService — pure system service.
 *
 * Drives progress on all active research nodes using visible research slots.
 *
 * Progress is derived from (startYear, elapsedBeforeStart, currentYear) — pure
 * integer arithmetic, save/load safe, no stored progress floats.
 *
 * This service holds NO state. All state lives in GameStateService.
 */
@Injectable({ providedIn: 'root' })
export class ResearchService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);
  private readonly techTree = inject(TechTreeService);

  constructor() {
    effect(() => {
      const year = this.gameState.gameYear();
      untracked(() => this.processYear(year));
    });
  }

  // ---------------------------------------------------------------------------
  // Unified track definition lookup
  // ---------------------------------------------------------------------------

  /**
   * Returns duration for a canonical ResearchNode entry.
   * Returns null when the id is unknown.
   */
  private getTrackDef(trackId: string): { durationYears: number } | null {
    const node = this.data.getResearchNode(trackId);
    return node ? { durationYears: node.durationYears } : null;
  }

  /** Elapsed years for a track at the given current year. */
  private elapsed(
    track: { startYear: number; elapsedBeforeStart: number; isPaused: boolean },
    year: number
  ): number {
    return track.elapsedBeforeStart + (track.isPaused ? 0 : year - track.startYear);
  }

  // ---------------------------------------------------------------------------
  // Tick handler
  // ---------------------------------------------------------------------------

  /**
   * Called once per game-year tick. Checks every non-paused active track for
   * completion using year-derived elapsed time. No stored progress is mutated
   * per tick — completion is the only mutation.
   */
  processYear(year: number): void {
    const tracks = this.gameState.activeResearch();
    for (const track of tracks) {
      if (track.isPaused) continue;
      const def = this.getTrackDef(track.trackId);
      if (!def) continue;
      const totalElapsed = this.elapsed(track, year);
      if (totalElapsed >= def.durationYears) {
        this._completeTrack(track.trackId, track.planetId);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Track completion
  // ---------------------------------------------------------------------------

  private _completeTrack(trackId: string, planetId: string): void {
    this.gameState.completeResearch(trackId, this.gameState.gameYear());

    if (this.data.getTechNode(trackId)) {
      // Delegate to TechTreeService (handles fork logic etc.).
      this.techTree.completeNodeResearch(planetId, trackId);
      this.eventBus.researchCompleted$.next(trackId);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API — ResearchTrack (research-tracks.json) path
  // ---------------------------------------------------------------------------

  /**
   * Returns true if a ResearchTrack can be started.
   */
  canStartTrack(trackId: string): boolean {
    const node = this.data.getResearchNode(trackId);
    return node ? this.canStartResearchNode(node, node.planet) : false;
  }

  /** Starts or resumes a ResearchTrack. */
  startTrack(trackId: string, planetId: string): void {
    const existing = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (existing?.isPaused) {
      this.resumeTrack(trackId);
      return;
    }
    const node = this.data.getResearchNode(trackId);
    if (!node) return;
    const slotId = this.getAssignableSlotId(node);
    if (!slotId || !this.canStartResearchNode(node, planetId)) return;
    this.gameState.startResearch(trackId, planetId, this.gameState.gameYear(), slotId);
    this.eventBus.researchTrackStarted$.next({ trackId, planetId });
  }

  // ---------------------------------------------------------------------------
  // Public API — TechNode path (called from ResearchHub)
  // ---------------------------------------------------------------------------

  /**
   * Returns true if a TechNode can be queued as a timed track.
   * Prereqs are verified by TechTreeService.canUnlock(); capacity is checked here.
   */
  canStartTechTrack(nodeId: string, planetId: string): boolean {
    const node = this.data.getResearchNode(nodeId);
    if (!node) return false;
    return this.canStartResearchNode(node, planetId);
  }

  /**
   * Starts a TechNode as a timed track, or resumes it if paused.
   * Does nothing if canStartTechTrack returns false.
   */
  startTechTrack(nodeId: string, planetId: string): void {
    const existing = this.gameState.activeResearch().find((t) => t.trackId === nodeId);
    if (existing?.isPaused) {
      this.resumeTrack(nodeId);
      return;
    }
    const node = this.data.getResearchNode(nodeId);
    if (!node) return;
    const slotId = this.getAssignableSlotId(node);
    if (!slotId || !this.canStartTechTrack(nodeId, planetId)) return;
    this.gameState.startResearch(nodeId, planetId, this.gameState.gameYear(), slotId);
    this.eventBus.researchTrackStarted$.next({ trackId: nodeId, planetId });
  }

  // ---------------------------------------------------------------------------
  // Shared pause/resume
  // ---------------------------------------------------------------------------

  /** Pauses a running track (ResearchTrack or TechNode). */
  pauseTrack(trackId: string): void {
    const track = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (!track || track.isPaused) return;
    this.gameState.pauseResearch(trackId);
  }

  /** Resumes a paused track, checking RP capacity first. */
  resumeTrack(trackId: string): void {
    const track = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (!track?.isPaused) return;
    const node = this.data.getResearchNode(trackId);
    if (!node) return;
    const slotId = this.getAssignableSlotId(node);
    if (!slotId) return;
    this.gameState.resumeResearch(trackId, slotId);
    this.eventBus.researchTrackStarted$.next({ trackId, planetId: track.planetId });
  }

  private canStartResearchNode(node: ResearchNode, planetId: string): boolean {
    if (this.gameState.completedTechs().includes(node.id)) return false;
    const existing = this.gameState.activeResearch().find((track) => track.trackId === node.id);
    if (existing && !existing.isPaused) return false;
    if (existing?.isPaused) return this.getAssignableSlotId(node) !== null;
    if (!this.techTree.canUnlock(planetId, node.id)) return false;
    return this.getAssignableSlotId(node) !== null;
  }

  private getAssignableSlotId(node: ResearchNode): string | null {
    const freeSlots = this.getFreeSlotsForNode(node);
    if (node.collaborative) {
      return freeSlots.length === this.gameState.visibleResearchSlots().length ? 'collaborative' : null;
    }
    return freeSlots[0]?.id ?? null;
  }

  private getFreeSlotsForNode(node: ResearchNode): ResearchSlot[] {
    if (this.hasRunningCollaborativeResearch()) return [];
    return this.gameState.availableResearchSlots().filter((slot) => this.canSlotRunNode(slot, node));
  }

  private canSlotRunNode(slot: ResearchSlot, node: ResearchNode): boolean {
    if (slot.kind === 'default') {
      return node.colonySlotPlanet === undefined;
    }
    return node.colonySlotPlanet === slot.planetId || node.planet === slot.planetId;
  }

  private hasRunningCollaborativeResearch(): boolean {
    return this.gameState.activeResearch().some((track) => !track.isPaused && track.slotId === 'collaborative');
  }
}

