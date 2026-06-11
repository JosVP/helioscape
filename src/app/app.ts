import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { fromEvent } from 'rxjs';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<div class="game-root"><router-outlet /></div>`,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      overflow: hidden;
      background: #000;
    }
    .game-root {
      width: var(--logical-w, 1920px);
      height: var(--logical-h, 1080px);
      transform: scale(var(--root-scale, 1));
      transform-origin: top left;
      overflow: hidden;
    }
  `],
})
export class AppComponent implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Re-compute scale whenever the player changes render resolution
    effect(() => {
      this.settings.renderResolution(); // track signal
      this.computeScale();
    });
  }

  ngOnInit(): void {
    this.computeScale();
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.computeScale());
  }

  private computeScale(): void {
    const res = this.settings.renderResolution();
    const [lw, lh] = res.split('x').map(Number);
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    // Uniform scale: fit logical rect inside screen, maintaining aspect ratio
    const scale = Math.min(sw / lw, sh / lh);
    const root = document.documentElement;
    root.style.setProperty('--root-scale', scale.toFixed(4));
    // Center the scaled viewport (offset = half remaining space / scale)
    const offsetX = Math.max(0, (sw - lw * scale) / 2);
    const offsetY = Math.max(0, (sh - lh * scale) / 2);
    const gameRoot = document.querySelector<HTMLElement>('.game-root');
    if (gameRoot) {
      gameRoot.style.left = `${offsetX}px`;
      gameRoot.style.top = `${offsetY}px`;
      gameRoot.style.position = 'absolute';
    }
  }
}
