class_name PlanetPanel
extends Control

# Planet panel transition is a content-container translation, not a scene swap:
# selecting a new planet swipes current content left, then swipes new content in from the right.

const SWIPE_DURATION: float = 0.25
const SWIPE_OFFSET_X: float = 400.0
const LOCKED_MESSAGE_TEXT: String = "Humanity hasn't reached this far yet."

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


func _ready() -> void:
	_cache_nodes()
	EventBus.planet_selected.connect(open)
	EventBus.orrery_zoom_requested.connect(open)
	EventBus.terraforming_phase_changed.connect(_on_terraforming_phase_changed)
	# Show Earth panel by default on game start.
	open("earth")


func open(new_planet_id: String) -> void:
	# Mercury uses a dedicated map scene — do not open PlanetPanel for it.
	if new_planet_id == "mercury":
		return

	if new_planet_id == _current_planet_id:
		return

	if _current_planet_id != "":
		_swipe_out()
		await get_tree().create_timer(SWIPE_DURATION).timeout

	_current_planet_id = new_planet_id
	planet_id = new_planet_id
	_populate(new_planet_id)
	_swipe_in()


func _swipe_out() -> void:
	if _content_container == null:
		return

	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tween.tween_property(_content_container, "position:x", -SWIPE_OFFSET_X, SWIPE_DURATION)


func _swipe_in() -> void:
	if _content_container == null:
		return

	_content_container.position.x = SWIPE_OFFSET_X
	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(_content_container, "position:x", 0.0, SWIPE_DURATION)


func _populate(pid: String) -> void:
	var planet_data: Dictionary = DataManager.get_planet(pid)
	if _planet_name_label != null:
		_planet_name_label.text = String(planet_data.get("display_name", pid.capitalize()))

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
			_locked_message.text = LOCKED_MESSAGE_TEXT

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
	if _phase_description_label != null:
		_phase_description_label.text = helper.get_current_phase_description()


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

	# Labels and tab container live inside ContentContainer in the scene.
	var root: Node = _content_container if _content_container != null else self
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


func _as_control(node: Node) -> Control:
	if node is Control:
		return node
	return null


func _as_label(node: Node) -> Label:
	if node is Label:
		return node
	return null
