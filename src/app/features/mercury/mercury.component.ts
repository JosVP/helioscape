import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { GameStateService } from '@app/core/services/game-state.service';
import { MercuryGridComponent } from './mercury-grid/mercury-grid.component';
import { MercurySidebarComponent } from './mercury-hud/sidebar/sidebar.component';
import { MercuryQueueBarComponent } from './mercury-hud/queue-bar/queue-bar.component';

@Component({
  selector: 'app-mercury',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MercuryGridComponent, MercurySidebarComponent, MercuryQueueBarComponent],
  templateUrl: './mercury.component.html',
  styleUrl: './mercury.component.scss',
})
export class MercuryComponent {
  readonly gameState = inject(GameStateService);

  readonly backToOrrery = output<void>();

  /** The building id currently selected for placement. Null = inspect/idle mode. */
  readonly selectedBuildingId = signal<string | null>(null);

  onTileClicked(event: {
    col: number;
    row: number;
    hasBuilding: boolean;
    terrain: string;
    slotId: string | null;
  }): void {
    if (event.hasBuilding) {
      // Deselect placement mode when clicking an occupied tile.
      this.selectedBuildingId.set(null);
    }
    // Building info panel (Block 9.5) and zone selection (Block 9.7) wired here later.
  }
}
