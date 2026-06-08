class_name PlanetPanel
extends Control

# Planet panel transition is a content-container translation, not a scene swap:
# selecting a new planet swipes current content left, then swipes new content in from the right.

const SWIPE_DURATION: float = 0.25
const PANEL_WIDTH: float = 360.0

const PLANET_SCRIPT_PATHS: Dictionary = {
	"earth": "res://src/planets/EarthPlanet.gd",
	"mercury": "res://src/planets/MercuryPlanet.gd",
	"mars": "res://src/planets/MarsPlanet.gd",
	"venus": "res://src/planets/VenusPlanet.gd",
}

@export var planet_id: String = ""

var _current_planet_id: String = ""

var _content_container: Control
var _planet_name_label: Label
var _phase_name_label: Label
var _phase_description_label: Label
var _tech_tree_ui: Node
var _research_ui: Node
var _vignette_display: Node
var _tab_container: Control
var _moon_tab: Control
var _locked_message: Label
var _close_button: Button


func _ready() -> void:
	_cache_nodes()
	_add_close_button()
	if _content_container != null:
		_content_container.visible = false
	EventBus.planet_selected.connect(open)
	EventBus.orrery_zoom_requested.connect(open)
	EventBus.terraforming_phase_changed.connect(_on_terraforming_phase_changed)


func open(new_planet_id: String) -> void:
	# Mercury uses a dedicated map scene — do not open PlanetPanel for it.
	if new_planet_id == "mercury":
		return

	if (
		new_planet_id == _current_planet_id
		and _content_container != null
		and _content_container.visible
	):
		return

	_current_planet_id = new_planet_id
	planet_id = new_planet_id
	_populate(new_planet_id)

	if _content_container != null and not _content_container.visible:
		_content_container.visible = true
		_swipe_in()


func close() -> void:
	if _content_container == null or not _content_container.visible:
		return
	_swipe_out()
	await get_tree().create_timer(SWIPE_DURATION).timeout
	if _content_container != null:
		_content_container.visible = false
	_current_planet_id = ""
	planet_id = ""


func _swipe_out() -> void:
	if _content_container == null:
		return

	# Slide back off-screen to the right (mirrors _swipe_in in reverse).
	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tween.tween_property(_content_container, "offset_left", 0.0, SWIPE_DURATION)
	tween.parallel().tween_property(_content_container, "offset_right", PANEL_WIDTH, SWIPE_DURATION)


func _swipe_in() -> void:
	if _content_container == null:
		return

	# Start just off the right edge of the screen, then slide left to rest position.
	_content_container.offset_left = 0.0
	_content_container.offset_right = PANEL_WIDTH
	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(_content_container, "offset_left", -PANEL_WIDTH, SWIPE_DURATION)
	tween.parallel().tween_property(_content_container, "offset_right", 0.0, SWIPE_DURATION)


func _populate(pid: String) -> void:
	var planet_data: Dictionary = DataManager.get_planet(pid)
	if _planet_name_label != null:
		_planet_name_label.text = String(planet_data.get("display_name", pid.capitalize()))
		_planet_name_label.add_theme_color_override("font_color", Color(0.973, 0.847, 0.565))
		_planet_name_label.add_theme_font_size_override("font_size", 18)

	if _tech_tree_ui != null and _tech_tree_ui.has_method("set"):
		_tech_tree_ui.set("planet_id", pid)
		if _tech_tree_ui.has_method("_build_tree"):
			_tech_tree_ui.call("_build_tree")

	if _research_ui != null and _research_ui.has_method("set"):
		_research_ui.set("planet_id", pid)
		if _research_ui.has_method("_refresh"):
			_research_ui.call("_refresh")

	if _vignette_display != null and _vignette_display.has_method("set"):
		_vignette_display.set("planet_id", pid)
		if _vignette_display.has_method("_load_locations"):
			_vignette_display.call("_load_locations")

	if _moon_tab != null:
		_moon_tab.visible = pid == "earth"

	var is_unlocked: bool = _is_planet_unlocked(pid)
	if _locked_message != null:
		_locked_message.visible = not is_unlocked
		if not is_unlocked:
			var initial: Dictionary = planet_data.get("initial_state", {})
			var pressure: float = float(initial.get("atmosphere_pressure", 0.0))
			var temp_c: int = int(initial.get("temperature_celsius", 0))
			var display: String = String(planet_data.get("display_name", pid.capitalize()))
			_locked_message.text = (
				"%s is not yet accessible.\n\nAtmospheric pressure: %.3f atm\nSurface temperature: %d°C"
				% [display, pressure, temp_c]
			)

	if _tab_container != null:
		_tab_container.visible = is_unlocked
		_apply_pending_moon_tab_request()

	_refresh_status()


func _refresh_status() -> void:
	if _current_planet_id.is_empty():
		return

	var helper: PlanetBase = _build_planet_helper(_current_planet_id)
	if helper == null:
		if _phase_name_label != null:
			_phase_name_label.text = ""
		if _phase_description_label != null:
			_phase_description_label.text = ""
		return

	var phase: int = _get_planet_phase(_current_planet_id)
	if _phase_name_label != null:
		_phase_name_label.text = helper.get_terraforming_display_name(phase)
		_phase_name_label.add_theme_color_override("font_color", Color(0.91, 0.518, 0.102))
	if _phase_description_label != null:
		_phase_description_label.text = helper.get_current_phase_description()
		_phase_description_label.add_theme_color_override("font_color", Color(0.604, 0.471, 0.282))


func _on_terraforming_phase_changed(changed_planet_id: String, _phase: int) -> void:
	if (
		changed_planet_id != _current_planet_id
		and not (_current_planet_id == "earth" and changed_planet_id == "moon")
	):
		return
	_refresh_status()


func _get_planet_phase(pid: String) -> int:
	if pid == "earth":
		return 0
	if pid == "mercury":
		return int(GameState.mercury_phase)
	return int(GameState.planets.get(pid, {}).get("terraforming_phase", 0))


func _is_planet_unlocked(pid: String) -> bool:
	if pid == "earth":
		return true
	if pid == "moon":
		return true
	return GameState.planets.has(pid)


func _build_planet_helper(pid: String) -> PlanetBase:
	if pid == "moon":
		pid = "earth"

	var path: String = String(PLANET_SCRIPT_PATHS.get(pid, ""))
	if path.is_empty():
		return null

	var script: Script = load(path)
	if script == null:
		return null

	var helper: Variant = script.new()
	if helper is PlanetBase:
		return helper
	return null


func _apply_pending_moon_tab_request() -> void:
	if _tab_container == null:
		return
	if not (_tab_container is TabContainer):
		return
	if _current_planet_id != "earth":
		return
	if not EventBus.has_meta("open_moon_tab"):
		return

	var should_open_moon_tab: bool = bool(EventBus.get_meta("open_moon_tab"))
	EventBus.remove_meta("open_moon_tab")
	if not should_open_moon_tab:
		return

	var tabs: TabContainer = _tab_container as TabContainer
	if _moon_tab == null:
		return
	var moon_tab_index: int = _moon_tab.get_index()
	if moon_tab_index >= 0 and moon_tab_index < tabs.get_tab_count():
		tabs.current_tab = moon_tab_index


func _cache_nodes() -> void:
	_content_container = _as_control(get_node_or_null("ContentContainer"))

	# Labels and tab container live inside ContentVBox (child of ContentContainer PanelContainer).
	var root: Node = self
	if _content_container != null:
		var vbox: Node = _content_container.get_node_or_null("ContentVBox")
		root = vbox if vbox != null else _content_container
	_planet_name_label = _as_label(root.get_node_or_null("PlanetNameLabel"))
	_phase_name_label = _as_label(root.get_node_or_null("PhaseNameLabel"))
	_phase_description_label = _as_label(root.get_node_or_null("PhaseDescriptionLabel"))
	_tech_tree_ui = root.get_node_or_null("TechTreeUI")
	_research_ui = root.get_node_or_null("ResearchUI")
	_vignette_display = root.get_node_or_null("VignetteDisplay")
	_tab_container = _as_control(root.get_node_or_null("TabContainer"))
	_locked_message = _as_label(root.get_node_or_null("LockedMessage"))

	if _tab_container != null:
		_moon_tab = _as_control(_tab_container.get_node_or_null("MoonTab"))


func _add_close_button() -> void:
	if _content_container == null:
		return

	# Dark panel background with amber left border and content padding.
	var panel_style: StyleBoxFlat = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.055, 0.043, 0.024, 0.96)
	panel_style.border_width_left = 1
	panel_style.border_color = Color(0.29, 0.204, 0.094, 1.0)
	panel_style.content_margin_left = 14.0
	panel_style.content_margin_right = 14.0
	panel_style.content_margin_top = 10.0
	panel_style.content_margin_bottom = 10.0
	_content_container.add_theme_stylebox_override("panel", panel_style)

	# Amber close button — top-right corner inside ContentVBox.
	var vbox: Control = _as_control(_content_container.get_node_or_null("ContentVBox"))
	var btn_parent: Control = vbox if vbox != null else _content_container
	_close_button = Button.new()
	_close_button.name = "CloseButton"
	_close_button.text = "✕"
	_close_button.flat = true
	_close_button.mouse_filter = Control.MOUSE_FILTER_STOP
	_close_button.custom_minimum_size = Vector2(28.0, 28.0)
	_close_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	_close_button.add_theme_color_override("font_color", Color(0.91, 0.518, 0.102))
	_close_button.add_theme_color_override("font_hover_color", Color(1.0, 0.7, 0.3))
	_close_button.pressed.connect(func() -> void: close())
	btn_parent.add_child(_close_button)
	btn_parent.move_child(_close_button, 0)


func _as_control(node: Node) -> Control:
	if node is Control:
		return node
	return null


func _as_label(node: Node) -> Label:
	if node is Label:
		return node
	return null
