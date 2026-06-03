extends Node

const PLANETS_PATH: String = "res://data/planets.json"
const TECH_TREE_PATH: String = "res://data/tech_tree.json"
const RESEARCH_TRACKS_PATH: String = "res://data/research_tracks.json"
const CULTURE_EVENTS_PATH: String = "res://data/culture_events.json"
const KARDASHEV_MILESTONES_PATH: String = "res://data/kardashev_milestones.json"
const RESOURCES_PATH: String = "res://data/resources.json"

var _planets: Dictionary = {}
var _tech_nodes: Dictionary = {}
var _research_tracks: Dictionary = {}
var _culture_events: Dictionary = {}
var _kardashev_milestones: Dictionary = {}
var _resources: Dictionary = {}


func _ready() -> void:
	_planets = _load_json(PLANETS_PATH)
	_tech_nodes = _index_by_id(_load_json(TECH_TREE_PATH).get("items", []))
	_research_tracks = _index_by_id(_load_json(RESEARCH_TRACKS_PATH).get("items", []))
	_culture_events = _index_by_id(_load_json(CULTURE_EVENTS_PATH).get("items", []))
	_kardashev_milestones = _index_by_id(_load_json(KARDASHEV_MILESTONES_PATH).get("items", []))
	_resources = _index_by_id(_load_json(RESOURCES_PATH).get("items", []))


func get_planet(planet_id: String) -> Dictionary:
	return _planets.get(planet_id, {})


func get_all_planets() -> Dictionary:
	return _planets


func get_tech_node(node_id: String) -> Dictionary:
	return _tech_nodes.get(node_id, {})


func get_tech_tree_for(planet_id: String) -> Array[Dictionary]:
	return _filter_entries_by_planet(_tech_nodes, planet_id)


func get_research_track(track_id: String) -> Dictionary:
	return _research_tracks.get(track_id, {})


func get_research_tracks_for(planet_id: String) -> Array[Dictionary]:
	return _filter_entries_by_planet(_research_tracks, planet_id)


func get_culture_event(event_id: String) -> Dictionary:
	return _culture_events.get(event_id, {})


func get_kardashev_milestone(milestone_id: String) -> Dictionary:
	return _kardashev_milestones.get(milestone_id, {})


func get_all_milestones() -> Array[Dictionary]:
	return _dictionary_values(_kardashev_milestones)


func get_resource(resource_id: String) -> Dictionary:
	return _resources.get(resource_id, {})


func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("DataManager: JSON file not found at %s" % path)
		return {}

	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("DataManager: Failed to open JSON file at %s" % path)
		return {}

	var raw_text: String = file.get_as_text()
	var parsed: Variant = JSON.parse_string(raw_text)
	if parsed == null:
		push_error("DataManager: Failed to parse JSON file at %s" % path)
		return {}

	if parsed is Dictionary:
		return parsed

	if parsed is Array:
		return {"items": parsed}

	push_error("DataManager: Unsupported JSON root type at %s" % path)
	return {}


func _index_by_id(entries: Array) -> Dictionary:
	var indexed_entries: Dictionary = {}
	for entry_variant: Variant in entries:
		if not (entry_variant is Dictionary):
			continue

		var entry: Dictionary = entry_variant
		var entry_id: String = String(entry.get("id", ""))
		if entry_id.is_empty():
			continue
		indexed_entries[entry_id] = entry

	return indexed_entries


func _filter_entries_by_planet(source: Dictionary, planet_id: String) -> Array[Dictionary]:
	var filtered_entries: Array[Dictionary] = []
	for entry_id: Variant in source:
		var entry: Dictionary = source.get(entry_id, {})
		if String(entry.get("planet", "")) == planet_id:
			filtered_entries.append(entry)
	return filtered_entries


func _dictionary_values(source: Dictionary) -> Array[Dictionary]:
	var values: Array[Dictionary] = []
	for key: Variant in source:
		var entry: Dictionary = source.get(key, {})
		values.append(entry)
	return values
