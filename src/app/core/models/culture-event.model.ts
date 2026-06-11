/**
 * culture-event.model.ts
 * Type definitions for culture events in Helioscape.
 * Culture events are narrative moments with branching choices.
 */

import type { TechEffect } from './tech-tree.model';

/**
 * CultureEvent — static data loaded from culture_events.json
 */
export interface CultureEvent {
  id: string;
  title: string;
  narratorText: string; // 1-3 paragraphs, \n\n between paragraphs
  portrait: string; // SVG asset path
  choices: CultureEventChoice[];
  tags: ('naturalist' | 'architect')[];
  trigger: CultureEventTrigger;
  priority: boolean; // true = displaces current event
}

/**
 * CultureEventChoice — a single choice option within a culture event
 */
export interface CultureEventChoice {
  id: string;
  label: string;
  tag: 'naturalist' | 'architect' | '';
  effects: TechEffect[];
}

/**
 * CultureEventTrigger — discriminated union defining when an event is triggered
 */
export type CultureEventTrigger =
  | { type: 'tech_completed'; techId: string }
  | { type: 'milestone_reached'; milestoneId: string }
  | { type: 'year_reached'; year: number }
  | { type: 'terraforming_choice_applied'; planet: string; choiceId: string }
  | { type: 'dyson_percent_reached'; percent: number }
  | { type: 'bio_phase_complete'; planet: string; phase: string }
  | { type: 'bio_phase_collapsed'; planet: string };

/**
 * CultureEventEntry — queue item representing a pending event (serialised in save)
 */
export interface CultureEventEntry {
  eventId: string;
  queuedAtYear: number;
  priority: boolean;
  wasInterrupted: boolean;
}

/**
 * CultureEventHistoryEntry — record of a displayed event (for save state)
 */
export interface CultureEventHistoryEntry {
  eventId: string;
  year: number;
  planetContext: string;
}
