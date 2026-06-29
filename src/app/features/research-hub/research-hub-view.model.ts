import type { ResearchArcDefinition, ResearchArcLogEntry, ResearchNode, ResearchTransfer } from '@app/core/models';

/** UI-only status for a research node in the Research Hub. */
export type NodeVisibility = 'completed' | 'running' | 'paused' | 'available' | 'locked' | 'post_v1';

export interface ResearchNodeEntry {
  readonly node: ResearchNode;
  readonly visibility: NodeVisibility;
  readonly progressPercent?: number;
  readonly etaYear?: number;
  readonly isPaused?: boolean;
}

export interface ResearchMapNode {
  readonly entry: ResearchNodeEntry;
  readonly x: number;
  readonly y: number;
  readonly region: string;
}

export type ResearchMapLineKind = 'prerequisite' | 'spillover' | 'transfer';

export interface ResearchMapLine {
  readonly id: string;
  readonly kind: ResearchMapLineKind;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly planetId: string;
}

export interface ResearchPrerequisiteView {
  readonly id: string;
  readonly label: string;
  readonly met: boolean;
  readonly isSpillover: boolean;
}

export interface ResearchNodeDetailsViewModel {
  readonly entry: ResearchNodeEntry;
  readonly planetLabel: string;
  readonly statusLabel: string;
  readonly branchTag: 'naturalist' | 'architect' | null;
  readonly prerequisites: ResearchPrerequisiteView[];
  readonly activeTransfers: ResearchTransfer[];
  readonly completedYear?: number;
  readonly canStart: boolean;
  readonly canPause: boolean;
  readonly canResume: boolean;
  readonly startBlockedReason?: string;
}

export interface ResearchArcPanelView {
  readonly definition: ResearchArcDefinition;
  readonly findings: ResearchArcLogEntry[];
  readonly progressPercent: number;
  readonly progressText: string;
  readonly isComplete: boolean;
}