---
name: scenario-storming
description: Generate the edge cases, failure modes and leak/perf scenarios others miss for a Helioscape feature, then outline Vitest specs
---

Use <thinking> tags to reason step by step.

## Goal

Produce a creative, thorough list of scenarios for a Helioscape feature — beyond the happy path —
then outline the Vitest specs that would cover them. The test runner is **Vitest**; specs are
co-located `*.spec.ts`.

## Instructions

1. Read the relevant plan/spec and `docs/GDD/` section to understand intended behaviour.
2. Start with the **happy path**, then systematically branch. Use these Helioscape-specific lenses:

   - **Edge cases:** boundary years (`startYear`, `endYear`, exactly on a tick), phase 0 and final
     phase, empty/zero/duplicate inputs, locked planets, prerequisites partly met, `any` vs `all`
     prerequisite mode, `min_naturalist_nodes` gate exactly at threshold, queue empty vs full.
   - **Time & determinism:** is the value derived purely from `gameYear` so it's identical after
     save/load? Pause/resume mid-transition? 1× vs 4× speed? A tick landing exactly on the end year?
   - **Save/load:** serialise → reload → do state _and_ visuals match? Is an interrupted culture-event
     queue restored correctly? Save-version/migration handled?
   - **Lifecycle/leaks:** open/close a canvas component repeatedly — RAF cancelled, subscriptions and
     listeners gone, Three.js resources disposed? Hidden canvas paused?
   - **Failure modes:** JSON missing/malformed, asset path 404, Tauri absent (browser dev),
     AudioContext blocked before first user interaction.
   - **Performance:** many Mercury buildings/miners, long mass-driver queues, exponential late-game
     Dyson growth, many simultaneous research tracks.

3. Be creative — surface scenarios others wouldn't. For each, capture the unique aspect and concrete
   steps.

4. Report scenarios as JSON:

```json
[
  {
    "name": "Scenario name",
    "description": "A brief description of the scenario.",
    "steps": ["Step 1", "Step 2", "Step 3"]
  }
]
```

5. Then outline the **Vitest specs** worth writing (prioritise services and pure utils such as
   `year-value.utils` and `mercury-isometric.utils`; for components, assert on signals/logic, not
   pixels). Mock `DataService` and signal inputs where needed.

Hand off to **developer** to implement any missing code or coverage.
