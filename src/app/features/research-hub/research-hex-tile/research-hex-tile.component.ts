import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ResearchNodeEntry } from '../research-hub-view.model';

@Component({
	selector: 'app-research-hex-tile',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './research-hex-tile.component.html',
	styleUrl: './research-hex-tile.component.scss',
})
export class ResearchHexTileComponent {
	readonly entry = input.required<ResearchNodeEntry>();
	readonly selected = input<boolean>(false);
	readonly isCompletionRecent = input<boolean>(false);
	readonly isRevealRecent = input<boolean>(false);

	readonly nodeSelected = output<string>();

	readonly statusLabel = computed(() => {
		switch (this.entry().visibility) {
			case 'available':
				return 'Available';
			case 'completed':
				return 'Complete';
			case 'locked':
				return 'Locked';
			case 'running':
				return 'Running';
			case 'paused':
				return 'Paused';
			case 'post_v1':
				return 'Future';
		}
	});

	readonly ariaLabel = computed(() => {
		const entry = this.entry();
		return `${entry.node.displayName}, ${this.statusLabel()}, ${entry.node.planet}`;
	});

	onSelect(): void {
		this.nodeSelected.emit(this.entry().node.id);
	}
}
