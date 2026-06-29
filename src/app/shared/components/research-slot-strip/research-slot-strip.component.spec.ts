import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActiveResearchTrack, ResearchNode, ResearchSlot } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchSlotStripComponent } from './research-slot-strip.component';

const SLOTS: ResearchSlot[] = [
  { id: 'earth_core_1', displayName: 'Earth Research I', planetId: 'earth', kind: 'default' },
  { id: 'earth_core_2', displayName: 'Earth Research II', planetId: 'earth', kind: 'default' },
  { id: 'mars_colony', displayName: 'Mars Research', planetId: 'mars', kind: 'colony' },
  { id: 'venus_colony', displayName: 'Venus Research', planetId: 'venus', kind: 'colony' },
];

const NODE: ResearchNode = {
  id: 'earth_advanced_renewables',
  planet: 'earth',
  displayName: 'Advanced Renewables',
  category: 'capability',
  tier: 1,
  durationYears: 10,
  description: 'We improve renewable baseload.',
  outcomeSummary: ['Unlocks a cleaner grid.'],
  unlockCondition: 'Available at start.',
  prerequisites: [],
  spilloverPrerequisites: [],
  effects: [],
};

function makeActive(overrides: Partial<ActiveResearchTrack> = {}): ActiveResearchTrack {
  return {
    trackId: NODE.id,
    planetId: 'earth',
    slotId: 'earth_core_1',
    isPaused: false,
    startYear: 2030,
    elapsedBeforeStart: 2,
    ...overrides,
  };
}

describe('ResearchSlotStripComponent', () => {
  const gameYear = signal(2033);
  const visibleResearchSlots = signal<ResearchSlot[]>(SLOTS);
  const activeResearch = signal<ActiveResearchTrack[]>([]);
  const focusRequests = new Subject<{ nodeId?: string }>();

  beforeEach(() => {
    TestBed.resetTestingModule();
    gameYear.set(2033);
    visibleResearchSlots.set(SLOTS);
    activeResearch.set([]);
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: GameStateService,
          useValue: {
            gameYear: gameYear.asReadonly(),
            visibleResearchSlots: visibleResearchSlots.asReadonly(),
            activeResearch: activeResearch.asReadonly(),
          },
        },
        { provide: DataService, useValue: { getResearchNode: (id: string) => (id === NODE.id ? NODE : undefined) } },
        { provide: EventBusService, useValue: { researchHubFocusRequested$: focusRequests } },
      ],
    });
  });

  function createComponent(): ResearchSlotStripComponent {
    return TestBed.runInInjectionContext(() => new ResearchSlotStripComponent());
  }

  it('orders future slots outward from the two default slots', () => {
    const component = createComponent();

    expect(component.slotViews().map((slot) => slot.position)).toEqual([
      'venus-left',
      'core-left',
      'core-right',
      'mars-right',
    ]);
  });

  it('derives occupied slot progress and ETA from active research', () => {
    activeResearch.set([makeActive()]);
    const component = createComponent();

    const occupied = component.slotViews().find((slot) => slot.slotId === 'earth_core_1');

    expect(occupied?.activeNodeName).toBe('Advanced Renewables');
    expect(occupied?.progressPercent).toBe(50);
    expect(occupied?.etaYear).toBe(2038);
  });

  it('requests focus on the active node when an occupied slot is clicked', () => {
    activeResearch.set([makeActive()]);
    const nextSpy = vi.spyOn(focusRequests, 'next');
    const component = createComponent();
    const occupied = component.slotViews().find((slot) => slot.activeNodeId === NODE.id);

    if (!occupied) throw new Error('Expected occupied slot');
    component.onSlotClick(occupied);

    expect(nextSpy).toHaveBeenCalledWith({ nodeId: NODE.id });
  });

  it('opens the Research Hub without a node when an empty slot or hub button is clicked', () => {
    const nextSpy = vi.spyOn(focusRequests, 'next');
    const component = createComponent();
    const empty = component.slotViews()[0];

    component.onSlotClick(empty);
    component.onResearchClick();

    expect(nextSpy).toHaveBeenNthCalledWith(1, {});
    expect(nextSpy).toHaveBeenNthCalledWith(2, {});
  });
});