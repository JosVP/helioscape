class_name DysonSystem
extends Node

# Tracks Dyson infrastructure production queues and energy output.

const ENERGY_PER_BASIC_PANEL: float = 1e12
const ENERGY_PER_MID_PANEL: float = 2.5e12
const ENERGY_PER_HARDENED_PANEL: float = 5e12
const PANELS_PER_YEAR_BASE: int = 2
const TOTAL_PANELS_FOR_100_PERCENT: int = 1000
const COMMON_ORE_COST_PER_PANEL: float = 0.1


func _ready() -> void:
	EventBus.game_year_ticked.connect(_on_year_ticked)


func _on_year_ticked(_year: float) -> void:
	var resource_system: ResourceSystem = _get_resource_system()
	var panels_this_year: int = 0
	if resource_system != null:
		var ore_cost: Dictionary = {
			"common_ore": float(PANELS_PER_YEAR_BASE) * COMMON_ORE_COST_PER_PANEL
		}
		if resource_system.spend_resources(ore_cost):
			panels_this_year = PANELS_PER_YEAR_BASE

	if panels_this_year > 0:
		GameState.dyson_panel_count += panels_this_year
		EventBus.dyson_panel_produced.emit(panels_this_year)

	_recompute_energy_output()
	_update_coverage_percent()
	EventBus.dyson_energy_updated.emit(GameState.dyson_energy_watts)
	_check_coverage_milestones()
	_maybe_apply_cme_loss()


func upgrade_tier(new_tier: String) -> void:
	if new_tier not in ["basic", "mid", "hardened"]:
		push_warning("DysonSystem: unsupported panel tier %s" % new_tier)
		return

	GameState.dyson_panel_tier = new_tier
	_recompute_energy_output()
	EventBus.dyson_energy_updated.emit(GameState.dyson_energy_watts)


func _recompute_energy_output() -> void:
	var energy_per_panel: float = ENERGY_PER_BASIC_PANEL
	match GameState.dyson_panel_tier:
		"mid":
			energy_per_panel = ENERGY_PER_MID_PANEL
		"hardened":
			energy_per_panel = ENERGY_PER_HARDENED_PANEL

	GameState.dyson_energy_watts = float(GameState.dyson_panel_count) * energy_per_panel


func _update_coverage_percent() -> void:
	GameState.dyson_coverage_percent = (
		(float(GameState.dyson_panel_count) / float(TOTAL_PANELS_FOR_100_PERCENT)) * 100.0
	)


func _check_coverage_milestones() -> void:
	for threshold in [10, 25, 50, 100]:
		if GameState.dyson_coverage_percent < float(threshold):
			continue
		var milestone_key: String = "dyson_%d_triggered" % threshold
		if GameState.completed_milestones.has(milestone_key):
			continue
		GameState.completed_milestones.append(milestone_key)


func _maybe_apply_cme_loss() -> void:
	if GameState.dyson_panel_tier != "basic":
		return
	if randf() >= 0.005:
		return
	if GameState.dyson_panel_count <= 0:
		return

	var destroyed: int = int(float(GameState.dyson_panel_count) * 0.02)
	if destroyed <= 0:
		destroyed = 1
	GameState.dyson_panel_count = max(0, GameState.dyson_panel_count - destroyed)
	_recompute_energy_output()
	_update_coverage_percent()
	GameState.culture_event_queue.append("ce_cme_hit_swarm")


func _get_resource_system() -> ResourceSystem:
	var parent_node: Node = get_parent()
	if parent_node == null:
		return null
	var resource_system: Node = parent_node.get_node_or_null("ResourceSystem")
	if resource_system is ResourceSystem:
		return resource_system as ResourceSystem
	return null
