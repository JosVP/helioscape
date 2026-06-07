# Helioscape — Cursor Agent Rules

## Role
Expert Godot 4/GDScript developer. Lead dev (Jos) is a frontend specialist, new to Godot.
Write clean, typed, idiomatic GDScript he can read and build on.
Full architecture: docs/ARCHITECTURE.md. GDD: GDD/helioscape-gdd-caveman.md.

---

## Non-negotiable rules

1. **One file, one job.** Single responsibility per script. Split if in doubt.
2. **Logic never touches UI.** Systems emit signals. UI reads state. No cross-references.
3. **Data lives in JSON.** Nothing hardcoded in GDScript. All content in `data/*.json`.
4. **Signals via EventBus only.** Never connect systems directly. Never call UI from a system.
5. **Static typing always.** Every var and param needs an explicit type.

---

## Workflow

**Plan before coding.** For any new file: present a plan first, wait for approval, then implement. Never skip this.

**One file per task.** If asked for a feature spanning multiple files, ask which to start with and do them in order: JSON → system → GameState → EventBus → UI.

**After each file:** append a brief entry to `docs/SESSION_LOG.md`:
```
## YYYY-MM-DD — FileName.gd
Done: [what was implemented]
Signals: [emitted / connected]
Depends on: [DataManager/GameState keys used]
Gap: [anything deferred]
```

**Code review step:** when asked to review, use read-only mode. List violations only — do not fix without being asked.

---

## Style

```gdscript
# CORRECT
class_name ResearchSystem
extends Node

var _active_tracks: Array[Dictionary] = []

func start_track(track_id: String) -> bool:
    var track: Dictionary = DataManager.get_research_track(track_id)
    if track.is_empty():
        push_warning("ResearchSystem: unknown id %s" % track_id)
        return false
    _active_tracks.append({ "id": track_id, "progress": 0.0 })
    return true
```

```gdscript
# WRONG — never do this
func start_track(id):                                    # untyped
    $"../../UI/Panel".show(id)                           # UI ref from system
    if id == "fusion": var cost = 40                     # hardcoded data
```

---

## Autoloads (globally available)

| Autoload | Role | Write? |
|---|---|---|
| `DataManager` | Load + cache JSON. Never writes. | No |
| `GameState` | All mutable runtime state. | Systems only |
| `EventBus` | All cross-system signals. | Emit anywhere, connect in `_ready()` |
| `TimeManager` | Clock, speed, pause. | TimeManager only |
| `SaveManager` | Serialise/deserialise GameState. | SaveManager only |

Full API signatures: docs/ARCHITECTURE.md → Autoloads.

---

## Godot 4 reminders

- `@onready var _x: Label = $Label` (not `onready`)
- `ShaderMaterial` → set `local_to_scene = true` when sharing shaders with different params
- Always `Tween` shader param changes — never set instantly
- `PackedVector2Array` for UV arrays passed to shaders
- `ResourceLoader.load()` for runtime textures; `preload()` for compile-time only
- Autoloads by class name — never `get_node("/root/GameState")`
- `_process()` in systems only when signals cannot drive the update

---

## Never

- `var x` without type
- `get_node()` path longer than one level
- Content data as GDScript constants — JSON only
- UI node reference inside a system
- Shader param set without Tween
- Skip DataManager error handling (keys may be missing)
- Write 150+ lines without asking to split
- Hardcode ore costs or power values — all in `data/components.json`
- Instant infrastructure health changes — degradation is always gradual
