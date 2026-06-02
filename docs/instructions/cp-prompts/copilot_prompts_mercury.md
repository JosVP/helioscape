# Helioscape — Copilot Prompts: Mercury

Use one prompt at a time in Copilot Chat. If you already have Mercury-related autoloads or scenes, mention them in the same chat so the generated code matches the existing structure.

Here are two prompts. Adjust node names and autoload references to match your existing project structure.

Prompt 1 — Mercury Map, Camera & Building System
Create a MercuryMap scene in Godot 4 (GDScript) for a strategy game 
called Helioscape. Mercury is an RTS-lite base builder the player 
expands over the course of the game.

SCENE STRUCTURE
MercuryMap (Node2D)
  Camera2D
  TileMap (square grid, isometric diamond orientation)
  NodesLayer (Node2D)
  UI (CanvasLayer)
    StartingZonePanel
    BuildPanel
    ResourceBar

MAP DATA
All node positions are hardcoded, not procedural. Define them as a 
Dictionary or Array of Resources. The map contains:

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

NODE STATES
Every placeable slot has a state enum:
  LOCKED — not reachable yet
  AVAILABLE — adjacent operational building exists, can build
  BUILDING — timer running, construction in progress
  OPERATIONAL — active

On scene load all nodes start LOCKED except those in the chosen 
starting zone.

STARTING ZONE SELECTION
On first Mercury visit show StartingZonePanel with 3 buttons, one 
per zone. Each button shows the zone name and ore type summary. 
On selection: mark that zone's nodes as AVAILABLE, hide panel 
permanently, emit signal starting_zone_chosen(zone_id: int).
Store choice in a persistent game state autoload so panel never 
shows again.

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

CAMERA
Edge-scroll panning: when mouse is within 40px of any screen edge, 
move Camera2D in that direction at constant speed. Clamp to map 
bounds. No zoom needed for prototype.

SIGNALS
  starting_zone_chosen(zone_id: int)
  building_completed(node_id: String, building_type: String)
  node_selected(node_id: String)

Prompt 2 — Miners, Resource Economy & Production Queue
Extend the existing MercuryMap scene in Godot 4 (GDScript) with 
the resource economy, miner units, and production queue.

RESOURCE COUNTERS
Add to the game state autoload (or a MercuryEconomy autoload):
  common_ore: float
  rare_metals: float
  volatiles: float

Each operational refinery runs a repeating Timer. On each tick it 
adds to its ore_type counter: amount = base_rate * miners_assigned. 
Emit resource_changed(ore_type: String, new_value: float) on change. 
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
- Miners only contribute to resource ticks while OPERATIONAL 
  (i.e. not REASSIGNING)

Miner assignment UI:
- Click operational refinery → show sidebar with miner slots 
  (max 4), each showing assigned miner or empty
- Empty slot + reserve miners available → Add Miner button 
  (assigns next idle miner from pool)
- Click assigned miner → Reassign button appears. Click 
  destination refinery to complete reassignment.
- Player starts with 4 miners in reserve. Additional miners 
  built via production queue (cost: common ore).

PRODUCTION QUEUE
Vertical queue, managed by MercuryEconomy. Displayed in a 
sidebar panel.

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

Queue UI:
- Scrollable VBoxContainer
- Each row: item label | cost icons | progress bar if active | 
  up/down arrows (hidden on default row)
- Default row visually distinct (greyed, locked icon)

SIGNALS
  resource_changed(ore_type: String, new_value: float)
  miner_reassigned(miner_id: int, new_refinery_id: String)
  component_delivered(component_type: String)
  dyson_panel_launched()

One note: the waypoint arrays in Prompt 2 are the one thing Copilot can't generate for you — those depend on where you've actually placed nodes on the map. Define those manually once you've laid out the map in the editor, then reference them by slot ID.
