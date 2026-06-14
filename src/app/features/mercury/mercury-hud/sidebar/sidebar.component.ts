import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import type { MercuryBuilding } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';

interface SidebarTab {
  id: 'buildings' | 'units' | 'upgrades' | 'space';
  label: string;
}

@Component({
  selector: 'app-mercury-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class MercurySidebarComponent {
  private readonly dataService = inject(DataService);
  private readonly gameState = inject(GameStateService);

  /** Emits the selected buildingId, or null when deselected. */
  readonly buildingSelected = output<string | null>();

  readonly activeTab = signal<'buildings' | 'units' | 'upgrades' | 'space'>('buildings');
  readonly selectedBuildingId = signal<string | null>(null);

  readonly tabs: SidebarTab[] = [
    { id: 'buildings', label: 'Buildings' },
    { id: 'units', label: 'Units' },
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'space', label: 'Space' },
  ];

  /**
   * Returns the list of buildings available for the active tab.
   * For playtest: only the 'buildings' tab returns data; all others show empty state.
   *
   * Unlocked: building's unlockCondition must be null OR present in completedTechs.
   * maxInstances: count all placed buildings (including ones still under construction)
   *   to prevent double-queuing a singleton like fusion_reactor.
   *
   * NOTE: Buildings all have 2×2 footprints (footprint: [[0,0],[1,0],[0,1],[1,1]]).
   * The sidebar is display-only; footprint data is consumed by MercuryGridComponent
   * for hover/placement preview. No footprint logic here.
   */
  readonly filteredBuildings = computed((): MercuryBuilding[] => {
    if (this.activeTab() !== 'buildings') {
      return [];
    }

    const completedTechs = this.gameState.completedTechs();
    const placedBuildings = this.gameState.mercuryBuildings();

    return this.dataService
      .getAllMercuryBuildings()
      .filter((b) => b.category === 'buildings')
      .filter(
        (b) => b.unlockCondition === null || completedTechs.includes(b.unlockCondition),
      )
      .filter((b) => {
        if (b.maxInstances === null) return true;
        const placed = placedBuildings.filter((p) => p.buildingId === b.id).length;
        return placed < b.maxInstances;
      });
  });

  selectBuilding(id: string): void {
    if (this.selectedBuildingId() === id) {
      this.selectedBuildingId.set(null);
      this.buildingSelected.emit(null);
    } else {
      this.selectedBuildingId.set(id);
      this.buildingSelected.emit(id);
    }
  }

  /**
   * Returns the icon path for a building id.
   * Convention: building IDs use underscores; asset filenames use kebab-case.
   * e.g. "mining_outpost" → "assets/svg/buildings/mining-outpost.svg"
   */
  getBuildingIconPath(buildingId: string): string {
    return `assets/svg/buildings/${buildingId.replace(/_/g, '-')}.svg`;
  }
}
