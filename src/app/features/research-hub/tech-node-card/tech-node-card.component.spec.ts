import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TechNodeCardComponent } from './tech-node-card.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import type { TechNode } from '@app/core/models';
import type { NodeVisibility } from '../tech-node-view.model';

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

  function createComponent(visibility: NodeVisibility, interactive = true, isRevealRecent = false): void {
    fixture = TestBed.createComponent(TechNodeCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('node', MOCK_NODE);
    fixture.componentRef.setInput('visibility', visibility);
    fixture.componentRef.setInput('interactive', interactive);
    fixture.componentRef.setInput('isRevealRecent', isRevealRecent);
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

  it('shows display name when visibility is "locked"', () => {
    createComponent('locked');
    const name = fixture.nativeElement.querySelector('.tech-node__name');
    expect(name.textContent).toContain('Advanced Renewables Integration');
  });

  it('shows metadata for locked nodes', () => {
    createComponent('locked');
    const meta = fixture.nativeElement.querySelector('.tech-node__meta');
    expect(meta).not.toBeNull();
    expect(meta.textContent).toContain('locked');
  });

  it('shows tier and duration for available nodes', () => {
    createComponent('available');
    const meta = fixture.nativeElement.querySelector('.tech-node__meta');
    expect(meta).not.toBeNull();
    expect(meta.textContent).toContain('Tier 1');
    expect(meta.textContent).toContain('20yr');
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

  it('emits nodeSelected for locked nodes', () => {
    createComponent('locked', true);
    let emitted: string | undefined;
    component.nodeSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('.tech-node').click();
    expect(emitted).toBe('earth_advanced_renewables');
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

  it('shows reveal badge when isRevealRecent is true', () => {
    createComponent('available', true, true);
    const badge = fixture.nativeElement.querySelector('.tech-node__feedback-badge--revealed');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('New');
  });

  it('shows completion badge when isCompletionRecent is true', () => {
    createComponent('completed');
    fixture.componentRef.setInput('isCompletionRecent', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.tech-node');
    const badge = fixture.nativeElement.querySelector('.tech-node__feedback-badge--completed');
    expect(card.classList).toContain('tech-node--completion-recent');
    expect(badge.textContent).toContain('Completed');
  });

  it('does not show feedback badge when recent flags are false', () => {
    createComponent('available', true, false);
    const badge = fixture.nativeElement.querySelector('.tech-node__feedback-badge');
    expect(badge).toBeNull();
  });

  it('shows progress for running nodes', () => {
    createComponent('running');
    fixture.componentRef.setInput('progressPercent', 40);
    fixture.componentRef.setInput('etaYear', 2044);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Est. 2044');
  });

  it('shows progress for paused nodes without an ETA', () => {
    createComponent('paused');
    fixture.componentRef.setInput('progressPercent', 40);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Est.');
  });
});
