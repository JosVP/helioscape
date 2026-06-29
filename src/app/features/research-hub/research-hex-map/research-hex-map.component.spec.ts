import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ResearchLayoutData } from '@app/core/models';
import { ResearchHexMapComponent } from './research-hex-map.component';

const LAYOUT: ResearchLayoutData = { hexSize: 38, hexGap: 12, regions: [], nodes: [] };

describe('ResearchHexMapComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('calculates bounds around map nodes', () => {
    const component = TestBed.runInInjectionContext(() => new ResearchHexMapComponent());
    Object.defineProperty(component, 'nodes', {
      value: () => [
        { x: 0, y: 0, region: 'earth', entry: { visibility: 'available', node: { id: 'a' } } },
        { x: 200, y: 100, region: 'earth', entry: { visibility: 'locked', node: { id: 'b' } } },
      ],
    });
    Object.defineProperty(component, 'lines', { value: () => [] });
    Object.defineProperty(component, 'layout', { value: () => LAYOUT });

    expect(component.bounds()).toEqual({ minX: -180, minY: -180, width: 560, height: 460 });
  });
});