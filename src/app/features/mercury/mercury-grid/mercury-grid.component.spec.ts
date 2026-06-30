import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MercuryGridComponent } from './mercury-grid.component';
import type { PlacedBuilding } from '@app/core/models';
import type { MercuryBuilding } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { MercuryBuildService } from '@app/core/systems/mercury-build.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlacedBuilding(overrides: Partial<PlacedBuilding> = {}): PlacedBuilding {
  return {
    id: 'pb-1',
    buildingId: 'mining_outpost',
    col: 3,
    row: 3,
    status: 'operational',
    buildProgressYears: 2,
    totalBuildYears: 2,
    ...overrides,
  };
}

function makeMercuryBuilding(overrides: Partial<MercuryBuilding> = {}): MercuryBuilding {
  return {
    id: 'mining_outpost',
    displayName: 'Mining Outpost',
    description: 'Test building',
    category: 'buildings',
    cost: { commonOre: 0, rareMetals: 10, polarVolatiles: 0 },
    energyDrawGw: 2,
    buildTimeYears: 3,
    repeatable: true,
    maxInstances: null,
    unlockCondition: null,
    placementRule: 'flat',
    allowedSlotType: 'any',
    footprint: [[0,0],[1,0],[0,1],[1,1]],
    effects: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Canvas mock — jsdom does not implement getContext('2d')
// ---------------------------------------------------------------------------

function mockCanvasContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(buildings: PlacedBuilding[] = []) {
  const buildingsSig = signal<PlacedBuilding[]>(buildings);
  const interactionLockedSig = signal(false);
  const placeMock = vi.fn((b: PlacedBuilding) =>
    buildingsSig.update((prev) => [...prev, b]),
  );
  return {
    mercuryBuildings: buildingsSig.asReadonly(),
    interactionLocked: interactionLockedSig.asReadonly(),
    placeMercuryBuilding: placeMock,
    _set: (v: PlacedBuilding[]) => buildingsSig.set(v),
    _setInteractionLocked: (value: boolean) => interactionLockedSig.set(value),
    _placeMock: placeMock,
  };
}

function makeDataFake(building: MercuryBuilding | undefined = makeMercuryBuilding()) {
  return {
    getMercuryBuilding: vi.fn(() => building),
    getMercuryMapData: vi.fn(() => null),
    getMercurySlot: vi.fn(() => undefined),
    getMercuryMiningLocation: vi.fn(() => undefined),
  };
}

function makeEventBusFake() {
  return {
    mercuryBuildCompleted$: new Subject<string>(),
  };
}

function makeMercuryBuildFake() {
  // MercuryBuildService is injected to ensure it's initialised but never directly called
  // from MercuryGridComponent. Return a minimal fake.
  return {};
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

interface TestEnv {
  fixture: ReturnType<typeof TestBed.createComponent<MercuryGridComponent>>;
  component: MercuryGridComponent;
  gameStateFake: ReturnType<typeof makeGameStateFake>;
  dataFake: ReturnType<typeof makeDataFake>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

function setup(buildings: PlacedBuilding[] = []): TestEnv {
  const gameStateFake = makeGameStateFake(buildings);
  const dataFake = makeDataFake();
  const ctx = mockCanvasContext();
  class MockResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  vi.stubGlobal('ResizeObserver', MockResizeObserver);

  TestBed.configureTestingModule({
    imports: [MercuryGridComponent],
    providers: [
      { provide: GameStateService, useValue: gameStateFake },
      { provide: DataService, useValue: dataFake },
      { provide: EventBusService, useValue: makeEventBusFake() },
      { provide: MercuryBuildService, useValue: makeMercuryBuildFake() },
    ],
  });

  const fixture = TestBed.createComponent(MercuryGridComponent);
  const component = fixture.componentInstance;

  // Patch the canvas element so getContext returns our mock
  const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
  vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as never);

  // Prevent real RAF from running in tests
  vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

  fixture.detectChanges(); // triggers ngAfterViewInit

  return { fixture, component, gameStateFake, dataFake, canvas, ctx };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MercuryGridComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('renders a canvas element', () => {
    const { canvas } = setup();
    expect(canvas).not.toBeNull();
  });

  it('starts the RAF loop on ngAfterViewInit', () => {
    setup();
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels RAF on ngOnDestroy', () => {
    const { component } = setup();
    component.ngOnDestroy();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('removes mouse listeners on ngOnDestroy', () => {
    const { component, canvas } = setup();
    const removeSpy = vi.spyOn(canvas, 'removeEventListener');
    component.ngOnDestroy();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('emits tileClicked with hasBuilding: true when clicking an occupied tile', () => {
    const placedBuilding = makePlacedBuilding({ col: 42, row: 32 });
    const { component, canvas } = setup([placedBuilding]);

    const emitted: Array<{ col: number; row: number; hasBuilding: boolean; terrain: string; slotId: string | null }> = [];
    component.tileClicked.subscribe((e) => emitted.push(e));

    // Initial camera pan starts at VIEW_TOP_Y, so click a visible inner-zone tile.
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'offsetX', { value: 320 });
    Object.defineProperty(clickEvent, 'offsetY', { value: 16 });
    canvas.dispatchEvent(clickEvent);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].hasBuilding).toBe(true);
    expect(emitted[0].col).toBe(42);
    expect(emitted[0].row).toBe(32);
  });

  it('calls placeMercuryBuilding when clicking an empty tile with selectedBuildingId set', () => {
    const { fixture, gameStateFake } = setup([]);
    fixture.componentRef.setInput('selectedBuildingId', 'mining_outpost');
    fixture.detectChanges();

    const emitted: Array<{ col: number; row: number; hasBuilding: boolean; terrain: string; slotId: string | null }> = [];
    fixture.componentInstance.tileClicked.subscribe((e) => emitted.push(e));

    // Click on an empty visible flat tile (col=44, row=34).
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const canvas2 = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    Object.defineProperty(clickEvent, 'offsetX', { value: 320 });
    Object.defineProperty(clickEvent, 'offsetY', { value: 80 });
    canvas2.dispatchEvent(clickEvent);

    expect(gameStateFake._placeMock).toHaveBeenCalled();
    const placed: PlacedBuilding = gameStateFake._placeMock.mock.calls[0][0] as PlacedBuilding;
    expect(placed.buildingId).toBe('mining_outpost');
    expect(placed.status).toBe('building');
    expect(placed.buildProgressYears).toBe(0);
  });

  it('does not place buildings while interactions are locked', () => {
    const { fixture, gameStateFake } = setup([]);
    gameStateFake._setInteractionLocked(true);
    fixture.componentRef.setInput('selectedBuildingId', 'mining_outpost');
    fixture.detectChanges();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    Object.defineProperty(clickEvent, 'offsetX', { value: 320 });
    Object.defineProperty(clickEvent, 'offsetY', { value: 80 });
    canvas.dispatchEvent(clickEvent);

    expect(gameStateFake._placeMock).not.toHaveBeenCalled();
  });

  it('does not call placeMercuryBuilding when clicking out of grid bounds', () => {
    const { canvas, gameStateFake } = setup([]);

    // Click way outside the grid (negative screen coords map outside any valid tile)
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'offsetX', { value: 0 });
    Object.defineProperty(clickEvent, 'offsetY', { value: 0 });
    canvas.dispatchEvent(clickEvent);

    expect(gameStateFake._placeMock).not.toHaveBeenCalled();
  });

  it('renders an accessible canvas surface', () => {
    const { canvas } = setup();
    expect(canvas.getAttribute('role')).toBe('application');
    expect(canvas.getAttribute('tabindex')).toBe('0');
  });
});
