class_name MercuryMiningSystem
extends Node

enum MinerState { IDLE, WALKING_TO_MINE, WALKING_TO_REFINERY, REASSIGNING }

const STARTING_MINERS: int = 4
const REFINERY_CAPACITY: int = 4


func _ready() -> void:
	add_to_group("mercury_mining_system")
	EventBus.game_year_ticked.connect(_on_year_ticked)
	EventBus.component_completed.connect(_on_component_completed)
	_ensure_miner_state()


func get_reserve_miner_count() -> int:
	var reserve_count: int = 0
	for miner_variant: Variant in GameState.mercury_miners:
		var miner: Dictionary = miner_variant
		if int(miner.get("state", MinerState.IDLE)) == MinerState.IDLE:
			reserve_count += 1
	return reserve_count


func get_assigned_miners(refinery_id: String) -> Array[int]:
	var assigned: Array[int] = []
	for miner_variant: Variant in GameState.mercury_miners:
		var miner: Dictionary = miner_variant
		if String(miner.get("refinery_id", "")) == refinery_id:
			assigned.append(int(miner.get("id", -1)))
	return assigned


func assign_next_idle_miner(refinery_id: String) -> bool:
	if get_assigned_miners(refinery_id).size() >= REFINERY_CAPACITY:
		return false

	for index in range(GameState.mercury_miners.size()):
		var miner: Dictionary = GameState.mercury_miners[index]
		if int(miner.get("state", MinerState.IDLE)) != MinerState.IDLE:
			continue
		miner["state"] = MinerState.WALKING_TO_MINE
		miner["refinery_id"] = refinery_id
		GameState.mercury_miners[index] = miner
		return true

	return false


func reassign_miner(miner_id: int, new_refinery_id: String) -> bool:
	for index in range(GameState.mercury_miners.size()):
		var miner: Dictionary = GameState.mercury_miners[index]
		if int(miner.get("id", -1)) != miner_id:
			continue
		miner["state"] = MinerState.REASSIGNING
		miner["pending_refinery_id"] = new_refinery_id
		GameState.mercury_miners[index] = miner
		return true

	return false


func _on_year_ticked(_year: float) -> void:
	var map_system: Node = get_tree().get_first_node_in_group("mercury_map_system")
	if map_system == null:
		return

	for index in range(GameState.mercury_miners.size()):
		var miner: Dictionary = GameState.mercury_miners[index]
		if int(miner.get("state", MinerState.IDLE)) == MinerState.REASSIGNING:
			miner["refinery_id"] = String(miner.get("pending_refinery_id", ""))
			miner["pending_refinery_id"] = ""
			miner["state"] = MinerState.WALKING_TO_MINE
			EventBus.miner_reassigned.emit(
				int(miner.get("id", -1)), String(miner.get("refinery_id", ""))
			)
			GameState.mercury_miners[index] = miner

	var resource_system: Node = get_tree().get_first_node_in_group("resource_system")
	if resource_system == null or not resource_system.has_method("add_resource"):
		return

	var refinery_assignments: Dictionary = {}
	for miner_variant: Variant in GameState.mercury_miners:
		var miner: Dictionary = miner_variant
		if int(miner.get("state", MinerState.IDLE)) == MinerState.IDLE:
			continue
		var refinery_id: String = String(miner.get("refinery_id", ""))
		if refinery_id.is_empty():
			continue
		if not refinery_assignments.has(refinery_id):
			refinery_assignments[refinery_id] = 0
		refinery_assignments[refinery_id] = int(refinery_assignments[refinery_id]) + 1

	for refinery_id_variant: Variant in refinery_assignments.keys():
		var refinery_id: String = String(refinery_id_variant)
		if int(map_system.call("get_node_state", refinery_id)) != 3:
			continue
		var ore_type: String = _ore_type_for_refinery(map_system, refinery_id)
		var miners_assigned: int = int(refinery_assignments[refinery_id])
		resource_system.call("add_resource", ore_type, float(miners_assigned))

	GameState.mercury_refinery_assignments = refinery_assignments


func _ensure_miner_state() -> void:
	if GameState.mercury_miners.size() > 0:
		return

	for miner_id in range(STARTING_MINERS):
		GameState.mercury_miners.append(
			{"id": miner_id, "state": MinerState.IDLE, "refinery_id": "", "pending_refinery_id": ""}
		)


func _ore_type_for_refinery(map_system: Node, refinery_id: String) -> String:
	for node_data: Dictionary in map_system.call("get_all_node_definitions"):
		if String(node_data.get("slot_type", "")) != "mine":
			continue
		for adjacent_id_variant: Variant in node_data.get("adjacent", []):
			if String(adjacent_id_variant) == refinery_id:
				return String(node_data.get("ore_type", "common_ore"))
	return "common_ore"


func _on_component_completed(component_id: String) -> void:
	if component_id != "miner_unit":
		return

	var next_id: int = GameState.mercury_miners.size()
	GameState.mercury_miners.append(
		{"id": next_id, "state": MinerState.IDLE, "refinery_id": "", "pending_refinery_id": ""}
	)
