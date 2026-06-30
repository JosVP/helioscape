// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  function setup(): ConfirmDialogComponent {
    return TestBed.runInInjectionContext(() => new ConfirmDialogComponent());
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('defaults to non-destructive actions', () => {
    const component = setup();

    expect(component.isDestructive()).toBe(false);
  });

  it('emits confirmed', () => {
    const component = setup();
    const confirmedSpy = vi.fn();
    component.confirmed.subscribe(confirmedSpy);

    component.confirmed.emit();

    expect(confirmedSpy).toHaveBeenCalledOnce();
  });

  it('emits cancelled', () => {
    const component = setup();
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    component.cancelled.emit();

    expect(cancelledSpy).toHaveBeenCalledOnce();
  });
});
