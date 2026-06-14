import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { PlacedBuilding } from '@app/core/models';
import type { MercuryBuilding, MercuryMiningLocation } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';

@Component({
  selector: 'app-mercury-building-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './building-info.component.html',
  styleUrl: './building-info.component.scss',
})
export class BuildingInfoComponent {
  private readonly data = inject(DataService);
  protected readonly gameState = inject(GameStateService);

  /** The static building definition id (MercuryBuilding.id). */
  readonly buildingId = input.required<string>();
  /** The placed-building instance uuid (PlacedBuilding.id). */
  readonly placedId = input.required<string>();
  /** MercurySlot.id for the tile that was clicked — null when the tile has no slot. */
  readonly slotId = input<string | null>(null);

  readonly closed = output<void>();

  readonly building = computed<MercuryBuilding | undefined>(
    () => this.data.getMercuryBuilding(this.buildingId()),
  );

  readonly placed = computed<PlacedBuilding | undefined>(
    () => this.gameState.mercuryBuildings().find((b) => b.id === this.placedId()),
  );

  readonly isRefinery = computed<boolean>(
    () => this.data.getMercurySlot(this.slotId() ?? '')?.slotType === 'refinery',
  );

  readonly miningInfo = computed<MercuryMiningLocation | null>(() => {
    const slot = this.slotId();
    if (!slot) return null;
    return (
      this.data.getMercuryMapData()?.miningLocations.find((m) =>
        m.adjacentRefinerySlots.includes(slot),
      ) ?? null
    );
  });

  readonly assignedMiners = computed<number>(
    () => this.gameState.mercuryMiners().assignments[this.slotId() ?? ''] ?? 0,
  );

  readonly minerPoolCount = computed<number>(
    () => this.gameState.mercuryMiners().poolCount,
  );
}
