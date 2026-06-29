export type ResearchNodeCategory = 'capability' | 'efficiency' | 'reactive' | 'identity';

export interface ResearchNode {
  readonly id: string;
  readonly planet: string;
  readonly displayName: string;
  readonly category: ResearchNodeCategory;
  readonly tier: 1 | 2 | 3;
  readonly postV1?: boolean;
  readonly collaborative?: boolean;
  readonly durationYears: number;
  readonly description: string;
  readonly outcomeSummary: string[];
  readonly unlockCondition: string;
  readonly prerequisites: string[];
  readonly prerequisiteMode?: 'all' | 'any';
  readonly spilloverPrerequisites: string[];
  readonly spilloverGate?: {
    readonly mode: 'min_naturalist_nodes';
    readonly count: number;
  };
  readonly effects: ResearchEffect[];
  readonly arcIds?: string[];
  readonly transfersFrom?: ResearchTransfer[];
  readonly visualOrder?: number;
  readonly iconPath?: string;
  readonly colonySlotPlanet?: 'mars' | 'venus';
}

export interface ResearchTransfer {
  readonly fromNodeId: string;
  readonly effect:
    | 'capability_gate'
    | 'queue_reduction'
    | 'time_reduction'
    | 'event_mitigation'
    | 'variance_reduction'
    | 'research_time_reduction';
  readonly reason: string;
  readonly description: string;
}

export type ResearchEffect =
  | { readonly type: 'unlock_tech'; readonly target: string }
  | { readonly type: 'emit_event'; readonly eventId: string }
  | { readonly type: 'spillover_unlock'; readonly targetPlanet: string; readonly targetTech: string }
  | {
      readonly type: 'apply_terraforming_choice';
      readonly planet: string;
      readonly choiceId: string;
      readonly permanent: boolean;
    }
  | { readonly type: 'tag_decision'; readonly tag: 'naturalist' | 'architect' }
  | { readonly type: 'apply_colonist_bonus'; readonly bonus: 'dense_living' | 'open_environment' }
  | { readonly type: 'research_time_reduction'; readonly amountYears: number; readonly target?: string }
  | { readonly type: 'set_flag'; readonly flag: string }
  | { readonly type: 'present_fork'; readonly forkId: string; readonly choices: ForkChoice[] };

export interface ForkChoice {
  readonly id: string;
  readonly label: string;
  readonly tag: 'naturalist' | 'architect' | '';
  readonly effects: ResearchEffect[];
}

export interface ActiveResearch {
  readonly nodeId: string;
  readonly planetId: string;
  readonly slotId: string | null;
  readonly isPaused: boolean;
  /** The game year when this run (or most recent resume) began. */
  readonly startYear: number;
  /** Years accumulated from all paused/resumed runs before the current startYear. */
  readonly elapsedBeforeStart: number;
}

export interface ResearchSlot {
  readonly id: string;
  readonly displayName: string;
  readonly planetId: string;
  readonly kind: 'default' | 'colony';
  readonly populationThreshold?: number;
}

export interface ResearchArcDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly type: 'open' | 'closed';
  readonly progressMode?: 'finite' | 'ongoing';
  readonly totalFindings?: number;
  readonly unlockNodeIds?: string[];
  readonly description: string;
  readonly nodeIds: string[];
  readonly knownFindings: ResearchArcKnownFinding[];
}

export interface ResearchArcKnownFinding {
  readonly id: string;
  readonly title: string;
  readonly requirement: string;
  readonly eventId?: string;
}

export interface ResearchArcLogEntry {
  readonly arcId: string;
  readonly findingId: string;
  readonly year: number;
  readonly title: string;
  readonly summary: string;
  readonly eventId?: string;
}

export interface LegacyResearchTrack {
  readonly id: string;
  readonly displayName: string;
  readonly planet: string;
  readonly rpCost: number;
  readonly durationYears: number;
  readonly description: string;
  readonly prerequisiteTech: string;
  readonly onCompleteEffects: ResearchEffect[];
}

export interface LegacyTechNode extends Omit<ResearchNode, 'tier' | 'category' | 'unlockCondition'> {
  readonly rpCost: number;
  readonly tier?: number;
  readonly category?: ResearchNodeCategory;
  readonly unlockCondition?: string;
  readonly silhouetteIconPath?: string;
}
