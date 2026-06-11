import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { PlanetState } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

interface PlanetRow {
  readonly id: string;
  readonly displayName: string;
  readonly phaseName: string;
  readonly status: 'locked' | 'active' | 'flourishing';
  readonly isIndented: boolean;
  readonly isSelected: boolean;
  readonly avatarPath: string;
}

const DISPLAY_ORDER = ['earth', 'moon', 'mercury', 'mars', 'venus'] as const;

@Component({
  selector: 'app-planets-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planets-panel.component.html',
  styleUrl: './planets-panel.component.scss',
})
export class PlanetsPanelComponent {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  readonly selectedPlanetId = input<string | null>(null);

  readonly rows = computed<PlanetRow[]>(() => {
    const planets = this.gameState.planets();
    const selected = this.selectedPlanetId();
    return DISPLAY_ORDER.map((id) => this._buildRow(id, planets, selected));
  });

  onRowClick(id: string): void {
    if (id === 'moon') {
      this.eventBus.planetSelected$.next('earth');
      this.eventBus.moonTabRequested$.next();
    } else {
      this.eventBus.planetSelected$.next(id);
    }
  }

  private _buildRow(
    id: string,
    planets: Record<string, PlanetState>,
    selected: string | null,
  ): PlanetRow {
    if (id === 'moon') {
      return {
        id: 'moon',
        displayName: 'Moon',
        phaseName: 'Research Base',
        status: 'active',
        isIndented: true,
        isSelected: selected === 'earth',
        avatarPath: '/assets/svg/planets/moon.svg',
      };
    }

    const planetData = this.data.getPlanet(id);
    const state = planets[id];

    if (!state) {
      return {
        id,
        displayName: planetData.displayName,
        phaseName: 'Locked',
        status: 'locked',
        isIndented: false,
        isSelected: id === selected,
        avatarPath: `/assets/svg/planets/${id}.svg`,
      };
    }

    const phase = state.terraformingPhase;
    const phaseName = planetData.phases[phase]?.displayName ?? 'Unknown';
    const isFlourishing =
      planetData.phases.length > 1 && phase >= planetData.phases.length - 1;

    return {
      id,
      displayName: planetData.displayName,
      phaseName,
      status: isFlourishing ? 'flourishing' : 'active',
      isIndented: false,
      isSelected: id === selected,
      avatarPath: `/assets/svg/planets/${id}.svg`,
    };
  }
}
