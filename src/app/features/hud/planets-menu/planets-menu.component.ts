import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

const DISPLAY_ORDER = ['mercury', 'venus', 'earth', 'mars'] as const;

@Component({
  selector: 'app-planets-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planets-menu.component.html',
  styleUrl: './planets-menu.component.scss',
})
export class PlanetsMenuComponent {
  private readonly gameState  = inject(GameStateService);
  private readonly data       = inject(DataService);
  private readonly eventBus   = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedPlanetId = input<string | null>(null);

  /** Planet currently highlighted via external hover (from orrery or this panel). */
  readonly hoveredPlanetId = signal<string | null>(null);

  constructor() {
    // Orrery hovered a planet \u2192 highlight matching row in this panel.
    this.eventBus.planetHovered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.hoveredPlanetId.set(id));
  }

  readonly rows = computed<PlanetRow[]>(() => {
    const planets  = this.gameState.planets();
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

  onRowMouseEnter(id: string): void {
    // Moon row represents Earth in the orrery.
    const effectiveId = id === 'moon' ? 'earth' : id;
    this.eventBus.planetHovered$.next(effectiveId);
  }

  onRowMouseLeave(): void {
    this.eventBus.planetHovered$.next(null);
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
