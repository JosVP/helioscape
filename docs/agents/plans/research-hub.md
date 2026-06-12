# Technical Implementation Plan: Research Hub (Block 7.2)

## 1. Architecture & Strategy

### System context

The Research Hub is a **full-screen overlay** mounted inside `GameShellComponent` that shows the
entire civilisation tech tree across three planet columns (Mars | Earth+Moon | Venus). It replaces
the per-planet `TechTreeComponent` stub that currently lives in the planet-panel tab. The overlay
is triggered from a new HUD button (left of `TimeControlsComponent`) and from within the Earth
planet panel. It depends on all Block 0–3 work (models, GameStateService, TechTreeService,
DataService) and the existing `EventBusService`. Block 7.3 (ForkChoiceModalComponent) is a direct
downstream dependent.

### Architecture diagram

```mermaid
graph TD
  GS[GameStateService\ncompletedTechs / pendingFork] -->|computed| RH[ResearchHubComponent]
  DS[DataService\ngetTechNodesForPlanet] --> RH
  TS[TechTreeService\ncanUnlock / unlockTech] --> RH
  EB[EventBusService\ntechUnlocked$ / researchHubRequested$] --> RH
  RH --> NC[TechNodeCardComponent]
  RH --> FM[ForkChoiceModalComponent stub]
  HUD[HudComponent] -->|researchHubRequested$.next| EB
  GS2[GameShellComponent\nisResearchHubOpen signal] -->|@if| RH
```

### Key design decisions

- **Overlay, not a route**: `ResearchHubComponent` is an `@if`-rendered overlay inside
  `GameShellComponent`, managed by `isResearchHubOpen = signal(false)`. Consistent with the
  existing culture-event and pause-menu overlay pattern.

- **Three columns only (Mercury excluded)**: Mercury nodes serve as prerequisite gates internally
  but are never rendered. The grid shows Mars | Earth+Moon | Venus. Mercury `completedTechs` IDs
  remain in `GameStateService` and are checked by `TechTreeService.canUnlock()` as normal.

- **Mars/Venus columns are read-only spillover displays**: Mars and Venus columns show only nodes
  that belong to those planets AND that have been *completed* or are *hinted* — they are
  non-interactive progress markers. Their purpose is to show the player that terraforming
  milestones on those planets are what unlock Earth research nodes (via spillover lines).
  Clicking a Mars/Venus node does nothing. Only Earth and Moon nodes are interactive.

- **Node visibility tiers** (computed per node, pure function of `completedTechs` + `canUnlock()`):
  - `completed` — in `completedTechs[]`
  - `available` — `TechTreeService.canUnlock()` returns true
  - `hint` — not available/completed, but at least one direct prereq or spilloverPrereq is in `completedTechs[]`
  - `hidden` — not rendered at all

- **SVG connector lines**: an `<svg>` overlay (absolute, pointer-events: none, 100% width/height)
  sits over the node grid. Lines are redrawn after every `techUnlocked$` event and on overlay open.
  Within-column lines: solid cubic bezier in the column's planet accent colour. Cross-column
  spillover lines: dashed, in the *source* planet's accent colour.

- **"New" badge**: local `signal<Set<string>>` for newly unlocked node IDs, cleared after 2s via
  `setTimeout`. All timer handles stored in an array and cleared in `ngOnDestroy`.

- **Architect branch data gap**: the architect branch nodes described in
  `docs/GDD/earth-tech-tree-options.md` do not yet exist in `public/data/tech-tree.json`. Adding
  them is a prerequisite data step in Milestone 0, before the UI can render both branches.

### Data flow

```
DataService.getTechNodesForPlanet(planetId)     — called once per column on open
GameStateService.completedTechs()               — reactive dependency for computed nodeStates
TechTreeService.canUnlock(planetId, nodeId)     — called inside computed() for each visible node
EventBusService.techUnlocked$                  — triggers "new" badge and line redraw
EventBusService.researchHubRequested$           — new Subject; triggers overlay open
GameStateService.pendingFork()                  — drives @if for ForkChoiceModalComponent
```

No `effect()` in this component — reactivity is achieved entirely through `computed()` signals
derived from `completedTechs`. The "new" badge is the only setTimeout use, which is UI-only and
acceptable per the AGENTS.md pattern.

### Patterns & conventions to follow

- Standalone + OnPush; `@if`/`@for` with `track`; `inject()`; `input()`/`output()`; strict types.
- `takeUntilDestroyed()` on all EventBus subscriptions.
- All content from JSON via DataService — no hardcoded node data.
- `ResizeObserver` on the grid container for line redraws — cleaned up in `ngOnDestroy`.
- Design tokens only in SCSS — no hardcoded colours.
- Node cards under ~100 lines; split sub-components if they grow.

---

## 2. Subtasks

### Milestone 0 — Pre-work (data + tokens + EventBus)

- [ ] `public/data/tech-tree.json` — Add 7 architect branch nodes for Earth:
  `earth_vertical_megacity`, `earth_arcology_framework`, `earth_subsurface_city`,
  `earth_planetary_resource_grid`, `earth_geoengineering_bureau`,
  `earth_neural_digital_integration`, `earth_planetary_coordination_network`.
  Also add `earth_automated_food_systems` as the shared fork node.
  Each node needs: `id`, `planet: "earth"`, `displayName`, `prerequisites[]`,
  `spilloverPrerequisites: []`, `rpCost`, `durationYears`, `effects[]` (use `tag_decision`
  for architect-tagged nodes).
  **Pitfall**: the fork effect (`present_fork`) on `earth_automated_food_systems` requires
  `forkId` and `choices[]` in the effects array — follow the existing `TechEffect` model exactly.

- [ ] `src/styles/tokens.scss` — Add `--color-moon: #5a5a6a` to the Planet accents section.
  (No existing moon colour token — required for Moon sub-section header and hint lines.)

- [ ] `src/app/core/services/event-bus.service.ts` — Add `readonly researchHubRequested$ = new Subject<void>()` with a JSDoc comment. No other changes.

### Milestone 1 — TechNodeCardComponent

- [ ] `src/app/features/research-hub/tech-node-card/tech-node-card.component.ts`

  Inputs:
  ```ts
  node        = input.required<TechNode>()
  visibility  = input.required<'completed' | 'available' | 'hint'>()
  isNew       = input<boolean>(false)
  planetId    = input.required<string>()   // for canUnlock call on click
  interactive = input<boolean>(true)       // false for Mars/Venus display nodes
  ```
  Output: `nodeClicked = output<string>()` — emits `node().id` when clicked and `interactive()` is true.

  Computed:
  - `displayName = computed(() => this.visibility() === 'hint' ? '???' : this.node().displayName)`
  - `showDetails = computed(() => this.visibility() !== 'hint')`
  - `prereqSummary` — array of `{ id, label, met: boolean }` for tooltip display; only computed when `showDetails()` is true.

  Template structure:
  ```html
  <div class="tech-node" [class]="'tech-node--' + visibility()" [attr.data-node-id]="node().id">
    <span class="tech-node__new-badge" @if="isNew()">New</span>
    <div class="tech-node__icon">
      <!-- hint: silhouette circle placeholder; else: planet icon or generic icon -->
    </div>
    @if (showDetails()) {
      <div class="tech-node__name">{{ displayName() }}</div>
      <div class="tech-node__cost">{{ node().rpCost }} RP · {{ node().durationYears }}yr</div>
    }
    @if (!showDetails()) {
      <div class="tech-node__name tech-node__name--hint">???</div>
    }
  </div>
  ```

  CSS classes (in `.component.scss`):
  - `.tech-node--completed`: accent fill, dimmed border, no hover
  - `.tech-node--available`: accent border, pointer cursor, hover glow
  - `.tech-node--hint`: all grey, silhouette icon (SVG circle with clip-path), no interaction

  "New" badge + animated border (on host when `isNew()` is true):
  ```scss
  .tech-node--new::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: conic-gradient(var(--color-accent-glow), var(--color-accent-dim), var(--color-accent-glow));
    animation: gradient-spin 0.8s linear infinite;
    z-index: -1;
  }
  @keyframes gradient-spin {
    to { transform: rotate(360deg); }
  }
  ```

  **Pitfall**: `data-node-id` must be on the host element (or a stable inner container) so the
  SVG line code can reliably query it. Use the host element.

- [ ] `tech-node-card.component.spec.ts` — test that visibility `'hint'` renders `???`; `'completed'` renders displayName; `interactive: false` does not emit nodeClicked.

### Milestone 2 — ForkChoiceModalComponent stub

- [ ] `src/app/features/research-hub/fork-choice-modal/fork-choice-modal.component.ts`

  Minimal stub. Block 7.3 owns the full implementation.
  ```ts
  @Component({
    selector: 'app-fork-choice-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<div class="fork-modal-stub">Fork choice — Block 7.3</div>',
  })
  export class ForkChoiceModalComponent {
    readonly fork = input.required<PendingFork>();
  }
  ```

### Milestone 3 — ResearchHubComponent

- [ ] `src/app/features/research-hub/research-hub.component.ts`

  Injections: `GameStateService`, `DataService`, `TechTreeService`, `EventBusService`, `DestroyRef`.

  **Signals / computed:**
  ```ts
  private readonly completedTechs = this.gameState.completedTechs;
  private readonly pendingFork    = this.gameState.pendingFork;

  // All nodes per planet, loaded once (DataService is immutable post-init)
  private readonly marsNodes  = this.data.getTechNodesForPlanet('mars');
  private readonly earthNodes = this.data.getTechNodesForPlanet('earth');
  private readonly moonNodes  = this.data.getTechNodesForPlanet('moon');
  private readonly venusNodes = this.data.getTechNodesForPlanet('venus');

  // Visibility maps — recomputed whenever completedTechs changes
  readonly marsStates  = computed(() => this._buildColumnStates(this.marsNodes,  false));
  readonly earthStates = computed(() => this._buildColumnStates(this.earthNodes, true));
  readonly moonStates  = computed(() => this._buildColumnStates(this.moonNodes,  true));
  readonly venusStates = computed(() => this._buildColumnStates(this.venusNodes, false));

  readonly newlyUnlockedIds = signal<ReadonlySet<string>>(new Set());
  readonly showForkModal = computed(() => {
    const f = this.pendingFork();
    // Only show if the fork is for an earth or moon node (the interactive planets)
    return f !== null && (f.planetId === 'earth' || f.planetId === 'moon');
  });
  ```

  **`_buildColumnStates(nodes, interactive)`**: pure function returning
  `Map<string, { node: TechNode, visibility: NodeVisibility, interactive: boolean }>`.
  Filters out `hidden` nodes. Sort by `tier ?? 0` then by prerequisite depth for consistent
  top-to-bottom ordering within the column.

  **`_getVisibility(node, completed, canUnlockFn)`**: pure helper, no side effects.

  **EventBus subscription** (in constructor):
  ```ts
  this.eventBus.techUnlocked$
    .pipe(takeUntilDestroyed())
    .subscribe(({ nodeId }) => {
      // Add to newlyUnlocked set
      this.newlyUnlockedIds.update(s => new Set([...s, nodeId]));
      const handle = setTimeout(() => {
        this.newlyUnlockedIds.update(s => { const n = new Set(s); n.delete(nodeId); return n; });
      }, 2000);
      this._newBadgeTimers.push(handle);
      // Schedule line redraw
      this._scheduleLineRedraw();
    });
  ```

  **SVG lines:**
  ```ts
  @ViewChild('gridContainer') private gridContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('svgOverlay')    private svgOverlayRef!: ElementRef<SVGElement>;
  private _resizeObserver: ResizeObserver | null = null;
  private _lineRedrawScheduled = false;
  private _newBadgeTimers: ReturnType<typeof setTimeout>[] = [];

  ngAfterViewInit(): void {
    this._resizeObserver = new ResizeObserver(() => this._scheduleLineRedraw());
    this._resizeObserver.observe(this.gridContainerRef.nativeElement);
    this._scheduleLineRedraw();
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
    this._newBadgeTimers.forEach(clearTimeout);
  }

  private _scheduleLineRedraw(): void {
    if (this._lineRedrawScheduled) return;
    this._lineRedrawScheduled = true;
    requestAnimationFrame(() => {
      this._lineRedrawScheduled = false;
      this._drawLines();
    });
  }
  ```

  **`_drawLines()`**: reads all `[data-node-id]` elements via
  `this.gridContainerRef.nativeElement.querySelectorAll('[data-node-id]')`,
  builds a `Map<nodeId, DOMRect>` of bounding rects relative to the grid container,
  then for each visible node's prerequisites and spilloverPrerequisites that are also visible,
  draws a `<path>` element (cubic bezier) on the SVG overlay.

  Cross-column lines (source planet !== target planet): add `stroke-dasharray="6 4"` and use the
  source node's planet accent colour (`--color-mars`, `--color-earth`, `--color-venus`,
  `--color-moon`). Within-column lines: solid, same colour.

  **Line path formula** (vertical layout within a column, left-to-right between columns):
  - Within-column: `M cx1,bottom1 C cx1,midY cx2,midY cx2,top2` (S-curve downward)
  - Cross-column: `M right1,cy1 C midX,cy1 midX,cy2 left2,cy2` (horizontal S-curve)

  **Pitfall**: call `getBoundingClientRect()` on node elements and subtract the grid container's
  own `getBoundingClientRect()` to get relative positions. Do NOT use `offsetTop`/`offsetLeft`
  (unreliable with CSS transforms).

  **On node click** (handler receives nodeId from `TechNodeCardComponent` output):
  ```ts
  onNodeClick(nodeId: string, planetId: string): void {
    this.techTreeService.unlockTech(planetId, nodeId);
    // TechTreeService emits techUnlocked$ if successful → our subscription handles badge + redraw
  }
  ```

- [ ] `research-hub.component.html` structure:
  ```html
  <div class="research-hub__backdrop" (click)="close()"></div>
  <div class="research-hub__panel">

    <!-- Header -->
    <div class="research-hub__header">
      <div class="research-hub__header-text">
        <h2 class="research-hub__title">Research Hub</h2>
        <p class="research-hub__subtitle">
          <!-- one sentence: what the player does here — see note on narrator voice -->
        </p>
      </div>
      <div class="research-hub__vignette">
        <img src="/assets/svg/vignettes/research-hub.svg" alt="" aria-hidden="true" />
      </div>
      <button class="research-hub__close" (click)="close()">✕</button>
    </div>

    <!-- Three-column grid -->
    <div class="research-hub__grid" #gridContainer>
      <svg class="research-hub__lines" #svgOverlay aria-hidden="true"></svg>

      <!-- Mars column (read-only) -->
      <div class="research-hub__column research-hub__column--mars">
        <div class="research-hub__column-header">
          <img src="/assets/svg/planets/mars.svg" ... />
          <span>Mars</span>
        </div>
        @for (entry of marsStates() | keyvalue; track entry.key) {
          <app-tech-node-card [node]="entry.value.node" [visibility]="entry.value.visibility"
            [interactive]="false" [isNew]="newlyUnlockedIds().has(entry.key)"
            planetId="mars" />
        }
      </div>

      <!-- Earth + Moon column (interactive) -->
      <div class="research-hub__column research-hub__column--earth">
        <div class="research-hub__column-header">
          <img src="/assets/svg/planets/earth.svg" ... />
          <span>Earth</span>
        </div>
        @for (entry of earthStates() | keyvalue; track entry.key) {
          <app-tech-node-card ... (nodeClicked)="onNodeClick($event, 'earth')" />
        }
        <!-- Moon sub-section -->
        <div class="research-hub__moon-header">
          <img src="/assets/svg/planets/moon.svg" ... />
          <span>Moon</span>
        </div>
        @for (entry of moonStates() | keyvalue; track entry.key) {
          <app-tech-node-card ... (nodeClicked)="onNodeClick($event, 'moon')" />
        }
      </div>

      <!-- Venus column (read-only) -->
      <div class="research-hub__column research-hub__column--venus">
        <div class="research-hub__column-header">
          <img src="/assets/svg/planets/venus.svg" ... />
          <span>Venus</span>
        </div>
        @for (entry of venusStates() | keyvalue; track entry.key) {
          <app-tech-node-card [interactive]="false" ... />
        }
      </div>
    </div>

    <!-- Fork modal (Block 7.3 stub) -->
    @if (showForkModal() && pendingFork() !== null) {
      <app-fork-choice-modal [fork]="pendingFork()!" />
    }

  </div>
  ```

  **Narrator voice** for the subtitle paragraph: "Every idea that has carried us further began
  here. Expand what we know, and open new paths for the worlds we are building."

- [ ] `research-hub.component.scss`:
  - `.research-hub__backdrop`: `position: fixed; inset: 0; background: var(--color-bg-overlay); z-index: 100`
  - `.research-hub__panel`: `position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--color-bg-surface); z-index: 101; overflow: hidden`
  - `.research-hub__header`: flex row, header-text left, vignette right (max 200px wide)
  - `.research-hub__grid`: flex row, gap `var(--space-lg)`, overflow-x auto, flex: 1, position: relative
  - `.research-hub__lines`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none`
  - Column backgrounds at low opacity (8–12%): `.research-hub__column--mars { background: color-mix(in srgb, var(--color-mars) 10%, transparent) }` etc.
  - `.research-hub__moon-header`: same pattern as column header but smaller, margin-top `var(--space-lg)`

- [ ] `research-hub.component.spec.ts` — test that completed nodes render without "New" badge; that `pendingFork` matching earth triggers fork modal; that `hidden` nodes are absent from DOM.

### Milestone 4 — HUD Research Hub button

- [ ] `src/app/features/hud/hud.component.ts` — inject `EventBusService`. Add method:
  ```ts
  openResearchHub(): void {
    this.eventBus.researchHubRequested$.next();
  }
  ```
  No new signals needed here.

- [ ] `src/app/features/hud/hud.component.html` — add button to `.hud__right`, before `<app-time-controls>`:
  ```html
  <button class="hud__research-btn" (click)="openResearchHub()" title="Research Hub">
    ⚗
  </button>
  ```
  (Icon is a placeholder — the `ui-ux-specialist` can refine to an SVG icon.)

- [ ] `src/app/features/hud/hud.component.scss` — `.hud__research-btn`: styled as a small icon button consistent with existing HUD controls; uses `var(--color-accent)` on hover.

### Milestone 5 — GameShell wiring + PlanetPanel cleanup

- [ ] `src/app/features/game-shell/game-shell.component.ts`:
  - Add `readonly isResearchHubOpen = signal(false)`
  - Subscribe to `eventBus.researchHubRequested$` in `ngOnInit`:
    ```ts
    this.eventBus.researchHubRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.isResearchHubOpen.set(true));
    ```
  - Add `closeResearchHub(): void { this.isResearchHubOpen.set(false); }`
  - Import `ResearchHubComponent`

- [ ] `src/app/features/game-shell/game-shell.component.html` — add overlay at the end of the template (after pause menu):
  ```html
  @if (isResearchHubOpen()) {
    <app-research-hub (closed)="closeResearchHub()" />
  }
  ```

- [ ] `src/app/features/planet-panel/planet-panel.component.ts` + `.html`:
  Remove the `'tech-tree'` tab and its associated `<app-tech-tree>` usage. The tech-tree tab is
  replaced by an "Open Research Hub" button in the panel header. The button emits
  `eventBus.researchHubRequested$.next()` directly from the planet panel component.
  **Pitfall**: `PlanetPanelTab` type currently includes `'tech-tree'` — remove it and update the
  default tab to `'overview'`.

- [ ] `src/app/features/planet-panel/tech-tree/tech-tree.component.ts` — delete this stub file
  (it is no longer imported anywhere after the planet panel cleanup above).

---

## 3. Assets (placeholders)

- [ ] `public/assets/svg/vignettes/research-hub.svg` — research lab / researchers vignette,
  `viewBox 0 0 320 240` (4:3) — placeholder (`create-placeholder-svg`). Suggested composition:
  dark background, three rectangular "workstation" shapes, circular "screen" elements glowing
  amber, simple human silhouettes seated. Include `<!-- PLACEHOLDER -->` comment and a visible
  dashed border label.

---

## 4. Cross-cutting concerns

### Save / load safety

The `newlyUnlockedIds` signal is local component state — intentionally not persisted. On load,
no nodes show the "New" badge. This is correct behaviour.

### Scrolling + line redraw

The `.research-hub__grid` can overflow horizontally on small screens. The SVG overlay uses
`position: absolute` within the grid container (which must have `position: relative`). Lines
are computed relative to the grid container, not the viewport — this handles the scroll case
correctly because `getBoundingClientRect()` is called on node elements and then offset by the
grid container's rect. **Re-check this after implementing**: if the grid is scrollable, the
rects must be computed *before* scrolling is applied, or the scroll offset must be added.

### `KeyValuePipe` vs iteration order

`Map<string, ...>` iteration preserves insertion order (JS spec). `_buildColumnStates` must
insert nodes in render order (by tier, then by prerequisite depth) so `@for` + `keyvalue`
produces the correct visual top-to-bottom sequence. Do NOT rely on JSON file order.

### Strictness / types

- `NodeVisibility` should be a union type defined in the component file, not in models (it is
  purely a UI concern).
- All `querySelectorAll` results must be typed as `NodeListOf<HTMLElement>`.
- SVG `<path>` elements created via `document.createElementNS('http://www.w3.org/2000/svg', 'path')`.

### Naturalist / Architect branch visual distinction

The `tag_decision` effect on nodes determines their branch affiliation. For now, render a small
coloured tag dot on the node card:
- naturalist → `var(--color-tag-naturalist)` dot (already in tokens)
- architect → `var(--color-tag-architect)` dot (already in tokens)
- shared / untagged → no dot

Full swim-lane separation within the Earth column (naturalist lane vs architect lane) is a
post-playtest visual polish task — not in scope for this block.

---

## 5. Verification checklist

- [ ] `ng build` clean — no TS errors
- [ ] `ng test` (Vitest) green — node card visibility, fork modal conditional, hidden nodes absent
- [ ] Manual: open Research Hub from HUD button — overlay appears
- [ ] Manual: open Research Hub from Earth planet panel button — overlay appears
- [ ] Manual: complete a tech node — "New" badge appears and disappears after ~2s; animated border visible
- [ ] Manual: SVG lines drawn between connected nodes; spillover lines are dashed in source planet colour
- [ ] Manual: hint nodes show silhouette + `???`; hidden nodes not in DOM
- [ ] Manual: Mars/Venus nodes not clickable; clicking Earth node calls `unlockTech`
- [ ] Manual: if `pendingFork` is set for an Earth node, fork modal stub appears
- [ ] Manual: close button and backdrop click both dismiss the overlay
- [ ] Manual: overlay visible on narrow viewport — grid scrolls horizontally, lines stay correct
- [ ] Manual: `ng build` still clean after PlanetPanel tech-tree tab removal
