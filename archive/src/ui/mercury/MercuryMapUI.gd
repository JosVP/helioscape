class_name MercuryMapUI
extends CanvasLayer

var _selected_node_id: String = ""

@onready var _starting_zone_panel: PanelContainer = $StartingZonePanel
@onready var _zone_buttons: VBoxContainer = $StartingZonePanel/ZoneButtons
@onready var _build_panel: PanelContainer = $BuildPanel
@onready var _build_label: Label = $BuildPanel/BuildInfo
@onready var _build_confirm_button: Button = $BuildPanel/ConfirmBuildButton
@onready var _node_buttons: Control = $NodeButtons
@onready var _back_button: Button = $BackButton


func _ready() -> void:
	_build_panel.visible = false
	_build_confirm_button.pressed.connect(_on_confirm_build_pressed)
	_back_button.pressed.connect(_on_back_pressed)
	EventBus.node_selected.connect(_on_node_selected)
	EventBus.starting_zone_chosen.connect(_on_starting_zone_chosen)
	EventBus.building_completed.connect(_on_building_completed)
	_build_starting_zone_buttons()
	_build_slot_buttons()


func _on_node_selected(node_id: String) -> void:
	_selected_node_id = node_id
	var map_system: Node = _map_system()
	if map_system == null:
		return

	var state: int = int(map_system.call("get_node_state", node_id))
	if state != 1:
		_build_panel.visible = false
		return

	var node_data: Dictionary = map_system.call("get_node_definition", node_id)
	var slot_type: String = String(node_data.get("slot_type", "slot"))
	_build_label.text = "Build %s on %s" % [slot_type.capitalize(), node_id]
	_build_panel.visible = true


func _on_confirm_build_pressed() -> void:
	if _selected_node_id.is_empty():
		return
	var map_system: Node = _map_system()
	if map_system == null:
		return
	if bool(map_system.call("start_construction", _selected_node_id)):
		_build_panel.visible = false


func _build_starting_zone_buttons() -> void:
	for child: Node in _zone_buttons.get_children():
		child.queue_free()

	var map_system: Node = _map_system()
	if map_system == null:
		return
	if bool(map_system.call("is_starting_zone_selected")):
		_starting_zone_panel.visible = false
		return

	for zone: Dictionary in map_system.call("get_starting_zones"):
		var zone_id: int = int(zone.get("id", -1))
		var button: Button = Button.new()
		button.text = (
			"%s (%s)" % [String(zone.get("name", "Zone")), String(zone.get("summary", ""))]
		)
		button.pressed.connect(
			func() -> void:
				if bool(map_system.call("choose_starting_zone", zone_id)):
					_starting_zone_panel.visible = false
		)
		_zone_buttons.add_child(button)


func _on_starting_zone_chosen(_zone_id: int) -> void:
	_starting_zone_panel.visible = false
	_refresh_slot_button_states()


func _build_slot_buttons() -> void:
	for child: Node in _node_buttons.get_children():
		child.queue_free()

	var map_system: Node = _map_system()
	if map_system == null:
		return

	for node_data: Dictionary in map_system.call("get_all_node_definitions"):
		var node_id: String = String(node_data.get("id", ""))
		if node_id.is_empty():
			continue
		var pos_array: Array = node_data.get("position", [])
		if pos_array.size() < 2:
			continue

		var button: Button = Button.new()
		button.name = node_id
		button.text = String(node_data.get("slot_type", "slot")).left(3).to_upper()
		button.position = Vector2(float(pos_array[0]), float(pos_array[1]))
		button.size = Vector2(44.0, 26.0)
		button.pressed.connect(func() -> void: map_system.call("select_node", node_id))
		_node_buttons.add_child(button)

	_refresh_slot_button_states()


func _refresh_slot_button_states() -> void:
	var map_system: Node = _map_system()
	if map_system == null:
		return

	for child: Node in _node_buttons.get_children():
		if not (child is Button):
			continue
		var node_id: String = String(child.name)
		var state: int = int(map_system.call("get_node_state", node_id))
		var button: Button = child
		button.disabled = state == 0 or state == 2


func _on_building_completed(_node_id: String, _building_type: String) -> void:
	_refresh_slot_button_states()


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Main.tscn")


func _map_system() -> Node:
	return get_tree().get_first_node_in_group("mercury_map_system")
