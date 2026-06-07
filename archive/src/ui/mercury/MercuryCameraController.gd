class_name MercuryCameraController
extends Camera2D

const EDGE_MARGIN_PX: float = 40.0
const PAN_SPEED_PX_PER_SECOND: float = 420.0
const MAP_MIN: Vector2 = Vector2(0.0, 0.0)
const MAP_MAX: Vector2 = Vector2(1280.0, 720.0)


func _process(delta: float) -> void:
	var viewport_rect: Rect2 = get_viewport_rect()
	var mouse_pos: Vector2 = get_viewport().get_mouse_position()
	var direction: Vector2 = Vector2.ZERO

	if mouse_pos.x <= EDGE_MARGIN_PX:
		direction.x -= 1.0
	elif mouse_pos.x >= viewport_rect.size.x - EDGE_MARGIN_PX:
		direction.x += 1.0

	if mouse_pos.y <= EDGE_MARGIN_PX:
		direction.y -= 1.0
	elif mouse_pos.y >= viewport_rect.size.y - EDGE_MARGIN_PX:
		direction.y += 1.0

	if direction == Vector2.ZERO:
		return

	global_position += direction.normalized() * PAN_SPEED_PX_PER_SECOND * delta
	global_position = global_position.clamp(MAP_MIN, MAP_MAX)
