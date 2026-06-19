import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechNodeIconComponent } from './tech-node-icon.component';

describe('TechNodeIconComponent', () => {
  let fixture: ComponentFixture<TechNodeIconComponent>;

  function createComponent(
    visibility: 'completed' | 'hint',
    size: 'compact' | 'large' = 'compact',
    paths: { readonly iconPath?: string; readonly silhouetteIconPath?: string } = {},
  ): void {
    fixture = TestBed.createComponent(TechNodeIconComponent);
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.componentRef.setInput('visibility', visibility);
    fixture.componentRef.setInput('size', size);
    fixture.componentRef.setInput('iconPath', paths.iconPath);
    fixture.componentRef.setInput('silhouetteIconPath', paths.silhouetteIconPath);
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

  it('uses the silhouette asset for hint nodes when provided', () => {
    createComponent('hint', 'compact', { silhouetteIconPath: '/assets/svg/tech-tree/node--silhouette.svg' });
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(image?.getAttribute('src')).toBe('/assets/svg/tech-tree/node--silhouette.svg');
    expect(fixture.nativeElement.textContent).not.toContain('?');
  });

  it('uses the normal asset for non-hint nodes when provided', () => {
    createComponent('completed', 'compact', { iconPath: '/assets/svg/tech-tree/node.svg' });
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(image?.getAttribute('src')).toBe('/assets/svg/tech-tree/node.svg');
  });

  it('applies the large variant class', () => {
    createComponent('completed', 'large');
    expect(fixture.nativeElement.querySelector('.tech-node-icon--large')).not.toBeNull();
  });
});
