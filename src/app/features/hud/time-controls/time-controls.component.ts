import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { GameStateService } from '@app/core/services/game-state.service';

/**
 * TimeControlsComponent — pause/resume and speed toggle buttons for the HUD.
 *
 * All state is derived from GameStateService signals; this component has no state of its own.
 * Speed 4× is hidden on first playthrough (see GDD / isFirstPlaythrough signal).
 *
 * Button actions delegate to GameLoopService so the game clock is authoritative.
 */
@Component({
  selector: 'app-time-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-controls.component.html',
  styleUrl: './time-controls.component.scss',
})
export class TimeControlsComponent {
  private readonly gameLoop = inject(GameLoopService);
  private readonly gameState = inject(GameStateService);

  readonly isPaused = this.gameState.isPaused;
  readonly gameSpeed = this.gameState.gameSpeed;
  readonly isFirstPlaythrough = this.gameState.isFirstPlaythrough;

  togglePause(): void {
    if (this.isPaused()) {
      this.gameLoop.resume();
    } else {
      this.gameLoop.pause();
    }
  }

  setSpeed(speed: 1 | 4): void {
    this.gameLoop.setSpeed(speed);
  }
}
