# Helioscape TODO Tracker

**Single source of truth** for deferred features and integration points.

**Workflow:**

- **lead-developer** adds TODOs here during planning (before code exists)
- **developer** reads this file before implementing to understand what's deferred and why
- **developer** moves completed TODOs from "Active" to "Completed" section after implementing them
- **lead-developer** checks this file at the start of each planning session to see if blocked work is now unblocked

No inline `// TODO:` comments in code - all tracking happens here to avoid duplication.

---

## Format

```
### [Feature/Service Name] — [Brief Description]
- **File**: path/to/file.ts
- **Location**: Brief description (e.g., "in set() method", "constructor")
- **TODO**: What needs to be done
- **Depends on**: What must exist first
- **Prompt block**: Block XX (if known)
- **Added**: YYYY-MM-DD
```

---

## Active TODOs

### SettingsService — Audio Volume Integration

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for masterVolume, musicVolume, sfxVolume
- **TODO**: Apply volume settings (master, music, sfx) to AudioService when it's implemented
- **Depends on**: AudioService (not yet created)
- **Prompt block**: TBD (audio system block)
- **Added**: 2026-06-11

### SettingsService — Fullscreen Toggle

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `set()` method for fullscreen
- **TODO**: Apply fullscreen setting via Tauri window API (`@tauri-apps/api/window`)
- **Depends on**: Tauri window API integration
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

### SettingsService — Tauri File Persistence

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `persistSettings()` method
- **TODO**: Write settings to file via `@tauri-apps/plugin-fs` when Tauri is available
- **Depends on**: Tauri fs plugin setup
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

### SettingsService — Tauri File Loading

- **File**: src/app/core/services/settings.service.ts
- **Location**: In `loadSettings()` method
- **TODO**: Load settings from Tauri file and merge with localStorage (file takes precedence)
- **Depends on**: Tauri fs plugin setup
- **Prompt block**: TBD (Tauri integration block)
- **Added**: 2026-06-11

---

## Completed TODOs

_(Moved here when implemented, kept for history)_

<!-- Example format:
### ✅ SettingsService — Audio Volume Integration
- **Completed**: 2026-06-15
- **Implemented in**: AudioService.applyVolume()
- **Notes**: Integrated with Web Audio API gain nodes
-->
