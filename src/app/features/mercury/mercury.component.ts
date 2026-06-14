import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { MercuryGridComponent } from './mercury-grid/mercury-grid.component';
import { MercurySidebarComponent } from './mercury-hud/sidebar/sidebar.component';
import { MercuryQueueBarComponent } from './mercury-hud/queue-bar/queue-bar.component';
import { BuildingInfoComponent } from './mercury-hud/building-info/building-info.component';
import { MercuryZoneSelectComponent } from './mercury-hud/zone-select/zone-select.component';

interface ActiveBuildingInfo {
  buildingId: string;
  placedId: string;
  slotId: string | null;
}

@Component({
  selector: 'app-mercury',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MercuryGridComponent, MercurySidebarComponent, MercuryQueueBarComponent, BuildingInfoComponent, MercuryZoneSelectComponent],
  templateUrl: './mercury.component.html',
  styleUrl: './mercury.component.scss',
})
export class MercuryComponent {
  readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);

  readonly backToOrrery = output<void>();

  /** The building id currently selected for placement. Null = inspect/idle mode. */
  readonly selectedBuildingId = signal<string | null>(null);

  /** Populated when the player clicks an occupied tile; drives the building-info panel. */
  readonly activeBuildingInfo = signal<ActiveBuildingInfo | null>(null);

  onTileClicked(event: {
    col: number;
    row: number;
    hasBuilding: boolean;
    terrain: string;
    slotId: string | null;
  }): void {
    if (event.hasBuilding) {
      // Footprint-aware lookup: the clicked tile may be any of the 4 footprint cells,
      // not just the anchor (b.col / b.row).
      const DEFAULT_FP: readonly [number, number][] = [[0,0],[1,0],[0,1],[1,1]];
      const placed = this.gameState.mercuryBuildings().find((b) => {
        const fp = this.data.getMercuryBuilding(b.buildingId)?.footprint ?? DEFAULT_FP;
        return (fp as [number, number][]).some(
          ([dc, dr]) => b.col + dc === event.col && b.row + dr === event.row,
        );
      });
      if (placed) {
        this.activeBuildingInfo.set({
          buildingId: placed.buildingId,
          placedId: placed.id,
          slotId: event.slotId,
        });
        // Cannot place a building while the info panel is open.
        this.selectedBuildingId.set(null);
        return;
      }
    }
    // Close any open info panel when clicking an empty tile.
    this.activeBuildingInfo.set(null);
    // Zone selection (Block 9.7) wired here later.
  }
}
