export interface TechNode {
  id: string;
  planet: string;
  displayName: string;
  prerequisites: string[];
  prerequisiteMode?: 'all' | 'any';
  spilloverPrerequisites: string[];
  spilloverGate?: {
    mode: 'min_naturalist_nodes';
    count: number;
  };
  rpCost: number;
  durationYears: number;
  effects: TechEffect[];
  tier?: number;
}

export type TechEffect =
  | { type: 'unlock_tech'; target: string }
  | { type: 'emit_event'; eventId: string }
  | { type: 'spillover_unlock'; targetPlanet: string; targetTech: string }
  | {
      type: 'apply_terraforming_choice';
      planet: string;
      choiceId: string;
      permanent: boolean;
    }
  | { type: 'tag_decision'; tag: 'naturalist' | 'architect' }
  | { type: 'apply_colonist_bonus'; bonus: 'dense_living' | 'open_environment' }
  | { type: 'rp_capacity_boost'; amount: number }
  | { type: 'set_flag'; flag: string }
  | { type: 'present_fork'; forkId: string; choices: ForkChoice[] };

export interface ForkChoice {
  id: string;
  label: string;
  tag: 'naturalist' | 'architect' | '';
  effects: TechEffect[];
}

export interface ResearchTrack {
  id: string;
  displayName: string;
  planet: string;
  rpCost: number;
  durationYears: number;
  description: string;
  prerequisiteTech: string;
  onCompleteEffects: TechEffect[];
}

export interface ActiveResearchTrack {
  trackId: string;
  planetId: string;
  progressYears: number;
  isPaused: boolean;
}
