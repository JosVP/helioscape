import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { BioPhaseComponent } from './bio-phase/bio-phase.component';
import { PlanetOverviewComponent } from './overview/overview.component';
import { ResearchComponent } from './research/research.component';
import { TechTreeComponent } from './tech-tree/tech-tree.component';

export type PlanetPanelTab = 'tech-tree' | 'research' | 'bio-phases' | 'overview';

@Component({
  selector: 'app-planet-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTreeComponent, ResearchComponent, BioPhaseComponent, PlanetOverviewComponent],
  host: {
    '[class.is-open]': 'isOpen()',
    '[class.initial-load]': 'initialLoad()',
  },
  templateUrl: './planet-panel.component.html',
  styleUrl: './planet-panel.component.scss',
})
export class PlanetPanelComponent implements OnDestroy {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // Inputs / outputs
  // ---------------------------------------------------------------------------

  readonly planetId = input<string | null>(null);
  readonly moonTabActive = input<boolean>(false);
  readonly closed = output<void>();

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------

  readonly activeTab = signal<PlanetPanelTab>('tech-tree');

  /** True while the `initial-load` CSS class is active (first 800ms after open). */
  readonly initialLoad = signal(false);

  private initialLoadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Derived signals
  // ---------------------------------------------------------------------------

  readonly isOpen = computed(() => this.planetId() !== null);

  /** Runtime state for the current planet; null if locked or no selection. */
  readonly planet = computed(() => {
    const id = this.planetId();
    return id ? (this.gameState.planets()[id] ?? null) : null;
  });

  /** True when a planetId is set but no runtime state exists yet (planet is locked). */
  readonly isLocked = computed(() => this.planetId() !== null && this.planet() === null);

  /** Static data for the current planet; null when nothing is selected. */
  readonly planetData = computed(() => {
    const id = this.planetId();
    if (!id) return null;
    try {
      return this.data.getPlanet(id);
    } catch {
      return null;
    }
  });

  readonly phaseName = computed(() => {
    const p = this.planet();
    const d = this.planetData();
    return d?.phases[p?.terraformingPhase ?? 0]?.displayName ?? '';
  });

  readonly phaseDescription = computed(() => {
    const p = this.planet();
    const d = this.planetData();
    return d?.phases[p?.terraformingPhase ?? 0]?.description ?? '';
  });

  readonly isEarth = computed(() => this.planetId() === 'earth');

  readonly isActiveMoonTab = computed(
    () => this.activeTab() === 'research' && this.moonTabActive(),
  );

  /** Maps the active tab to its button element id for aria-labelledby on the tabpanel. */
  readonly activeTabId = computed(() => {
    if (this.isActiveMoonTab()) return 'tab-moon';
    return `tab-${this.activeTab()}`;
  });

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  constructor() {
    // When a planet is opened, trigger the initial-load animation class.
    // Uses untracked() to avoid tracking signals inside the timeout callback.
    effect(() => {
      const id = this.planetId();
      untracked(() => {
        if (id !== null) {
          this._triggerInitialLoad();
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.initialLoadTimeoutId !== null) {
      clearTimeout(this.initialLoadTimeoutId);
    }
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  close(): void {
    this.closed.emit();
  }

  setTab(tab: PlanetPanelTab): void {
    this.activeTab.set(tab);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private _triggerInitialLoad(): void {
    if (this.initialLoadTimeoutId !== null) {
      clearTimeout(this.initialLoadTimeoutId);
    }
    this.initialLoad.set(true);
    this.initialLoadTimeoutId = setTimeout(() => {
      this.initialLoad.set(false);
      this.initialLoadTimeoutId = null;
    }, 800);
  }
}
