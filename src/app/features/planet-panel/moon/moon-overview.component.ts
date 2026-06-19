import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { MoonData } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';

@Component({
  selector: 'app-moon-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './moon-overview.component.html',
  styleUrl: './moon-overview.component.scss',
})
export class MoonOverviewComponent {
  private readonly data = inject(DataService);

  readonly moon: MoonData = this.data.getMoonData();
}
