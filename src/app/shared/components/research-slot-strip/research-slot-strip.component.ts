import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { ActiveResearchTrack, ResearchSlot, ResearchSlotPosition, ResearchSlotView } from '@app/core/models';

@Component({
  selector: 'app-research-slot-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './research-slot-strip.component.html',
  styleUrl: './research-slot-strip.component.scss',
})
export class ResearchSlotStripComponent {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  readonly slotViews = computed<ResearchSlotView[]>(() => {
    const activeResearch = this.gameState.activeResearch();
    return this.gameState
      .visibleResearchSlots()
      .map((slot) => this._buildSlotView(slot, activeResearch))
      .sort((a, b) => this._positionOrder(a.position) - this._positionOrder(b.position));
  });

  onSlotClick(slot: ResearchSlotView): void {
    this.eventBus.researchHubFocusRequested$.next(
      slot.activeNodeId ? { nodeId: slot.activeNodeId } : {}
    );
  }

  onResearchClick(): void {
    this.eventBus.researchHubFocusRequested$.next({});
  }

  private _buildSlotView(slot: ResearchSlot, activeResearch: ActiveResearchTrack[]): ResearchSlotView {
    const active = this._activeTrackForSlot(slot, activeResearch);
    const node = active ? this.data.getResearchNode(active.trackId) : undefined;
    const progressPercent = active && node ? this._progressPercent(active, node.durationYears) : 0;
    const etaYear = active && node && !active.isPaused
      ? this.gameState.gameYear() + Math.max(0, node.durationYears - this._elapsed(active))
      : null;

    return {
      slotId: slot.id,
      displayName: slot.displayName,
      planetId: slot.planetId,
      position: this._positionForSlot(slot),
      activeNodeId: active?.trackId ?? null,
      activeNodeName: node?.displayName ?? null,
      progressPercent,
      etaYear,
      isVisible: true,
    };
  }

  private _activeTrackForSlot(slot: ResearchSlot, activeResearch: ActiveResearchTrack[]): ActiveResearchTrack | null {
    return (
      activeResearch.find((track) => !track.isPaused && track.slotId === slot.id) ??
      activeResearch.find((track) => !track.isPaused && track.slotId === 'collaborative') ??
      null
    );
  }

  private _elapsed(track: ActiveResearchTrack): number {
    return track.elapsedBeforeStart + (track.isPaused ? 0 : this.gameState.gameYear() - track.startYear);
  }

  private _progressPercent(track: ActiveResearchTrack, durationYears: number): number {
    if (durationYears <= 0) return 100;
    return Math.min(100, Math.round((this._elapsed(track) / durationYears) * 100));
  }

  private _positionForSlot(slot: ResearchSlot): ResearchSlotPosition {
    if (slot.planetId === 'venus') return 'venus-left';
    if (slot.planetId === 'mars') return 'mars-right';
    return slot.id === 'earth_core_1' ? 'core-left' : 'core-right';
  }

  private _positionOrder(position: ResearchSlotPosition): number {
    return ['venus-left', 'core-left', 'core-right', 'mars-right'].indexOf(position);
  }
}