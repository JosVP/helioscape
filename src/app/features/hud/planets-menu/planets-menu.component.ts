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
import type { PlanetState, PlanetUnlockStatus } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

interface PlanetRow {
  readonly id: string;
  readonly displayName: string;
  readonly phaseName: string;
  readonly status: 'locked' | 'mission' | 'in_transit' | 'active' | 'flourishing';
  readonly unlockStatus: PlanetUnlockStatus;
  readonly arrivalYear: number | null;
  readonly isLocked: boolean;
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
    const unlocks = this.gameState.planetUnlocks();
    const selected = this.selectedPlanetId();
    return DISPLAY_ORDER.map((id) => this._buildRow(id, planets, unlocks, selected));
  });

  onRowClick(id: string): void {
    if (id === 'moon') {
      this.eventBus.planetSelected$.next('earth');
      this.eventBus.moonTabRequested$.next();
      return;
    }

    const row = this.rows().find((entry) => entry.id === id);
    if (row?.isLocked) {
      this.eventBus.lockedPlanetSelected$.next({
        planetId: id,
        status: row.unlockStatus,
        arrivalYear: row.arrivalYear ?? undefined,
      });
      return;
    }

    this.eventBus.planetSelected$.next(id);
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
    unlocks: Record<string, { status: PlanetUnlockStatus; arrivalYear?: number }>,
    selected: string | null,
  ): PlanetRow {
    if (id === 'moon') {
      return {
        id: 'moon',
        displayName: 'Moon',
        phaseName: 'Research Base',
        status: 'active',
        unlockStatus: 'unlocked',
        arrivalYear: null,
        isLocked: false,
        isIndented: true,
        isSelected: selected === 'earth',
        avatarPath: '/assets/svg/planets/moon.svg',
      };
    }

    const planetData = this.data.getPlanet(id);
    const state = planets[id];
    const unlockState = unlocks[id];

    if (!unlockState || unlockState.status !== 'unlocked') {
      const arrivalYear = unlockState?.arrivalYear ?? null;
      const phaseName = unlockState?.status === 'in_transit' && arrivalYear !== null
        ? `En route - arrives Year ${arrivalYear}`
        : unlockState?.status === 'mission_available'
          ? 'Mission available'
          : 'Locked';

      return {
        id,
        displayName: planetData.displayName,
        phaseName,
        status: unlockState?.status === 'in_transit'
          ? 'in_transit'
          : unlockState?.status === 'mission_available'
            ? 'mission'
            : 'locked',
        unlockStatus: unlockState?.status ?? 'locked',
        arrivalYear,
        isLocked: true,
        isIndented: false,
        isSelected: id === selected,
        avatarPath: `/assets/svg/planets/${id}.svg`,
      };
    }

    if (!state) {
      return {
        id,
        displayName: planetData.displayName,
        phaseName: 'Unknown state',
        status: 'locked',
        unlockStatus: 'locked',
        arrivalYear: null,
        isLocked: true,
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
      unlockStatus: 'unlocked',
      arrivalYear: null,
      isLocked: false,
      isIndented: false,
      isSelected: id === selected,
      avatarPath: `/assets/svg/planets/${id}.svg`,
    };
  }
}
