export interface MoonFacility {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface MoonData {
  readonly id: 'moon';
  readonly displayName: string;
  readonly subtitle: string;
  readonly description: string;
  readonly facilities: readonly MoonFacility[];
}
