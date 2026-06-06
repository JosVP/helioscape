class_name TerraformingSystem
extends Node

# Terraforming is driven by additive choices, not exclusive paths: a planet can run
# multiple choices in parallel (for example Mars mirrors plus magnetic umbrella), and
# each active choice contributes its own rates every year. Only physically irreversible
# conflicts are stored in locked_out_choices (for example polar detonation temporarily
# blocking early domes). The legacy active_path concept does not exist in this system.

const CHOICE_RATES: Dictionary = {
	"mars":
	{
		"mars_polar_detonation":
		{"pressure_rate": 0.0002, "temp_rate": 0.5, "phase_contribution": 0.4},
		"mars_orbital_mirrors":
		{"pressure_rate": 0.00012, "temp_rate": 0.22, "phase_contribution": 0.18},
		"mars_magnetic_umbrella":
		{"pressure_rate": 0.00018, "temp_rate": 0.04, "phase_contribution": 0.16},
		"mars_aerogel_domes":
		{"pressure_rate": 0.00005, "temp_rate": 0.08, "phase_contribution": 0.08},
		"mars_aerogel_domes_early":
		{"pressure_rate": 0.00007, "temp_rate": 0.09, "phase_contribution": 0.1},
		"mars_biological_seeding":
		{"pressure_rate": 0.00004, "temp_rate": 0.02, "phase_contribution": 0.11},
		"mars_comet_water_delivery":
		{"pressure_rate": 0.00009, "temp_rate": 0.06, "phase_contribution": 0.2}
	},
	"venus":
	{
		"venus_orbital_shade_mirror":
		{"pressure_rate": -0.55, "temp_rate": -3.2, "phase_contribution": 0.15},
		"venus_carbonate_sequestration":
		{"pressure_rate": -0.35, "temp_rate": -1.25, "phase_contribution": 0.17},
		"venus_europa_impact":
		{"pressure_rate": -0.12, "temp_rate": -0.6, "phase_contribution": 0.28},
		"venus_sky_cities":
		{"pressure_rate": -0.03, "temp_rate": -0.22, "phase_contribution": 0.08},
		"venus_sky_city_descent":
		{"pressure_rate": -0.05, "temp_rate": -0.4, "phase_contribution": 0.12}
	}
}

const CHOICE_CONFLICTS: Dictionary = {"mars_polar_detonation": ["mars_aerogel_domes_early"]}


func _ready() -> void:
	add_to_group("terraforming_system")
	_initialise_planet_states()
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.tech_node_unlocked.connect(_on_tech_unlocked)


func _initialise_planet_states() -> void:
	var all_planets: Dictionary = DataManager.get_all_planets()
	for planet_id_variant: Variant in all_planets.keys():
		var planet_id: String = str(planet_id_variant)

		# Only Earth starts initialised. All other planets initialise when their
		# unlock tech is completed, so locked planets never appear in GameState.planets
		# and _is_planet_unlocked() returns false correctly.
		var planet_data: Dictionary = all_planets.get(planet_id, {})
		var unlock_condition: String = str(planet_data.get("unlock_condition", ""))
		if (
			unlock_condition != ""
			and unlock_condition != "null"
			and not GameState.completed_techs.has(unlock_condition)
		):
			continue

		_initialise_single_planet(planet_id)


func _initialise_single_planet(planet_id: String) -> void:
	if GameState.planets.has(planet_id):
		return

	var planet_data: Dictionary = DataManager.get_planet(planet_id)
	var initial_state: Dictionary = planet_data.get("initial_state", {})
	var visual_data: Dictionary = planet_data.get("visual", {})

	GameState.planets[planet_id] = {
		"terraforming_phase": int(initial_state.get("terraforming_phase", 0)),
		"terraforming_progress": float(initial_state.get("terraforming_progress", 0.0)),
		"terraforming_choices": {},
		"locked_out_choices": [],
		"population": int(initial_state.get("population", 0)),
		"atmosphere_pressure": float(initial_state.get("atmosphere_pressure", 0.0)),
		"temperature_celsius": float(initial_state.get("temperature_celsius", 0.0)),
		"axis_spin_speed": _extract_axis_spin_speed(visual_data),
		"cloud_rotation_speed": float(visual_data.get("cloud_rotation_speed", 0.0)),
		"visual_params": {}
	}

	_emit_visual_params(planet_id)


func _on_year_ticked(year: float) -> void:
	for planet_id_variant: Variant in GameState.planets.keys():
		_tick_planet(String(planet_id_variant), year)


func _tick_planet(planet_id: String, year: float) -> void:
	if not GameState.planets.has(planet_id):
		return

	var planet: Dictionary = GameState.planets[planet_id]
	var choices: Dictionary = planet.get("terraforming_choices", {})

	var total_phase_contribution: float = 0.0
	var pressure_delta: float = 0.0
	var temp_delta: float = 0.0

	for choice_id_variant: Variant in choices.keys():
		var choice_id: String = String(choice_id_variant)
		var choice_state: Dictionary = choices.get(choice_id, {})
		if not bool(choice_state.get("active", false)):
			continue

		var per_planet_rates: Dictionary = CHOICE_RATES.get(planet_id, {})
		var rates: Dictionary = per_planet_rates.get(choice_id, {})
		total_phase_contribution += float(rates.get("phase_contribution", 0.0))
		pressure_delta += float(rates.get("pressure_rate", 0.0))
		temp_delta += float(rates.get("temp_rate", 0.0))

	planet["atmosphere_pressure"] = float(planet.get("atmosphere_pressure", 0.0)) + pressure_delta
	planet["temperature_celsius"] = float(planet.get("temperature_celsius", 0.0)) + temp_delta
	planet["terraforming_progress"] = (
		float(planet.get("terraforming_progress", 0.0)) + total_phase_contribution
	)

	GameState.planets[planet_id] = planet

	if float(planet.get("terraforming_progress", 0.0)) >= 1.0:
		_advance_phase(planet_id)

	if planet_id == "mars" and GameState.mercury_radiation_clear_year > 0.0:
		if year >= GameState.mercury_radiation_clear_year:
			GameState.mercury_radiation_clear_year = 0.0
			var locked_out: Array = GameState.planets["mars"].get("locked_out_choices", [])
			locked_out.erase("mars_aerogel_domes_early")
			GameState.planets["mars"]["locked_out_choices"] = locked_out
			GameState.culture_event_queue.append("ce_mars_radiation_cleared")

	_emit_visual_params(planet_id)


func _advance_phase(planet_id: String) -> void:
	if not GameState.planets.has(planet_id):
		return

	var planet: Dictionary = GameState.planets[planet_id]
	planet["terraforming_phase"] = int(planet.get("terraforming_phase", 0)) + 1
	planet["terraforming_progress"] = 0.0
	GameState.planets[planet_id] = planet

	var new_phase: int = int(planet.get("terraforming_phase", 0))
	var event_id: String = _get_phase_event_id(planet_id, new_phase)
	EventBus.terraforming_phase_changed.emit(planet_id, new_phase)
	GameState.culture_event_queue.append(event_id)
	EventBus.culture_event_triggered.emit(event_id)


func _emit_visual_params(planet_id: String) -> void:
	if not GameState.planets.has(planet_id):
		return

	var planet: Dictionary = GameState.planets[planet_id]
	var phase: int = int(planet.get("terraforming_phase", 0))
	var pressure: float = float(planet.get("atmosphere_pressure", 0.0))
	var temperature: float = float(planet.get("temperature_celsius", 0.0))

	var params: Dictionary = {}

	match planet_id:
		"mars":
			var lava_hue_shift: float = _mars_lava_hue_shift(planet)
			params["water_growth_radius"] = _mars_water_radius(pressure, phase)
			params["water_opacity"] = clampf(float(phase - 1) / 3.0, 0.0, 1.0)
			params["green_growth_radius"] = _mars_green_radius(pressure, phase)
			params["green_opacity"] = clampf(float(phase - 2) / 2.0, 0.0, 1.0)
			params["lava_growth_radius"] = _mars_lava_growth_radius(planet)
			params["lava_opacity"] = _mars_lava_opacity(planet)
			params["lava_hue_shift"] = lava_hue_shift
			params["cloud_opacity"] = clampf(pressure / 0.5, 0.0, 0.7)
			params["atmosphere_density"] = clampf(pressure / 1.0, 0.05, 0.35)
			params["atmosphere_color"] = _mars_atmosphere_color(pressure)
			params["cloud_rotation_speed"] = clampf(pressure / 0.3, 0.0, 0.001)
		"venus":
			params["atmosphere_density"] = clampf(pressure / 92.0, 0.2, 0.95)
			params["atmosphere_color"] = _venus_atmosphere_color(pressure, temperature)
			params["water_opacity"] = clampf((temperature - 0.0) / -50.0, 0.0, 1.0)
			params["cloud_rotation_speed"] = clampf(pressure / 92.0 * 0.012, 0.004, 0.012)
			params["axis_spin_speed"] = 0.9 if GameState.europa_impacted else 0.004
		"earth":
			params["city_lights_intensity"] = clampf(GameState.kardashev_level / 1.5, 0.0, 1.0)
		_:
			pass

	if params.has("cloud_rotation_speed"):
		planet["cloud_rotation_speed"] = float(params["cloud_rotation_speed"])
	if params.has("axis_spin_speed"):
		planet["axis_spin_speed"] = float(params["axis_spin_speed"])
	if params.has("lava_hue_shift"):
		planet["lava_hue_shift"] = float(params["lava_hue_shift"])

	planet["visual_params"] = params
	GameState.planets[planet_id] = planet
	EventBus.planet_visual_params_changed.emit(planet_id, params)


func apply_choice(planet_id: String, choice_id: String, permanent: bool) -> void:
	if not GameState.planets.has(planet_id):
		return

	var planet: Dictionary = GameState.planets[planet_id]
	var choices: Dictionary = planet.get("terraforming_choices", {})
	var locked_out_choices: Array = planet.get("locked_out_choices", [])

	if locked_out_choices.has(choice_id):
		push_warning("Attempted to apply locked-out choice: %s" % choice_id)
		return

	choices[choice_id] = {
		"active": true, "started_year": GameState.game_year, "permanent": permanent
	}
	planet["terraforming_choices"] = choices

	var conflict_targets: Array = CHOICE_CONFLICTS.get(choice_id, [])
	for conflict_choice_variant: Variant in conflict_targets:
		var conflict_choice_id: String = String(conflict_choice_variant)
		if not locked_out_choices.has(conflict_choice_id):
			locked_out_choices.append(conflict_choice_id)
	planet["locked_out_choices"] = locked_out_choices

	if choice_id == "mars_polar_detonation":
		# Polar detonation creates a 40-year radiation window that blocks early
		# dome colonisation; this is a permanent physical consequence in-world.
		GameState.mercury_radiation_clear_year = GameState.game_year + 40.0

	if choice_id == "venus_europa_impact":
		# The impactor uses long gravity-assist transfer chains, so arrival is set
		# now but the actual event fires decades later in CultureEventSystem.
		GameState.europa_mission_authorised = true
		GameState.europa_impact_year = GameState.game_year + randf_range(50.0, 70.0)

	GameState.planets[planet_id] = planet
	_emit_visual_params(planet_id)
	EventBus.terraforming_choice_applied.emit(planet_id, choice_id)


func _on_tech_unlocked(_planet_id: String, node_id: String) -> void:
	# When a tech is unlocked, check if it is an unlock_condition for any planet.
	# If so, initialise that planet's state now.
	var all_planets: Dictionary = DataManager.get_all_planets()
	for planet_id_variant: Variant in all_planets.keys():
		var pid: String = str(planet_id_variant)
		if GameState.planets.has(pid):
			continue
		var planet_data: Dictionary = DataManager.get_planet(pid)
		var unlock_condition: String = str(planet_data.get("unlock_condition", ""))
		if unlock_condition != "null" and unlock_condition == node_id:
			_initialise_single_planet(pid)


func _get_phase_event_id(planet_id: String, phase: int) -> String:
	return "ce_%s_phase_%d" % [planet_id, phase]


func _mars_water_radius(pressure: float, _phase: int) -> float:
	return clampf((pressure - 0.01) / 0.4 * 0.6, 0.0, 0.6)


func _mars_green_radius(pressure: float, _phase: int) -> float:
	return clampf((pressure - 0.1) / 0.5 * 0.5, 0.0, 0.5)


func _mars_lava_growth_radius(planet: Dictionary) -> float:
	var choices: Dictionary = planet.get("terraforming_choices", {})
	var detonation: Dictionary = choices.get("mars_polar_detonation", {})
	if not bool(detonation.get("active", false)):
		return 0.0
	var years_since: float = GameState.game_year - float(detonation.get("started_year", 0.0))
	return clampf(years_since / 35.0 * 0.55, 0.0, 0.55)


func _mars_lava_opacity(planet: Dictionary) -> float:
	var choices: Dictionary = planet.get("terraforming_choices", {})
	var detonation_active: bool = (
		choices.has("mars_polar_detonation")
		and bool(choices["mars_polar_detonation"].get("active", false))
	)
	# Lava opacity peaks soon after detonation then declines as the crust cools.
	if not detonation_active:
		return 0.0
	var years_since: float = (
		GameState.game_year - float(choices["mars_polar_detonation"].get("started_year", 0.0))
	)
	return clampf(1.0 - (years_since / 80.0), 0.0, 1.0)


func _mars_lava_hue_shift(planet: Dictionary) -> float:
	var choices: Dictionary = planet.get("terraforming_choices", {})
	var detonation: Dictionary = choices.get("mars_polar_detonation", {})
	if not bool(detonation.get("active", false)):
		return 1.0
	var years_since: float = GameState.game_year - float(detonation.get("started_year", 0.0))
	return clampf(years_since / 80.0, 0.0, 1.0)


func _mars_atmosphere_color(pressure: float) -> Color:
	return Color(0.8, 0.4, 0.27).lerp(Color(0.27, 0.53, 1.0), clampf(pressure / 0.8, 0.0, 1.0))


func _venus_atmosphere_color(pressure: float, _temperature: float) -> Color:
	var hot_color: Color = Color(1.0, 0.8, 0.27)
	var cool_color: Color = Color(0.67, 0.87, 1.0)
	return hot_color.lerp(cool_color, clampf(1.0 - (pressure / 92.0), 0.0, 1.0))


func _extract_axis_spin_speed(visual_data: Dictionary) -> float:
	var axis_spin: Variant = visual_data.get("axis_spin_speed", 1.0)
	if axis_spin is Dictionary:
		return float(axis_spin.get("initial", 1.0))
	return float(axis_spin)
