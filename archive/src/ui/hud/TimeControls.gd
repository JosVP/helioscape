class_name TimeControls
extends Control

# The 5x speed button is fully absent on first playthrough. It is not disabled,
# hinted, or ghosted; the player should not know the feature exists yet.

var _pause_button: Button
var _speed_button: Button


func _ready() -> void:
	_cache_nodes()
	_build_controls()
	EventBus.game_year_ticked.connect(_sync_pause_display)
	_sync_pause_display(GameState.game_year)


func _build_controls() -> void:
	if _pause_button != null:
		_pause_button.visible = true
		_pause_button.pressed.connect(_on_pause_pressed)

	if _speed_button != null:
		_speed_button.visible = not GameState.is_first_playthrough
		_speed_button.text = "%dx" % int(GameState.game_speed)
		_speed_button.pressed.connect(_on_speed_pressed)


func _on_pause_pressed() -> void:
	TimeManager.toggle_pause()
	_sync_pause_display(GameState.game_year)


func _on_speed_pressed() -> void:
	if GameState.game_speed == 1:
		TimeManager.set_speed(5)
	else:
		TimeManager.set_speed(1)

	if _speed_button != null:
		_speed_button.text = "%dx" % int(GameState.game_speed)


func _sync_pause_display(_year: float) -> void:
	if _pause_button == null:
		return
	_pause_button.text = "Play" if GameState.is_paused else "Pause"


func _cache_nodes() -> void:
	_pause_button = _as_button(get_node_or_null("PauseButton"))
	_speed_button = _as_button(get_node_or_null("SpeedButton"))

	if _pause_button == null:
		_pause_button = Button.new()
		_pause_button.name = "PauseButton"
		add_child(_pause_button)

	if _speed_button == null:
		_speed_button = Button.new()
		_speed_button.name = "SpeedButton"
		add_child(_speed_button)


func _as_button(node: Node) -> Button:
	if node is Button:
		return node
	return null
