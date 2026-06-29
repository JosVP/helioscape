import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourcePowerBarComponent } from './resource-power-bar.component';
import { DataService, type MercuryBuilding } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { ResourceStore, PlacedBuilding } from '@app/core/models';

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

function makeGameStateFake(opts: {
  resources?: ResourceStore;
  buildings?: PlacedBuilding[];
  reservations?: ResourceStore;
  dysonWatts?: number;
} = {}) {
  return {
    mercuryResources: signal<ResourceStore>(opts.resources ?? makeResources()).asReadonly(),
    mercuryBuildings: signal<PlacedBuilding[]>(opts.buildings ?? []).asReadonly(),
    resourceReservations: signal<ResourceStore>(opts.reservations ?? makeResources()).asReadonly(),
    dysonEnergyWatts: signal<number>(opts.dysonWatts ?? 0).asReadonly(),
    setResourceReservation: vi.fn(),
  };
}

function makeDataServiceFake(buildingDef?: MercuryBuilding) {
  return {
    getMercuryBuilding: vi.fn((id: string) => (buildingDef?.id === id ? buildingDef : undefined)),
  };
}

describe('ResourcePowerBarComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  function setup(
    gameState = makeGameStateFake(),
    dataService = makeDataServiceFake()
  ): { component: ResourcePowerBarComponent; gameState: ReturnType<typeof makeGameStateFake> } {
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameState },
        { provide: DataService, useValue: dataService },
      ],
    });
    return {
      component: TestBed.runInInjectionContext(() => new ResourcePowerBarComponent()),
      gameState,
    };
  }

  it('reads resource counts from GameStateService', () => {
    const { component } = setup(
      makeGameStateFake({
        resources: makeResources({ commonOre: 500, rareMetals: 200, polarVolatiles: 100 }),
      })
    );

    expect(component.resources()).toEqual({ commonOre: 500, rareMetals: 200, polarVolatiles: 100 });
  });

  it('computes resource rates from operational Mercury buildings only', () => {
    const def = makeMercuryBuildingDef();
    const { component } = setup(
      makeGameStateFake({ buildings: [makeBuilding(), makeBuilding({ id: 'b2', status: 'building' })] }),
      makeDataServiceFake(def)
    );

    expect(component.resourceRates()['commonOre']).toBe(10);
  });

  it('computes power color thresholds', () => {
    expect(setup(makeGameStateFake({ dysonWatts: 2e12 })).component.powerBarColor()).toBe('green');
    TestBed.resetTestingModule();
    expect(setup(makeGameStateFake({ dysonWatts: 1e12 })).component.powerBarColor()).toBe('amber');
    TestBed.resetTestingModule();
    expect(setup(makeGameStateFake({ dysonWatts: 0.5e12 })).component.powerBarColor()).toBe('red');
    TestBed.resetTestingModule();
    expect(setup(makeGameStateFake({ dysonWatts: 0 })).component.powerBarColor()).toBe('red');
  });

  it('updates resource reservation from input changes', () => {
    const { component, gameState } = setup();
    const input = document.createElement('input');
    input.value = '500';

    component.onReservationChange('commonOre', { target: input } as unknown as Event);

    expect(gameState.setResourceReservation).toHaveBeenCalledWith('commonOre', 500);
  });
});