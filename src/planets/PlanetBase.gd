class_name PlanetBase
extends Node

var planet_id: String = ""


func _ready() -> void:
	assert(not planet_id.is_empty(), "PlanetBase child must set planet_id.")


func get_terraforming_display_name(phase: int) -> String:
	push_warning("PlanetBase.get_terraforming_display_name() must be overridden.")
	return "Phase %d" % phase


func get_current_phase_description() -> String:
	push_warning("PlanetBase.get_current_phase_description() must be overridden.")
	return ""


func get_unlock_condition() -> String:
	push_warning("PlanetBase.get_unlock_condition() must be overridden.")
	return ""


func is_unlocked() -> bool:
	var unlock_condition: String = get_unlock_condition()
	if unlock_condition.is_empty():
		return true
	return GameState.completed_techs.has(unlock_condition)
