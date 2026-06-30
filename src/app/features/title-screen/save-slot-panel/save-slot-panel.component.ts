import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { SlotInfo } from '@app/core/services/save.service';
import { SaveService } from '@app/core/services/save.service';
import { GameStateService } from '@app/core/services/game-state.service';

export type SaveSlotMode = 'NEW_GAME' | 'LOAD' | 'SAVE';

interface SlotPair {
  slot: number;
  info: SlotInfo;
}

interface PendingConfirm {
  slot: number;
  type: 'overwrite' | 'delete';
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
  // Available for future SAVE-mode "current game" indicator (Game Shell block).
  readonly gameState = inject(GameStateService);

  readonly mode = input.required<SaveSlotMode>();
  readonly slotSelected = output<number>();
  readonly closed = output<void>();

  private readonly _allSlots = signal<SlotPair[]>([]);
  readonly loading = signal(true);
  private readonly _pendingConfirm = signal<PendingConfirm | null>(null);
  readonly pendingConfirm = this._pendingConfirm.asReadonly();

  /** Autosave slot (0) is only visible in LOAD mode. */
  readonly visibleSlots = computed(() =>
    this._allSlots().filter((pair) => this.mode() === 'LOAD' || pair.slot !== 0),
  );

  constructor() {
    this.saveService.getAllSlotInfos().then((infos) => {
      this._allSlots.set(infos.map((info, slot) => ({ slot, info })));
      this.loading.set(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Primary action
  // ---------------------------------------------------------------------------

  onAction(slot: number, info: SlotInfo): void {
    this._pendingConfirm.set(null);
    switch (this.mode()) {
      case 'NEW_GAME':
        if (info.exists) {
          this._pendingConfirm.set({ slot, type: 'overwrite' });
        } else {
          this.gameState.reset();
          this.slotSelected.emit(slot);
          this.router.navigate(['/game'], { queryParams: { slot } });
        }
        break;
      case 'LOAD':
        this.saveService.load(slot).then((loaded) => {
          if (!loaded) return;
          this.slotSelected.emit(slot);
          this.closed.emit();
          this.router.navigate(['/game']);
        });
        break;
      case 'SAVE':
        this.saveService.save(slot).then(() => {
          this.slotSelected.emit(slot);
          this.closed.emit();
        });
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Overwrite confirm
  // ---------------------------------------------------------------------------

  onConfirmOverwrite(slot: number): void {
    this._pendingConfirm.set(null);
    this.gameState.reset();
    this.slotSelected.emit(slot);
    this.router.navigate(['/game'], { queryParams: { slot } });
  }

  // ---------------------------------------------------------------------------
  // Delete confirm
  // ---------------------------------------------------------------------------

  onDeleteRequest(slot: number): void {
    this._pendingConfirm.set({ slot, type: 'delete' });
  }

  onConfirmDelete(slot: number): void {
    this._pendingConfirm.set(null);
    this.saveService.delete(slot).then(() => this._refreshSlots());
  }

  // ---------------------------------------------------------------------------
  // Shared cancel
  // ---------------------------------------------------------------------------

  onCancelConfirm(): void {
    this._pendingConfirm.set(null);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  actionLabel(slot: number, info: SlotInfo): string {
    if (this.mode() === 'LOAD') return 'Load';
    if (this.mode() === 'SAVE') return info.exists ? 'Overwrite' : 'Save Here';
    // NEW_GAME
    return info.exists ? 'Overwrite' : 'Start Here';
  }

  formatTimestamp(ts: number | undefined): string {
    if (!ts) return '—';
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  }

  panelTitle(): string {
    switch (this.mode()) {
      case 'NEW_GAME': return 'Choose Save Slot';
      case 'LOAD':     return 'Load Game';
      case 'SAVE':     return 'Save Game';
    }
  }

  private async _refreshSlots(): Promise<void> {
    const infos = await this.saveService.getAllSlotInfos();
    this._allSlots.set(infos.map((info, slot) => ({ slot, info })));
  }
}
