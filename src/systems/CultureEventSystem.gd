class_name CultureEventSystem
extends Node

# Evaluates culture-event triggers and queues narrative moments.
#
# Multiple events may be queued on the same game tick — e.g. a tech completes
# and a Dyson milestone is crossed simultaneously. All events are pushed to
# GameState.culture_event_queue. CultureEventCard displays them one at a time
# as the player reads and dismisses. The queue is never lost between saves —
# it is part of GameState.


func _ready() -> void:
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.kardashev_milestone_reached.connect(_on_milestone_reached)
	EventBus.tech_node_unlocked.connect(_on_tech_unlocked)
	EventBus.terraforming_phase_changed.connect(_on_phase_changed)
	EventBus.terraforming_choice_applied.connect(_on_choice_applied)
	EventBus.dyson_energy_updated.connect(_on_dyson_updated)


func _on_year_ticked(year: float) -> void:
	_check_year_triggers(year)

	if GameState.europa_mission_authorised and not GameState.europa_impacted:
		var years_to_impact: float = GameState.europa_impact_year - year
		# Fire the warning exactly once, at the 15-year mark before impact.
		if years_to_impact <= 15.0 and years_to_impact > 14.0:
			_push_event("ce_europa_warning")
		if year >= GameState.europa_impact_year:
			GameState.europa_impacted = true
			_push_event("ce_europa_impact")


func _on_milestone_reached(milestone_id: String) -> void:
	_check_trigger_type("milestone_reached", {"milestone_id": milestone_id})


func _on_tech_unlocked(_planet_id: String, node_id: String) -> void:
	_check_trigger_type("tech_completed", {"tech_id": node_id})


func _on_phase_changed(planet_id: String, phase: int) -> void:
	_check_trigger_type("terraforming_phase_changed", {"planet": planet_id, "phase": phase})


func _on_choice_applied(planet_id: String, choice_id: String) -> void:
	_check_trigger_type(
		"terraforming_choice_applied", {"planet": planet_id, "choice_id": choice_id}
	)


func _on_dyson_updated(_watts: float) -> void:
	var percent: float = GameState.dyson_coverage_percent
	for threshold: int in [10, 25, 50, 100]:
		if percent >= float(threshold):
			var event_id: String = "ce_dyson_%d_percent" % threshold
			if not _already_fired(event_id):
				_push_event(event_id)


func _check_trigger_type(trigger_type: String, match_params: Dictionary) -> void:
	# Iterate all culture events from DataManager. Find those whose trigger.type matches,
	# then verify any additional trigger fields against match_params. Skip events flagged
	# with v1_candidate: false — those are reserved for post-V1 features.
	for event: Dictionary in DataManager.get_all_culture_events():
		if event.get("v1_candidate", true) == false:
			continue

		var trigger: Dictionary = event.get("trigger", {})
		if trigger.get("type", "") != trigger_type:
			continue

		var matches: bool = false
		match trigger_type:
			"tech_completed":
				matches = trigger.get("tech_id", "") == match_params.get("tech_id", "")
			"milestone_reached":
				matches = trigger.get("milestone_id", "") == match_params.get("milestone_id", "")
			"terraforming_phase_changed":
				matches = (
					trigger.get("planet", "") == match_params.get("planet", "")
					and int(trigger.get("phase", -1)) == int(match_params.get("phase", -1))
				)
			"terraforming_choice_applied":
				matches = (
					trigger.get("planet", "") == match_params.get("planet", "")
					and trigger.get("choice_id", "") == match_params.get("choice_id", "")
				)

		if matches:
			_push_event(String(event.get("id", "")))


func _push_event(event_id: String) -> void:
	if event_id.is_empty():
		return
	if _already_fired(event_id):
		return
	GameState.culture_event_queue.append(event_id)
	_record_history(event_id)
	EventBus.culture_event_triggered.emit(event_id)


func _already_fired(event_id: String) -> bool:
	for entry: Variant in GameState.culture_event_history:
		var entry_dict: Dictionary = entry
		if entry_dict.get("event_id", "") == event_id:
			return true
	return false


func _record_history(event_id: String) -> void:
	(
		GameState
		. culture_event_history
		. append(
			{
				"event_id": event_id,
				"year": GameState.game_year,
				"planet_context": GameState.orrery_zoomed_planet,
			}
		)
	)


func _check_year_triggers(year: float) -> void:
	# Push any year_reached events whose threshold has now been crossed and haven't fired yet.
	for event: Dictionary in DataManager.get_all_culture_events():
		if event.get("v1_candidate", true) == false:
			continue
		var trigger: Dictionary = event.get("trigger", {})
		if trigger.get("type", "") != "year_reached":
			continue
		var threshold_year: float = float(trigger.get("year", 0.0))
		if year >= threshold_year:
			_push_event(String(event.get("id", "")))
