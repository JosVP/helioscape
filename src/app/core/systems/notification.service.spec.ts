import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { CultureEvent, ResearchTrack, TechNode } from '@app/core/models';

function makeTechNode(overrides: Partial<TechNode> = {}): TechNode {
  return {
    id: 'earth_advanced_renewables',
    planet: 'earth',
    displayName: 'Advanced Renewables Integration',
    description: 'We integrate advanced renewables.',
    outcomeSummary: ['Enables later Earth research.'],
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 20,
    durationYears: 10,
    effects: [],
    ...overrides,
  };
}

function makeResearchTrack(overrides: Partial<ResearchTrack> = {}): ResearchTrack {
  return {
    id: 'earth_fusion_ignition_theory_track',
    displayName: 'Fusion Ignition Theory Program',
    planet: 'earth',
    rpCost: 50,
    durationYears: 40,
    description: 'We test a research track.',
    prerequisiteTech: 'earth_deuterium_extraction_track',
    onCompleteEffects: [{ type: 'unlock_tech', target: 'earth_fusion_ignition_theory' }],
    ...overrides,
  };
}

function makeCultureEvent(overrides: Partial<CultureEvent> = {}): CultureEvent {
  return {
    id: 'ce_fusion_theory_complete',
    title: 'Fusion Theory Complete',
    narratorText: 'We cross a threshold.',
    portrait: '/assets/svg/portraits/ce_fusion_theory_complete.svg',
    choices: [],
    tags: [],
    trigger: { type: 'tech_completed', techId: 'earth_fusion_ignition_theory' },
    presentation: 'modal',
    priority: false,
    ...overrides,
  };
}

function setup(opts: {
  techNodes?: TechNode[];
  tracks?: ResearchTrack[];
  events?: CultureEvent[];
  year?: number;
} = {}) {
  const researchCompleted$ = new Subject<string>();
  const yearSignal = signal(opts.year ?? 2042);
  const techNodes = opts.techNodes ?? [];
  const tracks = opts.tracks ?? [];
  const events = opts.events ?? [];

  TestBed.configureTestingModule({
    providers: [
      NotificationService,
      {
        provide: EventBusService,
        useValue: { researchCompleted$ },
      },
      {
        provide: GameStateService,
        useValue: { gameYear: yearSignal.asReadonly() },
      },
      {
        provide: DataService,
        useValue: {
          getTechNode: vi.fn((id: string) => techNodes.find((node) => node.id === id)),
          getResearchTrack: vi.fn((id: string) => tracks.find((track) => track.id === id)),
          getCultureEvent: vi.fn((id: string) => events.find((event) => event.id === id)),
          getAllCultureEvents: vi.fn(() => events),
        },
      },
    ],
  });

  return { service: TestBed.inject(NotificationService), researchCompleted$ };
}

describe('NotificationService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('queues a lightweight notification when an ordinary tech research item completes', () => {
    const { service, researchCompleted$ } = setup({ techNodes: [makeTechNode()] });

    researchCompleted$.next('earth_advanced_renewables');

    expect(service.unreadNotifications()).toEqual([
      expect.objectContaining({
        sourceId: 'earth_advanced_renewables',
        title: 'Research complete: Advanced Renewables Integration',
        createdAtYear: 2042,
        kind: 'research-completed',
      }),
    ]);
  });

  it('suppresses generic notifications when completion has a modal culture event', () => {
    const { service, researchCompleted$ } = setup({
      tracks: [makeResearchTrack()],
      events: [makeCultureEvent()],
    });

    researchCompleted$.next('earth_fusion_ignition_theory_track');

    expect(service.unreadNotifications()).toEqual([]);
  });

  it('removes a notification when it is marked read', () => {
    const { service, researchCompleted$ } = setup({ techNodes: [makeTechNode()] });

    researchCompleted$.next('earth_advanced_renewables');
    const [notification] = service.unreadNotifications();
    service.markRead(notification.id);

    expect(service.unreadNotifications()).toEqual([]);
  });
});
