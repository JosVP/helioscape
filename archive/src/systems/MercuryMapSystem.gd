class_name MercuryMapSystem
extends Node

enum NodeState { LOCKED, AVAILABLE, BUILDING, OPERATIONAL }

const BASE_SECONDS_PER_YEAR: float = 2.0

var _nodes_by_id: Dictionary = {}
var _starting_zones: Array[Dictionary] = []
var _construction_remaining_seconds: Dictionary = {}


func _ready() -> void:
	add_to_group("mercury_map_system")
	_load_map_data()
	_ensure_runtime_state()


func _process(delta: float) -> void:
	if GameState.is_paused:
		return

	var completed_ids: Array[String] = []
	for node_id_variant: Variant in _construction_remaining_seconds.keys():
		var node_id: String = String(node_id_variant)
		var remaining: float = float(_construction_remaining_seconds.get(node_id, 0.0)) - delta
		if remaining <= 0.0:
			completed_ids.append(node_id)
		else:
			_construction_remaining_seconds[node_id] = remaining

	for node_id: String in completed_ids:
		_construction_remaining_seconds.erase(node_id)
		_set_node_state(node_id, NodeState.OPERATIONAL)
		_unlock_adjacent(node_id)
		var node_data: Dictionary = _nodes_by_id.get(node_id, {})
		EventBus.building_completed.emit(node_id, String(node_data.get("slot_type", "")))


func get_starting_zones() -> Array[Dictionary]:
	return _starting_zones


func is_starting_zone_selected() -> bool:
	return GameState.mercury_starting_zone_selected


func choose_starting_zone(zone_id: int) -> bool:
	if GameState.mercury_starting_zone_selected:
		return false

	for zone: Dictionary in _starting_zones:
		if int(zone.get("id", -1)) != zone_id:
			continue
		for node_id_variant: Variant in zone.get("node_ids", []):
			_set_node_state(String(node_id_variant), NodeState.AVAILABLE)
		GameState.mercury_starting_zone_selected = true
		GameState.mercury_starting_zone_id = zone_id
		EventBus.starting_zone_chosen.emit(zone_id)
		return true

	return false


func get_node_state(node_id: String) -> int:
	return int(GameState.mercury_node_states.get(node_id, NodeState.LOCKED))


func get_node_definition(node_id: String) -> Dictionary:
	return _nodes_by_id.get(node_id, {})


func get_all_node_definitions() -> Array[Dictionary]:
	var nodes: Array[Dictionary] = []
	for node_id: Variant in _nodes_by_id.keys():
		nodes.append(_nodes_by_id.get(node_id, {}))
	return nodes


func select_node(node_id: String) -> void:
	EventBus.node_selected.emit(node_id)


func start_construction(node_id: String) -> bool:
	if get_node_state(node_id) != NodeState.AVAILABLE:
		return false

	var node_data: Dictionary = _nodes_by_id.get(node_id, {})
	var costs: Dictionary = node_data.get("costs", {})
	var resource_system: Node = get_tree().get_first_node_in_group("resource_system")
	if resource_system == null or not resource_system.has_method("spend_resources"):
		return false
	if not bool(resource_system.call("spend_resources", costs)):
		return false

	_set_node_state(node_id, NodeState.BUILDING)
	var duration_years: float = float(node_data.get("duration_years", 1.0))
	_construction_remaining_seconds[node_id] = duration_years * _seconds_per_year()
	return true


func _load_map_data() -> void:
	_nodes_by_id.clear()
	_starting_zones.clear()

	var map_data: Dictionary = DataManager.get_mercury_map_data()
	for zone_variant: Variant in map_data.get("starting_zones", []):
		if zone_variant is Dictionary:
			_starting_zones.append(zone_variant)
	for node_variant: Variant in map_data.get("nodes", []):
		if not (node_variant is Dictionary):
			continue
		var node_data: Dictionary = node_variant
		var node_id: String = String(node_data.get("id", ""))
		if node_id.is_empty():
			continue
		_nodes_by_id[node_id] = node_data


func _ensure_runtime_state() -> void:
	for node_id_variant: Variant in _nodes_by_id.keys():
		var node_id: String = String(node_id_variant)
		if not GameState.mercury_node_states.has(node_id):
			GameState.mercury_node_states[node_id] = NodeState.LOCKED

	if GameState.mercury_starting_zone_selected:
		return

	for node_id_variant: Variant in _nodes_by_id.keys():
		_set_node_state(String(node_id_variant), NodeState.LOCKED)


func _unlock_adjacent(node_id: String) -> void:
	var node_data: Dictionary = _nodes_by_id.get(node_id, {})
	for adjacent_id_variant: Variant in node_data.get("adjacent", []):
		var adjacent_id: String = String(adjacent_id_variant)
		if get_node_state(adjacent_id) == NodeState.LOCKED:
			_set_node_state(adjacent_id, NodeState.AVAILABLE)


func _set_node_state(node_id: String, state: int) -> void:
	GameState.mercury_node_states[node_id] = state


func _seconds_per_year() -> float:
	return BASE_SECONDS_PER_YEAR / maxf(float(GameState.game_speed), 1.0)
