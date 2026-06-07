# PlanetOrbit.gd
# Represents a single planet's orbit ring in the 3D orrery.
#
# This node is a fixed Node3D parented under SolarSystemView — it does NOT move
# with the planet sphere. The planet sphere (PlanetView.tscn) moves along the ring's
# path via SolarSystemView._update_planet_position(). PlanetOrbit only owns the ring
# mesh and the click detection on the orbital path itself, so the player can select a
# planet by clicking its orbit ring even when the planet sphere is elsewhere on the path.

class_name PlanetOrbit
extends Node3D

# Colours for unlocked and locked orbit rings.
const COLOR_UNLOCKED: Color = Color(1.0, 1.0, 1.0, 0.35)
const COLOR_LOCKED: Color = Color(1.0, 1.0, 1.0, 0.18)

# Torus geometry: very thin ring (inner ≈ outer) lying flat in the XZ plane.
const RING_HALF_WIDTH: float = 0.04  # half the torus tube radius
const RING_SEGMENTS: int = 64  # smoothness of the circle
const RING_TUBE_SEGMENTS: int = 8  # smoothness of the tube cross-section

@export var planet_id: String = ""
@export var orbit_radius: float = 9.0
@export var is_locked: bool = false

# Child node refs cached in _ready.
var _mesh_instance: MeshInstance3D
var _ring_material: StandardMaterial3D
var _click_area: Area3D


func _ready() -> void:
	_build_ring_mesh()
	_build_click_area()
	_apply_lock_visual()


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------


func _build_ring_mesh() -> void:
	_mesh_instance = MeshInstance3D.new()
	_mesh_instance.name = "RingMesh"
	add_child(_mesh_instance)

	var torus: TorusMesh = TorusMesh.new()
	torus.inner_radius = orbit_radius - RING_HALF_WIDTH
	torus.outer_radius = orbit_radius + RING_HALF_WIDTH
	torus.rings = RING_SEGMENTS
	torus.ring_segments = RING_TUBE_SEGMENTS
	_mesh_instance.mesh = torus

	# TorusMesh is vertical by default — rotate 90° so it lies flat in the XZ plane.
	_mesh_instance.rotation_degrees = Vector3(90.0, 0.0, 0.0)

	_ring_material = StandardMaterial3D.new()
	_ring_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_ring_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_ring_material.albedo_color = COLOR_UNLOCKED
	_mesh_instance.set_surface_override_material(0, _ring_material)


func _build_click_area() -> void:
	# A thin torus-shaped collision is difficult to author at runtime; a flat cylinder
	# (disc) at the orbit radius gives a reasonable approximation without requiring
	# a ConcavePolygonShape3D. We use a ring of small SphereShapes distributed along
	# the orbit path for accurate click detection.
	_click_area = Area3D.new()
	_click_area.name = "ClickArea"
	_click_area.input_ray_pickable = true
	add_child(_click_area)

	# 16 sphere shapes distributed evenly around the ring give enough coverage.
	const CLICK_SPHERE_COUNT: int = 16
	const CLICK_SPHERE_RADIUS: float = 0.35  # generous hit radius for the ring
	for i: int in CLICK_SPHERE_COUNT:
		var angle: float = (TAU / CLICK_SPHERE_COUNT) * i
		var sphere_pos: Vector3 = Vector3(cos(angle) * orbit_radius, 0.0, sin(angle) * orbit_radius)

		var collision_shape: CollisionShape3D = CollisionShape3D.new()
		var sphere: SphereShape3D = SphereShape3D.new()
		sphere.radius = CLICK_SPHERE_RADIUS
		collision_shape.shape = sphere
		collision_shape.position = sphere_pos
		_click_area.add_child(collision_shape)

	_click_area.input_event.connect(_on_orbit_click_area_input)


# ---------------------------------------------------------------------------
# Visual state
# ---------------------------------------------------------------------------


func _apply_lock_visual() -> void:
	if _ring_material == null:
		return
	_ring_material.albedo_color = COLOR_LOCKED if is_locked else COLOR_UNLOCKED


# Call this from SolarSystemView._on_year_ticked to refresh lock state.
func set_locked(locked: bool) -> void:
	if is_locked == locked:
		return
	is_locked = locked
	_apply_lock_visual()


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------


func _on_orbit_click_area_input(
	_camera_node: Node, event: InputEvent, _position: Vector3, _normal: Vector3, _shape_idx: int
) -> void:
	# Clicking the orbit ring is equivalent to clicking the planet sphere directly.
	# SolarSystemView listens to planet_selected and handles the zoom.
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if planet_id.is_empty():
			return
		EventBus.planet_selected.emit(planet_id)
