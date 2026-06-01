# Helioscape — Architecture Document
> Godot 4 / GDScript · Solo dev (Jos) · v1.0

---

## Philosophy

Three rules that govern every decision in this codebase:

1. **Data lives in JSON.** No planet, tech node, research track, or culture event is hardcoded in GDScript. All content is authored in `data/` files and loaded at runtime. Adding a new planet means adding a JSON entry, not a new script.
2. **Logic never talks to UI.** Systems compute game state and emit signals. UI reads state and reacts to signals. A system never holds a reference to a UI node.
3. **One file, one job.** Every script has a single, clear responsibility. AI assistants work best on small, well-scoped files — this is also good software design.

---

## Project Folder Structure

```
helioscape/
│
├── data/                          # All authored game content (JSON)
│   ├── planets.json
│   ├── tech_tree.json
│   ├── research_tracks.json
│   ├── culture_events.json
│   ├── kardashev_milestones.json
│   └── resources.json
│
├── src/
│   ├── autoloads/                 # Global singletons — registered in Project Settings
│   │   ├── GameState.gd           # Single source of truth for all mutable game state
│   │   ├── EventBus.gd            # All cross-system signals live here
│   │   ├── TimeManager.gd         # Game clock, speed controls, pause
│   │   ├── DataManager.gd         # Loads + caches all JSON data
│   │   └── SaveManager.gd         # Serialise / deserialise GameState to disk
│   │
│   ├── systems/                   # Pure logic — no UI nodes, no scene dependencies
│   │   ├── TechTreeSystem.gd      # Prerequisite checking, node unlocking
│   │   ├── ResearchSystem.gd      # RP capacity, active tracks, completion
│   │   ├── ResourceSystem.gd      # Mercury resource accumulation + spending
│   │   ├── TerraformingSystem.gd  # Phase transitions, progress tracking per planet
│   │   ├── DysonSystem.gd         # Panel queue, energy output, milestones
│   │   ├── CultureEventSystem.gd  # Trigger conditions, queue, history
│   │   └── KardashevSystem.gd     # Milestone condition checking
│   │
│   ├── planets/                   # Planet-specific logic (thin wrappers over systems)
│   │   ├── PlanetBase.gd          # Shared interface all planets implement
│   │   ├── EarthPlanet.gd
│   │   ├── MercuryPlanet.gd
│   │   ├── MarsPlanet.gd
│   │   └── VenusPlanet.gd
│   │
│   ├── ui/                        # All UI scripts — read state, send input
│   │   ├── solar_system/
│   │   │   ├── SolarSystemView.gd
│   │   │   └── PlanetOrbit.gd
│   │   ├── planet_panel/
│   │   │   ├── PlanetPanel.gd
│   │   │   ├── PlanetVisual.gd    # Controls shader params on the planet sphere
│   │   │   ├── TechTreeUI.gd
│   │   │   ├── ResearchUI.gd
│   │   │   └── VignetteDisplay.gd
│   │   ├── hud/
│   │   │   ├── HUD.gd
│   │   │   ├── TimeControls.gd
│   │   │   └── KardashevBar.gd
│   │   └── culture_events/
│   │       ├── CultureEventCard.gd
│   │       └── CultureEventQueue.gd
│   │
│   └── shaders/
│       ├── PlanetSurface.gdshader  # Layered planet texture + growing spots
│       ├── Atmosphere.gdshader     # Atmospheric glow rim
│       ├── DysonSwarm.gdshader     # Particle-based swarm visualisation
│       └── PixelFilter.gdshader    # Post-process pixel art filter
│
├── scenes/
│   ├── Main.tscn                  # Root scene, loads autoloads
│   ├── SolarSystem.tscn
│   └── planets/
│       ├── PlanetView.tscn        # Shared scene, populated from data
│       └── MercuryBase.tscn       # Mercury isometric view (unique)
│
└── assets/
    ├── textures/planets/          # Per-planet layer textures
    ├── textures/ui/
    ├── audio/
    └── fonts/
```

---

## Autoloads (Singletons)

Registered in **Project → Project Settings → Autoload** in this order:

### `DataManager.gd`
Loads all JSON files on `_ready()` and exposes typed dictionaries. Everything else reads from here. Never writes.

```gdscript
# Usage from anywhere:
var mars_data = DataManager.get_planet("mars")
var nodes = DataManager.get_tech_tree_for("earth")
```

### `GameState.gd`
The single source of truth. All mutable runtime state lives here as plain data (Dictionaries + primitives). Systems modify GameState; UI reads it.

```gdscript
# Key state buckets:
var game_year: float = 2033.0
var planets: Dictionary = {}       # keyed by planet_id
var active_research: Array = []
var kardashev_tags: Array = []     # "naturalist" / "architect" tags
var dyson_energy_watts: float = 0.0
```

### `EventBus.gd`
All cross-system signals are declared here. Nothing imports a specific system to connect to its signals — everything goes through EventBus.

```gdscript
# Emitted by systems, listened to by UI and other systems:
signal tech_node_unlocked(planet_id: String, node_id: String)
signal research_track_completed(track_id: String)
signal terraforming_phase_changed(planet_id: String, phase: int)
signal culture_event_triggered(event_id: String)
signal kardashev_milestone_reached(milestone_id: String)
signal dyson_energy_updated(watts: float)
signal game_year_ticked(year: float)
signal planet_visual_params_changed(planet_id: String, params: Dictionary)
```

### `TimeManager.gd`
Owns the game clock. Emits `EventBus.game_year_ticked` every 2 real seconds at 1× speed. Other systems listen and update accordingly. Handles pause and speed multiplier.

### `SaveManager.gd`
Serialises `GameState` to a JSON file on disk. Deserialises on load. Versioned (include `save_version` key). Systems are stateless — all state is in GameState, so save/load is a single read/write operation.

---

## Data Layer — JSON Schemas

### `planets.json`
```json
{
  "mars": {
    "id": "mars",
    "display_name": "Mars",
    "unlock_condition": "mercury_phase_2",
    "initial_state": {
      "atmosphere_pressure": 0.006,
      "temperature_celsius": -60,
      "terraforming_phase": 0
    },
    "visual": {
      "base_color": "#c1440e",
      "layer_textures": {
        "surface": "res://assets/textures/planets/mars_surface.png",
        "water": "res://assets/textures/planets/mars_water.png",
        "green": "res://assets/textures/planets/mars_green.png",
        "cloud": "res://assets/textures/planets/mars_cloud.png"
      },
      "water_spot_uvs": [
        [0.3, 0.5], [0.6, 0.4], [0.45, 0.65],
        [0.7, 0.55], [0.2, 0.35]
      ],
      "green_spot_uvs": [
        [0.35, 0.45], [0.55, 0.6], [0.25, 0.55]
      ]
    },
    "terraforming_paths": ["mars_path_a", "mars_path_b", "mars_path_c"]
  }
}
```

### `tech_tree.json`
```json
{
  "earth_fusion_ignition": {
    "id": "earth_fusion_ignition",
    "planet": "earth",
    "display_name": "Fusion Ignition Theory",
    "prerequisites": ["earth_deuterium_extraction"],
    "spillover_prerequisites": [],
    "rp_cost": 50,
    "duration_years": 40,
    "effects": [
      { "type": "unlock_tech", "target": "earth_fusion_prototype" },
      { "type": "emit_event", "event_id": "ce_fusion_theory_complete" }
    ]
  }
}
```

### `culture_events.json`
```json
{
  "ce_fusion_theory_complete": {
    "id": "ce_fusion_theory_complete",
    "title": "The Theory Is Sound",
    "narrator_text": "It's here. After forty years of iteration, the equations finally close...",
    "portrait": "res://assets/textures/ui/ce_fusion_lab.png",
    "choices": [],
    "tags": [],
    "trigger": { "type": "tech_completed", "tech_id": "earth_fusion_ignition" }
  }
}
```

---

## Planet Visual System — Layered Shader

The most visually distinctive system. A planet sphere uses a single spatial shader with three composited layers. Layer opacity and spot growth are driven entirely by shader uniform parameters, which are set by `PlanetVisual.gd` in response to terraforming progress.

### Layer Architecture

| Layer | Texture | Driven by |
|---|---|---|
| 0 — Surface | base rock/dust color | Always visible (opacity 1.0) |
| 1 — Water | water/ocean | `water_opacity` + `water_growth_radius` |
| 2 — Green | vegetation | `green_opacity` + `green_growth_radius` |
| 3 — Cloud | white color | Always visible (opacity 1.0) - not implemented yet in code below | 

### Growing Spot Mechanic

Water and vegetation don't flood the planet uniformly — they grow outward from multiple fixed UV seed points simultaneously, creating the impression of lakes/forests spreading. This is the "circular CSS clip-path" idea translated to a GLSL shader:

```glsl
// Simplified concept for PlanetSurface.gdshader

shader_type spatial;

uniform sampler2D layer_surface : source_color, hint_default_white;
uniform sampler2D layer_water : source_color, hint_default_transparent;
uniform sampler2D layer_green : source_color, hint_default_transparent;

// Up to 8 seed points per layer (passed as vec2 array)
uniform vec2 water_spots[8];
uniform int water_spot_count = 0;
uniform float water_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float water_opacity : hint_range(0.0, 1.0) = 0.0;

uniform vec2 green_spots[8];
uniform int green_spot_count = 0;
uniform float green_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float green_opacity : hint_range(0.0, 1.0) = 0.0;

uniform float edge_softness : hint_range(0.005, 0.08) = 0.025;
uniform vec4 atmosphere_tint : source_color = vec4(0.4, 0.7, 1.0, 0.0);

// Returns 0.0-1.0: how much this UV is covered by any spot
float spot_coverage(vec2 uv, vec2 spots[8], int count, float radius) {
    float coverage = 0.0;
    for (int i = 0; i < count; i++) {
        float dist = distance(uv, spots[i]);
        coverage = max(coverage, 1.0 - smoothstep(radius - edge_softness, radius, dist));
    }
    return coverage;
}

void fragment() {
    vec2 uv = UV;

    vec4 surface_col = texture(layer_surface, uv);
    vec4 water_col   = texture(layer_water, uv);
    vec4 green_col   = texture(layer_green, uv);

    // Blend water layer
    float water_mask = spot_coverage(uv, water_spots, water_spot_count, water_growth_radius);
    vec4 result = mix(surface_col, water_col, water_mask * water_opacity);

    // Blend green layer on top
    float green_mask = spot_coverage(uv, green_spots, green_spot_count, green_growth_radius);
    result = mix(result, green_col, green_mask * green_opacity);

    // Atmosphere tint
    result.rgb = mix(result.rgb, atmosphere_tint.rgb, atmosphere_tint.a);

    ALBEDO = result.rgb;
}
```

### `PlanetVisual.gd` — Driving the Shader

`PlanetVisual.gd` sits in the scene and translates game state into shader parameters. It listens to `EventBus.planet_visual_params_changed` and uses a `Tween` for smooth transitions.

```gdscript
# PlanetVisual.gd (abbreviated)
func _on_params_changed(planet_id: String, params: Dictionary) -> void:
    if planet_id != _planet_id:
        return
    var tween = create_tween().set_trans(Tween.TRANS_SINE)
    tween.tween_method(
        _set_water_growth.bind(),
        material.get_shader_parameter("water_growth_radius"),
        params.water_growth_radius,
        params.get("transition_duration", 5.0)
    )

func _set_water_growth(value: float) -> void:
    material.set_shader_parameter("water_growth_radius", value)
```

---

## Systems — Responsibilities

Each system is a plain `Node` (not a scene). They are children of a `Systems` node in `Main.tscn`.

| System | Listens to | Modifies GameState | Emits via EventBus |
|---|---|---|---|
| `TechTreeSystem` | User input (node clicked) | `planets[id].unlocked_techs` | `tech_node_unlocked` |
| `ResearchSystem` | `game_year_ticked` | `active_research`, RP used | `research_track_completed` |
| `ResourceSystem` | `game_year_ticked` | Mercury resource counters | _(internal)_ |
| `TerraformingSystem` | `game_year_ticked`, tech unlocked | `planets[id].terraforming` | `terraforming_phase_changed`, `planet_visual_params_changed` |
| `DysonSystem` | `game_year_ticked`, resource spent | `dyson_energy_watts` | `dyson_energy_updated` |
| `CultureEventSystem` | All events, year ticked | `culture_event_history` | `culture_event_triggered` |
| `KardashevSystem` | Multiple milestone signals | `kardashev_level` | `kardashev_milestone_reached` |

---

## AI Task Scoping Guidelines

When asking an AI agent to write or edit code, scope tasks to a single file. Never ask an AI to "set up the research system and connect it to the UI." Split it:

| Task | File |
|---|---|
| Define the research track data schema | `data/research_tracks.json` |
| Write track completion logic | `src/systems/ResearchSystem.gd` |
| Write the UI that displays active tracks | `src/ui/planet_panel/ResearchUI.gd` |
| Write the shader for the planet surface | `src/shaders/PlanetSurface.gdshader` |
| Drive shader params from game state | `src/ui/planet_panel/PlanetVisual.gd` |

The agent should never need to hold more than one of these files in context at a time to do good work.

---

## Coding Conventions

- **GDScript 4 static typing always.** Every variable and function parameter has a declared type.
- **Signals over direct calls** for cross-node communication. Prefer `EventBus.signal_name.emit()`.
- **No `get_node()` paths longer than one level** in UI scripts. Cache node references in `_ready()`.
- **Constants in UPPER_SNAKE_CASE**, variables in `snake_case`, classes in `PascalCase`.
- **Comments explain *why*, not what.** The code shows what; comments explain design intent.
- **One `_process()` per autoload max.** Systems update via signal, not per-frame polling.

---

## Save / Load Strategy

`GameState` is a plain data object. `SaveManager` serialises it with `JSON.stringify()` and writes to `user://save_slot_1.json`. On load, it deserialises and overwrites GameState properties. Because all state lives in GameState and all systems are stateless, this is the entire save system.

Include `save_version: 1` in the save file root. Migrations are functions keyed by version number.

---

## Rendering Pipeline

```
3D Viewport (MeshInstance3D sphere per planet)
    └── PlanetSurface.gdshader  (layered texture + spots)
    └── Atmosphere.gdshader     (rim glow, SubViewport overlay)
        ↓
SubViewport → PixelFilter.gdshader (post-process, pixelates at 6-8fps)
    ↓
Final composited image in UI
```

The pixel filter runs on the entire 3D viewport output, not per-object. This keeps all 3D geometry smooth and the pixelation is purely a post-process aesthetic.

---

## Phase 1 Build Order (Recommended)

Build in this order to have something playable as early as possible:

1. `DataManager` + `planets.json` — data loading works
2. `GameState` + `TimeManager` — clock ticks, year increments
3. `PlanetSurface.gdshader` — planet sphere renders with layers
4. `PlanetVisual.gd` — shader params respond to test values
5. `SolarSystemView` — orrery displays planets from JSON
6. `TechTreeSystem` + `tech_tree.json` — nodes unlock
7. `ResearchSystem` + `research_tracks.json` — tracks run
8. `TerraformingSystem` — phases progress, visual params update
9. `CultureEventSystem` — events fire and display
10. `DysonSystem` — Dyson swarm energy builds
11. `SaveManager` — persist and restore game state
12. `KardashevSystem` — milestone conditions checked
