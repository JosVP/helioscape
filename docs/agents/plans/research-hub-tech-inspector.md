# Technical Implementation Plan: Research Hub Tech Inspector

## 1. Architecture & Strategy

### System context

This is Block 20-4, following timed RP-capacity research and Block 20-3 completion-year tracking. It changes the Research Hub interaction model from click-to-start to click-to-select plus an explicit Start Research action, while keeping research state in `GameStateService` and start mutations in `ResearchService`.

The current implementation has the controlling behavior in `ResearchHubComponent.onNodeClick()`, which immediately calls `ResearchService.startTechTrack()`. The implementation should move that call into a new inspector Start button and make cards selectable even when completed, in progress, needs capacity, or hint-visible.

### Architecture diagram

```mermaid
graph TD
  DATA[public/data/tech-tree.json] --> DS[DataService]
  DS --> RH[ResearchHubComponent]
  GS[GameStateService signals] --> RH
  GS --> INSP[TechNodeInspectorComponent]
  RH -->|selected NodeEntry| INSP
  RH -->|input state| CARD[TechNodeCardComponent]
  CARD -->|nodeSelected| RH
  ICON[TechNodeIconComponent] --> CARD
  ICON --> INSP
  INSP -->|startRequested| RH
  RH -->|startTechTrack(node.id, node.planet)| RS[ResearchService]
  RS --> GS
  RS --> EB[EventBusService]
```

### Key design decisions

- **Selection state belongs to `ResearchHubComponent`**: keep `selectedNodeId = signal<string | null>(null)` local to the overlay. This state is UI-only, not saved, and should be derived into `selectedEntry` from visible node maps.
- **Inspector is a presentational component with one output**: it receives a precomputed view model from ResearchHub and emits `startRequested`. It should not inject `ResearchService` or duplicate unlock rules.
- **Extract the icon before building inspector**: `TechNodeCardComponent` currently owns inline SVG. Extracting `TechNodeIconComponent` avoids duplicated markup and keeps prompt requirement 6 honest.
- **Hint nodes remain limited**: hint-visible nodes can be selected so players understand prerequisites, but inspector must not reveal `description` or `outcomeSummary` for them.
- **Mars/Venus remain read-only for starting research**: the prompt asks for Mars/Venus stacked in a left rail and completed nodes readable. They can be selected for inspection, but Start Research should only show when `ResearchService.canStartTechTrack()` says true; current data likely only makes Earth/Moon interactive starts.
- **Close the now-unblocked TODO only if implemented**: adding `researchTrackStarted$` is ready because `startTechTrack()` exists. Include it as a small subtask in this plan because Start Research is being centralized, but move the TODO to Completed only during implementation.

### Data flow

- `ResearchHubComponent` reads `completedTechs`, `completedResearchYears`, `activeResearch`, `gameYear`, `usedRpCapacity`, and `totalRpCapacity` from `GameStateService` through computed view-model builders.
- `ResearchHubComponent` calls `ResearchService.startTechTrack(node.id, node.planet)` only from `onStartSelectedNode()` after checking the selected node view model is startable.
- `ResearchService` remains the gatekeeper for actual start/resume behavior; UI checks are for display and disabled-button state only.
- Progress, ETA, and estimated completion are pure derivations from `gameYear`, `startYear`, `elapsedBeforeStart`, `durationYears`, and `rpCost`; no UI progress state is stored.
- No new persistent state is needed. Completed-year display reads `completedResearchYears[node.id]` when present.

### Patterns & conventions to follow

- Standalone + OnPush components; `input()` / `output()`; `@if` / `@for` with `track`.
- Keep all player-facing tech copy in `public/data/tech-tree.json`; no hardcoded description or outcome text in TypeScript.
- CSS uses existing tokens only. If a missing token is truly needed, add it to `src/styles/tokens.scss` rather than hardcoding values.
- No timers, subscriptions, or DOM listeners in new inspector/icon components.
- Keep line redraw cleanup: `ResizeObserver.disconnect()` and existing `requestAnimationFrame` scheduling pattern must remain intact.

---

## 2. Subtasks

### Milestone 1 — Data Model and Tech Copy

- [ ] `src/app/core/models/tech-tree.model.ts` — add required fields to `TechNode`:
  - `description: string`
  - `outcomeSummary: string[]`
  - Pitfall: make fields required only after JSON is fully populated so strict typing catches missing nodes.
  - Test impact: any spec fixture creating `TechNode` must add these fields.

- [ ] `public/data/tech-tree.json` — populate all 54 existing tech nodes with narrator-voiced descriptions and scan-friendly outcome summaries.
  - Earth: 18 nodes, Moon: 8, Mercury: 13, Mars: 9, Venus: 6.
  - Use `effects[]`, prerequisites, spillover prerequisites, and GDD docs to describe real gains.
  - For `emit_event`, mention the narrative event only when player-visible.
  - For `tag_decision`, include Naturalist/Architect branch consequence.
  - For `present_fork`, explain that a choice follows research completion.
  - For `rp_capacity_boost`, state the capacity gain in player terms.
  - Pitfall: Prettier may expand JSON arrays/objects; that is expected.

- [ ] Spec fixtures — update `TechNode` mocks in affected specs, especially `tech-node-card.component.spec.ts`, `tech-tree.service.spec.ts`, and any Research Hub spec added below.

### Milestone 2 — Shared Tech Node Icon

- [ ] New `src/app/features/research-hub/tech-node-icon/tech-node-icon.component.ts`.
  - Inputs: `planetId = input.required<string>()`, `visibility = input.required<NodeVisibility>()`, `size = input<'compact' | 'large'>('compact')`.
  - Responsibility: render the current circle/silhouette SVG treatment for both card and inspector.
  - Pitfall: import `NodeVisibility` as type-only from the card or move `NodeVisibility` to a small shared model file if circular imports become awkward.

- [ ] New `tech-node-icon.component.html` / `.scss`.
  - Reuse existing card visuals; do not invent a new icon system.
  - The large variant can scale the same SVG via CSS dimensions.

- [ ] New `tech-node-icon.component.spec.ts`.
  - Assert hint renders a silhouette/question mark.
  - Assert non-hint uses planet color CSS variable.
  - Assert compact/large variants produce stable host classes.

- [ ] `src/app/features/research-hub/tech-node-card/*` — replace inline SVG with `<app-tech-node-icon>`.
  - Keep all existing card tests passing before changing selection semantics.

### Milestone 3 — Selection-First Card Behavior

- [ ] `tech-node-card.component.ts`.
  - Rename output to `nodeSelected = output<string>()` or keep `nodeClicked` but change semantic docs; prefer `nodeSelected` and update all call sites.
  - Add `selected = input<boolean>(false)`.
  - Replace `isClickable` with `isSelectable = computed(() => this.interactive() && this.visibility() !== null)`; because only rendered nodes are passed to cards, selectable states are `completed`, `in_progress`, `available`, `needs_capacity`, and `hint`.
  - `showDetails` stays `visibility() !== 'hint'`.
  - `onSelect()` emits for selectable rendered nodes and never starts research.
  - Keyboard: Enter and Space select; prevent default for Space to avoid page scroll.

- [ ] `tech-node-card.component.html`.
  - `tabindex="0"` and `role="button"` for selectable cards, including completed and hint-visible nodes.
  - `aria-label` should say `Select technology: <name>` or `Select locked technology clue` for hint.
  - Add `aria-pressed` or `aria-current="true"` for selected card; choose one and keep it consistent.
  - Retain tooltip as prerequisite hint only, not primary detail surface.

- [ ] `tech-node-card.component.scss`.
  - Rename/adjust interactive styling to selectable styling.
  - Add `tech-node--selected` state using tokens, not new hardcoded colors.
  - Completed and hint nodes should remain visibly distinct while selectable.

- [ ] `tech-node-card.component.spec.ts`.
  - Update expectations: completed nodes emit selection; available nodes emit selection but do not imply start.
  - Add keyboard selection tests for Enter and Space.
  - Add selected-class/ARIA assertion.
  - Keep hint copy hidden (`???`, no RP/duration) while still selectable when interactive.

### Milestone 4 — Research Hub Selection View Model

- [ ] `research-hub.component.ts`.
  - Add `selectedNodeId = signal<string | null>(null)`.
  - Add `readonly allVisibleEntries = computed(() => new Map([...marsStates(), ...earthStates(), ...moonStates(), ...venusStates()]))`.
  - Add `readonly selectedEntry = computed(() => selectedNodeId() ? allVisibleEntries().get(selectedNodeId()) ?? null : this._defaultSelection())`.
  - Default selection should prefer first available Earth node, then first in-progress, then first completed, then first visible Earth/Moon, then any visible node. This avoids an empty inspector when useful nodes exist.
  - Add `onNodeSelect(nodeId: string): void` to update selection and schedule line redraw if selected styling affects card dimensions.
  - Replace `onNodeClick()` with selection only.
  - Add `onStartSelectedNode(nodeId: string): void` or accept a `TechNode` from inspector; call `ResearchService.startTechTrack(node.id, node.planet)`.
  - After a start, keep the selected node selected so inspector changes to in-progress state as signals update.

- [ ] Build an inspector view model in ResearchHub, not in the inspector:
  - Suggested interface `TechInspectorViewModel` under `research-hub.component.ts` or a new `tech-node-inspector.model.ts` if shared in tests.
  - Fields: node, visibility, planet label, status label, branch tag, canRevealDetails, prerequisites, progressPercent, etaYear, estimatedCompletionYear, completedYear, capacity, canStart, capacityShortfall.
  - `canStart` should use `visibility === 'available' && usedRpCapacity + node.rpCost <= totalRpCapacity`; still call `ResearchService.startTechTrack()` defensively.
  - `estimatedCompletionYear` for available/needs-capacity nodes is `gameYear + durationYears`.
  - In-progress progress uses existing elapsed formula.
  - Completed year uses `completedResearchYears[node.id]` when present; display fallback `Completed` without year if missing.

- [ ] `research-hub.component.html`.
  - Change card outputs to `(nodeSelected)="onNodeSelect($event)"`.
  - Pass `[selected]="selectedEntry()?.node.id === entry.node.id"`.
  - Render `<app-tech-node-inspector [viewModel]="selectedInspectorVm()" (startRequested)="onStartSelectedNode($event)" />` in a right rail.
  - Mars/Venus cards should become selectable/readable (`interactive=true` for selection), but inspector should not show Start unless state permits it.

- [ ] `research-hub.component.spec.ts` — create this missing spec.
  - Use class-only `TestBed.runInInjectionContext(() => new ResearchHubComponent())` where possible for computed state and methods.
  - Mock `ResizeObserver` or avoid fixture lifecycle unless testing DOM selection.
  - Assert selecting a node changes `selectedEntry` and does not call `startTechTrack`.
  - Assert `onStartSelectedNode()` calls `startTechTrack(node.id, node.planet)` only for a startable VM.
  - Assert completed nodes can become selected and expose completed year.
  - Assert needs-capacity state sets `canStart=false` and capacity warning values.

### Milestone 5 — Inspector Component

- [ ] New `src/app/features/research-hub/tech-node-inspector/tech-node-inspector.component.ts`.
  - Inputs: `viewModel = input<TechInspectorViewModel | null>(null)`.
  - Output: `startRequested = output<string>()` where payload is `node.id`.
  - Computed helpers only for display formatting; no `GameStateService`, `DataService`, or `ResearchService` injection.
  - `onStart()` emits only when `viewModel()?.canStart === true`.

- [ ] New `tech-node-inspector.component.html`.
  - Empty state: short, quiet prompt to select a visible node.
  - Always show icon, title, planet, status for non-null VM.
  - Show branch tag when present.
  - Show locked/hint limited view: prerequisite clues with met/unmet state, status, and no description/outcome/RP detail unless reveal rules later change.
  - Revealed view: description, RP cost, duration, estimated completion year, progress/ETA, completed year, prerequisites, outcome summary list, capacity warning.
  - Start button appears only when `canStart` is true; use `type="button"` and a clear label like `Start research`.

- [ ] New `tech-node-inspector.component.scss`.
  - Persistent right panel style, not modal/card-inside-card.
  - Use full-height panel section inside Research Hub layout, tokenized gaps, and compact headings.
  - On mobile, support bottom drawer/panel via parent layout classes and component width constraints.

- [ ] New `tech-node-inspector.component.spec.ts`.
  - Completed VM renders `Completed in Year X` and no Start button.
  - In-progress VM renders progress and ETA, no Start button.
  - Needs-capacity VM renders warning and no enabled Start button.
  - Available VM renders Start button and emits once on click.
  - Hint VM does not render description or outcome list.

### Milestone 6 — Research Hub Layout Rework

- [ ] `research-hub.component.html`.
  - Replace current three-column grid with:
    - left rail: Mars column above Venus column.
    - center: Earth tree plus Moon subsection.
    - right: tech inspector.
  - Keep SVG overlay inside the scroll/tree region and verify line drawing still has the correct container.
  - Consider splitting the line-drawing container around only the node columns if inspector should not affect SVG coordinate math.

- [ ] `research-hub.component.scss`.
  - Desktop grid: `Mars/Venus rail | Earth+Moon main | inspector`.
  - Keep Earth/Moon central area wide enough for existing tier rows.
  - Left rail stacks Mars and Venus with compact headers and scroll if needed.
  - Inspector rail is sticky within the overlay scroll where feasible.
  - Narrow layout: single-column or two-row layout where inspector becomes a bottom panel under the tree; no modal.
  - Pitfall: current `research-hub__grid::after` bottom fade spans all columns; update it so it does not obscure the inspector button.

### Milestone 7 — Start EventBus TODO (Small Adjacent Cleanup)

- [ ] `src/app/core/services/event-bus.service.ts`.
  - Add `researchTrackStarted$ = new Subject<{ trackId: string; planetId: string }>();`.
  - This closes the active TODO currently listed in `docs/agents/TODO.md` once implemented.

- [ ] `src/app/core/systems/research.service.ts`.
  - Emit `researchTrackStarted$` after a tech track or research track actually starts/resumes.
  - Do not emit when `canStart...()` fails or when clicking a card merely selects.
  - Existing start behavior and completion behavior stay unchanged.

- [ ] `research.service.spec.ts`.
  - Assert no start event on failed capacity check.
  - Assert event on successful `startTechTrack()` and `startTrack()`.

- [ ] `docs/agents/TODO.md`.
  - Move `Block 20-1 — EventBusService: researchTrackStarted$ subject` from Active to Completed with implementation date after tests pass.

---

## 3. Assets (placeholders)

No new visual or audio assets are required. The inspector reuses the existing inline SVG tech icon treatment via `TechNodeIconComponent`.

---

## 4. Cross-cutting Concerns

### Edge cases & pitfalls

- **Selection must never start research**: card click/keyboard handlers emit selection only. The only start path is the inspector Start button.
- **Completed nodes remain readable**: completed cards must be focusable/selectable and inspector must reveal description/outcomes and completion year when present.
- **Hint nodes are selectable but restricted**: show prerequisite clues/status only; hide description, outcomes, RP cost, and duration unless a later reveal rule explicitly permits it.
- **Needs capacity**: show capacity warning and shortfall; Start button hidden or disabled. Prefer hidden per prompt: button only when available and enough capacity.
- **In progress**: progress/ETA derive from active research; no duplicate Start.
- **Paused active research**: current card logic only computes ETA when not paused. Inspector should show paused status or omit ETA for paused tracks; do not invent resume UI unless current `ResearchService.resume...()` behavior is already exposed by Start button semantics.
- **Mars/Venus read-only ambiguity**: they should be selectable for reading, but not startable unless `ResearchService.canStartTechTrack()` permits it. This avoids hardcoding planet exceptions.
- **Line drawing**: layout changes can break SVG overlay coordinates. Validate after moving Mars/Venus and adding inspector.
- **Dirty tree caution**: Block 20-3 notification changes may still be uncommitted; do not revert or overwrite them.

### Save/load

No new save fields. Inspector selection is ephemeral overlay UI state. Completed-year display reads existing `completedResearchYears`; saves without years should show `Completed` without year.

### Memory & performance

No new timers or subscriptions in inspector/icon. Keep existing `ResizeObserver` cleanup and `_newBadgeTimers` cleanup. For 54 tech nodes, computed maps are fine; avoid repeated deep JSON scans in templates.

### Accessibility & motion

- Cards need keyboard selection for all visible selectable states.
- The inspector Start button must be reachable by Tab and have clear text.
- Use `aria-current` or `aria-pressed` consistently for selected cards.
- Preserve Escape closing the Research Hub.
- Keep motion minimal and tokenized; reveal animation polish belongs to Block 20-5.

---

## 5. Out of Scope / Deferred

- Block 20-3 completion feedback culture-event routing and ordinary notification behavior.
- Block 20-5 reveal animation polish and completion polish.
- Full Block 24 culture-event trigger overhaul.
- New icon art or asset pipeline; reuse/extract the existing inline SVG treatment.
- New persistent inspector selection save/load behavior.
- General research track inspector for non-tech `research-tracks.json`; this prompt targets TechNode cards in the Research Hub.

---

## 6. Verification

- [ ] `npx ng build --no-progress` succeeds.
- [ ] `npx ng test --watch=false` passes.
- [ ] Focused specs pass for `tech-node-card`, `tech-node-icon`, `tech-node-inspector`, `research-hub`, and `research.service` if `researchTrackStarted$` is implemented.
- [ ] Manual check: open Research Hub, click Advanced Renewables; inspector updates and research does not start.
- [ ] Manual check: press Enter and Space on a focused visible node; inspector updates and research does not start.
- [ ] Manual check: click Start Research in inspector for an available node; active research starts and node remains selected with progress/ETA.
- [ ] Manual check: select a completed node; inspector shows details and `Completed in Year X` when completion-year data exists.
- [ ] Manual check: fill RP capacity, select another available node; inspector shows needs-capacity warning and no Start button.
- [ ] Manual check: select a hint node; inspector shows only locked status/prerequisite clues, not description/outcomes.
- [ ] Manual check: desktop layout shows Mars/Venus stacked left, Earth/Moon central, inspector right; narrow viewport keeps inspector as non-modal bottom panel.
- [ ] Ask the user to playtest the flow manually; no automated E2E.

---

## 7. References

- Prompt: `docs/agents/prompts/20-4-research-hub-tech-inspector.txt`
- Architecture: `docs/agents/ARCHITECTURE.md`
- Standards: `AGENTS.md`
- GDD: `docs/GDD/main-gdd.md`
- Earth tech branches: `docs/GDD/earth-tech-tree-options.md`
- Current implementation: `src/app/features/research-hub/research-hub.component.*`, `src/app/features/research-hub/tech-node-card/*`
