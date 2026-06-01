# Helioscape — Cursor Prompts per File
> Ordered by Phase 1 build sequence. Each prompt is self-contained — copy/paste one at a time into Cursor.
> Keep ARCHITECTURE.md and helioscape-gdd-caveman-architecture.md in Cursor context for every prompt.

---

## Architecture rules (prepend mentally to every prompt)
> These rules apply to every file in this project:
> 1. Data lives in JSON — no content hardcoded in GDScript.
> 2. Logic never talks to UI — systems emit signals, UI reads state.
> 3. One file, one job.
> GDScript 4 static typing always. Signals over direct calls. Constants UPPER_SNAKE_CASE, variables snake_case, classes PascalCase. Comments explain *why*, not what. No `get_node()` paths longer than one level in UI scripts.

---

## PHASE 1 — Data loading

---

### `data/planets.json`

```
Create data/planets.json for Helioscape following the schema in ARCHITECTURE.md.

Include all four planets: earth, mercury, mars, venus. Each entry must follow the exact schema already defined in the architecture (id, display_name, unlock_condition, initial_state, visual with base_color + layer_textures + water_spot_uvs + green_spot_uvs, terraforming_paths array).

Game design context:
- Earth: always unlocked from start (no unlock_condition). No terraforming paths (it's the home world). No water/green spots needed — leave as empty arrays.
- Mercury: unlocked by earth tech node "earth_launch_mercury_mission". No water/green spots (industrial world). terraforming_paths: []. initial_state: temperature_celsius: 430 (day side), atmosphere_pressure: 0.
- Mars: unlock_condition "mercury_phase_2". terraforming_paths: ["mars_path_a", "mars_path_b", "mars_path_c"]. initial_state: atmosphere_pressure 0.006, temperature_celsius -60, terraforming_phase 0. water_spot_uvs and green_spot_uvs: 5 and 3 UV points respectively (approximate realistic positions — northern lowlands for water, Hellas basin area).
- Venus: unlock_condition "mercury_phase_2". terraforming_paths: ["venus_path_a", "venus_path_b", "venus_path_c"]. initial_state: atmosphere_pressure 92.0, temperature_celsius 465, terraforming_phase 0. No water spots initially (no liquid water at game start). 3 green_spot_uvs for late-stage vegetation.

Texture paths follow the pattern res://assets/textures/planets/{planet}_{layer}.png with layers: surface, water, green, cloud.

Output only the JSON file — no GDScript.
```

---

### `data/resources.json`

```
Create data/resources.json for Helioscape.

This file defines the three Mercury ore types used by the resource economy. Each resource has: id, display_name, description, rarity ("common" | "rare" | "volatile"), base_accumulation_rate (units per game-year at base mining level), and a color hex for UI display.

Resources:
1. common_ore — iron/silicon/aluminium. Abundant. Used for all standard construction including Dyson panels. base_accumulation_rate: 10.
2. rare_metals — titanium/chromium. Found only in specific crater deposits. Used for advanced components and mid/high-tier Dyson panels. base_accumulation_rate: 3.
3. polar_volatiles — water ice and carbon compounds from Mercury polar regions. Used for life support, organic chemistry, and chemical rocket propellant (water electrolysis → H₂/O₂). base_accumulation_rate: 2.

Keep it minimal — this is a data definition file, not a schema document.
```

---

### `data/kardashev_milestones.json`

```
Create data/kardashev_milestones.json for Helioscape.

Each milestone entry has: id, display_name, description (one sentence, narrator-voice "we"), conditions (array of condition objects), approximate_year_range (string), and effects (array).

Four milestones:
1. type_1 — "Type I Civilisation". Conditions: ["deuterium_fusion_online", "dyson_15_percent"]. ~Year 80-120. Effect: unlock mid-tier Dyson panels, emit CE "ce_type1_reached".
2. first_era_complete — "First Era Complete". Conditions: ["two_habitable_worlds", "first_self_sustaining_colony", "dyson_50_percent"]. ~Year 400-700. This is the V1 narrative climax. Effect: emit CE "ce_first_era_complete".
3. type_2 — "Type II Civilisation". Conditions: ["dyson_100_percent"]. ~Year 800-1200. Effect: emit CE "ce_type2_reached".
4. type_3_gesture — "First Interstellar Seed Ship". Conditions: ["interstellar_seed_ship_launched"]. ~Year 1000-1500+. Effect: emit CE "ce_seed_ship_launched".

Condition objects: { "type": "string_id" } — KardashevSystem.gd will evaluate these at runtime against GameState.
```

---

### `data/tech_tree.json`

```
Create data/tech_tree.json for Helioscape.

Each tech node: id, planet (earth/mercury/mars/venus/moon), display_name, prerequisites (array of tech ids from same planet), spillover_prerequisites (array of tech ids from other planets — these are cross-planet unlock triggers), rp_cost, duration_years, effects (array of effect objects).

Effect types: { "type": "unlock_tech", "target": "tech_id" } or { "type": "emit_event", "event_id": "ce_id" } or { "type": "spillover_unlock", "target_planet": "planet_id", "target_tech": "tech_id" }.

Include all Earth tech nodes from the GDD:
- earth_launch_mercury_mission (always available, prerequisites: [], rp_cost: 0, duration_years: 0 — instant)
- earth_advanced_renewables (req: earth_launch_mercury_mission)
- earth_dome_habitat (req: earth_launch_mercury_mission)
- earth_deuterium_extraction (req: earth_advanced_renewables)
- earth_ocean_cleanup (req: mercury_phase_1 as spillover)
- earth_fusion_ignition_theory (req: earth_deuterium_extraction, rp_cost: 50, duration_years: 40)
- earth_co2_drawdown (spillover_prerequisites: ["venus_carbonate"])
- earth_soil_restoration (spillover_prerequisites: ["mars_soil"])
- earth_ocean_acidification_reversal (req: earth_co2_drawdown + spillover venus_carbonate)
- earth_rewilding (req: earth_soil_restoration + spillover mars_coastal)

Include Moon research tracks (planet: "moon"):
- moon_low_gravity_medicine (duration_years: 25)
- moon_closed_loop_life_support (duration_years: 30)
- moon_regolith_construction (duration_years: 20)
- moon_organism_library_t1 (duration_years: 35)
- moon_radiation_resilience (req: moon_low_gravity_medicine, duration_years: 30)
- moon_isolation_psychology (req: moon_closed_loop_life_support)
- moon_he3_extraction (req: moon_regolith_construction)
- moon_organism_library_t2 (req: moon_organism_library_t1, spillover_prerequisites: ["mars_ocean"])

Add a reasonable set of Mercury tech nodes for the three base phases (phase_0_complete, phase_1_complete, phase_2_complete as milestone markers, plus sub-nodes for landing_pad, power_cell, mining_facility, refinery, fabricator, solar_array_expansion, rare_metals_mining, mass_driver, dyson_panel_production, polar_volatiles_extraction).

For Mars and Venus, add placeholder path nodes (mars_path_a_start, mars_path_b_start, mars_path_c_start, venus_path_a_start, venus_path_b_start, venus_path_c_start) — these will be fleshed out later.

Use realistic rp_cost values: simple = 20, standard = 30-40, complex = 50-80. duration_years should feel consequential at 2 real-seconds-per-game-year pacing.
```

---

### `data/research_tracks.json`

```
Create data/research_tracks.json for Helioscape.

Research tracks are distinct from tech tree nodes. A track occupies RP *capacity* (not currency) until complete. The file defines the track metadata — ResearchSystem.gd does the runtime logic.

Each track: id, display_name, planet, rp_cost (capacity occupied), duration_years, description (one sentence), prerequisite_tech (tech id that must be unlocked before track becomes available), on_complete_effects (array of effect objects, same types as tech_tree.json).

Include the Moon research tracks from the GDD (these are research tracks, not tech nodes — they represent ongoing scientific work):
- moon_low_grav_medicine_track (rp_cost: 25, duration_years: 30, effect: buff mars colonist health)
- moon_closed_loop_track (rp_cost: 30, duration_years: 35, effect: reduce colony infrastructure cost)
- moon_regolith_construction_track (rp_cost: 20, duration_years: 25)
- moon_organism_library_t1_track (rp_cost: 35, duration_years: 35)
- moon_radiation_resilience_track (rp_cost: 30, req: moon_low_grav_medicine_track_complete)
- moon_isolation_psychology_track (rp_cost: 25, req: moon_closed_loop_track_complete)
- moon_he3_extraction_track (rp_cost: 40, req: moon_regolith_construction_track_complete)
- moon_organism_library_t2_track (rp_cost: 50, req: moon_organism_library_t1_track + spillover mars_ocean)

Also add early Earth research tracks corresponding to the tech tree nodes with duration (fusion_ignition_theory_track is the most important — rp_cost: 50, duration_years: 40).
```

---

### `data/culture_events.json`

```
Create data/culture_events.json for Helioscape with ~15 seed culture events.

Each entry: id, title, narrator_text (2-5 sentences in the correct voice — present tense, first person plural "we", human not clinical, optimism from presence not spin), portrait (res://assets/textures/ui/ce_{id}.png), choices (array, can be empty for pure narrative events), tags (array: "naturalist" | "architect" | ""),  trigger (object: { "type": "tech_completed" | "milestone_reached" | "year_reached" | "terraforming_phase_changed", ...relevant id }).

Narrator voice example from GDD:
RIGHT: "It's working. Atmospheric monitors recorded first measurable pressure increase. 0.008 atmospheres. Not enough to breathe. Not for three hundred more years. But it's there."
WRONG: "Scientists noted first measurable pressure increase."

Include at minimum:
- ce_mercury_landing (trigger: tech earth_launch_mercury_mission, no choices — pure arrival moment)
- ce_fusion_theory_complete (trigger: tech earth_fusion_ignition_theory)
- ce_type1_reached (trigger: milestone type_1)
- ce_first_era_complete (trigger: milestone first_era_complete, this is the emotional climax — write it with weight)
- ce_dyson_10_percent, ce_dyson_25_percent, ce_dyson_50_percent (Dyson swarm milestones)
- ce_mars_first_liquid_water (trigger: terraforming_phase_changed, mars, phase 2)
- ce_venus_clouds_cooling (trigger: any venus phase 1 completion)
- Moon intimate events: ce_moon_first_birthday (first birthday off-Earth), ce_moon_refusing_return (crew member declines return to Earth), ce_moon_tenth_anniversary
- ce_fermi_silence_detected (trigger: dyson ~30%, humanity becomes detectable — player choice: broadcast / go quiet / continue)
- ce_europa_warning (10-15yr warning before potential Europa impact — only if player authorised Europa mission)

For events with choices, choice objects: { "id": "choice_id", "label": "Short button label", "tag": "naturalist" | "architect" | "", "effects": [] }.

Keep narrator_text authentic to the voice. This file will be read and expanded many times — establish the tone firmly here.
```

---

## PHASE 2 — Core autoloads

---

### `src/autoloads/DataManager.gd`

```
Create src/autoloads/DataManager.gd for Helioscape. This is a Godot 4 autoload singleton.

Responsibility: load all JSON files from data/ on _ready(), cache them as typed Dictionaries, expose typed accessor functions. Never writes. Never holds mutable state.

Files to load: planets.json, tech_tree.json, research_tracks.json, culture_events.json, kardashev_milestones.json, resources.json.

Required public accessor functions (all statically typed):
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

Private helper: _load_json(path: String) -> Dictionary — loads a .json file, parses it, returns the result. Print an error if file not found.

GDScript 4 static typing throughout. This is loaded first — everything depends on it.
```

---

### `src/autoloads/EventBus.gd`

```
Create src/autoloads/EventBus.gd for Helioscape. This is a Godot 4 autoload singleton.

Responsibility: declare all cross-system signals in one place. Nothing else. No logic, no state, no _process. Systems emit signals here; UI and other systems connect to signals here. Nothing imports a specific system to connect to its signals.

Declare exactly these signals with correct GDScript 4 typed parameter syntax:

signal tech_node_unlocked(planet_id: String, node_id: String)
signal research_track_completed(track_id: String)
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

No _ready, no _process, no functions. Just signal declarations. The comment at the top of the file should explain why all signals live here (decoupling — systems never hold references to each other).
```

---

### `src/autoloads/GameState.gd`

```
Create src/autoloads/GameState.gd for Helioscape. This is a Godot 4 autoload singleton.

Responsibility: single source of truth for all mutable runtime game state. Plain data only — Dictionaries and primitives. Systems modify this; UI reads it. No logic, no signals emitted from here.

State buckets to declare (all statically typed):

var game_year: float = 2033.0
var game_speed: int = 1  # 1 or 5
var is_paused: bool = false

# Planet state — keyed by planet_id
var planets: Dictionary = {}
# Each planet entry structure (set by TerraformingSystem on init):
# {
#   "terraforming_phase": int,
#   "terraforming_progress": float,  # 0.0-1.0 within current phase
#   "unlocked_techs": Array,
#   "active_path": String,           # e.g. "mars_path_a"
#   "atmosphere_pressure": float,
#   "temperature_celsius": float,
#   "population": int,               # colonists
#   "visual_params": Dictionary      # passed to PlanetVisual.gd
# }

var mercury_phase: int = 0           # 0, 1, or 2
var mercury_resources: Dictionary = {
    "common_ore": 0.0,
    "rare_metals": 0.0,
    "polar_volatiles": 0.0
}
var dyson_energy_watts: float = 0.0
var dyson_panel_count: int = 0
var dyson_panel_tier: String = "basic"  # "basic" | "mid" | "hardened"

var active_research: Array = []      # Array of { track_id, progress_years, planet }
var total_rp_capacity: int = 60
var used_rp_capacity: int = 0

var kardashev_level: float = 0.73   # starts at Earth Kardashev 0.73
var kardashev_tags: Array = []       # "naturalist" or "architect" tag strings

var culture_event_history: Array = []  # Array of { event_id, year, planet_context }
var culture_event_queue: Array = []    # Pending events to display

var completed_techs: Array = []      # flat list of all completed tech node ids
var completed_milestones: Array = [] # flat list of completed milestone ids

# Philosophical tension tracking
var naturalist_decisions: int = 0
var architect_decisions: int = 0

# Europa state
var europa_mission_authorised: bool = false
var europa_impacted: bool = false
var europa_life_confirmed: bool = false  # only true if Hunt for Life ran without impact

Include a reset() function that restores all values to their defaults (for new game). No other logic.
```

---

### `src/autoloads/TimeManager.gd`

```
Create src/autoloads/TimeManager.gd for Helioscape. Godot 4 autoload singleton.

Responsibility: own the game clock. Emit EventBus.game_year_ticked every 2 real seconds at 1× speed. Handle pause and speed multiplier (1× and 5×). That is the entire job.

Implementation:
- Use _process(delta: float) with an accumulator variable. When accumulator >= tick_interval, increment GameState.game_year by 1.0 and emit EventBus.game_year_ticked.emit(GameState.game_year), then reset accumulator.
- tick_interval: float — computed as 2.0 / GameState.game_speed.
- If GameState.is_paused is true, skip accumulation entirely.
- set_speed(speed: int) public function — validates input is 1 or 5, sets GameState.game_speed.
- toggle_pause() public function — flips GameState.is_paused.
- Visual orbit speed is intentionally decoupled from game speed (handled by SolarSystemView, not here — just a comment noting this).

Static typing throughout. One _process per autoload max — this is the one autoload that needs it.
```

---

### `src/autoloads/SaveManager.gd`

```
Create src/autoloads/SaveManager.gd for Helioscape. Godot 4 autoload singleton.

Responsibility: serialise GameState to a JSON file on disk; deserialise on load. Versioned. Systems are stateless — all state is in GameState, so save/load is a single read/write operation.

Save file path: "user://save_slot_1.json"
Save version: include const SAVE_VERSION: int = 1 in the file root.

save_game() function:
- Build a Dictionary from all GameState public vars.
- Add "save_version": SAVE_VERSION.
- Write to disk with FileAccess. Print confirmation or error.
- Emit EventBus.save_requested (for any UI that wants to show a save indicator).

load_game() function:
- Read file, parse JSON.
- Check "save_version" key. If missing or mismatched, call _migrate(data, version) before applying.
- Overwrite GameState properties from the dictionary. Use .get() with defaults for safety.
- Print confirmation or error.

_migrate(data: Dictionary, from_version: int) -> Dictionary:
- Stub function with a comment explaining that migration functions will be keyed by version number as the game evolves.

has_save() -> bool: return true if the save file exists.
delete_save() function: deletes the save file.

Static typing throughout. Handle FileAccess errors gracefully — never crash on missing or corrupt save.
```

---

## PHASE 3 — Shaders

---

### `src/shaders/PlanetSurface.gdshader`

```
Create src/shaders/PlanetSurface.gdshader for Helioscape.

The full implementation is already specified in ARCHITECTURE.md — implement it exactly as described, then extend it.

The shader uses spatial type and composites four layers: surface (always visible), water (grows from UV seed points), green/vegetation (grows from UV seed points), and cloud (always visible on top, opacity uniform).

Implement exactly:
- The spot_coverage(uv, spots, count, radius) helper function using smoothstep for soft edges.
- All uniforms as specified: layer textures, water_spots[8] + water_spot_count + water_growth_radius + water_opacity, same for green, edge_softness, atmosphere_tint.
- Fragment shader that blends layers in order: surface → water → green → cloud.

Extensions beyond the architecture spec:
- Add uniform float cloud_opacity: hint_range(0.0, 1.0) = 0.0 so clouds can be faded in as atmosphere develops.
- Add uniform float city_lights_intensity: hint_range(0.0, 1.0) = 0.0 — this will be used to show civilisation growth on Earth (visible on the night side — use a simple dot product with light direction approximation, or a separate city_lights sampler2D uniform).
- Add a subtle fresnel rim effect using the NORMAL and VIEW vectors to enhance the sphere's 3D quality.

Comment each section explaining the design intent, not just what the code does. This shader will be the most-read file in the project.
```

---

### `src/shaders/Atmosphere.gdshader`

```
Create src/shaders/Atmosphere.gdshader for Helioscape.

Purpose: atmospheric glow rim effect on a slightly larger sphere (atmosphere shell) rendered on top of the planet sphere via a SubViewport overlay.

shader_type spatial. Render mode: additive blending (blend_add), no depth write (depth_draw_never), no culling (cull_front — render inside of shell only).

Uniforms:
- uniform vec4 atmosphere_color: source_color = vec4(0.4, 0.7, 1.0, 1.0)
- uniform float atmosphere_density: hint_range(0.0, 1.0) = 0.3
- uniform float rim_power: hint_range(1.0, 8.0) = 3.0  — controls falloff sharpness

Fragment: compute fresnel/rim factor using dot(NORMAL, VIEW). Apply pow(rim, rim_power). Multiply by atmosphere_density and atmosphere_color. Output to EMISSION (glowing effect, not lit by scene lights).

Each planet will set atmosphere_color and atmosphere_density to match its terraforming state:
- Mars: starts thin red-pink, becomes blue-white as atmosphere thickens.
- Venus: starts thick orange-yellow (dense CO₂), becomes lighter as pressure reduces.
- Earth: stable blue-white.
- Mercury: density = 0.0 (no atmosphere).

Comment: explain why cull_front is used (we're rendering the inside of a slightly larger sphere to create the atmospheric rim, not the outside).
```

---

### `src/shaders/DysonSwarm.gdshader`

```
Create src/shaders/DysonSwarm.gdshader for Helioscape.

Purpose: visualise the growing Dyson swarm around the Sun as a particle-like pattern. This is a spatial shader applied to a MeshInstance3D sphere surrounding the Sun scene node.

Approach: use a procedural point/panel distribution on the sphere surface driven by a density uniform. As dyson_coverage increases from 0.0 to 1.0, more of the sphere surface becomes covered by panel geometry (represented as dark rectangular masks on a transparent sphere).

Uniforms:
- uniform float dyson_coverage: hint_range(0.0, 1.0) = 0.0  — driven by DysonSystem
- uniform vec4 panel_color: source_color = vec4(0.05, 0.05, 0.1, 1.0)
- uniform vec4 panel_glow_color: source_color = vec4(0.8, 0.6, 0.2, 1.0)
- uniform float panel_glow_intensity: hint_range(0.0, 1.0) = 0.3

shader_type spatial; render_mode unshaded, blend_mix, depth_draw_never, cull_disabled.

In fragment: use UV coordinates to tile a grid pattern. Based on a hash of the tile position and dyson_coverage, determine whether a given tile is "filled" with a panel or empty/transparent. Panels near the coverage threshold should have a faint glow edge (panel_glow_color) to suggest energy harvesting activity.

The sphere should appear transparent where panels are absent, and dark (panel_color) where panels exist, with a glow rim on active edges.

Comment: note that this is a purely aesthetic representation — the swarm is not physically simulated, just progressively revealed.
```

---

### `src/shaders/PixelFilter.gdshader`

```
Create src/shaders/PixelFilter.gdshader for Helioscape.

Purpose: post-process pixel art filter applied to the full 3D viewport output via a SubViewport. The pixel art filter is mandatory — it defines the game's visual identity.

shader_type canvas_item. This runs as a screen-space post-process on the SubViewport's texture output.

uniforms:
- uniform float pixel_size: hint_range(1.0, 8.0) = 4.0  — controls pixelation level
- uniform float frame_hold: hint_range(1.0, 8.0) = 4.0  — stepped animation frame hold (not implemented in shader — see comment)
- uniform sampler2D SCREEN_TEXTURE: hint_screen_texture, repeat_disable, filter_nearest

Fragment: quantise UV coordinates to pixel_size grid, then sample SCREEN_TEXTURE at the snapped UV. This creates the pixelated look.

Add a subtle scanline/dithering pattern (very low opacity, ~0.03) for retro texture without being distracting.

Comments:
- Explain that all 3D geometry stays smooth — pixelation is purely post-process aesthetic (this is the key design decision).
- Note that stepped animation (6-8fps variable frame hold) is handled at the animation playback level, not in this shader.
- Note that pixel_size of 4.0 gives ~480p effective resolution on a 1080p output — tune for feel.
```

---

## PHASE 4 — Planet Visual bridge

---

### `src/ui/planet_panel/PlanetVisual.gd`

```
Create src/ui/planet_panel/PlanetVisual.gd for Helioscape.

Responsibility: sit in the scene, translate game state into PlanetSurface.gdshader parameters. Read EventBus signals, use Tweens for smooth transitions. Never talks to systems — reads state, responds to signals.

The implementation skeleton is in ARCHITECTURE.md — implement it fully.

@export var planet_id: String = ""  — set in the scene editor per planet instance.

In _ready():
- Connect to EventBus.planet_visual_params_changed signal.
- Cache the MeshInstance3D and its ShaderMaterial.
- Call _apply_initial_params() to set shader params from GameState.planets[planet_id].visual_params without animation (instant on load).

_on_planet_visual_params_changed(changed_planet_id: String, params: Dictionary):
- Guard: return if changed_planet_id != planet_id.
- Create a Tween (set_trans TRANS_SINE, set_ease EASE_IN_OUT).
- Tween the following shader parameters smoothly: water_growth_radius, water_opacity, green_growth_radius, green_opacity, cloud_opacity, atmosphere_density (on the Atmosphere shader material — reference to it also cached in _ready).
- transition_duration from params.get("transition_duration", 5.0).

_set_shader_param(param: String, value: float) private helper — one-liner wrapper around material.set_shader_parameter.

Also handle planet_id "earth" specially: tween city_lights_intensity based on params.get("city_lights_intensity", 0.0).

On _ready, also set UV seed points for water and green spots from DataManager.get_planet(planet_id) — these are static (don't change at runtime, set once).

Static typing throughout.
```

---

## PHASE 5 — Solar System View

---

### `src/ui/solar_system/SolarSystemView.gd`

```
Create src/ui/solar_system/SolarSystemView.gd for Helioscape.

Responsibility: display the orrery — planets orbiting the Sun, driven by JSON data. Handle planet selection (clicking opens PlanetPanel). Show mission ships as dots on orbital paths (late game visual density). Connect to game_year_ticked to update orbit positions.

In _ready():
- Load all planets from DataManager.get_all_planets().
- For each planet, instantiate a PlanetOrbit child node (scene: res://scenes/ui/PlanetOrbit.tscn), pass it planet data, add to scene.
- Connect EventBus.game_year_ticked to _on_year_ticked.
- Connect EventBus.terraforming_phase_changed to _on_planet_changed (to update visual state of orbit dot).

_on_year_ticked(year: float):
- Update each PlanetOrbit node's angular position. Use simplified Keplerian periods (Earth = 1.0yr reference). Orbital period is in planet data or hardcoded constants here. Comment: visual orbit speed is intentionally decoupled from game speed — see TimeManager.

planet_selected(planet_id: String) — emitted up to parent when a planet is clicked. Parent (Main scene) opens the PlanetPanel for that planet.

For the Moon: clicking the Moon in the orrery should route to the Earth panel at the Moon tab, not a separate view. Comment this explicitly.

Planets that are locked (not in GameState.planets or unlock condition not met): show orbit ring dimmed, planet dot greyed out, no click interaction.

No direct references to UI nodes outside this scene. Cache all child node references in _ready().
```

---

### `src/ui/solar_system/PlanetOrbit.gd`

```
Create src/ui/solar_system/PlanetOrbit.gd for Helioscape.

Responsibility: represent a single planet in the orrery. Draw the orbit ring and the planet dot. Handle click detection. Update position based on angle set by SolarSystemView.

@export var planet_id: String = ""
@export var orbit_radius: float = 100.0
@export var orbital_period_years: float = 1.0  — set by SolarSystemView from planet data
@export var is_locked: bool = false

Properties:
- current_angle: float — updated by SolarSystemView via set_angle(angle: float)
- planet_color: Color — from DataManager planet visual.base_color

In _draw(): draw the orbit ring (thin circle, dim colour) and the planet dot (filled circle at current position). If is_locked, use a greyed-out colour.

Input handling: detect mouse click on the planet dot area. Emit a signal planet_clicked(planet_id: String) upward to SolarSystemView.

For mission ships: expose add_ship_dot(progress: float, color: Color) and clear_ship_dots() methods. SolarSystemView will call these when ships are in transit. Ships are rendered as small dots along the orbit arc.

Keep _draw() clean — no complex calculations in draw, just position lookups. Angles and positions computed in set_angle().
```

---

## PHASE 6 — Tech Tree System

---

### `src/systems/TechTreeSystem.gd`

```
Create src/systems/TechTreeSystem.gd for Helioscape.

Responsibility: prerequisite checking, node unlocking, spillover handling. Listen to user input (node clicked in TechTreeUI). Modify GameState. Emit via EventBus. Never holds a reference to any UI node.

Connects to: no EventBus signals on init (waits for user input via unlock_tech() public function).
Modifies: GameState.planets[planet_id].unlocked_techs, GameState.completed_techs.
Emits: EventBus.tech_node_unlocked.

Public functions:

can_unlock(planet_id: String, node_id: String) -> bool:
- Get tech node from DataManager.
- Check all prerequisites are in GameState.completed_techs.
- Check all spillover_prerequisites are in GameState.completed_techs.
- Return true only if all conditions met.

unlock_tech(planet_id: String, node_id: String) -> void:
- Guard: return if not can_unlock(planet_id, node_id).
- Add node_id to GameState.planets[planet_id].unlocked_techs and GameState.completed_techs.
- Process effects array: for each effect, call _apply_effect(effect: Dictionary, planet_id: String).
- Emit EventBus.tech_node_unlocked.emit(planet_id, node_id).

_apply_effect(effect: Dictionary, source_planet: String) -> void:
- "unlock_tech": recursively call unlock_tech on target (for chains).
- "emit_event": push event_id to GameState.culture_event_queue. Emit EventBus.culture_event_triggered.
- "spillover_unlock": add target_tech to the target_planet's available techs. Emit a notification signal (use culture_event_triggered with a special spillover CE id, or add a new signal to EventBus).

get_available_techs(planet_id: String) -> Array[Dictionary]:
- Returns all tech nodes for this planet where: not yet completed, prerequisites met. TechTreeUI calls this to know what to render as clickable.

Static typing throughout. This is a pure logic node — no scene, no _process, no _draw.
```

---

### `src/ui/planet_panel/TechTreeUI.gd`

```
Create src/ui/planet_panel/TechTreeUI.gd for Helioscape.

Responsibility: render the tech tree for a planet and handle node click input. Read state from GameState and DataManager. Send unlock requests to TechTreeSystem. Never modify GameState directly.

@export var planet_id: String = ""

In _ready():
- Call _build_tree() to populate the visual tree.
- Connect EventBus.tech_node_unlocked to _on_tech_unlocked (refresh affected nodes).

_build_tree():
- Load tech nodes for this planet via DataManager.get_tech_tree_for(planet_id).
- For each node, instantiate a Button (or custom scene) and position it in a layout.
- Visibility rules from GDD: unlocked = full colour, one prereq away = muted, two prereqs away = silhouette, further = hidden.
- Call _update_node_visual(node_id) for each.

_update_node_visual(node_id: String):
- Check GameState.completed_techs for completion.
- Check TechTreeSystem.can_unlock() for availability.
- Set button disabled/enabled and visual style accordingly.

_on_node_clicked(node_id: String):
- Call TechTreeSystem.unlock_tech(planet_id, node_id).
- Refresh the tree.

_on_tech_unlocked(unlocked_planet_id: String, _node_id: String):
- Return early if unlocked_planet_id != planet_id.
- Refresh the tree.

Cache all node references in _ready(). No get_node() paths longer than one level.
```

---

## PHASE 7 — Research System

---

### `src/systems/ResearchSystem.gd`

```
Create src/systems/ResearchSystem.gd for Helioscape.

Responsibility: RP capacity management, active research tracks, track completion. Listens to game_year_ticked. Modifies GameState. Emits research_track_completed via EventBus. Never talks to UI.

Connects to: EventBus.game_year_ticked.
Modifies: GameState.active_research, GameState.used_rp_capacity, GameState.completed_techs (adds track id on completion).
Emits: EventBus.research_track_completed.

In _ready(): connect to EventBus.game_year_ticked.connect(_on_year_ticked).

_on_year_ticked(_year: float):
- For each track in GameState.active_research, increment its progress_years by 1.
- If progress_years >= track duration (from DataManager.get_research_track(track_id).duration_years), call _complete_track(track).

_complete_track(track: Dictionary):
- Remove from GameState.active_research.
- Subtract track's rp_cost from GameState.used_rp_capacity.
- Add track_id to GameState.completed_techs.
- Process track on_complete_effects (same logic as TechTreeSystem effects).
- Emit EventBus.research_track_completed.emit(track.track_id).

Public functions:

can_start_track(track_id: String) -> bool:
- Check track prerequisite_tech is in GameState.completed_techs.
- Check track not already active or completed.
- Check GameState.used_rp_capacity + track.rp_cost <= GameState.total_rp_capacity.

start_track(track_id: String, planet_id: String) -> void:
- Guard: return if not can_start_track.
- Add { "track_id": track_id, "planet_id": planet_id, "progress_years": 0.0 } to GameState.active_research.
- Add rp_cost to GameState.used_rp_capacity.

cancel_track(track_id: String) -> void: remove from active, free up capacity. Progress lost.

Static typing throughout.
```

---

### `src/ui/planet_panel/ResearchUI.gd`

```
Create src/ui/planet_panel/ResearchUI.gd for Helioscape.

Responsibility: display active research tracks and available tracks for the current planet. Allow starting/cancelling tracks. Never modify GameState directly — call ResearchSystem.

@export var planet_id: String = ""

In _ready():
- Connect EventBus.research_track_completed to _on_track_completed.
- Call _refresh().

_refresh():
- Get available tracks: DataManager.get_research_tracks_for(planet_id). Filter to those where ResearchSystem.can_start_track() is true or track is already active.
- Render active tracks (progress bar, years remaining estimate, cancel button).
- Render available-but-not-started tracks (start button, RP cost, duration, description).
- Render completed tracks as greyed-out entries with completion year from GameState history.

RP capacity indicator: show "X / Y RP in use" from GameState values. Update on _refresh().

_on_start_clicked(track_id: String): call ResearchSystem.start_track(track_id, planet_id). Refresh.
_on_cancel_clicked(track_id: String): call ResearchSystem.cancel_track(track_id). Refresh.
_on_track_completed(_track_id: String): call _refresh().

Track UI: show display_name, description (short), rp_cost, estimated years remaining (current progress / total duration). Progress bar fills left to right.

Cache all node references. No get_node() paths longer than one level.
```

---

## PHASE 8 — Terraforming System

---

### `src/systems/TerraformingSystem.gd`

```
Create src/systems/TerraformingSystem.gd for Helioscape.

Responsibility: phase transitions, progress tracking per planet, triggering visual updates. Listens to game_year_ticked and tech_node_unlocked. Modifies GameState.planets. Emits terraforming_phase_changed and planet_visual_params_changed via EventBus.

Connects to: EventBus.game_year_ticked, EventBus.tech_node_unlocked.
Modifies: GameState.planets[planet_id].terraforming_phase, .terraforming_progress, .atmosphere_pressure, .temperature_celsius, .visual_params.
Emits: EventBus.terraforming_phase_changed, EventBus.planet_visual_params_changed.

In _ready():
- Initialise GameState.planets from DataManager.get_all_planets() — copy initial_state values into GameState for each planet.
- Connect to both EventBus signals.

_on_year_ticked(_year: float):
- For each active (unlocked + has active_path) planet in GameState.planets:
  - Increment terraforming_progress based on current phase rate (defined in data or constants here).
  - When progress >= 1.0: call _advance_phase(planet_id).
  - Call _update_visual_params(planet_id) — compute what shader params should be at this progress level and emit planet_visual_params_changed.

_advance_phase(planet_id: String):
- Increment terraforming_phase in GameState.
- Reset progress to 0.0.
- Emit EventBus.terraforming_phase_changed.emit(planet_id, new_phase).
- Trigger relevant culture events by pushing to GameState.culture_event_queue.

_update_visual_params(planet_id: String):
- Based on planet_id, phase, and progress: compute water_growth_radius, water_opacity, green_growth_radius, green_opacity, cloud_opacity, atmosphere_density.
- Build a params Dictionary.
- Emit EventBus.planet_visual_params_changed.emit(planet_id, params).

_on_tech_unlocked(planet_id: String, node_id: String):
- Check if this tech triggers a terraforming phase start or acceleration for the planet.
- Update GameState accordingly.

Mars and Venus have three paths each (path_a/b/c) — the active_path in GameState determines the rate constants and which cultural events fire at each phase. Use constants defined at the top of this file (MARS_PATH_RATES, VENUS_PATH_RATES as nested Dictionaries).

Static typing throughout.
```

---

## PHASE 9 — Culture Event System

---

### `src/systems/CultureEventSystem.gd`

```
Create src/systems/CultureEventSystem.gd for Helioscape.

Responsibility: monitor GameState.culture_event_queue, dequeue events, fire them. Also check trigger conditions for time-based events on each year tick. Emit culture_event_triggered. Append to culture_event_history.

Connects to: EventBus.game_year_ticked, EventBus.kardashev_milestone_reached, EventBus.tech_node_unlocked, EventBus.terraforming_phase_changed.
Modifies: GameState.culture_event_queue (dequeues), GameState.culture_event_history (appends).
Emits: EventBus.culture_event_triggered.

_on_year_ticked(year: float):
- Check time-based event triggers (year_reached type in culture_events.json).
- Process the queue: if queue is not empty and there's no currently-displayed event, dequeue the next event_id, record in history, emit culture_event_triggered.emit(event_id).
- Culture events do NOT pause the game (per GDD). They queue and the player reads at own pace.

_on_milestone_reached(milestone_id: String):
- Find events with trigger type "milestone_reached" and matching milestone_id. Push to queue.

_on_tech_unlocked(planet_id: String, node_id: String):
- Find events triggered by this tech completion. Push to queue.

_on_phase_changed(planet_id: String, phase: int):
- Find events triggered by this planet + phase combination. Push to queue.

_push_event(event_id: String):
- Don't push duplicates unless the event is specifically flagged as repeatable.
- Append event_id to GameState.culture_event_queue.

_record_history(event_id: String):
- Append { "event_id": event_id, "year": GameState.game_year, "planet_context": _get_active_planet_context() } to GameState.culture_event_history.

Second playthrough Europa handling: if GameState.europa_life_confirmed is true (from a previous run — this would need to be stored in a meta-save, comment this as a post-V1 feature) and player crashes Europa, push a special CE.

Static typing throughout.
```

---

### `src/ui/culture_events/CultureEventCard.gd`

```
Create src/ui/culture_events/CultureEventCard.gd for Helioscape.

Responsibility: display a single culture event. Show portrait vignette, title, narrator text, choice buttons (if any). Handle choice selection. Never modify GameState directly.

Connects to: EventBus.culture_event_triggered.
Does not modify GameState — calls a system function or emits EventBus.culture_event_choice_made.

In _ready(): connect to EventBus.culture_event_triggered.connect(_on_event_triggered).

_on_event_triggered(event_id: String):
- Load event data from DataManager.get_culture_event(event_id).
- Populate UI: portrait texture (event.portrait path), title label, narrator text (animated text reveal — typewriter effect preferred, can be a simple Tween on visible_characters).
- If event.choices is empty: show a "Continue" button that dismisses the card.
- If event.choices has entries: show one button per choice. On click: emit EventBus.culture_event_choice_made.emit(event_id, choice_id). Then dismiss.

Dismissal: hide the card. Signal to CultureEventQueue to show the next event if queued.

Narrator text style from GDD: present tense, first person plural, human not clinical. The UI should support this by using a warm, readable font — not a generic body font. Comment: typography is part of the voice.

Per GDD art direction: left portrait vignette (3:4 ratio) + text on right. Dark background, warm amber/orange accents. Monospaced typography. Base font size 14px (set in em in theme).

Accessibility: ensure narrator text is selectable (not a Label with mouse_filter IGNORE). Event cards should be dismissible with keyboard (Enter/Space) in addition to mouse.

Cache all child nodes in _ready(). No get_node() paths longer than one level.
```

---

### `src/ui/culture_events/CultureEventQueue.gd`

```
Create src/ui/culture_events/CultureEventQueue.gd for Helioscape.

Responsibility: manage the queue UI — toast notifications (bottom-left, persist 8s, clickable), bell icon unread count, and coordination with CultureEventCard.

This is a UI container node that sits persistently in the HUD scene.

Connects to: EventBus.culture_event_triggered (to update unread count + show toast).

_on_event_triggered(event_id: String):
- Increment unread count. Update bell icon label.
- Show a toast notification (bottom-left, slides in, stays 8s, then fades). Toast shows event title from DataManager.
- Toast is clickable — clicking opens the CultureEventCard for that event_id.

open_event_card(event_id: String):
- Show CultureEventCard, pass event_id.
- Decrement unread count for this event.

After CultureEventCard dismisses: check if GameState.culture_event_queue has more events. If so, auto-open next card (or just update the bell count and let player decide — comment this UX decision with a TODO).

Bell icon: always visible in HUD. Shows unread count badge. Clicking opens a simple list of queued event titles.

History panel: a scrollable list of GameState.culture_event_history entries, accessible from the bell icon menu. Each entry shows: event title, year, planet context. Clicking an entry reconstructs the vignette at that terraforming stage (post-V1 feature — add a TODO comment).

Cache all node refs in _ready().
```

---

## PHASE 10 — Dyson System

---

### `src/systems/DysonSystem.gd`

```
Create src/systems/DysonSystem.gd for Helioscape.

Responsibility: Dyson panel queue, energy output accumulation, milestone triggers. Listens to game_year_ticked and resource spend events. Modifies GameState.dyson_energy_watts and dyson_panel_count. Emits dyson_energy_updated.

Connects to: EventBus.game_year_ticked.
Modifies: GameState.dyson_energy_watts, GameState.dyson_panel_count, GameState.dyson_panel_tier.
Emits: EventBus.dyson_energy_updated.

Constants (tune after playtesting):
- ENERGY_PER_BASIC_PANEL_WATTS: float = 1e12
- ENERGY_PER_MID_PANEL_WATTS: float = 2.5e12
- ENERGY_PER_HARDENED_PANEL_WATTS: float = 5e12
- PANELS_PER_YEAR_BASE: int = 2  — increases with Mercury production upgrades
- TOTAL_PANELS_FOR_100_PERCENT: int = 1000  — tune for feel

Panel tiers from GDD:
- Basic: available from Dyson production start, CME-vulnerable.
- Mid-tier: unlocks at Type 1 milestone.
- Hardened: unlocks when Jupiter He-3 established (post-V1).

_on_year_ticked(_year: float):
- Add PANELS_PER_YEAR_BASE panels to dyson_panel_count (subject to Mercury resource availability — check GameState.mercury_resources.common_ore).
- Recompute total energy: dyson_panel_count * energy_per_panel (by current tier).
- Update GameState.dyson_energy_watts.
- Emit EventBus.dyson_energy_updated.emit(GameState.dyson_energy_watts).
- Check milestone thresholds: 10%, 25%, 50%, 100% of TOTAL_PANELS. If newly crossed, push CE to culture_event_queue and emit kardashev milestone conditions.

CME event (Basic tier only): random low-probability event each year that destroys a small percentage of basic panels. Log to culture_event_history as ambient notification. Comment: use a simple RNG check — not game-breaking, just flavour.

upgrade_tier(new_tier: String): changes dyson_panel_tier, recomputes energy output.

Static typing throughout.
```

---

## PHASE 11 — Save/Load (already covered above)

*(SaveManager.gd prompt is in Phase 2 — Autoloads section)*

---

## PHASE 12 — Kardashev System

---

### `src/systems/KardashevSystem.gd`

```
Create src/systems/KardashevSystem.gd for Helioscape.

Responsibility: milestone condition checking. Listen to multiple signals. When all conditions for a milestone are met, emit kardashev_milestone_reached. Update GameState.kardashev_level.

Connects to: EventBus.game_year_ticked (periodic condition check), EventBus.research_track_completed, EventBus.dyson_energy_updated, EventBus.terraforming_phase_changed.
Modifies: GameState.kardashev_level, GameState.completed_milestones.
Emits: EventBus.kardashev_milestone_reached.

_check_all_milestones():
- For each milestone in DataManager.get_all_milestones():
  - Skip if already in GameState.completed_milestones.
  - Call _check_conditions(milestone.conditions) -> bool.
  - If true: record milestone, emit EventBus.kardashev_milestone_reached.emit(milestone.id), update kardashev_level, push culture event.

_check_conditions(conditions: Array) -> bool:
- For each condition object, call the matching checker function.
- Return true only if all pass.

Condition checkers (one per condition type):
- "deuterium_fusion_online": check tech completed.
- "dyson_15_percent": check GameState.dyson_panel_count >= TOTAL_PANELS * 0.15.
- "dyson_50_percent": same, 50%.
- "dyson_100_percent": same, 100%.
- "two_habitable_worlds": check terraforming_phase >= threshold for 2 planets.
- "first_self_sustaining_colony": check a colony planet's population >= self_sustaining_threshold.
- "interstellar_seed_ship_launched": check a GameState bool flag (set by a tech effect).

Kardashev level progression: doesn't jump discretely — update GameState.kardashev_level as a smooth value based on energy output. Dyson at 50% ≈ Type 1.5. Full sphere = Type 2. Comment the formula used.

KardashevBar.gd reads this value — the bar is a continuous progress indicator, not discrete steps.

Philosophical tension summary: at first_era_complete, compute naturalist_ratio = GameState.naturalist_decisions / (naturalist + architect decisions). Store in GameState. CultureEventSystem fires the summary CE using this ratio.

Static typing throughout.
```

---

## Remaining UI files

---

### `src/ui/planet_panel/PlanetPanel.gd`

```
Create src/ui/planet_panel/PlanetPanel.gd for Helioscape.

Responsibility: container that shows all sub-panels for a single planet (TechTreeUI, ResearchUI, VignetteDisplay). Receives planet_id when opened. Switches between tabs/sections. Reads GameState for the planet's current status.

@export var planet_id: String = ""  — set when panel is opened.

In _ready(): connect to EventBus.terraforming_phase_changed to refresh status display when phase changes.

open(new_planet_id: String):
- Set planet_id.
- Refresh all sub-panel references with the new planet_id.
- Show the panel (visible = true).
- Display planet name, current terraforming phase name, year unlocked.
- If planet is locked: show "humanity hasn't reached this far yet" message, hide sub-panels.

Tabs: Tech Tree | Research | Vignette. Use a TabContainer or custom tab buttons.

Earth has an additional tab: Moon — which shows the Moon research tracks and culture events without leaving the Earth panel.

Pass planet_id down to TechTreeUI, ResearchUI, VignetteDisplay via their @export vars.

No logic here — this is purely a routing/layout container. All logic lives in sub-panels.
```

---

### `src/ui/planet_panel/VignetteDisplay.gd`

```
Create src/ui/planet_panel/VignetteDisplay.gd for Helioscape.

Responsibility: display layered 2D vignette compositions showing Earth/colony states evolving over time. Each planet has 4-6 inspectable locations; each location has 4-6 states that crossfade at milestone triggers.

Per GDD art direction: progression via palette/asset swap, not full redraws. Each state is a layered 2D composition. Crossfade on milestone trigger using a Tween (alpha blend).

@export var planet_id: String = ""

Vignette locations for Earth: city skyline, coastline, forest/farmland, night sky. Each evolves based on completed tech nodes.

In _ready():
- Load vignette state from DataManager (vignettes defined in a data file — create a stub get_vignette_data(planet_id) call even if the data file doesn't exist yet).
- Connect EventBus.tech_node_unlocked and EventBus.terraforming_phase_changed to _refresh_vignette.
- Connect EventBus.kardashev_milestone_reached to _on_milestone for potential crossfade.

_refresh_vignette(planet_id: String):
- Determine which state index each location should show based on GameState.
- Crossfade to new state if different from current.

_crossfade_to_state(location_id: String, state_index: int):
- Tween alpha of current state texture out, new state texture in simultaneously.
- Duration: 1.5s. Ease: TRANS_SINE.

History book integration (post-V1 — add TODO): clicking a history entry should call restore_to_year(year: float) which rewinds vignette state to what it was at that year.

Keep this file thin — actual vignette content (textures, state conditions) lives in data, not here.
```

---

### `src/ui/hud/HUD.gd`

```
Create src/ui/hud/HUD.gd for Helioscape.

Responsibility: top-level HUD container. Shows: current game year, Kardashev progress bar, time controls, mercury resource counters, notification bell. Connects sub-HUD components (TimeControls, KardashevBar). Reads GameState. Never modifies it.

In _ready():
- Cache all child node references (TimeControls, KardashevBar, resource labels, year label).
- Connect EventBus.game_year_ticked to _on_year_ticked.
- Connect EventBus.resource_accumulation_updated to _on_resources_updated.
- Connect EventBus.dyson_energy_updated to _on_dyson_updated.

_on_year_ticked(year: float): update year label text. Format as "Year {year:.0f}" (e.g. "Year 2087").

_on_resources_updated(resource_id: String, amount: float): update the relevant resource counter label.

_on_dyson_updated(watts: float): pass to KardashevBar.

Resource display: show common_ore / rare_metals / polar_volatiles counts. Visible only when Mercury Phase 0 is complete (GameState.mercury_phase >= 0 and first mining active).

No logic — purely routes data to sub-components.
```

---

### `src/ui/hud/TimeControls.gd`

```
Create src/ui/hud/TimeControls.gd for Helioscape.

Responsibility: pause/unpause button, speed toggle (1× / 5×). Calls TimeManager. Reflects current state visually.

Buttons: Pause/Play toggle, Speed button (shows "1×" or "5×").

Per GDD: 5× speed is locked for the first playthrough — show but disable the Speed button until the condition is met (post-V1 feature — add TODO, show button greyed out with tooltip "Unlocked on subsequent playthroughs").

_on_pause_pressed(): call TimeManager.toggle_pause(). Update button icon/label to match GameState.is_paused.
_on_speed_pressed(): if GameState.game_speed == 1, call TimeManager.set_speed(5), else set_speed(1). Update button label.

Connect EventBus.game_year_ticked to keep pause state display accurate (in case paused state changes from elsewhere).

Simple and direct — no logic beyond routing input to TimeManager and reflecting state.
```

---

### `src/ui/hud/KardashevBar.gd`

```
Create src/ui/hud/KardashevBar.gd for Helioscape.

Responsibility: display a continuous Kardashev progress bar from ~0.73 (game start) toward 2.0+. Show milestone markers at Type 1, First Era, Type 2. Current level label.

Connects to: EventBus.kardashev_milestone_reached (flash/animate milestone marker), EventBus.dyson_energy_updated (update bar value indirectly via GameState.kardashev_level).

_set_level(level: float): animate bar fill to new level using a Tween (smooth, not instant). Update numeric label "K {level:.2f}".

Milestone markers: fixed positions on the bar at K1.0, K1.5 (First Era), K2.0. When reached, marker lights up with a pulse animation.

Tween duration: 0.8s per tick change. The bar should visually feel like it's slowly, continuously creeping — not jumping.

Design note from GDD: warm amber/orange accents on dark background. The bar itself should glow amber, milestone markers pulse warm white.
```

---

## Planet logic files

---

### `src/planets/PlanetBase.gd`

```
Create src/planets/PlanetBase.gd for Helioscape.

This is a base class (extends Node) that all planet scripts extend. It defines the shared interface. Thin — no logic beyond establishing the contract.

Abstract interface (document each with a comment):
- var planet_id: String = ""  — must be set by child class
- func get_terraforming_display_name(phase: int) -> String: return phase name string for this planet's current phase. Override in child.
- func get_current_phase_description() -> String: return a one-sentence description of the current phase for the UI.
- func get_unlock_condition() -> String: return the tech id required to unlock this planet.
- func is_unlocked() -> bool: check DataManager + GameState to determine if unlock condition is met.

_ready() in base: assert planet_id != "" (ensure child classes set it).

No signals emitted here. No direct GameState modification. This is purely a data/interface layer over the JSON-driven planet data.
```

---

### `src/planets/EarthPlanet.gd`

```
Create src/planets/EarthPlanet.gd for Helioscape. Extends PlanetBase.

Earth is always unlocked. No terraforming phases (it's the home world). Responsible for Earth-specific display strings and the Moon tab integration.

planet_id = "earth"

get_terraforming_display_name(phase: int) -> String:
- Earth doesn't terraform — return "Home World" for any phase.

get_current_phase_description() -> String:
- Return a description based on completed Earth tech nodes. E.g., if fusion_ignition_theory complete: "Fusion age underway. Earth's energy grid is transforming."

is_unlocked() -> bool: return true always.

get_kardashev_description() -> String: return a human-readable description of Earth's current Kardashev level (GameState.kardashev_level). Map ranges to descriptions: 0.7-0.9 = "fusion era beginning", 1.0 = "Type I achieved", etc.

Moon integration: expose get_moon_research_summary() -> Dictionary — returns active Moon tracks, completed count, available count. Used by PlanetPanel to populate the Moon tab.

No game logic here — all logic is in systems. This is a display helper.
```

---

### `src/planets/MercuryPlanet.gd`

```
Create src/planets/MercuryPlanet.gd for Helioscape. Extends PlanetBase.

Mercury is the industrial world. Has three phases (0, 1, 2) representing base expansion stages.

planet_id = "mercury"
get_unlock_condition() -> String: return "earth_launch_mercury_mission"

get_terraforming_display_name(phase: int) -> String:
- Phase 0: "Initial Landing"
- Phase 1: "Industrial Expansion"
- Phase 2: "Full Production"

get_current_phase_description() -> String:
- Based on GameState.mercury_phase. Describe the base state in one sentence, Helioscape narrator voice ("We've established a foothold on the crater rim...").

get_resource_rates() -> Dictionary: return current accumulation rates per resource type based on phase and buildings. Reads GameState.mercury_resources to compute rates. Used by HUD resource display.

get_dyson_output_summary() -> String: human-readable current Dyson contribution. E.g. "1,240 panels in orbit. 1.24 × 10¹⁵ W."

is_unlocked() -> bool: check "earth_launch_mercury_mission" in GameState.completed_techs.
```

---

### `src/planets/MarsPlanet.gd`

```
Create src/planets/MarsPlanet.gd for Helioscape. Extends PlanetBase.

planet_id = "mars"
get_unlock_condition() -> String: return "mercury_phase_2"

Mars has three terraforming paths (path_a/b/c) with different phase names and progression feel.

get_terraforming_display_name(phase: int) -> String:
- Phase 0: "Frozen Desert"
- Phase 1: "Atmospheric Seeding" (all paths — early stage)
- Phase 2 (path_a — slow natural): "First Liquid Water"
- Phase 2 (path_b — aggressive warming): "Polar Detonation Era"  
- Phase 2 (path_c — magnetic umbrella): "Shield Online"
- Phase 3: "Emergent Biosphere"
- Phase 4: "Living World"

get_current_phase_description() -> String: use active_path from GameState to pick correct description text. Narrator voice.

get_path_display_name(path: String) -> String: return human-readable path names for the TechTreeUI path selector.

is_unlocked() -> bool: check "mercury_phase_2" equivalent condition in GameState.
```

---

### `src/planets/VenusPlanet.gd`

```
Create src/planets/VenusPlanet.gd for Helioscape. Extends PlanetBase.

planet_id = "venus"
get_unlock_condition() -> String: return "mercury_phase_2"

Venus has three paths with very different approaches (shade mirror / carbonate sequestration / Europa spin-up impact).

get_terraforming_display_name(phase: int) -> String:
- Phase 0: "Hellworld — 465°C, 92 atm"
- Phase 1: "Cooling Begins"
- Phase 2 (path_a — shade mirror): "Mirror Deployed"
- Phase 2 (path_b — carbonate): "Carbonate Rain"
- Phase 2 (path_c — Europa impact): "Spin-Up In Progress"
- Phase 3: "Cloud City Era" (for path_a/b: sky cities viable as surface cools; path_c: spin-up complete, surface accessible sooner)
- Phase 4: "Second Earth"

Venus path_c involves the Europa decision (GDD's most morally complex moment). Authorising path_c starts the Europa mission timer (decades-long). get_path_description(path: "venus_path_c") should reflect this weight.

get_current_phase_description() -> String: narrator voice, reflect current path's character.

Europa integration: if GameState.europa_mission_authorised == true and active_path == "venus_path_c", expose get_europa_eta(current_year: float) -> float that returns estimated impact year. Used by a HUD element to show countdown.
```

---

## Scene notes

---

### `scenes/Main.tscn`, `scenes/SolarSystem.tscn`, `scenes/planets/PlanetView.tscn`, `scenes/planets/MercuryBase.tscn`

```
Note: .tscn files are created in the Godot editor, not via text. These prompts describe the scene structure for you to build manually or ask Cursor to scaffold GDScript that expects this structure.

scenes/Main.tscn node structure:
- Main (Node) — root
  - Systems (Node) — parent for all system nodes
    - TechTreeSystem
    - ResearchSystem
    - ResourceSystem
    - TerraformingSystem
    - DysonSystem
    - CultureEventSystem
    - KardashevSystem
  - UI (CanvasLayer)
    - HUD
    - PlanetPanel (hidden by default)
    - CultureEventCard (hidden by default)
    - CultureEventQueue
  - SolarSystem (SubViewport → PixelFilter)
    - SolarSystemView

scenes/SolarSystem.tscn:
- SolarSystemView (Node2D or Node3D depending on orrery implementation)
  - Sun (MeshInstance3D or Sprite2D)
  - [PlanetOrbit instances added at runtime by SolarSystemView.gd]

scenes/planets/PlanetView.tscn:
- PlanetView (Node3D)
  - PlanetSphere (MeshInstance3D — SphereMesh, PlanetSurface.gdshader material)
  - AtmosphereShell (MeshInstance3D — slightly larger sphere, Atmosphere.gdshader)
  - PlanetVisual.gd (attached to PlanetView root)

scenes/planets/MercuryBase.tscn:
- MercuryBase (Node2D) — 2D isometric base builder view
  - HexGrid (TileMap or custom grid)
  - BuildingLayer (Node2D — placed buildings)
  - UIOverlay (CanvasLayer — queue, resource counters)
  (This scene is the most complex and is post-Phase-1 — implement after core systems are working)

Ask Cursor to help write the GDScript that sets up each scene programmatically if you prefer code-first scene building.
```

---

## Bonus: Project setup prompt

---

### Godot Project Settings

```
Help me configure a new Godot 4 project for Helioscape with the following settings:

1. Register autoloads in this exact order (order matters — DataManager loads first):
   - DataManager → res://src/autoloads/DataManager.gd
   - GameState → res://src/autoloads/GameState.gd
   - EventBus → res://src/autoloads/EventBus.gd
   - TimeManager → res://src/autoloads/TimeManager.gd
   - SaveManager → res://src/autoloads/SaveManager.gd

2. Set the main scene to res://scenes/Main.tscn.

3. Rendering: use Forward+ renderer. Enable HDR. The PixelFilter shader requires a SubViewport — explain how to set up a SubViewport that captures the 3D scene and feeds into a TextureRect with the PixelFilter shader applied.

4. Pixel snap: do NOT enable pixel snap in project settings — the pixel art look is achieved via the post-process shader, not Godot's built-in pixel snap (which would conflict with 3D rendering).

5. Input map: add actions — ui_pause (Space), ui_speed_toggle (Tab), ui_open_history (H).

6. Provide the project.godot settings diff or the manual steps to configure this in the Godot editor.
```

---

*End of prompts. Work top to bottom. Each prompt is one Cursor task — one file, one job.*
