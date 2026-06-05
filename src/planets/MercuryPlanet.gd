class_name MercuryPlanet
extends PlanetBase

const PHASE_RATE_MULTIPLIER: Dictionary = {
	0: 1.0,
	1: 1.6,
	2: 2.4,
}

var planet_id: String = "mercury"


func get_unlock_condition() -> String:
	return "earth_launch_mercury_mission"


func get_terraforming_display_name(phase: int) -> String:
	match phase:
		0:
			return "Initial Landing"
		1:
			return "Industrial Expansion"
		2:
			return "Full Production"
		_:
			return "Phase %d" % phase


func get_current_phase_description() -> String:
	match GameState.mercury_phase:
		0:
			return "We have footholds on the terminator line, and every shipment still feels like a test of nerve."
		1:
			return "We are scaling extraction and fabrication, and Mercury is becoming the forge of the inner system."
		2:
			return "We run Mercury as a mature industrial world, feeding orbital construction at strategic scale."
		_:
			return "We are adapting our plans as Mercury enters an unfamiliar stage."


func get_resource_rates() -> Dictionary:
	var rates: Dictionary = {}
	var multiplier: float = float(PHASE_RATE_MULTIPLIER.get(GameState.mercury_phase, 1.0))
	var resources: Array[String] = ["common_ore", "rare_metals", "polar_volatiles"]

	for resource_id: String in resources:
		var resource_data: Dictionary = DataManager.get_resource(resource_id)
		var base_rate: float = float(resource_data.get("base_accumulation_rate", 0.0))
		rates[resource_id] = base_rate * multiplier

	return rates


func get_dyson_output_summary() -> String:
	var panel_count: int = GameState.dyson_panel_count
	var watts: float = GameState.dyson_energy_watts
	return "%d panels active, generating %s W." % [panel_count, _format_watts(watts)]


func is_unlocked() -> bool:
	return "earth_launch_mercury_mission" in GameState.completed_techs


func _format_watts(watts: float) -> String:
	if watts >= 1e15:
		return "%.2f P" % (watts / 1e15)
	if watts >= 1e12:
		return "%.2f T" % (watts / 1e12)
	if watts >= 1e9:
		return "%.2f G" % (watts / 1e9)
	return "%.2f" % watts
