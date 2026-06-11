import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TechTreeService } from './tech-tree.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type { TechNode, TechEffect, ForkChoice, PendingFork } from '@app/core/models';
import { Subject } from 'rxjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTechNode(overrides: Partial<TechNode> = {}): TechNode {
  return {
    id: 'test_node',
    planet: 'mars',
    displayName: 'Test Node',
    prerequisites: [],
    spilloverPrerequisites: [],
    rpCost: 0,
    durationYears: 0,
    effects: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fake services
// ---------------------------------------------------------------------------

/** Minimal writable signal helpers for GameStateService fake. */
function makeGameStateFake(opts: {
  completedTechs?: string[];
  pendingFork?: PendingFork | null;
  naturalistCount?: number;
} = {}) {
  const completedTechs = signal<string[]>(opts.completedTechs ?? []);
  const pendingFork = signal<PendingFork | null>(opts.pendingFork ?? null);
  const naturalistCount = signal<number>(opts.naturalistCount ?? 0);

  return {
    completedTechs: completedTechs.asReadonly(),
    pendingFork: pendingFork.asReadonly(),
    naturalistCount: naturalistCount.asReadonly(),
    gameYear: signal<number>(2033).asReadonly(),

    // Expose write helpers for test assertions.
    _setCompletedTechs: (v: string[]) => completedTechs.set(v),
    _setPendingFork: (v: PendingFork | null) => pendingFork.set(v),
    _setNaturalistCount: (n: number) => naturalistCount.set(n),

    // Spy targets — real implementations kept simple.
    unlockTech: vi.fn((techId: string) => {
      completedTechs.update((t) => (t.includes(techId) ? t : [...t, techId]));
    }),
    setPendingFork: vi.fn((fork: PendingFork | null) => pendingFork.set(fork)),
    completeFork: vi.fn(),
    addToEventQueue: vi.fn(),
    applyTerraformingChoice: vi.fn(),
    incrementNaturalist: vi.fn(() => naturalistCount.update((n) => n + 1)),
    incrementArchitect: vi.fn(),
    setColonistBonus: vi.fn(),
    setEarthFlag: vi.fn(),
  };
}

function makeDataFake(nodes: TechNode[] = []) {
  return {
    getTechNode: vi.fn((id: string) => nodes.find((n) => n.id === id)),
    getTechNodesForPlanet: vi.fn((planetId: string) => nodes.filter((n) => n.planet === planetId)),
  };
}

function makeEventBusFake() {
  return {
    techUnlocked$: new Subject<{ planetId: string; nodeId: string }>(),
    forkPresented$: new Subject<{ planetId: string; techId: string }>(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('TechTreeService', () => {
  let service: TechTreeService;
  let gameState: ReturnType<typeof makeGameStateFake>;
  let data: ReturnType<typeof makeDataFake>;
  let eventBus: ReturnType<typeof makeEventBusFake>;

  function setup(
    nodes: TechNode[] = [],
    gameStateOpts: Parameters<typeof makeGameStateFake>[0] = {},
  ) {
    gameState = makeGameStateFake(gameStateOpts);
    data = makeDataFake(nodes);
    eventBus = makeEventBusFake();

    TestBed.configureTestingModule({
      providers: [
        TechTreeService,
        { provide: DataService, useValue: data },
        { provide: GameStateService, useValue: gameState },
        { provide: EventBusService, useValue: eventBus },
      ],
    });

    service = TestBed.inject(TechTreeService);
  }

  // -------------------------------------------------------------------------
  // canUnlock — basic guards
  // -------------------------------------------------------------------------

  describe('canUnlock()', () => {
    it('returns false when the node does not exist in data', () => {
      setup([]);
      expect(service.canUnlock('mars', 'unknown_node')).toBe(false);
    });

    it('returns false when a fork is pending', () => {
      const node = makeTechNode({ id: 'n1' });
      setup([node], {
        pendingFork: { techId: 'prev_fork', planetId: 'mars', forkId: 'f1' },
      });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    it('returns false when the node is already completed', () => {
      const node = makeTechNode({ id: 'n1' });
      setup([node], { completedTechs: ['n1'] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    it('returns true when there are no prerequisites', () => {
      const node = makeTechNode({ id: 'n1', prerequisites: [] });
      setup([node]);
      expect(service.canUnlock('mars', 'n1')).toBe(true);
    });

    // -----------------------------------------------------------------------
    // prerequisiteMode
    // -----------------------------------------------------------------------

    it('returns false when prerequisiteMode is "all" and only some prereqs are met', () => {
      const node = makeTechNode({
        id: 'n1',
        prerequisites: ['a', 'b'],
        prerequisiteMode: 'all',
      });
      setup([node], { completedTechs: ['a'] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    it('returns true when prerequisiteMode is "all" and all prereqs are met', () => {
      const node = makeTechNode({
        id: 'n1',
        prerequisites: ['a', 'b'],
        prerequisiteMode: 'all',
      });
      setup([node], { completedTechs: ['a', 'b'] });
      expect(service.canUnlock('mars', 'n1')).toBe(true);
    });

    it('returns true when prerequisiteMode is "any" and at least one prereq is met', () => {
      const node = makeTechNode({
        id: 'n1',
        prerequisites: ['a', 'b'],
        prerequisiteMode: 'any',
      });
      setup([node], { completedTechs: ['b'] });
      expect(service.canUnlock('mars', 'n1')).toBe(true);
    });

    it('returns false when prerequisiteMode is "any" and no prereqs are met', () => {
      const node = makeTechNode({
        id: 'n1',
        prerequisites: ['a', 'b'],
        prerequisiteMode: 'any',
      });
      setup([node], { completedTechs: [] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);

    });

    it('defaults to "all" mode when prerequisiteMode is absent', () => {
      const node = makeTechNode({ id: 'n1', prerequisites: ['a', 'b'] });
      // No prerequisiteMode set → defaults to all
      setup([node], { completedTechs: ['a'] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    // -----------------------------------------------------------------------
    // spilloverPrerequisites — always AND-mode
    // -----------------------------------------------------------------------

    it('returns false when spilloverPrerequisites are not met', () => {
      const node = makeTechNode({
        id: 'n1',
        spilloverPrerequisites: ['spill_a', 'spill_b'],
      });
      setup([node], { completedTechs: ['spill_a'] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    it('returns true when all spilloverPrerequisites are met', () => {
      const node = makeTechNode({
        id: 'n1',
        spilloverPrerequisites: ['spill_a', 'spill_b'],
      });
      setup([node], { completedTechs: ['spill_a', 'spill_b'] });
      expect(service.canUnlock('mars', 'n1')).toBe(true);
    });

    it('checks spilloverPrerequisites independently of prerequisiteMode', () => {
      // prerequisiteMode is 'any' but spillover is still AND
      const node = makeTechNode({
        id: 'n1',
        prerequisites: ['a'],
        prerequisiteMode: 'any',
        spilloverPrerequisites: ['spill_a', 'spill_b'],
      });
      // prereq met via 'any', but spill_b missing
      setup([node], { completedTechs: ['a', 'spill_a'] });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    // -----------------------------------------------------------------------
    // spilloverGate
    // -----------------------------------------------------------------------

    it('returns false when naturalistCount is below spilloverGate.count', () => {
      const node = makeTechNode({
        id: 'n1',
        spilloverGate: { mode: 'min_naturalist_nodes', count: 3 },
      });
      setup([node], { naturalistCount: 2 });
      expect(service.canUnlock('mars', 'n1')).toBe(false);
    });

    it('returns true when naturalistCount meets spilloverGate.count', () => {
      const node = makeTechNode({
        id: 'n1',
        spilloverGate: { mode: 'min_naturalist_nodes', count: 3 },
      });
      setup([node], { naturalistCount: 3 });
      expect(service.canUnlock('mars', 'n1')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // unlockTech
  // -------------------------------------------------------------------------

  describe('unlockTech()', () => {
    it('does nothing when canUnlock returns false', () => {
      setup([]); // no nodes → canUnlock returns false
      service.unlockTech('mars', 'unknown');
      expect(gameState.unlockTech).not.toHaveBeenCalled();
    });

    it('calls gameState.unlockTech() and emits techUnlocked$ on happy path', () => {
      const node = makeTechNode({ id: 'n1', effects: [] });
      setup([node]);

      const emissions: { planetId: string; nodeId: string }[] = [];
      eventBus.techUnlocked$.subscribe((e) => emissions.push(e));

      service.unlockTech('mars', 'n1');

      expect(gameState.unlockTech).toHaveBeenCalledWith('n1');
      expect(emissions).toEqual([{ planetId: 'mars', nodeId: 'n1' }]);
    });

    it('calls _presentFork and does NOT call unlockTech when present_fork effect is present', () => {
      const forkEffect: TechEffect = {
        type: 'present_fork',
        forkId: 'fork_1',
        choices: [],
      };
      const node = makeTechNode({ id: 'fork_node', effects: [forkEffect] });
      setup([node]);

      const forkEmissions: { planetId: string; techId: string }[] = [];
      eventBus.forkPresented$.subscribe((e) => forkEmissions.push(e));

      service.unlockTech('mars', 'fork_node');

      expect(gameState.setPendingFork).toHaveBeenCalledWith({
        techId: 'fork_node',
        planetId: 'mars',
        forkId: 'fork_1',
      });
      expect(forkEmissions).toEqual([{ planetId: 'mars', techId: 'fork_node' }]);
      // The node should NOT be added to completedTechs yet.
      expect(gameState.unlockTech).not.toHaveBeenCalled();
    });

    it('processes unlock_tech effect recursively', () => {
      const child = makeTechNode({ id: 'child', effects: [] });
      const parent = makeTechNode({
        id: 'parent',
        effects: [{ type: 'unlock_tech', target: 'child' }],
      });
      setup([parent, child]);

      service.unlockTech('mars', 'parent');

      // parent and child should both be unlocked.
      const calls = (gameState.unlockTech as ReturnType<typeof vi.fn>).mock.calls.map(
        (c: unknown[]) => c[0],
      );
      expect(calls).toContain('parent');
      expect(calls).toContain('child');
    });
  });

  // -------------------------------------------------------------------------
  // completeForkChoice
  // -------------------------------------------------------------------------

  describe('completeForkChoice()', () => {
    function makeForkNode(choices: ForkChoice[]): TechNode {
      const forkEffect: TechEffect = {
        type: 'present_fork',
        forkId: 'f1',
        choices,
      };
      return makeTechNode({ id: 'fork_tech', effects: [forkEffect] });
    }

    it('does nothing when the tech node does not exist', () => {
      setup([]);
      service.completeForkChoice('mars', 'nonexistent', 'c1');
      expect(gameState.completeFork).not.toHaveBeenCalled();
    });

    it('does nothing when the choice id is not found', () => {
      const node = makeForkNode([{ id: 'c1', label: 'A', tag: '', effects: [] }]);
      setup([node]);
      service.completeForkChoice('mars', 'fork_tech', 'wrong_id');
      expect(gameState.completeFork).not.toHaveBeenCalled();
    });

    it('applies naturalist tag, choice effects, unlocks the fork tech, clears fork, and emits', () => {
      const choice: ForkChoice = {
        id: 'c1',
        label: 'Go green',
        tag: 'naturalist',
        effects: [],
      };
      const node = makeForkNode([choice]);
      setup([node]);

      const emissions: { planetId: string; nodeId: string }[] = [];
      eventBus.techUnlocked$.subscribe((e) => emissions.push(e));

      service.completeForkChoice('mars', 'fork_tech', 'c1');

      expect(gameState.incrementNaturalist).toHaveBeenCalled();
      expect(gameState.unlockTech).toHaveBeenCalledWith('fork_tech');
      expect(gameState.completeFork).toHaveBeenCalledWith('fork_tech', 'c1');
      expect(emissions).toEqual([{ planetId: 'mars', nodeId: 'fork_tech' }]);
    });

    it('applies architect tag when choice.tag is "architect"', () => {
      const choice: ForkChoice = { id: 'c2', label: 'Build more', tag: 'architect', effects: [] };
      const node = makeForkNode([choice]);
      setup([node]);

      service.completeForkChoice('mars', 'fork_tech', 'c2');

      expect(gameState.incrementArchitect).toHaveBeenCalled();
      expect(gameState.incrementNaturalist).not.toHaveBeenCalled();
    });

    it('applies choice effects via _applyEffect', () => {
      const choice: ForkChoice = {
        id: 'c1',
        label: 'Flag it',
        tag: '',
        effects: [{ type: 'set_flag', flag: 'earth_unity_act' }],
      };
      const node = makeForkNode([choice]);
      setup([node]);

      service.completeForkChoice('mars', 'fork_tech', 'c1');

      expect(gameState.setEarthFlag).toHaveBeenCalledWith('earth_unity_act', true);
    });
  });

  // -------------------------------------------------------------------------
  // _applyEffect — individual cases
  // -------------------------------------------------------------------------

  describe('_applyEffect via unlockTech()', () => {
    function setupSingleEffectNode(effect: TechEffect): void {
      const node = makeTechNode({ id: 'n1', effects: [effect] });
      setup([node]);
    }

    it('emit_event: queues the culture event', () => {
      setupSingleEffectNode({ type: 'emit_event', eventId: 'ce_test' });
      service.unlockTech('mars', 'n1');
      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_test', priority: false }),
      );
    });

    it('apply_terraforming_choice: calls applyTerraformingChoice', () => {
      setupSingleEffectNode({
        type: 'apply_terraforming_choice',
        planet: 'mars',
        choiceId: 'polar_melt',
        permanent: true,
      });
      service.unlockTech('mars', 'n1');
      expect(gameState.applyTerraformingChoice).toHaveBeenCalledWith('mars', 'polar_melt', true);
    });

    it('tag_decision naturalist: calls incrementNaturalist', () => {
      setupSingleEffectNode({ type: 'tag_decision', tag: 'naturalist' });
      service.unlockTech('mars', 'n1');
      expect(gameState.incrementNaturalist).toHaveBeenCalled();
    });

    it('tag_decision architect: calls incrementArchitect', () => {
      setupSingleEffectNode({ type: 'tag_decision', tag: 'architect' });
      service.unlockTech('mars', 'n1');
      expect(gameState.incrementArchitect).toHaveBeenCalled();
    });

    it('apply_colonist_bonus dense_living: calls setColonistBonus with denseLiving', () => {
      setupSingleEffectNode({ type: 'apply_colonist_bonus', bonus: 'dense_living' });
      service.unlockTech('mars', 'n1');
      expect(gameState.setColonistBonus).toHaveBeenCalledWith('denseLiving', true);
    });

    it('apply_colonist_bonus open_environment: calls setColonistBonus with openEnvironment', () => {
      setupSingleEffectNode({ type: 'apply_colonist_bonus', bonus: 'open_environment' });
      service.unlockTech('mars', 'n1');
      expect(gameState.setColonistBonus).toHaveBeenCalledWith('openEnvironment', true);
    });

    it('rp_capacity_boost: is a no-op (no direct mutation)', () => {
      setupSingleEffectNode({ type: 'rp_capacity_boost', amount: 20 });
      service.unlockTech('mars', 'n1');
      // Nothing should be called — the computed in GameStateService handles this.
      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
      expect(gameState.setEarthFlag).not.toHaveBeenCalled();
    });

    it('set_flag: calls setEarthFlag with true', () => {
      setupSingleEffectNode({ type: 'set_flag', flag: 'earth_restored' });
      service.unlockTech('mars', 'n1');
      expect(gameState.setEarthFlag).toHaveBeenCalledWith('earth_restored', true);
    });

    it('spillover_unlock: unlocks on the targetPlanet (not the calling planet)', () => {
      const spillTarget = makeTechNode({ id: 'venus_spill', planet: 'venus', effects: [] });
      const origin = makeTechNode({
        id: 'n1',
        effects: [{ type: 'spillover_unlock', targetPlanet: 'venus', targetTech: 'venus_spill' }],
      });
      setup([origin, spillTarget]);

      service.unlockTech('mars', 'n1');

      const calls = (gameState.unlockTech as ReturnType<typeof vi.fn>).mock.calls.map(
        (c: unknown[]) => c[0],
      );
      expect(calls).toContain('venus_spill');
    });
  });

  // -------------------------------------------------------------------------
  // getAvailableTechs / getCompletedTechs
  // -------------------------------------------------------------------------

  describe('getAvailableTechs()', () => {
    it('returns only nodes that pass canUnlock for the given planet', () => {
      const ready = makeTechNode({ id: 'ready', planet: 'mars', prerequisites: [] });
      const blocked = makeTechNode({
        id: 'blocked',
        planet: 'mars',
        prerequisites: ['missing'],
        prerequisiteMode: 'all',
      });
      setup([ready, blocked]);

      const available = service.getAvailableTechs('mars');
      expect(available.map((n) => n.id)).toEqual(['ready']);
    });
  });

  describe('getCompletedTechs()', () => {
    it('returns nodes whose ids are in completedTechs', () => {
      const done = makeTechNode({ id: 'done', planet: 'mars' });
      const pending = makeTechNode({ id: 'pending', planet: 'mars' });
      setup([done, pending], { completedTechs: ['done'] });

      const completed = service.getCompletedTechs('mars');
      expect(completed.map((n) => n.id)).toEqual(['done']);
    });
  });
});
