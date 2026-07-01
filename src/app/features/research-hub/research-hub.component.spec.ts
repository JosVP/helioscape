import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActiveResearchTrack, ResearchArcDefinition, ResearchLayoutData, ResearchNode, ResearchSlot } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchArcService } from '@app/core/systems/research-arc.service';
import { ResearchService } from '@app/core/systems/research.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ResearchHubComponent } from './research-hub.component';

const NODES: ResearchNode[] = [
  makeNode({ id: 'earth_launch_mercury_mission', displayName: 'Launch Mercury Mission' }),
  makeNode({ id: 'earth_parent', displayName: 'Parent Research' }),
  makeNode({ id: 'earth_child', displayName: 'Child Research', prerequisites: ['earth_parent'] }),
  makeNode({ id: 'moon_spillover', planet: 'moon', displayName: 'Moon Spillover', spilloverPrerequisites: ['earth_parent'] }),
  makeNode({
    id: 'mars_transfer_target',
    planet: 'mars',
    displayName: 'Mars Transfer Target',
    transfersFrom: [
      { fromNodeId: 'earth_parent', effect: 'time_reduction', reason: 'shared tools', description: 'Earth tools shorten the work.' },
    ],
  }),
];

const LAYOUT: ResearchLayoutData = {
  hexSize: 38,
  hexGap: 12,
  regions: [{ id: 'earth-center', displayName: 'Earth', anchor: { q: 0, r: 0 } }],
  nodes: NODES.map((node, index) => ({ nodeId: node.id, q: index * 2, r: 0, region: 'earth-center' })),
};

const ARCS: ResearchArcDefinition[] = [
  {
    id: 'deep_ocean_exploration',
    displayName: 'Deep Ocean Exploration',
    type: 'open',
    progressMode: 'ongoing',
    unlockNodeIds: ['earth_parent'],
    description: 'We learn from oceans.',
    nodeIds: ['earth_parent'],
    knownFindings: [],
  },
];

function makeNode(overrides: Partial<ResearchNode>): ResearchNode {
  return {
    id: 'node',
    planet: 'earth',
    displayName: 'Node',
    category: 'capability',
    tier: 1,
    durationYears: 10,
    description: 'We study a thing.',
    outcomeSummary: ['A useful outcome.'],
    unlockCondition: 'Available for tests.',
    prerequisites: [],
    spilloverPrerequisites: [],
    effects: [],
    ...overrides,
  };
}

function makeGameStateFake() {
  const interactionLocked = signal(false);
  const gameYear = signal(2040);
  const completedTechs = signal<string[]>(['earth_parent']);
  const completedResearchYears = signal<Record<string, number>>({ earth_parent: 2039 });
  const activeResearch = signal<ActiveResearchTrack[]>([]);
  const availableResearchSlots = signal<ResearchSlot[]>([
    { id: 'earth_core_1', displayName: 'Earth Research I', planetId: 'earth', kind: 'default' },
  ]);
  const pendingFork = signal(null);
  const arcLog = signal({});
  return {
    gameYear: gameYear.asReadonly(),
    completedTechs: completedTechs.asReadonly(),
    completedResearchYears: completedResearchYears.asReadonly(),
    activeResearch: activeResearch.asReadonly(),
    availableResearchSlots: availableResearchSlots.asReadonly(),
    pendingFork: pendingFork.asReadonly(),
    arcLog: arcLog.asReadonly(),
    visibleResearchSlots: availableResearchSlots.asReadonly(),
    occupiedResearchSlotIds: computed(() => new Set<string>()),
    interactionLocked: interactionLocked.asReadonly(),
    setInteractionLocked: (value: boolean) => interactionLocked.set(value),
    setCompletedTechs: (value: string[]) => completedTechs.set(value),
    setActiveResearch: (value: ActiveResearchTrack[]) => activeResearch.set(value),
  };
}

describe('ResearchHubComponent', () => {
  let gameState: ReturnType<typeof makeGameStateFake>;
  let researchService: Pick<ResearchService, 'canStartTechTrack' | 'startTechTrack' | 'pauseTrack' | 'resumeTrack'>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    gameState = makeGameStateFake();
    researchService = {
      canStartTechTrack: vi.fn(() => true),
      startTechTrack: vi.fn(),
      pauseTrack: vi.fn(),
      resumeTrack: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DataService,
          useValue: {
            getResearchLayout: () => LAYOUT,
            getAllResearchNodes: () => NODES,
            getAllResearchArcs: () => ARCS,
          },
        },
        { provide: GameStateService, useValue: gameState },
        { provide: TechTreeService, useValue: { canUnlock: (_planetId: string, nodeId: string) => nodeId !== 'earth_parent' } },
        { provide: ResearchService, useValue: researchService },
        { provide: ResearchArcService, useValue: { getActiveTransfersForNode: () => [] } },
        {
          provide: EventBusService,
          useValue: { researchCompleted$: new Subject<string>(), techUnlocked$: new Subject<{ planetId: string; nodeId: string }>() },
        },
      ],
    });
  });

  function createComponent(): ResearchHubComponent {
    return TestBed.runInInjectionContext(() => new ResearchHubComponent());
  }

  it('defaults to Mercury launch and builds one map tile per layout node', () => {
    const component = createComponent();

    expect(component.selectedEntry()?.node.id).toBe('earth_launch_mercury_mission');
    expect(component.mapNodes()).toHaveLength(NODES.length);
  });

  it('derives prerequisite, spillover, and transfer lines from node data', () => {
    const component = createComponent();

    expect(component.mapLines().map((line) => line.kind).sort()).toEqual(['prerequisite', 'spillover', 'transfer']);
  });

  it('starts, pauses, and resumes through ResearchService only', () => {
    const component = createComponent();

    component.onStartSelectedNode('earth_child');
    component.onPauseSelectedNode('earth_child');
    component.onResumeSelectedNode('earth_child');

    expect(researchService.startTechTrack).toHaveBeenCalledWith('earth_child', 'earth');
    expect(researchService.pauseTrack).toHaveBeenCalledWith('earth_child');
    expect(researchService.resumeTrack).toHaveBeenCalledWith('earth_child');
  });

  it('does not start, pause, or resume while interactions are locked', () => {
    gameState.setInteractionLocked(true);
    const component = createComponent();

    component.onStartSelectedNode('earth_child');
    component.onPauseSelectedNode('earth_child');
    component.onResumeSelectedNode('earth_child');

    expect(researchService.startTechTrack).not.toHaveBeenCalled();
    expect(researchService.pauseTrack).not.toHaveBeenCalled();
    expect(researchService.resumeTrack).not.toHaveBeenCalled();
  });

  it('shows standalone arc progress when an unlock node is complete', () => {
    const component = createComponent();

    expect(component.arcPanelViews()).toHaveLength(1);
    expect(component.arcPanelViews()[0].progressText).toBe('Ongoing, 0 findings');
  });
});
