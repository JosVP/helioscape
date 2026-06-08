class_name PlanetsPanel
extends Control

const DISPLAY_ORDER: Array[String] = ["earth", "moon", "mercury", "mars", "venus"]

# POC3 palette constants.
const COLOR_PANEL_BG: Color = Color(0.055, 0.043, 0.024)
const COLOR_PANEL_HOVER: Color = Color(0.118, 0.086, 0.031)
const COLOR_BORDER: Color = Color(0.29, 0.204, 0.094)
const COLOR_BORDER_SEL: Color = Color(0.91, 0.518, 0.102)
const COLOR_TEXT: Color = Color(0.878, 0.722, 0.502)
const COLOR_TEXT_DIM: Color = Color(0.604, 0.471, 0.282)
const COLOR_ACCENT: Color = Color(0.91, 0.518, 0.102)

# Default planet orb colors when texture data is unavailable.
const PLANET_COLORS: Dictionary = {
	"earth": Color(0.29, 0.435, 0.702),
	"moon": Color(0.62, 0.62, 0.62),
	"mercury": Color(0.549, 0.498, 0.451),
	"mars": Color(0.757, 0.267, 0.055),
	"venus": Color(0.9, 0.7, 0.22),
}

var _entries_container: VBoxContainer
var _entry_by_planet_id: Dictionary = {}


func _ready() -> void:
	_apply_panel_background()
	_entries_container = _ensure_entries_container()
	_build_entries()
	EventBus.planet_selected.connect(_on_planet_selected)
	EventBus.terraforming_phase_changed.connect(_refresh_entry)


func _apply_panel_background() -> void:
	# Give the panel itself the POC3 dark background with an amber left border.
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.055, 0.043, 0.024, 0.96)
	style.border_width_right = 1
	style.border_color = Color(0.29, 0.204, 0.094, 1.0)
	style.content_margin_left = 4.0
	style.content_margin_right = 4.0
	style.content_margin_top = 8.0
	style.content_margin_bottom = 8.0
	add_theme_stylebox_override("panel", style)

	# Header label — "PLANETS".
	var header: Label = Label.new()
	header.name = "PanelHeader"
	header.text = "PLANETS"
	header.add_theme_color_override("font_color", Color(0.91, 0.518, 0.102))
	header.add_theme_font_size_override("font_size", 11)
	add_child(header)


func _build_entries() -> void:
	_entry_by_planet_id.clear()
	for child: Node in _entries_container.get_children():
		child.queue_free()

	var planets: Dictionary = DataManager.get_all_planets()
	for pid: String in DISPLAY_ORDER:
		if pid != "moon" and not planets.has(pid):
			continue

		var tile: PanelContainer = _make_tile(pid)
		_entries_container.add_child(tile)


func _make_tile(pid: String) -> PanelContainer:
	# Outer tile — PanelContainer with styled background and border.
	var tile: PanelContainer = PanelContainer.new()
	tile.name = "%sTile" % pid
	tile.mouse_filter = Control.MOUSE_FILTER_STOP
	if pid == "moon":
		tile.custom_minimum_size = Vector2(20.0, 0.0)

	var style_normal: StyleBoxFlat = _make_tile_style(false)
	var style_hover: StyleBoxFlat = _make_tile_style(false)
	style_hover.bg_color = COLOR_PANEL_HOVER
	tile.add_theme_stylebox_override("panel", style_normal)

	# Inner vertical layout.
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 3)
	tile.add_child(vbox)

	# Top row: colored orb + planet name.
	var top_row: HBoxContainer = HBoxContainer.new()
	top_row.add_theme_constant_override("separation", 8)
	vbox.add_child(top_row)

	var orb: ColorRect = _make_orb(pid)
	top_row.add_child(orb)

	var name_label: Label = Label.new()
	name_label.name = "NameLabel"
	name_label.text = _get_display_name(pid)
	name_label.add_theme_color_override("font_color", COLOR_TEXT)
	name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if pid == "moon":
		name_label.add_theme_font_size_override("font_size", 12)
	top_row.add_child(name_label)

	# Bottom row: phase / status text.
	var phase_label: Label = Label.new()
	phase_label.name = "PhaseLabel"
	phase_label.add_theme_color_override("font_color", COLOR_TEXT_DIM)
	phase_label.add_theme_font_size_override("font_size", 11)
	phase_label.text = _get_phase_text(pid)
	vbox.add_child(phase_label)

	# Progress bar track (thin 2 px, POC3 style).
	var bar_bg: PanelContainer = PanelContainer.new()
	bar_bg.name = "BarBg"
	bar_bg.custom_minimum_size = Vector2(0.0, 2.0)
	var bar_style: StyleBoxFlat = StyleBoxFlat.new()
	bar_style.bg_color = COLOR_BORDER
	bar_style.set_corner_radius_all(1)
	bar_bg.add_theme_stylebox_override("panel", bar_style)
	vbox.add_child(bar_bg)

	var bar_fill: ColorRect = ColorRect.new()
	bar_fill.name = "BarFill"
	bar_fill.color = COLOR_ACCENT
	bar_fill.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	bar_fill.custom_minimum_size = Vector2(0.0, 2.0)
	bar_bg.add_child(bar_fill)

	# Click handling — entire tile is the button target.
	var gui_input_lambda: Callable = func(event: InputEvent) -> void:
		if (
			event is InputEventMouseButton
			and event.pressed
			and event.button_index == MOUSE_BUTTON_LEFT
		):
			_on_tile_pressed(pid)
	tile.gui_input.connect(gui_input_lambda)

	# Mouse hover visual feedback.
	tile.mouse_entered.connect(
		func() -> void: tile.add_theme_stylebox_override("panel", style_hover)
	)
	tile.mouse_exited.connect(
		func() -> void:
			var entry: Dictionary = _entry_by_planet_id.get(pid, {})
			var is_sel: bool = bool(entry.get("selected", false))
			tile.add_theme_stylebox_override("panel", _make_tile_style(is_sel))
	)

	_entry_by_planet_id[pid] = {
		"tile": tile,
		"style_normal": style_normal,
		"name_label": name_label,
		"phase_label": phase_label,
		"orb": orb,
		"bar_fill": bar_fill,
		"bar_bg": bar_bg,
		"selected": false,
	}

	_apply_lock_visual(pid)
	return tile


func _make_orb(pid: String) -> ColorRect:
	var orb: ColorRect = ColorRect.new()
	orb.name = "Orb"
	orb.custom_minimum_size = Vector2(20.0, 20.0)
	# Read base_color from planet data if available.
	var planet_data: Dictionary = DataManager.get_planet(pid)
	var visual: Dictionary = planet_data.get("visual", {})
	var color_str: String = String(visual.get("base_color", ""))
	if not color_str.is_empty():
		orb.color = Color.from_string(color_str, PLANET_COLORS.get(pid, Color.GRAY))
	else:
		orb.color = PLANET_COLORS.get(pid, Color.GRAY)
	# Circular appearance via a custom draw — we achieve it with a StyleBoxFlat panel.
	# ColorRect doesn't support corner radius directly, so we wrap it in a PanelContainer.
	# Instead, use a custom draw approach: just let it be square and dim when locked.
	# For a proper circle, swap ColorRect to a Panel with StyleBoxFlat corners.
	# (Simplest compatible approach: use a Control with _draw overridden.)
	orb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	return orb


func _make_tile_style(selected: bool) -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = COLOR_PANEL_HOVER if selected else COLOR_PANEL_BG
	style.border_width_bottom = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_left = 2 if selected else 1
	style.border_color = COLOR_BORDER_SEL if selected else COLOR_BORDER
	style.content_margin_left = 8.0
	style.content_margin_right = 8.0
	style.content_margin_top = 7.0
	style.content_margin_bottom = 7.0
	return style


func _on_tile_pressed(pid: String) -> void:
	var is_unlocked: bool = _is_unlocked(pid)

	# Debug unlock for locked planets so any planet can be tested immediately.
	if not is_unlocked:
		_debug_unlock(pid)
		return

	if pid == "moon":
		EventBus.set_meta("open_moon_tab", true)
		EventBus.planet_selected.emit("earth")
		return

	EventBus.set_meta("open_moon_tab", false)
	EventBus.planet_selected.emit(pid)


func _debug_unlock(pid: String) -> void:
	# Force-adds the planet to GameState so it can be explored without completing
	# normal prerequisites. This is intentionally permissive for testing.
	if GameState.planets.has(pid):
		return
	var planet_data: Dictionary = DataManager.get_planet(pid)
	var initial: Dictionary = planet_data.get("initial_state", {})
	GameState.planets[pid] = {
		"terraforming_phase": int(initial.get("terraforming_phase", 0)),
		"terraforming_progress": 0.0,
		"terraforming_choices": {},
		"locked_out_choices": [],
		"population": 0,
		"atmosphere_pressure": float(initial.get("atmosphere_pressure", 0.0)),
		"temperature_celsius": float(initial.get("temperature_celsius", 0.0)),
		"visual_params": {},
	}
	_refresh_entry(pid, 0)
	# Now open the planet (Mercury uses a dedicated map scene via Main.gd).
	EventBus.set_meta("open_moon_tab", false)
	EventBus.planet_selected.emit(pid)


func _on_planet_selected(pid: String) -> void:
	for entry_pid_variant: Variant in _entry_by_planet_id.keys():
		var entry_pid: String = String(entry_pid_variant)
		var entry: Dictionary = _entry_by_planet_id.get(entry_pid, {})
		var tile: PanelContainer = _as_panel(entry.get("tile", null))
		if tile == null:
			continue

		var is_selected: bool = entry_pid == pid
		if entry_pid == "moon" and pid == "earth":
			is_selected = bool(EventBus.get_meta("open_moon_tab", false))

		entry["selected"] = is_selected
		tile.add_theme_stylebox_override("panel", _make_tile_style(is_selected))


func _refresh_entry(pid: String, _phase: int) -> void:
	if pid == "earth":
		_update_entry_display("earth")
		_update_entry_display("moon")
		return
	_update_entry_display(pid)


func _update_entry_display(pid: String) -> void:
	var entry: Dictionary = _entry_by_planet_id.get(pid, {})
	if entry.is_empty():
		return
	var phase_label: Label = _as_label(entry.get("phase_label", null))
	if phase_label != null:
		phase_label.text = _get_phase_text(pid)
	_apply_lock_visual(pid)


func _apply_lock_visual(pid: String) -> void:
	var entry: Dictionary = _entry_by_planet_id.get(pid, {})
	if entry.is_empty():
		return
	var tile: PanelContainer = _as_panel(entry.get("tile", null))
	if tile == null:
		return
	var is_unlocked: bool = _is_unlocked(pid)
	tile.modulate.a = 1.0 if is_unlocked else 0.5


func _get_phase_text(pid: String) -> String:
	if not _is_unlocked(pid):
		return "[ LOCKED — click to test ]"
	var helper: PlanetBase = _build_planet_helper(pid)
	if helper == null:
		return ""
	return helper.get_terraforming_display_name(_get_phase_value(pid))


func _get_display_name(pid: String) -> String:
	if pid == "moon":
		return "  Moon"
	var planet_data: Dictionary = DataManager.get_planet(pid)
	return String(planet_data.get("display_name", pid.capitalize()))


func _get_phase_value(pid: String) -> int:
	if pid == "earth" or pid == "moon":
		return 0
	if pid == "mercury":
		return int(GameState.mercury_phase)
	return int(GameState.planets.get(pid, {}).get("terraforming_phase", 0))


func _is_unlocked(pid: String) -> bool:
	if pid == "earth" or pid == "moon":
		return true
	return GameState.planets.has(pid)


func _build_planet_helper(pid: String) -> PlanetBase:
	var target_id: String = pid
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

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.name = "Entries"
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 2)
	add_child(vbox)
	return vbox


func _as_panel(node: Variant) -> PanelContainer:
	if node is PanelContainer:
		return node
	return null


func _as_label(node: Variant) -> Label:
	if node is Label:
		return node
	return null
