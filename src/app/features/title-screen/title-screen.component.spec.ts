import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { SaveService, SlotInfo } from '@app/core/services/save.service';
import { TitleScreenComponent } from './title-screen.component';

/** Flush all pending microtasks (Promise.resolve chains). */
const flushPromises = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const emptySlot = (slot: number): SlotInfo => ({ exists: false, isAutosave: slot === 0 });
const occupiedSlot = (slot: number, year = 2100, kLevel = 1, ts = 1000): SlotInfo => ({
  exists: true,
  isAutosave: slot === 0,
  gameYear: year,
  kardashevLevel: kLevel,
  saveTimestamp: ts,
});

function makeSaveServiceMock(hasSave: boolean, infos: SlotInfo[]): Partial<SaveService> {
  return {
    hasSave: () => Promise.resolve(hasSave),
    getAllSlotInfos: () => Promise.resolve(infos),
    load: vi.fn(() => Promise.resolve(true)),
  };
}

describe('TitleScreenComponent', () => {
  let fixture: ComponentFixture<TitleScreenComponent>;
  let component: TitleScreenComponent;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function setup(hasSave: boolean, infos?: SlotInfo[]): Promise<void> {
    navigateSpy = vi.fn();
    const allInfos = infos ?? [0, 1, 2, 3].map(emptySlot);
    await TestBed.configureTestingModule({
      imports: [TitleScreenComponent],
      providers: [
        { provide: SaveService, useValue: makeSaveServiceMock(hasSave, allInfos) },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TitleScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders the game title', async () => {
    await setup(false);
    const h1: HTMLElement = fixture.nativeElement.querySelector('.title-screen__title');
    expect(h1.textContent).toContain('HELIOSCAPE');
  });

  it('renders the subtitle', async () => {
    await setup(false);
    const sub: HTMLElement = fixture.nativeElement.querySelector('.title-screen__subtitle');
    expect(sub.textContent).toContain('Terraform the Solar System');
  });

  it('hides Continue when hasSave is false', async () => {
    await setup(false);
    await flushPromises();
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '.title-screen__btn'
    );
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).not.toContain('Continue');
  });

  it('shows Continue when hasSave is true', async () => {
    const infos = [emptySlot(0), occupiedSlot(1, 2150, 2), emptySlot(2), emptySlot(3)];
    await setup(true, infos);
    await flushPromises();
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '.title-screen__btn'
    );
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toContain('Continue');
  });

  it('onNewGame navigates immediately when no save', async () => {
    await setup(false);
    await flushPromises();
    component.onNewGame();
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { slot: 1 } });
    expect(component.showSavePanel()).toBe(false);
  });

  it('onNewGame opens SaveSlotPanel in NEW_GAME mode when save exists', async () => {
    const infos = [emptySlot(0), occupiedSlot(1), emptySlot(2), emptySlot(3)];
    await setup(true, infos);
    await flushPromises();
    component.onNewGame();
    expect(component.showSavePanel()).toBe(true);
    expect(component.saveMode()).toBe('NEW_GAME');
  });

  it('onLoadGame opens SaveSlotPanel in LOAD mode', async () => {
    await setup(false);
    await flushPromises();
    component.onLoadGame();
    expect(component.showSavePanel()).toBe(true);
    expect(component.saveMode()).toBe('LOAD');
  });

  it('onOptions shows settings overlay', async () => {
    await setup(false);
    await flushPromises();
    component.onOptions();
    expect(component.showSettings()).toBe(true);
  });

  it('onPanelClosed hides the save slot panel', async () => {
    await setup(false);
    await flushPromises();
    component.onLoadGame();
    component.onPanelClosed();
    expect(component.showSavePanel()).toBe(false);
  });

  it('onSettingsClosed hides the settings overlay', async () => {
    await setup(false);
    await flushPromises();
    component.onOptions();
    component.onSettingsClosed();
    expect(component.showSettings()).toBe(false);
  });
});
