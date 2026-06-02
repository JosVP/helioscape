# Helioscape — Copilot Prompts (v2)
> Godot 4 / GDScript · Solo dev (Jos) · Ordered by Phase 1 build sequence.
> Before using a prompt from this file in Copilot Chat, attach or read ARCHITECTURE.md and helioscape-gdd-caveman-architecture.md.
> Use one prompt section at a time in Copilot Chat.

---

## Convention note
Lines marked `[→ Copilot: ...]` are instructions to write that explanation as an **in-code comment** in the generated file — they are not notes for you to read. All other parenthetical notes are for you.

---

## Architecture rules (apply to every file)
1. Data lives in JSON — no content hardcoded in GDScript.
2. Logic never talks to UI — systems emit signals, UI reads state.
3. One file, one job.
GDScript 4 static typing always. Signals over direct calls. Constants UPPER_SNAKE_CASE, variables snake_case, classes PascalCase. Comments explain *why*, not what. No `get_node()` paths longer than one level in UI scripts.

---

# PHASE 1 — Data files

---

## `data/planets.json`

```
Create data/planets.json for Helioscape following the schema in ARCHITECTURE.md, extended with the fields described below.

Each planet entry: id, display_name, unlock_condition, initial_state, visual.

--- Visual block additions beyond the base schema ---

Each planet's visual block must include:

axis_spin_speed: float
  How fast the planet rotates around its axis. Used to rotate the MeshInstance3D each frame.
  earth: 1.0 (reference speed)
  mars: 0.97
  mercury: 0.017 (very slow — tidally influenced)
  venus_initial: 0.004 (barely rotates — backward rotation)
  venus_spunup: 0.9 (after Europa impact — approached Earth-like speed)
  For venus, store as: { "initial": 0.004, "spunup": 0.9 }
  VenusPlanet.gd will read the correct value based on GameState.

cloud_rotation_speed: float
  How fast the cloud layer UV offset advances per game-year. Independent of axis spin.
  earth: 0.002
  mars_phase_0: 0.0 (no clouds)
  mars_phase_3+: 0.001 (thin clouds as atmosphere thickens)
  venus_initial: 0.012 (extremely fast — 250 km/h winds)
  venus_late: 0.004 (slower as atmosphere stabilises)
  Store as a single float representing the initial speed; TerraformingSystem updates it via planet_visual_params_changed.

atmosphere_color: String (hex)
  The tint applied by the surface shader's atmosphere_tint uniform AND the atmosphere rim shader.
  earth: "#4488ff" (blue)
  mars_initial: "#cc6644" (thin pink-red)
  venus_initial: "#ffcc44" (thick yellow-orange CO2)
  mercury: "#000000" (no atmosphere — density will be 0.0)
  The surface texture itself is the rocky base. The yellow of Venus comes from this atmosphere tint, not from the surface texture. Venus surface texture = rocky gray.

atmosphere_density_initial: float
  Starting atmosphere_density uniform value for the Atmosphere shader.
  earth: 0.35, mars: 0.05, venus: 0.95 (very dense), mercury: 0.0

layer_textures block (same structure as base schema):
  All planets: surface, water, green, cloud (as before).
  Mars additionally: lava ("res://assets/textures/planets/mars_lava.png")
  The lava layer sits between surface and water in the compositing order.

lava_spot_uvs: Array (mars only)
  UV seed points for lava spreading, same structure as water_spot_uvs.
  Use 4 points in the Tharsis volcanic region area (approximate UVs: [0.4, 0.35], [0.45, 0.3], [0.38, 0.4], [0.42, 0.45]).

lava_hue_data: Dictionary (mars only)
  { "hot_hue": 0.0, "cooled_hue": 0.72 }
  hot_hue 0.0 = red, cooled_hue 0.72 = dark blue-black in HSV space.
  TerraformingSystem drives the lava_hue_shift uniform (0.0 = hot, 1.0 = cooled) over time after the laser firing stops.

city_lights_texture: String (earth only)
  "res://assets/textures/planets/earth_city_lights.png"
  This layer is only visible on the side of the planet NOT facing the sun. PlanetSurface.gdshader handles this via the sun_direction uniform.

--- Planet entries ---

Earth: always unlocked (no unlock_condition). No terraforming paths. No lava. No water_spot_uvs or green_spot_uvs (not terraformed).

Mercury: unlock_condition "earth_launch_mercury_mission". Industrial world. No water/green/lava layers. No cloud. atmosphere_density_initial: 0.0.

Mars: unlock_condition "mercury_phase_2". Three terraforming path identifiers stored in terraforming_paths array: ["mars_polar_detonation", "mars_orbital_mirror", "mars_magnetic_umbrella"] — but note these are choice identifiers, not exclusive forks. A player can combine choices. initial_state: atmosphere_pressure 0.006, temperature_celsius -60, terraforming_phase 0.

Venus: unlock_condition "mercury_phase_2". Surface texture is rocky gray — the yellow atmospheric appearance comes from atmosphere_color and atmosphere_density_initial (0.95). initial_state: atmosphere_pressure 92.0, temperature_celsius 465, terraforming_phase 0. No water_spot_uvs initially (no liquid water). Add 3 green_spot_uvs for late-stage vegetation.

Output only the JSON file.
```

---

## `data/resources.json`

*(Unchanged from v1 — carry forward)*

```
Create data/resources.json for Helioscape.

Three Mercury ore types. Each: id, display_name, description, rarity ("common" | "rare" | "volatile"), base_accumulation_rate (units per game-year at base mining level), color hex for UI.

1. common_ore — iron/silicon/aluminium. Abundant, all standard construction. base_accumulation_rate: 10.
2. rare_metals — titanium/chromium. Specific crater deposits. Advanced components, mid/high-tier Dyson panels. base_accumulation_rate: 3.
3. polar_volatiles — water ice and carbon compounds. Life support, organic chemistry, chemical rocket propellant (water electrolysis → H₂/O₂). base_accumulation_rate: 2.
```

---

## `data/kardashev_milestones.json`

*(Unchanged from v1 — carry forward)*

```
Create data/kardashev_milestones.json for Helioscape.

Four milestones: id, display_name, description (one sentence, narrator "we" voice), conditions (array of condition objects), approximate_year_range (string), effects (array).

1. type_1 — "Type I Civilisation". Conditions: ["deuterium_fusion_online", "dyson_15_percent"]. ~Year 80-120. Effect: unlock mid-tier Dyson panels, emit CE "ce_type1_reached".
2. first_era_complete — "First Era Complete". Conditions: ["two_habitable_worlds", "first_self_sustaining_colony", "dyson_50_percent"]. ~Year 400-700. V1 narrative climax. Effect: emit CE "ce_first_era_complete".
3. type_2 — "Type II Civilisation". Conditions: ["dyson_100_percent"]. ~Year 800-1200. Effect: emit CE "ce_type2_reached".
4. type_3_gesture — "First Interstellar Seed Ship". Conditions: ["interstellar_seed_ship_launched"]. ~Year 1000-1500+. Effect: emit CE "ce_seed_ship_launched".

Condition objects: { "type": "string_id" } — KardashevSystem.gd evaluates these at runtime against GameState.
```

---

## `data/tech_tree.json`

```
Create data/tech_tree.json for Helioscape.

Each tech node: id, planet, display_name, prerequisites (same-planet tech ids), spillover_prerequisites (cross-planet tech ids), rp_cost, duration_years, effects (array).

Effect types:
- { "type": "unlock_tech", "target": "tech_id" }
- { "type": "emit_event", "event_id": "ce_id" }
- { "type": "spillover_unlock", "target_planet": "planet_id", "target_tech": "tech_id" }
- { "type": "apply_terraforming_choice", "planet": "planet_id", "choice_id": "choice_id", "permanent": true/false }
  [→ Copilot: add a code comment on this effect type explaining that terraforming choices are additive attributes on a planet — not exclusive forks. A player can apply multiple choices to the same planet over time. The "permanent" flag means the choice cannot be undone (e.g. polar detonation, Europa impact).]
- { "type": "tag_decision", "tag": "naturalist" | "architect" }

Earth tech nodes (include all from GDD):
- earth_launch_mercury_mission (always available, prerequisites: [], rp_cost: 0, duration_years: 0 — instant)
- earth_advanced_renewables (req: earth_launch_mercury_mission)
- earth_dome_habitat (req: earth_launch_mercury_mission)
- earth_deuterium_extraction (req: earth_advanced_renewables, rp_cost: 40, duration_years: 30)
- earth_ocean_cleanup (spillover_prerequisite: mercury_phase_1_complete)
- earth_fusion_ignition_theory (req: earth_deuterium_extraction, rp_cost: 50, duration_years: 40)
- earth_co2_drawdown (spillover_prerequisites: ["venus_carbonate_process_started"])
- earth_soil_restoration (spillover_prerequisites: ["mars_soil_study_complete"])
- earth_ocean_acidification_reversal (req: earth_co2_drawdown, spillover: venus_carbonate)
- earth_rewilding (req: earth_soil_restoration, spillover: mars_coastal_stable)

Moon research tracks (planet: "moon", these are research track refs — see research_tracks.json for detail):
- moon_low_gravity_medicine, moon_closed_loop_life_support, moon_regolith_construction, moon_organism_library_t1
- moon_radiation_resilience (req: moon_low_gravity_medicine)
- moon_isolation_psychology (req: moon_closed_loop_life_support)
- moon_he3_extraction (req: moon_regolith_construction)
- moon_organism_library_t2 (req: moon_organism_library_t1, spillover: mars_ocean_confirmed)

Mercury milestone markers as tech nodes (planet: "mercury"):
- mercury_phase_0_complete (effect: apply_terraforming_choice mercury phase_0)
- mercury_phase_1_complete (req: mercury_phase_0_complete)
- mercury_phase_2_complete (req: mercury_phase_1_complete)
Plus sub-nodes: landing_pad, power_cell, mining_facility, refinery, fabricator, solar_array_expansion, rare_metals_mining, mass_driver, dyson_panel_production, polar_volatiles_extraction.

Mars terraforming choices (planet: "mars") — these are choices, not exclusive forks. Player can mix and match:
- mars_polar_detonation (permanent: true, tag: architect — nukes the poles to sublimate CO2; WARNING: triggers radiation burst, delays dome colonisation by ~40 years; effect: apply_terraforming_choice mars polar_detonation)
- mars_orbital_mirrors (permanent: false, tag: architect — large mirror arrays warm the surface)
- mars_magnetic_umbrella (permanent: false, tag: naturalist — artificial magnetosphere protects atmosphere)
- mars_aerogel_domes (permanent: false — dome habitat tech for early colonists)
- mars_biological_seeding (permanent: false, tag: naturalist — organisms from Moon library)
- mars_comet_water_delivery (permanent: false — import water via redirected comets)
[→ Copilot: add a comment noting that mars_polar_detonation and mars_aerogel_domes interact — if polar_detonation is active, dome colonisation is blocked for the radiation_clear_years duration stored in GameState. TerraformingSystem enforces this.]

Venus terraforming choices (planet: "venus"):
- venus_orbital_shade_mirror (permanent: false, tag: architect — shade mirror reduces solar input, starts cooling)
- venus_carbonate_sequestration (permanent: false, tag: naturalist — bacteria/chemistry converts CO2 to rock)
- venus_europa_impact (permanent: true, tag: architect — Europa redirected to spin up Venus + deliver water. Only available if europa_mission_authorised and year < 100)
- venus_sky_cities (permanent: false, tag: naturalist — floating habitat cities in upper atmosphere during transition)
- venus_sky_city_descent (permanent: false, tag: architect — lower sky cities to surface as cooling completes)
[→ Copilot: add a comment noting venus_orbital_shade_mirror and venus_sky_cities can coexist — the orbital mirror is Architect, preserving sky cities during the long cooling phase is Naturalist. Both choices can be active simultaneously.]

Use realistic rp_costs: simple = 20, standard = 30-40, complex = 50-80. duration_years should feel consequential at 2 real-seconds-per-game-year pacing.
```

---

## `data/research_tracks.json`

*(Minor note added — otherwise carry forward from v1)*

```
Create data/research_tracks.json for Helioscape.

Each track: id, display_name, planet, rp_cost (capacity occupied while running), duration_years, description (one sentence), prerequisite_tech, on_complete_effects (array).

Important: research tracks can be PAUSED, not cancelled. Progress is always preserved. The is_paused state is stored in GameState.active_research per track entry, not in this data file.

Moon research tracks (~20-35yr each):
- moon_low_grav_medicine_track (rp_cost: 25, duration_years: 30)
- moon_closed_loop_track (rp_cost: 30, duration_years: 35)
- moon_regolith_construction_track (rp_cost: 20, duration_years: 25)
- moon_organism_library_t1_track (rp_cost: 35, duration_years: 35)
- moon_radiation_resilience_track (rp_cost: 30, req: moon_low_grav_medicine_track complete)
- moon_isolation_psychology_track (rp_cost: 25, req: moon_closed_loop_track complete)
- moon_he3_extraction_track (rp_cost: 40, req: moon_regolith_construction_track complete)
- moon_organism_library_t2_track (rp_cost: 50, req: t1 + spillover mars_ocean_confirmed)

Key Earth research tracks:
- earth_fusion_ignition_theory_track (rp_cost: 50, duration_years: 40)
- earth_deuterium_extraction_track (rp_cost: 40, duration_years: 30)

Track RP costs: simple = 20 RP. Standard = 30-40 RP. Complex = 50-80 RP.
```

---

## `data/culture_events.json`

```
Create data/culture_events.json for Helioscape with ~15 seed culture events.

Each entry: id, title, narrator_text, portrait (res://assets/textures/ui/ce_{id}.png), choices (array, can be empty), tags (array), trigger.

--- Narrator voice ---
Present tense, first person plural ("we"). Human, not clinical. Optimism from presence, not spin. Each narrator_text is 1 to 3 short paragraphs. A paragraph is 2-4 sentences. Do not write walls of text — these are read quickly alongside a visual.

Example (correct):
"It's working. Atmospheric monitors recorded the first measurable pressure increase. 0.008 atmospheres. Not enough to breathe — not for three hundred more years. But it's there.

We've been watching the instruments for months, waiting. Nobody said anything when the numbers moved. We just looked at each other."

--- Multiple events on the same game year ---
The trigger system may queue multiple events simultaneously (e.g. a tech completes and crosses a Dyson milestone on the same tick). All events get pushed to GameState.culture_event_queue and displayed sequentially. The player reads at their own pace. This file does not need to handle this — it is handled by CultureEventSystem.gd.

--- Trigger object formats ---
{ "type": "tech_completed", "tech_id": "..." }
{ "type": "milestone_reached", "milestone_id": "..." }
{ "type": "year_reached", "year": 2065 }
{ "type": "terraforming_choice_applied", "planet": "...", "choice_id": "..." }
{ "type": "dyson_percent_reached", "percent": 10 }

--- Choice objects ---
{ "id": "choice_id", "label": "Short button label (max 5 words)", "tag": "naturalist" | "architect" | "", "effects": [] }

--- Required events ---

ce_mercury_landing
  trigger: tech_completed earth_launch_mercury_mission
  choices: [] (pure arrival moment)
  Write the landing as a small, quiet moment. Not triumphant — careful, focused. Two paragraphs.

ce_first_days_on_mercury
  trigger: year_reached ~2038 (5 years after landing)
  No choices. One paragraph. Quiet observation of the crew settling in.

ce_fusion_theory_complete
  trigger: tech_completed earth_fusion_ignition_theory
  No choices. Two paragraphs. The weight of the breakthrough.

ce_type1_reached
  trigger: milestone_reached type_1
  No choices. Two paragraphs. A turning point in human energy history.

ce_first_era_complete
  trigger: milestone_reached first_era_complete
  No choices. Three paragraphs. This is the emotional climax of V1 — write it with weight and scope. The contrast between the solar system at game start and now. First person plural throughout.

ce_dyson_10_percent
  trigger: dyson_percent_reached 10
  No choices. One paragraph.

ce_dyson_25_percent
  trigger: dyson_percent_reached 25
  No choices. One paragraph. Sun looks slightly different from Mercury's surface.

ce_dyson_50_percent
  trigger: dyson_percent_reached 50
  No choices. Two paragraphs. First Era Complete condition met.

ce_mars_first_liquid_water
  trigger: terraforming_choice_applied mars (any water-producing choice reaching a milestone)
  No choices. Two paragraphs.

ce_moon_first_birthday
  trigger: year_reached ~2035 (first crew birthday off-Earth)
  No choices. One paragraph. Intimate, human-scale.

ce_moon_refusing_return
  trigger: year_reached ~2040
  choices: [{ respect the decision (naturalist) }, { recall them (architect) }]
  Two paragraphs before the choice.

ce_fermi_silence_detected
  trigger: dyson_percent_reached 30
  Three choices: broadcast / go quiet / continue as normal
  [→ Copilot: add a comment noting this event may be deferred to post-V1. Include it in the data file but flag it with "v1_candidate": false so CultureEventSystem can skip it if the feature is not ready.]
  Two paragraphs. The realisation that the sun now looks anomalous from 150 light-years away. No answers. The choice is how humanity responds to the silence.

ce_europa_warning
  trigger: handled specially by CultureEventSystem when europa_mission_authorised == true and (impact_year - current_year) <= 15
  Two paragraphs. The impactor packages are already en route. The decision was made years ago. Now the window for the Hunt for Life to run is closing.
  choices: [] (the decision is already made — this is a status report, not a new choice)

ce_venus_cooling_begins
  trigger: terraforming_choice_applied venus venus_orbital_shade_mirror
  No choices. One paragraph.

ce_mars_polar_detonation
  trigger: terraforming_choice_applied mars mars_polar_detonation
  No choices. Two paragraphs. The detonation is dramatic but the narrator is measured, not triumphant. Acknowledges the radiation risk. Architect tag on the event itself.
```

---

# PHASE 2 — Core autoloads

---

## `src/autoloads/DataManager.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/autoloads/DataManager.gd for Helioscape. Godot 4 autoload singleton.

Loads all JSON from data/ on _ready(). Caches as typed Dictionaries. Exposes typed accessors. Never writes. Never holds mutable state.

Files: planets.json, tech_tree.json, research_tracks.json, culture_events.json, kardashev_milestones.json, resources.json.

Public accessors (statically typed):
- get_planet(planet_id: String) -> Dictionary
- get_all_planets() -> Dictionary
- get_tech_node(node_id: String) -> Dictionary
- get_tech_tree_for(planet_id: String) -> Array[Dictionary]
- get_research_track(track_id: String) -> Dictionary
- get_research_tracks_for(planet_id: String) -> Array[Dictionary]
- get_culture_event(event_id: String) -> Dictionary
- get_kardashev_milestone(milestone_id: String) -> Dictionary
- get_all_milestones() -> Array[Dictionary]
- get_resource(resource_id: String) -> Dictionary

Private: _load_json(path: String) -> Dictionary. Print error if file not found.
```

---

## `src/autoloads/EventBus.gd`

```
Create src/autoloads/EventBus.gd for Helioscape. Godot 4 autoload singleton.

Responsibility: declare all cross-system signals in one place. No logic, no state, no _process.

[→ Copilot: add a file-level comment explaining that all cross-system signals live here so that systems never hold direct references to each other. Connecting to EventBus.some_signal is always correct; connecting to SomeSystem.some_signal is always wrong.]

Declare exactly these signals with correct GDScript 4 typed parameter syntax:

signal tech_node_unlocked(planet_id: String, node_id: String)
signal research_track_completed(track_id: String)
signal research_track_paused(track_id: String)
signal research_track_resumed(track_id: String)
signal terraforming_choice_applied(planet_id: String, choice_id: String)
signal terraforming_phase_changed(planet_id: String, phase: int)
signal culture_event_triggered(event_id: String)
signal kardashev_milestone_reached(milestone_id: String)
signal dyson_energy_updated(watts: float)
signal game_year_ticked(year: float)
signal planet_visual_params_changed(planet_id: String, params: Dictionary)
signal mercury_phase_changed(phase: int)
signal resource_accumulation_updated(resource_id: String, amount: float)
signal culture_event_choice_made(event_id: String, choice_id: String)
signal save_requested()
signal load_requested()
signal planet_selected(planet_id: String)
signal orrery_zoom_requested(planet_id: String)
```

---

## `src/autoloads/GameState.gd`

```
Create src/autoloads/GameState.gd for Helioscape. Godot 4 autoload singleton.

Single source of truth. Plain data only. Systems modify; UI reads. No logic, no signals emitted from here.

var game_year: float = 2033.0
var game_speed: int = 1  # 1 only on first playthrough; 5 unlocked after
var is_paused: bool = false
var is_first_playthrough: bool = true

# Planets keyed by planet_id
var planets: Dictionary = {}
# Per-planet structure (initialised by TerraformingSystem from DataManager on game start):
# {
#   "terraforming_phase": int,
#   "terraforming_progress": float,       # 0.0–1.0 within current phase
#   "terraforming_choices": Dictionary,   # choice_id -> { "active": bool, "started_year": float, "permanent": bool }
#   "locked_out_choices": Array,          # choice_ids permanently excluded by prior choices
#   "population": int,
#   "atmosphere_pressure": float,
#   "temperature_celsius": float,
#   "visual_params": Dictionary           # current computed shader params — updated each game_year_ticked
# }

[→ Copilot: add a comment on terraforming_choices explaining that choices are additive, not exclusive forks. A player can apply mars_orbital_mirrors AND mars_magnetic_umbrella simultaneously. The only exclusions are physically irreversible conflicts stored in locked_out_choices (e.g. polar_detonation blocks early dome_colonisation until radiation clears).]

var mercury_phase: int = 0
var mercury_resources: Dictionary = {
    "common_ore": 0.0,
    "rare_metals": 0.0,
    "polar_volatiles": 0.0
}
var mercury_radiation_clear_year: float = 0.0  # set if mars polar detonation fires

var dyson_energy_watts: float = 0.0
var dyson_panel_count: int = 0
var dyson_panel_tier: String = "basic"  # "basic" | "mid" | "hardened"
var dyson_coverage_percent: float = 0.0

var active_research: Array = []
# Each entry: { "track_id": String, "planet_id": String, "progress_years": float, "is_paused": bool }
var total_rp_capacity: int = 60
var used_rp_capacity: int = 0

var kardashev_level: float = 0.73
var kardashev_tags: Array = []

var culture_event_history: Array = []
# Each entry: { "event_id": String, "year": float, "planet_context": String }
var culture_event_queue: Array = []

var completed_techs: Array = []
var completed_milestones: Array = []

var naturalist_decisions: int = 0
var architect_decisions: int = 0

var europa_mission_authorised: bool = false
var europa_impact_year: float = 0.0      # set when Europa mission authorised
var europa_impacted: bool = false
var europa_life_confirmed: bool = false

# Orrery state
var orrery_zoomed_planet: String = ""    # "" = overview, planet_id = zoomed in

func reset() -> void:
    # Restore all vars to defaults (new game).
    # [→ Copilot: implement by reassigning every var above to its initial value. Do not call _ready() — just reset the data.]
    pass
```

---

## `src/autoloads/TimeManager.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/autoloads/TimeManager.gd for Helioscape. Godot 4 autoload singleton.

Own the game clock. Emit EventBus.game_year_ticked every 2 real seconds at 1×. Handle pause and speed (1× and 5×). That is the entire job.

Use _process(delta) with an accumulator. tick_interval = 2.0 / GameState.game_speed. If GameState.is_paused, skip accumulation. On tick: GameState.game_year += 1.0, emit EventBus.game_year_ticked.emit(GameState.game_year), reset accumulator.

set_speed(speed: int): validates input is 1 or 5. Sets GameState.game_speed.
toggle_pause(): flips GameState.is_paused.

[→ Copilot: add a comment noting that visual orbit animation speed is intentionally decoupled from game speed — SolarSystemView handles its own frame-rate-driven orbit interpolation independently of this tick.]
```

---

## `src/autoloads/SaveManager.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/autoloads/SaveManager.gd for Helioscape. Godot 4 autoload singleton.

Serialise GameState to user://save_slot_1.json. Deserialise on load. const SAVE_VERSION: int = 1.

save_game(): build Dictionary from all GameState public vars, add save_version key, write with FileAccess.
load_game(): read, parse JSON, check save_version, call _migrate if needed, overwrite GameState properties using .get() with defaults for safety.
_migrate(data: Dictionary, from_version: int) -> Dictionary: stub with comment explaining version-keyed migration functions.
has_save() -> bool.
delete_save().

Handle FileAccess errors gracefully. Never crash on missing or corrupt save.
```

---

# PHASE 3 — Shaders

---

## `src/shaders/PlanetSurface.gdshader`

```
Create src/shaders/PlanetSurface.gdshader for Helioscape.

shader_type spatial.

--- Layer compositing order (bottom to top) ---
0. Surface — always visible (opacity 1.0). Base rock/dust/ice texture.
1. Lava — grows from UV seed points (same mechanic as water spots). Has a hue_shift uniform that shifts the colour from hot-red toward cooled black. Mars only in practice, but keep as universal uniforms.
2. Water — grows from UV seed points.
3. Green/vegetation — grows from UV seed points.
4. Cloud — UV-offset-based scrolling texture. Always rendered on top. Controlled by cloud_opacity and cloud_uv_offset.

--- Uniforms ---

// Layer textures
uniform sampler2D layer_surface : source_color, hint_default_white;
uniform sampler2D layer_lava : source_color, hint_default_transparent;
uniform sampler2D layer_water : source_color, hint_default_transparent;
uniform sampler2D layer_green : source_color, hint_default_transparent;
uniform sampler2D layer_cloud : source_color, hint_default_transparent;
uniform sampler2D layer_city_lights : source_color, hint_default_transparent;

// Lava spots
uniform vec2 lava_spots[8];
uniform int lava_spot_count = 0;
uniform float lava_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float lava_opacity : hint_range(0.0, 1.0) = 0.0;
uniform float lava_hue_shift : hint_range(0.0, 1.0) = 0.0;
// [→ Copilot: add a comment explaining lava_hue_shift: 0.0 = hot red (matches texture), 1.0 = fully cooled, the fragment shader shifts hue toward dark blue-black in HSV space. The shift happens gradually over many game years as the surface cools after lasers stop firing.]

// Water spots
uniform vec2 water_spots[8];
uniform int water_spot_count = 0;
uniform float water_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float water_opacity : hint_range(0.0, 1.0) = 0.0;

// Green spots
uniform vec2 green_spots[8];
uniform int green_spot_count = 0;
uniform float green_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float green_opacity : hint_range(0.0, 1.0) = 0.0;

// Cloud
uniform float cloud_opacity : hint_range(0.0, 1.0) = 0.0;
uniform vec2 cloud_uv_offset = vec2(0.0, 0.0);
// [→ Copilot: add a comment explaining cloud_uv_offset is updated by PlanetVisual.gd each game_year_ticked by adding cloud_rotation_speed to the X component. This creates the independent cloud scrolling effect.]

// City lights (Earth only)
uniform float city_lights_intensity : hint_range(0.0, 1.0) = 0.0;
uniform vec3 sun_direction = vec3(1.0, 0.0, 0.0);
// [→ Copilot: add a comment explaining sun_direction is set in world space by PlanetVisual.gd to point from the planet toward the Sun node's position. City lights are only visible on fragments where the surface normal points AWAY from the sun (dot(NORMAL, sun_dir) < 0 in local space).]

// Atmosphere tint (applied on surface — drives the yellow of Venus, red of Mars, etc.)
uniform vec4 atmosphere_tint : source_color = vec4(0.0, 0.0, 0.0, 0.0);
// [→ Copilot: add a comment explaining that Venus's yellow-orange appearance comes from a high atmosphere_tint alpha with a warm yellow color, not from the surface texture. Surface texture is rocky gray. As Venus cools, TerraformingSystem reduces atmosphere_tint.a toward 0.]

// Shared
uniform float edge_softness : hint_range(0.005, 0.08) = 0.025;

--- Helper functions ---

// spot_coverage: returns 0.0-1.0 coverage at this UV from any spot
float spot_coverage(vec2 uv, vec2 spots[8], int count, float radius) {
    float coverage = 0.0;
    for (int i = 0; i < count; i++) {
        float dist = distance(uv, spots[i]);
        coverage = max(coverage, 1.0 - smoothstep(radius - edge_softness, radius, dist));
    }
    return coverage;
}

// hue_shift: shifts a color's hue in HSV space by shift amount (0.0–1.0 maps to 0–360°)
vec3 hue_shift(vec3 color, float shift) {
    // [→ Copilot: implement a standard RGB→HSV→shift H→HSV→RGB conversion. Shift the H component by shift * 360.0 degrees. This is used for the lava cooling effect.]
}

--- Fragment shader ---

void fragment() {
    vec2 uv = UV;

    // Sample base layers
    vec4 surface_col = texture(layer_surface, uv);
    vec4 lava_col    = texture(layer_lava, uv);
    vec4 water_col   = texture(layer_water, uv);
    vec4 green_col   = texture(layer_green, uv);
    vec4 cloud_col   = texture(layer_cloud, uv + cloud_uv_offset);
    vec4 lights_col  = texture(layer_city_lights, uv);

    // Apply lava hue shift before compositing
    lava_col.rgb = hue_shift(lava_col.rgb, lava_hue_shift * 0.72);
    // [→ Copilot: 0.72 in HSV (0–1 range) ≈ 260° which is the dark blue-black of cooled lava. Explain this constant.]

    // Composite layers bottom to top
    vec4 result = surface_col;

    float lava_mask  = spot_coverage(uv, lava_spots,  lava_spot_count,  lava_growth_radius);
    result = mix(result, lava_col,  lava_mask  * lava_opacity);

    float water_mask = spot_coverage(uv, water_spots, water_spot_count, water_growth_radius);
    result = mix(result, water_col, water_mask * water_opacity);

    float green_mask = spot_coverage(uv, green_spots, green_spot_count, green_growth_radius);
    result = mix(result, green_col, green_mask * green_opacity);

    // Atmosphere tint (before clouds — clouds sit above atmosphere on surface)
    result.rgb = mix(result.rgb, atmosphere_tint.rgb, atmosphere_tint.a);

    // Cloud layer
    result = mix(result, cloud_col, cloud_opacity * cloud_col.a);

    // City lights — only on night side
    float sun_dot = dot(normalize(NORMAL), normalize(sun_direction));
    float night_mask = clamp(-sun_dot * 4.0, 0.0, 1.0);
    // [→ Copilot: explain: sun_dot is positive on the day side, negative on the night side. We clamp the negative side and use it as the city lights mask. The * 4.0 creates a sharp terminator. city_lights_intensity controls how bright the lights are — driven by civilisation growth on Earth.]
    result.rgb += lights_col.rgb * night_mask * city_lights_intensity;

    ALBEDO = result.rgb;
}
```

---

## `src/shaders/Atmosphere.gdshader`

```
Create src/shaders/Atmosphere.gdshader for Helioscape.

Purpose: atmospheric glow rim effect on a slightly larger sphere (atmosphere shell) rendered additively on top of the planet sphere.

shader_type spatial;
render_mode blend_add, depth_draw_never, cull_front, unshaded;
// [→ Copilot: explain cull_front here: we render the inside surface of a sphere that is slightly larger than the planet. cull_front discards the outside-facing polygons so we only see the rim when looking at the planet from outside. This creates the atmospheric halo effect. blend_add makes it glow rather than occlude.]

uniform vec4 atmosphere_color : source_color = vec4(0.4, 0.7, 1.0, 1.0);
uniform float atmosphere_density : hint_range(0.0, 1.0) = 0.3;
uniform float rim_power : hint_range(1.0, 8.0) = 3.0;

void fragment() {
    float rim = 1.0 - abs(dot(NORMAL, VIEW));
    float glow = pow(rim, rim_power) * atmosphere_density;
    EMISSION = atmosphere_color.rgb * glow;
    ALPHA = glow;
}

// [→ Copilot: add a usage comment listing typical values per planet:
// Mercury: atmosphere_density = 0.0 (no atmosphere — shader still attached but invisible)
// Mars initial: atmosphere_color = #cc6644 (thin pink-red), density = 0.05
// Mars late: atmosphere_color = #4488ff (blue, as Earth-like), density = 0.25
// Venus initial: atmosphere_color = #ffcc44 (dense yellow-orange CO2), density = 0.95
// Venus late: atmosphere_color = #aaddff, density = 0.35
// Earth: atmosphere_color = #4488ff, density = 0.35
// These are updated by PlanetVisual.gd via set_shader_parameter each game_year_ticked.]
```

---

## `src/shaders/DysonSwarm.gdshader`

```
Create src/shaders/DysonSwarm.gdshader for Helioscape.

Purpose: visualise the growing Dyson swarm as a large transparent sphere around the Sun. The sphere starts fully transparent and gradually fills with procedural pixel clusters as coverage increases.

shader_type spatial;
render_mode blend_mix, depth_draw_never, cull_disabled, unshaded;

uniform float dyson_coverage : hint_range(0.0, 1.0) = 0.0;
// [→ Copilot: explain that dyson_coverage is driven by DysonSystem.gd via set_shader_parameter each game year. 0.0 = no panels, 1.0 = full swarm.]

uniform vec4 panel_color : source_color = vec4(0.03, 0.03, 0.06, 1.0);
// [→ Copilot: explain panel_color is very dark (nearly black) — individual panel clusters are dark absorbers that block sunlight for energy harvesting.]

uniform float panel_cluster_size : hint_range(0.005, 0.05) = 0.018;
// Controls the apparent size of each panel cluster pixel.

uniform float randomness : hint_range(0.0, 1.0) = 0.7;
// Controls how organically distributed the panels are vs grid-like.

// A simple hash function for distributing panels procedurally.
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
    vec2 uv = UV;

    // Tile UV into a grid of cells, each cell potentially containing a panel cluster.
    vec2 cell = floor(uv / panel_cluster_size);
    vec2 cell_uv = fract(uv / panel_cluster_size);

    // Each cell has a unique random threshold. If dyson_coverage exceeds the threshold, the cell is filled.
    float cell_threshold = hash(cell);

    // Apply randomness: high randomness = panels appear in random order across the sphere.
    // Low randomness = panels fill more uniformly. Use randomness to mix between pure threshold and a gradient fill.
    float fill_threshold = mix(cell_threshold, 0.5, 1.0 - randomness);

    bool panel_present = dyson_coverage > fill_threshold;

    // Inside a filled cell, draw a panel shape (square with a small gap around edges).
    float edge_gap = 0.12;
    bool in_panel = cell_uv.x > edge_gap && cell_uv.x < (1.0 - edge_gap) && cell_uv.y > edge_gap && cell_uv.y < (1.0 - edge_gap);
    // [→ Copilot: explain: the edge_gap creates visible spacing between panel clusters, giving the "spaced pixels" look the design calls for. Even at 100% coverage there are gaps — the swarm is not a solid shell.]

    if (panel_present && in_panel) {
        ALBEDO = panel_color.rgb;
        ALPHA = panel_color.a * 0.92;
    } else {
        ALBEDO = vec3(0.0);
        ALPHA = 0.0;
    }
}

// Note: Sun dimming as coverage grows is handled separately on the Sun mesh shader via a sun_dim_factor uniform, not in this shader. DysonSystem.gd updates both shaders simultaneously.
// [→ Copilot: add this as a code comment so it's clear why sun dimming is absent here.]
```

---

## `src/shaders/PixelFilter.gdshader`

*(Unchanged from v1 — carry forward)*

```
Create src/shaders/PixelFilter.gdshader for Helioscape.

shader_type canvas_item. Post-process on SubViewport texture output.

uniform float pixel_size : hint_range(1.0, 8.0) = 4.0;
uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, repeat_disable, filter_nearest;

Fragment: quantise UV to pixel_size grid, sample SCREEN_TEXTURE at snapped UV.
Add a subtle dithering/scanline pattern (~0.03 opacity) for retro texture.

[→ Copilot: add comments explaining:
1. All 3D geometry stays smooth — pixelation is purely post-process.
2. pixel_size 4.0 = ~480p effective on 1080p output. Tune for feel.
3. Stepped animation (6-8fps, variable frame hold) is handled at animation playback level, not here.]
```

---

# PHASE 4 — Planet Visual bridge

---

## `src/ui/planet_panel/PlanetVisual.gd`

```
Create src/ui/planet_panel/PlanetVisual.gd for Helioscape.

Responsibility: translate game state into PlanetSurface.gdshader and Atmosphere.gdshader parameters. Driven entirely by EventBus.game_year_ticked — NOT by free-running Tweens to arbitrary target values.

[→ Copilot: add a comment at the top of the file explaining the transition approach:
"All shader parameters are computed from authoritative planet data in GameState each time game_year_ticked fires. A short Tween of exactly 2 seconds (matching the 1x tick interval) smooths the visual update between ticks. This means:
- On save/load: _apply_params_instant() is called, bypassing the Tween entirely. The visual is always consistent with GameState.
- Long-duration changes (water growth over 100 years) are correct because the value is recomputed from data each tick, not interpolated over time independently.
- Short cosmetic updates (cloud UV offset) update directly without a Tween."]

@export var planet_id: String = ""

# Cached references (set in _ready)
var _surface_material: ShaderMaterial
var _atmosphere_material: ShaderMaterial
var _planet_mesh: MeshInstance3D

func _ready() -> void:
    # Cache node references — no get_node() paths longer than one level.
    _planet_mesh = $PlanetSphere  # adjust to actual child name in scene
    _surface_material = _planet_mesh.get_surface_override_material(0)
    _atmosphere_material = $AtmosphereShell.get_surface_override_material(0)

    # Set static UV seed points once (they never change at runtime).
    _set_uv_seed_points()

    # Apply initial visual state instantly (no Tween — on load, state must be exact).
    _apply_params_instant()

    # Connect to tick signal.
    EventBus.game_year_ticked.connect(_on_year_ticked)
    EventBus.planet_visual_params_changed.connect(_on_params_changed)

func _on_year_ticked(_year: float) -> void:
    # Update cloud UV offset (runs every tick, no Tween needed — it's a continuous scroll).
    var current_offset: Vector2 = _surface_material.get_shader_parameter("cloud_uv_offset")
    var cloud_speed: float = GameState.planets[planet_id].get("cloud_rotation_speed", 0.002)
    _surface_material.set_shader_parameter("cloud_uv_offset", current_offset + Vector2(cloud_speed, 0.0))

    # Update planet axis rotation (rotate the mesh node itself, not the shader).
    var spin_speed: float = GameState.planets[planet_id].get("axis_spin_speed", 1.0)
    _planet_mesh.rotation_degrees.y += spin_speed * 0.5  # tune multiplier for visual feel

    # Update sun direction for city lights (point from planet toward Sun node in world space).
    _update_sun_direction()

func _on_params_changed(changed_planet_id: String, params: Dictionary) -> void:
    if changed_planet_id != planet_id:
        return
    # Tween all slow-changing params over 2 seconds (one tick interval at 1x speed).
    # This prevents visual jitter between ticks without creating independent interpolation state.
    var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
    var duration: float = 2.0  # always matches tick interval — no configurable transition_duration

    for param_name in ["water_growth_radius", "water_opacity", "green_growth_radius", "green_opacity",
                        "lava_growth_radius", "lava_opacity", "lava_hue_shift", "cloud_opacity",
                        "city_lights_intensity"]:
        if params.has(param_name):
            var current_val: float = _surface_material.get_shader_parameter(param_name)
            tween.parallel().tween_method(
                func(v: float): _surface_material.set_shader_parameter(param_name, v),
                current_val, params[param_name], duration
            )

    # Atmosphere shader params
    if params.has("atmosphere_density"):
        var cur: float = _atmosphere_material.get_shader_parameter("atmosphere_density")
        tween.parallel().tween_method(
            func(v: float): _atmosphere_material.set_shader_parameter("atmosphere_density", v),
            cur, params["atmosphere_density"], duration
        )
    if params.has("atmosphere_color"):
        # [→ Copilot: tween atmosphere_color as a Color value, not float. Use tween_property if tween_method on Color is cleaner.]
        _atmosphere_material.set_shader_parameter("atmosphere_color", params["atmosphere_color"])

func _apply_params_instant() -> void:
    # Called on _ready and after load. Sets all shader params directly from GameState with no Tween.
    if not GameState.planets.has(planet_id):
        return
    var params: Dictionary = GameState.planets[planet_id].get("visual_params", {})
    for param_name in params:
        if _surface_material:
            _surface_material.set_shader_parameter(param_name, params[param_name])

func _set_uv_seed_points() -> void:
    # Read static UV seed point arrays from DataManager and set them once on the shader.
    var planet_data: Dictionary = DataManager.get_planet(planet_id)
    var visual: Dictionary = planet_data.get("visual", {})
    # Set water_spots, green_spots, lava_spots arrays on the shader material.
    # [→ Copilot: GDScript doesn't have a direct way to set vec2 arrays via set_shader_parameter in all Godot 4 versions. Use a PackedVector2Array and test that the shader receives it correctly. Add a comment if a workaround is needed.]

func _update_sun_direction() -> void:
    # Compute direction from this planet toward the Sun in world space and pass to shader.
    # [→ Copilot: get the Sun node's global_position from the scene tree. Compute normalize(sun_pos - _planet_mesh.global_position). Pass as a Vector3 to the sun_direction shader parameter.]
    pass
```

---

# PHASE 5 — Solar System View

---

## `src/ui/solar_system/SolarSystemView.gd`

```
Create src/ui/solar_system/SolarSystemView.gd for Helioscape.

Responsibility: manage the 3D orrery scene. All planet spheres orbit the Sun in 3D. Camera is fixed (no pan/tilt). Handle planet selection → zoom. Keep planets panel in sync. This node is the root of the SolarSystem.tscn scene.

[→ Copilot: add a comment explaining that the orrery uses a fixed isometric-style 3D camera. Players can never change the camera angle. Orbit paths are visible as thin 3D rings. Planets are rendered at a larger-than-realistic scale for click targets. The visual orbit animation speed is driven by _process(delta), not by game_year_ticked — it runs continuously for visual feel, decoupled from game time.]

--- Camera ---
@onready var camera: Camera3D = $Camera3D  # positioned at a fixed angle above the ecliptic plane, looking at origin (Sun)

--- Planet instances ---
var planet_nodes: Dictionary = {}  # planet_id -> Node3D (the planet sphere)
var orbit_radii: Dictionary = {    # visual orbit radii in 3D units (not realistic)
    "mercury": 4.0,
    "venus": 6.5,
    "earth": 9.0,
    "mars": 12.0
}
var orbital_periods: Dictionary = {  # visual orbit period in seconds (for smooth animation)
    "mercury": 12.0,
    "venus": 20.0,
    "earth": 30.0,
    "mars": 50.0
}
var planet_angles: Dictionary = {}  # current angle per planet, updated in _process

--- State ---
var zoomed_planet: String = ""      # "" = overview
var zoom_tween: Tween

func _ready() -> void:
    _spawn_planets()
    _spawn_orbit_rings()
    EventBus.planet_selected.connect(_on_planet_selected)
    EventBus.game_year_ticked.connect(_on_year_ticked)

func _process(delta: float) -> void:
    # Advance each planet's visual orbit angle continuously, independent of game speed.
    for planet_id in planet_nodes:
        if planet_angles.has(planet_id):
            var period: float = orbital_periods.get(planet_id, 30.0)
            planet_angles[planet_id] += (TAU / period) * delta
            _update_planet_position(planet_id)

func _spawn_planets() -> void:
    # For each planet in DataManager.get_all_planets():
    # - Instantiate the PlanetView.tscn scene (which contains the sphere + atmosphere shell + PlanetVisual.gd).
    # - Set the planet_id export on PlanetVisual.gd.
    # - Add to scene. Set initial position based on orbit_radii and a staggered starting angle.
    # - Store in planet_nodes dictionary.
    # - Connect the planet's click area (Area3D) clicked signal to _on_planet_clicked.
    # [→ Copilot: each PlanetView.tscn should have an Area3D with a SphereShape3D collision shape for click detection. The click target should be slightly larger than the visual sphere for easier selection.]
    pass

func _spawn_orbit_rings() -> void:
    # For each planet, draw a thin 3D orbit ring (a torus mesh or a series of line segments).
    # [→ Copilot: a simple approach is a MeshInstance3D with a torus mesh, very thin (inner_radius ≈ outer_radius), rotated to lie in the XZ plane. Color: dim white, low alpha. The ring is also clickable — add an Area3D around it so the player can click the orbit path when the planet is not at that position.]
    pass

func _update_planet_position(planet_id: String) -> void:
    var radius: float = orbit_radii.get(planet_id, 9.0)
    var angle: float = planet_angles.get(planet_id, 0.0)
    planet_nodes[planet_id].position = Vector3(cos(angle) * radius, 0.0, sin(angle) * radius)

func _on_planet_clicked(planet_id: String) -> void:
    if zoomed_planet == planet_id:
        return  # already zoomed
    _zoom_to_planet(planet_id)

func _zoom_to_planet(planet_id: String) -> void:
    if zoom_tween:
        zoom_tween.kill()
    zoomed_planet = planet_id
    GameState.orrery_zoomed_planet = planet_id
    var target_node: Node3D = planet_nodes[planet_id]
    # Tween camera to a position close to the planet, angled to show ~70% of the viewport height.
    # [→ Copilot: compute a camera target position offset from the planet node. Use a Tween with TRANS_SINE and EASE_IN_OUT. Duration ~1.2 seconds. Also tween camera.look_at to the planet center. After tween completes, emit EventBus.orrery_zoom_requested so PlanetPanel can open.]
    zoom_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
    # ... tween camera position and rotation ...
    zoom_tween.tween_callback(func(): EventBus.planet_selected.emit(planet_id))

func _on_planet_selected(planet_id: String) -> void:
    # When selected from the planets panel (not from orrery click), tween the orrery camera to that planet.
    if planet_id != zoomed_planet:
        _zoom_to_planet(planet_id)

func zoom_out() -> void:
    zoomed_planet = ""
    GameState.orrery_zoomed_planet = ""
    # Tween camera back to overview position.
    pass

func _on_year_ticked(_year: float) -> void:
    # Update locked/unlocked visual state for each planet orbit ring (dim if locked).
    for planet_id in planet_nodes:
        var is_unlocked: bool = GameState.planets.has(planet_id)
        # planet_nodes[planet_id].visible = true always; modulate alpha if locked
        pass
```

---

## `src/ui/solar_system/PlanetOrbit.gd`

```
Create src/ui/solar_system/PlanetOrbit.gd for Helioscape.

Responsibility: represent a single planet's orbit ring in the 3D orrery. Manage click detection on the ring itself (so player can click the orbital path even when the planet is elsewhere).

This is a Node3D that holds: the ring mesh, the ring Area3D (for orbit-path clicks), and is parented under SolarSystemView in the scene tree (NOT parented to the planet node, since the ring doesn't move).

@export var planet_id: String = ""
@export var orbit_radius: float = 9.0
@export var is_locked: bool = false

In _ready():
- Set ring mesh radius to orbit_radius.
- Connect Area3D input_event to _on_orbit_clicked.
- Apply dim colour if is_locked.

_on_orbit_clicked():
- Emit EventBus.planet_selected.emit(planet_id) — same signal as clicking the planet directly.
- SolarSystemView.gd handles the zoom.

Note: The planet sphere itself (PlanetView.tscn instance) is separate from PlanetOrbit. PlanetOrbit is the fixed ring. The planet sphere moves along the ring's path via SolarSystemView._update_planet_position().
```

---

# PHASE 6 — Tech Tree System

*(Unchanged from v1 — carry forward)*

---

## `src/systems/TechTreeSystem.gd`

```
Create src/systems/TechTreeSystem.gd for Helioscape.

Responsibility: prerequisite checking, node unlocking, spillover handling. Listen to user input via unlock_tech() public function. Modify GameState. Emit via EventBus. Never holds a reference to any UI node.

Modifies: GameState.planets[planet_id].unlocked_techs, GameState.completed_techs.
Emits: EventBus.tech_node_unlocked.

can_unlock(planet_id: String, node_id: String) -> bool:
- Check prerequisites and spillover_prerequisites all in GameState.completed_techs.

unlock_tech(planet_id: String, node_id: String) -> void:
- Guard: return if not can_unlock.
- Add to completed_techs, unlocked_techs.
- Process effects array via _apply_effect().
- Emit EventBus.tech_node_unlocked.

_apply_effect(effect: Dictionary, source_planet: String):
- "unlock_tech": call unlock_tech on target (chain).
- "emit_event": push to GameState.culture_event_queue, emit EventBus.culture_event_triggered.
- "spillover_unlock": notify target planet's tech availability. Emit culture_event_triggered with spillover CE id.
- "apply_terraforming_choice": call TerraformingSystem.apply_choice(planet, choice_id, permanent).
- "tag_decision": increment GameState.naturalist_decisions or architect_decisions.

get_available_techs(planet_id: String) -> Array[Dictionary]:
- All nodes for this planet where prerequisites met and not yet completed.

Static typing throughout.
```

---

## `src/ui/planet_panel/TechTreeUI.gd`

```
Create src/ui/planet_panel/TechTreeUI.gd for Helioscape.

Responsibility: render the tech tree for a planet. Handle node clicks → TechTreeSystem. Never modify GameState directly.

@export var planet_id: String = ""

_ready(): _build_tree(). Connect EventBus.tech_node_unlocked to _on_tech_unlocked.

_build_tree(): load nodes via DataManager.get_tech_tree_for(planet_id). Instantiate a button per node. Call _update_node_visual(node_id) for each.

_update_node_visual(node_id: String):
Visibility rules: unlocked = full colour; one prereq away = muted; two prereqs away = silhouette; further = hidden.

_on_node_clicked(node_id: String): call TechTreeSystem.unlock_tech(planet_id, node_id). Refresh.
_on_tech_unlocked(pid: String, _nid: String): return early if pid != planet_id. Refresh.

No get_node() paths longer than one level.
```

---

# PHASE 7 — Research System

---

## `src/systems/ResearchSystem.gd`

```
Create src/systems/ResearchSystem.gd for Helioscape.

Responsibility: RP capacity management, active research tracks, track completion, track pausing.

[→ Copilot: add a comment explaining that research tracks are paused, never cancelled. When a track is paused, its progress_years is preserved and its rp_cost capacity is freed. When resumed, it re-occupies capacity and continues from where it left off. Information gathered in a research is never discarded.]

Connects to: EventBus.game_year_ticked.
Modifies: GameState.active_research, GameState.used_rp_capacity, GameState.completed_techs.
Emits: EventBus.research_track_completed, EventBus.research_track_paused, EventBus.research_track_resumed.

_ready(): connect to EventBus.game_year_ticked.

_on_year_ticked(_year: float):
- For each track in GameState.active_research where is_paused == false:
  - Increment progress_years by 1.
  - If progress_years >= track duration: call _complete_track(track).

_complete_track(track: Dictionary):
- Remove from GameState.active_research.
- Subtract rp_cost from GameState.used_rp_capacity.
- Add track_id to GameState.completed_techs.
- Process on_complete_effects.
- Emit EventBus.research_track_completed.emit(track.track_id).

can_start_track(track_id: String) -> bool:
- prerequisite_tech is in GameState.completed_techs.
- Track not already active or completed.
- used_rp_capacity + track.rp_cost <= total_rp_capacity.

start_track(track_id: String, planet_id: String) -> void:
- Guard: return if not can_start_track.
- Check if track already exists in active_research with is_paused == true → just resume it instead.
- Else add { "track_id": track_id, "planet_id": planet_id, "progress_years": 0.0, "is_paused": false }.
- Add rp_cost to used_rp_capacity.

pause_track(track_id: String) -> void:
- Find the track entry in GameState.active_research.
- Set is_paused = true.
- Subtract rp_cost from used_rp_capacity (capacity freed while paused).
- Emit EventBus.research_track_paused.emit(track_id).

resume_track(track_id: String) -> void:
- Find the paused track entry.
- Check can_resume: used_rp_capacity + track.rp_cost <= total_rp_capacity.
- If ok: set is_paused = false. Add rp_cost back to used_rp_capacity.
- Emit EventBus.research_track_resumed.emit(track_id).

Static typing throughout.
```

---

## `src/ui/planet_panel/ResearchUI.gd`

```
Create src/ui/planet_panel/ResearchUI.gd for Helioscape.

Responsibility: display active, paused, available, and completed research tracks. Allow starting, pausing, and resuming tracks. Never modify GameState directly.

@export var planet_id: String = ""

_ready(): connect EventBus.research_track_completed, research_track_paused, research_track_resumed to _refresh. Call _refresh().

_refresh():
- Load all tracks for planet via DataManager.get_research_tracks_for(planet_id).
- Separate into: active (running, not paused), paused, available-to-start, completed.
- Render each group with appropriate controls:
  - Running track: progress bar, years remaining estimate, Pause button.
  - Paused track: progress bar (frozen), progress % label, Resume button (greyed if no RP capacity).
  - Available: Start button, rp_cost, duration_years, description.
  - Completed: greyed entry with completion year.

RP display: "X / Y RP in use". If a paused track's rp_cost would put the player over capacity on resume, show a tooltip on the Resume button explaining why it's disabled.

Years remaining estimate: (track.duration_years - progress_years) formatted as "~{n} years".

_on_start_clicked(track_id): ResearchSystem.start_track(track_id, planet_id). Refresh.
_on_pause_clicked(track_id): ResearchSystem.pause_track(track_id). Refresh.
_on_resume_clicked(track_id): ResearchSystem.resume_track(track_id). Refresh.

Cache all node refs in _ready(). No get_node() paths longer than one level.
```

---

# PHASE 8 — Terraforming System

---

## `src/systems/TerraformingSystem.gd`

```
Create src/systems/TerraformingSystem.gd for Helioscape.

Responsibility: manage planet terraforming state. Process active choices each year tick. Update planet atmospheric data. Emit visual param updates.

[→ Copilot: add a comment explaining the core design principle: terraforming is driven by choices, not exclusive paths. A player can apply multiple choices to the same planet (e.g. orbital mirrors + magnetic umbrella on Mars). Each choice has its own rate contribution to terraforming progress. Some choices conflict permanently (e.g. polar_detonation excludes early dome colonisation for a radiation_clear_years window). The "active_path" concept from earlier versions of this codebase does NOT exist — use terraforming_choices instead.]

Connects to: EventBus.game_year_ticked, EventBus.tech_node_unlocked.
Modifies: GameState.planets[planet_id] (terraforming_phase, progress, atmosphere data, visual_params).
Emits: EventBus.terraforming_phase_changed, EventBus.planet_visual_params_changed.

--- Rate constants (tune after playtesting) ---
Nested Dictionaries: CHOICE_RATES[planet_id][choice_id] = { "pressure_rate": float, "temp_rate": float, "phase_contribution": float }
Example: CHOICE_RATES["mars"]["mars_polar_detonation"] = { "pressure_rate": 0.0002, "temp_rate": 0.5, "phase_contribution": 0.4 }
Multiple choices combine additively.

--- Conflict rules ---
CHOICE_CONFLICTS: Dictionary mapping choice_id -> array of choice_ids it locks out.
Example: "mars_polar_detonation" locks out "mars_aerogel_domes_early" for radiation_clear_years.

func _ready() -> void:
    _initialise_planet_states()
    EventBus.game_year_ticked.connect(_on_year_ticked)
    EventBus.tech_node_unlocked.connect(_on_tech_unlocked)

func _initialise_planet_states() -> void:
    # For each planet in DataManager.get_all_planets(), copy initial_state data into GameState.planets[planet_id] if not already present (don't overwrite a loaded save).

func _on_year_ticked(year: float) -> void:
    for planet_id in GameState.planets:
        _tick_planet(planet_id, year)

func _tick_planet(planet_id: String, year: float) -> void:
    var planet: Dictionary = GameState.planets[planet_id]
    var choices: Dictionary = planet.get("terraforming_choices", {})

    # Accumulate contributions from all active choices.
    var total_phase_contribution: float = 0.0
    var pressure_delta: float = 0.0
    var temp_delta: float = 0.0

    for choice_id in choices:
        if choices[choice_id].get("active", false):
            var rates: Dictionary = CHOICE_RATES.get(planet_id, {}).get(choice_id, {})
            total_phase_contribution += rates.get("phase_contribution", 0.0)
            pressure_delta += rates.get("pressure_rate", 0.0)
            temp_delta += rates.get("temp_rate", 0.0)

    # Update atmospheric data.
    planet["atmosphere_pressure"] += pressure_delta
    planet["temperature_celsius"] += temp_delta
    planet["terraforming_progress"] += total_phase_contribution

    # Phase advance.
    if planet["terraforming_progress"] >= 1.0:
        _advance_phase(planet_id)

    # Radiation clearance for Mars polar detonation.
    if planet_id == "mars" and GameState.mercury_radiation_clear_year > 0.0:
        if year >= GameState.mercury_radiation_clear_year:
            GameState.mercury_radiation_clear_year = 0.0
            # Radiation cleared — dome colonisation unblocked. Push CE.
            GameState.culture_event_queue.append("ce_mars_radiation_cleared")

    # Compute and emit visual params.
    _emit_visual_params(planet_id)

func _advance_phase(planet_id: String) -> void:
    GameState.planets[planet_id]["terraforming_phase"] += 1
    GameState.planets[planet_id]["terraforming_progress"] = 0.0
    var new_phase: int = GameState.planets[planet_id]["terraforming_phase"]
    EventBus.terraforming_phase_changed.emit(planet_id, new_phase)
    GameState.culture_event_queue.append(_get_phase_event_id(planet_id, new_phase))
    EventBus.culture_event_triggered.emit(_get_phase_event_id(planet_id, new_phase))

func _emit_visual_params(planet_id: String) -> void:
    # Compute the correct shader params for the current planet state and emit.
    # This is called every tick — PlanetVisual.gd applies a 2-second Tween to smooth the result.
    var planet: Dictionary = GameState.planets[planet_id]
    var phase: int = planet.get("terraforming_phase", 0)
    var progress: float = planet.get("terraforming_progress", 0.0)
    var pressure: float = planet.get("atmosphere_pressure", 0.0)

    var params: Dictionary = {}

    # Compute per-planet visual params from atmospheric data.
    match planet_id:
        "mars":
            params["water_growth_radius"] = _mars_water_radius(pressure, phase)
            params["water_opacity"] = clampf(float(phase - 1) / 3.0, 0.0, 1.0)
            params["green_growth_radius"] = _mars_green_radius(pressure, phase)
            params["green_opacity"] = clampf(float(phase - 2) / 2.0, 0.0, 1.0)
            params["lava_opacity"] = _mars_lava_opacity(planet)
            params["lava_hue_shift"] = planet.get("lava_hue_shift", 0.0)
            params["cloud_opacity"] = clampf(pressure / 0.5, 0.0, 0.7)
            params["atmosphere_density"] = clampf(pressure / 1.0, 0.05, 0.35)
            params["atmosphere_color"] = _mars_atmosphere_color(pressure)
            params["cloud_rotation_speed"] = clampf(pressure / 0.3, 0.0, 0.001)
        "venus":
            # Venus: atmosphere_tint alpha decreases as pressure drops. Surface exposed more.
            params["atmosphere_density"] = clampf(planet["atmosphere_pressure"] / 92.0, 0.2, 0.95)
            params["atmosphere_color"] = _venus_atmosphere_color(planet["atmosphere_pressure"], planet["temperature_celsius"])
            params["water_opacity"] = clampf((planet["temperature_celsius"] - 0.0) / -50.0, 0.0, 1.0)  # water appears below 0°C zones
            params["cloud_rotation_speed"] = clampf(planet["atmosphere_pressure"] / 92.0 * 0.012, 0.004, 0.012)
            params["axis_spin_speed"] = 0.9 if GameState.europa_impacted else 0.004
        "earth":
            params["city_lights_intensity"] = clampf(GameState.kardashev_level / 1.5, 0.0, 1.0)
        _:
            pass

    # Store computed params in GameState so save/load can restore them instantly.
    GameState.planets[planet_id]["visual_params"] = params
    EventBus.planet_visual_params_changed.emit(planet_id, params)

func apply_choice(planet_id: String, choice_id: String, permanent: bool) -> void:
    # Called by TechTreeSystem when a tech with apply_terraforming_choice effect is unlocked.
    if not GameState.planets.has(planet_id):
        return
    var choices: Dictionary = GameState.planets[planet_id].get("terraforming_choices", {})

    # Check conflicts.
    var locked: Array = GameState.planets[planet_id].get("locked_out_choices", [])
    if choice_id in locked:
        push_warning("Attempted to apply locked-out choice: " + choice_id)
        return

    choices[choice_id] = { "active": true, "started_year": GameState.game_year, "permanent": permanent }
    GameState.planets[planet_id]["terraforming_choices"] = choices

    # Handle special permanent effects.
    if choice_id == "mars_polar_detonation":
        GameState.mercury_radiation_clear_year = GameState.game_year + 40.0
        GameState.planets["mars"]["locked_out_choices"].append("mars_aerogel_domes_early")
        # [→ Copilot: add a comment explaining that polar detonation creates a 40-year radiation window that blocks early dome colonisation. This is a permanent physical consequence — the choice entry has permanent: true.]

    if choice_id == "venus_europa_impact":
        GameState.europa_mission_authorised = true
        GameState.europa_impact_year = GameState.game_year + randf_range(50.0, 70.0)
        # [→ Copilot: explain: the Europa impactor takes decades to arrive via gravity assist sequences. The impact year is set now but the event fires much later in CultureEventSystem.]

    EventBus.terraforming_choice_applied.emit(planet_id, choice_id)

func _on_tech_unlocked(planet_id: String, node_id: String) -> void:
    # TechTreeSystem handles apply_terraforming_choice effects directly via _apply_effect.
    # This handler can check for any additional terraforming side effects not captured in tech data.
    pass

# Helper: return a culture event id for a planet reaching a given phase.
func _get_phase_event_id(planet_id: String, phase: int) -> String:
    return "ce_%s_phase_%d" % [planet_id, phase]

# Helper functions for per-planet visual param computation.
# Each takes atmospheric data and returns a shader param value.
func _mars_water_radius(pressure: float, phase: int) -> float:
    return clampf((pressure - 0.01) / 0.4 * 0.6, 0.0, 0.6)

func _mars_green_radius(pressure: float, phase: int) -> float:
    return clampf((pressure - 0.1) / 0.5 * 0.5, 0.0, 0.5)

func _mars_lava_opacity(planet: Dictionary) -> float:
    var choices: Dictionary = planet.get("terraforming_choices", {})
    var detonation_active: bool = choices.has("mars_polar_detonation") and choices["mars_polar_detonation"].get("active", false)
    # Lava opacity peaks soon after detonation then declines as lava cools.
    if not detonation_active:
        return 0.0
    var years_since: float = GameState.game_year - choices["mars_polar_detonation"].get("started_year", 0.0)
    return clampf(1.0 - (years_since / 80.0), 0.0, 1.0)

func _mars_atmosphere_color(pressure: float) -> Color:
    return Color(0.8, 0.4, 0.27).lerp(Color(0.27, 0.53, 1.0), clampf(pressure / 0.8, 0.0, 1.0))

func _venus_atmosphere_color(pressure: float, temperature: float) -> Color:
    var hot_color: Color = Color(1.0, 0.8, 0.27)   # thick yellow-orange CO2
    var cool_color: Color = Color(0.67, 0.87, 1.0)  # cool blue-white
    return hot_color.lerp(cool_color, clampf(1.0 - (pressure / 92.0), 0.0, 1.0))
```

---

# PHASE 9 — Culture Event System

---

## `src/systems/CultureEventSystem.gd`

```
Create src/systems/CultureEventSystem.gd for Helioscape.

Responsibility: monitor event queue, fire events, check time-based triggers, append history.

[→ Copilot: add a comment explaining that multiple events may be queued on the same game tick (e.g. a tech completes and a Dyson milestone is crossed simultaneously). All events are pushed to GameState.culture_event_queue. CultureEventCard displays them one at a time as the player reads and dismisses. The queue is never lost between saves — it is part of GameState.]

Connects to: EventBus.game_year_ticked, EventBus.kardashev_milestone_reached, EventBus.tech_node_unlocked, EventBus.terraforming_phase_changed, EventBus.terraforming_choice_applied, EventBus.dyson_energy_updated.

_ready(): connect all signals above.

_on_year_ticked(year: float):
    # Check year-based triggers.
    _check_year_triggers(year)
    # Check Europa warning window.
    if GameState.europa_mission_authorised and not GameState.europa_impacted:
        var years_to_impact: float = GameState.europa_impact_year - year
        if years_to_impact <= 15.0 and years_to_impact > 14.0:  # fire once, at the 15yr mark
            _push_event("ce_europa_warning")
        if year >= GameState.europa_impact_year:
            GameState.europa_impacted = true
            _push_event("ce_europa_impact")

_on_milestone_reached(milestone_id: String):
    # Find CE entries with trigger.type == "milestone_reached" and trigger.milestone_id matching.
    _check_trigger_type("milestone_reached", { "milestone_id": milestone_id })

_on_tech_unlocked(planet_id: String, node_id: String):
    _check_trigger_type("tech_completed", { "tech_id": node_id })

_on_phase_changed(planet_id: String, phase: int):
    _check_trigger_type("terraforming_phase_changed", { "planet": planet_id, "phase": phase })

_on_choice_applied(planet_id: String, choice_id: String):
    _check_trigger_type("terraforming_choice_applied", { "planet": planet_id, "choice_id": choice_id })

_on_dyson_updated(watts: float):
    var percent: float = GameState.dyson_coverage_percent
    for threshold in [10, 25, 50, 100]:
        if percent >= float(threshold):
            var event_id: String = "ce_dyson_%d_percent" % threshold
            if not _already_fired(event_id):
                _push_event(event_id)

_check_trigger_type(trigger_type: String, match_params: Dictionary):
    # Iterate all culture events from DataManager. Find matching triggers. Push if not already fired.
    pass  # [→ Copilot: implement — iterate DataManager cached culture_events, check trigger.type matches, then check relevant trigger fields against match_params]

_push_event(event_id: String):
    if _already_fired(event_id):
        return
    GameState.culture_event_queue.append(event_id)
    _record_history(event_id)
    EventBus.culture_event_triggered.emit(event_id)

_already_fired(event_id: String) -> bool:
    # Check GameState.culture_event_history for this event_id.
    for entry in GameState.culture_event_history:
        if entry.get("event_id") == event_id:
            return true
    return false

_record_history(event_id: String):
    GameState.culture_event_history.append({
        "event_id": event_id,
        "year": GameState.game_year,
        "planet_context": GameState.orrery_zoomed_planet
    })

_check_year_triggers(year: float):
    # [→ Copilot: check all culture events with trigger.type == "year_reached". Push if year >= trigger.year and not already fired.]
    pass
```

---

## `src/ui/culture_events/CultureEventCard.gd`

```
Create src/ui/culture_events/CultureEventCard.gd for Helioscape.

Responsibility: display a single culture event. Show portrait vignette, title, narrator text (1–3 paragraphs), choices if any.

[→ Copilot: add a comment noting that narrator_text in culture_events.json is stored as a single string with paragraph breaks ("\n\n"). The UI renders this as multiple RichTextLabel paragraphs or a single RichTextLabel with BBCode. Either approach is valid — choose the one that renders cleanly in Godot 4.]

Connects to: EventBus.culture_event_triggered.

In _ready(): connect signal. Hide self (visible = false by default).

_on_event_triggered(event_id: String):
    var event: Dictionary = DataManager.get_culture_event(event_id)
    $PortraitTexture.texture = load(event.portrait)
    $TitleLabel.text = event.title
    # Display narrator_text with a typewriter Tween on RichTextLabel.visible_ratio.
    $NarratorText.text = event.narrator_text
    $NarratorText.visible_ratio = 0.0
    var tween: Tween = create_tween()
    var duration: float = clampf(float(event.narrator_text.length()) * 0.03, 2.0, 8.0)
    tween.tween_property($NarratorText, "visible_ratio", 1.0, duration)
    # Clicking anywhere on the card skips the typewriter instantly.
    _build_choices(event.choices)
    visible = true

_build_choices(choices: Array):
    # Clear existing choice buttons. If choices is empty, show a "Continue" button.
    # For each choice: create a Button with choice.label. On click: call _on_choice_made(event_id, choice.id).
    pass

_on_choice_made(event_id: String, choice_id: String):
    EventBus.culture_event_choice_made.emit(event_id, choice_id)
    _dismiss()

_dismiss():
    visible = false
    # Tell CultureEventQueue to show the next queued event, if any.
    pass

Layout: left side = portrait vignette (3:4 aspect ratio, ~35% of card width). Right side = title, narrator text, choices stacked vertically. Dark background, warm amber/orange accents. Monospaced font. Base 14px font size.

Keyboard: Enter or Space dismisses / confirms default choice. Tab cycles between choice buttons.

Cache all child node refs in _ready(). No get_node() paths longer than one level.
```

---

## `src/ui/culture_events/CultureEventQueue.gd`

```
Create src/ui/culture_events/CultureEventQueue.gd for Helioscape.

Responsibility: toast notification system, bell icon with unread count, coordination with CultureEventCard for sequential display.

[→ Copilot: add a comment explaining that CultureEventQueue does NOT automatically open CultureEventCard — it shows toast notifications and updates the bell icon. The player chooses when to open queued events by clicking the bell or the toast. This preserves the "culture events do not pause the game" design: the player reads at their own pace.]

var unread_count: int = 0
var queued_event_ids: Array = []  # local copy of queue for UI purposes

_ready(): connect EventBus.culture_event_triggered to _on_event_triggered.

_on_event_triggered(event_id: String):
    unread_count += 1
    queued_event_ids.append(event_id)
    _update_bell_icon()
    _show_toast(event_id)

_show_toast(event_id: String):
    var event: Dictionary = DataManager.get_culture_event(event_id)
    # Show a toast at bottom-left: event title + small icon. Slide in, stay 8s, fade out.
    # Toast is clickable: clicking opens CultureEventCard for this event_id.
    # Multiple simultaneous toasts stack vertically (each slides in above the previous).
    pass

_update_bell_icon():
    $BellIcon/UnreadBadge.text = str(unread_count) if unread_count > 0 else ""
    $BellIcon/UnreadBadge.visible = unread_count > 0

open_event_card(event_id: String):
    $CultureEventCard._on_event_triggered(event_id)
    queued_event_ids.erase(event_id)
    unread_count = max(0, unread_count - 1)
    _update_bell_icon()

# Bell icon click → show a simple dropdown list of queued event titles.
_on_bell_clicked():
    # Show/hide a VBoxContainer listing queued events. Each row: title + "Read" button.
    pass

after_card_dismissed():
    # Called by CultureEventCard when player dismisses. No auto-next — player controls pacing.
    pass
```

---

# PHASE 10 — Dyson System

---

## `src/systems/DysonSystem.gd`

```
Create src/systems/DysonSystem.gd for Helioscape.

Responsibility: panel accumulation, energy output, milestone triggers, updating swarm shader.

[→ Copilot: add a comment explaining the visual design: the Dyson swarm is a large transparent sphere around the Sun with procedural pixel clusters. DysonSystem.gd drives two shader parameters: dyson_coverage on the DysonSwarm.gdshader (0.0–1.0) and sun_dim_factor on the Sun mesh material (0.0 = full brightness, 1.0 = fully dimmed). Both are set each tick via set_shader_parameter.]

Connects to: EventBus.game_year_ticked.
Modifies: GameState.dyson_energy_watts, GameState.dyson_panel_count, GameState.dyson_coverage_percent.
Emits: EventBus.dyson_energy_updated.

const ENERGY_PER_BASIC_PANEL: float = 1e12
const ENERGY_PER_MID_PANEL: float = 2.5e12
const ENERGY_PER_HARDENED_PANEL: float = 5e12
const PANELS_PER_YEAR_BASE: int = 2
const TOTAL_PANELS_FOR_100_PERCENT: int = 1000

# References to shader materials (set in _ready via scene reference)
var dyson_sphere_material: ShaderMaterial
var sun_material: ShaderMaterial

_ready():
    EventBus.game_year_ticked.connect(_on_year_ticked)
    # Cache material refs from the Sun scene node.
    # [→ Copilot: these node references will depend on the Main.tscn scene structure. Add a comment suggesting using @onready with the exact node path once the scene is set up, and a fallback to get_node() from Main.]

_on_year_ticked(_year: float):
    # Add panels (subject to Mercury common_ore availability).
    var ore_available: float = GameState.mercury_resources.get("common_ore", 0.0)
    var panels_this_year: int = PANELS_PER_YEAR_BASE if ore_available > 0.5 else 0
    GameState.mercury_resources["common_ore"] -= min(ore_available, float(panels_this_year) * 0.1)
    GameState.dyson_panel_count += panels_this_year

    # Recompute energy.
    var energy_per_panel: float = ENERGY_PER_BASIC_PANEL
    match GameState.dyson_panel_tier:
        "mid": energy_per_panel = ENERGY_PER_MID_PANEL
        "hardened": energy_per_panel = ENERGY_PER_HARDENED_PANEL
    GameState.dyson_energy_watts = float(GameState.dyson_panel_count) * energy_per_panel
    GameState.dyson_coverage_percent = float(GameState.dyson_panel_count) / float(TOTAL_PANELS_FOR_100_PERCENT) * 100.0

    # Update shaders.
    var coverage_01: float = clampf(GameState.dyson_coverage_percent / 100.0, 0.0, 1.0)
    if dyson_sphere_material:
        dyson_sphere_material.set_shader_parameter("dyson_coverage", coverage_01)
    if sun_material:
        sun_material.set_shader_parameter("sun_dim_factor", coverage_01 * 0.35)
        # [→ Copilot: explain the 0.35 cap: even at full swarm, Earth's sunlight is explicitly protected per the GDD. The sun visually dims by up to 35% from the player's perspective, not 100%.]

    EventBus.dyson_energy_updated.emit(GameState.dyson_energy_watts)

    # Milestone thresholds.
    for threshold in [10, 25, 50, 100]:
        if GameState.dyson_coverage_percent >= float(threshold):
            var key: String = "dyson_%d_triggered" % threshold
            if not GameState.completed_milestones.has(key):
                GameState.completed_milestones.append(key)
                # CultureEventSystem listens to dyson_energy_updated and handles CE pushing.

    # CME event (Basic tier only) — low probability, destroys small % of panels.
    if GameState.dyson_panel_tier == "basic" and randf() < 0.005:
        var destroyed: int = int(float(GameState.dyson_panel_count) * 0.02)
        GameState.dyson_panel_count -= destroyed
        GameState.culture_event_queue.append("ce_cme_hit_swarm")
        # [→ Copilot: explain: 0.5% chance per game year = roughly one CME event per 200 years. 2% panel loss is flavour, not punishing.]

upgrade_tier(new_tier: String) -> void:
    GameState.dyson_panel_tier = new_tier
    # Recompute energy on next tick.
```

---

# PHASE 11 — Save/Load

*(SaveManager.gd is covered in Phase 2 — carry forward from v1)*

---

# PHASE 12 — Kardashev System

*(Unchanged from v1 — carry forward)*

```
Create src/systems/KardashevSystem.gd for Helioscape.

Connects to: EventBus.game_year_ticked, EventBus.research_track_completed, EventBus.dyson_energy_updated, EventBus.terraforming_phase_changed.
Modifies: GameState.kardashev_level, GameState.completed_milestones.
Emits: EventBus.kardashev_milestone_reached.

_check_all_milestones(): for each milestone in DataManager, skip if completed, call _check_conditions().

Condition checkers: deuterium_fusion_online, dyson_15/50/100_percent, two_habitable_worlds, first_self_sustaining_colony, interstellar_seed_ship_launched.

Kardashev level: update continuously based on dyson_energy_watts (logarithmic scale toward Type 2). Approx: K_level = 0.73 + (dyson_coverage_percent / 100.0) * 1.27.

At first_era_complete: compute naturalist_ratio = naturalist_decisions / (naturalist + architect). Store in GameState. Push summary CE.
```

---

# Planet logic files

---

## `src/planets/PlanetBase.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/planets/PlanetBase.gd. Extends Node. Base class for all planet scripts. Defines the shared interface. No logic beyond establishing the contract.

var planet_id: String = ""  — must be set by child.
get_terraforming_display_name(phase: int) -> String: override in child.
get_current_phase_description() -> String: override in child.
get_unlock_condition() -> String: override in child.
is_unlocked() -> bool: check GameState.completed_techs for unlock_condition tech.

_ready(): assert planet_id != "".
```

---

## `src/planets/EarthPlanet.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/planets/EarthPlanet.gd. Extends PlanetBase. planet_id = "earth".

Always unlocked. No terraforming phases.

get_terraforming_display_name(_phase: int) -> String: return "Home World".
get_current_phase_description() -> String: based on completed Earth techs, return a narrator-voice description of Earth's current state.
is_unlocked() -> bool: return true.
get_kardashev_description() -> String: map GameState.kardashev_level ranges to human-readable strings.
get_moon_research_summary() -> Dictionary: return { active, completed, available } track counts for Moon.
```

---

## `src/planets/MercuryPlanet.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/planets/MercuryPlanet.gd. Extends PlanetBase. planet_id = "mercury".

get_unlock_condition() -> String: return "earth_launch_mercury_mission".
get_terraforming_display_name(phase: int) -> String: Phase 0: "Initial Landing", Phase 1: "Industrial Expansion", Phase 2: "Full Production".
get_current_phase_description() -> String: narrator voice, one sentence, based on GameState.mercury_phase.
get_resource_rates() -> Dictionary: current accumulation rates per resource.
get_dyson_output_summary() -> String: human-readable panel count and wattage.
is_unlocked() -> bool: check "earth_launch_mercury_mission" in GameState.completed_techs.
```

---

## `src/planets/MarsPlanet.gd`

```
Create src/planets/MarsPlanet.gd. Extends PlanetBase. planet_id = "mars".

get_unlock_condition() -> String: return "mercury_phase_2_complete".

[→ Copilot: add a comment explaining that Mars has no single "active_path". Instead, get_active_choices() returns the set of choices the player has applied so far. Phase display names are derived from the combination of active choices, not from a single path variable.]

get_active_choices() -> Array:
    var choices: Dictionary = GameState.planets.get("mars", {}).get("terraforming_choices", {})
    var active: Array = []
    for choice_id in choices:
        if choices[choice_id].get("active", false):
            active.append(choice_id)
    return active

get_terraforming_display_name(phase: int) -> String:
    var active: Array = get_active_choices()
    match phase:
        0: return "Frozen Desert"
        1: return "Atmospheric Seeding"
        2:
            if "mars_polar_detonation" in active: return "Post-Detonation Era"
            if "mars_orbital_mirrors" in active: return "Warming Under Mirrors"
            if "mars_magnetic_umbrella" in active: return "Magnetosphere Online"
            return "Warming Begins"
        3: return "First Liquid Water"
        4: return "Emergent Biosphere"
        5: return "Living World"
    return "Phase %d" % phase

get_current_phase_description() -> String:
    # Narrator voice, one sentence, reflecting current phase and active choices.
    # [→ Copilot: write a match statement on terraforming_phase with narrator-voice strings. Reference the active choices where relevant — e.g. if polar_detonation is active in phase 2, mention the radiation.]
    pass

is_unlocked() -> bool:
    return "mercury_phase_2_complete" in GameState.completed_techs

is_dome_colonisation_blocked() -> bool:
    # Returns true if polar detonation radiation window has not yet cleared.
    return GameState.mercury_radiation_clear_year > 0.0 and GameState.game_year < GameState.mercury_radiation_clear_year

get_radiation_clear_year() -> float:
    return GameState.mercury_radiation_clear_year
```

---

## `src/planets/VenusPlanet.gd`

```
Create src/planets/VenusPlanet.gd. Extends PlanetBase. planet_id = "venus".

get_unlock_condition() -> String: return "mercury_phase_2_complete".

[→ Copilot: add a comment explaining Venus's visual layering: the surface texture is rocky gray. The planet's initial yellow-orange appearance comes entirely from the atmosphere_tint uniform in PlanetSurface.gdshader and the Atmosphere shader's high density and warm color. As Venus cools (atmosphere_pressure drops, temperature drops), TerraformingSystem reduces the atmosphere tint alpha and shifts the atmosphere color toward blue-white. Only after cooling and water delivery does the water layer become visible. The green layer appears much later.]

get_active_choices() -> Array:
    # Same pattern as MarsPlanet.get_active_choices() but for venus.
    pass

get_terraforming_display_name(phase: int) -> String:
    var active: Array = get_active_choices()
    match phase:
        0: return "Hellworld — 465°C, 92 atm"
        1: return "Cooling Begins"
        2:
            if "venus_europa_impact" in active: return "Spin-Up In Progress"
            if "venus_orbital_shade_mirror" in active: return "Mirror Deployed"
            if "venus_carbonate_sequestration" in active: return "Carbonate Rain"
            return "Atmospheric Processing"
        3:
            if "venus_sky_cities" in active: return "Cloud City Era"
            return "Surface Accessible"
        4: return "Second Earth"
    return "Phase %d" % phase

get_current_phase_description() -> String:
    # [→ Copilot: narrator voice, one sentence per phase. If venus_europa_impact is active, reference the spin-up. If sky_cities is active, reference life in the clouds.]
    pass

is_unlocked() -> bool:
    return "mercury_phase_2_complete" in GameState.completed_techs

is_europa_crash_available() -> bool:
    # Europa impact can only be authorised before game year 2133 (year 100 in game time).
    return GameState.game_year < 2133.0 and not GameState.europa_mission_authorised

get_europa_eta(current_year: float) -> float:
    if not GameState.europa_mission_authorised:
        return 0.0
    return GameState.europa_impact_year - current_year

get_current_spin_speed() -> float:
    if GameState.europa_impacted:
        return 0.9  # Earth-like spin after impact
    return 0.004    # barely rotating, initial Venus
```

---

# Remaining UI files

---

## `src/ui/planet_panel/PlanetPanel.gd`

```
Create src/ui/planet_panel/PlanetPanel.gd for Helioscape.

Responsibility: container for a planet's detail view (TechTreeUI, ResearchUI, VignetteDisplay). Shown beside the zoomed planet in the orrery. Handles swipe-in/swipe-out animation when switching planets.

[→ Copilot: add a comment explaining the transition: clicking a planet in the side panel triggers a "swipe left" animation on the current planet content, then "swipe right in" for the new planet content. This is a translate Tween on the content container node, not a scene change.]

@export var planet_id: String = ""
var _current_planet_id: String = ""

_ready(): connect EventBus.planet_selected to open. Connect EventBus.terraforming_phase_changed to _refresh_status.

open(new_planet_id: String):
    if new_planet_id == _current_planet_id:
        return
    if _current_planet_id != "":
        _swipe_out()  # animate current content left
        await get_tree().create_timer(0.25).timeout
    _current_planet_id = new_planet_id
    planet_id = new_planet_id
    _populate(new_planet_id)
    _swipe_in()  # animate new content right → centre

_swipe_out():
    var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
    tween.tween_property($ContentContainer, "position:x", -400.0, 0.25)

_swipe_in():
    $ContentContainer.position.x = 400.0
    var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
    tween.tween_property($ContentContainer, "position:x", 0.0, 0.25)

_populate(pid: String):
    var planet_data: Dictionary = DataManager.get_planet(pid)
    $PlanetNameLabel.text = planet_data.get("display_name", pid)
    _refresh_status()
    $TechTreeUI.planet_id = pid
    $ResearchUI.planet_id = pid
    $VignetteDisplay.planet_id = pid
    # Earth: show Moon tab.
    $TabContainer/MoonTab.visible = (pid == "earth")
    # Locked planet: show locked message, hide sub-panels.
    var is_unlocked: bool = GameState.planets.has(pid)
    $LockedMessage.visible = not is_unlocked
    $TabContainer.visible = is_unlocked
    if not is_unlocked:
        $LockedMessage.text = "Humanity hasn't reached this far yet."

_refresh_status():
    # Update phase name and description from the planet's GDScript class.
    pass
```

---

## `src/ui/planet_panel/VignetteDisplay.gd`

```
Create src/ui/planet_panel/VignetteDisplay.gd for Helioscape.

Responsibility: display inspectable location vignettes for a planet. Each planet has a variable number of locations (1 to ~6) that are specific named places — a city skyline, a volcanic plain, an underwater habitat, a forest that grew from a dead plain, etc. Each location has multiple visual states (palette/texture swaps) that crossfade at milestone or phase triggers.

[→ Copilot: add a comment explaining that the number and type of locations varies greatly per planet. Earth might have 4-5 (city, coastline, forest/farmland, night sky, Moon surface as bonus). Mars might have 2-3 initially (barren crater, polar cap, Olympus Mons base) growing to 5 as the planet terraforms. These locations are defined in a data file (data/vignettes.json — to be created separately). This script only handles rendering and transitions.]

@export var planet_id: String = ""
var _current_location_index: int = 0
var _location_states: Dictionary = {}  # location_id -> current_state_index

_ready():
    connect EventBus.terraforming_phase_changed to _on_phase_changed.
    connect EventBus.tech_node_unlocked to _on_tech_unlocked.
    connect EventBus.kardashev_milestone_reached to _on_milestone.
    _load_locations()

_load_locations():
    # Load location data from DataManager (stub get_vignette_data call — data/vignettes.json not yet authored).
    # [→ Copilot: call DataManager.get_vignette_data(planet_id) — this function may not exist yet. Add a null check and early return with a placeholder if the data is absent. This is a forward-compatible stub.]
    pass

_on_phase_changed(changed_planet_id: String, _phase: int):
    if changed_planet_id != planet_id:
        return
    _refresh_all_locations()

_refresh_all_locations():
    # For each location, determine which state index it should show given current GameState.
    # If state index changed: crossfade to new state.
    pass

_crossfade_to_state(location_id: String, state_index: int):
    # Tween alpha of current state TextureRect out, new state TextureRect in simultaneously.
    # Duration: 1.5s, TRANS_SINE.
    # [→ Copilot: each location display should have two TextureRects layered. Crossfade by tweening the alpha of both simultaneously — out-going fades to 0, in-coming fades to 1. This avoids a visible pop between states.]
    pass

_on_location_tab_clicked(location_index: int):
    _current_location_index = location_index
    _show_location(location_index)

_show_location(index: int):
    # Show the vignette for this location at its current state.
    pass
```

---

## `src/ui/hud/HUD.gd`

```
Create src/ui/hud/HUD.gd for Helioscape.

Responsibility: root HUD container. Shows: game year, Kardashev bar, time controls, Mercury resource counters, notification bell, and the always-visible planets panel on the side.

Layout:
- Top bar: year label (left), KardashevBar (centre), TimeControls (right).
- Left or right edge: PlanetsPanel (vertical list of all planets, always visible).
- Bottom-left: CultureEventQueue toast area + bell icon.
- Mercury resource counters: shown in top bar or beneath it, visible only when Mercury Phase 0 complete.

[→ Copilot: add a comment noting that the PlanetsPanel is always visible in the HUD — it does not disappear when a planet is selected or the orrery zooms in. Clicking a planet in PlanetsPanel emits EventBus.planet_selected, which both opens PlanetPanel and triggers the orrery zoom animation in SolarSystemView.]

_ready():
    Cache all child node refs.
    Connect EventBus.game_year_ticked to _on_year_ticked.
    Connect EventBus.resource_accumulation_updated to _on_resources_updated.
    Connect EventBus.dyson_energy_updated to _on_dyson_updated.
    Connect EventBus.mercury_phase_changed to _on_mercury_phase_changed.

_on_year_ticked(year: float):
    $TopBar/YearLabel.text = "Year %d" % int(year)

_on_resources_updated(resource_id: String, amount: float):
    # Update the matching resource counter label.
    pass

_on_mercury_phase_changed(phase: int):
    $TopBar/ResourceCounters.visible = (phase >= 0 and GameState.mercury_resources.get("common_ore", 0.0) > 0.0)

_on_dyson_updated(watts: float):
    # KardashevBar reads GameState.kardashev_level directly on its own tick connection.
    # This hook is for any HUD element that wants to display dyson wattage directly.
    pass
```

---

## `src/ui/hud/PlanetsPanel.gd`

```
Create src/ui/hud/PlanetsPanel.gd for Helioscape.

Responsibility: the always-visible side panel listing all planets. Each planet entry shows: planet name, current terraforming phase name, a small status icon (locked / active / flourishing). Clicking a planet emits EventBus.planet_selected.

All planets are always shown. Locked planets show their name and "Locked" status — no click interaction to open a detail panel (but the click still triggers the orrery to show the planet orbit).

_ready():
    Build planet entries from DataManager.get_all_planets().
    Connect EventBus.planet_selected to _on_planet_selected (highlight active planet).
    Connect EventBus.terraforming_phase_changed to _refresh_entry.

_build_entries():
    For each planet (in display order: Earth, Moon, Mercury, Mars, Venus):
    - Create a button/row node.
    - Set name text, phase name text (from planet GDScript class or DataManager).
    - If locked: dim the entry. Still clickable to zoom orrery to orbit, but PlanetPanel shows locked message.
    - Connect button pressed to: EventBus.planet_selected.emit(planet_id).

_on_planet_selected(planet_id: String):
    # Highlight the selected planet's row. Unhighlight others.
    pass

_refresh_entry(planet_id: String, _phase: int):
    # Update the phase name label for the given planet entry.
    pass

Moon entry: appears indented under Earth. Clicking Moon emits planet_selected("earth") and also sets a flag that PlanetPanel should open at the Moon tab.
```

---

## `src/ui/hud/TimeControls.gd`

```
Create src/ui/hud/TimeControls.gd for Helioscape.

Responsibility: pause/play toggle. That is the ONLY button shown on first playthrough.

[→ Copilot: add a comment explaining that the 5× speed button is NOT shown on the first playthrough at all — not greyed out, not with a tooltip, simply absent. GameState.is_first_playthrough controls this. The design intent is that the player should not know this feature will exist on subsequent playthroughs. On second and later playthroughs, add the 5× button normally. Do NOT add any hint or ghost of the 5× button during the first playthrough.]

_ready():
    _build_controls()
    Connect EventBus.game_year_ticked to _sync_pause_display.

_build_controls():
    # Always show: Pause/Play toggle button.
    # Only show if not first playthrough: Speed toggle button (1× / 5×).
    $SpeedButton.visible = not GameState.is_first_playthrough

_on_pause_pressed():
    TimeManager.toggle_pause()
    _sync_pause_display(GameState.game_year)

_on_speed_pressed():
    if GameState.game_speed == 1:
        TimeManager.set_speed(5)
        $SpeedButton.text = "5×"
    else:
        TimeManager.set_speed(1)
        $SpeedButton.text = "1×"

_sync_pause_display(_year: float):
    $PauseButton.text = "▶" if GameState.is_paused else "⏸"
```

---

## `src/ui/hud/KardashevBar.gd`

*(Unchanged from v1 — carry forward)*

```
Create src/ui/hud/KardashevBar.gd for Helioscape.

Connects to EventBus.game_year_ticked (reads GameState.kardashev_level), EventBus.kardashev_milestone_reached (pulse marker).

_set_level(level: float): animate bar fill with a 0.8s Tween. Update label "K {level:.2f}".

Milestone markers at K1.0 (Type I), ~K1.5 (First Era), K2.0 (Type II). On reached: pulse warm white.

Bar fills amber/warm orange on dark background. Bar should feel like it's continuously, slowly creeping — not jumping.
```

---

## Scene structure notes

```
Note: .tscn files are built in the Godot editor. These are the expected node structures for your reference when building scenes manually.

scenes/Main.tscn:
- Main (Node)
  - Systems (Node)
    - TechTreeSystem, ResearchSystem, ResourceSystem, TerraformingSystem, DysonSystem, CultureEventSystem, KardashevSystem
  - UI (CanvasLayer)
    - HUD (contains PlanetsPanel, TimeControls, KardashevBar, resource labels, year label)
    - CultureEventQueue (persistent — toasts + bell)
    - CultureEventCard (hidden by default, shown on event)
    - PlanetPanel (shown when orrery zooms in to a planet)
  - SolarSystemViewport (SubViewport → PixelFilter post-process)
    - SolarSystem (SolarSystemView.gd root)
      - Sun (MeshInstance3D + sun_material with sun_dim_factor uniform)
      - DysonSwarm (MeshInstance3D — large sphere around Sun, DysonSwarm.gdshader)
      - Camera3D (fixed angle)
      - [PlanetOrbit rings — static]
      - [PlanetView instances — orbit dynamically in SolarSystemView._process]

scenes/planets/PlanetView.tscn:
- PlanetView (Node3D) — PlanetVisual.gd attached here
  - PlanetSphere (MeshInstance3D — SphereMesh, PlanetSurface.gdshader)
    - ClickArea (Area3D + SphereShape3D — slightly larger than visual sphere)
  - AtmosphereShell (MeshInstance3D — slightly larger sphere, Atmosphere.gdshader)

Ask Copilot to help scaffold the GDScript for programmatic scene setup if you prefer code-first.
```

---

## Project setup

```
Help me configure a new Godot 4 project for Helioscape.

1. Register autoloads in this exact order:
   DataManager → res://src/autoloads/DataManager.gd
   GameState → res://src/autoloads/GameState.gd
   EventBus → res://src/autoloads/EventBus.gd
   TimeManager → res://src/autoloads/TimeManager.gd
   SaveManager → res://src/autoloads/SaveManager.gd

2. Main scene: res://scenes/Main.tscn.

3. Renderer: Forward+. Enable HDR.

4. SubViewport setup for the pixel filter: explain how to set up a SubViewport that captures the entire 3D SolarSystem scene and feeds into a TextureRect (in the UI CanvasLayer) with PixelFilter.gdshader applied as a CanvasItemMaterial. The 3D scene renders to the SubViewport; the TextureRect displays it pixelated; UI elements (HUD, panels) sit in a separate CanvasLayer on top and are NOT pixelated.

5. Do NOT enable pixel snap in Project Settings — the pixel art look is purely post-process.

6. Input map actions:
   ui_pause → Space
   ui_speed_toggle → Tab
   ui_open_history → H
   ui_zoom_out → Escape (returns orrery to overview)

7. Provide the project.godot settings diff or manual steps.
```

---

*End of prompts — v2. Work top to bottom. One Copilot task per prompt. One file per task.*
