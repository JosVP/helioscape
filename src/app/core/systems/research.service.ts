import { Injectable, effect, inject, untracked } from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from './tech-tree.service';

/**
 * ResearchService — pure system service.
 *
 * Drives progress on all active research tracks (both ResearchTrack and TechNode
 * tracks share a single queue and a single RP capacity pool).
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
   * Returns duration and rpCost for either a ResearchTrack or TechNode entry.
   * Returns null when the id is unknown in both data sources.
   */
  private getTrackDef(trackId: string): { durationYears: number; rpCost: number } | null {
    const rt = this.data.getResearchTrack(trackId);
    if (rt) return { durationYears: rt.durationYears, rpCost: rt.rpCost };
    const tn = this.data.getTechNode(trackId);
    if (tn) return { durationYears: tn.durationYears, rpCost: tn.rpCost };
    return null;
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

    const rt = this.data.getResearchTrack(trackId);
    if (rt) {
      // ResearchTrack path: apply onCompleteEffects directly.
      this.techTree.applyEffects(rt.onCompleteEffects, planetId);
      this.eventBus.researchCompleted$.next(trackId);
      return;
    }

    if (this.data.getTechNode(trackId)) {
      // TechNode path: delegate to TechTreeService (handles fork logic etc.).
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
    const def = this.data.getResearchTrack(trackId);
    if (!def) return false;

    const completed = this.gameState.completedTechs();
    if (completed.includes(trackId)) return false;
    if (!completed.includes(def.prerequisiteTech)) return false;

    const existing = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (existing && !existing.isPaused) return false;
    if (existing?.isPaused) return true; // capacity validated at resume

    return this.gameState.usedRpCapacity() + def.rpCost <= this.gameState.totalRpCapacity();
  }

  /** Starts or resumes a ResearchTrack. */
  startTrack(trackId: string, planetId: string): void {
    const existing = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (existing?.isPaused) {
      this.resumeTrack(trackId);
      return;
    }
    if (!this.canStartTrack(trackId)) return;
    this.gameState.startResearch(trackId, planetId, this.gameState.gameYear());
  }

  // ---------------------------------------------------------------------------
  // Public API — TechNode path (called from ResearchHub)
  // ---------------------------------------------------------------------------

  /**
   * Returns true if a TechNode can be queued as a timed track.
   * Prereqs are verified by TechTreeService.canUnlock(); capacity is checked here.
   */
  canStartTechTrack(nodeId: string, planetId: string): boolean {
    const node = this.data.getTechNode(nodeId);
    if (!node) return false;
    if (this.gameState.completedTechs().includes(nodeId)) return false;
    const alreadyActive = this.gameState.activeResearch().find((t) => t.trackId === nodeId);
    if (alreadyActive && !alreadyActive.isPaused) return false;
    if (!this.techTree.canUnlock(planetId, nodeId)) return false;
    return this.gameState.usedRpCapacity() + node.rpCost <= this.gameState.totalRpCapacity();
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
    if (!this.canStartTechTrack(nodeId, planetId)) return;
    this.gameState.startResearch(nodeId, planetId, this.gameState.gameYear());
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
    const def = this.getTrackDef(trackId);
    if (!def) return;
    if (this.gameState.usedRpCapacity() + def.rpCost > this.gameState.totalRpCapacity()) return;
    this.gameState.resumeResearch(trackId);
  }
}

