import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { SaveService, SlotInfo } from '@app/core/services/save.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { SaveSlotPanelComponent } from './save-slot-panel.component';

/** Flush all pending microtasks (Promise.resolve chains). */
const flushPromises = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const emptySlot = (slot: number): SlotInfo => ({ exists: false, isAutosave: slot === 0 });
const occupiedSlot = (slot: number, year = 2100, kLevel = 1, ts = Date.now()): SlotInfo => ({
  exists: true,
  isAutosave: slot === 0,
  gameYear: year,
  kardashevLevel: kLevel,
  saveTimestamp: ts,
});

describe('SaveSlotPanelComponent', () => {
  let fixture: ComponentFixture<SaveSlotPanelComponent>;
  let component: SaveSlotPanelComponent;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let loadFn: ReturnType<typeof vi.fn>;
  let saveFn: ReturnType<typeof vi.fn>;
  let deleteFn: ReturnType<typeof vi.fn>;
  let getAllSlotInfosFn: ReturnType<typeof vi.fn>;
  let resetFn: ReturnType<typeof vi.fn>;

  async function setup(
    infos: SlotInfo[],
    mode: 'NEW_GAME' | 'LOAD' | 'SAVE' = 'LOAD',
  ): Promise<void> {
    navigateSpy = vi.fn();
    loadFn = vi.fn(() => Promise.resolve(true));
    saveFn = vi.fn(() => Promise.resolve());
    deleteFn = vi.fn(() => Promise.resolve());
    getAllSlotInfosFn = vi.fn(() => Promise.resolve(infos));
    resetFn = vi.fn();

    await TestBed.configureTestingModule({
      imports: [SaveSlotPanelComponent],
      providers: [
        {
          provide: SaveService,
          useValue: {
            getAllSlotInfos: getAllSlotInfosFn,
            load: loadFn,
            save: saveFn,
            delete: deleteFn,
          },
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: GameStateService, useValue: { reset: resetFn } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SaveSlotPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
  }

  // ---------------------------------------------------------------------------
  // Slot visibility
  // ---------------------------------------------------------------------------

  it('LOAD mode shows all 4 slots including autosave', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.save-slot-panel__card');
    expect(cards.length).toBe(4);
  });

  it('NEW_GAME mode hides the autosave slot (shows 3 slots)', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.save-slot-panel__card');
    expect(cards.length).toBe(3);
    const labels: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('.save-slot-panel__card-label'),
    ).map((el) => (el as HTMLElement).textContent?.trim() ?? '');
    expect(labels).not.toContain('Autosave');
  });

  it('SAVE mode hides the autosave slot (shows 3 slots)', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'SAVE');
    await flushPromises();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.save-slot-panel__card');
    expect(cards.length).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Slot card content
  // ---------------------------------------------------------------------------

  it('shows "Empty" text for unoccupied slots', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelectorAll('.save-slot-panel__card-empty');
    expect(empty.length).toBe(4);
  });

  it('shows meta and timestamp for occupied slots', async () => {
    const ts = new Date('2150-03-15T10:30:00').getTime();
    const infos = [emptySlot(0), occupiedSlot(1, 2150, 2, ts), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const meta = fixture.nativeElement.querySelectorAll('.save-slot-panel__card-meta');
    expect(meta.length).toBe(1);
    expect(meta[0].textContent).toContain('2150');
    expect(meta[0].textContent).toContain('K2');
    const timestamp = fixture.nativeElement.querySelector('.save-slot-panel__card-timestamp');
    expect(timestamp).not.toBeNull();
    expect((timestamp as HTMLElement).textContent?.trim()).not.toBe('—');
  });

  // ---------------------------------------------------------------------------
  // Action buttons
  // ---------------------------------------------------------------------------

  it('LOAD mode: empty slots have no action button', async () => {
    // All empty → no action buttons
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const actionBtns = fixture.nativeElement.querySelectorAll('.save-slot-panel__action-btn');
    expect(actionBtns.length).toBe(0);
  });

  it('NEW_GAME mode: empty slots show action button', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    fixture.detectChanges();
    // NEW_GAME hides autosave → 3 slots, all empty, all get action btns
    const actionBtns = fixture.nativeElement.querySelectorAll('.save-slot-panel__action-btn');
    expect(actionBtns.length).toBe(3);
  });

  it('LOAD mode: occupied manual slot shows delete button', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const deleteBtns = fixture.nativeElement.querySelectorAll('.save-slot-panel__delete-btn');
    expect(deleteBtns.length).toBe(1);
  });

  it('LOAD mode: no delete button for occupied autosave (slot 0)', async () => {
    const infos = [occupiedSlot(0), emptySlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const deleteBtns = fixture.nativeElement.querySelectorAll('.save-slot-panel__delete-btn');
    expect(deleteBtns.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // LOAD action
  // ---------------------------------------------------------------------------

  it('onAction LOAD: calls saveService.load and navigates to /game', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    const selectedSlots: number[] = [];
    let closedEmitted = false;
    component.slotSelected.subscribe((s) => selectedSlots.push(s));
    component.closed.subscribe(() => (closedEmitted = true));
    component.onAction(1, infos[1]);
    await flushPromises();
    expect(loadFn).toHaveBeenCalledWith(1);
    expect(selectedSlots).toEqual([1]);
    expect(closedEmitted).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(['/game']);
  });

  // ---------------------------------------------------------------------------
  // NEW_GAME overwrite confirm
  // ---------------------------------------------------------------------------

  it('NEW_GAME + empty slot: emits slotSelected and navigates immediately', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    const emitted: number[] = [];
    component.slotSelected.subscribe((s) => emitted.push(s));
    component.onAction(1, infos[1]);
    expect(resetFn).toHaveBeenCalledOnce();
    expect(emitted).toEqual([1]);
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { slot: 1 } });
  });

  it('NEW_GAME + occupied slot: shows overwrite confirm inline', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    fixture.detectChanges();
    component.onAction(1, infos[1]);
    fixture.detectChanges();
    expect(component.pendingConfirm()).toEqual({ slot: 1, type: 'overwrite' });
    const confirmRow = fixture.nativeElement.querySelector('.save-slot-panel__confirm-row');
    expect(confirmRow).not.toBeNull();
  });

  it('onConfirmOverwrite: emits slotSelected and navigates', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    const emitted: number[] = [];
    component.slotSelected.subscribe((s) => emitted.push(s));
    component.onAction(1, infos[1]); // triggers overwrite confirm
    component.onConfirmOverwrite(1);
    expect(resetFn).toHaveBeenCalledOnce();
    expect(emitted).toEqual([1]);
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { slot: 1 } });
    expect(component.pendingConfirm()).toBeNull();
  });

  it('onCancelConfirm: clears pending confirm', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    component.onAction(1, infos[1]);
    expect(component.pendingConfirm()).not.toBeNull();
    component.onCancelConfirm();
    expect(component.pendingConfirm()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Delete confirm
  // ---------------------------------------------------------------------------

  it('onDeleteRequest: shows delete confirm for the correct slot', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    component.onDeleteRequest(1);
    expect(component.pendingConfirm()).toEqual({ slot: 1, type: 'delete' });
  });

  it('onConfirmDelete: calls saveService.delete, refreshes slots, clears confirm', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    // After delete, pretend slot 1 is now empty
    getAllSlotInfosFn.mockResolvedValue([0, 1, 2, 3].map(emptySlot));
    component.onDeleteRequest(1);
    component.onConfirmDelete(1);
    await flushPromises();
    expect(deleteFn).toHaveBeenCalledWith(1);
    expect(getAllSlotInfosFn).toHaveBeenCalledTimes(2); // initial load + refresh
    expect(component.pendingConfirm()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // SAVE action
  // ---------------------------------------------------------------------------

  it('SAVE mode: calls saveService.save, emits slotSelected and closed', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'SAVE');
    await flushPromises();
    const selectedSlots: number[] = [];
    let closedEmitted = false;
    component.slotSelected.subscribe((s) => selectedSlots.push(s));
    component.closed.subscribe(() => (closedEmitted = true));
    component.onAction(1, infos[1]);
    await flushPromises();
    expect(saveFn).toHaveBeenCalledWith(1);
    expect(selectedSlots).toEqual([1]);
    expect(closedEmitted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Backdrop close
  // ---------------------------------------------------------------------------

  it('emits closed when backdrop is clicked', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos);
    await flushPromises();
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    const backdrop = fixture.nativeElement.querySelector('.save-slot-panel__backdrop');
    backdrop.click();
    expect(emitted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // formatTimestamp helper
  // ---------------------------------------------------------------------------

  it('formatTimestamp returns "—" for undefined', async () => {
    await setup([0, 1, 2, 3].map(emptySlot));
    expect(component.formatTimestamp(undefined)).toBe('—');
  });

  it('formatTimestamp returns a non-empty string for a valid timestamp', async () => {
    await setup([0, 1, 2, 3].map(emptySlot));
    const result = component.formatTimestamp(Date.now());
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(0);
  });
});
