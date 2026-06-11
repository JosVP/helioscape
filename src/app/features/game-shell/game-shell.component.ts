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
import { CultureEventCardComponent } from '@app/features/culture-events/culture-event-card/culture-event-card.component';
import { CultureEventToastComponent } from '@app/features/culture-events/culture-event-toast/culture-event-toast.component';
import { HudComponent } from '@app/features/hud/hud.component';
import { PlanetsPanelComponent } from '@app/features/hud/planets-panel/planets-panel.component';
import { OrreryComponent } from '@app/features/orrery/orrery.component';
import { PauseMenuComponent } from '@app/features/pause-menu/pause-menu.component';
import { PlanetPanelComponent } from '@app/features/planet-panel/planet-panel.component';

@Component({
  selector: 'app-game-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HudComponent,
    PlanetsPanelComponent,
    OrreryComponent,
    PlanetPanelComponent,
    CultureEventCardComponent,
    CultureEventToastComponent,
    PauseMenuComponent,
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
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // UI state (transient — not persisted, not in GameStateService)
  // ---------------------------------------------------------------------------

  readonly selectedPlanetId = signal<string | null>(null);
  readonly isPauseMenuOpen = signal(false);
  /** Set to true when the player clicks the Moon row; signals PlanetPanel to open at the Moon/research tab.
   * TODO: pass as input to PlanetPanelComponent once it has a moonTabActive input (Planet Panel block). */
  readonly moonTabActive = signal(false);

  private audioInitialised = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.gameLoop.start();

    this.eventBus.planetSelected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.selectedPlanetId.set(id));

    this.eventBus.moonTabRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.moonTabActive.set(true));
  }

  ngOnDestroy(): void {
    this.gameLoop.stop();
  }

  // ---------------------------------------------------------------------------
  // Host listeners
  // ---------------------------------------------------------------------------

  /** Toggle pause menu on Escape, regardless of current focus target. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
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
}

