class_name TechTreeSystem
extends Node

# Resolves technology prerequisites, unlock chains, and spillover effects.


func _ready() -> void:
	add_to_group("tech_tree_system")


func can_unlock(planet_id: String, node_id: String) -> bool:
	var node: Dictionary = DataManager.get_tech_node(node_id)
	if node.is_empty():
		return false

	if String(node.get("planet", "")) != planet_id:
		return false

	if GameState.completed_techs.has(node_id):
		return false

	if not GameState.planets.has(planet_id):
		return false

	var prerequisites: Array[String] = _to_string_array(node.get("prerequisites", []))
	var spillover_prerequisites: Array[String] = _to_string_array(
		node.get("spillover_prerequisites", [])
	)
	return _all_completed(prerequisites) and _all_completed(spillover_prerequisites)


func unlock_tech(planet_id: String, node_id: String) -> void:
	if not can_unlock(planet_id, node_id):
		return

	if not GameState.completed_techs.has(node_id):
		GameState.completed_techs.append(node_id)

	var planet_state: Dictionary = GameState.planets.get(planet_id, {})
	var unlocked_techs: Array = planet_state.get("unlocked_techs", [])
	if not unlocked_techs.has(node_id):
		unlocked_techs.append(node_id)
	planet_state["unlocked_techs"] = unlocked_techs
	GameState.planets[planet_id] = planet_state

	var node: Dictionary = DataManager.get_tech_node(node_id)
	var effects: Variant = node.get("effects", [])
	if effects is Array:
		for effect_variant: Variant in effects:
			if effect_variant is Dictionary:
				_apply_effect(effect_variant, planet_id)

	EventBus.tech_node_unlocked.emit(planet_id, node_id)


func _apply_effect(effect: Dictionary, source_planet: String) -> void:
	var effect_type: String = String(effect.get("type", ""))
	match effect_type:
		"unlock_tech":
			var target_node_id: String = String(effect.get("target", ""))
			if target_node_id.is_empty():
				return
			var target_node: Dictionary = DataManager.get_tech_node(target_node_id)
			var target_planet: String = String(target_node.get("planet", source_planet))
			unlock_tech(target_planet, target_node_id)
		"emit_event":
			var event_id: String = String(effect.get("event_id", ""))
			_push_culture_event(event_id)
		"spillover_unlock":
			var target_planet_id: String = String(effect.get("target_planet", ""))
			var target_tech_id: String = String(effect.get("target_tech", ""))
			if not target_planet_id.is_empty() and not target_tech_id.is_empty():
				EventBus.tech_node_available.emit(target_planet_id, target_tech_id)
			var spillover_event_id: String = String(
				effect.get("event_id", "ce_spillover_%s_%s" % [target_planet_id, target_tech_id])
			)
			_push_culture_event(spillover_event_id)
		"apply_terraforming_choice":
			var target_planet_name: String = String(effect.get("planet", ""))
			var choice_id: String = String(effect.get("choice_id", ""))
			var permanent: bool = bool(effect.get("permanent", false))
			_call_terraforming_apply_choice(target_planet_name, choice_id, permanent)
		"tag_decision":
			var tag: String = String(effect.get("tag", ""))
			match tag:
				"naturalist":
					GameState.naturalist_decisions += 1
				"architect":
					GameState.architect_decisions += 1
				_:
					pass
		_:
			pass


func get_available_techs(planet_id: String) -> Array[Dictionary]:
	var available: Array[Dictionary] = []
	var planet_nodes: Array[Dictionary] = DataManager.get_tech_tree_for(planet_id)
	for node: Dictionary in planet_nodes:
		var node_id: String = String(node.get("id", ""))
		if node_id.is_empty():
			continue
		if can_unlock(planet_id, node_id):
			available.append(node)
	return available


func _all_completed(requirements: Array[String]) -> bool:
	for requirement_id: String in requirements:
		if requirement_id.is_empty():
			continue
		if not GameState.completed_techs.has(requirement_id):
			return false
	return true


func _to_string_array(value: Variant) -> Array[String]:
	var output: Array[String] = []
	if not (value is Array):
		return output

	for entry: Variant in value:
		output.append(String(entry))
	return output


func _push_culture_event(event_id: String) -> void:
	if event_id.is_empty():
		return
	GameState.culture_event_queue.append(event_id)
	EventBus.culture_event_triggered.emit(event_id)


func _call_terraforming_apply_choice(planet_id: String, choice_id: String, permanent: bool) -> void:
	if planet_id.is_empty() or choice_id.is_empty():
		return

	var terraforming_system: Node = get_tree().get_first_node_in_group("terraforming_system")
	if terraforming_system == null and has_node("/root/Main/Systems/TerraformingSystem"):
		terraforming_system = get_node("/root/Main/Systems/TerraformingSystem")

	if terraforming_system != null and terraforming_system.has_method("apply_choice"):
		terraforming_system.call("apply_choice", planet_id, choice_id, permanent)
		return

	push_warning("TechTreeSystem: TerraformingSystem.apply_choice unavailable for %s" % choice_id)
