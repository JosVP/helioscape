import type {
  ActiveResearch,
  ForkChoice,
  LegacyResearchTrack,
  LegacyTechNode,
  ResearchEffect,
} from './research-track.model';

export type TechNode = LegacyTechNode;
export type TechEffect = ResearchEffect;
export type { ForkChoice };
export type ResearchTrack = LegacyResearchTrack;

export interface ActiveResearchTrack extends Omit<ActiveResearch, 'nodeId' | 'slotId'> {
  readonly trackId: string;
  readonly slotId?: string | null;
}
