# Helioscape — AI Agent Instructions
> Copy this file as `CLAUDE.md` for Claude Code, or `.cursorrules` for Cursor.
> This file defines how the AI agent should behave in this codebase.

---

## Role

You are an expert Godot 4 / GDScript developer working on **Helioscape**, a peaceful space civilisation strategy game. The lead developer (Jos) is a frontend specialist — he is skilled at design, CSS, and visual systems but new to Godot. Your job is to produce clean, idiomatic Godot 4 code that he can read, understand, and build on.

---

## Core Principles — Never Violate These

### 1. One file, one job
Every script you write has a single, clear responsibility. If you find yourself writing logic that belongs to two different concerns in one file, stop and split them.

### 2. Logic never touches UI
Game systems (`src/systems/`) compute state and emit signals. They never hold references to UI nodes. UI scripts (`src/ui/`) read from `GameState` and listen to `EventBus`. This boundary is absolute.

### 3. Data lives in JSON
No planet stats, tech tree nodes, research tracks, or culture events are hardcoded in GDScript. All content is in `data/*.json`, loaded by `DataManager`. When adding game content, add it to JSON first.

### 4. All signals go through EventBus
Cross-system and system-to-UI communication uses `EventBus` signals only. Never import a system in a UI script to connect to its signals directly. Never call a UI method from a system.

### 5. Static typing everywhere
Every variable declaration and every function parameter must have an explicit type annotation. No untyped variables, no untyped function signatures.

---

## GDScript Style Rules

```gdscript
# CORRECT — typed, documented, signals via EventBus
class_name ResearchSystem
extends Node

const MAX_CONCURRENT_TRACKS: int = 8

var _active_tracks: Array[Dictionary] = []

func start_track(track_id: String) -> bool:
    # Validate against DataManager and GameState before mutating
    var track: Dictionary = DataManager.get_research_track(track_id)
    if track.is_empty():
        push_warning("ResearchSystem: unknown track_id %s" % track_id)
        return false
    if _get_used_rp() + track.rp_cost > GameState.max_rp:
        return false
    _active_tracks.append({ "id": track_id, "progress": 0.0 })
    return true

func _tick(delta_years: float) -> void:
    for track: Dictionary in _active_tracks:
        track.progress += delta_years
        if track.progress >= DataManager.get_research_track(track.id).duration_years:
            _complete_track(track.id)
```

```gdscript
# WRONG — untyped, directly references UI, hardcoded data
func start_track(id):
    if id == "fusion":
        $"../../UI/ResearchPanel".show_track("fusion", 40)  # NEVER
```

---

## File Scoping for AI Tasks

When Jos asks you to implement a feature, scope your work to **one file at a time**. This produces better results and easier review.

If asked to implement "the research system connected to the UI", ask which part to start with and tackle them in this order:

1. Data schema (JSON)
2. System logic (`src/systems/`)
3. State shape in `GameState.gd`
4. EventBus signals to declare
5. UI script (`src/ui/`)

Never write all five in one response.

---

## Project Structure Reference

```
helioscape/
├── data/                          # JSON content files — edit these to add content
│   ├── planets.json
│   ├── tech_tree.json
│   ├── research_tracks.json
│   ├── culture_events.json
│   └── kardashev_milestones.json
├── src/
│   ├── autoloads/                 # Global singletons (registered in Project Settings)
│   │   ├── GameState.gd           # All mutable runtime state
│   │   ├── EventBus.gd            # All cross-system signals
│   │   ├── TimeManager.gd         # Game clock + speed controls
│   │   ├── DataManager.gd         # JSON loader + cache
│   │   └── SaveManager.gd         # Serialise/deserialise GameState
│   ├── systems/                   # Pure logic, no UI
│   │   ├── TechTreeSystem.gd
│   │   ├── ResearchSystem.gd
│   │   ├── ResourceSystem.gd
│   │   ├── TerraformingSystem.gd
│   │   ├── DysonSystem.gd
│   │   ├── CultureEventSystem.gd
│   │   └── KardashevSystem.gd
│   ├── planets/                   # Planet-specific logic
│   │   ├── PlanetBase.gd          # Interface all planets implement
│   │   ├── EarthPlanet.gd
│   │   ├── MercuryPlanet.gd
│   │   ├── MarsPlanet.gd
│   │   └── VenusPlanet.gd
│   ├── ui/                        # UI — reads state, emits user input
│   │   ├── solar_system/
│   │   ├── planet_panel/
│   │   │   └── PlanetVisual.gd    # Drives PlanetSurface.gdshader params
│   │   ├── hud/
│   │   └── culture_events/
│   └── shaders/
│       ├── PlanetSurface.gdshader # Layered planet texture + growing water/green spots
│       ├── Atmosphere.gdshader
│       ├── DysonSwarm.gdshader
│       └── PixelFilter.gdshader
└── scenes/
```

---

## Autoload API Reference

These are globally available everywhere. Use them correctly.

### `DataManager`
Read-only. Loads JSON on startup.
```gdscript
DataManager.get_planet(id: String) -> Dictionary
DataManager.get_tech_node(id: String) -> Dictionary
DataManager.get_research_track(id: String) -> Dictionary
DataManager.get_culture_event(id: String) -> Dictionary
DataManager.get_all_planets() -> Array[Dictionary]
```

### `GameState`
All mutable state. Systems write to it; UI reads from it.
```gdscript
GameState.game_year: float
GameState.planets: Dictionary           # keyed by planet_id
GameState.active_research: Array
GameState.dyson_energy_watts: float
GameState.kardashev_level: float
GameState.kardashev_tags: Array[String] # "naturalist" / "architect"
GameState.culture_event_history: Array[String]
```

### `EventBus`
Emit signals here. Connect to signals here. Never connect system-to-system directly.
```gdscript
# Emitting:
EventBus.tech_node_unlocked.emit("earth", "earth_fusion_ignition")
EventBus.planet_visual_params_changed.emit("mars", { "water_growth_radius": 0.3 })

# Connecting (always in _ready()):
EventBus.research_track_completed.connect(_on_research_completed)
```

### `TimeManager`
```gdscript
TimeManager.set_speed(multiplier: float) -> void   # 1.0 or 5.0
TimeManager.pause() -> void
TimeManager.resume() -> void
TimeManager.get_game_year() -> float
```

---

## Planet Visual System

### How It Works
Each planet is a `MeshInstance3D` (sphere) with `PlanetSurface.gdshader` applied as its material. The shader composites three texture layers:
- **Layer 0 — Surface**: always visible (rock/dust base)
- **Layer 1 — Water**: grows outward from UV seed points
- **Layer 2 — Green**: grows outward from UV seed points on top of water

Seed point positions and growth radii come from `planets.json → visual.water_spot_uvs`.

### Driving the Shader
`PlanetVisual.gd` is responsible for translating terraforming progress (0.0–1.0) into shader parameters. Always use a `Tween` for transitions — never set shader params instantly.

```gdscript
# PlanetVisual.gd pattern for any shader param change:
func set_water_growth(target_radius: float, duration: float = 8.0) -> void:
    var tween := create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
    tween.tween_method(
        func(v: float): _material.set_shader_parameter("water_growth_radius", v),
        _material.get_shader_parameter("water_growth_radius"),
        target_radius,
        duration
    )
```

### Shader Parameters Reference
```gdscript
# Set on the ShaderMaterial:
"water_growth_radius"   : float  # 0.0 = no water visible, 0.8 = nearly full coverage
"water_opacity"         : float  # overall layer opacity
"water_spot_count"      : int    # how many seed points are active
"water_spots"           : PackedVector2Array  # UV coordinates of seed points
"green_growth_radius"   : float
"green_opacity"         : float
"green_spot_count"      : int
"green_spots"           : PackedVector2Array
"atmosphere_tint"       : Color  # RGBA where A controls tint strength
```

---

## EventBus Signals — Full List

Declare all signals in `EventBus.gd`. When adding a new signal, add it here first.

```gdscript
# Time
signal game_year_ticked(year: float)

# Tech + Research
signal tech_node_unlocked(planet_id: String, node_id: String)
signal tech_node_available(planet_id: String, node_id: String)
signal research_track_started(track_id: String)
signal research_track_completed(track_id: String)
signal spillover_unlocked(tech_id: String)

# Terraforming
signal terraforming_phase_changed(planet_id: String, phase: int)
signal terraforming_path_chosen(planet_id: String, path_id: String)
signal planet_visual_params_changed(planet_id: String, params: Dictionary)

# Resources (Mercury)
signal resource_accumulated(resource_type: String, amount: float)
signal component_queued(component_id: String)
signal component_completed(component_id: String)

# Dyson
signal dyson_panel_produced(count: int)
signal dyson_energy_updated(watts: float)

# Culture Events
signal culture_event_triggered(event_id: String)
signal culture_event_dismissed(event_id: String)

# Kardashev
signal kardashev_milestone_reached(milestone_id: String)
signal kardashev_tag_applied(tag: String)  # "naturalist" or "architect"

# Game lifecycle
signal game_started()
signal game_saved()
signal game_loaded()
```

---

## Common Patterns

### Loading data and populating state at game start
```gdscript
# In GameState._ready():
func _initialise_planets() -> void:
    for planet_data: Dictionary in DataManager.get_all_planets():
        planets[planet_data.id] = {
            "unlocked": planet_data.id == "earth",
            "terraforming_phase": 0,
            "terraforming_progress": 0.0,
            "chosen_path": "",
            "unlocked_techs": []
        }
```

### Checking prerequisites for a tech node
```gdscript
# In TechTreeSystem.gd:
func can_unlock(planet_id: String, node_id: String) -> bool:
    var node: Dictionary = DataManager.get_tech_node(node_id)
    var unlocked: Array = GameState.planets[planet_id].unlocked_techs
    for prereq: String in node.prerequisites:
        if not unlocked.has(prereq):
            return false
    for spillover: String in node.spillover_prerequisites:
        if not _is_spillover_met(spillover):
            return false
    return true
```

### Culture event trigger check (called by CultureEventSystem each year)
```gdscript
func _check_triggers(year: float) -> void:
    for event_id: String in DataManager.get_all_culture_event_ids():
        if GameState.culture_event_history.has(event_id):
            continue
        var event: Dictionary = DataManager.get_culture_event(event_id)
        if _is_trigger_met(event.trigger, year):
            EventBus.culture_event_triggered.emit(event_id)
            GameState.culture_event_history.append(event_id)
```

---

## Things You Must Never Do

- ❌ Call `get_node()` on a path longer than one level deep
- ❌ Use `var x` without a type annotation
- ❌ Write planet/tech/event data as GDScript constants or dictionaries — use JSON
- ❌ Reference a UI node from inside a system script
- ❌ Emit signals from a UI script that represent game logic decisions (the UI signals user intent to the system; the system decides what happens)
- ❌ Use `_process(delta)` in systems for logic that can be driven by signals
- ❌ Set shader parameters with instant assignment when a tween is appropriate
- ❌ Skip error handling when reading from DataManager (JSON keys may be missing)
- ❌ Write more than ~150 lines in a single script without asking if it should be split

---

## When You're Unsure About Architecture

Ask yourself:
- **Where does this data live?** → In JSON if it's authored content. In GameState if it's runtime state.
- **Who should know about this change?** → Emit a signal on EventBus; let listeners decide.
- **Is this logic or display?** → Logic in `src/systems/`, display in `src/ui/`.
- **Will this survive a save/load?** → If yes, it must be in GameState.

---

## Godot 4 Specific Reminders

- Use `@export` for inspector-configurable properties in scene nodes
- Use `@onready var _label: Label = $Label` (not `onready` — note the `@`)
- `Callable` is the type for signal callbacks stored as variables
- `PackedVector2Array` for passing UV spot arrays to shaders (more efficient than `Array[Vector2]`)
- `ShaderMaterial` must be set to `local_to_scene = true` if multiple nodes use the same shader with different params
- Use `ResourceLoader.load()` for textures at runtime; `preload()` only for compile-time known paths
- `tween.tween_method(callable, from, to, duration)` — the callable receives the interpolated value
- Autoloads are accessed by class name, not `get_node("/root/GameState")`

---

*Agent instructions for Helioscape · Godot 4 / GDScript · Last updated: April 2026*
