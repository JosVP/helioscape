import { Injectable, signal, type Signal } from '@angular/core';

/**
 * Player settings shape — persists across all sessions, separate from game saves.
 * Stored in localStorage (key: 'helioscape_settings') with future Tauri file storage.
 */
export type RenderResolution = '1280x720' | '1920x1080' | '2560x1440';

export interface SettingsValues {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
  vsync: boolean;
  renderResolution: RenderResolution;
  textSizeMultiplier: number;
  colorblindMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  autosaveIntervalYears: number;
  confirmIrreversible: boolean;
}

/**
 * Manages all player settings — load, persist, and apply.
 * Settings are stored separately from game saves and persist across all sessions.
 *
 * Storage:
 * - Browser/dev: localStorage key 'helioscape_settings'
 * - Tauri (desktop): TODO — @tauri-apps/plugin-fs write to settings file
 *
 * Responsibility:
 * - Load settings on startup
 * - Persist on every change
 * - Apply UI-affecting settings immediately (renderResolution, motion, colorblind, contrast)
 * - Volume settings: applied by AudioService (not yet implemented)
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly STORAGE_KEY = 'helioscape_settings';
  private readonly isTauri = '__TAURI__' in window;

  // Default settings
  private readonly defaults: SettingsValues = {
    masterVolume: 0.8,
    musicVolume: 0.8,
    sfxVolume: 0.8,
    fullscreen: false,
    vsync: true,
    renderResolution: '1920x1080',
    textSizeMultiplier: 1.0,
    colorblindMode: false,
    reducedMotion: false,
    highContrast: false,
    autosaveIntervalYears: 10,
    confirmIrreversible: true,
  };

  // Private writable signals
  private readonly _masterVolume = signal<number>(this.defaults.masterVolume);
  private readonly _musicVolume = signal<number>(this.defaults.musicVolume);
  private readonly _sfxVolume = signal<number>(this.defaults.sfxVolume);
  private readonly _fullscreen = signal<boolean>(this.defaults.fullscreen);
  private readonly _vsync = signal<boolean>(this.defaults.vsync);
  private readonly _renderResolution = signal<RenderResolution>(this.defaults.renderResolution);
  private readonly _textSizeMultiplier = signal<number>(this.defaults.textSizeMultiplier);
  private readonly _colorblindMode = signal<boolean>(this.defaults.colorblindMode);
  private readonly _reducedMotion = signal<boolean>(this.defaults.reducedMotion);
  private readonly _highContrast = signal<boolean>(this.defaults.highContrast);
  private readonly _autosaveIntervalYears = signal<number>(this.defaults.autosaveIntervalYears);
  private readonly _confirmIrreversible = signal<boolean>(this.defaults.confirmIrreversible);

  // Public readonly signals
  readonly masterVolume: Signal<number> = this._masterVolume.asReadonly();
  readonly musicVolume: Signal<number> = this._musicVolume.asReadonly();
  readonly sfxVolume: Signal<number> = this._sfxVolume.asReadonly();
  readonly fullscreen: Signal<boolean> = this._fullscreen.asReadonly();
  readonly vsync: Signal<boolean> = this._vsync.asReadonly();
  readonly renderResolution: Signal<RenderResolution> = this._renderResolution.asReadonly();
  readonly textSizeMultiplier: Signal<number> = this._textSizeMultiplier.asReadonly();
  readonly colorblindMode: Signal<boolean> = this._colorblindMode.asReadonly();
  readonly reducedMotion: Signal<boolean> = this._reducedMotion.asReadonly();
  readonly highContrast: Signal<boolean> = this._highContrast.asReadonly();
  readonly autosaveIntervalYears: Signal<number> = this._autosaveIntervalYears.asReadonly();
  readonly confirmIrreversible: Signal<boolean> = this._confirmIrreversible.asReadonly();

  constructor() {
    this.loadSettings();
  }

  /**
   * Get a single setting value by key.
   */
  get<K extends keyof SettingsValues>(key: K): SettingsValues[K] {
    switch (key) {
      case 'masterVolume':
        return this._masterVolume() as SettingsValues[K];
      case 'musicVolume':
        return this._musicVolume() as SettingsValues[K];
      case 'sfxVolume':
        return this._sfxVolume() as SettingsValues[K];
      case 'fullscreen':
        return this._fullscreen() as SettingsValues[K];
      case 'vsync':
        return this._vsync() as SettingsValues[K];
      case 'renderResolution':
        return this._renderResolution() as SettingsValues[K];
      case 'textSizeMultiplier':
        return this._textSizeMultiplier() as SettingsValues[K];
      case 'colorblindMode':
        return this._colorblindMode() as SettingsValues[K];
      case 'reducedMotion':
        return this._reducedMotion() as SettingsValues[K];
      case 'highContrast':
        return this._highContrast() as SettingsValues[K];
      case 'autosaveIntervalYears':
        return this._autosaveIntervalYears() as SettingsValues[K];
      case 'confirmIrreversible':
        return this._confirmIrreversible() as SettingsValues[K];
    }
  }

  /**
   * Set a single setting value by key.
   * Applies the setting immediately AND persists to storage.
   */
  set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]): void {
    switch (key) {
      case 'masterVolume':
        this._masterVolume.set(value as number);
        break;
      case 'musicVolume':
        this._musicVolume.set(value as number);
        break;
      case 'sfxVolume':
        this._sfxVolume.set(value as number);
        break;
      case 'fullscreen':
        this._fullscreen.set(value as boolean);
        // NOTE: Fullscreen stored for future Tauri window API wiring
        break;
      case 'vsync':
        this._vsync.set(value as boolean);
        // NOTE: VSync stored for future Tauri wiring
        break;
      case 'renderResolution':
        this._renderResolution.set(value as RenderResolution);
        this.applyRenderResolution(value as RenderResolution);
        break;
      case 'textSizeMultiplier':
        this._textSizeMultiplier.set(value as number);
        break;
      case 'colorblindMode':
        this._colorblindMode.set(value as boolean);
        this.applyColorblind(value as boolean);
        break;
      case 'reducedMotion':
        this._reducedMotion.set(value as boolean);
        this.applyReducedMotion(value as boolean);
        break;
      case 'highContrast':
        this._highContrast.set(value as boolean);
        this.applyHighContrast(value as boolean);
        break;
      case 'autosaveIntervalYears':
        this._autosaveIntervalYears.set(value as number);
        // NOTE: Autosave interval read by SaveService
        break;
      case 'confirmIrreversible':
        this._confirmIrreversible.set(value as boolean);
        break;
    }

    this.persistSettings();
  }

  /**
   * Reset all settings to defaults and persist.
   */
  resetToDefaults(): void {
    this._masterVolume.set(this.defaults.masterVolume);
    this._musicVolume.set(this.defaults.musicVolume);
    this._sfxVolume.set(this.defaults.sfxVolume);
    this._fullscreen.set(this.defaults.fullscreen);
    this._vsync.set(this.defaults.vsync);
    this._renderResolution.set(this.defaults.renderResolution);
    this._textSizeMultiplier.set(this.defaults.textSizeMultiplier);
    this._colorblindMode.set(this.defaults.colorblindMode);
    this._reducedMotion.set(this.defaults.reducedMotion);
    this._highContrast.set(this.defaults.highContrast);
    this._autosaveIntervalYears.set(this.defaults.autosaveIntervalYears);
    this._confirmIrreversible.set(this.defaults.confirmIrreversible);

    // Apply all UI-affecting settings
    this.applyRenderResolution(this.defaults.renderResolution);
    this.applyReducedMotion(this.defaults.reducedMotion);
    this.applyColorblind(this.defaults.colorblindMode);
    this.applyHighContrast(this.defaults.highContrast);

    this.persistSettings();
  }

  /**
   * Load settings from storage (localStorage + TODO: Tauri file).
   * Called in constructor.
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        // No stored settings — apply defaults
        this.applyLoadedSettings(this.defaults);
        return;
      }

      const parsed = JSON.parse(stored) as Partial<SettingsValues>;

      // Merge with defaults (in case new settings were added in an update)
      const merged: SettingsValues = { ...this.defaults, ...parsed };

      this.applyLoadedSettings(merged);
    } catch (error) {
      console.error('Failed to load settings, using defaults:', error);
      this.applyLoadedSettings(this.defaults);
    }
  }

  /**
   * Apply a loaded settings object to all signals and DOM.
   */
  private applyLoadedSettings(settings: SettingsValues): void {
    this._masterVolume.set(settings.masterVolume);
    this._musicVolume.set(settings.musicVolume);
    this._sfxVolume.set(settings.sfxVolume);
    this._fullscreen.set(settings.fullscreen);
    this._vsync.set(settings.vsync);
    this._renderResolution.set(settings.renderResolution);
    this._textSizeMultiplier.set(settings.textSizeMultiplier);
    this._colorblindMode.set(settings.colorblindMode);
    this._reducedMotion.set(settings.reducedMotion);
    this._highContrast.set(settings.highContrast);
    this._autosaveIntervalYears.set(settings.autosaveIntervalYears);
    this._confirmIrreversible.set(settings.confirmIrreversible);

    // Apply UI-affecting settings to DOM
    this.applyRenderResolution(settings.renderResolution);
    this.applyReducedMotion(settings.reducedMotion);
    this.applyColorblind(settings.colorblindMode);
    this.applyHighContrast(settings.highContrast);
  }

  /**
   * Persist current settings to storage (localStorage + TODO: Tauri file).
   */
  private persistSettings(): void {
    const current: SettingsValues = {
      masterVolume: this._masterVolume(),
      musicVolume: this._musicVolume(),
      sfxVolume: this._sfxVolume(),
      fullscreen: this._fullscreen(),
      vsync: this._vsync(),
      renderResolution: this._renderResolution(),
      textSizeMultiplier: this._textSizeMultiplier(),
      colorblindMode: this._colorblindMode(),
      reducedMotion: this._reducedMotion(),
      highContrast: this._highContrast(),
      autosaveIntervalYears: this._autosaveIntervalYears(),
      confirmIrreversible: this._confirmIrreversible(),
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Failed to persist settings:', error);
    }
  }

  /**
   * Apply render resolution to the document root.
   * Sets CSS custom properties --logical-w and --logical-h.
   * AppComponent reads these to compute --root-scale.
   */
  private applyRenderResolution(res: RenderResolution): void {
    const [w, h] = res.split('x').map(Number);
    document.documentElement.style.setProperty('--logical-w', `${w}px`);
    document.documentElement.style.setProperty('--logical-h', `${h}px`);
  }

  /**
   * Apply reduced motion setting to the document root.
   * Adds/removes 'reduced-motion' class.
   */
  private applyReducedMotion(reduced: boolean): void {
    document.documentElement.classList.toggle('reduced-motion', reduced);
  }

  /**
   * Apply colorblind mode to the document root.
   * Adds/removes 'colorblind' class.
   */
  private applyColorblind(on: boolean): void {
    document.documentElement.classList.toggle('colorblind', on);
  }

  /**
   * Apply high contrast mode to the document root.
   * Adds/removes 'high-contrast' class.
   */
  private applyHighContrast(on: boolean): void {
    document.documentElement.classList.toggle('high-contrast', on);
  }
}
