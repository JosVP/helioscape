import { Injectable, effect, inject, untracked } from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from './tech-tree.service';

/**
 * ResearchService — pure system service.
 *
 * Drives progress on all active, non-paused research tracks once per game year.
 * When a track completes, applies its onCompleteEffects via TechTreeService and
 * emits researchCompleted$ so the rest of the system can react (UI, audio, etc.).
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
  // Tick handler
  // ---------------------------------------------------------------------------

  /**
   * Called once per game-year tick. Advances every non-paused active track by 1
   * year and completes any tracks that have reached their duration.
   *
   * The year parameter is accepted (but not used) to make the method easier to
   * test without mocking signal reads inside the body.
   */
  private processYear(_year: number): void {
    // Snapshot the list before mutating so we process the same set per tick.
    const tracks = this.gameState.activeResearch();

    for (const track of tracks) {
      if (track.isPaused) continue;

      this.gameState.advanceResearch(track.trackId, 1);

      const def = this.data.getResearchTrack(track.trackId);
      if (!def) continue;

      // Re-read from signal after mutation to get the true post-advance value.
      const updated = this.gameState
        .activeResearch()
        .find((t) => t.trackId === track.trackId);

      if (updated && updated.progressYears >= def.durationYears) {
        this._completeTrack(track.trackId, track.planetId);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Track completion
  // ---------------------------------------------------------------------------

  private _completeTrack(trackId: string, planetId: string): void {
    const def = this.data.getResearchTrack(trackId);
    if (!def) return;

    // Removes track from activeResearch and adds trackId to completedTechs.
    this.gameState.completeResearch(trackId);

    // Apply any downstream effects (unlock_tech, emit_event, etc.).
    this.techTree.applyEffects(def.onCompleteEffects, planetId);

    this.eventBus.researchCompleted$.next(trackId);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns true if a research track can be started (or resumed if paused).
   *
   * Checks:
   * 1. Track data exists.
   * 2. Track has not already been completed.
   * 3. Track is not already running (non-paused).
   * 4. prerequisiteTech is in completedTechs.
   * 5. For new tracks: enough RP capacity is available.
   *    For paused tracks: capacity is checked by resumeTrack() at resume time.
   */
  canStartTrack(trackId: string): boolean {
    const def = this.data.getResearchTrack(trackId);
    if (!def) return false;

    const completed = this.gameState.completedTechs();

    if (completed.includes(trackId)) return false;
    if (!completed.includes(def.prerequisiteTech)) return false;

    const existing = this.gameState.activeResearch().find((t) => t.trackId === trackId);

    // Already running (not paused) — cannot start again.
    if (existing && !existing.isPaused) return false;

    // Paused track: capacity is validated at resume time, so it's always "startable" here.
    if (existing?.isPaused) return true;

    // New track: check RP capacity.
    return this.gameState.usedRpCapacity() + def.rpCost <= this.gameState.totalRpCapacity();
  }

  /**
   * Starts a new research track, or resumes it if it is currently paused.
   * Does nothing if canStartTrack returns false.
   */
  startTrack(trackId: string, planetId: string): void {
    const existing = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (existing?.isPaused) {
      this.resumeTrack(trackId);
      return;
    }
    if (!this.canStartTrack(trackId)) return;
    this.gameState.startResearch(trackId, planetId);
  }

  /**
   * Pauses an active, non-paused research track.
   * The track's rpCost is freed from usedRpCapacity automatically (computed signal).
   */
  pauseTrack(trackId: string): void {
    const track = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (!track || track.isPaused) return;
    this.gameState.pauseResearch(trackId);
  }

  /**
   * Resumes a paused research track.
   * Guards against resuming when there is insufficient RP capacity.
   */
  resumeTrack(trackId: string): void {
    const track = this.gameState.activeResearch().find((t) => t.trackId === trackId);
    if (!track?.isPaused) return;

    const def = this.data.getResearchTrack(trackId);
    if (!def) return;

    if (this.gameState.usedRpCapacity() + def.rpCost > this.gameState.totalRpCapacity()) return;

    this.gameState.resumeResearch(trackId);
  }
}
