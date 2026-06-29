import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ResearchArcKnownFinding, ResearchArcLogEntry, ResearchTransfer } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

@Injectable({ providedIn: 'root' })
export class ResearchArcService {
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);
  private readonly gameState = inject(GameStateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.eventBus.researchCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nodeId) => this.recordFindingsForCompletedNode(nodeId));
  }

  isTransferActive(toNodeId: string, fromNodeId: string): boolean {
    const node = this.data.getResearchNode(toNodeId);
    if (!node?.transfersFrom?.some((transfer) => transfer.fromNodeId === fromNodeId)) {
      return false;
    }
    return this.gameState.completedTechs().includes(fromNodeId);
  }

  getActiveTransfersForNode(nodeId: string): ResearchTransfer[] {
    const node = this.data.getResearchNode(nodeId);
    if (!node?.transfersFrom) return [];
    const completed = new Set(this.gameState.completedTechs());
    return node.transfersFrom.filter((transfer) => completed.has(transfer.fromNodeId));
  }

  private recordFindingsForCompletedNode(nodeId: string): void {
    const node = this.data.getResearchNode(nodeId);
    if (!node?.arcIds?.length) return;

    for (const arcId of node.arcIds) {
      const arc = this.data.getResearchArc(arcId);
      const finding = arc?.knownFindings.find((candidate) => this.findingMatchesNode(candidate, nodeId));
      if (!finding) continue;
      if (this.hasFinding(arcId, finding.id)) continue;
      const entry: ResearchArcLogEntry = {
        arcId,
        findingId: finding.id,
        year: this.gameState.gameYear(),
        title: finding.title,
        summary: finding.requirement,
        eventId: finding.eventId,
      };
      this.gameState.addArcFinding(entry);
      if (finding.eventId) {
        this.eventBus.cultureEventRequested$.next({ eventId: finding.eventId });
      }
    }
  }

  private findingMatchesNode(finding: ResearchArcKnownFinding, nodeId: string): boolean {
    return finding.requirement === nodeId || finding.requirement === `node:${nodeId}`;
  }

  private hasFinding(arcId: string, findingId: string): boolean {
    return this.gameState.arcLog()[arcId]?.some((entry) => entry.findingId === findingId) ?? false;
  }
}
