import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { ResourceStore } from '@app/core/models';

@Component({
  selector: 'app-resource-power-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './resource-power-bar.component.html',
  styleUrl: './resource-power-bar.component.scss',
})
export class ResourcePowerBarComponent {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);

  /** True in Mercury view; shows reservation inputs. False in orrery. */
  readonly showReservationInputs = input<boolean>(false);

  readonly resources = computed(() => this.gameState.mercuryResources());

  readonly resourceRates = computed(() => {
    const buildings = this.gameState.mercuryBuildings();
    const rates: Record<string, number> = { commonOre: 0, rareMetals: 0, polarVolatiles: 0 };
    for (const b of buildings) {
      if (b.status !== 'operational') continue;
      const def = this.data.getMercuryBuilding(b.buildingId);
      if (!def) continue;
      for (const eff of def.effects) {
        if (eff.type === 'resource_rate' && eff.resourceId != null && eff.resourceId in rates) {
          rates[eff.resourceId] += eff.rate ?? 0;
        }
      }
    }
    return rates;
  });

  readonly dysonPowerTw = computed(() => {
    const watts = this.gameState.dysonEnergyWatts();
    return watts / 1e12; // W → TW
  });

  // NOTE: Full consumption accounting requires DysonService consumer registration (future block).
  readonly dysonConsumptionTw = computed(() => 0.8);

  readonly powerBarPercent = computed(() => {
    const avail = this.dysonPowerTw();
    if (avail <= 0) return 100;
    return Math.min(100, (this.dysonConsumptionTw() / avail) * 100);
  });

  readonly powerBarColor = computed(() => {
    const pct = this.powerBarPercent();
    if (pct >= 100) return 'red';
    if (pct >= 80) return 'amber';
    return 'green';
  });

  // RP capacity (moved from ResearchComponent — shared pool visible at all times)
  readonly rpUsed  = computed(() => this.gameState.usedRpCapacity());
  readonly rpTotal = computed(() => this.gameState.totalRpCapacity());
  readonly rpBarPercent = computed(() =>
    this.rpTotal() > 0 ? Math.min(100, (this.rpUsed() / this.rpTotal()) * 100) : 0,
  );

  readonly reservations = computed(() => this.gameState.resourceReservations());

  readonly reservationKeys: ReadonlyArray<{ id: keyof ResourceStore; label: string }> = [
    { id: 'commonOre', label: 'Ore' },
    { id: 'rareMetals', label: 'Metals' },
    { id: 'polarVolatiles', label: 'Vol' },
  ];

  onReservationChange(resource: keyof ResourceStore, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameState.setResourceReservation(resource, value);
  }
}
