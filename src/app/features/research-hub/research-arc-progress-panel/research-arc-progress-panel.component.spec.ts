import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ResearchArcProgressPanelComponent } from './research-arc-progress-panel.component';

describe('ResearchArcProgressPanelComponent', () => {
  it('requires arc view input for the standalone panel', () => {
    const component = TestBed.runInInjectionContext(() => new ResearchArcProgressPanelComponent());

    expect(component.arcs).toBeDefined();
  });
});