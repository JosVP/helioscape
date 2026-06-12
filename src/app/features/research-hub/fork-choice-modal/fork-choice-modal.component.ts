import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PendingFork } from '@app/core/models';

// NOTE: Stub — full fork-choice modal implementation is deferred to Block 7.3.
// This component must accept the PendingFork input so ResearchHubComponent compiles.
@Component({
  selector: 'app-fork-choice-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // NOTE: Stub — renders a small non-blocking toast instead of a full overlay.
  // Full fork-choice UI is implemented in Block 7.3.
  template: `
    <div class="fork-modal-stub" role="status" aria-live="polite">
      <span class="fork-modal-stub__label">🔀 Fork choice needed</span>
      <small class="fork-modal-stub__id">{{ fork().techId }} — coming in Block 7.3</small>
    </div>
  `,
  styles: [
    `
      .fork-modal-stub {
        position: absolute;
        bottom: var(--space-md, 16px);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: var(--space-sm, 8px) var(--space-md, 16px);
        background: var(--color-bg-elevated, #1e2030);
        border: 1px solid var(--color-accent-dim, #4a5568);
        border-radius: var(--radius-md, 6px);
        box-shadow: var(--shadow-panel, 0 8px 32px rgba(0,0,0,0.4));
        z-index: 202;
        white-space: nowrap;
        pointer-events: none;
      }

      .fork-modal-stub__label {
        color: var(--color-text-primary, #e2e8f0);
        font-family: var(--font-mono, monospace);
        font-size: var(--text-sm, 0.875rem);
      }

      .fork-modal-stub__id {
        color: var(--color-text-disabled, #718096);
        font-family: var(--font-mono, monospace);
        font-size: var(--text-xs, 0.75rem);
      }
    `,
  ],
})
export class ForkChoiceModalComponent {
  readonly fork = input.required<PendingFork>();
}
