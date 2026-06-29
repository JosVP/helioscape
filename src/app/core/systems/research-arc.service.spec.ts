// @vitest-environment jsdom

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResearchArcDefinition, ResearchArcLogEntry, ResearchNode } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchArcService } from './research-arc.service';

const NODE: ResearchNode = {
  id: 'mars_ocean_confirmed',
  planet: 'mars',
  displayName: 'Mars Ocean Confirmed',
  category: 'capability',
  tier: 1,
  durationYears: 5,
  description: 'We confirm the old ocean.',
  outcomeSummary: [],
  unlockCondition: 'Available',
  prerequisites: [],
  spilloverPrerequisites: [],
  effects: [],
  arcIds: ['hunt_for_life'],
};

const TRANSFER_NODE: ResearchNode = {
  ...NODE,
  id: 'venus_carbonate_sequestration',
  planet: 'venus',
  displayName: 'Carbonate Sequestration',
  arcIds: [],
  transfersFrom: [
    {
      fromNodeId: 'earth_co2_drawdown',
      effect: 'queue_reduction',
      reason: 'Earth drawdown gives us the template.',
      description: 'Venus can reuse Earth carbon logistics.',
    },
  ],
};

const ARC: ResearchArcDefinition = {
  id: 'hunt_for_life',
  displayName: 'Hunt for Life',
  type: 'open',
  description: 'We connect clues about life.',
  nodeIds: ['mars_ocean_confirmed'],
  knownFindings: [
    {
      id: 'mars_ocean_context',
      title: 'Mars Gives Us A Water Baseline',
      requirement: 'node:mars_ocean_confirmed',
      eventId: 'ce_mars_ocean_context',
    },
  ],
};

describe('ResearchArcService', () => {
  const gameYear = signal(2042);
  const completedTechs = signal<string[]>([]);
  const arcLog = signal<Record<string, ResearchArcLogEntry[]>>({});

  let researchCompleted$: Subject<string>;
  let cultureEventRequested$: Subject<{ eventId: string; priority?: boolean }>;
  let requestedEvents: string[];
  let service: ResearchArcService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    gameYear.set(2042);
    completedTechs.set([]);
    arcLog.set({});
    researchCompleted$ = new Subject<string>();
    cultureEventRequested$ = new Subject<{ eventId: string; priority?: boolean }>();
    requestedEvents = [];
    cultureEventRequested$.subscribe(({ eventId }) => requestedEvents.push(eventId));

    TestBed.configureTestingModule({
      providers: [
        ResearchArcService,
        {
          provide: DataService,
          useValue: {
            getResearchNode: (id: string) => {
              if (id === NODE.id) return NODE;
              if (id === TRANSFER_NODE.id) return TRANSFER_NODE;
              return undefined;
            },
            getResearchArc: (id: string) => (id === ARC.id ? ARC : undefined),
          },
        },
        {
          provide: EventBusService,
          useValue: { researchCompleted$, cultureEventRequested$ },
        },
        {
          provide: GameStateService,
          useValue: {
            gameYear: gameYear.asReadonly(),
            completedTechs: completedTechs.asReadonly(),
            arcLog: arcLog.asReadonly(),
            addArcFinding: vi.fn((entry: ResearchArcLogEntry) => {
              arcLog.update((current) => {
                const entries = current[entry.arcId] ?? [];
                if (entries.some((existing) => existing.findingId === entry.findingId)) return current;
                return { ...current, [entry.arcId]: [...entries, entry] };
              });
            }),
          },
        },
      ],
    });

    service = TestBed.inject(ResearchArcService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('records a matching arc finding once when research completes', () => {
    researchCompleted$.next('mars_ocean_confirmed');
    researchCompleted$.next('mars_ocean_confirmed');

    expect(arcLog()['hunt_for_life']).toEqual([
      {
        arcId: 'hunt_for_life',
        findingId: 'mars_ocean_context',
        year: 2042,
        title: 'Mars Gives Us A Water Baseline',
        summary: 'node:mars_ocean_confirmed',
        eventId: 'ce_mars_ocean_context',
      },
    ]);
  });

  it('requests a culture event alongside a matching finding', () => {
    researchCompleted$.next('mars_ocean_confirmed');

    expect(requestedEvents).toEqual(['ce_mars_ocean_context']);
  });

  it('reports deterministic transfers only after the source node is completed', () => {
    expect(service.isTransferActive('venus_carbonate_sequestration', 'earth_co2_drawdown')).toBe(false);
    expect(service.getActiveTransfersForNode('venus_carbonate_sequestration')).toEqual([]);

    completedTechs.set(['earth_co2_drawdown']);

    expect(service.isTransferActive('venus_carbonate_sequestration', 'earth_co2_drawdown')).toBe(true);
    expect(service.getActiveTransfersForNode('venus_carbonate_sequestration')).toEqual(TRANSFER_NODE.transfersFrom);
  });
});
