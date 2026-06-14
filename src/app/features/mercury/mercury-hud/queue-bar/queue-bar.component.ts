import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import type { MercuryComponent } from '@app/core/services/data.service';
import type { MercuryQueueEntry } from '@app/core/models/game-state.model';

interface EnrichedQueueItem {
  entry: MercuryQueueEntry;
  def: MercuryComponent;
}

@Component({
  selector: 'app-mercury-queue-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, TitleCasePipe],
  templateUrl: './queue-bar.component.html',
  styleUrl: './queue-bar.component.scss',
})
export class MercuryQueueBarComponent {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);

  readonly queue = computed((): EnrichedQueueItem[] => {
    return this.gameState.mercuryBuildQueue()
      .map((entry) => {
        const def = this.data.getMercuryComponent(entry.componentId);
        return def ? { entry, def } : null;
      })
      .filter((item): item is EnrichedQueueItem => item !== null);
  });

  /** camelCase component id → kebab-case filename, e.g. precipitationEngine → precipitation-engine */
  getComponentIconPath(componentId: string): string {
    return componentId.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`) + '.svg';
  }
}
