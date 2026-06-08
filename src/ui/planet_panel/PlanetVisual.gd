class_name PlanetVisual
extends Node3D

# All shader parameters are computed from authoritative planet data in GameState on each
# game_year_ticked update. A 2.0-second Tween (matching the 1x tick interval) smooths
# changes between ticks. On save/load, _apply_params_instant() bypasses Tweening so the
# visual state is immediately consistent with GameState. Long multi-year transitions stay
# correct because values are recomputed each tick from data, while short cosmetic changes
# like cloud UV offset are updated directly without interpolation.

const MAX_SPOT_COUNT: int = 8
const TICK_TRANSITION_SECONDS: float = 2.0
const FLOAT_SURFACE_PARAMS: Array[String] = [
	"water_growth_radius",
	"water_opacity",
	"green_growth_radius",
	"green_opacity",
	"lava_growth_radius",
	"lava_opacity",
	"lava_hue_shift",
	"cloud_opacity",
	"city_lights_intensity"
]

@export var planet_id: String = ""

var _surface_material: ShaderMaterial
var _atmosphere_material: ShaderMaterial
var _planet_mesh: MeshInstance3D


func _ready() -> void:
	# Cache node references with one-level child paths only.
	_planet_mesh = $PlanetSphere
	var atmosphere_shell: MeshInstance3D = $AtmosphereShell

	var surface_material_variant: Variant = _planet_mesh.get_surface_override_material(0)
	if surface_material_variant is ShaderMaterial:
		_surface_material = surface_material_variant
	else:
		push_warning(
			"PlanetVisual(%s): PlanetSphere surface material is not a ShaderMaterial" % planet_id
		)

	var atmosphere_material_variant: Variant = atmosphere_shell.get_surface_override_material(0)
	if atmosphere_material_variant is ShaderMaterial:
		_atmosphere_material = atmosphere_material_variant
	else:
		push_warning(
			"PlanetVisual(%s): AtmosphereShell material is not a ShaderMaterial" % planet_id
		)

	_set_uv_seed_points()
	_apply_base_color()
	_apply_params_instant()

	if not EventBus.game_year_ticked.is_connected(_on_year_ticked):
		EventBus.game_year_ticked.connect(_on_year_ticked)
	if not EventBus.planet_visual_params_changed.is_connected(_on_params_changed):
		EventBus.planet_visual_params_changed.connect(_on_params_changed)
	if (
		EventBus.has_signal("game_loaded")
		and not EventBus.game_loaded.is_connected(_on_game_loaded)
	):
		EventBus.game_loaded.connect(_on_game_loaded)


func _on_game_loaded() -> void:
	_apply_params_instant()


func _on_year_ticked(_year: float) -> void:
	if planet_id.is_empty() or not GameState.planets.has(planet_id):
		return
	if _surface_material == null or _planet_mesh == null:
		return

	var planet_state: Dictionary = GameState.planets.get(planet_id, {})

	var current_offset_variant: Variant = _surface_material.get_shader_parameter("cloud_uv_offset")
	var current_offset: Vector2 = (
		current_offset_variant if current_offset_variant is Vector2 else Vector2.ZERO
	)
	var cloud_speed: float = float(planet_state.get("cloud_rotation_speed", 0.002))
	_surface_material.set_shader_parameter(
		"cloud_uv_offset", current_offset + Vector2(cloud_speed, 0.0)
	)

	var spin_speed: float = float(planet_state.get("axis_spin_speed", 1.0))
	_planet_mesh.rotation_degrees.y += spin_speed * 0.5

	_update_sun_direction()


func _on_params_changed(changed_planet_id: String, params: Dictionary) -> void:
	if changed_planet_id != planet_id:
		return
	if _surface_material == null and _atmosphere_material == null:
		return

	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

	for param_name: String in FLOAT_SURFACE_PARAMS:
		if params.has(param_name) and _surface_material != null:
			_tween_surface_float(
				tween, param_name, float(params.get(param_name, 0.0)), TICK_TRANSITION_SECONDS
			)

	if params.has("atmosphere_density") and _atmosphere_material != null:
		_tween_atmosphere_density(
			tween, float(params.get("atmosphere_density", 0.0)), TICK_TRANSITION_SECONDS
		)

	if params.has("atmosphere_color") and _atmosphere_material != null:
		# Tween as Color directly to avoid channel jumps from discrete updates.
		_tween_atmosphere_color(tween, params.get("atmosphere_color"), TICK_TRANSITION_SECONDS)


func _tween_surface_float(tween: Tween, param_name: String, target: float, duration: float) -> void:
	var current_variant: Variant = _surface_material.get_shader_parameter(param_name)
	var current: float = float(current_variant) if current_variant is float else target
	tween.parallel().tween_method(
		func(v: float) -> void:
			if _surface_material != null:
				_surface_material.set_shader_parameter(param_name, v),
		current,
		target,
		duration
	)


func _tween_atmosphere_density(tween: Tween, target: float, duration: float) -> void:
	var current_variant: Variant = _atmosphere_material.get_shader_parameter("atmosphere_density")
	var current: float = float(current_variant) if current_variant is float else target
	tween.parallel().tween_method(
		func(v: float) -> void:
			if _atmosphere_material != null:
				_atmosphere_material.set_shader_parameter("atmosphere_density", v),
		current,
		target,
		duration
	)


func _tween_atmosphere_color(tween: Tween, target_variant: Variant, duration: float) -> void:
	var current_variant: Variant = _atmosphere_material.get_shader_parameter("atmosphere_color")
	var current_color: Color = current_variant if current_variant is Color else Color.WHITE
	var target_color: Color = _variant_to_color(target_variant, current_color)
	tween.parallel().tween_method(
		func(c: Color) -> void:
			if _atmosphere_material != null:
				_atmosphere_material.set_shader_parameter("atmosphere_color", c),
		current_color,
		target_color,
		duration
	)


func _apply_params_instant() -> void:
	if planet_id.is_empty() or not GameState.planets.has(planet_id):
		return

	var params: Dictionary = GameState.planets.get(planet_id, {}).get("visual_params", {})

	for param_name_variant: Variant in params:
		var param_name: String = String(param_name_variant)
		var value: Variant = params[param_name_variant]

		if param_name == "atmosphere_density" or param_name == "atmosphere_color":
			if _atmosphere_material != null:
				if param_name == "atmosphere_color":
					_atmosphere_material.set_shader_parameter(
						param_name, _variant_to_color(value, Color.WHITE)
					)
				else:
					_atmosphere_material.set_shader_parameter(param_name, float(value))
		elif _surface_material != null:
			_surface_material.set_shader_parameter(param_name, value)

	_update_sun_direction()


func _set_uv_seed_points() -> void:
	if _surface_material == null or planet_id.is_empty():
		return

	var planet_data: Dictionary = DataManager.get_planet(planet_id)
	var visual: Dictionary = planet_data.get("visual", {})

	# PackedVector2Array is the most reliable way to pass vec2 arrays to shader uniforms
	# across Godot 4.x versions; direct Array assignment can fail on some builds.
	_apply_spot_array(
		"water_spots", "water_spot_count", _extract_spots(visual.get("water_spot_uvs", []))
	)
	_apply_spot_array(
		"green_spots", "green_spot_count", _extract_spots(visual.get("green_spot_uvs", []))
	)
	_apply_spot_array(
		"lava_spots", "lava_spot_count", _extract_spots(visual.get("lava_spot_uvs", []))
	)


func _apply_spot_array(
	array_uniform: String, count_uniform: String, spots: PackedVector2Array
) -> void:
	if _surface_material == null:
		return

	var clamped: PackedVector2Array = PackedVector2Array()
	var count: int = mini(spots.size(), MAX_SPOT_COUNT)
	for i: int in range(count):
		clamped.append(spots[i])

	_surface_material.set_shader_parameter(array_uniform, clamped)
	_surface_material.set_shader_parameter(count_uniform, count)


func _extract_spots(raw: Variant) -> PackedVector2Array:
	var result: PackedVector2Array = PackedVector2Array()
	if not (raw is Array):
		return result

	for entry: Variant in raw:
		if result.size() >= MAX_SPOT_COUNT:
			break

		if entry is Array:
			var uv_array: Array = entry
			if uv_array.size() >= 2:
				result.append(Vector2(float(uv_array[0]), float(uv_array[1])))
		elif entry is Dictionary:
			var uv_dict: Dictionary = entry
			if uv_dict.has("x") and uv_dict.has("y"):
				result.append(Vector2(float(uv_dict.get("x", 0.0)), float(uv_dict.get("y", 0.0))))

	return result


func _update_sun_direction() -> void:
	if _surface_material == null or _planet_mesh == null:
		return

	var sun_node: Node3D = _find_sun_node()
	if sun_node == null:
		return

	var direction: Vector3 = sun_node.global_position - _planet_mesh.global_position
	if direction.length() <= 0.0001:
		return

	_surface_material.set_shader_parameter("sun_direction", direction.normalized())


func _find_sun_node() -> Node3D:
	var by_group: Node = get_tree().get_first_node_in_group("sun")
	if by_group is Node3D:
		return by_group

	return _find_sun_node_recursive(get_tree().current_scene)


func _find_sun_node_recursive(node: Node) -> Node3D:
	if node == null:
		return null
	if node is Node3D and node.name == "Sun":
		return node

	for child: Node in node.get_children():
		var found: Node3D = _find_sun_node_recursive(child)
		if found != null:
			return found

	return null


func _variant_to_color(value: Variant, fallback: Color) -> Color:
	if value is Color:
		return value
	if value is String:
		var color_string: String = String(value)
		if Color.html_is_valid(color_string):
			return Color(color_string)
	return fallback


func _apply_base_color() -> void:
	# Reads visual.base_color and visual.atmosphere_* from static planet data so the orrery
	# planet spheres show a distinct colour even before game textures are loaded.
	if _surface_material == null or planet_id.is_empty():
		return

	var planet_data: Dictionary = DataManager.get_planet(planet_id)
	var visual: Dictionary = planet_data.get("visual", {})

	var base_color_str: String = String(visual.get("base_color", ""))
	if not base_color_str.is_empty() and Color.html_is_valid(base_color_str):
		_surface_material.set_shader_parameter("base_color", Color(base_color_str))

	if _atmosphere_material == null:
		return

	var atmos_color_str: String = String(visual.get("atmosphere_color", ""))
	if not atmos_color_str.is_empty() and Color.html_is_valid(atmos_color_str):
		_atmosphere_material.set_shader_parameter("atmosphere_color", Color(atmos_color_str))

	var atmos_density: float = float(visual.get("atmosphere_density_initial", 0.0))
	_atmosphere_material.set_shader_parameter("atmosphere_density", atmos_density)
