class_name DebugConsole
extends Control

const CONSOLE_HEIGHT: float = 200.0
const MAX_OUTPUT_LINES: int = 120
const DEFAULT_DYSON_TOTAL_PANELS: int = 1000000

var _is_debug_build: bool = OS.is_debug_build()
var _commands: Dictionary = {}
var _command_descriptions: Dictionary = {}
var _output_lines: Array[Dictionary] = []

var _panel: PanelContainer
var _output_scroll: ScrollContainer
var _output_box: VBoxContainer
var _input_line: LineEdit


func _ready() -> void:
	# A long-horizon strategy game needs a debug console because late-game states are too expensive to reach by normal play.
	# Jumping straight to a Dyson swarm at 80% completion or a specific biosphere
	# phase turns hours of waiting into seconds.
	# This is a development-only tool, so it removes itself entirely outside debug builds.
	if not _is_debug_build:
		queue_free()
		return

	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_register_input_action()
	_register_commands()
	_build_ui()
	_write_info("Debug console ready. Type 'help' for commands.")


func _unhandled_input(event: InputEvent) -> void:
	if not _is_debug_build:
		return
	if event.is_action_pressed("debug_console"):
		_toggle_console()
		get_viewport().set_input_as_handled()
		return
	if not visible:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var key_event: InputEventKey = event as InputEventKey
		if key_event.keycode == KEY_TAB:
			_autocomplete_command()
			accept_event()


func _register_input_action() -> void:
	if InputMap.has_action("debug_console"):
		return
	var event: InputEventKey = InputEventKey.new()
	event.keycode = KEY_QUOTELEFT
	InputMap.add_action("debug_console")
	InputMap.action_add_event("debug_console", event)


func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	_panel = PanelContainer.new()
	_panel.anchor_left = 0.0
	_panel.anchor_top = 1.0
	_panel.anchor_right = 1.0
	_panel.anchor_bottom = 1.0
	_panel.offset_left = 0.0
	_panel.offset_top = -CONSOLE_HEIGHT
	_panel.offset_right = 0.0
	_panel.offset_bottom = 0.0
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_panel)

	var panel_style: StyleBoxFlat = StyleBoxFlat.new()
	panel_style.bg_color = _get_theme_color("bg_base", Color(0.05, 0.05, 0.06, 0.95))
	panel_style.border_width_top = 1
	panel_style.border_color = _get_theme_color("accent_dim", Color(0.54, 0.36, 0.08, 1.0))
	panel_style.content_margin_left = _get_theme_constant("panel_padding", 16)
	panel_style.content_margin_top = _get_theme_constant("panel_padding", 16)
	panel_style.content_margin_right = _get_theme_constant("panel_padding", 16)
	panel_style.content_margin_bottom = _get_theme_constant("panel_padding", 16)
	_panel.add_theme_stylebox_override("panel", panel_style)

	var root_box: VBoxContainer = VBoxContainer.new()
	root_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root_box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root_box.add_theme_constant_override("separation", _get_theme_constant("margin_tight", 8))
	_panel.add_child(root_box)

	_output_scroll = ScrollContainer.new()
	_output_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_output_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root_box.add_child(_output_scroll)

	_output_box = VBoxContainer.new()
	_output_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_output_box.add_theme_constant_override("separation", 4)
	_output_scroll.add_child(_output_box)

	_input_line = LineEdit.new()
	_input_line.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_input_line.placeholder_text = "Enter debug command..."
	_input_line.text_submitted.connect(_on_input_submitted)
	_input_line.add_theme_color_override(
		"font_color", _get_theme_color("text_primary", Color(0.91, 0.88, 0.83))
	)
	_input_line.add_theme_color_override(
		"font_placeholder_color", _get_theme_color("text_secondary", Color(0.54, 0.50, 0.44))
	)
	_input_line.add_theme_color_override(
		"caret_color", _get_theme_color("accent_glow", Color(0.91, 0.63, 0.19))
	)
	root_box.add_child(_input_line)


func _toggle_console() -> void:
	visible = not visible
	mouse_filter = Control.MOUSE_FILTER_STOP if visible else Control.MOUSE_FILTER_IGNORE
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP if visible else Control.MOUSE_FILTER_IGNORE
	if visible:
		_input_line.grab_focus()
		_input_line.caret_column = _input_line.text.length()
	else:
		_input_line.release_focus()


func _register_commands() -> void:
	_register_command("help", Callable(self, "_cmd_help"), "List available commands.")
	_register_command(
		"year", Callable(self, "_cmd_set_year"), "Set the current game year. Example: year 2150"
	)
	_register_command(
		"speed", Callable(self, "_cmd_set_speed"), "Set time speed multiplier. Example: speed 5"
	)
	_register_command(
		"tech",
		Callable(self, "_cmd_complete_tech"),
		"Unlock a tech. Example: tech earth earth_fusion_ignition_theory"
	)
	_register_command(
		"planet",
		Callable(self, "_cmd_unlock_planet"),
		"Unlock a planet in GameState. Example: planet mars"
	)
	_register_command(
		"dyson", Callable(self, "_cmd_set_dyson"), "Set Dyson coverage percent. Example: dyson 80"
	)
	_register_command(
		"bio",
		Callable(self, "_cmd_set_bio_phase"),
		"Set bio phase state. Example: bio mars bio_3 running"
	)
	_register_command(
		"milestone",
		Callable(self, "_cmd_trigger_milestone"),
		"Complete a Kardashev milestone. Example: milestone type_1"
	)
	_register_command(
		"ce",
		Callable(self, "_cmd_trigger_culture_event"),
		"Queue a culture event. Example: ce ce_mars_first_liquid_water"
	)
	_register_command(
		"resources",
		Callable(self, "_cmd_set_resources"),
		"Set Mercury resources. Example: resources 9999 9999 9999"
	)
	_register_command(
		"kardashev",
		Callable(self, "_cmd_set_kardashev"),
		"Set Kardashev level. Example: kardashev 1.5"
	)
	_register_command(
		"stability",
		Callable(self, "_cmd_set_bio_stability"),
		"Set bio phase stability. Example: stability mars bio_3 0.72"
	)
	_register_command(
		"discovery",
		Callable(self, "_cmd_trigger_discovery"),
		"Trigger a discovery. Example: discovery mars 0 proto_soil_community"
	)
	_register_command("save", Callable(self, "_cmd_save"), "Invoke SaveManager.save_game().")
	_register_command("load", Callable(self, "_cmd_load"), "Invoke SaveManager.load_game().")
	_register_command(
		"reset",
		Callable(self, "_cmd_reset_game"),
		"Invoke SaveManager.reset_game() or GameState.reset()."
	)
	_register_command(
		"state", Callable(self, "_cmd_print_state"), "Print a JSON snapshot of GameState."
	)


func _register_command(command_name: String, callback: Callable, description: String) -> void:
	_commands[command_name] = callback
	_command_descriptions[command_name] = description


func _on_input_submitted(text: String) -> void:
	var trimmed: String = text.strip_edges()
	if trimmed.is_empty():
		return
	_write_command(trimmed)
	_input_line.clear()
	_execute_command(trimmed)


func _execute_command(input_text: String) -> void:
	var parts: PackedStringArray = input_text.split(" ", false)
	if parts.is_empty():
		return

	var command_name: String = parts[0].to_lower()
	if not _commands.has(command_name):
		_write_error("Unknown command '%s'. Type 'help' for a list." % command_name)
		return

	var args: PackedStringArray = parts.slice(1)
	var callback: Callable = _commands[command_name]
	var result: Variant = callback.call(args)
	if result is String and not String(result).is_empty():
		_write_success(String(result))


func _autocomplete_command() -> void:
	var current_text: String = _input_line.text.strip_edges()
	if current_text.is_empty() or current_text.contains(" "):
		return

	var matches: Array[String] = []
	for command_name_variant: Variant in _commands.keys():
		var command_name: String = String(command_name_variant)
		if command_name.begins_with(current_text.to_lower()):
			matches.append(command_name)

	matches.sort()
	if matches.is_empty():
		_write_error("No command matches '%s'." % current_text)
		return
	if matches.size() == 1:
		_input_line.text = "%s " % matches[0]
		_input_line.caret_column = _input_line.text.length()
		return
	_write_info("Matches: %s" % ", ".join(matches))


func _cmd_help(_args: PackedStringArray) -> String:
	var names: Array[String] = []
	for command_name_variant: Variant in _commands.keys():
		names.append(String(command_name_variant))
	names.sort()
	for command_name: String in names:
		_write_info("%s - %s" % [command_name, String(_command_descriptions[command_name])])
	return "Listed %d commands." % names.size()


func _cmd_set_year(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: year <year>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	game_state.set("game_year", args[0].to_float())
	return "Set year to %s." % args[0]


func _cmd_set_speed(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: speed <multiplier>")
	var time_manager: Node = _require_autoload("TimeManager")
	if time_manager == null:
		return ""
	var speed_value: float = args[0].to_float()
	if time_manager.has_method("set_speed"):
		time_manager.call("set_speed", speed_value)
	elif time_manager.has_method("set_time_scale"):
		time_manager.call("set_time_scale", speed_value)
	else:
		var current_speed: Variant = time_manager.get("speed_multiplier")
		if current_speed == null:
			return _error_result("TimeManager has no supported speed API.")
		time_manager.set("speed_multiplier", speed_value)
	return "Set speed to %s." % args[0]


func _cmd_complete_tech(args: PackedStringArray) -> String:
	if args.size() < 2:
		return _error_result("Usage: tech <planet_id> <tech_id>")
	var tech_tree_system: Node = _require_autoload("TechTreeSystem")
	if tech_tree_system == null:
		return ""
	if not tech_tree_system.has_method("unlock_tech"):
		return _error_result("TechTreeSystem.unlock_tech() is unavailable.")
	tech_tree_system.call("unlock_tech", args[0], args[1])
	return "Unlocked tech %s for %s." % [args[1], args[0]]


func _cmd_unlock_planet(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: planet <planet_id>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var planets: Dictionary = (
		game_state.get("planets") if game_state.get("planets") is Dictionary else {}
	)
	var planet_id: String = args[0]

	var data_manager: Node = _find_autoload("DataManager")
	var initial_state: Dictionary = {}
	if data_manager != null and data_manager.has_method("get_planet"):
		var planet_data: Variant = data_manager.call("get_planet", planet_id)
		if planet_data is Dictionary:
			initial_state = (
				Dictionary((planet_data as Dictionary).get("initial_state", {})).duplicate(true)
			)

	var planet_state: Dictionary = planets.get(planet_id, {}) if planets.has(planet_id) else {}
	planet_state["id"] = planet_id
	planet_state["unlocked"] = true
	if not planet_state.has("bio_phases"):
		planet_state["bio_phases"] = {}
	if not planet_state.has("bio_stability"):
		planet_state["bio_stability"] = 0.0
	if not initial_state.is_empty():
		planet_state["state"] = initial_state
	planets[planet_id] = planet_state
	game_state.set("planets", planets)
	return "Initialised planet %s." % planet_id


func _cmd_set_dyson(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: dyson <percent>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var percent: float = args[0].to_float()
	game_state.set("dyson_coverage_percent", percent)
	var total_panels: int = DEFAULT_DYSON_TOTAL_PANELS
	var dyson_system: Node = _find_autoload("DysonSystem")
	if dyson_system != null:
		var total_panels_variant: Variant = dyson_system.get("TOTAL_PANELS_FOR_100_PERCENT")
		if total_panels_variant is int:
			total_panels = int(total_panels_variant)
	game_state.set("dyson_panel_count", int(percent / 100.0 * float(total_panels)))
	return "Set Dyson coverage to %.2f%%." % percent


func _cmd_set_bio_phase(args: PackedStringArray) -> String:
	if args.size() < 3:
		return _error_result("Usage: bio <planet_id> <phase_id> <available|running>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var planet_id: String = args[0]
	var phase_id: String = args[1]
	var status: String = args[2]
	var planets: Dictionary = (
		game_state.get("planets") if game_state.get("planets") is Dictionary else {}
	)
	var planet_state: Dictionary = planets.get(planet_id, {}) if planets.has(planet_id) else {}
	var bio_phases: Dictionary = (
		planet_state.get("bio_phases", {})
		if planet_state.get("bio_phases", {}) is Dictionary
		else {}
	)
	bio_phases[phase_id] = {"status": status}
	planet_state["bio_phases"] = bio_phases
	planet_state["unlocked"] = true
	planets[planet_id] = planet_state
	game_state.set("planets", planets)
	return "Set %s %s to %s." % [planet_id, phase_id, status]


func _cmd_trigger_milestone(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: milestone <milestone_id>")
	var kardashev_system: Node = _require_autoload("KardashevSystem")
	if kardashev_system == null:
		return ""
	if not kardashev_system.has_method("_complete_milestone"):
		return _error_result("KardashevSystem._complete_milestone() is unavailable.")
	kardashev_system.call("_complete_milestone", args[0])
	return "Triggered milestone %s." % args[0]


func _cmd_trigger_culture_event(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: ce <event_id>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var queue: Array = (
		game_state.get("culture_event_queue")
		if game_state.get("culture_event_queue") is Array
		else []
	)
	queue.append(args[0])
	game_state.set("culture_event_queue", queue)
	return "Queued culture event %s." % args[0]


func _cmd_set_resources(args: PackedStringArray) -> String:
	if args.size() < 3:
		return _error_result("Usage: resources <value_a> <value_b> <value_c>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	(
		game_state
		. set(
			"mercury_resources",
			{
				"value_a": args[0].to_float(),
				"value_b": args[1].to_float(),
				"value_c": args[2].to_float(),
			}
		)
	)
	return "Updated Mercury resources."


func _cmd_set_kardashev(args: PackedStringArray) -> String:
	if args.size() < 1:
		return _error_result("Usage: kardashev <level>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	game_state.set("kardashev_level", args[0].to_float())
	return "Set Kardashev level to %s." % args[0]


func _cmd_set_bio_stability(args: PackedStringArray) -> String:
	if args.size() < 3:
		return _error_result("Usage: stability <planet_id> <phase_id> <value>")
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var planets: Dictionary = (
		game_state.get("planets") if game_state.get("planets") is Dictionary else {}
	)
	var planet_id: String = args[0]
	var phase_id: String = args[1]
	if not planets.has(planet_id):
		return _error_result("Planet %s is not initialised." % planet_id)
	var planet_state: Dictionary = (planets[planet_id] as Dictionary).duplicate(true)
	var bio_phases: Dictionary = (
		planet_state.get("bio_phases", {})
		if planet_state.get("bio_phases", {}) is Dictionary
		else {}
	)
	var phase_state: Dictionary = bio_phases.get(phase_id, {}) if bio_phases.has(phase_id) else {}
	phase_state["stability"] = args[2].to_float()
	bio_phases[phase_id] = phase_state
	planet_state["bio_phases"] = bio_phases
	planet_state["bio_stability"] = args[2].to_float()
	planets[planet_id] = planet_state
	game_state.set("planets", planets)
	return "Set %s %s stability to %s." % [planet_id, phase_id, args[2]]


func _cmd_trigger_discovery(args: PackedStringArray) -> String:
	var error_message: String = ""
	if args.size() < 3:
		error_message = "Usage: discovery <planet_id> <slot_index> <discovery_id>"
	var bio_phase_system: Node = _require_autoload("BioPhaseSystem")
	if error_message.is_empty() and bio_phase_system == null:
		return ""
	if error_message.is_empty() and not bio_phase_system.has_method("_trigger_discovery"):
		error_message = "BioPhaseSystem._trigger_discovery() is unavailable."
	var data_manager: Node = _require_autoload("DataManager")
	if error_message.is_empty() and data_manager == null:
		return ""
	if error_message.is_empty() and not data_manager.has_method("get_emergent_discoveries"):
		error_message = "DataManager.get_emergent_discoveries() is unavailable."
	var discoveries: Variant = []
	if error_message.is_empty():
		discoveries = data_manager.call("get_emergent_discoveries")
		if not discoveries is Array:
			error_message = "Emergent discoveries data is not an Array."
	if not error_message.is_empty():
		return _error_result(error_message)

	for discovery_variant: Variant in discoveries as Array:
		if (
			discovery_variant is Dictionary
			and String((discovery_variant as Dictionary).get("id", "")) == args[2]
		):
			bio_phase_system.call(
				"_trigger_discovery", args[0], args[1].to_int(), discovery_variant
			)
			return "Triggered discovery %s on %s." % [args[2], args[0]]
	return _error_result("Discovery %s was not found." % args[2])


func _cmd_save(_args: PackedStringArray) -> String:
	var save_manager: Node = _require_autoload("SaveManager")
	if save_manager == null:
		return ""
	if save_manager.has_method("save_game"):
		save_manager.call("save_game")
		return "Save requested."
	return _error_result("SaveManager.save_game() is unavailable.")


func _cmd_load(_args: PackedStringArray) -> String:
	var save_manager: Node = _require_autoload("SaveManager")
	if save_manager == null:
		return ""
	if save_manager.has_method("load_game"):
		save_manager.call("load_game")
		return "Load requested."
	return _error_result("SaveManager.load_game() is unavailable.")


func _cmd_reset_game(_args: PackedStringArray) -> String:
	var save_manager: Node = _find_autoload("SaveManager")
	if save_manager != null and save_manager.has_method("reset_game"):
		save_manager.call("reset_game")
		return "Reset requested through SaveManager."
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	if game_state.has_method("reset"):
		game_state.call("reset")
		return "Reset requested through GameState.reset()."
	return _error_result("No supported reset API was found.")


func _cmd_print_state(_args: PackedStringArray) -> String:
	var game_state: Node = _require_autoload("GameState")
	if game_state == null:
		return ""
	var snapshot: Dictionary = _snapshot_node_properties(game_state)
	var json_text: String = JSON.stringify(snapshot, "  ")
	for line: String in json_text.split("\n"):
		_write_info(line)
	return "Printed GameState snapshot."


func _snapshot_node_properties(target: Object) -> Dictionary:
	var snapshot: Dictionary = {}
	for property_info: Dictionary in target.get_property_list():
		var property_name: String = String(property_info.get("name", ""))
		var usage: int = int(property_info.get("usage", 0))
		if property_name.begins_with("_"):
			continue
		if usage & PROPERTY_USAGE_SCRIPT_VARIABLE == 0:
			continue
		var value: Variant = target.get(property_name)
		if value is Object:
			continue
		snapshot[property_name] = value
	return snapshot


func _find_autoload(name: String) -> Node:
	return get_tree().root.get_node_or_null(name)


func _require_autoload(name: String) -> Node:
	var autoload: Node = _find_autoload(name)
	if autoload == null:
		_write_error("Autoload/system '%s' is not available in the current scene." % name)
	return autoload


func _write_command(text: String) -> void:
	_append_output("> %s" % text, _get_theme_color("accent_glow", Color(0.91, 0.63, 0.19)))


func _write_info(text: String) -> void:
	_append_output(text, _get_theme_color("text_primary", Color(0.91, 0.88, 0.83)))


func _write_success(text: String) -> void:
	_append_output(text, _get_theme_color("status_good", Color(0.35, 0.62, 0.35)))


func _write_error(text: String) -> void:
	_append_output(text, _get_theme_color("status_bad", Color(0.62, 0.23, 0.16)))


func _error_result(text: String) -> String:
	_write_error(text)
	return ""


func _append_output(text: String, color: Color) -> void:
	_output_lines.append({"text": text, "color": color})
	while _output_lines.size() > MAX_OUTPUT_LINES:
		_output_lines.remove_at(0)
	_refresh_output()


func _refresh_output() -> void:
	for child: Node in _output_box.get_children():
		child.queue_free()
	for line: Dictionary in _output_lines:
		var label: Label = Label.new()
		label.text = String(line.get("text", ""))
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		label.add_theme_color_override("font_color", line.get("color", Color.WHITE))
		_output_box.add_child(label)
	call_deferred("_scroll_output_to_bottom")


func _scroll_output_to_bottom() -> void:
	if _output_scroll != null:
		_output_scroll.scroll_vertical = int(_output_scroll.get_v_scroll_bar().max_value)


func _get_theme_color(color_name: String, fallback: Color) -> Color:
	if theme != null and theme.has_color(color_name, "Global"):
		return theme.get_color(color_name, "Global")
	return fallback


func _get_theme_constant(constant_name: String, fallback: int) -> int:
	if theme != null and theme.has_constant(constant_name, "Global"):
		return theme.get_constant(constant_name, "Global")
	return fallback
