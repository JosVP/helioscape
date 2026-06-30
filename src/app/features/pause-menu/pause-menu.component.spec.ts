// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PauseMenuComponent } from './pause-menu.component';

describe('PauseMenuComponent', () => {
  function setup(): PauseMenuComponent {
    return TestBed.runInInjectionContext(() => new PauseMenuComponent());
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts at the root menu view', () => {
    const component = setup();

    expect(component.activeView()).toBe('menu');
    expect(component.pendingConfirm()).toBeNull();
  });

  it('opens save and settings panels without confirmations', () => {
    const component = setup();

    component.openSave();
    expect(component.activeView()).toBe('save');
    expect(component.pendingConfirm()).toBeNull();

    component.openSettings();
    expect(component.activeView()).toBe('settings');
    expect(component.pendingConfirm()).toBeNull();
  });

  it('requires confirmation before opening load panel', () => {
    const component = setup();

    component.requestLoad();
    expect(component.pendingConfirm()).toBe('load');
    expect(component.activeView()).toBe('menu');

    component.confirmLoad();
    expect(component.pendingConfirm()).toBeNull();
    expect(component.activeView()).toBe('load');
  });

  it('requires confirmation before returning to title', () => {
    const component = setup();
    const returnSpy = vi.fn();
    component.returnToTitleRequested.subscribe(returnSpy);

    component.requestReturnToTitle();
    expect(component.pendingConfirm()).toBe('title');

    component.confirmReturnToTitle();
    expect(returnSpy).toHaveBeenCalledOnce();
    expect(component.activeView()).toBe('menu');
    expect(component.pendingConfirm()).toBeNull();
  });

  it('escape closes confirmations, child panels, then requests resume from root', () => {
    const component = setup();
    const resumeSpy = vi.fn();
    component.resumeRequested.subscribe(resumeSpy);

    component.requestLoad();
    component.onEscape();
    expect(component.pendingConfirm()).toBeNull();
    expect(resumeSpy).not.toHaveBeenCalled();

    component.openSave();
    component.onEscape();
    expect(component.activeView()).toBe('menu');
    expect(resumeSpy).not.toHaveBeenCalled();

    component.onEscape();
    expect(resumeSpy).toHaveBeenCalledOnce();
  });

  it('emits loadCompleted after a child load succeeds', () => {
    const component = setup();
    const loadSpy = vi.fn();
    component.loadCompleted.subscribe(loadSpy);

    component.onLoadCompleted();

    expect(loadSpy).toHaveBeenCalledOnce();
  });
});
