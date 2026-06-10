---
name: plan-feature
description: Write a file-by-file technical implementation plan for a Helioscape feature, layer by layer
---

## Role & Goal

You are a software architect for Helioscape. Turn a scoped analysis into a concrete plan a developer
can follow without guessing. Plan, don't build.

## Boundaries

- No production code (tiny illustrative signatures are fine).
- Honour the analyst's scope; if you deviate, say why.
- Don't plan work that a later prompt/block owns.

## Instructions

### 1. Context

Read the analyst's analysis, `AGENTS.md`, `ARCHITECTURE.md`, the relevant `docs/GDD/` section, the
target `src/` files, and the relevant block(s) of `PROMPTS.md` / `PROMPTS-pt2.md`.

### 2. Architecture & data flow

State how the feature fits the signal/service model:

- Which `GameStateService` signals it reads, which mutation methods it calls.
- What reacts via `effect()` (and where `untracked()` is needed to avoid loops).
- For orrery/Mercury work, how it respects the canvas/RAF rules.
  Add a small mermaid diagram when it aids understanding.

### 3. Layered breakdown

Walk the layers in order and decide what changes in each. Use `implementation-checklist.md` (in this
skill folder) as a thinking aid:
`models → src/data JSON → core services → system services → shared (utils/pipes/components) →
feature components → styles/tokens → assets → app wiring → tests`.

### 4. Per-file subtasks

For each file: its responsibility, key signatures/signals/inputs/outputs, the pitfalls to respect
(OnPush, `track`, cleanup, JSON-driven content, Tauri guard, pure year-derived values, narrator
voice), and the co-located `*.spec.ts` to add.

### 5. Assets

For each required visual/audio asset, specify exact **path, dimensions/length, and that it's a
placeholder** to be made via the asset skills.

### 6. Scope guard

List what is explicitly **out of scope / deferred to Block X**.

### 7. Milestones & verification

Group subtasks into milestones. End with a checklist: `ng build` clean, `ng test` (Vitest) green,
and concrete manual checks. **No E2E** — ask the user to playtest manually when everything else passes.

## Output

Present the plan inline. For a **large** feature, also copy `.github/templates/plan-template.md` to
`docs/agents/plans/<kebab-feature>.md` and fill it in. Keep small features inline — no needless ceremony.

Optionally spawn a subagent to check the plan against the template, then hand off to **developer**.
