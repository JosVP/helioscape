# AGENTS.md — Helioscape AI Agent Instructions

You are an expert Angular developer working on Helioscape, a space civilisation strategy game.
Read this file and ARCHITECTURE.md before responding to any prompt.

---

## Your role

You write production-quality Angular code for a real shipped game. You are not writing tutorials
or examples. Every file you produce must be complete, correctly typed, and integrate with the
existing architecture without requiring manual fixes.

---

## Angular version and standards

Use the latest stable Angular. All code must use:

- **Standalone components** — no NgModules, no CommonModule imports
- **Signals** — `signal()`, `computed()`, `effect()` for all reactive state
- **New control flow** — `@if`, `@for`, `@switch` in templates, never `*ngIf` or `*ngFor`
- **`inject()`** — always use `inject()` for dependency injection, never constructor parameters
- **`input()` and `output()`** — for component I/O, not `@Input()`/`@Output()` decorators
- **`input.required()`** — for required inputs
- **TypeScript strict mode** — no `any`, no `!` non-null assertions unless absolutely necessary
  with an explanatory comment, no implicit returns

```ts
// CORRECT
@Component({ standalone: true, ... })
export class PlanetPanelComponent {
  private gameState = inject(GameStateService);
  planetId = input.required<string>();
  panelClosed = output<void>();
  
  planet = computed(() => this.gameState.planets()[this.planetId()]);
}

// WRONG — never do this
@Component({ ... })
export class PlanetPanelComponent {
  @Input() planetId: string;
  @Output() panelClosed = new EventEmitter();
  constructor(private gameState: GameStateService) {}
}
```

---

## TypeScript standards

- Strict null checks always on
- Explicit return types on all public methods and functions
- Interfaces for all data shapes, no inline object types on public APIs
- `readonly` on all service signals
- `const` over `let` wherever possible
- Named exports, not default exports (except for lazy-loaded routes if needed)
- Type imports: `import type { Foo } from './foo'` when only used as a type

```ts
// CORRECT
export interface PlanetState {
  readonly id: string;
  readonly atmospherePressure: number;
  readonly temperatureCelsius: number;
  readonly terraformingPhase: number;
}

// WRONG
export type PlanetState = {
  id: string,
  atmospherePressure: any,
}
```

---

## Service patterns

All services are `providedIn: 'root'` singletons unless explicitly stated otherwise.

**State services** — hold signals, expose readonly views, provide mutation methods:

```ts
@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Private writable signals
  private readonly _gameYear = signal(2033);
  private readonly _isPaused = signal(false);
  
  // Public readonly signals
  readonly gameYear = this._gameYear.asReadonly();
  readonly isPaused = this._isPaused.asReadonly();
  
  // Mutation methods
  setYear(year: number): void {
    this._gameYear.set(year);
  }
  
  togglePause(): void {
    this._isPaused.update(p => !p);
  }
}
```

**System services** — contain game logic, react to state changes via `effect()`:

```ts
@Injectable({ providedIn: 'root' })
export class TerraformingService {
  private gameState = inject(GameStateService);
  private gameLoop = inject(GameLoopService);
  
  constructor() {
    // React to game year changes
    effect(() => {
      const year = this.gameLoop.currentYear();
      // untracked to avoid circular dependencies
      untracked(() => this.processYear(year));
    });
  }
}
```

**Never** put game logic in components. Components read state and call service methods. That is all.

---

## Component patterns

```ts
@Component({
  selector: 'app-planet-panel',
  standalone: true,
  imports: [CommonModule], // only if needed — prefer specific imports
  template: `
    @if (planet(); as p) {
      <div class="planet-panel">
        <h2 class="planet-panel__title">{{ p.displayName }}</h2>
        
        @for (tech of availableTechs(); track tech.id) {
          <app-tech-node [techId]="tech.id" />
        }
      </div>
    }
  `,
  styles: [`
    .planet-panel { padding: var(--space-md); }
    .planet-panel__title { font-family: var(--font-mono); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanetPanelComponent {
  private techTree = inject(TechTreeService);
  
  planetId = input.required<string>();
  
  planet = computed(() => 
    inject(GameStateService).planets()[this.planetId()]
  );
  
  availableTechs = computed(() =>
    this.techTree.getAvailableFor(this.planetId())
  );
}
```

- **Always** use `ChangeDetectionStrategy.OnPush`
- **Always** use `track` in `@for` loops
- Keep templates thin — computed signals in the class, not inline template expressions
- One component per file
- BEM naming for CSS classes: `block__element--modifier`

---

## CSS standards

- **CSS custom properties** for all design tokens — never hardcode colours, fonts, or spacing
- **No inline styles** except when driven by dynamic values (hue rotation, bar width)
- Dynamic values via CSS custom properties set in the component class:

```ts
// Setting a dynamic CSS value
this.elementRef.nativeElement.style.setProperty('--bar-width', `${percent}%`);
```

```css
.atmosphere-bar__fill {
  width: var(--bar-width, 0%);
  transition: width 1s linear; /* tick-driven: always linear */
}

.atmosphere-bar--initial-load .atmosphere-bar__fill {
  transition: width 0.8s ease-out; /* first open: ease-out */
}
```

- **SCSS** for all stylesheets (project is configured for SCSS)
- Component styles are scoped — no need for deep selectors
- Global tokens defined in `styles/tokens.scss`, imported globally
- No magic numbers — reference a token or explain the value in a comment

---

## File and folder naming

```
kebab-case for all files and folders
feature-name.component.ts
feature-name.service.ts
feature-name.model.ts     ← interfaces and types
feature-name.pipe.ts
feature-name.directive.ts
```

---

## Game-specific rules

**Pure value derivation** — all visual values that change over time are computed from `gameYear`,
never stored as animation state:

```ts
// CORRECT — pure function, safe to call on load
getAtmospherePressure(planet: PlanetState, year: number): number {
  const t = clamp((year - planet.startYear) / (planet.endYear - planet.startYear), 0, 1);
  return lerp(planet.startPressure, planet.targetPressure, t);
}

// WRONG — stores transition state separately from game year
startTransition(from: number, to: number, durationMs: number): void { ... }
```

**No setTimeout/setInterval in components** — only in `GameLoopService`.

**No direct DOM manipulation in services** — services update signals, components react.

**Canvas components** (OrreryComponent, MercuryGridComponent) own their RAF loop:
- Start RAF in `ngAfterViewInit`
- Cancel RAF in `ngOnDestroy`
- Pause RAF when component is hidden (`document.hidden` or `@if` destroying the component)
- Never let Three.js or canvas logic touch Angular signals directly from inside RAF —
  read signals into local variables at the top of the RAF callback

```ts
private animate(): void {
  this.animationId = requestAnimationFrame(() => this.animate());
  
  // Read signals once at top — never call signal getters mid-render
  const year = this.gameLoop.currentYear();
  const planets = this.gameState.planets();
  
  this.updateScene(year, planets);
  this.renderer.render(this.scene, this.camera);
}
```

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

