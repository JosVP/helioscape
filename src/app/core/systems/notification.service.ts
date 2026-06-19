import { Injectable, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Signal } from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

export interface SystemNotification {
  readonly id: number;
  readonly sourceId: string;
  readonly title: string;
  readonly createdAtYear: number;
  readonly kind: 'research-completed';
}

let nextNotificationId = 0;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);
  private readonly gameState = inject(GameStateService);

  private readonly _unreadNotifications = signal<SystemNotification[]>([]);
  readonly unreadNotifications: Signal<SystemNotification[]> = this._unreadNotifications.asReadonly();

  constructor() {
    this.eventBus.researchCompleted$
      .pipe(takeUntilDestroyed())
      .subscribe((trackId) => this._queueResearchCompletion(trackId));
  }

  markRead(notificationId: number): void {
    this._unreadNotifications.update((notifications) =>
      notifications.filter((notification) => notification.id !== notificationId),
    );
  }

  private _queueResearchCompletion(trackId: string): void {
    if (this._hasModalCompletionEvent(trackId)) return;

    const displayName = this._getResearchDisplayName(trackId);
    if (!displayName) return;

    this._unreadNotifications.update((notifications) => [
      ...notifications,
      {
        id: nextNotificationId++,
        sourceId: trackId,
        title: `Research complete: ${displayName}`,
        createdAtYear: untracked(() => this.gameState.gameYear()),
        kind: 'research-completed',
      },
    ]);
  }

  private _getResearchDisplayName(trackId: string): string | null {
    const techNode = this.data.getTechNode(trackId);
    if (techNode) return techNode.displayName;

    const researchTrack = this.data.getResearchTrack(trackId);
    if (researchTrack) return researchTrack.displayName;

    return null;
  }

  private _hasModalCompletionEvent(trackId: string): boolean {
    const completedIds = new Set<string>([trackId]);
    const researchTrack = this.data.getResearchTrack(trackId);
    if (researchTrack) {
      for (const effect of researchTrack.onCompleteEffects) {
        if (effect.type === 'unlock_tech') {
          completedIds.add(effect.target);
        }
        if (effect.type === 'emit_event') {
          const event = this.data.getCultureEvent(effect.eventId);
          if (event?.presentation === 'modal') return true;
        }
      }
    }

    const techNode = this.data.getTechNode(trackId);
    if (techNode) {
      for (const effect of techNode.effects) {
        if (effect.type === 'emit_event') {
          const event = this.data.getCultureEvent(effect.eventId);
          if (event?.presentation === 'modal') return true;
        }
      }
    }

    return this.data.getAllCultureEvents().some(
      (event) =>
        event.presentation === 'modal' &&
        event.trigger.type === 'tech_completed' &&
        completedIds.has(event.trigger.techId),
    );
  }
}