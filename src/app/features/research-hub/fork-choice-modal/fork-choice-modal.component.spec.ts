// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingFork, TechNode } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ForkChoiceModalComponent } from './fork-choice-modal.component';

const FORK_TECH_NODE: TechNode = {
  id: 'earth_automated_food_systems',
  planet: 'earth',
  displayName: 'Automated Food Systems',
  description: 'We automate food systems and choose what freed land becomes.',
  outcomeSummary: ['Presents a Naturalist or Architect fork.'],
  prerequisites: ['earth_advanced_renewables'],
  prerequisiteMode: 'any',
  spilloverPrerequisites: [],
  rpCost: 35,
  durationYears: 25,
  tier: 2,
  effects: [
    {
      type: 'present_fork',
      forkId: 'food_systems_fork',
      choices: [
        {
          id: 'rewild_freed_land',
          label: 'Rewild the freed land',
          tag: 'naturalist',
          effects: [
            { type: 'emit_event', eventId: 'ce_food_fork_naturalist' },
            { type: 'tag_decision', tag: 'naturalist' },
          ],
        },
        {
          id: 'develop_freed_land',
          label: 'Develop the freed land',
          tag: 'architect',
          effects: [
            { type: 'emit_event', eventId: 'ce_food_fork_architect' },
            { type: 'tag_decision', tag: 'architect' },
          ],
        },
      ],
    },
  ],
};

const PENDING_FORK: PendingFork = {
  techId: 'earth_automated_food_systems',
  planetId: 'earth',
  forkId: 'food_systems_fork',
};

function setFork(component: ForkChoiceModalComponent, fork: PendingFork): void {
  Object.defineProperty(component, 'fork', {
    configurable: true,
    value: () => fork,
  });
}

describe('ForkChoiceModalComponent', () => {
  const mockTechTreeService = { completeForkChoice: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  function setup(node: TechNode | null = FORK_TECH_NODE): ForkChoiceModalComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: TechTreeService, useValue: mockTechTreeService },
        {
          provide: DataService,
          useValue: { getTechNode: (id: string) => (node && id === node.id ? node : undefined) },
        },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new ForkChoiceModalComponent());
    setFork(component, node ? PENDING_FORK : { ...PENDING_FORK, techId: 'unknown_tech_id' });
    return component;
  }

  it('resolves the fork-bearing research display name', () => {
    const component = setup();

    expect(component.techDisplayName()).toBe('Automated Food Systems');
  });

  it('falls back to tech id when the node is missing', () => {
    const component = setup(null);

    expect(component.techDisplayName()).toBe('unknown_tech_id');
    expect(component.enrichedChoices()).toEqual([]);
  });

  it('enriches choices without surfacing old RP or capacity language', () => {
    const component = setup();

    const choices = component.enrichedChoices();

    expect(choices.map((choice) => choice.label)).toEqual([
      'Rewild the freed land',
      'Develop the freed land',
    ]);
    expect(choices.map((choice) => choice.tag)).toEqual(['naturalist', 'architect']);
    expect(choices.flatMap((choice) => choice.effectSummary).join(' ')).not.toMatch(/RP|capacity/i);
  });

  it('does not include tag or event-only effects in the summary', () => {
    const component = setup();

    expect(component.enrichedChoices().flatMap((choice) => choice.effectSummary)).toEqual([]);
  });

  it('delegates the chosen fork choice to TechTreeService', () => {
    const component = setup();

    component.choose('develop_freed_land');

    expect(mockTechTreeService.completeForkChoice).toHaveBeenCalledWith(
      'earth',
      'earth_automated_food_systems',
      'develop_freed_land',
    );
  });

  it('renders branch tag labels', () => {
    const component = setup();

    expect(component.tagLabel('naturalist')).toContain('Naturalist');
    expect(component.tagLabel('architect')).toContain('Architect');
    expect(component.tagLabel('')).toBe('');
  });
});