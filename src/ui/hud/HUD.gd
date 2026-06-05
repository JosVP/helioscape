class_name HUD
extends Control

# PlanetsPanel remains visible at all times in HUD. Selecting a planet from that list emits
# EventBus.planet_selected, which opens PlanetPanel and also drives SolarSystemView zoom.

var _top_bar: Control
var _year_label: Label
var _resource_counters: Control
var _dyson_label: Label

var _resource_labels: Dictionary = {}


func _ready() -> void:
	_cache_nodes()
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.resource_accumulation_updated.connect(_on_resources_updated)
	EventBus.dyson_energy_updated.connect(_on_dyson_updated)
	EventBus.mercury_phase_changed.connect(_on_mercury_phase_changed)

	_on_year_ticked(GameState.game_year)
	_on_mercury_phase_changed(GameState.mercury_phase)


func _on_year_ticked(year: float) -> void:
	if _year_label == null:
		return
	_year_label.text = "Year %d" % int(year)


func _on_resources_updated(resource_id: String, amount: float) -> void:
	var label: Label = _resource_labels.get(resource_id, null)
	if label == null:
		label = _ensure_resource_label(resource_id)
	if label == null:
		return

	var display_name: String = String(
		DataManager.get_resource(resource_id).get("display_name", resource_id)
	)
	label.text = "%s: %.1f" % [display_name, amount]


func _on_mercury_phase_changed(phase: int) -> void:
	if _resource_counters == null:
		return
	_resource_counters.visible = (
		phase >= 0 and float(GameState.mercury_resources.get("common_ore", 0.0)) > 0.0
	)


func _on_dyson_updated(watts: float) -> void:
	# KardashevBar updates itself from GameState; this label is an optional HUD readout.
	if _dyson_label == null:
		return
	_dyson_label.text = "Dyson: %s W" % _format_watts(watts)


func _format_watts(watts: float) -> String:
	if watts >= 1e15:
		return "%.2fP" % (watts / 1e15)
	if watts >= 1e12:
		return "%.2fT" % (watts / 1e12)
	if watts >= 1e9:
		return "%.2fG" % (watts / 1e9)
	return "%.2f" % watts


func _cache_nodes() -> void:
	_top_bar = _as_control(get_node_or_null("TopBar"))
	if _top_bar == null:
		_top_bar = HBoxContainer.new()
		_top_bar.name = "TopBar"
		add_child(_top_bar)

	_year_label = _as_label(_top_bar.get_node_or_null("YearLabel"))
	if _year_label == null:
		_year_label = Label.new()
		_year_label.name = "YearLabel"
		_top_bar.add_child(_year_label)

	_resource_counters = _as_control(_top_bar.get_node_or_null("ResourceCounters"))
	if _resource_counters == null:
		_resource_counters = HBoxContainer.new()
		_resource_counters.name = "ResourceCounters"
		_top_bar.add_child(_resource_counters)

	_dyson_label = _as_label(_top_bar.get_node_or_null("DysonLabel"))
	if _dyson_label == null:
		_dyson_label = Label.new()
		_dyson_label.name = "DysonLabel"
		_top_bar.add_child(_dyson_label)

	for resource_id: String in ["common_ore", "rare_metals", "polar_volatiles"]:
		var label: Label = _ensure_resource_label(resource_id)
		if label != null:
			_resource_labels[resource_id] = label


func _ensure_resource_label(resource_id: String) -> Label:
	if _resource_counters == null:
		return null

	var node_name: String = "%sLabel" % resource_id
	var existing: Node = _resource_counters.get_node_or_null(node_name)
	if existing is Label:
		return existing

	var created: Label = Label.new()
	created.name = node_name
	created.text = "%s: 0.0" % resource_id
	_resource_counters.add_child(created)
	return created


func _as_control(node: Node) -> Control:
	if node is Control:
		return node
	return null


func _as_label(node: Node) -> Label:
	if node is Label:
		return node
	return null
