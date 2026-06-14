import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import type { MercuryStartingZone } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';

@Component({
  selector: 'app-mercury-zone-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zone-select.component.html',
  styleUrl: './zone-select.component.scss',
})
export class MercuryZoneSelectComponent {
  private readonly data = inject(DataService);
  readonly gameState = inject(GameStateService);
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly zones = signal<MercuryStartingZone[]>(this.data.getAllMercuryStartingZones());
  readonly hoveredZoneId = signal<string | null>(null);

  constructor() {
    // Move focus into the dialog as soon as it renders so keyboard users can
    // select a zone without tabbing past the (inert) canvas behind it.
    afterNextRender(() => {
      const firstCard = this.el.nativeElement.querySelector('[tabindex="0"]') as HTMLElement | null;
      firstCard?.focus();
    });
  }

  confirmSelection(zoneId: string): void {
    this.gameState.selectMercuryZone(zoneId);
    // Component is removed from DOM via @if in mercury.component.html after state change
  }
}
