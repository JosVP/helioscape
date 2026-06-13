import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ResearchTrackVM } from './research.component';

@Component({
  selector: 'app-research-track-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './research-track-item.component.html',
  styleUrl: './research-track-item.component.scss',
})
export class ResearchTrackItemComponent {
  readonly vm = input.required<ResearchTrackVM>();
  readonly pause  = output<string>();
  readonly resume = output<string>();
  readonly start  = output<string>();
}
