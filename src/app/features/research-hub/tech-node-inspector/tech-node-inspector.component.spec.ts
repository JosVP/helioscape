import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { TechNode } from '@app/core/models';
import { TechNodeInspectorComponent } from './tech-node-inspector.component';
import type { TechInspectorViewModel } from './tech-node-inspector.model';

const NODE: TechNode = {
  id: 'earth_advanced_renewables',
  planet: 'earth',
  displayName: 'Advanced Renewables Integration',
  description: 'We integrate advanced renewables.',
  outcomeSummary: ['Enables later Earth research.'],
  prerequisites: [],
  spilloverPrerequisites: [],
  rpCost: 30,
  durationYears: 20,
  effects: [],
};

function makeViewModel(overrides: Partial<TechInspectorViewModel> = {}): TechInspectorViewModel {
  return {
    node: NODE,
    visibility: 'available',
    planetLabel: 'Earth',
    statusLabel: 'Available',
    branchTag: null,
    prerequisites: [],
    canStart: true,
    ...overrides,
  };
}

describe('TechNodeInspectorComponent', () => {
  let fixture: ComponentFixture<TechNodeInspectorComponent>;
  let component: TechNodeInspectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TechNodeInspectorComponent] }).compileComponents();
    fixture = TestBed.createComponent(TechNodeInspectorComponent);
    component = fixture.componentInstance;
  });

  function setViewModel(viewModel: TechInspectorViewModel | null): void {
    fixture.componentRef.setInput('viewModel', viewModel);
    fixture.detectChanges();
  }

  it('renders completed year and no Start button for completed nodes', () => {
    setViewModel(makeViewModel({ visibility: 'completed', statusLabel: 'Completed', completedYear: 2044, canStart: false }));

    expect(fixture.nativeElement.textContent).toContain('Completed in');
    expect(fixture.nativeElement.textContent).toContain('Year 2044');
    expect(fixture.nativeElement.textContent).toContain('Enables later Earth research.');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('renders progress and ETA for in-progress nodes', () => {
    setViewModel(
      makeViewModel({
        visibility: 'running',
        statusLabel: 'In progress',
        progressPercent: 50,
        etaYear: 2043,
        canStart: false,
      }),
    );

    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Year 2043');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('renders capacity warning and no Start button for needs-capacity nodes', () => {
    setViewModel(
      makeViewModel({
        visibility: 'available',
        startBlockedReason: 'All visible research slots are currently occupied.',
        canStart: false,
      }),
    );

    expect(fixture.nativeElement.textContent).toContain('All visible research slots are currently occupied.');
    expect(fixture.nativeElement.querySelector('.tech-inspector__start')).toBeNull();
  });

  it('emits startRequested for available nodes', () => {
    setViewModel(makeViewModel());
    let emitted: string | undefined;
    component.startRequested.subscribe((nodeId) => (emitted = nodeId));

    fixture.nativeElement.querySelector('.tech-inspector__start').click();

    expect(emitted).toBe('earth_advanced_renewables');
  });

  it('renders locked nodes with prerequisite context', () => {
    setViewModel(
      makeViewModel({
        node: { ...NODE, unlockCondition: 'Complete a visible prerequisite first.' },
        visibility: 'locked',
        statusLabel: 'Locked',
        canStart: false,
        prerequisites: [{ id: 'x', label: 'A visible clue', met: false, isSpillover: false }],
      }),
    );

    expect(fixture.nativeElement.textContent).toContain('Complete a visible prerequisite first.');
    expect(fixture.nativeElement.textContent).toContain('A visible clue');
    expect(fixture.nativeElement.textContent).toContain(NODE.description);
    expect(fixture.nativeElement.textContent).toContain(NODE.outcomeSummary[0]);
  });
});
