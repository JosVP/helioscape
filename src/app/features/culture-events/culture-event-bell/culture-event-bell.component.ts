import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { CultureEventService } from '@app/core/systems/culture-event.service';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum number of historical (read) events shown in the bell dropdown.
 * Increase to show more history; decrease to keep the panel compact.
 */
export const BELL_HISTORY_DISPLAY_LIMIT = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BellItem {
  readonly eventId: string;
  readonly title: string;
  readonly read: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-culture-event-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './culture-event-bell.component.html',
  styleUrl: './culture-event-bell.component.scss',
})
export class CultureEventBellComponent {
  private readonly cultureEventService = inject(CultureEventService);
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);

  // -------------------------------------------------------------------------
  // UI state
  // -------------------------------------------------------------------------

  readonly _dropdownOpen = signal(false);
  readonly _showOnlyUnread = signal(true);

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  readonly unreadCount = computed(() => this.cultureEventService.notificationQueue().length);

  /** Unread items: notification-type entries still in the queue. */
  private readonly _unreadItems = computed<BellItem[]>(() =>
    this.cultureEventService.notificationQueue().map((e) => ({
      eventId: e.eventId,
      title: this.data.getCultureEvent(e.eventId)?.title ?? e.eventId,
      read: false,
    })),
  );

  /** Read items: most recent history first, capped at BELL_HISTORY_DISPLAY_LIMIT. */
  private readonly _readItems = computed<BellItem[]>(() =>
    [...this.gameState.cultureEventHistory()]
      .reverse()
      .slice(0, BELL_HISTORY_DISPLAY_LIMIT)
      .map((h) => ({
        eventId: h.eventId,
        title: this.data.getCultureEvent(h.eventId)?.title ?? h.eventId,
        read: true,
      })),
  );

  /** Items shown in the panel depending on the toggle state. */
  readonly displayedItems = computed<BellItem[]>(() =>
    this._showOnlyUnread()
      ? this._unreadItems()
      : [...this._unreadItems(), ...this._readItems()],
  );

  readonly hasItems = computed(() => this.displayedItems().length > 0);

  // -------------------------------------------------------------------------
  // Template callbacks
  // -------------------------------------------------------------------------

  onBellClick(): void {
    this._dropdownOpen.update((v) => !v);
  }

  onToggleFilter(): void {
    this._showOnlyUnread.update((v) => !v);
  }

  onItemClick(eventId: string): void {
    this._dropdownOpen.set(false);
    this.cultureEventService.showEvent(eventId);
  }

  /** Close dropdown on Escape. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this._dropdownOpen()) {
      this._dropdownOpen.set(false);
    }
  }
}
