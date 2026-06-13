import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ForkChoiceModalComponent } from './fork-choice-modal.component';
import { DataService } from '@app/core/services/data.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import type { PendingFork, TechNode } from '@app/core/models';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FORK_TECH_NODE: TechNode = {
  id: 'earth_automated_food_systems',
  planet: 'earth',
  displayName: 'Automated Food Systems',
  prerequisites: ['earth_advanced_renewables'],
  prerequisiteMode: 'any',
  spilloverPrerequisites: [],
  rpCost: 35,
  durationYears: 25,
  tier: 2,
  effects: [
    {
      type: 'present_fork',
      forkId: 'food_systems_fork',
      choices: [
        {
          id: 'rewild_freed_land',
          label: 'Rewild the freed land',
          tag: 'naturalist',
          effects: [
            { type: 'emit_event', eventId: 'ce_food_fork_naturalist' },
            { type: 'tag_decision', tag: 'naturalist' },
          ],
        },
        {
          id: 'develop_freed_land',
          label: 'Develop the freed land',
          tag: 'architect',
          effects: [
            { type: 'emit_event', eventId: 'ce_food_fork_architect' },
            { type: 'tag_decision', tag: 'architect' },
            { type: 'rp_capacity_boost', amount: 10 },
          ],
        },
      ],
    },
  ],
};

const PENDING_FORK: PendingFork = {
  techId: 'earth_automated_food_systems',
  planetId: 'earth',
  forkId: 'food_systems_fork',
};

// ---------------------------------------------------------------------------
// Host wrapper — required to supply input.required<>
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [ForkChoiceModalComponent],
  template: '<app-fork-choice-modal [fork]="fork" />',
})
class TestHostComponent {
  fork: PendingFork = PENDING_FORK;
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('ForkChoiceModalComponent', () => {
  const mockTechTreeService = { completeForkChoice: vi.fn() };

  // -------------------------------------------------------------------------
  // Happy-path tests — tech node resolves correctly
  // -------------------------------------------------------------------------

  describe('when tech node resolves', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: TechTreeService, useValue: mockTechTreeService },
          {
            provide: DataService,
            useValue: {
              getTechNode: (id: string) =>
                id === FORK_TECH_NODE.id ? FORK_TECH_NODE : undefined,
            },
          },
        ],
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders the tech display name', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const title = el.querySelector('.fork-choice-modal__tech-name');
      expect(title?.textContent).toContain('Automated Food Systems');
    });

    it('renders two choice buttons', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const choices = el.querySelectorAll('.fork-choice-modal__choice');
      expect(choices).toHaveLength(2);
    });

    it('renders the correct labels on each choice', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const labels = Array.from(el.querySelectorAll('.fork-choice-modal__choice-label')).map(
        (n) => n.textContent?.trim(),
      );
      expect(labels).toContain('Rewild the freed land');
      expect(labels).toContain('Develop the freed land');
    });

    it('renders a naturalist tag chip for the first choice', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const tags = el.querySelectorAll('.fork-choice-modal__tag--naturalist');
      expect(tags.length).toBeGreaterThan(0);
      expect(tags[0].textContent).toContain('Naturalist');
    });

    it('renders an architect tag chip for the second choice', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const tags = el.querySelectorAll('.fork-choice-modal__tag--architect');
      expect(tags.length).toBeGreaterThan(0);
      expect(tags[0].textContent).toContain('Architect');
    });

    it('shows RP capacity boost in the effect summary for the architect choice', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const effectItems = Array.from(el.querySelectorAll('.fork-choice-modal__effect')).map(
        (n) => n.textContent ?? '',
      );
      expect(effectItems.some((t) => t.includes('+10 RP capacity'))).toBe(true);
    });

    it('does not surface tag_decision or emit_event in the effect summary', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const effectItems = Array.from(el.querySelectorAll('.fork-choice-modal__effect')).map(
        (n) => n.textContent ?? '',
      );
      expect(effectItems.every((t) => !t.includes('alignment') && !t.includes('event'))).toBe(
        true,
      );
    });

    it('has no cancel button', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const cancelBtn = buttons.find(
        (b) =>
          b.textContent?.toLowerCase().includes('cancel') || b.textContent?.includes('✕'),
      );
      expect(cancelBtn).toBeUndefined();
    });

    it('renders the dialog with aria-modal="true"', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const overlay = el.querySelector('[role="dialog"]');
      expect(overlay?.getAttribute('aria-modal')).toBe('true');
    });

    it('calls completeForkChoice with correct args when the naturalist choice is clicked', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const firstChoice = el.querySelector<HTMLButtonElement>('.fork-choice-modal__choice');
      firstChoice?.click();
      expect(mockTechTreeService.completeForkChoice).toHaveBeenCalledWith(
        'earth',
        'earth_automated_food_systems',
        'rewild_freed_land',
      );
    });

    it('calls completeForkChoice with correct args when the architect choice is clicked', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const choices = el.querySelectorAll<HTMLButtonElement>('.fork-choice-modal__choice');
      choices[1]?.click();
      expect(mockTechTreeService.completeForkChoice).toHaveBeenCalledWith(
        'earth',
        'earth_automated_food_systems',
        'develop_freed_land',
      );
    });
  });

  // -------------------------------------------------------------------------
  // Graceful fallback — tech node is unknown/missing
  // -------------------------------------------------------------------------

  describe('when tech node is not found', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: TechTreeService, useValue: mockTechTreeService },
          {
            provide: DataService,
            useValue: { getTechNode: (_id: string) => undefined },
          },
        ],
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      host = hostFixture.componentInstance;
      // Use an unknown techId from the start
      host.fork = { ...PENDING_FORK, techId: 'unknown_tech_id' };
      hostFixture.detectChanges();
    });

    it('falls back to techId as display name', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const title = el.querySelector('.fork-choice-modal__tech-name');
      expect(title?.textContent).toContain('unknown_tech_id');
    });

    it('renders zero choice buttons', () => {
      const el: HTMLElement = hostFixture.nativeElement;
      const choices = el.querySelectorAll('.fork-choice-modal__choice');
      expect(choices).toHaveLength(0);
    });
  });
});

