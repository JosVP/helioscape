import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { SaveService, SlotInfo } from '@app/core/services/save.service';
import { SaveSlotPanelComponent } from './save-slot-panel.component';

/** Flush all pending microtasks (Promise.resolve chains). */
const flushPromises = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const emptySlot = (slot: number): SlotInfo => ({ exists: false, isAutosave: slot === 0 });
const occupiedSlot = (slot: number, year = 2100, kLevel = 1): SlotInfo => ({
  exists: true,
  isAutosave: slot === 0,
  gameYear: year,
  kardashevLevel: kLevel,
  saveTimestamp: Date.now(),
});

describe('SaveSlotPanelComponent', () => {
  let fixture: ComponentFixture<SaveSlotPanelComponent>;
  let component: SaveSlotPanelComponent;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let loadFn: ReturnType<typeof vi.fn>;

  async function setup(
    infos: SlotInfo[],
    mode: 'NEW_GAME' | 'LOAD' = 'LOAD'
  ): Promise<void> {
    navigateSpy = vi.fn();
    loadFn = vi.fn(() => Promise.resolve(true));
    await TestBed.configureTestingModule({
      imports: [SaveSlotPanelComponent],
      providers: [
        {
          provide: SaveService,
          useValue: {
            getAllSlotInfos: () => Promise.resolve(infos),
            load: loadFn,
          },
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SaveSlotPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
  }

  it('renders 4 slot cards after async init', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos);
    await flushPromises();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.save-slot-panel__card');
    expect(cards.length).toBe(4);
  });

  it('shows "Empty" text for unoccupied slots', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos);
    await flushPromises();
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelectorAll('.save-slot-panel__card-empty');
    expect(empty.length).toBe(4);
  });

  it('shows meta text for occupied slots', async () => {
    const infos = [emptySlot(0), occupiedSlot(1, 2150, 2), emptySlot(2), emptySlot(3)];
    await setup(infos);
    await flushPromises();
    fixture.detectChanges();
    const meta = fixture.nativeElement.querySelectorAll('.save-slot-panel__card-meta');
    expect(meta.length).toBe(1);
    expect(meta[0].textContent).toContain('2150');
    expect(meta[0].textContent).toContain('K2');
  });

  it('disables empty slots in LOAD mode', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    fixture.detectChanges();
    const cards: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '.save-slot-panel__card'
    );
    // Slot 0, 2, 3 are empty → disabled; slot 1 is occupied → enabled
    expect(cards[0].disabled).toBe(true);
    expect(cards[1].disabled).toBe(false);
    expect(cards[2].disabled).toBe(true);
    expect(cards[3].disabled).toBe(true);
  });

  it('does NOT disable any slots in NEW_GAME mode', async () => {
    const infos = [emptySlot(0), emptySlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    fixture.detectChanges();
    const cards: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '.save-slot-panel__card'
    );
    Array.from(cards).forEach((card) => expect(card.disabled).toBe(false));
  });

  it('onSlotClick LOAD: calls saveService.load and navigates to /game', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(infos, 'LOAD');
    await flushPromises();
    component.onSlotClick(1, infos[1]);
    await flushPromises();
    expect(loadFn).toHaveBeenCalledWith(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/game']);
  });

  it('onSlotClick NEW_GAME: navigates to /game with slot query param', async () => {
    const infos = [0, 1, 2, 3].map(emptySlot);
    await setup(infos, 'NEW_GAME');
    await flushPromises();
    component.onSlotClick(2, infos[2]);
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { slot: 2 } });
  });

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
});
