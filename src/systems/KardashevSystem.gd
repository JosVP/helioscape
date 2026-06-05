class_name KardashevSystem
extends Node

# Computes Kardashev milestones and civilization tags.


func _ready() -> void:
	EventBus.game_year_ticked.connect(_on_game_year_ticked)
	EventBus.research_track_completed.connect(_on_research_track_completed)
	EventBus.dyson_energy_updated.connect(_on_dyson_energy_updated)
	EventBus.terraforming_phase_changed.connect(_on_terraforming_phase_changed)
	_update_kardashev_level()
	_check_all_milestones()


func _on_game_year_ticked(_year: float) -> void:
	_update_kardashev_level()
	_check_all_milestones()


func _on_research_track_completed(_track_id: String) -> void:
	_check_all_milestones()


func _on_dyson_energy_updated(_watts: float) -> void:
	_update_kardashev_level()
	_check_all_milestones()


func _on_terraforming_phase_changed(_planet_id: String, _phase: int) -> void:
	_check_all_milestones()


func _update_kardashev_level() -> void:
	var coverage_percent: float = clampf(GameState.dyson_coverage_percent, 0.0, 100.0)
	GameState.kardashev_level = 0.73 + (coverage_percent / 100.0) * 1.27


func _check_all_milestones() -> void:
	for milestone: Dictionary in DataManager.get_all_milestones():
		var milestone_id: String = String(milestone.get("id", ""))
		if milestone_id.is_empty() or GameState.completed_milestones.has(milestone_id):
			continue
		if _check_conditions(milestone):
			_complete_milestone(milestone_id)


func _check_conditions(milestone: Dictionary) -> bool:
	var conditions: Variant = milestone.get("conditions", [])
	if not (conditions is Array):
		return false

	for condition_variant: Variant in conditions:
		if not (condition_variant is Dictionary):
			return false
		var condition: Dictionary = condition_variant
		if not _check_condition(String(condition.get("type", ""))):
			return false
	return true


func _check_condition(condition_id: String) -> bool:
	var is_met: bool = false
	match condition_id:
		"deuterium_fusion_online":
			is_met = GameState.completed_techs.has("earth_fusion_ignition_theory")
		"dyson_15_percent":
			is_met = GameState.dyson_coverage_percent >= 15.0
		"dyson_50_percent":
			is_met = GameState.dyson_coverage_percent >= 50.0
		"dyson_100_percent":
			is_met = GameState.dyson_coverage_percent >= 100.0
		"two_habitable_worlds":
			is_met = _has_two_habitable_worlds()
		"first_self_sustaining_colony":
			is_met = _has_first_self_sustaining_colony()
		"interstellar_seed_ship_launched":
			is_met = GameState.completed_techs.has("interstellar_seed_ship_launched")
		_:
			is_met = false

	return is_met


func _has_two_habitable_worlds() -> bool:
	var habitable_worlds: int = 0
	for planet_id: String in ["earth", "mars", "venus"]:
		if not GameState.planets.has(planet_id):
			continue
		if _is_habitable_planet(planet_id):
			habitable_worlds += 1
	return habitable_worlds >= 2


func _is_habitable_planet(planet_id: String) -> bool:
	var planet_state: Dictionary = GameState.planets.get(planet_id, {})
	var phase: int = int(planet_state.get("terraforming_phase", 0))
	var pressure: float = float(planet_state.get("atmosphere_pressure", 0.0))
	match planet_id:
		"earth":
			return true
		"mars":
			return phase >= 4 and pressure >= 0.2
		"venus":
			return phase >= 3 and pressure <= 20.0
		_:
			return false


func _has_first_self_sustaining_colony() -> bool:
	for planet_id: String in GameState.planets:
		var planet_state: Dictionary = GameState.planets.get(planet_id, {})
		if int(planet_state.get("population", 0)) >= 1000000:
			return true
	return false


func _complete_milestone(milestone_id: String) -> void:
	if milestone_id.is_empty() or GameState.completed_milestones.has(milestone_id):
		return

	var milestone: Dictionary = DataManager.get_kardashev_milestone(milestone_id)
	if milestone.is_empty():
		push_warning("KardashevSystem: unknown milestone %s" % milestone_id)
		return

	GameState.completed_milestones.append(milestone_id)
	_process_milestone_effects(milestone)
	if milestone_id == "first_era_complete":
		_store_first_era_summary()
	EventBus.kardashev_milestone_reached.emit(milestone_id)


func _process_milestone_effects(milestone: Dictionary) -> void:
	var effects: Variant = milestone.get("effects", [])
	if not (effects is Array):
		return

	for effect_variant: Variant in effects:
		if not (effect_variant is Dictionary):
			continue
		var effect: Dictionary = effect_variant
		match String(effect.get("type", "")):
			"unlock_dyson_panel_tier":
				GameState.dyson_panel_tier = String(effect.get("tier", GameState.dyson_panel_tier))
			"tag_decision":
				_apply_decision_tag(String(effect.get("tag", "")))
			_:
				pass


func _apply_decision_tag(tag: String) -> void:
	match tag:
		"naturalist":
			GameState.naturalist_decisions += 1
		"architect":
			GameState.architect_decisions += 1
		_:
			pass


func _store_first_era_summary() -> void:
	var total_decisions: int = GameState.naturalist_decisions + GameState.architect_decisions
	if total_decisions <= 0:
		GameState.naturalist_ratio = 0.0
		return

	GameState.naturalist_ratio = float(GameState.naturalist_decisions) / float(total_decisions)
