## 2026-06-03 — research_tracks.json
Done: Added the Phase 1 research track dataset for Moon and Earth, including RP costs, durations, descriptions, direct prerequisites, and completion effects aligned with the existing tech tree IDs.
Signals: None.
Depends on: data/tech_tree.json tech IDs including earth_advanced_renewables, earth_deuterium_extraction, earth_fusion_ignition_theory, moon_* research tech nodes, and mars_ocean_confirmed spillover progression.
Gap: The current research track schema only exposes a single prerequisite_tech field, so Moon Organism Library Tier II keeps direct chaining to the Tier I track while Mars spillover remains aligned through the corresponding tech-tree unlock rather than a second explicit track prerequisite.

## 2026-06-03 — culture_events.json / localization/en.csv
Done: Added a localized seed culture event dataset with 15 events, including the required Mercury, Moon, Mars, Venus, Dyson, and Kardashev beats plus matching English translation keys for titles, body text, and choice labels.
Signals: None.
Depends on: DataManager loading data/culture_events.json; LocalizationManager/Godot translations resolving the CE_* keys stored in event title, narrator_text, and choice label fields; future CultureEventSystem special handling for europa_warning, europa_impact, and mars_first_liquid_water.
Gap: The current event/UI stubs still expect direct display strings, so CultureEventCard and any event-trigger matching logic will need to call tr() on these stored keys and explicitly handle the special trigger IDs.

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

## 2026-06-02 — Setup scaffold folders / project.godot / .gitignore / pre-commit
Done: Created the missing architecture folders, registered the core architecture autoload entries in project.godot, added the gdUnit4 temp ignore, and prepared the repository for a local pre-commit hook.
Signals: None.
Depends on: src/autoloads/DataManager.gd, GameState.gd, TimeManager.gd, and SaveManager.gd existing as registered autoload targets; tests/ folder in the project root.
Gap: Godot editor tasks still remain manual, including opening the project in Godot and installing gdUnit4 from AssetLib.

## 2026-06-02 — DataManager.gd
Done: Added the initial autoload stub for authored JSON loading and caching responsibilities.
Signals: None.
Depends on: Registered in project.godot as the DataManager autoload.
Gap: No JSON loading or typed accessors exist yet.

## 2026-06-02 — GameState.gd
Done: Added the initial autoload stub for mutable runtime state ownership.
Signals: None.
Depends on: Registered in project.godot as the GameState autoload.
Gap: No state schema or persistence fields exist yet.

## 2026-06-02 — TimeManager.gd
Done: Added the initial autoload stub for simulation clock ownership.
Signals: None.
Depends on: Registered in project.godot as the TimeManager autoload.
Gap: No pause, speed, or ticking logic exists yet.

## 2026-06-02 — SaveManager.gd
Done: Added the initial autoload stub for save and load responsibilities.
Signals: None.
Depends on: Registered in project.godot as the SaveManager autoload.
Gap: No serialization or versioned save format exists yet.

## 2026-06-02 — TechTreeSystem.gd
Done: Added the initial system stub for technology prerequisite and unlock logic.
Signals: None.
Depends on: Future GameState, DataManager, and EventBus integration.
Gap: No unlocking logic exists yet.

## 2026-06-02 — ResearchSystem.gd
Done: Added the initial system stub for research track progression.
Signals: None.
Depends on: Future GameState, DataManager, and EventBus integration.
Gap: No track scheduling or completion logic exists yet.

## 2026-06-02 — ResourceSystem.gd
Done: Added the initial system stub for resource accumulation and spending.
Signals: None.
Depends on: Future GameState and EventBus integration.
Gap: No resource economy logic exists yet.

## 2026-06-02 — TerraformingSystem.gd
Done: Added the initial system stub for planet terraforming progression.
Signals: None.
Depends on: Future GameState, DataManager, and EventBus integration.
Gap: No phase transitions or planet progression logic exists yet.

## 2026-06-02 — DysonSystem.gd
Done: Added the initial system stub for Dyson infrastructure progression.
Signals: None.
Depends on: Future GameState and EventBus integration.
Gap: No queue or energy-output logic exists yet.

## 2026-06-02 — CultureEventSystem.gd
Done: Added the initial system stub for cultural event trigger evaluation.
Signals: None.
Depends on: Future GameState, DataManager, and EventBus integration.
Gap: No trigger evaluation or queueing logic exists yet.

## 2026-06-02 — KardashevSystem.gd
Done: Added the initial system stub for Kardashev milestone evaluation.
Signals: None.
Depends on: Future GameState, DataManager, and EventBus integration.
Gap: No milestone or tag logic exists yet.

## 2026-06-02 — PlanetSurface.gdshader / Atmosphere.gdshader / DysonSwarm.gdshader / PixelFilter.gdshader
Done: Added minimal shader stub files so the architecture scaffold now includes the named shader surfaces from the design docs.
Signals: None.
Depends on: Future materials, scenes, and shader parameters.
Gap: No rendering logic exists yet beyond placeholder shader declarations.

## 2026-06-03 — tech_tree.json
Done: Added the first authored tech tree dataset covering Earth, Moon, Mercury phase markers and buildout nodes, plus Mars and Venus terraforming choice nodes and spillover marker nodes.
Signals: Encodes emit_event, spillover_unlock, apply_terraforming_choice, and tag_decision effects for TechTreeSystem to process.
Depends on: DataManager loading data/tech_tree.json; GameState.completed_techs for prerequisite and spillover gating; future TechTreeSystem and TerraformingSystem runtime handling for effect application.
Gap: Prompt-requested inline comments were not embedded because the repository's authored data files are strict JSON; if commentable data is required later, the loader will need JSONC support or a parallel documentation field.

## 2026-06-03 — planets.json
Done: Added authored planet data for Earth, Mercury, Mars, and Venus using the architecture schema plus the extended visual fields for spin, atmosphere, lava, and city lights.
Signals: None.
Depends on: DataManager consuming data/planets.json; future planet visual updates via EventBus.planet_visual_params_changed.
Gap: Referenced planet texture assets and runtime consumers for the new visual keys are not implemented yet in the current workspace.

## 2026-06-03 — Main.tscn / project.godot
Done: Added the initial root scene scaffold with the Systems node, placeholder UI layer, SubViewport-based SolarSystem root, a layer-4 DebugConsole attachment, and scene-level placeholder nodes for BioPhaseSystem and MercuryBuildQueue.
Signals: None.
Depends on: Existing system stubs under src/systems/ and DebugConsole.gd; run/main_scene now points to res://scenes/Main.tscn.
Gap: Most UI and solar-system scripts/scenes still do not exist, so Main.tscn currently uses placeholder Control and Node3D nodes instead of the final scripted components.

## 2026-06-03 — culture_events.json
Done: Added the Phase 1 culture event dataset with localized title/body/choice keys, required milestone and year triggers, special-case trigger markers for runtime-handled events, and the deferred Fermi event flagged with v1_candidate false.
Signals: None.
Depends on: data/localization/en.csv translation keys for event titles, narrator text, and choice labels; future DataManager loading of data/culture_events.json; future CultureEventSystem and CultureEventCard support for title_key, narrator_text_key, and label_key fields.
Gap: Runtime consumers currently described in the prompts still reference inline title and narrator_text fields, so the future UI/system implementation needs to resolve localization keys instead of raw strings.

## 2026-06-03 — DataManager.gd
Done: Replaced the autoload stub with typed JSON loading, mixed root-shape normalization, id-indexed caches, and planet-filtered accessor methods for planets, tech nodes, research tracks, culture events, Kardashev milestones, and resources.
Signals: None.
Depends on: data/planets.json using a dictionary root; data/tech_tree.json, data/research_tracks.json, data/culture_events.json, data/kardashev_milestones.json, and data/resources.json using arrays of entries with id fields.
Gap: The loader currently treats malformed or missing ids as skipped entries and only exposes the prompt-requested accessors; future callers needing full culture-event or resource listings may need additional typed getter methods.

## 2026-06-03 — resources.json
Done: Added Mercury resource data for common ore, rare metals, and polar volatiles with IDs, display names, descriptions, rarity, base accumulation rates, and UI colors.
Signals: None.
Depends on: Future DataManager loading of data/resources.json and resource consumers such as ResourceSystem and HUD counters.
Gap: Runtime systems and UI that consume these resource definitions are still stubs or not implemented in the current workspace.