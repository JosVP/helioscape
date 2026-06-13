import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CultureEventEntry } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { CultureEventService } from '@app/core/systems/culture-event.service';
import { CultureEventToastComponent } from './culture-event-toast.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(eventId = 'ce_001', year = 2040): CultureEventEntry {
  return { eventId, queuedAtYear: year, priority: false, wasInterrupted: false };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeFakeDataService(titleMap: Record<string, string> = {}) {
  return {
    getCultureEvent: vi.fn((id: string) =>
      titleMap[id] ? { title: titleMap[id], choices: [] } : null,
    ),
  };
}

function makeFakeCultureEventService(initialNotifications: CultureEventEntry[] = []) {
  const notificationSignal = signal<CultureEventEntry[]>(initialNotifications);
  return {
    notificationQueue: notificationSignal.asReadonly(),
    showEvent: vi.fn(),
    // test helper — directly set the notification queue
    _setNotifications: (q: CultureEventEntry[]) => notificationSignal.set(q),
  };
}

type FakeCultureEventService = ReturnType<typeof makeFakeCultureEventService>;

function setup(
  initialNotifications: CultureEventEntry[] = [],
  titleMap: Record<string, string> = {},
) {
  const fakeData = makeFakeDataService(titleMap);
  const fakeCultureEventService = makeFakeCultureEventService(initialNotifications);

  TestBed.configureTestingModule({
    imports: [CultureEventToastComponent],
    providers: [
      { provide: DataService, useValue: fakeData },
      { provide: CultureEventService, useValue: fakeCultureEventService },
    ],
  });

  const fixture = TestBed.createComponent(CultureEventToastComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, fakeData, fakeCultureEventService };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CultureEventToastComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // ── Toast spawn ───────────────────────────────────────────────────────────

  it('spawns a toast when notification queue grows', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup([], { ce_001: 'Test Event' });

    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();

    // Toast is in list but not yet visible (rampIn fires next tick)
    expect(fixture.componentInstance._toasts().length).toBe(1);
    expect(fixture.componentInstance._toasts()[0].visible).toBe(false);

    // After microtask, visible: true
    tick(0);
    fixture.detectChanges();
    expect(fixture.componentInstance._toasts()[0].visible).toBe(true);

    // Clean up auto-dismiss timers
    tick(8000);
    tick(350); // COLLAPSE_MS
  }));

  it('does not spawn a toast when notification queue shrinks', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup(
      [makeEntry('ce_001'), makeEntry('ce_002')],
      { ce_001: 'First', ce_002: 'Second' },
    );

    tick(0);
    fixture.detectChanges();
    const initialCount = fixture.componentInstance._toasts().length;

    // Queue shrinks — event was opened/removed
    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();

    expect(fixture.componentInstance._toasts().length).toBe(initialCount);

    tick(8000);
    tick(350);
  }));

  // ── Auto-dismiss ──────────────────────────────────────────────────────────

  it('auto-dismisses toast: sets visible:false at 8s, removes from DOM after collapse', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup([], { ce_001: 'Temp Event' });

    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();
    tick(0); // rampIn

    expect(fixture.componentInstance._toasts().length).toBe(1);

    tick(8000); // auto-dismiss → visible: false, dismissing: true starts
    fixture.detectChanges();
    expect(fixture.componentInstance._toasts()[0].visible).toBe(false);
    expect(fixture.componentInstance._toasts()[0].dismissing).toBe(true);

    tick(350); // COLLAPSE_MS → removal
    fixture.detectChanges();
    expect(fixture.componentInstance._toasts().length).toBe(0);
  }));

  // ── Toast click ───────────────────────────────────────────────────────────

  it('calls showEvent() with the correct eventId and dismisses toast on click', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup([], { ce_001: 'Clickable' });

    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    const toastEl = fixture.nativeElement.querySelector('.toast__item');
    expect(toastEl).not.toBeNull();
    toastEl.click();
    fixture.detectChanges();

    expect(fakeCultureEventService.showEvent).toHaveBeenCalledWith('ce_001');
    expect(fixture.componentInstance._toasts()[0].visible).toBe(false);

    tick(350);
  }));

  // ── Smooth dismiss state ──────────────────────────────────────────────────

  it('sets dismissing:true on the wrapper after click', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup([], { ce_001: 'Dismiss Test' });

    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.toast__item').click();
    tick(0); // collapseTimer
    fixture.detectChanges();

    expect(fixture.componentInstance._toasts()[0].dismissing).toBe(true);

    tick(350);
  }));

  // ── Destroy cleanup ───────────────────────────────────────────────────────

  it('clears all timers on destroy', fakeAsync(() => {
    const { fixture, fakeCultureEventService } = setup([], { ce_001: 'Temp' });

    fakeCultureEventService._setNotifications([makeEntry('ce_001')]);
    fixture.detectChanges();
    tick(0);

    // Destroy before auto-dismiss fires
    fixture.destroy();

    // Remaining timers should not throw
    tick(8000);
    tick(350);
  }));
});
