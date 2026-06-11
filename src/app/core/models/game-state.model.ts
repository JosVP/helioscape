import type { PlanetState } from './planet.model';
import type { ActiveResearchTrack } from './tech-tree.model';
import type { CultureEventEntry, CultureEventHistoryEntry } from './culture-event.model';

/**
 * The full serializable game state — what gets saved/loaded.
 * This is the shape of a complete save file.
 */
export interface SerializedGameState {
  version: number;
  saveTimestamp: number;
  gameYear: number;
  gameSpeed: 1 | 4;
  isPaused: boolean;
  isFirstPlaythrough: boolean;
  planets: Record<string, PlanetState>;
  completedTechs: string[];
  activeResearch: ActiveResearchTrack[];
  pendingFork: PendingFork | null;
  mercuryResources: ResourceStore;
  mercuryBuildings: PlacedBuilding[];
  mercuryBuildQueue: MercuryQueueEntry[];
  dysonPanelCount: number;
  dysonPanelTier: 'basic' | 'mid' | 'hardened';
  dysonCoveragePercent: number;
  dysonEnergyWatts: number;
  kardashevLevel: number;
  completedMilestones: string[];
  naturalistCount: number;
  architectCount: number;
  colonistBonuses: {
    denseLiving: boolean;
    openEnvironment: boolean;
  };
  earthFlags: Record<string, boolean>;
  cultureEventQueue: CultureEventEntry[];
  cultureEventHistory: CultureEventHistoryEntry[];
  bioPhases: Record<string, PlanetBioState>;
  europaState: EuropaState;
  currentSaveSlot: number;
}

/**
 * Represents a pending fork choice that must be resolved before unlocking more techs.
 */
export interface PendingFork {
  techId: string;
  planetId: string;
  forkId: string;
}

/**
 * Mercury resource inventory.
 */
export interface ResourceStore {
  commonOre: number;
  rareMetals: number;
  polarVolatiles: number;
}

/**
 * A building placed on the Mercury grid.
 */
export interface PlacedBuilding {
  id: string;
  buildingId: string;
  col: number;
  row: number;
  status: 'building' | 'operational';
  buildProgressYears: number;
  totalBuildYears: number;
}

/**
 * An orbital component in the Mercury build queue.
 */
export interface MercuryQueueEntry {
  componentId: string;
  targetPlanet: string;
  progressYears: number;
  totalYears: number;
}

/**
 * Bio phase state for a planet.
 */
export interface PlanetBioState {
  currentPhaseIndex: number;
  phases: BioPhaseState[];
  odnBuilt: boolean;
  bioreactorBatchesActive: number;
  precipitationEnginesBuilt: number;
  atmosphericCatalystShipsBuilt: number;
  requestsSent: string[];
  discoveredOrganisms: string[];
}

/**
 * State of a single bio phase.
 */
export interface BioPhaseState {
  status: 'locked' | 'available' | 'running' | 'complete' | 'collapsed';
  actionsTaken: string[];
  progressYears: number;
  durationYears: number;
  startedYear: number;
  completedYear: number;
}

/**
 * Europa mission state.
 */
export interface EuropaState {
  missionAuthorised: boolean;
  impactYear: number;
  impacted: boolean;
  lifeConfirmed: boolean;
}

// ---------------------------------------------------------------------------
// EventBusService payload types
// ---------------------------------------------------------------------------

/** Emitted when a tech node is unlocked on a planet. */
export interface TechUnlockedEvent {
  planetId: string;
  nodeId: string;
}

/** Emitted when a terraforming choice is applied on a planet. */
export interface TerraformChoiceEvent {
  planetId: string;
  choiceId: string;
}

/** Emitted when a terraforming phase advances on a planet. */
export interface TerraformPhaseEvent {
  planetId: string;
  phase: number;
}

/** Emitted for bio-phase lifecycle events (started / completed / collapsed). */
export interface BioPhaseEvent {
  planetId: string;
  phaseId: string;
}

/** Emitted when a fork choice is presented to the player. */
export interface ForkPresentedEvent {
  planetId: string;
  techId: string;
}
