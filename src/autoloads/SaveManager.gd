extends Node

# Serializes and restores GameState snapshots.

const SAVE_PATH: String = "user://save_slot_1.json"
const SAVE_VERSION: int = 1


func save_game() -> void:
	var save_data: Dictionary = {
		"save_version": SAVE_VERSION,
		"game_year": GameState.game_year,
		"game_speed": GameState.game_speed,
		"is_paused": GameState.is_paused,
		"is_first_playthrough": GameState.is_first_playthrough,
		"planets": GameState.planets,
		"mercury_phase": GameState.mercury_phase,
		"mercury_resources": GameState.mercury_resources,
		"mercury_radiation_clear_year": GameState.mercury_radiation_clear_year,
		"dyson_energy_watts": GameState.dyson_energy_watts,
		"dyson_panel_count": GameState.dyson_panel_count,
		"dyson_panel_tier": GameState.dyson_panel_tier,
		"dyson_coverage_percent": GameState.dyson_coverage_percent,
		"active_research": GameState.active_research,
		"completed_research_years": GameState.completed_research_years,
		"total_rp_capacity": GameState.total_rp_capacity,
		"used_rp_capacity": GameState.used_rp_capacity,
		"kardashev_level": GameState.kardashev_level,
		"kardashev_tags": GameState.kardashev_tags,
		"culture_event_history": GameState.culture_event_history,
		"culture_event_queue": GameState.culture_event_queue,
		"completed_techs": GameState.completed_techs,
		"completed_milestones": GameState.completed_milestones,
		"naturalist_decisions": GameState.naturalist_decisions,
		"architect_decisions": GameState.architect_decisions,
		"naturalist_ratio": GameState.naturalist_ratio,
		"europa_mission_authorised": GameState.europa_mission_authorised,
		"europa_impact_year": GameState.europa_impact_year,
		"europa_impacted": GameState.europa_impacted,
		"europa_life_confirmed": GameState.europa_life_confirmed,
		"orrery_zoomed_planet": GameState.orrery_zoomed_planet
	}

	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("SaveManager: failed to open save file for writing at %s" % SAVE_PATH)
		return

	file.store_string(JSON.stringify(save_data, "\t"))
	EventBus.game_saved.emit()


func load_game() -> void:
	if not has_save():
		return

	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_warning("SaveManager: failed to open save file for reading at %s" % SAVE_PATH)
		return

	var raw_text: String = file.get_as_text()
	var parsed: Variant = JSON.parse_string(raw_text)
	if not (parsed is Dictionary):
		push_warning("SaveManager: save file is missing or corrupt at %s" % SAVE_PATH)
		return

	var save_data: Dictionary = parsed
	var from_version: int = int(save_data.get("save_version", SAVE_VERSION))
	if from_version != SAVE_VERSION:
		save_data = _migrate(save_data, from_version)

	GameState.game_year = float(save_data.get("game_year", 2033.0))
	GameState.game_speed = int(save_data.get("game_speed", 1))
	GameState.is_paused = bool(save_data.get("is_paused", false))
	GameState.is_first_playthrough = bool(save_data.get("is_first_playthrough", true))
	GameState.planets = save_data.get("planets", {})
	GameState.mercury_phase = int(save_data.get("mercury_phase", 0))
	GameState.mercury_resources = save_data.get(
		"mercury_resources", {"common_ore": 0.0, "rare_metals": 0.0, "polar_volatiles": 0.0}
	)
	GameState.mercury_radiation_clear_year = float(
		save_data.get("mercury_radiation_clear_year", 0.0)
	)
	GameState.dyson_energy_watts = float(save_data.get("dyson_energy_watts", 0.0))
	GameState.dyson_panel_count = int(save_data.get("dyson_panel_count", 0))
	GameState.dyson_panel_tier = String(save_data.get("dyson_panel_tier", "basic"))
	GameState.dyson_coverage_percent = float(save_data.get("dyson_coverage_percent", 0.0))
	GameState.active_research = save_data.get("active_research", [])
	GameState.completed_research_years = save_data.get("completed_research_years", {})
	GameState.total_rp_capacity = int(save_data.get("total_rp_capacity", 60))
	GameState.used_rp_capacity = int(save_data.get("used_rp_capacity", 0))
	GameState.kardashev_level = float(save_data.get("kardashev_level", 0.73))
	GameState.kardashev_tags = save_data.get("kardashev_tags", [])
	GameState.culture_event_history = save_data.get("culture_event_history", [])
	GameState.culture_event_queue = save_data.get("culture_event_queue", [])
	GameState.completed_techs = save_data.get("completed_techs", [])
	GameState.completed_milestones = save_data.get("completed_milestones", [])
	GameState.naturalist_decisions = int(save_data.get("naturalist_decisions", 0))
	GameState.architect_decisions = int(save_data.get("architect_decisions", 0))
	GameState.naturalist_ratio = float(save_data.get("naturalist_ratio", 0.0))
	GameState.europa_mission_authorised = bool(save_data.get("europa_mission_authorised", false))
	GameState.europa_impact_year = float(save_data.get("europa_impact_year", 0.0))
	GameState.europa_impacted = bool(save_data.get("europa_impacted", false))
	GameState.europa_life_confirmed = bool(save_data.get("europa_life_confirmed", false))
	GameState.orrery_zoomed_planet = String(save_data.get("orrery_zoomed_planet", ""))
	EventBus.game_loaded.emit()


func _migrate(data: Dictionary, from_version: int) -> Dictionary:
	# Future save versions should route through version-keyed migration functions here
	# so older saves can be upgraded incrementally without breaking load_game().
	push_warning("SaveManager: no migration path from version %d" % from_version)
	return data


func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func delete_save() -> void:
	if not has_save():
		return

	var result: Error = DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
	if result != OK:
		push_warning("SaveManager: failed to delete save file at %s" % SAVE_PATH)
