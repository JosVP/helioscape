import { Injectable } from '@angular/core';

/**
 * AudioService — manages the Web Audio API context and sound playback.
 *
 * IMPORTANT: AudioContext is created lazily in initialise() — never in the constructor.
 * Browsers and Tauri's webview block audio until the first user interaction.
 * GameShellComponent calls initialise() on the first click or keydown event.
 *
 * Full play/stop/volume API is deferred to the audio system block.
 * See docs/agents/TODO.md for pending TODOs.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioContext: AudioContext | null = null;

  /**
   * Resume or create the AudioContext.
   * Must be called inside a user interaction handler (click, keydown).
   * Safe to call multiple times — no-op after the first initialisation.
   */
  initialise(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    } else if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
  }
}
