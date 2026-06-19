import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechNodeIconComponent } from './tech-node-icon.component';

describe('TechNodeIconComponent', () => {
  let fixture: ComponentFixture<TechNodeIconComponent>;

  function createComponent(visibility: 'completed' | 'hint', size: 'compact' | 'large' = 'compact'): void {
    fixture = TestBed.createComponent(TechNodeIconComponent);
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.componentRef.setInput('visibility', visibility);
    fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TechNodeIconComponent] }).compileComponents();
  });

  it('renders a silhouette marker for hint nodes', () => {
    createComponent('hint');
    expect(fixture.nativeElement.textContent).toContain('?');
  });

  it('uses the success colour for completed nodes', () => {
    createComponent('completed');
    const circle = fixture.nativeElement.querySelector('circle');
    expect(circle.getAttribute('fill')).toContain('--color-success');
  });

  it('applies the large variant class', () => {
    createComponent('completed', 'large');
    expect(fixture.nativeElement.querySelector('.tech-node-icon--large')).not.toBeNull();
  });
});
