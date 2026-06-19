import type { TechNode } from '@app/core/models';
import type { NodeVisibility } from '../tech-node-view.model';

export interface InspectorPrerequisite {
  readonly id: string;
  readonly label: string;
  readonly met: boolean;
  readonly isSpillover: boolean;
}

export interface TechInspectorViewModel {
  readonly node: TechNode;
  readonly visibility: NodeVisibility;
  readonly planetLabel: string;
  readonly statusLabel: string;
  readonly branchTag: 'naturalist' | 'architect' | null;
  readonly canRevealDetails: boolean;
  readonly prerequisites: InspectorPrerequisite[];
  readonly progressPercent?: number;
  readonly etaYear?: number;
  readonly completedYear?: number;
  readonly capacityShortfall?: number;
  readonly canStart: boolean;
}
