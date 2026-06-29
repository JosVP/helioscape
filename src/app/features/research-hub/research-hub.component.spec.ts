import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ActiveResearchTrack, PendingFork, ResearchSlot, TechNode, TechUnlockedEvent } from '@app/core/models';
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
    id: 'earth_launch_mercury_mission',
    displayName: 'Launch Mercury Mission',
    description: 'We open the first path outward.',
    outcomeSummary: ['Unlocks early Moon research tracks.'],
    tier: 0,
    rpCost: 0,
    durationYears: 0,
  }),
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
  makeNode({
    id: 'earth_preview_child',
    displayName: 'Second-Layer Hidden Child',
    description: 'This should not appear from another preview card.',
    outcomeSummary: ['This outcome should remain hidden.'],
    prerequisites: ['earth_newly_available'],
    tier: 3,
  }),
  makeNode({
    id: 'moon_low_gravity_medicine',
    planet: 'moon',
    displayName: 'Low Gravity Medicine',
    description: 'This Moon track should begin as a shrouded preview.',
    outcomeSummary: ['Supports life in low gravity.'],
    spilloverPrerequisites: ['earth_launch_mercury_mission'],
    tier: 1,
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
  const visibleResearchSlots = signal<ResearchSlot[]>([
    { id: 'earth_core_1', displayName: 'Earth Research I', planetId: 'earth', kind: 'default' },
    { id: 'earth_core_2', displayName: 'Earth Research II', planetId: 'earth', kind: 'default' },
  ]);
  const occupiedResearchSlotIds = computed(() => {
    const occupied = new Set<string>();
    for (const track of activeResearch()) {
      if (!track.isPaused && track.slotId) occupied.add(track.slotId);
    }
    return occupied;
  });
  const availableResearchSlots = computed(() => {
    const occupied = occupiedResearchSlotIds();
    return visibleResearchSlots().filter((slot) => !occupied.has(slot.id));
  });

  return {
    gameYear: gameYear.asReadonly(),
    completedTechs: completedTechs.asReadonly(),
    completedResearchYears: completedResearchYears.asReadonly(),
    activeResearch: activeResearch.asReadonly(),
    visibleResearchSlots: visibleResearchSlots.asReadonly(),
    occupiedResearchSlotIds,
    availableResearchSlots,
    usedRpCapacity: usedRpCapacity.asReadonly(),
    totalRpCapacity: totalRpCapacity.asReadonly(),
    pendingFork: pendingFork.asReadonly(),
    setCompletedTechs: (techIds: string[]) => completedTechs.set(techIds),
    setCompletedResearchYears: (years: Record<string, number>) => completedResearchYears.set(years),
    setActiveResearch: (tracks: ActiveResearchTrack[]) => activeResearch.set(tracks),
  };
}

function makeDataFake(): Pick<DataService, 'getTechNode' | 'getTechNodesForPlanet'> {
  return {
    getTechNode: (id: string) => TECH_NODES.find((node) => node.id === id),
    getTechNodesForPlanet: (planetId: string) =>
      TECH_NODES.filter((node) => node.planet === planetId),
  };
}

function makeTechTreeFake(gameState: ReturnType<typeof makeGameStateFake>): Pick<TechTreeService, 'canUnlock'> {
  return {
    canUnlock: (_planetId: string, nodeId: string) => {
      const node = TECH_NODES.find((candidate) => candidate.id === nodeId);
      if (!node) return false;

      const completed = gameState.completedTechs();
      if (completed.includes(nodeId)) return false;

      const directPrereqsMet =
        node.prerequisites.length === 0 ||
        (node.prerequisiteMode === 'any'
          ? node.prerequisites.some((id) => completed.includes(id))
          : node.prerequisites.every((id) => completed.includes(id)));
      const spilloverMet = node.spilloverPrerequisites.every((id) => completed.includes(id));
      return directPrereqsMet && spilloverMet;
    },
  };
}

function makeEventBusFake(): Pick<EventBusService, 'techUnlocked$' | 'researchCompleted$'> {
  return {
    techUnlocked$: new Subject<TechUnlockedEvent>(),
    researchCompleted$: new Subject<string>(),
  };
}

describe('ResearchHubComponent', () => {
  let fixture: ComponentFixture<ResearchHubComponent>;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let researchService: Pick<ResearchService, 'startTechTrack' | 'canStartTechTrack'>;
  let eventBus: ReturnType<typeof makeEventBusFake>;

  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    });

    researchService = {
      canStartTechTrack: vi.fn((nodeId: string) => nodeId !== 'earth_blocked_capacity'),
      startTechTrack: vi.fn(),
    };
    gameState = makeGameStateFake();
    eventBus = makeEventBusFake();

    await TestBed.configureTestingModule({
      imports: [ResearchHubComponent],
      providers: [
        { provide: DataService, useValue: makeDataFake() },
        { provide: GameStateService, useValue: gameState },
        { provide: TechTreeService, useValue: makeTechTreeFake(gameState) },
        { provide: EventBusService, useValue: eventBus },
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

  function nodeCard(nodeId: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
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

    expect(inspectorText()).toContain('All visible research slots are currently occupied.');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('shows locked node details with known prerequisites', () => {
    clickNode('earth_newly_available');

    expect(inspectorText()).toContain('Newly Available Follow-Up');
    expect(inspectorText()).toContain('Available Energy Grid');
    expect(inspectorText()).toContain('This should not steal the inspector selection');
    expect(inspectorText()).toContain('Keeps the current selection stable');
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

  it('shows Moon spillover tracks as locked cards until unlocked', () => {
    const moonPreview = nodeCard('moon_low_gravity_medicine');

    expect(moonPreview).not.toBeNull();
    expect(moonPreview?.classList).toContain('tech-node--locked');
    expect(moonPreview?.textContent).toContain('Low Gravity Medicine');
  });

  it('shows locked follow-up nodes without hiding second-layer children', () => {
    const directPreview = nodeCard('earth_newly_available');
    const secondLayerPreview = nodeCard('earth_preview_child');

    expect(directPreview).not.toBeNull();
    expect(directPreview?.classList).toContain('tech-node--locked');
    expect(secondLayerPreview).not.toBeNull();
    expect(secondLayerPreview?.classList).toContain('tech-node--locked');
  });

  it('marks completed cards briefly after researchCompleted emits', () => {
    vi.useFakeTimers();

    eventBus.researchCompleted$.next('earth_available');
    fixture.detectChanges();

    expect(nodeCard('earth_available')?.classList).toContain('tech-node--completion-recent');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(nodeCard('earth_available')?.classList).not.toContain('tech-node--completion-recent');
    vi.useRealTimers();
  });

  it('marks dependents when a completed prerequisite makes them available', () => {
    vi.useFakeTimers();

    gameState.setCompletedTechs(['earth_completed', 'earth_available']);
    eventBus.techUnlocked$.next({ planetId: 'earth', nodeId: 'earth_available' });
    fixture.detectChanges();

    expect(nodeCard('earth_available')?.classList).toContain('tech-node--completion-recent');
    expect(nodeCard('earth_newly_available')?.classList).toContain('tech-node--reveal-recent');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(nodeCard('earth_newly_available')?.classList).not.toContain('tech-node--reveal-recent');
    vi.useRealTimers();
  });

  it('updates the selected in-progress inspector to completed without changing selection', () => {
    clickNode('earth_progress');
    expect(inspectorText()).toContain('In Flight Materials');
    expect(fixture.nativeElement.querySelector('.tech-inspector__progress')).not.toBeNull();

    gameState.setCompletedTechs(['earth_completed', 'earth_progress']);
    gameState.setCompletedResearchYears({ earth_completed: 2039, earth_progress: 2041 });
    gameState.setActiveResearch([]);
    fixture.detectChanges();

    expect(inspectorText()).toContain('In Flight Materials');
    expect(inspectorText()).toContain('Year 2041');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
    expect(nodeCard('earth_progress')?.getAttribute('aria-current')).toBe('true');
  });
});
