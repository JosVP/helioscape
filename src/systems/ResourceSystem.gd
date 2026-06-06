class_name ResourceSystem
extends Node

# Accumulates and spends planetary resources.

const PHASE_RESOURCE_MULTIPLIERS: Dictionary = {
	0: {"common_ore": 1.0, "rare_metals": 0.0, "polar_volatiles": 0.0},
	1: {"common_ore": 1.35, "rare_metals": 1.0, "polar_volatiles": 0.0},
	2: {"common_ore": 1.7, "rare_metals": 1.25, "polar_volatiles": 1.0}
}

const TECH_RESOURCE_BONUSES: Dictionary = {
	"mercury_mining_facility": {"common_ore": 4.0},
	"mercury_refinery": {"common_ore": 2.0},
	"mercury_solar_array_expansion": {"common_ore": 1.5},
	"mercury_rare_metals_mining": {"rare_metals": 2.5},
	"mercury_mass_driver": {"common_ore": 2.0, "rare_metals": 1.0},
	"mercury_dyson_panel_production": {"common_ore": 1.0, "rare_metals": 0.5},
	"mercury_polar_volatiles_extraction": {"polar_volatiles": 3.0}
}


func _ready() -> void:
	add_to_group("resource_system")
	_ensure_resource_keys()
	_update_mercury_phase_from_progress()
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.tech_node_unlocked.connect(_on_tech_node_unlocked)
	# Emit initial values so HUD labels populate on startup.
	_emit_all_resource_totals()


func _on_year_ticked(_year: float) -> void:
	if not _is_mercury_active():
		return

	_ensure_resource_keys()
	for resource_id: Variant in GameState.mercury_resources.keys():
		var accumulated_amount: float = _get_accumulation_rate(String(resource_id))
		if accumulated_amount <= 0.0:
			continue
		add_resource(String(resource_id), accumulated_amount)


func _on_tech_node_unlocked(planet_id: String, node_id: String) -> void:
	if planet_id != "mercury":
		return

	var previous_phase: int = GameState.mercury_phase
	_update_mercury_phase_from_progress()
	if GameState.mercury_phase != previous_phase:
		return

	# Re-emit current totals when production techs change so HUD/state consumers refresh immediately.
	if TECH_RESOURCE_BONUSES.has(node_id):
		_emit_all_resource_totals()


func add_resource(resource_id: String, amount: float) -> void:
	if amount == 0.0:
		return

	_ensure_resource_keys()
	var current_amount: float = float(GameState.mercury_resources.get(resource_id, 0.0))
	var new_amount: float = maxf(0.0, current_amount + amount)
	GameState.mercury_resources[resource_id] = new_amount
	EventBus.resource_accumulated.emit(resource_id, amount)
	EventBus.resource_accumulation_updated.emit(resource_id, new_amount)


func can_spend_resources(costs: Dictionary) -> bool:
	_ensure_resource_keys()
	for resource_id: Variant in costs.keys():
		var required_amount: float = float(costs.get(resource_id, 0.0))
		if float(GameState.mercury_resources.get(resource_id, 0.0)) < required_amount:
			return false
	return true


func spend_resources(costs: Dictionary) -> bool:
	if not can_spend_resources(costs):
		return false

	for resource_id: Variant in costs.keys():
		var resource_key: String = String(resource_id)
		var required_amount: float = float(costs.get(resource_key, 0.0))
		if required_amount <= 0.0:
			continue
		var current_amount: float = float(GameState.mercury_resources.get(resource_key, 0.0))
		var new_amount: float = maxf(0.0, current_amount - required_amount)
		GameState.mercury_resources[resource_key] = new_amount
		EventBus.resource_accumulation_updated.emit(resource_key, new_amount)
	return true


func get_resource_amount(resource_id: String) -> float:
	return float(GameState.mercury_resources.get(resource_id, 0.0))


func get_accumulation_rates() -> Dictionary:
	var rates: Dictionary = {}
	for resource_id: Variant in GameState.mercury_resources.keys():
		rates[resource_id] = _get_accumulation_rate(String(resource_id))
	return rates


func _get_accumulation_rate(resource_id: String) -> float:
	var resource_data: Dictionary = DataManager.get_resource(resource_id)
	if resource_data.is_empty():
		return 0.0

	var base_rate: float = float(resource_data.get("base_accumulation_rate", 0.0))
	if base_rate <= 0.0:
		return 0.0

	var phase_multiplier: float = _get_phase_multiplier(resource_id)
	if phase_multiplier <= 0.0:
		return 0.0

	return base_rate * phase_multiplier + _get_tech_bonus(resource_id)


func _get_phase_multiplier(resource_id: String) -> float:
	var phase_data: Dictionary = PHASE_RESOURCE_MULTIPLIERS.get(GameState.mercury_phase, {})
	return float(phase_data.get(resource_id, 0.0))


func _get_tech_bonus(resource_id: String) -> float:
	var bonus: float = 0.0
	for tech_id: Variant in TECH_RESOURCE_BONUSES.keys():
		if not GameState.completed_techs.has(tech_id):
			continue
		var tech_bonus: Dictionary = TECH_RESOURCE_BONUSES.get(tech_id, {})
		bonus += float(tech_bonus.get(resource_id, 0.0))
	return bonus


func _update_mercury_phase_from_progress() -> void:
	var new_phase: int = GameState.mercury_phase
	if GameState.completed_techs.has("mercury_phase_2_complete"):
		new_phase = 2
	elif GameState.completed_techs.has("mercury_phase_1_complete"):
		new_phase = 1
	elif GameState.completed_techs.has("mercury_phase_0_complete"):
		new_phase = 0
	elif not GameState.completed_techs.has("earth_launch_mercury_mission"):
		new_phase = 0

	if new_phase == GameState.mercury_phase:
		return

	GameState.mercury_phase = new_phase
	EventBus.mercury_phase_changed.emit(new_phase)
	_emit_all_resource_totals()


func _emit_all_resource_totals() -> void:
	for resource_id: Variant in GameState.mercury_resources.keys():
		EventBus.resource_accumulation_updated.emit(
			String(resource_id), float(GameState.mercury_resources.get(resource_id, 0.0))
		)


func _ensure_resource_keys() -> void:
	for resource_id in ["common_ore", "rare_metals", "polar_volatiles"]:
		if not GameState.mercury_resources.has(resource_id):
			GameState.mercury_resources[resource_id] = 0.0


func _is_mercury_active() -> bool:
	return GameState.completed_techs.has("earth_launch_mercury_mission")
