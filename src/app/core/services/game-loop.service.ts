import { Injectable, DestroyRef, computed, effect, inject, untracked } from '@angular/core';
import { GameStateService } from './game-state.service';

/**
 * GameLoopService — the single game clock.
 *
 * Drives gameYear forward via GameStateService.advanceYear() on each tick.
 * Uses setInterval (not RAF). All visual animation runs in component RAF loops independently.
 *
 * Speed: 1× = 1 year/s, 4× = 1 year/500 ms.
 * Pause/resume preserves the remaining time in the current tick cycle for a clean feel.
 */
@Injectable({ providedIn: 'root' })
export class GameLoopService {
  private readonly gameState = inject(GameStateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw handle for the active setInterval (or leading setTimeout on resume). */
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Milliseconds remaining in the current tick cycle at the moment stop()/pause() was called.
   * Used by resume() so a paused mid-cycle tick fires at the right time instead of resetting.
   */
  private remainingMs: number = 0;

  /** Wall-clock timestamp of when the latest tick cycle started (for remainingMs calculation). */
  private cycleStart: number = 0;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Derived tick interval driven by the GameStateService gameSpeed signal. */
  readonly tickMs = computed(() => (this.gameState.gameSpeed() === 4 ? 500 : 1000));

  constructor() {
    // When gameSpeed changes, restart the interval immediately with the new tickMs.
    // untracked() prevents this effect from tracking any signals inside the restart logic.
    effect(() => {
      const ms = this.tickMs(); // reactive dependency
      untracked(() => {
        if (this.intervalId !== null) {
          this.cancelScheduled(/* saveRemaining */ false);
          this.schedule(ms);
        }
      });
    });

    this.destroyRef.onDestroy(() => this.stop());
  }

  /** Start the game clock from scratch (no-op if already running). */
  start(): void {
    if (this.intervalId !== null) return;
    this.remainingMs = 0;
    this.schedule(this.tickMs());
  }

  /** Stop the clock. Stores remaining tick time so resume() can catch up cleanly. */
  stop(): void {
    this.cancelScheduled(/* saveRemaining */ true);
  }

  /** Stop the clock and mark the game as paused. */
  pause(): void {
    this.cancelScheduled(/* saveRemaining */ true);
    if (!this.gameState.isPaused()) {
      this.gameState.togglePause();
    }
  }

  /** Unpause and restart the clock, honouring any saved remaining tick time. */
  resume(): void {
    if (this.gameState.isPaused()) {
      this.gameState.togglePause();
    }
    this.schedule(this.tickMs());
  }

  /**
   * Switch game speed.
   * The effect() watching tickMs will restart the interval if the clock is running.
   */
  setSpeed(speed: 1 | 4): void {
    this.gameState.setSpeed(speed);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Start the recurring interval, optionally firing a short leading timeout first
   * to honour any remainingMs left over from a previous pause.
   */
  private schedule(ms: number): void {
    const firstDelay = this.remainingMs > 0 ? this.remainingMs : ms;
    this.remainingMs = 0;
    this.cycleStart = Date.now();

    if (firstDelay < ms) {
      // A partial tick is owed — fire it after firstDelay, then switch to the full cadence.
      this.intervalId = setTimeout(() => {
        this.tick();
        this.cycleStart = Date.now();
        this.intervalId = setInterval(() => {
          this.cycleStart = Date.now();
          this.tick();
        }, ms);
      }, firstDelay) as unknown as ReturnType<typeof setInterval>;
    } else {
      this.intervalId = setInterval(() => {
        this.cycleStart = Date.now();
        this.tick();
      }, ms);
    }
  }

  /**
   * Cancel the active interval/timeout.
   * @param saveRemaining When true, records how many ms were left in the current cycle
   *   so resume() can fire the next tick at the correct time.
   */
  private cancelScheduled(saveRemaining: boolean): void {
    if (this.intervalId === null) return;
    // In the browser both clearTimeout and clearInterval accept the same numeric handle.
    clearTimeout(this.intervalId as unknown as ReturnType<typeof setTimeout>);
    clearInterval(this.intervalId);
    this.remainingMs = saveRemaining
      ? Math.max(0, this.tickMs() - (Date.now() - this.cycleStart))
      : 0;
    this.intervalId = null;
  }

  /** Advance the game year — only when the game is not paused. */
  private tick(): void {
    if (!this.gameState.isPaused()) {
      this.gameState.advanceYear();
      // System services react to gameYear changes via their own effect() calls.
      // GameLoopService does NOT process year events directly.
    }
  }
}
