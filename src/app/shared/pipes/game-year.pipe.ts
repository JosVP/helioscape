import { Pipe, PipeTransform } from '@angular/core';

/**
 * GameYearPipe — formats a raw game year number into the player-facing string.
 *
 * Usage: {{ gameYear() | gameYear }}  →  "Year 2087"
 */
@Pipe({ name: 'gameYear', standalone: true, pure: true })
export class GameYearPipe implements PipeTransform {
  transform(year: number): string {
    return `Year ${year}`;
  }
}
