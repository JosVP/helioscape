import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { GameStateService } from '@app/core/services/game-state.service';
import { clamp } from '@app/shared/utils/math.utils';

/**
 * KardashevBarComponent — visualises the player's progress on the Kardashev scale.
 *
 * The Kardashev level ranges from 0.73 (no Dyson coverage) to 2.0 (100 % Dyson coverage).
 * The fill bar is a tick-driven visual value: CSS transition is `width 1s linear` to match the
 * game tick interval — see ARCHITECTURE.md "Visual value pattern".
 */
@Component({
  selector: 'app-kardashev-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kardashev-bar">
      <span class="kardashev-bar__label">Kardashev</span>
      <div class="kardashev-bar__track">
        <div class="kardashev-bar__fill"></div>
      </div>
      <span class="kardashev-bar__level">{{ levelDisplay() }}</span>
    </div>
  `,
  styleUrl: './kardashev-bar.component.scss',
})
export class KardashevBarComponent implements OnInit {
  private readonly gameState = inject(GameStateService);
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Kardashev range: base 0.73 to max 2.0, span 1.27. */
  private static readonly BASE = 0.73;
  private static readonly SPAN = 1.27;

  readonly barPercent = computed(() =>
    clamp(
      ((this.gameState.kardashevLevel() - KardashevBarComponent.BASE) /
        KardashevBarComponent.SPAN) *
        100,
      0,
      100,
    ),
  );

  readonly levelDisplay = computed(() => this.gameState.kardashevLevel().toFixed(2));

  constructor() {
    effect(() => {
      const pct = this.barPercent();
      this.el.nativeElement.style.setProperty('--bar-width', `${pct}%`);
    });
  }

  ngOnInit(): void {
    // Set initial value immediately so there is no flash on first render.
    this.el.nativeElement.style.setProperty('--bar-width', `${this.barPercent()}%`);
  }
}
