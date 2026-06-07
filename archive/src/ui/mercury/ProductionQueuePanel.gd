class_name ProductionQueuePanel
extends PanelContainer

@onready var _list: VBoxContainer = $Rows
@onready var _add_miner_button: Button = $Controls/AddMinerButton


func _ready() -> void:
	_add_miner_button.pressed.connect(_on_add_miner_pressed)
	EventBus.component_queued.connect(_refresh)
	EventBus.component_completed.connect(_refresh)
	EventBus.dyson_panel_produced.connect(_on_dyson_panel_produced)
	_refresh("")


func _on_add_miner_pressed() -> void:
	var queue_system: Node = get_tree().get_first_node_in_group("mercury_queue_system")
	if queue_system == null:
		return
	queue_system.call(
		"enqueue_item",
		{
			"label": "Miner Unit",
			"component_id": "miner_unit",
			"costs": {"common_ore": 12.0},
			"duration_years": 1.0,
			"quantity": 1,
			"is_default": false
		}
	)


func _refresh(_ignored: String) -> void:
	for child: Node in _list.get_children():
		child.queue_free()

	var queue_system: Node = get_tree().get_first_node_in_group("mercury_queue_system")
	if queue_system == null:
		return

	for item_variant: Variant in queue_system.call("get_queue_items"):
		var item: Dictionary = item_variant
		var label: Label = Label.new()
		var suffix: String = ""
		if bool(item.get("is_default", false)):
			suffix = " [LOCKED DEFAULT]"
		elif bool(item.get("is_started", false)):
			suffix = " [ACTIVE]"
		label.text = (
			"%s x%d%s" % [String(item.get("label", "Item")), int(item.get("quantity", 1)), suffix]
		)
		_list.add_child(label)


func _on_dyson_panel_produced(_count: int) -> void:
	_refresh("")
