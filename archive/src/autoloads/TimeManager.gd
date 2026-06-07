extends Node

# Advances the simulation clock and exposes pause and speed controls.
# Visual orbit animation speed is intentionally decoupled from game speed.
# SolarSystemView handles its own frame-rate-driven orbit interpolation separately.

var _accumulator: float = 0.0


func _process(delta: float) -> void:
	if GameState.is_paused:
		return

	_accumulator += delta
	var tick_interval: float = 2.0 / float(GameState.game_speed)
	if _accumulator < tick_interval:
		return

	_accumulator = 0.0
	GameState.game_year += 1.0
	EventBus.game_year_ticked.emit(GameState.game_year)


func set_speed(speed: int) -> void:
	if speed != 1 and speed != 5:
		push_warning("TimeManager: unsupported speed %d" % speed)
		return

	GameState.game_speed = speed


func toggle_pause() -> void:
	GameState.is_paused = not GameState.is_paused
