extends Node

const MERCURY_MAP_SCENE_PATH: String = "res://scenes/mercury/MercuryMap.tscn"

# Cached references to shader materials so DysonSystem can drive them.
var _dyson_system: Node = null


func _ready() -> void:
	# Wire DysonSystem shader references before the first tick.
	_dyson_system = get_node_or_null("Systems/DysonSystem")
	_wire_dyson_shaders()

	# Auto-unlock the starter tech so the player can begin immediately.
	# earth_launch_mercury_mission has rp_cost 0 and duration_years 0 — it is instant.
	var tech_system: Node = get_node_or_null("Systems/TechTreeSystem")
	if tech_system != null and tech_system.has_method("unlock_tech"):
		tech_system.call("unlock_tech", "earth", "earth_launch_mercury_mission")

	EventBus.planet_selected.connect(_on_planet_selected)


func _on_planet_selected(planet_id: String) -> void:
	# Mercury is the only planet handled with a dedicated map scene.
	# Other planets open inside PlanetPanel without a scene change.
	if planet_id == "mercury":
		get_tree().change_scene_to_file(MERCURY_MAP_SCENE_PATH)


func _wire_dyson_shaders() -> void:
	if _dyson_system == null:
		return

	# Sun material — the Sun uses a StandardMaterial3D (emissive), no sun_dim_factor needed.
	# When a proper sun shader is added, wire it here via set_sun_material().

	# DysonSwarm material — set on the DysonSwarm MeshInstance3D's surface override.
	var dyson_node: MeshInstance3D = (
		get_node_or_null("SolarSystemViewportContainer/SolarSystemViewport/SolarSystem/DysonSwarm")
		as MeshInstance3D
	)
	if dyson_node != null:
		var dyson_mat: Variant = dyson_node.get_surface_override_material(0)
		if dyson_mat is ShaderMaterial:
			_dyson_system.call("set_dyson_sphere_material", dyson_mat)
