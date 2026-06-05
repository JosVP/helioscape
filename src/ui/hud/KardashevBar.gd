class_name KardashevBar
extends Control

const MAX_LEVEL: float = 2.0
const TWEEN_DURATION: float = 0.8

var _progress_bar: ProgressBar
var _level_label: Label
var _markers_container: HBoxContainer


func _ready() -> void:
	_cache_nodes()
	_build_markers()
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.kardashev_milestone_reached.connect(_on_milestone_reached)
	_set_level(GameState.kardashev_level)


func _on_year_ticked(_year: float) -> void:
	_set_level(GameState.kardashev_level)


func _on_milestone_reached(_milestone_id: String) -> void:
	if _markers_container == null:
		return

	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(_markers_container, "modulate", Color(1.0, 0.97, 0.88, 1.0), 0.2)
	tween.tween_property(_markers_container, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.35)


func _set_level(level: float) -> void:
	if _progress_bar == null or _level_label == null:
		return

	var clamped_level: float = clampf(level, 0.0, MAX_LEVEL)
	var target_value: float = (clamped_level / MAX_LEVEL) * 100.0

	if _progress_bar.value == target_value:
		_level_label.text = "K %.2f" % clamped_level
		return

	var start_value: float = float(_progress_bar.value)
	var tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_method(
		func(v: float) -> void: _progress_bar.value = v, start_value, target_value, TWEEN_DURATION
	)

	_level_label.text = "K %.2f" % clamped_level


func _build_markers() -> void:
	if _markers_container == null:
		return

	for child: Node in _markers_container.get_children():
		child.queue_free()

	var markers: Array[Dictionary] = [
		{"label": "Type I", "k": 1.0},
		{"label": "First Era", "k": 1.5},
		{"label": "Type II", "k": 2.0},
	]

	for marker: Dictionary in markers:
		var label: Label = Label.new()
		label.text = String(marker.get("label", ""))
		_markers_container.add_child(label)


func _cache_nodes() -> void:
	_progress_bar = _as_progress(get_node_or_null("Bar"))
	_level_label = _as_label(get_node_or_null("LevelLabel"))
	_markers_container = _as_hbox(get_node_or_null("Markers"))

	if _progress_bar == null:
		_progress_bar = ProgressBar.new()
		_progress_bar.name = "Bar"
		_progress_bar.max_value = 100.0
		_progress_bar.value = 0.0
		_progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		add_child(_progress_bar)

	if _level_label == null:
		_level_label = Label.new()
		_level_label.name = "LevelLabel"
		add_child(_level_label)

	if _markers_container == null:
		_markers_container = HBoxContainer.new()
		_markers_container.name = "Markers"
		add_child(_markers_container)


func _as_progress(node: Node) -> ProgressBar:
	if node is ProgressBar:
		return node
	return null


func _as_label(node: Node) -> Label:
	if node is Label:
		return node
	return null


func _as_hbox(node: Node) -> HBoxContainer:
	if node is HBoxContainer:
		return node
	return null
