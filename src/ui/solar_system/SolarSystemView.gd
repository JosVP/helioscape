# SolarSystemView.gd
# Root script for SolarSystem.tscn — the 3D orrery scene.
#
# Camera design: the orrery uses a fixed isometric-style 3D Camera3D positioned
# above the ecliptic plane, angled down toward the origin (Sun). Players can never
# pan or tilt the camera. Orbit paths are visible as thin 3D rings (PlanetOrbit nodes).
# Planets are rendered at a larger-than-realistic scale so they are easy click targets.
# The visual orbit animation runs in _process(delta), completely decoupled from game
# time — it looks smooth regardless of game speed or pause state.

class_name SolarSystemView
extends Node3D

# Fixed camera transform for the overview position.
# Adjust these values to match what looks right in the editor.
const OVERVIEW_CAMERA_POSITION: Vector3 = Vector3(0.0, 22.0, 18.0)
const OVERVIEW_CAMERA_LOOK_AT: Vector3 = Vector3.ZERO

# How far from a planet the camera stops when zoomed in.
# The offset keeps the planet in the lower-centre of the view (~70% viewport height).
const ZOOM_CAMERA_OFFSET: Vector3 = Vector3(0.0, 4.0, 6.0)

# Path to the PlanetView scene, instantiated once per planet.
const PLANET_VIEW_SCENE: String = "res://scenes/planets/PlanetView.tscn"

# planet_id -> Node3D (PlanetView.tscn instance, the moving sphere).
var planet_nodes: Dictionary = {}

# Visual orbit radii in 3D units — not realistic, tuned for readability.
var orbit_radii: Dictionary = {
	"mercury": 4.0,
	"venus": 6.5,
	"earth": 9.0,
	"mars": 12.0,
}

# Visual orbit period in real seconds — drives the continuous animation in _process.
var orbital_periods: Dictionary = {
	"mercury": 12.0,
	"venus": 20.0,
	"earth": 30.0,
	"mars": 50.0,
}

# Current orbit angle (radians) per planet, advanced each frame in _process.
var planet_angles: Dictionary = {}

# "" = overview position; planet_id = camera is zoomed toward that planet.
var zoomed_planet: String = ""

# Reference to the active camera tween so it can be killed before starting a new one.
var zoom_tween: Tween

# Camera3D positioned at a fixed angle above the ecliptic plane, looking at the origin (Sun).
@onready var camera: Camera3D = $Camera3D


func _ready() -> void:
	_setup_orrery_environment()
	_spawn_planets()
	_spawn_orbit_rings()
	_spawn_grid()
	EventBus.planet_selected.connect(_on_planet_selected)
	EventBus.game_year_ticked.connect(_on_year_ticked)


func _process(delta: float) -> void:
	# Advance every planet's visual orbit angle continuously, independent of game speed.
	# This runs even when the game is paused so the orrery always feels alive.
	for pid in planet_nodes:
		if planet_angles.has(pid):
			var period: float = orbital_periods.get(pid, 30.0)
			planet_angles[pid] += (TAU / period) * delta
			_update_planet_position(pid)


# ---------------------------------------------------------------------------
# Spawn helpers
# ---------------------------------------------------------------------------


func _spawn_planets() -> void:
	# Each PlanetView.tscn contains: PlanetSphere (MeshInstance3D), AtmosphereShell
	# (MeshInstance3D), ClickArea (Area3D with SphereShape3D — slightly larger than the
	# visual sphere for easier selection), and PlanetVisual.gd on the root.
	var planet_view_packed: PackedScene = load(PLANET_VIEW_SCENE)
	if planet_view_packed == null:
		push_warning(
			(
				"SolarSystemView: could not load PlanetView scene at %s — using code fallback."
				% PLANET_VIEW_SCENE
			)
		)

	var all_planets: Dictionary = DataManager.get_all_planets()

	# Stagger starting angles so planets don't begin piled up on the same side.
	var stagger_step: float = TAU / max(all_planets.size(), 1)
	var stagger_index: int = 0

	for pid in all_planets:
		if not orbit_radii.has(pid):
			# Planet not represented in the orrery (e.g. Moon) — skip.
			stagger_index += 1
			continue

		var planet_instance: Node3D
		if planet_view_packed != null:
			planet_instance = planet_view_packed.instantiate()
		else:
			# Code fallback: a simple sphere + click area so the orrery works
			# even before the scene file is registered in Godot's filesystem.
			planet_instance = _spawn_planet_fallback(pid)

		# Set planet_id BEFORE add_child so PlanetVisual._ready() uses the correct id.
		if "planet_id" in planet_instance:
			planet_instance.planet_id = pid

		add_child(planet_instance)

		# Staggered starting angle.
		var start_angle: float = stagger_step * stagger_index
		planet_angles[pid] = start_angle
		planet_nodes[pid] = planet_instance
		_update_planet_position(pid)

		# Connect the ClickArea's input_event signal for mouse click detection.
		# In PlanetView.tscn the ClickArea is nested under PlanetSphere.
		var click_area: Area3D = planet_instance.get_node_or_null("PlanetSphere/ClickArea")
		if click_area == null:
			# Fallback: check direct child for scenes with a flat hierarchy.
			click_area = planet_instance.get_node_or_null("ClickArea")
		if click_area != null:
			# Capture planet_id in a local var so the lambda closes over the correct value.
			var captured_pid: String = pid
			click_area.input_event.connect(
				func(
					_camera_node: Node,
					event: InputEvent,
					_position: Vector3,
					_normal: Vector3,
					_shape_idx: int
				) -> void:
					if (
						event is InputEventMouseButton
						and event.pressed
						and event.button_index == MOUSE_BUTTON_LEFT
					):
						_on_planet_clicked(captured_pid)
			)
		else:
			push_warning("SolarSystemView: PlanetView for '%s' has no ClickArea child." % pid)

		stagger_index += 1


func _spawn_planet_fallback(pid: String) -> Node3D:
	# Builds a minimal planet node in pure code when PlanetView.tscn cannot be loaded.
	# Produces a coloured sphere + a click-detectable Area3D so the orrery is functional.
	var root: Node3D = Node3D.new()
	root.name = "PlanetFallback_" + pid

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "PlanetSphere"
	var sphere: SphereMesh = SphereMesh.new()
	sphere.radius = 0.5
	sphere.height = 1.0
	mesh_instance.mesh = sphere

	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	# Assign a distinct colour per planet for easy identification.
	var colours: Dictionary = {
		"earth": Color(0.2, 0.5, 0.9),
		"mars": Color(0.8, 0.3, 0.1),
		"venus": Color(0.9, 0.7, 0.2),
		"mercury": Color(0.6, 0.6, 0.6),
	}
	mat.albedo_color = colours.get(pid, Color(0.7, 0.7, 0.7))
	mesh_instance.set_surface_override_material(0, mat)
	root.add_child(mesh_instance)

	var click_area: Area3D = Area3D.new()
	click_area.name = "ClickArea"
	click_area.input_ray_pickable = true
	var col_shape: CollisionShape3D = CollisionShape3D.new()
	var shape: SphereShape3D = SphereShape3D.new()
	shape.radius = 0.7
	col_shape.shape = shape
	click_area.add_child(col_shape)
	root.add_child(click_area)

	return root


func _spawn_orbit_rings() -> void:
	# Instantiate a PlanetOrbit node for each planet that has an orbit radius defined.
	# PlanetOrbit is a fixed Node3D (it does not move with the planet) parented here.
	# A simple approach: MeshInstance3D with a TorusMesh, very thin
	# (inner_radius ≈ outer_radius), rotated flat in the XZ plane.
	# The ring is also clickable via its own Area3D so the player can click the orbital
	# path even when the planet sphere is elsewhere on the ring.
	const PLANET_ORBIT_SCENE: String = "res://src/ui/solar_system/PlanetOrbit.tscn"
	var orbit_packed: PackedScene = load(PLANET_ORBIT_SCENE)

	for pid in orbit_radii:
		var radius: float = orbit_radii[pid]
		var is_locked: bool = not GameState.planets.has(pid)

		if orbit_packed != null:
			# Preferred: scene-based PlanetOrbit node with PlanetOrbit.gd.
			# Properties MUST be set before add_child so _ready() uses the correct values.
			var orbit_node: Node3D = orbit_packed.instantiate()
			if "planet_id" in orbit_node:
				orbit_node.planet_id = pid
			if "orbit_radius" in orbit_node:
				orbit_node.orbit_radius = radius
			if "is_locked" in orbit_node:
				orbit_node.is_locked = is_locked
			add_child(orbit_node)
		else:
			# Fallback: create a bare MeshInstance3D torus ring in code.
			# PlanetOrbit.tscn was not found — this gives a visual placeholder.
			_spawn_orbit_ring_fallback(pid, radius, is_locked)


func _spawn_orbit_ring_fallback(pid: String, radius: float, is_locked: bool) -> void:
	# Programmatic fallback ring: a TorusMesh lying flat in the XZ plane.
	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "OrbitRing_" + pid
	add_child(mesh_instance)

	var torus: TorusMesh = TorusMesh.new()
	torus.inner_radius = radius - 0.04
	torus.outer_radius = radius + 0.04
	torus.rings = 64
	torus.ring_segments = 8
	mesh_instance.mesh = torus

	# Rotate so the torus lies flat in the XZ plane (TorusMesh is vertical by default).
	mesh_instance.rotation_degrees = Vector3(90.0, 0.0, 0.0)

	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(1.0, 1.0, 1.0, 0.18 if is_locked else 0.35)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh_instance.set_surface_override_material(0, mat)


# ---------------------------------------------------------------------------
# Environment + background
# ---------------------------------------------------------------------------


func _setup_orrery_environment() -> void:
	# Dark navy background with a slight vignette gradient.
	# We use WorldEnvironment for the base colour and a large background sphere
	# for the radial darkening effect (darker at poles/edges, lighter at centre).
	var env_node: WorldEnvironment = WorldEnvironment.new()
	env_node.name = "OrreryEnvironment"

	var env: Environment = Environment.new()
	env.background_mode = Environment.BG_COLOR
	# Deep space navy-black — slightly blue-tinted so it reads as "space" not plain black.
	env.background_color = Color(0.012, 0.022, 0.055)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.05, 0.07, 0.12)
	env.ambient_light_energy = 0.15
	env_node.environment = env
	add_child(env_node)

	# Large inverted-normals sphere for a radial vignette: center is slightly lighter,
	# edges fade to near-black. Placed at radius 60 so it is always behind all other geometry.
	var bg_mesh: MeshInstance3D = MeshInstance3D.new()
	bg_mesh.name = "BackgroundSphere"
	var sphere: SphereMesh = SphereMesh.new()
	sphere.radius = 60.0
	sphere.height = 120.0
	sphere.radial_segments = 32
	sphere.rings = 16
	# flip_faces makes the sphere visible from the inside.
	sphere.flip_faces = true
	bg_mesh.mesh = sphere

	var bg_mat: StandardMaterial3D = StandardMaterial3D.new()
	bg_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	# Vertex color from shader — use a gradient via emission.
	# We tint from dark navy at the equator to near-black at the poles.
	bg_mat.albedo_color = Color(0.015, 0.028, 0.07)
	bg_mat.emission_enabled = true
	bg_mat.emission = Color(0.008, 0.014, 0.04)
	bg_mat.emission_energy_multiplier = 1.0
	bg_mesh.set_surface_override_material(0, bg_mat)
	add_child(bg_mesh)


# ---------------------------------------------------------------------------
# Grid
# ---------------------------------------------------------------------------


func _spawn_grid() -> void:
	# Flat grid on the XZ plane (y = -0.15) representing the orbital ecliptic floor.
	# Lines run from -GRID_EXTENT to +GRID_EXTENT with GRID_STEP spacing.
	const GRID_EXTENT: float = 16.0
	const GRID_STEP: float = 4.0
	const GRID_Y: float = -0.15
	const LINE_HALF_W: float = 0.025
	const LINE_HALF_H: float = 0.01

	var grid_root: Node3D = Node3D.new()
	grid_root.name = "OrreryGrid"
	add_child(grid_root)

	var grid_mat: StandardMaterial3D = StandardMaterial3D.new()
	grid_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	grid_mat.albedo_color = Color(0.18, 0.25, 0.45, 0.28)
	grid_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA

	var step: float = GRID_STEP
	var pos: float = -GRID_EXTENT
	while pos <= GRID_EXTENT + 0.001:
		# Line along X axis at z = pos.
		var hline: MeshInstance3D = MeshInstance3D.new()
		var hbox: BoxMesh = BoxMesh.new()
		hbox.size = Vector3(GRID_EXTENT * 2.0, LINE_HALF_H * 2.0, LINE_HALF_W * 2.0)
		hline.mesh = hbox
		hline.position = Vector3(0.0, GRID_Y, pos)
		hline.set_surface_override_material(0, grid_mat)
		grid_root.add_child(hline)

		# Line along Z axis at x = pos.
		var vline: MeshInstance3D = MeshInstance3D.new()
		var vbox: BoxMesh = BoxMesh.new()
		vbox.size = Vector3(LINE_HALF_W * 2.0, LINE_HALF_H * 2.0, GRID_EXTENT * 2.0)
		vline.mesh = vbox
		vline.position = Vector3(pos, GRID_Y, 0.0)
		vline.set_surface_override_material(0, grid_mat)
		grid_root.add_child(vline)

		pos += step


# ---------------------------------------------------------------------------
# Orbit position
# ---------------------------------------------------------------------------


func _update_planet_position(pid: String) -> void:
	if not planet_nodes.has(pid):
		return
	var radius: float = orbit_radii.get(pid, 9.0)
	var angle: float = planet_angles.get(pid, 0.0)
	planet_nodes[pid].position = Vector3(cos(angle) * radius, 0.0, sin(angle) * radius)


# ---------------------------------------------------------------------------
# Click handling
# ---------------------------------------------------------------------------


func _on_planet_clicked(pid: String) -> void:
	if zoomed_planet == pid:
		return  # already zoomed — no action needed
	_zoom_to_planet(pid)


# ---------------------------------------------------------------------------
# Camera zoom
# ---------------------------------------------------------------------------


func _zoom_to_planet(pid: String) -> void:
	if not planet_nodes.has(pid):
		push_warning("SolarSystemView: _zoom_to_planet called for unknown planet '%s'" % pid)
		return

	if zoom_tween:
		zoom_tween.kill()

	zoomed_planet = pid
	GameState.orrery_zoomed_planet = pid

	var target_node: Node3D = planet_nodes[pid]

	# Compute the camera target position: offset above and behind the planet so the
	# planet sits in the lower-centre of the viewport (~70% viewport height).
	var target_cam_pos: Vector3 = target_node.position + ZOOM_CAMERA_OFFSET

	zoom_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

	# Tween camera position over 1.2 seconds.
	zoom_tween.tween_property(camera, "position", target_cam_pos, 1.2)

	# Simultaneously tween the camera to look at the planet centre.
	# look_at cannot be tweened directly — drive it via a method tween instead.
	var start_basis: Basis = camera.global_transform.basis
	var planet_world_pos: Vector3 = target_node.global_position
	zoom_tween.parallel().tween_method(
		func(t: float) -> void:
			var interp_pos: Vector3 = camera.global_position
			var look_target: Vector3 = planet_world_pos.lerp(OVERVIEW_CAMERA_LOOK_AT, 1.0 - t)
			camera.look_at(look_target, Vector3.UP),
		0.0,
		1.0,
		1.2
	)

	# After the tween: emit orrery_zoom_requested so PlanetPanel can open.
	zoom_tween.tween_callback(func() -> void: EventBus.orrery_zoom_requested.emit(pid))


func zoom_out() -> void:
	if zoom_tween:
		zoom_tween.kill()

	zoomed_planet = ""
	GameState.orrery_zoomed_planet = ""

	zoom_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	zoom_tween.tween_property(camera, "position", OVERVIEW_CAMERA_POSITION, 1.0)
	zoom_tween.parallel().tween_method(
		func(t: float) -> void: camera.look_at(OVERVIEW_CAMERA_LOOK_AT, Vector3.UP), 0.0, 1.0, 1.0
	)


# ---------------------------------------------------------------------------
# EventBus handlers
# ---------------------------------------------------------------------------


func _on_planet_selected(pid: String) -> void:
	# Triggered from PlanetsPanel (side panel), not from orrery click.
	# Zoom the orrery camera to the selected planet if not already there.
	if pid != zoomed_planet:
		_zoom_to_planet(pid)


func _on_year_ticked(_year: float) -> void:
	# Update the visual dim state of each planet node and orbit ring based on lock status.
	# Locked planets are dimmed by reducing their mesh material's albedo alpha.
	for pid in planet_nodes:
		var is_unlocked: bool = GameState.planets.has(pid)
		var target_alpha: float = 1.0 if is_unlocked else 0.35
		_set_planet_alpha(planet_nodes[pid], target_alpha)


func _set_planet_alpha(planet_node: Node3D, alpha: float) -> void:
	# Node3D has no modulate — walk child MeshInstance3D nodes and set material alpha.
	for child: Node in planet_node.get_children():
		if child is MeshInstance3D:
			var mat: Material = (child as MeshInstance3D).get_surface_override_material(0)
			if mat is StandardMaterial3D:
				var std_mat: StandardMaterial3D = mat as StandardMaterial3D
				std_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
				var col: Color = std_mat.albedo_color
				col.a = alpha
				std_mat.albedo_color = col
			elif mat is ShaderMaterial:
				# ShaderMaterials (PlanetSurface, Atmosphere) don't support simple alpha —
				# just set the node's visibility instead for locked planets.
				planet_node.visible = alpha > 0.0
