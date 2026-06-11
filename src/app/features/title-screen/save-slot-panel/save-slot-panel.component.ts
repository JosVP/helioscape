import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { SlotInfo } from '@app/core/services/save.service';
import { SaveService } from '@app/core/services/save.service';

export type SaveSlotMode = 'NEW_GAME' | 'LOAD';

interface SlotPair {
  slot: number;
  info: SlotInfo;
}

@Component({
  selector: 'app-save-slot-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './save-slot-panel.component.html',
  styleUrl: './save-slot-panel.component.scss',
})
export class SaveSlotPanelComponent {
  private readonly saveService = inject(SaveService);
  private readonly router = inject(Router);

  readonly mode = input.required<SaveSlotMode>();
  readonly closed = output<void>();

  readonly slots = signal<SlotPair[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.saveService.getAllSlotInfos().then((infos) => {
      this.slots.set(infos.map((info, slot) => ({ slot, info })));
      this.loading.set(false);
    });
  }

  onSlotClick(slot: number, info: SlotInfo): void {
    if (this.mode() === 'LOAD') {
      if (!info.exists) return;
      this.saveService.load(slot).then(() => {
        this.router.navigate(['/game']);
      });
    } else {
      // NEW_GAME: navigate to /game with slot param; GameShellComponent initialises and saves.
      this.router.navigate(['/game'], { queryParams: { slot } });
    }
  }
}
