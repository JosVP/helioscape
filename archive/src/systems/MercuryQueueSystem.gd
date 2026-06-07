class_name MercuryQueueSystem
extends Node

const DEFAULT_COMPONENT_ID: String = "dyson_panel"
const DEFAULT_COSTS: Dictionary = {"common_ore": 20.0, "rare_metals": 4.0}
const DEFAULT_DURATION_YEARS: float = 2.0


func _ready() -> void:
	add_to_group("mercury_queue_system")
	EventBus.game_year_ticked.connect(_on_year_ticked)
	_ensure_default_row()


func enqueue_item(item: Dictionary) -> void:
	var normalized: Dictionary = {
		"label": String(item.get("label", "Component")),
		"component_id": String(item.get("component_id", "component_generic")),
		"costs": item.get("costs", {}),
		"duration_years": float(item.get("duration_years", 1.0)),
		"quantity": int(item.get("quantity", 1)),
		"is_default": bool(item.get("is_default", false)),
		"is_started": false
	}

	if bool(normalized.get("is_default", false)):
		return

	var insert_index: int = maxi(0, GameState.mercury_queue.size() - 1)
	GameState.mercury_queue.insert(insert_index, normalized)
	EventBus.component_queued.emit(String(normalized.get("component_id", "")))


func move_item(item_index: int, direction: int) -> void:
	if item_index < 0 or item_index >= GameState.mercury_queue.size():
		return
	var item: Dictionary = GameState.mercury_queue[item_index]
	if bool(item.get("is_default", false)):
		return

	var target_index: int = clampi(item_index + direction, 0, GameState.mercury_queue.size() - 2)
	if target_index == item_index:
		return

	GameState.mercury_queue.remove_at(item_index)
	GameState.mercury_queue.insert(target_index, item)


func get_queue_items() -> Array:
	return GameState.mercury_queue


func _on_year_ticked(_year: float) -> void:
	_ensure_default_row()
	if GameState.mercury_queue.is_empty():
		return

	var active_index: int = 0
	var active_item: Dictionary = GameState.mercury_queue[active_index]
	if not bool(active_item.get("is_started", false)):
		if not _try_start_item(active_index):
			return
		active_item = GameState.mercury_queue[active_index]

	GameState.mercury_queue_active_index = active_index
	GameState.mercury_queue_active_remaining_years = maxf(
		0.0, GameState.mercury_queue_active_remaining_years - 1.0
	)
	if GameState.mercury_queue_active_remaining_years > 0.0:
		return

	_complete_item(active_index, active_item)


func _try_start_item(item_index: int) -> bool:
	var resource_system: Node = get_tree().get_first_node_in_group("resource_system")
	if resource_system == null:
		return false

	var item: Dictionary = GameState.mercury_queue[item_index]
	var costs: Dictionary = item.get("costs", {})
	if not bool(resource_system.call("can_spend_resources", costs)):
		return false
	if not bool(resource_system.call("spend_resources", costs)):
		return false

	item["is_started"] = true
	GameState.mercury_queue[item_index] = item
	GameState.mercury_queue_active_remaining_years = float(item.get("duration_years", 1.0))
	return true


func _complete_item(item_index: int, item: Dictionary) -> void:
	var component_id: String = String(item.get("component_id", "component_generic"))
	if bool(item.get("is_default", false)):
		GameState.dyson_panel_count += 1
		EventBus.dyson_panel_produced.emit(1)
		item["is_started"] = false
		GameState.mercury_queue[item_index] = item
		return

	EventBus.component_completed.emit(component_id)
	var quantity_left: int = int(item.get("quantity", 1)) - 1
	if quantity_left > 0:
		item["quantity"] = quantity_left
		item["is_started"] = false
		GameState.mercury_queue[item_index] = item
		return

	GameState.mercury_queue.remove_at(item_index)


func _ensure_default_row() -> void:
	for item_variant: Variant in GameState.mercury_queue:
		var item: Dictionary = item_variant
		if bool(item.get("is_default", false)):
			return

	GameState.mercury_queue.append(
		{
			"label": "Dyson Panel",
			"component_id": DEFAULT_COMPONENT_ID,
			"costs": DEFAULT_COSTS,
			"duration_years": DEFAULT_DURATION_YEARS,
			"quantity": 1,
			"is_default": true,
			"is_started": false
		}
	)
