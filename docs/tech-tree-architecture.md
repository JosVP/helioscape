---

# PHASE 6 — Tech Tree System

*(Unchanged from v1 — carry forward)*

---

## `src/systems/TechTreeSystem.gd`

```
Create src/systems/TechTreeSystem.gd for Helioscape.

Responsibility: prerequisite checking, node unlocking, spillover handling. Listen to user input via unlock_tech() public function. Modify GameState. Emit via EventBus. Never holds a reference to any UI node.

Modifies: GameState.planets[planet_id].unlocked_techs, GameState.completed_techs.
Emits: EventBus.tech_node_unlocked.

can_unlock(planet_id: String, node_id: String) -> bool:
- Check prerequisites and spillover_prerequisites all in GameState.completed_techs.

unlock_tech(planet_id: String, node_id: String) -> void:
- Guard: return if not can_unlock.
- Add to completed_techs, unlocked_techs.
- Process effects array via _apply_effect().
- Emit EventBus.tech_node_unlocked.

_apply_effect(effect: Dictionary, source_planet: String):
- "unlock_tech": call unlock_tech on target (chain).
- "emit_event": push to GameState.culture_event_queue, emit EventBus.culture_event_triggered.
- "spillover_unlock": notify target planet's tech availability. Emit culture_event_triggered with spillover CE id.
- "apply_terraforming_choice": call TerraformingSystem.apply_choice(planet, choice_id, permanent).
- "tag_decision": increment GameState.naturalist_decisions or architect_decisions.

get_available_techs(planet_id: String) -> Array[Dictionary]:
- All nodes for this planet where prerequisites met and not yet completed.

Static typing throughout.
```

---

## `src/ui/planet_panel/TechTreeUI.gd`

```
Create src/ui/planet_panel/TechTreeUI.gd for Helioscape.

Responsibility: render the tech tree for a planet. Handle node clicks → TechTreeSystem. Never modify GameState directly.

@export var planet_id: String = ""

_ready(): _build_tree(). Connect EventBus.tech_node_unlocked to _on_tech_unlocked.

_build_tree(): load nodes via DataManager.get_tech_tree_for(planet_id). Instantiate a button per node. Call _update_node_visual(node_id) for each.

_update_node_visual(node_id: String):
Visibility rules: unlocked = full colour; one prereq away = muted; two prereqs away = silhouette; further = hidden.

_on_node_clicked(node_id: String): call TechTreeSystem.unlock_tech(planet_id, node_id). Refresh.
_on_tech_unlocked(pid: String, _nid: String): return early if pid != planet_id. Refresh.

No get_node() paths longer than one level.
```

---
