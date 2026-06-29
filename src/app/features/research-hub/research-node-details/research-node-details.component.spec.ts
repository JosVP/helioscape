import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ResearchNodeDetailsComponent } from './research-node-details.component';

describe('ResearchNodeDetailsComponent', () => {
  it('creates output channels for research actions and prerequisite focus', () => {
    const component = TestBed.runInInjectionContext(() => new ResearchNodeDetailsComponent());

    expect(component.startRequested).toBeDefined();
    expect(component.pauseRequested).toBeDefined();
    expect(component.resumeRequested).toBeDefined();
    expect(component.prerequisiteFocused).toBeDefined();
  });
});