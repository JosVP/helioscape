class_name MarsPlanet
extends PlanetBase


func _init() -> void:
	planet_id = "mars"


func get_unlock_condition() -> String:
	return "mercury_phase_2_complete"


# Mars has no single active_path value. We derive state from additive active choices,
# and phase display names reflect the current combination of applied choices.
func get_active_choices() -> Array[String]:
	var choices: Dictionary = GameState.planets.get("mars", {}).get("terraforming_choices", {})
	var active: Array[String] = []
	for choice_id_variant: Variant in choices.keys():
		var choice_id: String = String(choice_id_variant)
		var choice_state: Dictionary = choices.get(choice_id, {})
		if bool(choice_state.get("active", false)):
			active.append(choice_id)
	return active


func get_terraforming_display_name(phase: int) -> String:
	var active: Array[String] = get_active_choices()
	var display_name: String = "Phase %d" % phase
	match phase:
		0:
			display_name = "Frozen Desert"
		1:
			display_name = "Atmospheric Seeding"
		2:
			if "mars_polar_detonation" in active:
				display_name = "Post-Detonation Era"
			elif "mars_orbital_mirrors" in active:
				display_name = "Warming Under Mirrors"
			elif "mars_magnetic_umbrella" in active:
				display_name = "Magnetosphere Online"
			else:
				display_name = "Warming Begins"
		3:
			display_name = "First Liquid Water"
		4:
			display_name = "Emergent Biosphere"
		5:
			display_name = "Living World"

	return display_name


func get_current_phase_description() -> String:
	# Narrator voice, one sentence, reflecting current phase and active choices.
	var mars_state: Dictionary = GameState.planets.get("mars", {})
	var phase: int = int(mars_state.get("terraforming_phase", 0))
	var active: Array[String] = get_active_choices()
	var description: String = "Mars is between defined phases, and we are adapting to conditions our models did not fully predict."

	match phase:
		0:
			description = "We map cold dust and stubborn ice, choosing where to spend decades for a first irreversible gain."
		1:
			description = "We are seeding pressure and heat together, building a margin where instruments once showed only loss."
		2:
			if "mars_polar_detonation" in active:
				description = "We accepted a violent shortcut, and now we manage a warming sky under a long radiation shadow."
			elif "mars_orbital_mirrors" in active:
				description = "Our mirror fields are lifting temperatures year by year, turning patience into measurable climate shift."
			elif "mars_magnetic_umbrella" in active:
				description = "With an artificial magnetosphere online, we finally hold onto the atmosphere we worked to create."
			else:
				description = "We are crossing from experiments to planetary engineering, and each year leaves a visible mark."
		3:
			description = "Liquid water appears in stable pockets, and settlement planning changes from survival to permanence."
		4:
			description = "Hardy ecologies are taking hold, and we are learning to guide life without pretending we can command it."
		5:
			description = "Mars is now a living world in progress, and we carry the responsibility of every system we awakened."

	return description


func is_unlocked() -> bool:
	return "mercury_phase_2_complete" in GameState.completed_techs


func is_dome_colonisation_blocked() -> bool:
	# Returns true if polar detonation radiation window has not yet cleared.
	return (
		GameState.mercury_radiation_clear_year > 0.0
		and GameState.game_year < GameState.mercury_radiation_clear_year
	)


func get_radiation_clear_year() -> float:
	return GameState.mercury_radiation_clear_year
