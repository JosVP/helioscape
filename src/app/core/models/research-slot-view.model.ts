export type ResearchSlotPosition = 'venus-left' | 'core-left' | 'core-right' | 'mars-right';

export interface ResearchSlotView {
  readonly slotId: string;
  readonly displayName: string;
  readonly planetId: string;
  readonly position: ResearchSlotPosition;
  readonly activeNodeId: string | null;
  readonly activeNodeName: string | null;
  readonly progressPercent: number;
  readonly etaYear: number | null;
  readonly isVisible: boolean;
}