import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourcePowerBarComponent } from './resource-power-bar.component';
import { DataService, type MercuryBuilding } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { ResourceStore, PlacedBuilding } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResources(overrides: Partial<ResourceStore> = {}): ResourceStore {
  return { commonOre: 0, rareMetals: 0, polarVolatiles: 0, ...overrides };
}

function makeBuilding(overrides: Partial<PlacedBuilding> = {}): PlacedBuilding {
  return {
    id: 'b1',
    buildingId: 'ore_extractor',
    col: 0,
    row: 0,
    status: 'operational',
    buildProgressYears: 10,
    totalBuildYears: 10,
    ...overrides,
  };
}

function makeMercuryBuildingDef(overrides: Partial<MercuryBuilding> = {}): MercuryBuilding {
  return {
    id: 'ore_extractor',
    displayName: 'Ore Extractor',
    description: '',
    category: 'buildings',
    cost: makeResources(),
    energyDrawGw: 1,
    buildTimeYears: 5,
    repeatable: true,
    maxInstances: null,
    unlockCondition: null,
    placementRule: 'any',
    effects: [{ type: 'resource_rate', resourceId: 'commonOre', rate: 10 }],
    ...overrides,
  } as MercuryBuilding;
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  resources?: ResourceStore;
  buildings?: PlacedBuilding[];
  reservations?: ResourceStore;
  dysonWatts?: number;
} = {}) {
  const resourcesSignal = signal<ResourceStore>(opts.resources ?? makeResources());
  const buildingsSignal = signal<PlacedBuilding[]>(opts.buildings ?? []);
  const reservationsSignal = signal<ResourceStore>(opts.reservations ?? makeResources());
  const dysonWattsSignal = signal<number>(opts.dysonWatts ?? 0);

  return {
    mercuryResources: resourcesSignal.asReadonly(),
    mercuryBuildings: buildingsSignal.asReadonly(),
    resourceReservations: reservationsSignal.asReadonly(),
    dysonEnergyWatts: dysonWattsSignal.asReadonly(),
    setResourceReservation: vi.fn(),
  };
}

function makeDataServiceFake(buildingDef?: MercuryBuilding) {
  return {
    getMercuryBuilding: vi.fn().mockImplementation((id: string) =>
      buildingDef?.id === id ? buildingDef : undefined
    ),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResourcePowerBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcePowerBarComponent],
      providers: [
        { provide: GameStateService, useValue: makeGameStateFake() },
        { provide: DataService, useValue: makeDataServiceFake() },
      ],
    }).compileComponents();
  });

  it('should render without errors', () => {
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display resource counts from GameStateService', () => {
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({
        resources: makeResources({ commonOre: 500, rareMetals: 200, polarVolatiles: 100 }),
      }),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('500');
    expect(text).toContain('200');
    expect(text).toContain('100');
  });

  it('should compute resource rate from an operational building', () => {
    const def = makeMercuryBuildingDef();
    const buildings: PlacedBuilding[] = [makeBuilding({ status: 'operational', buildingId: def.id })];
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ buildings }),
    });
    TestBed.overrideProvider(DataService, {
      useValue: makeDataServiceFake(def),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.resourceRates()['commonOre']).toBe(10);
  });

  it('should not count rates from non-operational buildings', () => {
    const def = makeMercuryBuildingDef();
    const buildings: PlacedBuilding[] = [makeBuilding({ status: 'under_construction', buildingId: def.id })];
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ buildings }),
    });
    TestBed.overrideProvider(DataService, {
      useValue: makeDataServiceFake(def),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.resourceRates()['commonOre']).toBe(0);
  });

  it('powerBarColor should return green below 80%', () => {
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ dysonWatts: 2e12 }), // 2 TW available, 0.8 TW consumed = 40%
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.powerBarColor()).toBe('green');
  });

  it('powerBarColor should return amber at 80–99%', () => {
    // 0.8 TW consumed / 1.0 TW available = 80%
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ dysonWatts: 1e12 }),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.powerBarColor()).toBe('amber');
  });

  it('powerBarColor should return red at 100%+', () => {
    // 0.8 TW consumed / 0.5 TW available = 160% → clamped to 100
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ dysonWatts: 0.5e12 }),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.powerBarColor()).toBe('red');
  });

  it('powerBarColor should return red when dysonPowerTw is 0', () => {
    TestBed.overrideProvider(GameStateService, {
      useValue: makeGameStateFake({ dysonWatts: 0 }),
    });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.powerBarColor()).toBe('red');
  });

  it('should hide reservation inputs when showReservationInputs is false', () => {
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.resource-power-bar__reservations')).toBeNull();
  });

  it('should show reservation inputs when showReservationInputs is true', () => {
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.componentRef.setInput('showReservationInputs', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.resource-power-bar__reservations')).not.toBeNull();
    // All 3 resource inputs should be present
    const inputs = el.querySelectorAll('.resource-power-bar__reserve-input');
    expect(inputs).toHaveLength(3);
  });

  it('should call setResourceReservation on reservation input change', () => {
    const fakeState = makeGameStateFake();
    TestBed.overrideProvider(GameStateService, { useValue: fakeState });
    const fixture = TestBed.createComponent(ResourcePowerBarComponent);
    fixture.componentRef.setInput('showReservationInputs', true);
    fixture.detectChanges();

    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '.resource-power-bar__reserve-input'
    ) as HTMLInputElement;
    input.value = '500';
    input.dispatchEvent(new Event('change'));

    expect(fakeState.setResourceReservation).toHaveBeenCalledWith('commonOre', 500);
  });
});
