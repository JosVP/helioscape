import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameStateService } from '@app/core/services/game-state.service';
import { GameYearPipe } from '@app/shared/pipes/game-year.pipe';

/**
 * YearLabelComponent — displays the current game year in the HUD.
 *
 * Simple display component; reads from GameStateService only.
 */
@Component({
  selector: 'app-year-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameYearPipe],
  templateUrl: './year-label.component.html',
  styleUrl: './year-label.component.scss',
})
export class YearLabelComponent {
  protected readonly gameState = inject(GameStateService);
}
