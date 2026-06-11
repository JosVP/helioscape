import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { clamp } from '@app/shared/utils/math.utils';

interface KardashevMarker {
  id: string;
  label: string;
  position: number;
}

/**
 * KardashevBarComponent — visualises the player's progress on the Kardashev scale.
 *
 * The Kardashev level ranges from 0.73 (no Dyson coverage) to 2.0 (100 % Dyson coverage).
 * The fill bar is a tick-driven visual value: CSS transition is `width 1s linear` to match the
 * game tick interval — see ARCHITECTURE.md "Visual value pattern".
 *
 * Three fixed milestone markers are shown on the track. When EventBusService emits a milestone,
 * the matching dot receives the `milestone-pulse` CSS class for 2 seconds.
 */
@Component({
  selector: 'app-kardashev-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kardashev-bar.component.html',
  styleUrl: './kardashev-bar.component.scss',
})
export class KardashevBarComponent implements OnInit {
  private readonly gameState = inject(GameStateService);
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Kardashev range: base 0.73 to max 2.0, span 1.27. */
  private static readonly BASE = 0.73;
  private static readonly SPAN = 1.27;

  /** Fixed milestone markers. Positions are derived from the same BASE/SPAN formula as barPercent. */
  readonly MARKERS: KardashevMarker[] = [
    { id: 'type_1',             label: 'Type I — K1.0',     position: ((1.0 - KardashevBarComponent.BASE) / KardashevBarComponent.SPAN) * 100 },
    { id: 'first_era_complete', label: 'First Era — K1.5',  position: ((1.5 - KardashevBarComponent.BASE) / KardashevBarComponent.SPAN) * 100 },
    { id: 'type_2',             label: 'Type II — K2.0',    position: ((2.0 - KardashevBarComponent.BASE) / KardashevBarComponent.SPAN) * 100 },
  ];

  /** The milestoneId currently showing the pulse animation, or null when idle. */
  readonly pulsingMarker = signal<string | null>(null);

  private _pulseTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly barPercent = computed(() =>
    clamp(
      ((this.gameState.kardashevLevel() - KardashevBarComponent.BASE) /
        KardashevBarComponent.SPAN) *
        100,
      0,
      100,
    ),
  );

  readonly levelDisplay = computed(() => `K ${this.gameState.kardashevLevel().toFixed(2)}`);

  constructor() {
    effect(() => {
      const pct = this.barPercent();
      this.el.nativeElement.style.setProperty('--bar-width', `${pct}%`);
    });

    this.eventBus.milestoneReached$
      .pipe(takeUntilDestroyed())
      .subscribe((milestoneId) => {
        if (this._pulseTimeout !== null) {
          clearTimeout(this._pulseTimeout);
        }
        this.pulsingMarker.set(milestoneId);
        this._pulseTimeout = setTimeout(() => {
          this.pulsingMarker.set(null);
          this._pulseTimeout = null;
        }, 2000);
      });

    this.destroyRef.onDestroy(() => {
      if (this._pulseTimeout !== null) {
        clearTimeout(this._pulseTimeout);
      }
    });
  }

  ngOnInit(): void {
    // Set initial value immediately so there is no flash on first render.
    this.el.nativeElement.style.setProperty('--bar-width', `${this.barPercent()}%`);
  }
}
