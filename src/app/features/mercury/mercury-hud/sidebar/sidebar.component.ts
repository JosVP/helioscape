import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { DataService } from '@app/core/services/data.service';
import type { MercuryBuilding, MercuryComponent } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { MercuryBuildService } from '@app/core/systems/mercury-build.service';

interface SidebarTab {
  id: 'buildings' | 'units' | 'upgrades' | 'space';
  label: string;
}

@Component({
  selector: 'app-mercury-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class MercurySidebarComponent {
  private readonly dataService = inject(DataService);
  private readonly gameState = inject(GameStateService);
  private readonly mercuryBuild = inject(MercuryBuildService);

  /** Emits the selected buildingId, or null when deselected. */
  readonly buildingSelected = output<string | null>();

  readonly activeTab = signal<'buildings' | 'units' | 'upgrades' | 'space'>('buildings');
  readonly selectedBuildingId = signal<string | null>(null);

  /** Target planet for orbital component queueing. */
  readonly targetPlanet = signal<'mars' | 'venus'>('mars');

  readonly availablePlanets: { id: 'mars' | 'venus'; label: string }[] = [
    { id: 'mars', label: 'Mars' },
    { id: 'venus', label: 'Venus' },
  ];

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

  /**
   * Orbital components available for the Space tab.
   * Shows all components; greyed-out state is handled in template via canQueue().
   */
  readonly filteredComponents = computed((): MercuryComponent[] => {
    if (this.activeTab() !== 'space') return [];
    return this.dataService.getAllMercuryComponents();
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

  getComponentIconPath(componentId: string): string {
    // camelCase id → kebab-case filename: precipitationEngine → precipitation-engine
    const kebab = componentId.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
    return `assets/svg/components/${kebab}.svg`;
  }

  queueComponent(componentId: string): void {
    this.mercuryBuild.queueComponent(componentId, this.targetPlanet());
  }

  /**
   * Returns true when the component can be queued:
   * unlock condition met, maxInstances not hit, AND resources are sufficient.
   */
  canQueue(component: MercuryComponent): boolean {
    const completedTechs = this.gameState.completedTechs();
    if (
      component.unlockCondition !== null &&
      !completedTechs.includes(component.unlockCondition)
    ) {
      return false;
    }
    if (component.maxInstances !== null) {
      const inQueue = this.gameState.mercuryBuildQueue()
        .filter((e) => e.componentId === component.id).length;
      if (inQueue >= component.maxInstances) return false;
    }
    // Check resource affordability
    const res = this.gameState.mercuryResources();
    return (
      res.commonOre >= (component.cost.commonOre ?? 0) &&
      res.rareMetals >= (component.cost.rareMetals ?? 0) &&
      res.polarVolatiles >= (component.cost.polarVolatiles ?? 0)
    );
  }

  /**
   * Returns a human-readable reason why queuing is blocked, or null if allowed.
   * Used as a tooltip / aria-description on disabled buttons.
   */
  queueBlockReason(component: MercuryComponent): string | null {
    const completedTechs = this.gameState.completedTechs();
    if (
      component.unlockCondition !== null &&
      !completedTechs.includes(component.unlockCondition)
    ) {
      return `Requires: ${component.unlockCondition}`;
    }
    if (component.maxInstances !== null) {
      const inQueue = this.gameState.mercuryBuildQueue()
        .filter((e) => e.componentId === component.id).length;
      if (inQueue >= component.maxInstances) return 'Already queued or built';
    }
    const res = this.gameState.mercuryResources();
    const missing: string[] = [];
    const need = (have: number, need: number, label: string) => {
      if (need > 0 && have < need) missing.push(`${need - have} ${label}`);
    };
    need(res.commonOre, component.cost.commonOre ?? 0, 'ore');
    need(res.rareMetals, component.cost.rareMetals ?? 0, 'metals');
    need(res.polarVolatiles, component.cost.polarVolatiles ?? 0, 'vol');
    return missing.length ? `Need: ${missing.join(', ')}` : null;
  }

  // ─── DEV helper — gives starter resources so the Space tab can be tested ───
  // NOTE: Remove before release (or guard behind a dev flag).
  devGiveResources(): void {
    this.gameState.updateMercuryResources({ commonOre: 500, rareMetals: 500, polarVolatiles: 500 });
  }

  readonly mercuryResources = computed(() => this.gameState.mercuryResources());
}
