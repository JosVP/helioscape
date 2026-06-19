import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AudioService } from '@app/core/services/audio.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { PlanetUnlockService } from '@app/core/systems/planet-unlock.service';
import { CultureEventCardComponent } from '@app/features/culture-events/culture-event-card/culture-event-card.component';
import { CultureEventToastComponent } from '@app/features/culture-events/culture-event-toast/culture-event-toast.component';
import { HudComponent } from '@app/features/hud/hud.component';
import { PlanetsMenuComponent } from '@app/features/hud/planets-menu/planets-menu.component';
import { MercuryComponent } from '@app/features/mercury/mercury.component';
import { OrreryComponent } from '@app/features/orrery/orrery.component';
import { PauseMenuComponent } from '@app/features/pause-menu/pause-menu.component';
import { PlanetPanelComponent } from '@app/features/planet-panel/planet-panel.component';
import { ResearchHubComponent } from '@app/features/research-hub/research-hub.component';
import { ResourcePowerBarComponent } from '@app/shared/components/resource-power-bar/resource-power-bar.component';

@Component({
  selector: 'app-game-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HudComponent,
    PlanetsMenuComponent,
    OrreryComponent,
    MercuryComponent,
    PlanetPanelComponent,
    CultureEventCardComponent,
    CultureEventToastComponent,
    PauseMenuComponent,
    ResearchHubComponent,
    ResourcePowerBarComponent,
  ],
  templateUrl: './game-shell.component.html',
  styleUrl: './game-shell.component.scss',
})
export class GameShellComponent implements OnInit, OnDestroy {
  private readonly gameLoop = inject(GameLoopService);
  // Injected for child-service dependencies and future direct reads (e.g. isPaused signal).
  readonly gameState = inject(GameStateService);
  private readonly eventBus = inject(EventBusService);
  private readonly audioService = inject(AudioService);
  private readonly planetUnlockService = inject(PlanetUnlockService);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // UI state (transient — not persisted, not in GameStateService)
  // ---------------------------------------------------------------------------

  readonly selectedPlanetId = signal<string | null>(null);
  readonly isPauseMenuOpen = signal(false);
  readonly isResearchHubOpen = signal(false);
  /** Controls which full-screen view is shown. Orrery is hidden (not destroyed) when Mercury is active. */
  readonly activeView = signal<'orrery' | 'mercury'>('orrery');

  private audioInitialised = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.gameState.ensureInitialised();
    this.gameLoop.start();

    this.eventBus.planetSelected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.handlePlanetSelection(id));

    this.eventBus.researchHubRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.isResearchHubOpen.set(true));
  }

  ngOnDestroy(): void {
    this.gameLoop.stop();
  }

  // ---------------------------------------------------------------------------
  // Host listeners
  // ---------------------------------------------------------------------------

  /** Toggle pause menu on Escape, unless another overlay (Research Hub) is already open. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isResearchHubOpen()) return; // ResearchHub handles its own Escape
    this.isPauseMenuOpen.update((v) => !v);
  }

  /**
   * Initialise the AudioContext on the first user interaction anywhere in the shell.
   * Browsers and Tauri's webview block audio until after the first interaction.
   * This handler fires for both clicks and keydowns (including Escape) — audio init
   * runs before the escape handler and is a no-op on subsequent calls.
   */
  @HostListener('click')
  @HostListener('keydown')
  onFirstInteraction(): void {
    if (this.audioInitialised) return;
    this.audioInitialised = true;
    this.audioService.initialise();
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  closePlanetPanel(): void {
    this.selectedPlanetId.set(null);
  }

  closeResearchHub(): void {
    this.isResearchHubOpen.set(false);
  }

  private handlePlanetSelection(id: string): void {
    const unlockState = this.gameState.getPlanetUnlockState(id);
    const isUnlocked = id === 'earth' || unlockState?.status === 'unlocked';

    if (!isUnlocked) {
      this.eventBus.lockedPlanetSelected$.next({
        planetId: id,
        status: unlockState?.status ?? 'locked',
        arrivalYear: unlockState?.arrivalYear,
      });
      return;
    }

    if (id === 'mercury') {
      this.activeView.set('mercury');
      this.selectedPlanetId.set(null);
    } else {
      this.activeView.set('orrery');
      this.selectedPlanetId.set(id);
    }
  }
}

