// @vitest-environment jsdom
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MoonOverviewComponent } from './moon-overview.component';
import { DataService } from '@app/core/services/data.service';
import type { MoonData } from '@app/core/models';

// ---------------------------------------------------------------------------
// Stub DataService
// ---------------------------------------------------------------------------

const fakeMoon: MoonData = {
  id: 'moon',
  displayName: 'Moon',
  subtitle: 'Artemis Base — Shackleton Crater',
  description: 'We inherited this outpost from the Artemis Accords programme.',
  facilities: [
    { id: 'artemis_base', displayName: 'Artemis Base', description: 'The main crewed station.' },
    { id: 'far_side_array', displayName: 'Far-Side Radio Array', description: 'Quiet side.' },
  ],
};

const mockDataService = {
  getMoonData: () => fakeMoon,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MoonOverviewComponent', () => {
  let component: MoonOverviewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: DataService, useValue: mockDataService }],
    });
    component = TestBed.runInInjectionContext(() => new MoonOverviewComponent());
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('exposes moon data from DataService', () => {
    expect(component.moon.id).toBe('moon');
    expect(component.moon.subtitle).toBe('Artemis Base — Shackleton Crater');
  });

  it('exposes all facilities', () => {
    expect(component.moon.facilities).toHaveLength(2);
    expect(component.moon.facilities[0].id).toBe('artemis_base');
    expect(component.moon.facilities[1].id).toBe('far_side_array');
  });
});
