## 2026-06-02 — CreateTheme.gd
Done: Added a Godot 4 editor script that generates the Helioscape theme resource with named colours, spacing constants, button variants, progress bar styles, and panel styles.
Signals: None.
Depends on: UI_GUIDE.md colour and spacing vocabulary; saves to res://assets/theme/helioscape_theme.tres.
Gap: Fonts are not configured yet because no font assets are present in the repository.

## 2026-06-02 — LocalizationManager.gd
Done: Added the base English localization CSV and a typed autoload helper for translated strings with named parameter substitution.
Signals: None.
Depends on: Godot TranslationServer via tr(); data/localization/en.csv translation keys.
Gap: Project Settings still need manual registration for the CSV, locale, and autoload entry in the Godot editor.

## 2026-06-02 — AudioManager.gd
Done: Added a typed audio autoload that owns primary music, secondary layer music, ambient playback, and a reusable SFX player pool with safe crossfades and missing-file handling.
Signals: Connects to EventBus.tech_node_unlocked, culture_event_triggered, kardashev_milestone_reached, bio_phase_collapsed, emergent_discovery_found, bio_phase_started, bio_phase_completed, and planet_selected.
Depends on: EventBus autoload signals when present; AudioServer bus names Master, Music, Ambient, and SFX; placeholder audio paths under assets/audio/.
Gap: Placeholder audio assets still need to be created or imported under assets/audio/ for playback beyond warning-only fallback.

## 2026-06-02 — EventBus.gd
Done: Added the typed global signal hub covering the documented architecture events plus the planet-selection and bio-phase signals consumed by AudioManager.
Signals: Declares game_year_ticked, tech/research, terraforming, bio phase, resource, Dyson, culture event, Kardashev, and lifecycle signals.
Depends on: Registered as an autoload in project.godot so systems and UI can emit and connect through a single singleton.
Gap: No systems or UI scripts emit these signals yet in the current workspace snapshot.

## 2026-06-02 — project.godot / default_bus_layout.tres
Done: Registered EventBus, LocalizationManager, and AudioManager as autoloads and added a default audio bus layout with Master, Music, Ambient, and SFX buses.
Signals: None.
Depends on: Existing autoload scripts under src/autoloads/ and the default_bus_layout.tres resource at the project root.
Gap: The original five architecture autoloads are still absent from this workspace, so only the available singleton files were registered.

## 2026-06-02 — Audio placeholders
Done: Generated local placeholder WAV files for all current music and SFX paths under assets/audio/ and updated AudioManager music constants to point at the generated WAV assets.
Signals: None.
Depends on: assets/audio/music/*.wav, assets/audio/sfx/*.wav, and AudioManager.gd placeholder path constants.
Gap: There are still no system or UI scripts in the workspace to emit EventBus gameplay signals beyond the autoload layer.

## 2026-06-02 — DebugConsole.gd
Done: Added a typed development-only debug console UI script with runtime input-action registration, command parsing, bottom-docked output/input UI, tab completion, and guarded cheat commands for GameState, saves, milestones, discoveries, and Dyson progression.
Signals: None.
Depends on: Theme colour/constants when available; debug-only `debug_console` input action; optional autoloads/systems including GameState, DataManager, TimeManager, SaveManager, TechTreeSystem, DysonSystem, KardashevSystem, and BioPhaseSystem.
Gap: Main.tscn is not present in the current workspace snapshot, so the layer-4 CanvasLayer scene wiring has not been added yet.