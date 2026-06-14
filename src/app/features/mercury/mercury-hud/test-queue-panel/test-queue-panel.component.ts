import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { DataService } from '@app/core/services/data.service';
import { MercuryBuildService } from '@app/core/systems/mercury-build.service';

/**
 * ⚠ TEST ONLY — remove before release.
 * Adds orbital components directly to the build queue so the queue-bar can be tested
 * without going through the full orbital-component unlock flow.
 */
@Component({
  selector: 'app-test-queue-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="test-queue-panel">
      <div class="test-queue-panel__title">⚠ TEST — Queue debug (remove later)</div>
      <div class="test-queue-panel__btns">
        @for (c of components; track c.id) {
          <button class="test-queue-panel__btn"
                  (click)="queue(c.id)"
                  [title]="c.displayName">
            {{ c.displayName }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .test-queue-panel {
      position: absolute;
      bottom: 88px;
      left: 8px;
      background: rgba(200, 0, 0, 0.12);
      border: 1px dashed #ff4444;
      border-radius: 4px;
      padding: 6px 10px;
      z-index: 50;
      max-width: 280px;
    }
    .test-queue-panel__title {
      font-size: 10px;
      color: #ff6666;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.04em;
    }
    .test-queue-panel__btns {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .test-queue-panel__btn {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      border-radius: 3px;
      color: #ff9999;
      font-size: 10px;
      padding: 3px 7px;
      cursor: pointer;
      white-space: nowrap;
      &:hover { background: rgba(255, 68, 68, 0.25); }
    }
  `],
})
export class TestQueuePanelComponent {
  private readonly data = inject(DataService);
  private readonly mercuryBuild = inject(MercuryBuildService);

  readonly components = this.data.getAllMercuryComponents();

  queue(componentId: string): void {
    // Always target mars for test purposes
    this.mercuryBuild.queueComponent(componentId, 'mars');
  }
}
