import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ActiveResearchTrack, PendingFork, TechNode, TechUnlockedEvent } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchService } from '@app/core/systems/research.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ResearchHubComponent } from './research-hub.component';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const TECH_NODES: TechNode[] = [
  makeNode({
    id: 'earth_completed',
    displayName: 'Completed Foundations',
    description: 'The first foundation is already finished.',
    outcomeSummary: ['This work is already part of our toolkit.'],
    tier: 0,
  }),
  makeNode({
    id: 'earth_available',
    displayName: 'Available Energy Grid',
    description: 'We can start this grid integration when we choose.',
    outcomeSummary: ['Adds a path toward cleaner infrastructure.'],
    tier: 1,
    rpCost: 20,
    durationYears: 8,
  }),
  makeNode({
    id: 'earth_blocked_capacity',
    displayName: 'Capacity Heavy Network',
    description: 'This asks for more capacity than we can spare.',
    outcomeSummary: ['Unlocks a wider infrastructure programme.'],
    tier: 1,
    rpCost: 80,
  }),
  makeNode({
    id: 'earth_progress',
    displayName: 'In Flight Materials',
    description: 'This project is already moving through the labs.',
    outcomeSummary: ['Improves orbital construction planning.'],
    tier: 1,
    durationYears: 10,
  }),
  makeNode({
    id: 'earth_hint',
    displayName: 'Hidden Follow-Up',
    description: 'This description should stay hidden for hint nodes.',
    outcomeSummary: ['This outcome should stay hidden.'],
    prerequisites: ['earth_completed'],
    tier: 2,
  }),
  makeNode({
    id: 'earth_newly_available',
    displayName: 'Newly Available Follow-Up',
    description: 'This should not steal the inspector selection.',
    outcomeSummary: ['Keeps the current selection stable.'],
    prerequisites: ['earth_available'],
    tier: 2,
  }),
];

function makeNode(overrides: Partial<TechNode>): TechNode {
  return {
    id: 'earth_node',
    planet: 'earth',
    displayName: 'Earth Node',
    description: 'A test technology.',
    outcomeSummary: ['A test outcome.'],
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 10,
    durationYears: 5,
    effects: [],
    ...overrides,
  };
}

function makeActiveTrack(overrides: Partial<ActiveResearchTrack> = {}): ActiveResearchTrack {
  return {
    trackId: 'earth_progress',
    planetId: 'earth',
    isPaused: false,
    startYear: 2038,
    elapsedBeforeStart: 2,
    ...overrides,
  };
}

function makeGameStateFake() {
  const gameYear = signal(2040);
  const completedTechs = signal<string[]>(['earth_completed']);
  const completedResearchYears = signal<Record<string, number>>({ earth_completed: 2039 });
  const activeResearch = signal<ActiveResearchTrack[]>([makeActiveTrack()]);
  const usedRpCapacity = signal(0);
  const totalRpCapacity = signal(60);
  const pendingFork = signal<PendingFork | null>(null);

  return {
    gameYear: gameYear.asReadonly(),
    completedTechs: completedTechs.asReadonly(),
    completedResearchYears: completedResearchYears.asReadonly(),
    activeResearch: activeResearch.asReadonly(),
    usedRpCapacity: usedRpCapacity.asReadonly(),
    totalRpCapacity: totalRpCapacity.asReadonly(),
    pendingFork: pendingFork.asReadonly(),
    setCompletedTechs: (techIds: string[]) => completedTechs.set(techIds),
    setActiveResearch: (tracks: ActiveResearchTrack[]) => activeResearch.set(tracks),
  };
}

function makeDataFake(): Pick<DataService, 'getTechNode' | 'getTechNodesForPlanet'> {
  return {
    getTechNode: (id: string) => TECH_NODES.find((node) => node.id === id),
    getTechNodesForPlanet: (planetId: string) =>
      planetId === 'earth' ? TECH_NODES : [],
  };
}

function makeTechTreeFake(): Pick<TechTreeService, 'canUnlock'> {
  return {
    canUnlock: (_planetId: string, nodeId: string) =>
      nodeId === 'earth_available' || nodeId === 'earth_blocked_capacity' || nodeId === 'earth_newly_available',
  };
}

function makeEventBusFake(): Pick<EventBusService, 'techUnlocked$'> {
  return { techUnlocked$: new Subject<TechUnlockedEvent>() };
}

describe('ResearchHubComponent', () => {
  let fixture: ComponentFixture<ResearchHubComponent>;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let researchService: Pick<ResearchService, 'startTechTrack'>;

  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    });

    researchService = { startTechTrack: vi.fn() };
    gameState = makeGameStateFake();

    await TestBed.configureTestingModule({
      imports: [ResearchHubComponent],
      providers: [
        { provide: DataService, useValue: makeDataFake() },
        { provide: GameStateService, useValue: gameState },
        { provide: TechTreeService, useValue: makeTechTreeFake() },
        { provide: EventBusService, useValue: makeEventBusFake() },
        { provide: ResearchService, useValue: researchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchHubComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function clickNode(nodeId: string): void {
    const card = fixture.nativeElement.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
    expect(card).not.toBeNull();
    card?.click();
    fixture.detectChanges();
  }

  function inspectorText(): string {
    return fixture.nativeElement.querySelector('app-tech-node-inspector')?.textContent ?? '';
  }

  it('selects a node without starting research', () => {
    clickNode('earth_available');

    expect(inspectorText()).toContain('Available Energy Grid');
    expect(researchService.startTechTrack).not.toHaveBeenCalled();
  });

  it('starts research only from the inspector action', () => {
    clickNode('earth_available');

    const startButton = fixture.nativeElement.querySelector('.tech-inspector__start') as HTMLButtonElement | null;
    expect(startButton).not.toBeNull();
    startButton?.click();

    expect(researchService.startTechTrack).toHaveBeenCalledWith('earth_available', 'earth');
  });

  it('shows completed nodes with completion year and no start action', () => {
    clickNode('earth_completed');

    expect(inspectorText()).toContain('Completed Foundations');
    expect(inspectorText()).toContain('Year 2039');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('shows progress for in-progress nodes', () => {
    clickNode('earth_progress');

    expect(inspectorText()).toContain('In Flight Materials');
    expect(fixture.nativeElement.querySelector('.tech-inspector__progress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('shows capacity warning instead of start action when RP capacity is short', () => {
    clickNode('earth_blocked_capacity');

    expect(inspectorText()).toContain('20 more RP capacity');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('keeps hint node details hidden while showing known prerequisites', () => {
    clickNode('earth_hint');

    expect(inspectorText()).toContain('Locked technology');
    expect(inspectorText()).toContain('Completed Foundations');
    expect(inspectorText()).not.toContain('This description should stay hidden');
    expect(inspectorText()).not.toContain('This outcome should stay hidden');
  });

  it('does not auto-select a newly available node after the current selection completes', () => {
    clickNode('earth_available');
    expect(inspectorText()).toContain('Available Energy Grid');

    gameState.setCompletedTechs(['earth_completed', 'earth_available']);
    gameState.setActiveResearch([]);
    fixture.detectChanges();

    expect(inspectorText()).toContain('Available Energy Grid');
    expect(inspectorText()).not.toContain('Newly Available Follow-Up');
  });
});
