## 2026-06-05 — Main scene wiring + Mercury entry + lint order fixes
Done: Fixed gdscript class-definitions-order issues in MercuryMapUI and MinerAssignmentPanel by reordering global definitions; wired Main.tscn to actually render the SubViewport and run SolarSystemView/HUD/PlanetsPanel scripts; added Main scene controller that opens MercuryMap when mercury is selected; added runtime fallback planet rendering in SolarSystemView when PlanetView.tscn is missing; added BackButton in MercuryMap scene to return to Main.
Signals: Main controller connects EventBus.planet_selected to scene transition for mercury; existing EventBus Mercury/UI signals unchanged.
Depends on: scenes/Main.tscn script/ext_resource wiring, src/Main.gd, src/ui/solar_system/SolarSystemView.gd fallback paths, scenes/mercury/MercuryMap.tscn BackButton path expected by MercuryMapUI.
Gap: PlanetView.tscn and PlanetOrbit.tscn are still absent, so SolarSystemView runs in fallback planet mode until those scenes are authored.

## 2026-06-05 — MercuryMap implementation (Prompt 1 + Prompt 2)
Done: Implemented Mercury map gameplay scaffold with hardcoded JSON map data, typed map state machine (LOCKED/AVAILABLE/BUILDING/OPERATIONAL), starting-zone selection persistence, construction flow with adjacency unlocks, edge-scroll camera controller, refinery-driven mining with miner assignment/reassignment, production queue with permanent default Dyson panel row, and dedicated Mercury UI panels for zone selection, build confirmation, resource counters, queue list, and miner assignments.
Signals: Added EventBus.starting_zone_chosen, building_completed, node_selected, miner_reassigned; connected queue and miner systems to existing resource_accumulation_updated/component_queued/component_completed/dyson_panel_produced flows.
Depends on: DataManager.get_mercury_map_data(), GameState mercury map/miner/queue fields, ResourceSystem group access for resource spend/add, SaveManager persistence for new Mercury fields.
Gap: Mercury waypoint arrays for MinerUnit path loops are still placeholders and should be authored per-slot after final map layout in editor; MercuryMap scene is created at res://scenes/mercury/MercuryMap.tscn but not yet linked into main navigation flow.

## 2026-06-05 — DysonSystem.gd
Done: Implemented typed Dyson swarm system with panel accumulation driven by Mercury common_ore, energy-per-tier calculation, coverage percent tracking, shader parameter updates (dyson_coverage, sun_dim_factor), milestone threshold checks (10/25/50/100%), and CME (coronal mass ejection) event triggering. Explanation: swarm is a procedural transparent sphere around Sun; dyson_coverage drives shader fill on DysonSwarm.gdshader; sun_dim_factor on Sun material caps at 0.35 to preserve Earth sunlight per GDD. CME: 0.5% chance per year (basic tier only) destroys 2% of panels.
Signals: Connects EventBus.game_year_ticked; emits EventBus.dyson_energy_updated, culture_event_triggered (for CME).
Depends on: GameState.dyson_panel_count, dyson_energy_watts, dyson_coverage_percent, dyson_panel_tier, mercury_resources, completed_milestones, culture_event_queue.
Gap: Shader material references (_dyson_sphere_material, _sun_material) must be wired at runtime — awaiting Main.tscn scene structure for @onready paths.

## 2026-06-05 — CultureEventSystem.gd + CultureEventCard.gd + CultureEventQueue.gd
Done: Implemented CultureEventSystem with all signal connections, _check_trigger_type dispatch for five trigger types, year-reached scanning, Europa warning/impact window, Dyson threshold checks, push/history/dedup logic, and v1_candidate gating. Added get_all_culture_events() to DataManager. CultureEventCard renders narrator text via RichTextLabel.visible_ratio typewriter tween (skippable on click or ui_accept), builds choice buttons dynamically, emits culture_event_choice_made. CultureEventQueue manages toast stacking, bell-icon unread badge, bell-dropdown list with per-event Read buttons; does not auto-open CultureEventCard so game never pauses.
Signals: CultureEventSystem connects game_year_ticked, kardashev_milestone_reached, tech_node_unlocked, terraforming_phase_changed, terraforming_choice_applied, dyson_energy_updated; emits culture_event_triggered. CultureEventCard connects culture_event_triggered, emits culture_event_choice_made, culture_event_dismissed. CultureEventQueue connects culture_event_triggered, culture_event_dismissed.
Depends on: DataManager.get_all_culture_events(), DataManager.get_culture_event(); GameState.culture_event_queue, culture_event_history, orrery_zoomed_planet, europa_* fields, dyson_coverage_percent.
Gap: CultureEventCard and CultureEventQueue require matching .tscn scenes to be built in the Godot editor — node names ($HBoxContainer, $PortraitTexture, $BellIcon, $ToastContainer, $BellDropdown/$ScrollContainer/DropdownList, $CultureEventCard) must match the @onready paths. ce_europa_impact event_id is not yet in culture_events.json.

## 2026-06-05 — TerraformingSystem.gd
Done: Replaced the terraforming stub with a typed choice-driven system that initializes per-planet runtime state from DataManager, applies additive per-choice yearly rates, advances phases, manages lockout conflicts, handles Mars radiation-clear unblocking, computes per-planet visual params, and emits terraforming/visual signals.
Signals: Connects EventBus.game_year_ticked and tech_node_unlocked; emits terraforming_phase_changed, planet_visual_params_changed, terraforming_choice_applied, and culture_event_triggered (phase events).
Depends on: DataManager.get_all_planets(), GameState.planets schema (choices/locked_out/atmosphere/visual fields), EventBus terraforming and culture-event signals, TechTreeSystem calling apply_choice().
Gap: CHOICE_RATES and CHOICE_CONFLICTS are currently local constants tuned as a first pass; final balancing should be playtested and aligned with authored tech progression pacing.

## 2026-06-05 — GameState.gd + SaveManager.gd (Research Completion Years)
Done: Added GameState.completed_research_years and wired SaveManager save/load so completed research timestamps persist across save files and reloads.
Signals: None.
Depends on: ResearchSystem writing completion years on track completion; ResearchUI reading GameState.completed_research_years.
Gap: Existing old saves that predate this field will load with an empty completion-year dictionary until tracks complete again or data is backfilled.

## 2026-06-05 — TechTreeUI.gd + ResearchUI.gd (Panel Flow Wiring)
Done: Wired both panel UI scripts to EventBus.planet_selected so they update planet_id and refresh when the selected planet changes; removed deep absolute get_node fallbacks from UI scripts to keep one-level node-path constraints.
Signals: Connects EventBus.planet_selected in both UI scripts.
Depends on: SolarSystemView/PlanetsPanel emitting EventBus.planet_selected and systems registering in groups (tech_tree_system, research_system).
Gap: A dedicated PlanetPanel.gd scene script is still not present in this workspace snapshot, so tab/animation-specific panel behavior remains for a later file task.

## 2026-06-05 — TechTreeSystem.gd
Done: Replaced the tech tree stub with typed prerequisite checking, unlock processing, chained unlock support, spillover notification/event handling, terraforming choice forwarding, decision-tag counting, and available-tech listing for a planet.
Signals: Emits EventBus.tech_node_unlocked and EventBus.culture_event_triggered; emits EventBus.tech_node_available for spillover unlock hints.
Depends on: DataManager.get_tech_node/get_tech_tree_for, GameState.planets + completed_techs + culture_event_queue + decision counters, optional TerraformingSystem.apply_choice.
Gap: Spillover event IDs currently default to generated ids when effect.event_id is absent, so authored culture event ids should be added in data if specific narrative beats are required.

## 2026-06-05 — ResearchSystem.gd
Done: Replaced the research stub with typed yearly progression, completion handling, RP capacity accounting, start/pause/resume lifecycle, on-complete effect processing, and tech unlock bridging through TechTreeSystem.
Signals: Connects EventBus.game_year_ticked; emits EventBus.research_track_started/completed/paused/resumed; may emit tech and culture-event signals through effect application.
Depends on: DataManager.get_research_track and track on_complete_effects schema, GameState.active_research + used_rp_capacity + total_rp_capacity + completed_techs, optional TechTreeSystem and TerraformingSystem instances.
Gap: Completion year is not persisted in GameState yet; completed track timestamps are currently only tracked in UI memory during runtime.

## 2026-06-05 — TechTreeUI.gd
Done: Added a planet-scoped tech tree UI that builds buttons from DataManager tech nodes, applies visibility/muting/silhouette rules from missing prerequisite count, forwards node clicks to TechTreeSystem, and refreshes on tech_node_unlocked.
Signals: Connects EventBus.tech_node_unlocked; invokes TechTreeSystem.unlock_tech.
Depends on: DataManager.get_tech_tree_for/get_tech_node, GameState.completed_techs, TechTreeSystem node in scene/group tech_tree_system.
Gap: Current implementation builds a fallback VBox layout when expected child nodes are absent; final scene-specific styling/layout still needs editor-side wiring.

## 2026-06-05 — ResearchUI.gd
Done: Added a planet-scoped research UI that separates running, paused, available, and completed tracks, renders progress/remaining years, supports start/pause/resume actions, and displays RP usage with resume-capacity tooltips.
Signals: Connects EventBus.research_track_completed/paused/resumed and refreshes view state; invokes ResearchSystem track control methods.
Depends on: DataManager.get_research_tracks_for, GameState.active_research + completed_techs + RP capacity fields, ResearchSystem node in scene/group research_system.
Gap: Completed track year labels are runtime-only (tracked locally from completion signals) and show a placeholder for pre-completed tracks loaded from save.

## 2026-06-05 — SolarSystemView.gd + PlanetOrbit.gd
Done: Created SolarSystemView (orrery root — fixed camera, planet spawning from DataManager, continuous orbit animation in _process, camera zoom tweens to planets, zoom_out, year-tick dim for locked planets) and PlanetOrbit (fixed orbit ring with TorusMesh, 16-sphere click detection distributed around the ring, lock visual state, forwards clicks to EventBus.planet_selected).
Signals: Connects EventBus.planet_selected, EventBus.game_year_ticked; emits EventBus.orrery_zoom_requested on zoom complete.
Depends on: DataManager.get_all_planets(), GameState.planets / orrery_zoomed_planet, EventBus.planet_selected / orrery_zoom_requested / game_year_ticked, scenes/planets/PlanetView.tscn (must have ClickArea Area3D child), src/ui/solar_system/PlanetOrbit.tscn (optional — falls back to code-built torus if absent).
Gap: PlanetOrbit.tscn and PlanetView.tscn scene files still need to be built in the Godot editor. Camera overview/zoom constants (OVERVIEW_CAMERA_POSITION, ZOOM_CAMERA_OFFSET) will need tuning once scenes exist.

## 2026-06-03 — GameState.gd
Done: Replaced the GameState autoload stub with the full typed runtime state schema for clock, planets, Mercury resources, Dyson progression, research capacity, culture history, milestones, decisions, Europa mission state, and orrery focus, plus a reset() method that reassigns every field to its default new-game value.
Signals: None.
Depends on: Registered as the GameState autoload in project.godot; future systems mutating these fields directly and SaveManager serializing the same public state.
Gap: Collection fields remain plain Array and Dictionary containers to match the current codebase patterns, so typed element wrappers or helper accessors are still absent.

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

## 2026-06-03 — TimeManager.gd
Done: Replaced the clock autoload stub with typed accumulator-based ticking, 1x and 5x speed control, pause toggling, and EventBus.game_year_ticked emission every in-game year.
Signals: Emits EventBus.game_year_ticked.
Depends on: GameState.game_year, game_speed, and is_paused; EventBus.game_year_ticked listeners in downstream systems and UI.
Gap: Tick rollover currently resets the accumulator to zero as requested by the prompt, so any overshoot beyond a tick interval is intentionally discarded rather than carried into the next frame.

## 2026-06-03 — SaveManager.gd
Done: Replaced the persistence stub with versioned save serialization to user://save_slot_1.json, safe load-time defaulting across all current GameState public fields, save existence checks, and save deletion.
Signals: Emits EventBus.game_saved and EventBus.game_loaded.
Depends on: GameState public vars remaining the authoritative save schema and EventBus lifecycle listeners when present.
Gap: _migrate() is still a forward-compatible stub, so future schema changes will need explicit version-to-version migration functions before older saves can be upgraded safely.

## 2026-06-03 — ResourceSystem.gd
Done: Replaced the Mercury resource stub with typed yearly accumulation from data/resources.json, Mercury phase-based production scaling, tech-based output bonuses, spend helpers, and resource plus phase signal emission for HUD and downstream systems.
Signals: Connects to EventBus.game_year_ticked and tech_node_unlocked; emits resource_accumulated, resource_accumulation_updated, and mercury_phase_changed.
Depends on: DataManager.get_resource() for base accumulation rates; GameState.completed_techs and mercury_resources; Mercury phase marker tech ids in data/tech_tree.json.
Gap: Resource production tuning is still encoded as local constants in the system, so if design wants fully data-authored building yields later these phase and tech bonus tables should move into JSON.

## 2026-06-03 — DysonSystem.gd
Done: Replaced the Dyson stub with yearly panel production, energy and coverage recomputation, milestone tracking, a basic-tier CME loss check, and ResourceSystem-backed ore spending for new panels.
Signals: Connects to EventBus.game_year_ticked; emits EventBus.dyson_panel_produced and EventBus.dyson_energy_updated.
Depends on: ResourceSystem as a sibling system node for spend_resources(); GameState Mercury resources, panel tier, and milestone storage.
Gap: Visual shader material updates and culture-event emission beyond queueing the CME notification still need to be wired once the Sun and Dyson swarm scene materials exist.

## 2026-06-05 — PixelFilter.gdshader
Done: Replaced the shader stub with a canvas_item post-process that snaps SCREEN_TEXTURE sampling to a pixel_size grid and adds a subtle combined scanline/dither overlay at low opacity for retro texture.
Signals: None.
Depends on: SubViewport output presented through a CanvasItem using this shader; SCREEN_PIXEL_SIZE and SCREEN_TEXTURE availability in the rendering path.
Gap: Final visual feel tuning still depends on in-editor testing against camera framing and target output resolution.

## 2026-06-05 — PlanetVisual.gd
Done: Added a typed PlanetVisual bridge that caches shader materials, applies initial visual params instantly, updates cloud offset and planet spin on game_year_ticked, tweens slow-changing shader params over a fixed 2.0-second interval, seeds UV spot arrays via PackedVector2Array, and updates sun_direction from a scene Sun Node3D.
Signals: Connects to EventBus.game_year_ticked, planet_visual_params_changed, and game_loaded.
Depends on: GameState.planets[planet_id] state keys, DataManager planet visual data, EventBus signal emissions, PlanetSphere and AtmosphereShell child nodes with shader materials.
Gap: Sun node discovery uses a group/name fallback scan and should be tightened to a single explicit scene hook once the final SolarSystem scene path or group convention is locked.
## 2026-06-05 - PlanetBase.gd
Done: Added a typed base planet contract with required interface methods, unlock-condition default handling against GameState.completed_techs, and a _ready assertion that child scripts must set planet_id.
Signals: None.
Depends on: GameState.completed_techs for default is_unlocked() checks in child classes that provide unlock tech ids.
Gap: Base methods currently warn and return fallback values when not overridden; if stricter enforcement is desired these can be hardened with push_error assertions.

## 2026-06-05 - EarthPlanet.gd
Done: Implemented Earth-specific planet logic with always-unlocked behavior, narrator-voice phase description derived from completed Earth tech progression, Kardashev band summary text, and Moon research summary counts (active/completed/available).
Signals: None.
Depends on: GameState.completed_techs, GameState.kardashev_level, GameState.active_research, and DataManager.get_research_tracks_for("moon").
Gap: Earth description text currently keys off a focused subset of Earth tech IDs and may need expansion once additional Earth narrative milestones are authored.

## 2026-06-05 - MercuryPlanet.gd
Done: Implemented Mercury planet logic with unlock condition, phase naming, narrator one-line phase descriptions, phase-scaled resource rate reporting from DataManager resource definitions, and Dyson output summary formatting.
Signals: None.
Depends on: GameState.mercury_phase, GameState.completed_techs, GameState.dyson_panel_count, GameState.dyson_energy_watts, and DataManager.get_resource().
Gap: Phase production multipliers are local constants for now and should be aligned with final economy balancing after playtesting.

## 2026-06-05 - MarsPlanet.gd
Done: Implemented Mars additive-choice planet logic with active choice discovery from GameState.planets.mars.terraforming_choices, phase display naming from choice combinations, narrator one-line phase descriptions that reference active choices, unlock checks, and radiation-window helpers.
Signals: None.
Depends on: GameState.planets["mars"] terraforming_phase and terraforming_choices, GameState.completed_techs, GameState.mercury_radiation_clear_year, and GameState.game_year.
Gap: Narrator strings are authored defaults; if culture-event beats are later preferred in this panel, descriptions may be redirected to localized keys.

## 2026-06-05 - VenusPlanet.gd
Done: Implemented Venus additive-choice planet logic with required visual-layering rationale comment, active choice discovery, phase naming from active choices, narrator one-line phase descriptions (including Europa spin-up and sky-city context), unlock checks, Europa mission availability window, ETA helper, and current spin speed helper.
Signals: None.
Depends on: GameState.planets["venus"] terraforming_phase and terraforming_choices, GameState.completed_techs, GameState.europa_mission_authorised, GameState.europa_impact_year, GameState.europa_impacted, and GameState.game_year.
Gap: The display name uses ASCII formatting ("465C") to keep source encoding simple; if you want the degree symbol in UI text, it can be switched in a localization pass.

## 2026-06-05 - PlanetPanel.gd
Done: Added the planet detail container controller with typed planet switching, swipe-out/swipe-in content transitions, panel population for TechTreeUI/ResearchUI/VignetteDisplay, locked-state handling, and phase/status refresh using planet helper scripts.
Signals: Connects EventBus.planet_selected and EventBus.terraforming_phase_changed.
Depends on: DataManager.get_planet, GameState.planets and mercury_phase, EventBus metadata for Moon-tab request, and UI child nodes ContentContainer, PlanetNameLabel, TabContainer, LockedMessage, TechTreeUI, ResearchUI, VignetteDisplay.
Gap: Moon-tab opening currently relies on EventBus metadata and assumes TabContainer + MoonTab exist in the final scene.

## 2026-06-05 - VignetteDisplay.gd
Done: Added a typed vignette renderer with trigger-driven refresh hooks, forward-compatible DataManager.get_vignette_data stub handling, dynamic location tabs, layered TextureRect crossfades (1.5s sine easing), and placeholder fallback behavior when vignette data is absent.
Signals: Connects EventBus.terraforming_phase_changed, tech_node_unlocked, and kardashev_milestone_reached.
Depends on: Optional DataManager.get_vignette_data(planet_id), GameState phase/milestone/tech data, and UI nodes LocationTabs, LocationViewport, LocationTitle.
Gap: State-selection rules are intentionally generic until data/vignettes.json schema is finalized.

## 2026-06-05 - HUD.gd
Done: Added root HUD script with cached top-bar references, year updates, resource-counter updates, Mercury resource visibility gating, and optional Dyson wattage readout updates.
Signals: Connects EventBus.game_year_ticked, resource_accumulation_updated, dyson_energy_updated, and mercury_phase_changed.
Depends on: GameState game_year/mercury data and DataManager resource display names.
Gap: Final visual layout and style are scene-driven and need editor wiring to match the target HUD composition.

## 2026-06-05 - PlanetsPanel.gd
Done: Added always-visible planet side-panel logic with ordered entry creation (Earth, Moon, Mercury, Mars, Venus), locked/active/flourishing status markers, selected-row highlighting, phase label refresh, and click emission to EventBus.planet_selected including Earth/Moon special handling.
Signals: Connects EventBus.planet_selected and terraforming_phase_changed; emits EventBus.planet_selected on entry clicks.
Depends on: DataManager planet definitions, GameState unlock and phase state, planet helper scripts for display names, and optional EventBus metadata for Moon-tab requests.
Gap: Moon-open flag is passed through EventBus metadata; a dedicated typed signal can replace this later if desired.

## 2026-06-05 - TimeControls.gd
Done: Added pause/play control script with first-playthrough gating for speed controls, speed toggle between 1x and 5x, and pause-state text sync on tick events.
Signals: Connects EventBus.game_year_ticked.
Depends on: TimeManager.toggle_pause/set_speed and GameState is_paused/game_speed/is_first_playthrough.
Gap: Button captions currently use ASCII text (Play/Pause, 1x/5x); iconographic labels can be added in final UI polish.

## 2026-06-05 - KardashevBar.gd
Done: Added Kardashev progress UI script with smooth 0.8s fill tweening, K-level label updates, milestone marker labels, and warm-white pulse feedback on milestone reached.
Signals: Connects EventBus.game_year_ticked and kardashev_milestone_reached.
Depends on: GameState.kardashev_level and a ProgressBar/Label marker layout in the scene.
Gap: Marker placement is currently label-based; precise marker ticks should be aligned to the final art-directed bar component.

## 2026-06-05 - EarthPlanet.gd
Done: Fixed Godot parse error by removing child redeclaration of inherited planet_id and assigning planet_id in _init() instead.
Signals: None.
Depends on: PlanetBase.planet_id inherited member and PlanetBase._ready assertion.
Gap: None.

## 2026-06-05 - MercuryPlanet.gd
Done: Fixed Godot parse error by removing child redeclaration of inherited planet_id and assigning planet_id in _init() instead.
Signals: None.
Depends on: PlanetBase.planet_id inherited member and PlanetBase._ready assertion.
Gap: None.

## 2026-06-05 - MarsPlanet.gd
Done: Fixed Godot parse error by removing child redeclaration of inherited planet_id and assigning planet_id in _init() instead.
Signals: None.
Depends on: PlanetBase.planet_id inherited member and PlanetBase._ready assertion.
Gap: None.

## 2026-06-05 - VenusPlanet.gd
Done: Fixed Godot parse error by removing child redeclaration of inherited planet_id and assigning planet_id in _init() instead.
Signals: None.
Depends on: PlanetBase.planet_id inherited member and PlanetBase._ready assertion.
Gap: None.
