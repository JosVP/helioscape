import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { SaveService } from '@app/core/services/save.service';
import { CultureEventBellComponent } from '@app/features/culture-events/culture-event-bell/culture-event-bell.component';
import { KardashevBarComponent } from './kardashev-bar/kardashev-bar.component';
import { TimeControlsComponent } from './time-controls/time-controls.component';
import { YearLabelComponent } from './year-label/year-label.component';

/** How long (ms) the autosave indicator remains visible after an autosave completes. */
const AUTOSAVE_VISIBLE_MS = 2500;

/**
 * HudComponent — persistent top-bar overlay shown during gameplay.
 *
 * Layout: [YearLabel] ——— [KardashevBar] ——— [TimeControls]
 * An "Autosaved ✓" indicator fades in/out whenever SaveService.autosaveCompleted fires.
 *
 * NOTE: The setTimeout here is a UI-only dismiss timer, not game logic — this is the only
 * acceptable use of setTimeout in a component (same pattern as initial-load in ARCHITECTURE.md).
 *
 * NOTE: EventBusService is injected but currently unused. Reserved for future milestone toast
 * triggers (e.g. milestoneReached$) without requiring a re-inject.
 */
@Component({
  selector: 'app-hud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YearLabelComponent, KardashevBarComponent, TimeControlsComponent, CultureEventBellComponent],
  templateUrl: './hud.component.html',
  styleUrl: './hud.component.scss',
})
export class HudComponent {
  // Unused at present — see NOTE above.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly eventBus = inject(EventBusService);
  private readonly gameLoop = inject(GameLoopService);
  private readonly gameState = inject(GameStateService);
  private readonly saveService = inject(SaveService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showAutosave = signal(false);

  openResearchHub(): void {
    this.eventBus.researchHubRequested$.next();
  }

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Captures the initial autosaveCompleted counter value so the effect can
   * distinguish the first (no-op) run from a real autosave increment.
   */
  private lastAutosaveCount: number;

  constructor() {
    this.lastAutosaveCount = this.saveService.autosaveCompleted();

    effect(() => {
      const count = this.saveService.autosaveCompleted(); // reactive dependency
      untracked(() => {
        // Skip the synchronous initial run — only react to actual autosave events.
        if (count === this.lastAutosaveCount) return;
        this.lastAutosaveCount = count;

        if (this.autosaveTimer !== null) {
          clearTimeout(this.autosaveTimer);
        }
        this.showAutosave.set(true);
        this.autosaveTimer = setTimeout(() => {
          this.showAutosave.set(false);
          this.autosaveTimer = null;
        }, AUTOSAVE_VISIBLE_MS);
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.autosaveTimer !== null) {
        clearTimeout(this.autosaveTimer);
      }
    });
  }
}
