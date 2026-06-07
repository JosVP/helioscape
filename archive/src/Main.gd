extends Node

const MERCURY_MAP_SCENE_PATH: String = "res://scenes/mercury/MercuryMap.tscn"


func _ready() -> void:
	EventBus.planet_selected.connect(_on_planet_selected)


func _on_planet_selected(planet_id: String) -> void:
	if planet_id != "mercury":
		return
	get_tree().change_scene_to_file(MERCURY_MAP_SCENE_PATH)
