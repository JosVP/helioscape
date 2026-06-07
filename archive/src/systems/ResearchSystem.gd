class_name ResearchSystem
extends Node

# Tracks research capacity, active tracks, and completions.
# Research tracks are paused, never cancelled: pausing preserves progress_years,
# frees RP capacity, and resuming continues from the saved progress.


func _ready() -> void:
	add_to_group("research_system")
	EventBus.game_year_ticked.connect(_on_year_ticked)


func _on_year_ticked(_year: float) -> void:
	var completed_track_ids: Array[String] = []

	for index in range(GameState.active_research.size()):
		var track_entry: Dictionary = GameState.active_research[index]
		if bool(track_entry.get("is_paused", false)):
			continue

		var progress_years: float = float(track_entry.get("progress_years", 0.0)) + 1.0
		track_entry["progress_years"] = progress_years
		GameState.active_research[index] = track_entry

		var track_id: String = String(track_entry.get("track_id", ""))
		if track_id.is_empty():
			continue

		var track_data: Dictionary = DataManager.get_research_track(track_id)
		var duration_years: float = float(track_data.get("duration_years", 0.0))
		if duration_years <= 0.0 or progress_years >= duration_years:
			completed_track_ids.append(track_id)

	for track_id: String in completed_track_ids:
		_complete_track(track_id)


func _complete_track(track_id: String) -> void:
	var entry_index: int = _find_active_track_index(track_id)
	if entry_index == -1:
		return

	var track_entry: Dictionary = GameState.active_research[entry_index]
	var track_data: Dictionary = DataManager.get_research_track(track_id)
	var rp_cost: int = int(track_data.get("rp_cost", 0))

	GameState.active_research.remove_at(entry_index)
	GameState.used_rp_capacity = maxi(0, GameState.used_rp_capacity - rp_cost)

	if not GameState.completed_techs.has(track_id):
		GameState.completed_techs.append(track_id)
	GameState.completed_research_years[track_id] = int(GameState.game_year)

	_process_on_complete_effects(
		track_data.get("on_complete_effects", []), String(track_entry.get("planet_id", ""))
	)
	EventBus.research_track_completed.emit(track_id)


func can_start_track(track_id: String) -> bool:
	var track_data: Dictionary = DataManager.get_research_track(track_id)
	if track_data.is_empty():
		return false

	var prerequisite_tech: String = String(track_data.get("prerequisite_tech", ""))
	if not prerequisite_tech.is_empty() and not GameState.completed_techs.has(prerequisite_tech):
		return false

	if GameState.completed_techs.has(track_id):
		return false

	if _find_active_track_index(track_id) != -1:
		return false

	var rp_cost: int = int(track_data.get("rp_cost", 0))
	return GameState.used_rp_capacity + rp_cost <= GameState.total_rp_capacity


func start_track(track_id: String, planet_id: String) -> void:
	if GameState.completed_techs.has(track_id):
		return

	if _find_paused_track_index(track_id) != -1:
		resume_track(track_id)
		return

	if not can_start_track(track_id):
		return

	var track_data: Dictionary = DataManager.get_research_track(track_id)
	var rp_cost: int = int(track_data.get("rp_cost", 0))

	GameState.active_research.append(
		{"track_id": track_id, "planet_id": planet_id, "progress_years": 0.0, "is_paused": false}
	)
	GameState.used_rp_capacity += rp_cost
	EventBus.research_track_started.emit(track_id)


func pause_track(track_id: String) -> void:
	var entry_index: int = _find_active_track_index(track_id)
	if entry_index == -1:
		return

	var track_entry: Dictionary = GameState.active_research[entry_index]
	if bool(track_entry.get("is_paused", false)):
		return

	track_entry["is_paused"] = true
	GameState.active_research[entry_index] = track_entry

	var track_data: Dictionary = DataManager.get_research_track(track_id)
	var rp_cost: int = int(track_data.get("rp_cost", 0))
	GameState.used_rp_capacity = maxi(0, GameState.used_rp_capacity - rp_cost)
	EventBus.research_track_paused.emit(track_id)


func resume_track(track_id: String) -> void:
	var entry_index: int = _find_paused_track_index(track_id)
	if entry_index == -1:
		return

	var track_data: Dictionary = DataManager.get_research_track(track_id)
	var rp_cost: int = int(track_data.get("rp_cost", 0))
	if GameState.used_rp_capacity + rp_cost > GameState.total_rp_capacity:
		return

	var track_entry: Dictionary = GameState.active_research[entry_index]
	track_entry["is_paused"] = false
	GameState.active_research[entry_index] = track_entry

	GameState.used_rp_capacity += rp_cost
	EventBus.research_track_resumed.emit(track_id)


func _process_on_complete_effects(effects: Variant, source_planet: String) -> void:
	if not (effects is Array):
		return

	for effect_variant: Variant in effects:
		if not (effect_variant is Dictionary):
			continue

		var effect: Dictionary = effect_variant
		var effect_type: String = String(effect.get("type", ""))
		match effect_type:
			"unlock_tech":
				var target_tech_id: String = String(effect.get("target", ""))
				_unlock_completed_track_tech(target_tech_id, source_planet)
			"emit_event":
				var event_id: String = String(effect.get("event_id", ""))
				_push_culture_event(event_id)
			"spillover_unlock":
				var target_planet_id: String = String(effect.get("target_planet", ""))
				var target_tech_id_2: String = String(effect.get("target_tech", ""))
				if not target_planet_id.is_empty() and not target_tech_id_2.is_empty():
					EventBus.tech_node_available.emit(target_planet_id, target_tech_id_2)
					EventBus.spillover_unlocked.emit(target_tech_id_2)
				var spillover_event_id: String = String(
					effect.get(
						"event_id", "ce_spillover_%s_%s" % [target_planet_id, target_tech_id_2]
					)
				)
				_push_culture_event(spillover_event_id)
			"apply_terraforming_choice":
				var target_planet_name: String = String(effect.get("planet", ""))
				var choice_id: String = String(effect.get("choice_id", ""))
				var permanent: bool = bool(effect.get("permanent", false))
				_call_terraforming_apply_choice(target_planet_name, choice_id, permanent)
			"tag_decision":
				var tag: String = String(effect.get("tag", ""))
				match tag:
					"naturalist":
						GameState.naturalist_decisions += 1
					"architect":
						GameState.architect_decisions += 1
					_:
						pass
			_:
				pass


func _unlock_completed_track_tech(target_tech_id: String, fallback_planet: String) -> void:
	if target_tech_id.is_empty():
		return

	var tech_node: Dictionary = DataManager.get_tech_node(target_tech_id)
	var target_planet: String = String(tech_node.get("planet", fallback_planet))

	var tech_tree_system: Node = _get_tech_tree_system()
	if tech_tree_system != null and tech_tree_system.has_method("unlock_tech"):
		tech_tree_system.call("unlock_tech", target_planet, target_tech_id)
		return

	if not GameState.completed_techs.has(target_tech_id):
		GameState.completed_techs.append(target_tech_id)

	if not target_planet.is_empty() and GameState.planets.has(target_planet):
		var planet_state: Dictionary = GameState.planets.get(target_planet, {})
		var unlocked_techs: Array = planet_state.get("unlocked_techs", [])
		if not unlocked_techs.has(target_tech_id):
			unlocked_techs.append(target_tech_id)
		planet_state["unlocked_techs"] = unlocked_techs
		GameState.planets[target_planet] = planet_state

	EventBus.tech_node_unlocked.emit(target_planet, target_tech_id)


func _get_tech_tree_system() -> Node:
	var tech_tree_system: Node = get_tree().get_first_node_in_group("tech_tree_system")
	if tech_tree_system == null and has_node("/root/Main/Systems/TechTreeSystem"):
		tech_tree_system = get_node("/root/Main/Systems/TechTreeSystem")
	return tech_tree_system


func _call_terraforming_apply_choice(planet_id: String, choice_id: String, permanent: bool) -> void:
	if planet_id.is_empty() or choice_id.is_empty():
		return

	var terraforming_system: Node = get_tree().get_first_node_in_group("terraforming_system")
	if terraforming_system == null and has_node("/root/Main/Systems/TerraformingSystem"):
		terraforming_system = get_node("/root/Main/Systems/TerraformingSystem")

	if terraforming_system != null and terraforming_system.has_method("apply_choice"):
		terraforming_system.call("apply_choice", planet_id, choice_id, permanent)
		return

	push_warning("ResearchSystem: TerraformingSystem.apply_choice unavailable for %s" % choice_id)


func _push_culture_event(event_id: String) -> void:
	if event_id.is_empty():
		return
	GameState.culture_event_queue.append(event_id)
	EventBus.culture_event_triggered.emit(event_id)


func _find_active_track_index(track_id: String) -> int:
	for index in range(GameState.active_research.size()):
		var entry: Dictionary = GameState.active_research[index]
		if String(entry.get("track_id", "")) == track_id:
			return index
	return -1


func _find_paused_track_index(track_id: String) -> int:
	for index in range(GameState.active_research.size()):
		var entry: Dictionary = GameState.active_research[index]
		if String(entry.get("track_id", "")) != track_id:
			continue
		if bool(entry.get("is_paused", false)):
			return index
	return -1
