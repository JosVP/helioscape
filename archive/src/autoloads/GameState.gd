extends Node

# Single source of truth for mutable runtime state. Systems mutate this data; UI reads it.

var game_year: float = 2033.0
var game_speed: int = 1
var is_paused: bool = false
var is_first_playthrough: bool = true

# Planets keyed by planet_id.
var planets: Dictionary = {}
# Per-planet structure (initialised by TerraformingSystem from DataManager on game start):
# {
#     "terraforming_phase": int,
#     "terraforming_progress": float,
#     "terraforming_choices": Dictionary,
#     "locked_out_choices": Array,
#     "population": int,
#     "atmosphere_pressure": float,
#     "temperature_celsius": float,
#     "visual_params": Dictionary
# }
# Terraforming choices are additive, not exclusive forks. A planet can have both
# mars_orbital_mirrors and mars_magnetic_umbrella active at the same time. Only
# physically irreversible conflicts belong in locked_out_choices.

var mercury_phase: int = 0
var mercury_resources: Dictionary = {"common_ore": 0.0, "rare_metals": 0.0, "polar_volatiles": 0.0}
var mercury_radiation_clear_year: float = 0.0
var mercury_starting_zone_selected: bool = false
var mercury_starting_zone_id: int = -1
var mercury_node_states: Dictionary = {}
var mercury_queue: Array = []
var mercury_queue_active_index: int = -1
var mercury_queue_active_remaining_years: float = 0.0
var mercury_miners: Array = []
var mercury_refinery_assignments: Dictionary = {}

var dyson_energy_watts: float = 0.0
var dyson_panel_count: int = 0
var dyson_panel_tier: String = "basic"
var dyson_coverage_percent: float = 0.0

var active_research: Array = []
# Each entry: { "track_id": String, "planet_id": String, "progress_years": float, "is_paused": bool }
var completed_research_years: Dictionary = {}
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
var naturalist_ratio: float = 0.0

var europa_mission_authorised: bool = false
var europa_impact_year: float = 0.0
var europa_impacted: bool = false
var europa_life_confirmed: bool = false

# Orrery state.
var orrery_zoomed_planet: String = ""


func reset() -> void:
	game_year = 2033.0
	game_speed = 1
	is_paused = false
	is_first_playthrough = true

	planets = {}

	mercury_phase = 0
	mercury_resources = {"common_ore": 0.0, "rare_metals": 0.0, "polar_volatiles": 0.0}
	mercury_radiation_clear_year = 0.0
	mercury_starting_zone_selected = false
	mercury_starting_zone_id = -1
	mercury_node_states = {}
	mercury_queue = []
	mercury_queue_active_index = -1
	mercury_queue_active_remaining_years = 0.0
	mercury_miners = []
	mercury_refinery_assignments = {}

	dyson_energy_watts = 0.0
	dyson_panel_count = 0
	dyson_panel_tier = "basic"
	dyson_coverage_percent = 0.0

	active_research = []
	completed_research_years = {}
	total_rp_capacity = 60
	used_rp_capacity = 0

	kardashev_level = 0.73
	kardashev_tags = []

	culture_event_history = []
	culture_event_queue = []

	completed_techs = []
	completed_milestones = []

	naturalist_decisions = 0
	architect_decisions = 0
	naturalist_ratio = 0.0

	europa_mission_authorised = false
	europa_impact_year = 0.0
	europa_impacted = false
	europa_life_confirmed = false

	orrery_zoomed_planet = ""
