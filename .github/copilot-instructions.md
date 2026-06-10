# Helioscape — Copilot Orientation

Helioscape is a **peaceful, frontend-only Angular game** about terraforming the solar system.
There is **no backend**. All state lives in Angular signals; all content lives in JSON files.

> Before doing anything, read the canonical references:
>
> - **`AGENTS.md`** (repo root) — coding standards, what to never do, the agent workflow, asset policy.
> - **`docs/agents/ARCHITECTURE.md`** — folder layout, services, signals, game loop, canvas rules, tokens.
> - **`docs/GDD/`** — what the game _is_. `main-gdd.md` first. (Ignore `dlc.md` / `dlc-2.md`.)
> - **`docs/agents/PROMPTS.md`** + **`PROMPTS-pt2.md`** — the ordered build sequence (Block 0→17).

## How we work (agent workflow)

Features are built by a small team of specialised agents that hand off to each other. The user
usually pastes a build prompt (often a block from `PROMPTS.md`). Pick the right agent to start:

| Stage           | Agent              | What it does                                                                                                                                          |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Understand   | `analyst`          | Reads the prompt + repo + GDD + prompt sequence. Flags gaps/contradictions. Scopes the work (what to build now vs. what a _later_ prompt will build). |
| 2. Plan         | `lead-developer`   | Turns the analysis into a concrete, file-by-file technical plan.                                                                                      |
| 3. Build        | `developer`        | Implements the plan (Angular, services, Three.js orrery, Mercury canvas, JSON data).                                                                  |
| 3b. Polish      | `ui-ux-specialist` | Styling, layout, tokens, animations/transitions, accessibility, visual consistency.                                                                   |
| 4. Review       | `reviewer`         | Finds bugs and inconsistencies; hands fixes back to the developer.                                                                                    |
| 4b. Stress-test | `tester`           | Edge cases, error/performance/leak scenarios, Vitest specs.                                                                                           |

Agents live in `.github/agents/`. Their reusable procedures live in `.github/skills/`.

## Non-negotiables (full detail in `AGENTS.md`)

- Standalone components, **signals only**, `@if`/`@for`, `inject()`, `input()`/`output()`, OnPush.
- No game logic in components. State only in `GameStateService`. Timers only in `GameLoopService`.
- Clean up everything on destroy (RAF, subscriptions, listeners, Three.js disposal).
- All game content comes from JSON in `src/data/` — never hardcode content in TypeScript.
- Tauri APIs only from `SaveService` / `SettingsService`, always guarded for browser-dev fallback.

## Placeholder assets (important)

When a prompt needs a **visual asset** (planet texture, vignette, culture-event portrait, tech/UI
icon, Mercury building sprite), do **not** block — generate a **simple, correctly-sized placeholder
SVG** made of basic shapes that the user can swap later. See the `create-placeholder-svg` skill.

When a prompt needs a **sound effect**, generate a **short, basic placeholder audio file** (a brief
synthesised tone, correct category/length) so it can be swapped later. See `create-placeholder-audio`.

Placeholders must be obvious placeholders, live in the path the code expects, and never halt a feature.
