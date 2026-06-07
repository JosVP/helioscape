class_name MinerAssignmentPanel
extends PanelContainer

var _selected_refinery_id: String = ""

@onready var _title: Label = $Title
@onready var _slots: VBoxContainer = $Slots
@onready var _add_button: Button = $AddMinerButton


func _ready() -> void:
	visible = false
	_add_button.pressed.connect(_on_add_pressed)
	EventBus.node_selected.connect(_on_node_selected)
	EventBus.miner_reassigned.connect(_on_miner_reassigned)


func _on_node_selected(node_id: String) -> void:
	var map_system: Node = get_tree().get_first_node_in_group("mercury_map_system")
	if map_system == null:
		return
	var node_data: Dictionary = map_system.call("get_node_definition", node_id)
	if String(node_data.get("slot_type", "")) != "refinery":
		visible = false
		return
	if int(map_system.call("get_node_state", node_id)) != 3:
		visible = false
		return

	_selected_refinery_id = node_id
	visible = true
	_refresh()


func _on_add_pressed() -> void:
	if _selected_refinery_id.is_empty():
		return
	var mining_system: Node = get_tree().get_first_node_in_group("mercury_mining_system")
	if mining_system == null:
		return
	if bool(mining_system.call("assign_next_idle_miner", _selected_refinery_id)):
		_refresh()


func _refresh() -> void:
	for child: Node in _slots.get_children():
		child.queue_free()

	_title.text = "Refinery %s" % _selected_refinery_id
	var mining_system: Node = get_tree().get_first_node_in_group("mercury_mining_system")
	if mining_system == null:
		return

	var assigned: Array[int] = mining_system.call("get_assigned_miners", _selected_refinery_id)
	for miner_id: int in assigned:
		var row: HBoxContainer = HBoxContainer.new()
		var label: Label = Label.new()
		label.text = "Miner #%d" % miner_id
		var reassign_button: Button = Button.new()
		reassign_button.text = "Reassign"
		reassign_button.pressed.connect(
			func() -> void:
				var target_id: String = _find_alternative_refinery(_selected_refinery_id)
				if target_id.is_empty():
					return
				mining_system.call("reassign_miner", miner_id, target_id)
		)
		row.add_child(label)
		row.add_child(reassign_button)
		_slots.add_child(row)

	_add_button.text = "Add Miner (%d reserve)" % int(mining_system.call("get_reserve_miner_count"))


func _find_alternative_refinery(current_refinery_id: String) -> String:
	var map_system: Node = get_tree().get_first_node_in_group("mercury_map_system")
	if map_system == null:
		return ""
	for node_data: Dictionary in map_system.call("get_all_node_definitions"):
		if String(node_data.get("slot_type", "")) != "refinery":
			continue
		var candidate_id: String = String(node_data.get("id", ""))
		if candidate_id == current_refinery_id:
			continue
		if int(map_system.call("get_node_state", candidate_id)) == 3:
			return candidate_id
	return ""


func _on_miner_reassigned(_miner_id: int, _new_refinery_id: String) -> void:
	if visible:
		_refresh()
