import { Injectable, signal, type Signal } from '@angular/core';

/**
 * Player settings shape — persists across all sessions, separate from game saves.
 * Stored in localStorage (key: 'helioscape_settings') with future Tauri file storage.
 */
export interface SettingsValues {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
  vsync: boolean;
  uiScale: number; // 1.0 | 1.25 | 1.5 | 2.0
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
 * - Apply UI-affecting settings immediately (scale, motion, colorblind, contrast)
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
    uiScale: 1.0,
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
  private readonly _uiScale = signal<number>(this.defaults.uiScale);
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
  readonly uiScale: Signal<number> = this._uiScale.asReadonly();
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
      case 'uiScale':
        return this._uiScale() as SettingsValues[K];
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
        break;
      case 'vsync':
        this._vsync.set(value as boolean);
        // NOTE: VSync is applied on next render loop start
        break;
      case 'uiScale':
        this._uiScale.set(value as number);
        this.applyUiScale(value as number);
        break;
      case 'textSizeMultiplier':
        this._textSizeMultiplier.set(value as number);
        // NOTE: Text size affects tokens, no direct apply needed
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
    this._uiScale.set(this.defaults.uiScale);
    this._textSizeMultiplier.set(this.defaults.textSizeMultiplier);
    this._colorblindMode.set(this.defaults.colorblindMode);
    this._reducedMotion.set(this.defaults.reducedMotion);
    this._highContrast.set(this.defaults.highContrast);
    this._autosaveIntervalYears.set(this.defaults.autosaveIntervalYears);
    this._confirmIrreversible.set(this.defaults.confirmIrreversible);

    // Apply all UI-affecting settings
    this.applyUiScale(this.defaults.uiScale);
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
    this._uiScale.set(settings.uiScale);
    this._textSizeMultiplier.set(settings.textSizeMultiplier);
    this._colorblindMode.set(settings.colorblindMode);
    this._reducedMotion.set(settings.reducedMotion);
    this._highContrast.set(settings.highContrast);
    this._autosaveIntervalYears.set(settings.autosaveIntervalYears);
    this._confirmIrreversible.set(settings.confirmIrreversible);

    // Apply UI-affecting settings to DOM
    this.applyUiScale(settings.uiScale);
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
      uiScale: this._uiScale(),
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
   * Apply UI scale to the document root.
   * Sets CSS custom property --ui-scale.
   */
  private applyUiScale(scale: number): void {
    document.documentElement.style.setProperty('--ui-scale', scale.toString());
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
