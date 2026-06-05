class_name MinerUnit
extends Node2D

enum MinerState { IDLE, WALKING_TO_MINE, WALKING_TO_REFINERY, REASSIGNING }

@export var move_speed: float = 120.0

var miner_id: int = -1
var state: int = MinerState.IDLE
var refinery_id: String = ""

var _path: PackedVector2Array = PackedVector2Array()
var _path_index: int = 0
var _active_tween: Tween = null


func assign_loop_path(path: PackedVector2Array, target_refinery_id: String) -> void:
	_path = path
	_path_index = 0
	refinery_id = target_refinery_id
	if _path.is_empty():
		state = MinerState.IDLE
		return

	state = MinerState.WALKING_TO_MINE
	global_position = _path[0]
	_start_next_segment()


func request_reassignment(new_refinery_position: Vector2, new_refinery_id: String) -> void:
	state = MinerState.REASSIGNING
	if _active_tween != null:
		_active_tween.kill()

	_active_tween = create_tween()
	var duration: float = maxf(
		0.05, global_position.distance_to(new_refinery_position) / move_speed
	)
	_active_tween.tween_property(self, "global_position", new_refinery_position, duration)
	_active_tween.finished.connect(
		func() -> void:
			refinery_id = new_refinery_id
			state = MinerState.WALKING_TO_MINE
			_path_index = 0
			_start_next_segment()
	)


func _start_next_segment() -> void:
	if _path.size() < 2:
		state = MinerState.IDLE
		return

	var from_index: int = _path_index
	var to_index: int = (_path_index + 1) % _path.size()
	var from_position: Vector2 = _path[from_index]
	var to_position: Vector2 = _path[to_index]
	global_position = from_position

	state = (
		MinerState.WALKING_TO_MINE
		if to_index < (_path.size() / 2)
		else MinerState.WALKING_TO_REFINERY
	)
	var duration: float = maxf(0.05, from_position.distance_to(to_position) / move_speed)
	_active_tween = create_tween()
	_active_tween.tween_property(self, "global_position", to_position, duration)
	_active_tween.finished.connect(
		func() -> void:
			_path_index = to_index
			_start_next_segment()
	)
