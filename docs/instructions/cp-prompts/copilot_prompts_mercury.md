# Helioscape — Copilot Prompts: Mercury

Use one prompt at a time in Copilot Chat. These prompts are pre-aligned with the current Helioscape architecture (Godot 4 + strict typed GDScript + EventBus signals + GameState persistence).

Before using a prompt, include any existing Mercury scene or script names already in your project so Copilot can merge instead of re-inventing structure.

Prompt 1 — Mercury Map, Camera & Building System
Create and wire a Mercury map gameplay slice for Helioscape in Godot 4 GDScript.

Important project constraints:
- Static typing only. Type all vars, params, return values, and signals.
- One file, one responsibility.
- Systems must not reference UI nodes directly.
- Use EventBus for cross-system signals (do not connect systems directly).
- Persist mutable state in GameState.
- Use existing Mercury resource keys: common_ore, rare_metals, polar_volatiles.

Implement this in phases and provide code per file.

FILES TO CREATE/UPDATE (in this order)
1) data/mercury_map_nodes.json
2) src/systems/MercuryMapSystem.gd
3) src/autoloads/GameState.gd (only add Mercury map state keys)
4) src/autoloads/EventBus.gd (only add missing Mercury map signals)
5) src/ui/mercury/MercuryMapUI.gd (UI coordinator)
6) scenes/mercury/MercuryMap.tscn (scene wiring)

SCENE STRUCTURE
MercuryMap (Node2D)
  Camera2D
  TileMap (square grid, isometric diamond orientation)
  NodesLayer (Node2D)
  UI (CanvasLayer)
    StartingZonePanel
    BuildPanel
    ResourceBar

Use map interaction in MercuryMapSystem and keep UI behavior in MercuryMapUI.

MAP DATA
All node positions are hardcoded, not procedural. Load from data/mercury_map_nodes.json through DataManager. Map contains:

- 3 starting zones. Each zone is a named cluster of nearby nodes. 
  Described by ore composition e.g. "Common + Rare Metals", 
  "All three types spread out", "Volatiles heavy, near mass driver"
- 8 mining locations. Each has:
    ore_type: String ("common" | "rare_metals" | "volatiles")
    position: Vector2
    refinery_slots: Array[Vector2] (2-3 fixed adjacent positions)
- 6 factory slots (Vector2 positions near refinery clusters or 
  mass driver)
- 1 mass driver slot (fixed far-side position)
- 4 solar array slots

Each node/slot must have a stable string id.

NODE STATES
Every placeable slot has a state enum:
  LOCKED = 0
  AVAILABLE = 1
  BUILDING = 2
  OPERATIONAL = 3

On scene load all nodes start LOCKED except the chosen starting zone.

STARTING ZONE SELECTION
On first Mercury visit show StartingZonePanel with 3 buttons, one per zone.
Each button shows zone name and ore summary.
On selection:
- Mark selected zone nodes AVAILABLE.
- Persist selection in GameState (e.g. mercury_starting_zone_id and mercury_starting_zone_selected).
- Hide panel permanently for future visits.
- Emit via EventBus: starting_zone_chosen(zone_id: int).

BUILDING PLACEMENT
Player clicks an AVAILABLE slot:
- Show BuildPanel (building type is fixed per slot type — refinery 
  slots only offer Refinery, factory slots only offer Factory, etc.)
- Show resource costs vs current resources
- If affordable: Confirm starts construction. Deduct resources, 
  set state BUILDING, start a Timer (duration in game-years 
  converted to real seconds)
- On Timer timeout: set OPERATIONAL, unlock adjacent nodes 
  (set their state to AVAILABLE), emit 
  building_completed(node_id: String, building_type: String)

Use ResourceSystem for spend checks (can_spend_resources/spend_resources), do not duplicate economy logic.
Use TimeManager conversion rules for years->seconds consistency.

CAMERA
Edge-scroll panning: when mouse is within 40px of any screen edge, 
move Camera2D in that direction at constant speed. Clamp to map 
bounds. No zoom needed for prototype.

Add typed constants for pan margin, pan speed, and map clamp bounds.

SIGNALS
Add these to EventBus if missing:
  starting_zone_chosen(zone_id: int)
  building_completed(node_id: String, building_type: String)
  node_selected(node_id: String)

OUTPUT FORMAT
- For each file, show full typed code.
- Include a short note listing which EventBus signals are emitted/connected.
- Keep each script under ~150 lines where practical; split helpers if needed.

Prompt 2 — Miners, Resource Economy & Production Queue
Extend the existing Mercury map implementation with miners and production queue.

Important project constraints:
- Keep logic in systems, UI in ui scripts, communication through EventBus.
- Keep mutable values in GameState.
- Use existing resource ids: common_ore, rare_metals, polar_volatiles.
- Keep strict typing and one-file-one-job.

Implement/update these files in order:
1) src/systems/MercuryMiningSystem.gd
2) src/systems/MercuryQueueSystem.gd
3) src/systems/MinerUnit.gd
4) src/autoloads/GameState.gd (add only required queue/miner state)
5) src/autoloads/EventBus.gd (add missing signals)
6) src/ui/mercury/ResourceBar.gd
7) src/ui/mercury/ProductionQueuePanel.gd
8) src/ui/mercury/MinerAssignmentPanel.gd

RESOURCE COUNTERS
Use GameState.mercury_resources (Dictionary) as source of truth.
Ensure keys exist:
  common_ore: float
  rare_metals: float
  polar_volatiles: float

Each operational refinery runs a repeating Timer. On each tick it 
adds to its ore_type counter: amount = base_rate * miners_assigned. 
Emit EventBus.resource_accumulation_updated(resource_id: String, amount: float) on change. 
ResourceBar in UI listens to this signal and updates labels.

MINER UNITS
Miners are Node2D scenes with a Sprite2D (placeholder) and state 
machine. Each refinery has a max capacity of 4 miners.

Miner state enum:
  IDLE — in reserve, not assigned
  WALKING_TO_MINE — moving along waypoints toward mining location
  WALKING_TO_REFINERY — returning along waypoints
  REASSIGNING — walking straight line to a new refinery

Miner movement:
- Assigned path is a hardcoded Array[Vector2] of waypoints per 
  refinery slot (refinery pos → mine pos → refinery pos)
- Movement via Tween on each segment. On segment complete, advance 
  to next waypoint index, loop when complete
- On reassignment: finish current tween segment, then create a 
  new Tween to the new refinery position in a straight line, 
  then begin new slot's waypoint loop
- Miners only contribute while in active loop states (not REASSIGNING)

Miner assignment UI:
- Click operational refinery → show sidebar with miner slots 
  (max 4), each showing assigned miner or empty
- Empty slot + reserve miners available → Add Miner button 
  (assigns next idle miner from pool)
- Click assigned miner → Reassign button appears. Click 
  destination refinery to complete reassignment.
- Player starts with 4 miners in reserve. Additional miners 
  built via production queue (cost: common ore).

Emit EventBus.miner_reassigned(miner_id: int, new_refinery_id: String) when reassignment completes.

PRODUCTION QUEUE
Vertical queue managed by MercuryQueueSystem. Displayed in a sidebar panel.

Data structure per queue item:
  label: String
  costs: Dictionary (ore_type: amount)
  duration_years: float
  quantity: int
  is_default: bool

Rules:
- One permanent default item at bottom: Dyson Panel 
  (is_default: true, cannot be removed or reordered)
- Game systems and player can insert items above default
- Player can reorder non-default items with up/down arrows
- Active item (top of queue): check if resources available 
  each tick. When affordable: deduct resources, start progress 
  Timer. On complete: emit delivery signal, remove item (unless 
  default), begin next item.
- Default Dyson Panel repeats infinitely

On completion:
- Emit EventBus.component_completed(component_id: String) for normal items.
- Emit EventBus.dyson_panel_produced(count: int) for Dyson panel default loop.

Queue UI:
- Scrollable VBoxContainer
- Each row: item label | cost icons | progress bar if active | 
  up/down arrows (hidden on default row)
- Default row visually distinct (greyed, locked icon)

SIGNALS
Add to EventBus if missing:
  miner_reassigned(miner_id: int, new_refinery_id: String)

Reuse existing EventBus signals where possible:
  resource_accumulation_updated(resource_id: String, amount: float)
  component_queued(component_id: String)
  component_completed(component_id: String)
  dyson_panel_produced(count: int)

OUTPUT FORMAT
- Provide full typed code for each touched file.
- Include a compact test checklist for in-editor/manual verification.

One note: waypoint arrays in Prompt 2 must be authored manually after node layout is finalized in the editor. Reference paths by refinery slot id.
