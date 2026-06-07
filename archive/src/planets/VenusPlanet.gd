class_name VenusPlanet
extends PlanetBase


func _init() -> void:
	planet_id = "venus"


func get_unlock_condition() -> String:
	return "mercury_phase_2_complete"


# Venus visual layering is atmosphere-driven: the surface texture is rocky gray,
# while the initial yellow-orange look comes from atmosphere_tint plus dense warm
# atmosphere shading. As pressure and temperature fall, TerraformingSystem reduces
# atmosphere tint alpha and shifts atmosphere color toward blue-white. Water only
# appears after cooling and delivery, and the green layer arrives much later.
func get_active_choices() -> Array[String]:
	var choices: Dictionary = GameState.planets.get("venus", {}).get("terraforming_choices", {})
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
			display_name = "Hellworld - 465C, 92 atm"
		1:
			display_name = "Cooling Begins"
		2:
			if "venus_europa_impact" in active:
				display_name = "Spin-Up In Progress"
			elif "venus_orbital_shade_mirror" in active:
				display_name = "Mirror Deployed"
			elif "venus_carbonate_sequestration" in active:
				display_name = "Carbonate Rain"
			else:
				display_name = "Atmospheric Processing"
		3:
			if "venus_sky_cities" in active:
				display_name = "Cloud City Era"
			else:
				display_name = "Surface Accessible"
		4:
			display_name = "Second Earth"

	return display_name


func get_current_phase_description() -> String:
	var venus_state: Dictionary = GameState.planets.get("venus", {})
	var phase: int = int(venus_state.get("terraforming_phase", 0))
	var active: Array[String] = get_active_choices()
	var description: String = "Venus is between defined phases, and we are revising plans as new equilibria emerge."

	match phase:
		0:
			description = "We face a crushing sky and furnace winds, and every mission here begins as an act of restraint."
		1:
			description = "The first cooling trends are small but real, giving us proof that Venus can be negotiated with."
		2:
			if "venus_europa_impact" in active:
				description = "We committed to a century-scale gamble, and Venus now slowly turns toward a gentler day-night rhythm."
			elif "venus_orbital_shade_mirror" in active:
				description = "Our orbital shade is buying us time, lowering the thermal load enough for long-cycle chemistry to matter."
			elif "venus_carbonate_sequestration" in active:
				description = "Carbon is falling out of the sky into stone, and the atmosphere is beginning to surrender its hold."
			else:
				description = "We are processing the atmosphere layer by layer, with progress measured in patience rather than headlines."
		3:
			if "venus_sky_cities" in active:
				description = "Life in the clouds has become routine, a suspended civilisation waiting for the surface to finish changing."
			else:
				description = "We can now touch the surface for sustained work, turning temporary footholds into true settlements."
		4:
			description = "Venus has become a second Earth in trajectory, and we now steward two climates at once."

	return description


func is_unlocked() -> bool:
	return "mercury_phase_2_complete" in GameState.completed_techs


func is_europa_crash_available() -> bool:
	# Europa impact can only be authorised before game year 2133 (year 100 in game time).
	return GameState.game_year < 2133.0 and not GameState.europa_mission_authorised


func get_europa_eta(current_year: float) -> float:
	if not GameState.europa_mission_authorised:
		return 0.0
	return GameState.europa_impact_year - current_year


func get_current_spin_speed() -> float:
	if GameState.europa_impacted:
		return 0.9
	return 0.004
