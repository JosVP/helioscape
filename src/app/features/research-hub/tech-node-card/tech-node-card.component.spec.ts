import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TechNodeCardComponent } from './tech-node-card.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import type { TechNode } from '@app/core/models';

const MOCK_NODE: TechNode = {
  id: 'earth_advanced_renewables',
  planet: 'earth',
  displayName: 'Advanced Renewables Integration',
  description: 'We integrate advanced renewables.',
  outcomeSummary: ['Enables later Earth research.'],
  prerequisites: ['earth_launch_mercury_mission'],
  spilloverPrerequisites: [],
  rpCost: 30,
  durationYears: 20,
  effects: [],
};

describe('TechNodeCardComponent', () => {
  let fixture: ComponentFixture<TechNodeCardComponent>;
  let component: TechNodeCardComponent;

  const mockCompletedTechs = signal<string[]>([]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechNodeCardComponent],
      providers: [
        {
          provide: GameStateService,
          useValue: {
            completedTechs: mockCompletedTechs.asReadonly(),
          },
        },
        {
          provide: DataService,
          useValue: {
            getTechNode: (id: string) =>
              id === 'earth_launch_mercury_mission'
                ? { id, displayName: 'Launch Mercury Mission', planet: 'earth' }
                : undefined,
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(
    visibility: 'completed' | 'available' | 'hint',
    interactive = true,
    isNew = false,
  ): void {
    fixture = TestBed.createComponent(TechNodeCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('node', MOCK_NODE);
    fixture.componentRef.setInput('visibility', visibility);
    fixture.componentRef.setInput('interactive', interactive);
    fixture.componentRef.setInput('isNew', isNew);
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();
  }

  it('shows display name when visibility is "completed"', () => {
    createComponent('completed');
    const name = fixture.nativeElement.querySelector('.tech-node__name');
    expect(name.textContent).toContain('Advanced Renewables Integration');
  });

  it('shows display name when visibility is "available"', () => {
    createComponent('available');
    const name = fixture.nativeElement.querySelector('.tech-node__name');
    expect(name.textContent).toContain('Advanced Renewables Integration');
  });

  it('shows ??? when visibility is "hint"', () => {
    createComponent('hint');
    const name = fixture.nativeElement.querySelector('.tech-node__name');
    expect(name.textContent).toContain('???');
  });

  it('does not show RP cost for hint nodes', () => {
    createComponent('hint');
    const meta = fixture.nativeElement.querySelector('.tech-node__meta');
    expect(meta).toBeNull();
  });

  it('shows RP cost and duration for available nodes', () => {
    createComponent('available');
    const meta = fixture.nativeElement.querySelector('.tech-node__meta');
    expect(meta).not.toBeNull();
    expect(meta.textContent).toContain('30 RP');
  });

  it('emits nodeClicked when interactive available node is clicked', () => {
    createComponent('available', true);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('.tech-node').click();
    expect(emitted).toBe('earth_advanced_renewables');
  });

  it('does not emit nodeClicked when interactive is false', () => {
    createComponent('available', false);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('.tech-node').click();
    expect(emitted).toBeUndefined();
  });

  it('emits nodeSelected when visibility is completed', () => {
    createComponent('completed', true);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('.tech-node').click();
    expect(emitted).toBe('earth_advanced_renewables');
  });

  it('emits nodeSelected for hint nodes without revealing details', () => {
    createComponent('hint', true);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('.tech-node').click();
    expect(emitted).toBe('earth_advanced_renewables');
    expect(fixture.nativeElement.querySelector('.tech-node__meta')).toBeNull();
  });

  it('emits nodeSelected on keyboard activation', () => {
    createComponent('available', true);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));

    fixture.nativeElement
      .querySelector('.tech-node')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(emitted).toBe('earth_advanced_renewables');
  });

  it('applies selected state and aria-current', () => {
    createComponent('available', true);
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.tech-node');
    expect(card.classList).toContain('tech-node--selected');
    expect(card.getAttribute('aria-current')).toBe('true');
  });

  it('shows new badge when isNew is true', () => {
    createComponent('available', true, true);
    const badge = fixture.nativeElement.querySelector('.tech-node__new-badge');
    expect(badge).not.toBeNull();
  });

  it('does not show new badge when isNew is false', () => {
    createComponent('available', true, false);
    const badge = fixture.nativeElement.querySelector('.tech-node__new-badge');
    expect(badge).toBeNull();
  });

  it('shows prerequisite in tooltip', () => {
    mockCompletedTechs.set([]);
    createComponent('available');
    const tooltip = fixture.nativeElement.querySelector('.tech-node__tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip.textContent).toContain('Launch Mercury Mission');
  });

  it('marks met prerequisites in green', () => {
    mockCompletedTechs.set(['earth_launch_mercury_mission']);
    createComponent('available');
    const metPrereq = fixture.nativeElement.querySelector('.tech-node__tooltip-prereq--met');
    expect(metPrereq).not.toBeNull();
  });
});
