class_name PlanetsPanel
extends Control

const DISPLAY_ORDER: Array[String] = ["earth", "moon", "mercury", "mars", "venus"]

var _entries_container: VBoxContainer
var _entry_by_planet_id: Dictionary = {}


func _ready() -> void:
	_entries_container = _ensure_entries_container()
	_build_entries()
	EventBus.planet_selected.connect(_on_planet_selected)
	EventBus.terraforming_phase_changed.connect(_refresh_entry)


func _build_entries() -> void:
	_entry_by_planet_id.clear()
	for child: Node in _entries_container.get_children():
		child.queue_free()

	var planets: Dictionary = DataManager.get_all_planets()
	for planet_id: String in DISPLAY_ORDER:
		if planet_id != "moon" and not planets.has(planet_id):
			continue

		var row: HBoxContainer = HBoxContainer.new()
		row.name = "%sRow" % planet_id
		if planet_id == "moon":
			row.custom_minimum_size.x = 28.0

		var status_label: Label = Label.new()
		status_label.name = "Status"
		status_label.custom_minimum_size.x = 28.0
		row.add_child(status_label)

		var button: Button = Button.new()
		button.name = "SelectButton"
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.flat = true
		button.pressed.connect(_on_entry_pressed.bind(planet_id))
		row.add_child(button)

		var phase_label: Label = Label.new()
		phase_label.name = "Phase"
		phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		phase_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(phase_label)

		_entries_container.add_child(row)
		_entry_by_planet_id[planet_id] = {
			"row": row,
			"button": button,
			"phase_label": phase_label,
			"status_label": status_label,
		}

		_update_entry_text(planet_id)


func _on_entry_pressed(planet_id: String) -> void:
	if planet_id == "moon":
		EventBus.set_meta("open_moon_tab", true)
		EventBus.planet_selected.emit("earth")
		return

	EventBus.set_meta("open_moon_tab", false)
	EventBus.planet_selected.emit(planet_id)


func _on_planet_selected(planet_id: String) -> void:
	for entry_planet_id_variant: Variant in _entry_by_planet_id.keys():
		var entry_planet_id: String = String(entry_planet_id_variant)
		var entry: Dictionary = _entry_by_planet_id.get(entry_planet_id, {})
		var row: HBoxContainer = _as_hbox(entry.get("row", null))
		if row == null:
			continue

		var is_selected: bool = entry_planet_id == planet_id
		if entry_planet_id == "moon" and planet_id == "earth":
			is_selected = bool(EventBus.get_meta("open_moon_tab", false))

		row.modulate = Color(1.0, 0.9, 0.7, 1.0) if is_selected else Color(1.0, 1.0, 1.0, 1.0)


func _refresh_entry(planet_id: String, _phase: int) -> void:
	if planet_id == "earth":
		_update_entry_text("earth")
		_update_entry_text("moon")
		return

	_update_entry_text(planet_id)


func _update_entry_text(planet_id: String) -> void:
	var entry: Dictionary = _entry_by_planet_id.get(planet_id, {})
	if entry.is_empty():
		return

	var button: Button = _as_button(entry.get("button", null))
	var phase_label: Label = _as_label(entry.get("phase_label", null))
	var status_label: Label = _as_label(entry.get("status_label", null))
	if button == null or phase_label == null or status_label == null:
		return

	button.text = _get_display_name(planet_id)
	phase_label.text = _get_phase_name(planet_id)

	var is_unlocked: bool = _is_unlocked(planet_id)
	if not is_unlocked:
		status_label.text = "L"
		button.modulate = Color(0.7, 0.7, 0.7, 0.95)
		phase_label.modulate = Color(0.7, 0.7, 0.7, 0.95)
		return

	var phase_value: int = _get_phase_value(planet_id)
	if phase_value >= 4:
		status_label.text = "F"
	else:
		status_label.text = "A"
	button.modulate = Color(1.0, 1.0, 1.0, 1.0)
	phase_label.modulate = Color(1.0, 1.0, 1.0, 1.0)


func _get_display_name(planet_id: String) -> String:
	if planet_id == "moon":
		return "  Moon"
	var planet_data: Dictionary = DataManager.get_planet(planet_id)
	return String(planet_data.get("display_name", planet_id.capitalize()))


func _get_phase_name(planet_id: String) -> String:
	if not _is_unlocked(planet_id):
		return "Locked"

	var helper: PlanetBase = _build_planet_helper(planet_id)
	if helper == null:
		return ""

	return helper.get_terraforming_display_name(_get_phase_value(planet_id))


func _get_phase_value(planet_id: String) -> int:
	if planet_id == "earth" or planet_id == "moon":
		return 0
	if planet_id == "mercury":
		return int(GameState.mercury_phase)
	return int(GameState.planets.get(planet_id, {}).get("terraforming_phase", 0))


func _is_unlocked(planet_id: String) -> bool:
	if planet_id == "earth" or planet_id == "moon":
		return true
	return GameState.planets.has(planet_id)


func _build_planet_helper(planet_id: String) -> PlanetBase:
	var target_id: String = planet_id
	if target_id == "moon":
		target_id = "earth"

	var path: String = ""
	match target_id:
		"earth":
			path = "res://src/planets/EarthPlanet.gd"
		"mercury":
			path = "res://src/planets/MercuryPlanet.gd"
		"mars":
			path = "res://src/planets/MarsPlanet.gd"
		"venus":
			path = "res://src/planets/VenusPlanet.gd"
		_:
			path = ""

	if path.is_empty():
		return null

	var script: Script = load(path)
	if script == null:
		return null

	var helper: Variant = script.new()
	if helper is PlanetBase:
		return helper
	return null


func _ensure_entries_container() -> VBoxContainer:
	var found: Node = get_node_or_null("Entries")
	if found is VBoxContainer:
		return found

	var created: VBoxContainer = VBoxContainer.new()
	created.name = "Entries"
	created.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	created.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(created)
	return created


func _as_hbox(node: Variant) -> HBoxContainer:
	if node is HBoxContainer:
		return node
	return null


func _as_button(node: Variant) -> Button:
	if node is Button:
		return node
	return null


func _as_label(node: Variant) -> Label:
	if node is Label:
		return node
	return null
