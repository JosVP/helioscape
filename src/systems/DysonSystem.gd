class_name DysonSystem
extends Node

# Manages Dyson swarm panel accumulation, energy output, milestone triggers, and shader updates.
#
# Visual design: the Dyson swarm is a large transparent sphere around the Sun with procedural
# pixel clusters. This system drives two shader parameters:
# - dyson_coverage on DysonSwarm.gdshader (0.0–1.0): controls cluster fill density.
# - sun_dim_factor on the Sun mesh material (0.0 = full brightness, 1.0 = fully dimmed):
#   controls how much sunlight is blocked by the swarm as it grows.
# Both parameters are updated via set_shader_parameter() each game tick.

# Energy output per panel type (watts). These scale based on panel tier upgrades.
const ENERGY_PER_BASIC_PANEL: float = 1e12
const ENERGY_PER_MID_PANEL: float = 2.5e12
const ENERGY_PER_HARDENED_PANEL: float = 5e12

# Panel accumulation rate (subject to Mercury common_ore availability).
const PANELS_PER_YEAR_BASE: int = 2

# Total panels needed for 100% swarm coverage in shader visualization.
const TOTAL_PANELS_FOR_100_PERCENT: int = 1000

# References to shader materials. Set by Main.gd after the scene loads.
# Use public names (no underscore prefix) so Main.gd can write them via set().
var _dyson_sphere_material: ShaderMaterial = null
var _sun_material: ShaderMaterial = null


func set_dyson_sphere_material(mat: ShaderMaterial) -> void:
	_dyson_sphere_material = mat


func set_sun_material(mat: ShaderMaterial) -> void:
	_sun_material = mat


func _ready() -> void:
	EventBus.game_year_ticked.connect(_on_year_ticked)
	# Cache material refs from the Sun scene node.
	# TODO: these node references will depend on the Main.tscn scene structure.
	# Once the scene is set up, use @onready with the exact node path (e.g. @onready var _dyson_sphere_material: ShaderMaterial = $SunSphere.material),
	# or use a fallback to get_node() from the root of the scene tree if sharing shaders across nodes.
	# For now, these remain null until manually assigned or fetched at runtime.


func _on_year_ticked(_year: float) -> void:
	# Add panels each year (subject to Mercury common_ore availability).
	var ore_available: float = GameState.mercury_resources.get("common_ore", 0.0)
	var panels_this_year: int = PANELS_PER_YEAR_BASE if ore_available > 0.5 else 0
	GameState.mercury_resources["common_ore"] -= min(ore_available, float(panels_this_year) * 0.1)
	GameState.dyson_panel_count += panels_this_year

	# Recompute energy output based on current panel tier.
	var energy_per_panel: float = ENERGY_PER_BASIC_PANEL
	match GameState.dyson_panel_tier:
		"mid":
			energy_per_panel = ENERGY_PER_MID_PANEL
		"hardened":
			energy_per_panel = ENERGY_PER_HARDENED_PANEL

	GameState.dyson_energy_watts = float(GameState.dyson_panel_count) * energy_per_panel
	GameState.dyson_coverage_percent = (
		(float(GameState.dyson_panel_count) / float(TOTAL_PANELS_FOR_100_PERCENT)) * 100.0
	)

	# Update shader parameters to reflect swarm growth.
	_update_shader_parameters()

	# Emit energy update signal for other systems (e.g., KardashevSystem, CultureEventSystem).
	EventBus.dyson_energy_updated.emit(GameState.dyson_energy_watts)

	# Check milestone thresholds and record completion.
	_check_milestones()

	# CME (coronal mass ejection) event: Basic tier only, low probability per year.
	_check_cme_event()


func _update_shader_parameters() -> void:
	# Convert coverage percent (0–100) to 0–1 range for shader.
	var coverage_01: float = clampf(GameState.dyson_coverage_percent / 100.0, 0.0, 1.0)

	# Update Dyson swarm sphere shader.
	if _dyson_sphere_material:
		_dyson_sphere_material.set_shader_parameter("dyson_coverage", coverage_01)

	# Update Sun material shader. Cap sun dimming at 0.35 even at full swarm.
	# Rationale: per GDD, Earth's sunlight is explicitly protected. The sun visually dims
	# by up to 35% from the player's perspective, not 100%, to preserve the feel that
	# humanity still receives life-sustaining starlight.
	if _sun_material:
		_sun_material.set_shader_parameter("sun_dim_factor", coverage_01 * 0.35)


func _check_milestones() -> void:
	# Check if coverage reaches predefined thresholds; record milestones once.
	# CultureEventSystem listens to dyson_energy_updated and handles culture event pushing.
	for threshold in [10, 25, 50, 100]:
		if GameState.dyson_coverage_percent >= float(threshold):
			var key: String = "dyson_%d_triggered" % threshold
			if not GameState.completed_milestones.has(key):
				GameState.completed_milestones.append(key)


func _check_cme_event() -> void:
	# CME can only occur once panels exist and during Basic tier construction.
	# Probability: 0.5% per game year. Panel loss: 2% of current swarm (flavour).
	if (
		GameState.dyson_panel_tier == "basic"
		and GameState.dyson_panel_count > 0
		and randf() < 0.005
	):
		var destroyed: int = int(float(GameState.dyson_panel_count) * 0.02)
		GameState.dyson_panel_count -= destroyed
		GameState.culture_event_queue.append("ce_cme_hit_swarm")
		EventBus.culture_event_triggered.emit("ce_cme_hit_swarm")


func upgrade_tier(new_tier: String) -> void:
	# Upgrade panel tier. Energy output will be recomputed on the next _on_year_ticked() call.
	GameState.dyson_panel_tier = new_tier
