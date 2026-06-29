import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { ResearchNodeEntry } from '../research-hub-view.model';
import { ResearchHexTileComponent } from './research-hex-tile.component';

const ENTRY: ResearchNodeEntry = {
  visibility: 'available',
  node: {
    id: 'earth_node',
    planet: 'earth',
    displayName: 'Earth Node',
    category: 'capability',
    tier: 1,
    durationYears: 10,
    description: 'We test a node.',
    outcomeSummary: [],
    unlockCondition: 'Available.',
    prerequisites: [],
    spilloverPrerequisites: [],
    effects: [],
  },
};

describe('ResearchHexTileComponent', () => {
  it('derives labels from node visibility', () => {
    const component = TestBed.runInInjectionContext(() => new ResearchHexTileComponent());
    Object.defineProperty(component, 'entry', { value: () => ENTRY });

    expect(component.statusLabel()).toBe('Available');
    expect(component.ariaLabel()).toContain('Earth Node');
  });
});