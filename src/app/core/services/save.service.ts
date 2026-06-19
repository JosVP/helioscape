import { Injectable, inject, signal } from '@angular/core';
import type { SerializedGameState } from '@app/core/models';
import { GameStateService } from './game-state.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAVE_VERSION = 3;
const MAX_SLOTS = 3;
const AUTOSAVE_SLOT = 0;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SlotInfo {
  exists: boolean;
  gameYear?: number;
  kardashevLevel?: number;
  saveTimestamp?: number;
  isAutosave: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Serialises/deserialises GameStateService to/from persistent storage.
 *
 * - Tauri (desktop): writes individual JSON files via @tauri-apps/plugin-fs,
 *   one file per slot inside appDataDir() — e.g. appDataDir()/save_slot_0.json.
 * - Browser (dev): writes to localStorage with the same interface.
 *
 * Slot layout:
 *   0 = autosave
 *   1–3 = manual slots (MAX_SLOTS covers 1..3)
 */
@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly gameState = inject(GameStateService);

  private readonly isTauri: boolean = '__TAURI__' in window;

  /** Cached appDataDir() result — resolved once, reused for all path lookups. */
  private appDataDirCache: string | null = null;

  // -------------------------------------------------------------------------
  // Autosave signal
  // -------------------------------------------------------------------------

  private readonly _autosaveSignal = signal(0);
  /** Incremented each time an autosave completes. Consumers can react via effect(). */
  readonly autosaveCompleted = this._autosaveSignal.asReadonly();

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Returns the absolute file path for a save slot.
   * Caches the appDataDir() result so it's only resolved once per session.
   */
  private async _getSlotPath(slot: number): Promise<string> {
    if (!this.appDataDirCache) {
      try {
        const { appDataDir } = await import('@tauri-apps/api/path');
        this.appDataDirCache = await appDataDir();
      } catch (err) {
        console.error('[SaveService] Failed to resolve appDataDir:', err);
        this.appDataDirCache = '';
      }
    }
    return `${this.appDataDirCache}save_slot_${slot}.json`;
  }

  /** Returns the storage key for a given slot number. */
  private _getLocalKey(slot: number): string {
    return slot === AUTOSAVE_SLOT ? 'helioscape_autosave' : `helioscape_save_${slot}`;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Saves the current game state to the specified slot.
   *
   * @param slot - 0 for autosave, 1–MAX_SLOTS for manual slots.
   */
  async save(slot: number): Promise<void> {
    const state = this.gameState.serialise();
    // SaveService owns the canonical version stamp. serialise() also sets version
    // and saveTimestamp, but we overwrite them here so SaveService is the single
    // authority on save-format versioning — independent of how GameStateService evolves.
    const payload: SerializedGameState = {
      ...state,
      version: SAVE_VERSION,
      saveTimestamp: Date.now(),
    };

    try {
      if (this.isTauri) {
        const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs');
        const path = await this._getSlotPath(slot);
        // mkdir is idempotent with recursive:true — safe to call on every save.
        const dir = path.substring(0, path.lastIndexOf('/'));
        await mkdir(dir, { recursive: true });
        await writeTextFile(path, JSON.stringify(payload));
      } else {
        localStorage.setItem(this._getLocalKey(slot), JSON.stringify(payload));
      }
    } catch (err) {
      console.error(`[SaveService] save(slot=${slot}) failed:`, err);
      return;
    }

    if (slot === AUTOSAVE_SLOT) {
      this._autosaveSignal.update((n) => n + 1);
    }
  }

  /**
   * Loads a save from the specified slot and restores it into GameStateService.
   *
   * @returns true if a save was found and loaded; false if the slot is empty.
   */
  async load(slot: number): Promise<boolean> {
    let raw: unknown = null;

    try {
      if (this.isTauri) {
        const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
        const path = await this._getSlotPath(slot);
        if (!(await exists(path))) return false;
        raw = JSON.parse(await readTextFile(path));
      } else {
        const item = localStorage.getItem(this._getLocalKey(slot));
        raw = item ? (JSON.parse(item) as unknown) : null;
      }
    } catch (err) {
      console.error(`[SaveService] load(slot=${slot}) failed:`, err);
      return false;
    }

    if (raw == null) return false;

    let data = raw as SerializedGameState;

    // Migrate older save formats before hydrating.
    if (data.version !== SAVE_VERSION) {
      data = this._migrate(data, data.version ?? 0);
    }

    this.gameState.hydrate(data);
    return true;
  }

  /** Saves to the autosave slot (slot 0). */
  async autosave(): Promise<void> {
    await this.save(AUTOSAVE_SLOT);
  }

  /**
   * Returns lightweight metadata for a single slot without full deserialisation.
   * Reads only the fields needed to populate a save-slot UI card.
   */
  async getSlotInfo(slot: number): Promise<SlotInfo> {
    const isAutosave = slot === AUTOSAVE_SLOT;
    let raw: unknown = null;

    try {
      if (this.isTauri) {
        const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
        const path = await this._getSlotPath(slot);
        if (!(await exists(path))) return { exists: false, isAutosave };
        raw = JSON.parse(await readTextFile(path));
      } else {
        const item = localStorage.getItem(this._getLocalKey(slot));
        raw = item ? (JSON.parse(item) as unknown) : null;
      }
    } catch (err) {
      console.error(`[SaveService] getSlotInfo(slot=${slot}) failed:`, err);
      return { exists: false, isAutosave };
    }

    if (raw == null) return { exists: false, isAutosave };

    // Read only the metadata fields — do not call hydrate().
    const meta = raw as Pick<SerializedGameState, 'gameYear' | 'kardashevLevel' | 'saveTimestamp'>;
    return {
      exists: true,
      gameYear: meta.gameYear,
      kardashevLevel: meta.kardashevLevel,
      saveTimestamp: meta.saveTimestamp,
      isAutosave,
    };
  }

  /**
   * Returns SlotInfo for all slots: [autosave, slot 1, slot 2, slot 3].
   */
  async getAllSlotInfos(): Promise<SlotInfo[]> {
    const slots = [AUTOSAVE_SLOT, ...Array.from({ length: MAX_SLOTS }, (_, i) => i + 1)];
    return Promise.all(slots.map((slot) => this.getSlotInfo(slot)));
  }

  /**
   * Returns true if any save slot (including autosave) has data.
   * Short-circuits on the first found slot — does not read all slots.
   */
  async hasSave(): Promise<boolean> {
    const slots = [AUTOSAVE_SLOT, ...Array.from({ length: MAX_SLOTS }, (_, i) => i + 1)];
    for (const slot of slots) {
      const info = await this.getSlotInfo(slot);
      if (info.exists) return true;
    }
    return false;
  }

  /**
   * Deletes the save in the specified slot.
   *
   * @param slot - 0 for autosave, 1–MAX_SLOTS for manual slots.
   */
  async delete(slot: number): Promise<void> {
    try {
      if (this.isTauri) {
        const { remove, exists } = await import('@tauri-apps/plugin-fs');
        const path = await this._getSlotPath(slot);
        if (await exists(path)) {
          await remove(path);
        }
      } else {
        localStorage.removeItem(this._getLocalKey(slot));
      }
    } catch (err) {
      console.error(`[SaveService] delete(slot=${slot}) failed:`, err);
    }
  }

  // -------------------------------------------------------------------------
  // Migration
  // -------------------------------------------------------------------------

  /**
   * Migrates a save file from an older version to the current SAVE_VERSION.
   *
   * Add a case for each breaking version bump, e.g.:
   *   if (fromVersion < 2) { data = migrateV1toV2(data); }
   *   if (fromVersion < 3) { data = migrateV2toV3(data); }
   *
   * Never remove old cases — a player could be loading a very old save.
   */
  private _migrate(data: Partial<SerializedGameState>, fromVersion: number): SerializedGameState {
    let migrated: Partial<SerializedGameState> = { ...data };

    if (fromVersion < 2) {
      migrated = { ...migrated, version: 2 };
    }

    if (fromVersion < 3) {
      // ActiveResearchTrack shape changed: progressYears → startYear + elapsedBeforeStart.
      // Reconstruct from the old year counter. Paused tracks store elapsed; running
      // tracks store it as elapsedBeforeStart and set startYear = gameYear - progressYears.
      const year: number = (migrated.gameYear as number | undefined) ?? 2033;
      if (Array.isArray(migrated.activeResearch)) {
        migrated.activeResearch = migrated.activeResearch.map(
          (t: { trackId: string; planetId: string; progressYears?: number; isPaused?: boolean }) => ({
            trackId: t.trackId,
            planetId: t.planetId,
            isPaused: t.isPaused ?? false,
            startYear: t.isPaused ? year : year - (t.progressYears ?? 0),
            elapsedBeforeStart: t.isPaused ? (t.progressYears ?? 0) : 0,
          }),
        );
      }
      migrated = { ...migrated, version: 3 };
    }

    console.warn(`[SaveService] Migrating save from version ${fromVersion} → ${SAVE_VERSION}`);
    return migrated as SerializedGameState;
  }
}
