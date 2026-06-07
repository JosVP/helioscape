class_name ResearchUI
extends Control

@export var planet_id: String = ""

var _rp_label: Label
var _active_container: VBoxContainer
var _paused_container: VBoxContainer
var _available_container: VBoxContainer
var _completed_container: VBoxContainer


func _ready() -> void:
	_cache_nodes()
	EventBus.research_track_completed.connect(_on_track_completed)
	EventBus.research_track_paused.connect(_refresh)
	EventBus.research_track_resumed.connect(_refresh)
	EventBus.planet_selected.connect(_on_planet_selected)
	_refresh()


func _refresh(_ignored: Variant = null) -> void:
	if _rp_label == null:
		return

	_rp_label.text = "%d / %d RP in use" % [GameState.used_rp_capacity, GameState.total_rp_capacity]

	_clear_container(_active_container)
	_clear_container(_paused_container)
	_clear_container(_available_container)
	_clear_container(_completed_container)

	if planet_id.is_empty():
		return

	var tracks: Array[Dictionary] = DataManager.get_research_tracks_for(planet_id)
	for track: Dictionary in tracks:
		var track_id: String = String(track.get("id", ""))
		if track_id.is_empty():
			continue

		if GameState.completed_techs.has(track_id):
			_render_completed_track(track)
			continue

		var active_entry: Dictionary = _get_active_track_entry(track_id)
		if not active_entry.is_empty():
			if bool(active_entry.get("is_paused", false)):
				_render_paused_track(track, active_entry)
			else:
				_render_running_track(track, active_entry)
			continue

		if _can_start_track(track):
			_render_available_track(track)


func _on_start_clicked(track_id: String) -> void:
	if planet_id.is_empty():
		return

	var research_system: Node = _get_research_system()
	if research_system == null:
		push_warning("ResearchUI: ResearchSystem not found")
		return

	research_system.call("start_track", track_id, planet_id)
	_refresh()


func _on_pause_clicked(track_id: String) -> void:
	var research_system: Node = _get_research_system()
	if research_system == null:
		push_warning("ResearchUI: ResearchSystem not found")
		return

	research_system.call("pause_track", track_id)
	_refresh()


func _on_resume_clicked(track_id: String) -> void:
	var research_system: Node = _get_research_system()
	if research_system == null:
		push_warning("ResearchUI: ResearchSystem not found")
		return

	research_system.call("resume_track", track_id)
	_refresh()


func _on_track_completed(track_id: String) -> void:
	GameState.completed_research_years[track_id] = int(GameState.game_year)
	_refresh()


func _on_planet_selected(pid: String) -> void:
	if planet_id == pid:
		return
	planet_id = pid
	_refresh()


func _render_running_track(track: Dictionary, entry: Dictionary) -> void:
	var container: VBoxContainer = VBoxContainer.new()

	var title: Label = Label.new()
	title.text = String(track.get("display_name", String(track.get("id", ""))))
	container.add_child(title)

	var progress_bar: ProgressBar = ProgressBar.new()
	progress_bar.max_value = maxf(1.0, float(track.get("duration_years", 1.0)))
	progress_bar.value = float(entry.get("progress_years", 0.0))
	progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	container.add_child(progress_bar)

	var years_remaining: int = maxi(
		0,
		int(ceil(float(track.get("duration_years", 0.0)) - float(entry.get("progress_years", 0.0))))
	)
	var details: Label = Label.new()
	details.text = "~%d years remaining" % years_remaining
	container.add_child(details)

	var pause_button: Button = Button.new()
	pause_button.text = "Pause"
	pause_button.pressed.connect(_on_pause_clicked.bind(String(track.get("id", ""))))
	container.add_child(pause_button)

	_active_container.add_child(container)


func _render_paused_track(track: Dictionary, entry: Dictionary) -> void:
	var container: VBoxContainer = VBoxContainer.new()

	var title: Label = Label.new()
	title.text = String(track.get("display_name", String(track.get("id", ""))))
	container.add_child(title)

	var progress_bar: ProgressBar = ProgressBar.new()
	progress_bar.max_value = maxf(1.0, float(track.get("duration_years", 1.0)))
	progress_bar.value = float(entry.get("progress_years", 0.0))
	progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	container.add_child(progress_bar)

	var progress_ratio: float = clampf(
		(
			float(entry.get("progress_years", 0.0))
			/ maxf(1.0, float(track.get("duration_years", 1.0)))
		),
		0.0,
		1.0
	)
	var progress_label: Label = Label.new()
	progress_label.text = "Progress: %d%%" % int(round(progress_ratio * 100.0))
	container.add_child(progress_label)

	var resume_button: Button = Button.new()
	resume_button.text = "Resume"
	var rp_cost: int = int(track.get("rp_cost", 0))
	var can_resume: bool = GameState.used_rp_capacity + rp_cost <= GameState.total_rp_capacity
	resume_button.disabled = not can_resume
	if not can_resume:
		resume_button.tooltip_text = "Resume requires %d RP capacity." % rp_cost
	resume_button.pressed.connect(_on_resume_clicked.bind(String(track.get("id", ""))))
	container.add_child(resume_button)

	_paused_container.add_child(container)


func _render_available_track(track: Dictionary) -> void:
	var container: VBoxContainer = VBoxContainer.new()

	var title: Label = Label.new()
	title.text = String(track.get("display_name", String(track.get("id", ""))))
	container.add_child(title)

	var details: Label = Label.new()
	details.text = (
		"%d RP, %d years\n%s"
		% [
			int(track.get("rp_cost", 0)),
			int(track.get("duration_years", 0)),
			String(track.get("description", ""))
		]
	)
	container.add_child(details)

	var start_button: Button = Button.new()
	start_button.text = "Start"
	start_button.pressed.connect(_on_start_clicked.bind(String(track.get("id", ""))))
	container.add_child(start_button)

	_available_container.add_child(container)


func _render_completed_track(track: Dictionary) -> void:
	var row: HBoxContainer = HBoxContainer.new()

	var title: Label = Label.new()
	title.text = String(track.get("display_name", String(track.get("id", ""))))
	title.modulate = Color(0.6, 0.6, 0.6, 1.0)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(title)

	var completion_year_label: Label = Label.new()
	var track_id: String = String(track.get("id", ""))
	if GameState.completed_research_years.has(track_id):
		completion_year_label.text = (
			"Year %d" % int(GameState.completed_research_years.get(track_id, 0))
		)
	else:
		completion_year_label.text = "Year -"
	completion_year_label.modulate = Color(0.6, 0.6, 0.6, 1.0)
	row.add_child(completion_year_label)

	_completed_container.add_child(row)


func _can_start_track(track: Dictionary) -> bool:
	var track_id: String = String(track.get("id", ""))
	if track_id.is_empty():
		return false

	if GameState.completed_techs.has(track_id):
		return false

	if not _get_active_track_entry(track_id).is_empty():
		return false

	var prerequisite_tech: String = String(track.get("prerequisite_tech", ""))
	if not prerequisite_tech.is_empty() and not GameState.completed_techs.has(prerequisite_tech):
		return false

	var rp_cost: int = int(track.get("rp_cost", 0))
	return GameState.used_rp_capacity + rp_cost <= GameState.total_rp_capacity


func _get_active_track_entry(track_id: String) -> Dictionary:
	for entry_variant: Variant in GameState.active_research:
		if not (entry_variant is Dictionary):
			continue
		var entry: Dictionary = entry_variant
		if String(entry.get("track_id", "")) == track_id:
			return entry
	return {}


func _get_research_system() -> Node:
	return get_tree().get_first_node_in_group("research_system")


func _clear_container(container: VBoxContainer) -> void:
	if container == null:
		return
	for child: Node in container.get_children():
		child.queue_free()


func _cache_nodes() -> void:
	_rp_label = _ensure_label("RPLabel")
	_active_container = _ensure_vbox("ActiveTracks")
	_paused_container = _ensure_vbox("PausedTracks")
	_available_container = _ensure_vbox("AvailableTracks")
	_completed_container = _ensure_vbox("CompletedTracks")


func _ensure_label(node_name: String) -> Label:
	var found: Node = get_node_or_null(node_name)
	if found is Label:
		return found

	var created: Label = Label.new()
	created.name = node_name
	add_child(created)
	return created


func _ensure_vbox(node_name: String) -> VBoxContainer:
	var found: Node = get_node_or_null(node_name)
	if found is VBoxContainer:
		return found

	var created: VBoxContainer = VBoxContainer.new()
	created.name = node_name
	created.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	add_child(created)
	return created
