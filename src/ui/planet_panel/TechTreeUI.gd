class_name TechTreeUI
extends Control

@export var planet_id: String = ""

var _tree_container: VBoxContainer


func _ready() -> void:
	_tree_container = _ensure_tree_container()
	_build_tree()
	EventBus.tech_node_unlocked.connect(_on_tech_unlocked)
	EventBus.planet_selected.connect(_on_planet_selected)


func _build_tree() -> void:
	if _tree_container == null:
		return

	for child: Node in _tree_container.get_children():
		child.queue_free()

	if planet_id.is_empty():
		return

	var nodes: Array[Dictionary] = DataManager.get_tech_tree_for(planet_id)
	for node: Dictionary in nodes:
		var node_id: String = String(node.get("id", ""))
		if node_id.is_empty():
			continue

		var button: Button = Button.new()
		button.name = node_id
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.text = String(node.get("display_name", node_id))
		button.pressed.connect(_on_node_clicked.bind(node_id))
		_tree_container.add_child(button)
		_update_node_visual(node_id)


func _update_node_visual(node_id: String) -> void:
	var button: Button = _find_node_button(node_id)
	if button == null:
		return

	if GameState.completed_techs.has(node_id):
		button.visible = true
		button.disabled = true
		button.modulate = Color(1.0, 1.0, 1.0, 1.0)
		return

	var missing_count: int = _missing_requirement_count(node_id)
	if missing_count == 0:
		button.visible = true
		button.disabled = false
		button.modulate = Color(1.0, 1.0, 1.0, 1.0)
	elif missing_count == 1:
		button.visible = true
		button.disabled = true
		button.modulate = Color(0.72, 0.72, 0.72, 0.95)
	elif missing_count == 2:
		button.visible = true
		button.disabled = true
		button.modulate = Color(0.45, 0.45, 0.45, 0.8)
	else:
		button.visible = false


func _on_node_clicked(node_id: String) -> void:
	if planet_id.is_empty():
		return

	var tech_tree_system: Node = _get_tech_tree_system()
	if tech_tree_system == null:
		push_warning("TechTreeUI: TechTreeSystem not found")
		return

	tech_tree_system.call("unlock_tech", planet_id, node_id)
	_build_tree()


func _on_tech_unlocked(pid: String, _nid: String) -> void:
	if pid != planet_id:
		return
	_build_tree()


func _on_planet_selected(pid: String) -> void:
	if planet_id == pid:
		return
	planet_id = pid
	_build_tree()


func _missing_requirement_count(node_id: String) -> int:
	var node: Dictionary = DataManager.get_tech_node(node_id)
	if node.is_empty():
		return 99

	var missing_count: int = 0
	for requirement_id_variant: Variant in node.get("prerequisites", []):
		var requirement_id: String = String(requirement_id_variant)
		if requirement_id.is_empty():
			continue
		if not GameState.completed_techs.has(requirement_id):
			missing_count += 1

	for requirement_id_variant: Variant in node.get("spillover_prerequisites", []):
		var requirement_id: String = String(requirement_id_variant)
		if requirement_id.is_empty():
			continue
		if not GameState.completed_techs.has(requirement_id):
			missing_count += 1

	return missing_count


func _find_node_button(node_id: String) -> Button:
	if _tree_container == null:
		return null
	var node: Node = _tree_container.get_node_or_null(node_id)
	if node is Button:
		return node
	return null


func _get_tech_tree_system() -> Node:
	return get_tree().get_first_node_in_group("tech_tree_system")


func _ensure_tree_container() -> VBoxContainer:
	var container_node: Node = get_node_or_null("TreeContainer")
	if container_node is VBoxContainer:
		return container_node

	var created_container: VBoxContainer = VBoxContainer.new()
	created_container.name = "TreeContainer"
	created_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	created_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(created_container)
	return created_container
