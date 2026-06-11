# AGENTS.md — Helioscape AI Agent Instructions

You are an expert Angular developer working on Helioscape, a space civilisation strategy game.
Read this file and ARCHITECTURE.md before responding to any prompt.

---

## The agent workflow

Helioscape features are built by a small team of specialised agents that hand off to each other.
The user usually pastes a build prompt (often a numbered block from `docs/agents/PROMPTS.md` or
`PROMPTS-pt2.md`). Pick the right agent to start, then follow the `handoffs`:

| Stage           | Agent              | Purpose                                                                                                                                    |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Understand   | `analyst`          | Analyse the prompt against the repo, GDD and prompt sequence. Scope the work; flag gaps/contradictions; defer anything a later block owns. |
| 2. Plan         | `lead-developer`   | Turn the analysis into a file-by-file technical plan.                                                                                      |
| 3. Build        | `developer`        | Implement the plan — Angular, services, Three.js orrery, Mercury canvas, JSON data, placeholder assets.                                    |
| 3b. Polish      | `ui-ux-specialist` | Styling, layout, tokens, motion, accessibility, visual consistency.                                                                        |
| 4. Review       | `reviewer`         | Find bugs, leaks and inconsistencies; hand fixes back to the developer.                                                                    |
| 4b. Stress-test | `tester`           | Edge cases, failure/perf/leak scenarios, Vitest specs.                                                                                     |

Agent definitions live in `.github/agents/`; their reusable procedures live in `.github/skills/`.
A short orientation for any agent is in `.github/copilot-instructions.md`. Every agent must still
obey the standards in **this file** and **ARCHITECTURE.md**.

---

## TODO tracking

Deferred work (features blocked by missing dependencies) is tracked in **`docs/agents/TODO.md`**.

- **lead-developer**: Adds TODOs to the file during planning when a feature depends on something
  not yet implemented (e.g., AudioService, Tauri APIs). Checks the file at the start of every
  planning session to see if blocked work is now unblocked.
- **developer**: Reads the file before implementing to understand what's deferred and why. When
  implementing deferred work, moves completed TODOs from "Active" to "Completed" section with date.

**Single source of truth**: all TODOs live in TODO.md only. This ensures nothing falls through
the cracks as the codebase grows.

---

## Your role

You write production-quality Angular code for a real shipped game. You are not writing tutorials
or examples. Every file you produce must be complete, correctly typed, and integrate with the
existing architecture without requiring manual fixes.

---

## Angular version and standards

Use the latest stable Angular. All code must use:

- **Standalone components** — no NgModules, no `CommonModule` imports
- **Signals** — `signal()`, `computed()`, `effect()` for all reactive state
- **New control flow** — `@if`, `@for` (always with `track`), `@switch`; never `*ngIf`/`*ngFor`
- **`inject()`** — never constructor-parameter DI
- **`input()` / `output()` / `input.required()`** — not `@Input()`/`@Output()` decorators
- **`ChangeDetectionStrategy.OnPush`** on every component
- **TypeScript strict mode** — no `any`; no `!` non-null assertions (unless unavoidable, with a
  comment); explicit return types on public methods; `readonly` on service signals; interfaces (not
  inline object types) for data shapes; named exports; `import type` for type-only imports

```ts
// CORRECT — the canonical component shape
@Component({
  selector: 'app-planet-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planet-panel.component.html',
  styleUrl: './planet-panel.component.scss',
})
export class PlanetPanelComponent {
  private gameState = inject(GameStateService);
  planetId = input.required<string>();
  panelClosed = output<void>();
  planet = computed(() => this.gameState.planets()[this.planetId()]);
}
```

Never: `@Input()`/`@Output()` decorators, constructor DI, `any`, `*ngIf`/`*ngFor`, default exports
(except lazy routes), inline `template` or `styles` strings.

---

## Service patterns

All services are `providedIn: 'root'` singletons unless explicitly stated otherwise.

- **State services** (`GameStateService`) — hold private writable signals, expose public
  `.asReadonly()` views, provide typed mutation methods. No other service mutates state directly.
- **System services** — contain game logic; react to state via `effect()`, wrapping the body in
  `untracked()` to avoid circular dependencies.
- **Never** put game logic in components. Components read state and call service methods. That is all.

→ Canonical examples and the full signal hierarchy: **ARCHITECTURE.md › State architecture**.

---

## Component patterns

- `ChangeDetectionStrategy.OnPush` always; `track` in every `@for`.
- Keep templates thin — derive values with `computed()` in the class, not inline template logic.
- One component per file; keep components under ~200 lines (split if longer).
- BEM CSS class names: `block__element--modifier`.
- Import only what's needed — prefer specific imports over `CommonModule`.

---

## CSS standards

- **Separate files** — always use `styleUrl` pointing to a co-located `*.component.scss` file.
  Never use inline `styles` or `template` strings.
- **Design tokens only** — reference CSS custom properties from `styles/tokens.scss`; never hardcode
  colours, fonts, spacing, radius or transitions. No magic numbers (reference a token or comment why).
- **SCSS**, scoped component styles, no deep selectors.
- **No inline styles** except dynamic values (bar width, hue), which are set as CSS custom properties
  in the class (e.g. `--bar-width`), not as inline style strings.
- **Transitions follow the visual-value pattern**: tick-driven values use `... 1s linear`; the
  first-open `initial-load` variant uses ease-out. → **ARCHITECTURE.md › Visual value pattern**.

---

## File and folder naming

`kebab-case` for all files and folders: `feature-name.component.ts`, `feature-name.service.ts`,
`feature-name.model.ts` (interfaces/types), `.pipe.ts`, `.directive.ts`.

---

## Game-specific rules

- **Pure value derivation** — every visual value that changes over time is computed from `gameYear`
  via a pure function (`getValueAtYear()`), never stored as animation/transition state. This is what
  makes save/load safe. → **ARCHITECTURE.md › Visual value pattern**.
- **No `setTimeout`/`setInterval` in components** — the only game timer lives in `GameLoopService`.
- **No direct DOM manipulation in services** — services update signals; components react.
- **Canvas components** (`OrreryComponent`, `MercuryGridComponent`) own their RAF loop: start in
  `ngAfterViewInit`, cancel in `ngOnDestroy`, pause when hidden, and **read signals once into locals
  at the top of the RAF callback** — never call signal getters mid-render. → **ARCHITECTURE.md ›
  Canvas components**.

---

## Memory leak prevention

Every component that creates a subscription, interval, listener, RAF loop, or Three.js resource MUST
clean it up on destroy. No exceptions — this is the most-reviewed thing in the codebase.

- **RxJS subscriptions** — always `.pipe(takeUntilDestroyed(this.destroyRef))`. Never manual
  unsubscribe arrays. (Prefer signals over Observables in the first place.)
- **Effects** — `effect()` auto-disposes on destroy; no manual cleanup.
- **RAF loops** — store the id; `cancelAnimationFrame()` in `ngOnDestroy`.
- **`setInterval`/`setTimeout`** — store the ref and clear on destroy. (Game ticks: `GameLoopService`
  only.)
- **Manual DOM listeners** (e.g. canvas mouse events) — `removeEventListener` in `ngOnDestroy`.
- **Three.js** — in `ngOnDestroy`, traverse the scene and dispose every geometry, material and
  texture, then `renderer.dispose()`. Failing to do this is the #1 source of GPU leaks in web games.

→ Code patterns for each of the above: **ARCHITECTURE.md** (Canvas components / cleanup sections).

---

## Audio context

Browsers block audio until the first user interaction. Never call `AudioService` methods before then;
`AudioService.initialise()` must run inside a user event handler (owned by `GameShellComponent`), not
in a constructor or `ngOnInit`. → **ARCHITECTURE.md › Audio autoplay policy**.

## Placeholder assets

Helioscape needs a lot of visual and audio assets. Missing art or sound must **never** block a
feature. When a prompt requires an asset that doesn't exist yet, generate a clearly-marked
placeholder at the exact path and size the code expects, then continue.

- **Visual assets** (planet textures, planet-state vignettes, culture-event portraits, tech-tree and
  UI icons, Mercury building sprites) → a simple **placeholder SVG** built from basic shapes
  (`<rect>`, `<circle>`, `<polygon>`, ...), correctly sized, that the user can swap later. Examples:
  an Earth texture is green blobs on a blue field at 2:1; a landscape vignette is a blue sky
  rectangle, a green ground rectangle, brown-trunk + green-triangle trees, and a yellow sun disc.
  Include a `<!-- PLACEHOLDER -->` comment and a visible marker (dashed border/label).
  Procedure + recipes + default sizes: `.github/skills/create-placeholder-svg`.
- **Sound effects** (clicks, notifications, milestone stings, ambient beds) → a short, basic
  **placeholder WAV** (a brief synthesised tone of the right category/length), generated with the
  no-dependency Node script in `.github/skills/create-placeholder-audio`, at the path the code
  references.

Placeholders must be obvious placeholders, live where the consuming code looks for them, and be
called out in your summary so the user knows to replace them.

## Tauri API calls

Only `SaveService` and `SettingsService` touch Tauri APIs (plugin-store, window, etc.) — no other
service or component. Always guard with `const isTauri = '__TAURI__' in window;` and provide a
`localStorage` fallback so the app runs in the browser during development. → **ARCHITECTURE.md ›
Tauri integration points**.

---

## What to do when a prompt is ambiguous

1. Implement the most reasonable interpretation
2. Add a `// NOTE:` comment explaining your interpretation
3. Add a `// TODO:` comment if something was intentionally left as a stub
4. Never ask clarifying questions mid-generation — complete the file, note assumptions

## What never to do

- Never use `any`
- Never use `document.querySelector` in a service
- Never subscribe to Observables without unsubscribing (prefer signals; if Observable is
  necessary, use `takeUntilDestroyed()`)
- Never hardcode game data in TypeScript — all content comes from JSON in `src/data/`
- Never put `providedIn: 'root'` on a service that should be feature-scoped
- Never write a component longer than ~200 lines — split it
- Never block a feature on missing art or sound — generate a placeholder asset instead (see
  "Placeholder assets")
