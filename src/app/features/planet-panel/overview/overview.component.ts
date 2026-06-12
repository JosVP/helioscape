import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { GameStateService } from '@app/core/services/game-state.service';

@Component({
  selector: 'app-planet-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
})
export class PlanetOverviewComponent {
  private readonly gameState = inject(GameStateService);

  readonly planetId = input.required<string>();

  readonly planet = computed(() => this.gameState.planets()[this.planetId()] ?? null);
}
