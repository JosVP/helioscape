import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { CultureEventService } from '@app/core/systems/culture-event.service';
import { NotificationService } from '@app/core/systems/notification.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastItem = {
  readonly id: number;
  readonly title: string;
  readonly hint: string;
  visible: boolean;
  dismissing: boolean;
} & (
  | { readonly source: 'culture'; readonly eventId: string }
  | { readonly source: 'system'; readonly notificationId: number }
);

/** Duration the toast stays fully visible before auto-dismissing (ms). */
const TOAST_DURATION_MS = 8000;
/** Duration of the collapse animation (ms) — must match SCSS transition on wrapper. */
const COLLAPSE_MS = 350;

let _nextId = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-culture-event-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './culture-event-toast.component.html',
  styleUrl: './culture-event-toast.component.scss',
})
export class CultureEventToastComponent implements OnDestroy {
  private readonly cultureEventService = inject(CultureEventService);
  private readonly notificationService = inject(NotificationService);
  private readonly data = inject(DataService);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  readonly _toasts = signal<ToastItem[]>([]);

  /** Tracks previous notification queue length to detect additions vs removals. */
  private _prevNotificationCount = 0;
  private _prevSystemNotificationCount = 0;

  /** Map of toast id → pending timer refs. */
  private readonly _timers = new Map<number, ReturnType<typeof setTimeout>[]>();

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor() {
    // Watch only notification-type queue entries (text-only, non-priority).
    // Auto-show events (priority / has choices) appear directly as cards.
    effect(() => {
      const notifications = this.cultureEventService.notificationQueue();
      untracked(() => {
        if (notifications.length > this._prevNotificationCount) {
          const newest = notifications[notifications.length - 1];
          const def = this.data.getCultureEvent(newest.eventId);
          if (def) {
            this._spawnToast({ source: 'culture', eventId: newest.eventId, title: def.title });
          }
        }
        this._prevNotificationCount = notifications.length;
      });
    });

    effect(() => {
      const notifications = this.notificationService.unreadNotifications();
      untracked(() => {
        if (notifications.length > this._prevSystemNotificationCount) {
          const newest = notifications[notifications.length - 1];
          this._spawnToast({
            source: 'system',
            notificationId: newest.id,
            title: newest.title,
          });
        }
        this._prevSystemNotificationCount = notifications.length;
      });
    });
  }

  // -------------------------------------------------------------------------
  // Public template callbacks
  // -------------------------------------------------------------------------

  onToastClick(toast: ToastItem): void {
    this._dismissToast(toast.id);
    if (toast.source === 'culture') {
      this.cultureEventService.showEvent(toast.eventId);
      return;
    }
    this.notificationService.markRead(toast.notificationId);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _spawnToast(
    item: { readonly source: 'culture'; readonly eventId: string; readonly title: string } |
      { readonly source: 'system'; readonly notificationId: number; readonly title: string },
  ): void {
    const id = _nextId++;
    const toast: ToastItem =
      item.source === 'culture'
        ? {
            id,
            source: 'culture',
            eventId: item.eventId,
            title: item.title,
            hint: 'Click to open',
            visible: false,
            dismissing: false,
          }
        : {
            id,
            source: 'system',
            notificationId: item.notificationId,
            title: item.title,
            hint: 'Click to dismiss',
            visible: false,
            dismissing: false,
          };

    this._toasts.update((list) => [...list, toast]);

    // Ramp in on next microtask so the element is in the DOM before transition.
    const rampIn = setTimeout(() => {
      this._toasts.update((list) =>
        list.map((t) => (t.id === id ? { ...t, visible: true } : t)),
      );
    }, 0);

    // Auto-dismiss after hold duration.
    const autoDismiss = setTimeout(() => this._dismissToast(id), TOAST_DURATION_MS);

    this._timers.set(id, [rampIn, autoDismiss]);
  }

  private _dismissToast(id: number): void {
    const pending = this._timers.get(id);
    if (pending) {
      pending.forEach(clearTimeout);
      this._timers.delete(id);
    }

    // Phase 1: fade out (opacity).
    this._toasts.update((list) =>
      list.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );

    // Phase 2: trigger grid-row collapse one tick after fade starts.
    const collapseTimer = setTimeout(() => {
      this._toasts.update((list) =>
        list.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
      );
    }, 0);

    // Phase 3: remove from DOM after collapse animation completes.
    const removeTimer = setTimeout(() => {
      this._toasts.update((list) => list.filter((t) => t.id !== id));
    }, COLLAPSE_MS);

    this._timers.set(id, [collapseTimer, removeTimer]);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  ngOnDestroy(): void {
    this._timers.forEach((refs) => refs.forEach(clearTimeout));
    this._timers.clear();
  }
}
