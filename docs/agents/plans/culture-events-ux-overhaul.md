# Plan: Culture Events UX Overhaul

**Feature prompt source**: User conversation — 2026-06-13  
**Analyst**: inline (lead-developer mode)  
**Status**: Ready for developer

---

## Problems being solved

| # | Problem | Root cause |
|---|---------|------------|
| 1 | Toast falls behind culture card backdrop | `app-hud` has `z-index: 10` (stacking context) from `game-shell.scss`; `position: fixed` children can be confined by a stacking-context ancestor |
| 2 | Toast stack DOM is inside `app-hud` | Historical placement; `game-shell.component.scss` already has `app-culture-event-toast` selector, anticipating a move |
| 3 | All events auto-show as cards (even text-only ones) | `CultureEventService._tryShowNext()` shows every queue entry unconditionally |
| 4 | Bell dropdown shows no read/unread distinction | `queuedEvents` is a flat list; no history shown; no toggle |
| 5 | Dismissed toasts snap the stack (not smooth) | `visible: false` triggers `translateX(-100%)` exit; element is removed from DOM after `FADE_OUT_MS`, causing sibling toasts to instantly reflow |

---

## Architecture / data flow

```mermaid
graph TD
  GSS[GameStateService\ncultureEventQueue\ncultureEventHistory]
  CES[CultureEventService\n+notificationQueue signal\n+showEvent(eventId)\n modified _tryShowNext]
  Bell[CultureEventBellComponent\nnew - in HUD]
  Stack[CultureEventToastComponent\ntoast stack only - in GameShell]
  Card[CultureEventCardComponent\nunchanged]

  GSS --> CES
  CES --> Bell
  CES --> Stack
  CES --> Card
  Bell -->|showEvent| CES
  Stack -->|showEvent| CES
```

**Key constraint**: `CultureEventEntry` (save format) must not change — all "is this auto-show?" logic is derived at runtime from the event definition via `DataService.getCultureEvent`.

---

## Layers breakdown

### Layer 1 — `GameStateService` (1 new method)

**File**: `src/app/core/services/game-state.service.ts`

**What**: Add `removeEventFromQueue(eventId: string)` — removes the first queue entry with a matching `eventId`. Needed because `shiftEventQueue()` only removes `queue[0]`, but with the new design, a notification entry sitting at queue position `> 0` needs direct removal when the user views it.

```typescript
removeEventFromQueue(eventId: string): void {
  this._cultureEventQueue.update(q => {
    const idx = q.findIndex(e => e.eventId === eventId);
    if (idx === -1) return q;
    return [...q.slice(0, idx), ...q.slice(idx + 1)];
  });
}
```

---

### Layer 2 — `CultureEventService` (4 changes)

**File**: `src/app/core/systems/culture-event.service.ts`

#### 2a. Private helper `_isAutoShow(entry)`

```typescript
private _isAutoShow(entry: CultureEventEntry): boolean {
  const def = this.data.getCultureEvent(entry.eventId);
  return !!def && (def.priority || def.choices.length > 0);
}
```

Events with `priority: true` **or** that have choices auto-display. Purely informational events (no choices, non-priority) are notification-type.

#### 2b. New computed `notificationQueue` (read-only signal exposed to UI)

```typescript
readonly notificationQueue: Signal<CultureEventEntry[]> = computed(() =>
  this.gameState.cultureEventQueue().filter(e => !this._isAutoShow(e))
);
```

Used by `CultureEventBellComponent` for badge count and the dropdown unread list.

#### 2c. Modified `_tryShowNext()` — skip notification entries

```typescript
private _tryShowNext(): void {
  const queue = this.gameState.cultureEventQueue();
  const next = queue.find(e => this._isAutoShow(e));
  if (next && !this._currentEntry()) {
    this._displayEvent(next);
  }
}
```

**Important**: `_displayEvent` currently records history on show. This must not change — it stays the same.

#### 2d. Modified `closeCurrentEvent()` — use `removeEventFromQueue` instead of `shiftEventQueue`

```typescript
closeCurrentEvent(): void {
  const entry = this._currentEntry();
  if (!entry) return;
  const wasInterrupted = entry.wasInterrupted;
  this.gameState.removeEventFromQueue(entry.eventId); // ← was shiftEventQueue()
  this._currentEntry.set(null);
  const delay = wasInterrupted ? INTERRUPTED_BREATHER_MS : BREATHER_MS;
  setTimeout(() => this._tryShowNext(), delay);
}
```

This makes closing robust regardless of the entry's position in the queue.

#### 2e. New `showEvent(eventId: string)` — show a specific notification entry

Called from the bell dropdown when the user clicks an unread notification.

```typescript
showEvent(eventId: string): void {
  const entry = this.gameState.cultureEventQueue().find(e => e.eventId === eventId);
  if (!entry || this._currentEntry()) return;
  this._displayEvent(entry);
}
```

#### 2f. `queueEvent()` — do NOT call `_tryShowNext` for notification events

In the existing `queueEvent(eventId, priority)` — the non-priority branch currently calls `_tryShowNext()` only if nothing is displaying. With the new design, notification events added to the queue should NOT trigger auto-show at all (the bell badge will update via the computed signal). Change the branch to:

```typescript
} else {
  this.gameState.addToEventQueue({ ... });
  // Only auto-advance for auto-show type events (priority or has choices)
  const def = this.data.getCultureEvent(eventId);
  const isAutoShow = def && (def.priority || def.choices.length > 0);
  if (isAutoShow && !this._currentEntry()) {
    this._tryShowNext();
  }
}
```

---

### Layer 3 — Split `CultureEventToastComponent` into two focused components

#### 3a. NEW `CultureEventBellComponent`

**Files to create**:
- `src/app/features/culture-events/culture-event-bell/culture-event-bell.component.ts`
- `src/app/features/culture-events/culture-event-bell/culture-event-bell.component.html`
- `src/app/features/culture-events/culture-event-bell/culture-event-bell.component.scss`

**Responsibilities**: Bell icon, badge, dropdown panel (unread + read events, toggle).

**Signals/data needed**:
- `cultureEventService.notificationQueue()` — unread entries
- `gameState.cultureEventHistory()` — read entries (looked up via `data.getCultureEvent`)
- Local `_dropdownOpen = signal(false)`
- Local `_showOnlyUnread = signal(true)` — default: show unread only

**Computed**:
```typescript
readonly unreadCount = computed(() => this.cultureEventService.notificationQueue().length);

readonly unreadItems = computed(() =>
  this.cultureEventService.notificationQueue().map(e => ({
    eventId: e.eventId,
    title: this.data.getCultureEvent(e.eventId)?.title ?? e.eventId,
    read: false,
  }))
);

readonly readItems = computed(() =>
  [...this.gameState.cultureEventHistory()]
    .reverse() // most recent first
    .slice(0, 20) // cap at 20 to keep dropdown manageable
    .map(h => ({
      eventId: h.eventId,
      title: this.data.getCultureEvent(h.eventId)?.title ?? h.eventId,
      read: true,
    }))
);

readonly displayedItems = computed(() =>
  this._showOnlyUnread()
    ? this.unreadItems()
    : [...this.unreadItems(), ...this.readItems()]
);
```

**Template structure**:
```html
<!-- Bell button + badge -->
<button class="bell__btn" ...>
  🔔
  @if (unreadCount() > 0) { <span class="bell__badge">{{ unreadCount() }}</span> }
</button>

@if (_dropdownOpen()) {
  <div class="bell__panel" ...>
    <!-- Toggle -->
    <div class="bell__toolbar">
      <button class="bell__toggle" (click)="_showOnlyUnread.update(v => !v)">
        {{ _showOnlyUnread() ? 'Show all' : 'Show unread only' }}
      </button>
    </div>

    @if (displayedItems().length === 0) {
      <p class="bell__empty">No events</p>
    }

    <ul class="bell__list">
      @for (item of displayedItems(); track item.eventId) {
        <li class="bell__item" [class.bell__item--read]="item.read">
          @if (!item.read) {
            <button class="bell__item-btn" (click)="onItemClick(item.eventId)">
              <span class="bell__unread-dot" aria-hidden="true"></span>
              {{ item.title }}
            </button>
          } @else {
            <span class="bell__item-label">{{ item.title }}</span>
          }
        </li>
      }
    </ul>
  </div>
}
```

**Methods**:
- `onBellClick()` — toggle dropdown
- `onItemClick(eventId: string)` — call `cultureEventService.showEvent(eventId)`, close dropdown

**Styles**:
- Inherit bell styles from current `culture-event-toast.component.scss` `.toast__bell*` and `.toast__dropdown*` sections
- Add `.bell__item--read` with muted color and no hover state
- Add `.bell__unread-dot` — small accent-colored disc (6px circle)
- Add `.bell__toolbar` with toggle button
- The panel (`bell__panel`) replaces `toast__dropdown` — same structure, wider (320px)

---

#### 3b. MODIFIED `CultureEventToastComponent` (toast stack only)

**Files modified**:
- `src/app/features/culture-events/culture-event-toast/culture-event-toast.component.ts`
- `src/app/features/culture-events/culture-event-toast/culture-event-toast.component.html`
- `src/app/features/culture-events/culture-event-toast/culture-event-toast.component.scss`

**Remove**: All bell/dropdown code — constructor effect now watches `cultureEventService.notificationQueue()` (not the full queue).

**Change**: Toasts only spawn for NEW notification events (informational ones). Auto-show events do not spawn toasts (they appear as cards immediately, no toast needed).

New constructor effect:
```typescript
effect(() => {
  const notifications = this.cultureEventService.notificationQueue();
  untracked(() => {
    if (notifications.length > this._prevNotificationCount) {
      const newest = notifications[notifications.length - 1];
      const def = this.data.getCultureEvent(newest.eventId);
      if (def) this._spawnToast(newest.eventId, def.title);
    }
    this._prevNotificationCount = notifications.length;
  });
});
```

**No bell code**. Template is just the toast stack `<div>`.

**Click behavior**: `onToastClick(id)` → call `cultureEventService.showEvent(toastEventId)` + dismiss toast.

---

### Layer 4 — Toast exit animation (smooth collapse)

Replace the `translateX` / `opacity` exit with a **grid-row-collapse** approach.

**`ToastItem` interface** — add `dismissing: boolean`:
```typescript
interface ToastItem {
  readonly id: number;
  readonly eventId: string;
  readonly title: string;
  visible: boolean;
  dismissing: boolean;
}
```

**Template change** — wrap each toast in a collapse-wrapper:
```html
<div class="toast__stack" aria-live="polite" aria-atomic="false">
  @for (toast of _toasts(); track toast.id) {
    <div
      class="toast__collapse-wrap"
      [class.toast__collapse-wrap--dismissing]="toast.dismissing"
    >
      <div
        class="toast__item"
        [class.toast__item--visible]="toast.visible"
        role="alert"
        (click)="onToastClick(toast.id)"
      >
        <span class="toast__item-title">{{ toast.title }}</span>
        <span class="toast__item-hint" aria-hidden="true">Click to open</span>
      </div>
    </div>
  }
</div>
```

**SCSS change**:
```scss
// Remove translateX from .toast__item entry/exit.
// Entry: opacity 0 → 1 only.
// Exit: the wrapper collapses using grid-template-rows 1fr → 0fr.

.toast__collapse-wrap {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 350ms ease;

  &--dismissing {
    grid-template-rows: 0fr;
  }
}

.toast__item {
  min-height: 0; // required for grid-row collapse to work
  overflow: hidden;
  // ... existing padding/background/border styles ...
  opacity: 0;
  transition: opacity 0.35s ease-out;

  &--visible {
    opacity: 1;
  }
}
```

**`_dismissToast` in TS** — two-phase: first set `dismissing: true` (CSS collapse starts), then remove from DOM after `COLLAPSE_MS`:
```typescript
private _dismissToast(id: number): void {
  // Clear pending timers
  const pending = this._timers.get(id);
  if (pending) { pending.forEach(clearTimeout); this._timers.delete(id); }

  // Phase 1: trigger visible: false (opacity fade)
  this._toasts.update(list => list.map(t => t.id === id ? { ...t, visible: false } : t));

  // Phase 2 (one tick later): trigger dismissing: true (grid collapse)
  const collapseTimer = setTimeout(() => {
    this._toasts.update(list => list.map(t => t.id === id ? { ...t, dismissing: true } : t));
  }, 0);

  // Phase 3: remove from DOM after collapse completes
  const removeTimer = setTimeout(() => {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }, COLLAPSE_MS); // COLLAPSE_MS = 350 (match transition duration)

  this._timers.set(id, [collapseTimer, removeTimer]);
}
```

---

### Layer 5 — HUD wiring

**File**: `src/app/features/hud/hud.component.ts`
- Remove import of `CultureEventToastComponent`
- Add import of `CultureEventBellComponent`

**File**: `src/app/features/hud/hud.component.html`
- Replace `<app-culture-event-toast />` with `<app-culture-event-bell />`

---

### Layer 6 — GameShell wiring

**File**: `src/app/features/game-shell/game-shell.component.ts`
- Add import of `CultureEventToastComponent`

**File**: `src/app/features/game-shell/game-shell.component.html`
- Add `<app-culture-event-toast />` as a sibling to `<app-culture-event-card />` (after it in DOM order, so z-index context is clear)

**File**: `src/app/features/game-shell/game-shell.component.scss`
- Update the `app-culture-event-toast` rule — `position: absolute` is wrong for a component whose host is `display: contents`; the toast stack itself is already `position: fixed`. Remove the `position: absolute` from the game-shell rule (or change `z-index` to `200`):

```scss
app-culture-event-toast {
  // Host is display: contents — the toast__stack inside is position: fixed.
  // No position/inset needed here. z-index is set on .toast__stack directly.
}
```

And update `.toast__stack` z-index in the toast component SCSS from `150` → `200` (above the card at `z-index: 100`):
```scss
.toast__stack {
  z-index: 200; // above culture-event-card (100) and all other overlays
  ...
}
```

**Important note on `app-culture-event-card, app-culture-event-toast` combined rule in game-shell.scss**: split this into separate rules — `app-culture-event-toast` should NOT have `position: absolute` since it uses `display: contents`.

---

## Out of scope / deferred

- Audio on notification events (tracked in TODO.md — `CultureEventService — AudioService on event display`)
- Dismissing a notification without viewing it (future "mark as read" action)
- Showing the portrait or narrator text inline in the bell dropdown panel (card view suffices)
- Pagination of history in the bell dropdown (20-item cap is sufficient for now)

---

## Milestones

### M1 — Core logic (no visible UI change)
1. `GameStateService.removeEventFromQueue()` ✓
2. `CultureEventService._isAutoShow()` + `notificationQueue` signal ✓
3. `CultureEventService._tryShowNext()` skip notification entries ✓
4. `CultureEventService.closeCurrentEvent()` use `removeEventFromQueue` ✓
5. `CultureEventService.showEvent(eventId)` ✓
6. `CultureEventService.queueEvent()` — skip `_tryShowNext` for notification events ✓

### M2 — Toast stack component (toast-only, smooth animation)
7. `CultureEventToastComponent` — remove bell code, watch `notificationQueue` ✓
8. Add `dismissing` field and two-phase dismiss ✓
9. SCSS: replace translateX with grid-collapse wrapper ✓

### M3 — New bell component
10. `CultureEventBellComponent` — bell, badge, dropdown with unread/read + toggle ✓
11. Stitch into HUD (replace toast component) ✓

### M4 — GameShell wiring + z-index fix
12. Move `<app-culture-event-toast />` to game-shell HTML + update imports ✓
13. Fix `game-shell.component.scss` — split selector, remove `position: absolute` from toast ✓
14. Set `.toast__stack { z-index: 200 }` ✓

---

## Verification checklist

- [ ] `ng build` — no errors
- [ ] `npx vitest run` — all passing (update `culture-event-toast.component.spec.ts` for new component shape)
- [ ] Manual: trigger a text-only event → bell badge increments, no card auto-shows, toast briefly appears bottom-left
- [ ] Manual: trigger an event with choices → card auto-shows immediately, no toast
- [ ] Manual: trigger a priority event while card is open → priority event displaces current card
- [ ] Manual: open bell dropdown → see unread events; toggle to "show all" → see read events too
- [ ] Manual: click unread event in dropdown → card shows, event moves to history (no longer in unread list)
- [ ] Manual: open culture card, check that toast (if present) is visible **above** the card backdrop
- [ ] Manual: wait for toast auto-dismiss — observe smooth downward collapse, no snap
- [ ] Manual: click toast → card shows with correct event, toast collapses smoothly
