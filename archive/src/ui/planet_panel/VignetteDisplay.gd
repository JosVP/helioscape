class_name VignetteDisplay
extends Control

# Location counts and types vary per planet and are fully data-driven. Earth can carry
# multiple human and ecological vignettes while Mars can start sparse and grow over time.
# This script only handles rendering and transitions from data/vignettes.json.

const CROSSFADE_DURATION: float = 1.5

@export var planet_id: String = ""

var _current_location_index: int = 0
var _location_states: Dictionary = {}
var _locations: Array[Dictionary] = []

var _title_label: Label
var _location_tabs: HBoxContainer
var _viewport: Control
var _front_texture: TextureRect
var _back_texture: TextureRect


func _ready() -> void:
	_cache_nodes()
	EventBus.terraforming_phase_changed.connect(_on_phase_changed)
	EventBus.tech_node_unlocked.connect(_on_tech_unlocked)
	EventBus.kardashev_milestone_reached.connect(_on_milestone)
	_load_locations()


func _load_locations() -> void:
	_location_states.clear()
	_locations.clear()
	_current_location_index = 0

	# Forward-compatible stub: DataManager may not expose vignette data yet.
	if not DataManager.has_method("get_vignette_data"):
		_set_placeholder("Vignettes will appear when data/vignettes.json is added.")
		return

	var vignette_root: Variant = DataManager.call("get_vignette_data", planet_id)
	if not (vignette_root is Dictionary):
		_set_placeholder("No vignette data available for this planet yet.")
		return

	var root_dict: Dictionary = vignette_root
	var locations_variant: Variant = root_dict.get("locations", [])
	if not (locations_variant is Array):
		_set_placeholder("No location list found in vignette data.")
		return

	for entry_variant: Variant in locations_variant:
		if not (entry_variant is Dictionary):
			continue
		var location: Dictionary = entry_variant
		var location_id: String = String(location.get("id", ""))
		if location_id.is_empty():
			continue

		_locations.append(location)
		_location_states[location_id] = 0

	_build_tabs()
	_show_location(_current_location_index)


func _on_phase_changed(changed_planet_id: String, _phase: int) -> void:
	if changed_planet_id != planet_id:
		return
	_refresh_all_locations()


func _on_tech_unlocked(changed_planet_id: String, _node_id: String) -> void:
	if changed_planet_id != planet_id:
		return
	_refresh_all_locations()


func _on_milestone(_milestone_id: String) -> void:
	_refresh_all_locations()


func _refresh_all_locations() -> void:
	for location: Dictionary in _locations:
		var location_id: String = String(location.get("id", ""))
		if location_id.is_empty():
			continue

		var next_index: int = _resolve_state_index(location)
		var current_index: int = int(_location_states.get(location_id, 0))
		if next_index == current_index:
			continue

		_location_states[location_id] = next_index
		if _is_current_location(location_id):
			_crossfade_to_state(location_id, next_index)


func _crossfade_to_state(location_id: String, state_index: int) -> void:
	if _front_texture == null or _back_texture == null:
		return

	var location: Dictionary = _get_location(location_id)
	if location.is_empty():
		return

	var next_texture: Texture2D = _load_state_texture(location, state_index)
	_back_texture.texture = next_texture
	_back_texture.modulate.a = 0.0

	# We crossfade two layered TextureRects in parallel to avoid hard visual pops.
	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(_front_texture, "modulate:a", 0.0, CROSSFADE_DURATION)
	tween.parallel().tween_property(_back_texture, "modulate:a", 1.0, CROSSFADE_DURATION)
	tween.tween_callback(
		func() -> void:
			_front_texture.texture = _back_texture.texture
			_front_texture.modulate.a = 1.0
			_back_texture.modulate.a = 0.0
	)


func _on_location_tab_clicked(location_index: int) -> void:
	_current_location_index = location_index
	_show_location(location_index)


func _show_location(index: int) -> void:
	if _locations.is_empty():
		return

	var safe_index: int = clampi(index, 0, _locations.size() - 1)
	_current_location_index = safe_index

	var location: Dictionary = _locations[safe_index]
	var location_id: String = String(location.get("id", ""))
	var state_index: int = int(_location_states.get(location_id, 0))
	var texture: Texture2D = _load_state_texture(location, state_index)

	if _front_texture != null:
		_front_texture.texture = texture
		_front_texture.modulate.a = 1.0
	if _back_texture != null:
		_back_texture.texture = null
		_back_texture.modulate.a = 0.0
	if _title_label != null:
		_title_label.text = String(location.get("display_name", location_id.capitalize()))


func _resolve_state_index(location: Dictionary) -> int:
	var states: Array = location.get("states", [])
	if states.is_empty():
		return 0

	var selected_index: int = 0
	var phase: int = int(GameState.planets.get(planet_id, {}).get("terraforming_phase", 0))

	for i: int in range(states.size()):
		var state_variant: Variant = states[i]
		if not (state_variant is Dictionary):
			continue
		var state: Dictionary = state_variant

		var min_phase: int = int(state.get("min_phase", -1))
		if min_phase >= 0 and phase >= min_phase:
			selected_index = i

		var required_tech: String = String(state.get("required_tech", ""))
		if not required_tech.is_empty() and GameState.completed_techs.has(required_tech):
			selected_index = i

		var required_milestone: String = String(state.get("required_milestone", ""))
		if (
			not required_milestone.is_empty()
			and GameState.completed_milestones.has(required_milestone)
		):
			selected_index = i

	return selected_index


func _build_tabs() -> void:
	if _location_tabs == null:
		return

	for child: Node in _location_tabs.get_children():
		child.queue_free()

	for i: int in range(_locations.size()):
		var location: Dictionary = _locations[i]
		var button: Button = Button.new()
		button.text = String(location.get("short_name", location.get("display_name", "Location")))
		button.pressed.connect(_on_location_tab_clicked.bind(i))
		_location_tabs.add_child(button)


func _is_current_location(location_id: String) -> bool:
	if _current_location_index < 0 or _current_location_index >= _locations.size():
		return false
	var current_location: Dictionary = _locations[_current_location_index]
	return String(current_location.get("id", "")) == location_id


func _get_location(location_id: String) -> Dictionary:
	for location: Dictionary in _locations:
		if String(location.get("id", "")) == location_id:
			return location
	return {}


func _load_state_texture(location: Dictionary, state_index: int) -> Texture2D:
	var states: Array = location.get("states", [])
	if state_index < 0 or state_index >= states.size():
		return null

	var state_variant: Variant = states[state_index]
	if not (state_variant is Dictionary):
		return null

	var state: Dictionary = state_variant
	var texture_path: String = String(state.get("texture", ""))
	if texture_path.is_empty():
		return null

	var loaded: Resource = load(texture_path)
	if loaded is Texture2D:
		return loaded
	return null


func _set_placeholder(message: String) -> void:
	_locations = [
		{
			"id": "placeholder",
			"display_name": "Vignettes",
			"short_name": "Info",
			"states": [{"texture": ""}],
		}
	]
	_location_states["placeholder"] = 0

	_build_tabs()
	_show_location(0)
	if _title_label != null:
		_title_label.text = message


func _cache_nodes() -> void:
	_title_label = _as_label(get_node_or_null("LocationTitle"))
	_location_tabs = _as_hbox(get_node_or_null("LocationTabs"))
	_viewport = _as_control(get_node_or_null("LocationViewport"))

	if _location_tabs == null:
		_location_tabs = HBoxContainer.new()
		_location_tabs.name = "LocationTabs"
		add_child(_location_tabs)

	if _viewport == null:
		_viewport = Control.new()
		_viewport.name = "LocationViewport"
		_viewport.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_viewport.size_flags_vertical = Control.SIZE_EXPAND_FILL
		add_child(_viewport)

	_front_texture = _as_texture_rect(_viewport.get_node_or_null("FrontTexture"))
	_back_texture = _as_texture_rect(_viewport.get_node_or_null("BackTexture"))

	if _front_texture == null:
		_front_texture = TextureRect.new()
		_front_texture.name = "FrontTexture"
		_front_texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_front_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		_front_texture.set_anchors_preset(Control.PRESET_FULL_RECT)
		_viewport.add_child(_front_texture)

	if _back_texture == null:
		_back_texture = TextureRect.new()
		_back_texture.name = "BackTexture"
		_back_texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_back_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		_back_texture.set_anchors_preset(Control.PRESET_FULL_RECT)
		_back_texture.modulate.a = 0.0
		_viewport.add_child(_back_texture)

	if _title_label == null:
		_title_label = Label.new()
		_title_label.name = "LocationTitle"
		add_child(_title_label)


func _as_control(node: Node) -> Control:
	if node is Control:
		return node
	return null


func _as_label(node: Node) -> Label:
	if node is Label:
		return node
	return null


func _as_hbox(node: Node) -> HBoxContainer:
	if node is HBoxContainer:
		return node
	return null


func _as_texture_rect(node: Node) -> TextureRect:
	if node is TextureRect:
		return node
	return null
