/**
 * Valid planet identifiers.
 * @see isPlanetId() in planet.validation.ts for runtime type guard
 */
export type PlanetId = 'earth' | 'mercury' | 'mars' | 'venus';

/** Direction of a planet's visual spin around its internal axis. */
export type PlanetRotationDirection = 'prograde' | 'retrograde';

/**
 * Static planet data loaded from planets.json at startup.
 * Immutable after load — never modified at runtime.
 *
 * @validation Use validatePlanetData() before trusting JSON/external sources
 */
export interface PlanetPhase {
  /** Human-readable phase name shown in the planets panel (e.g. "Barren", "Thin Atmosphere"). */
  displayName: string;
  /** One-sentence description of this phase, shown in the planet panel header. */
  description: string;
}

export interface PlanetData {
  id: PlanetId;
  displayName: string;
  /** null = always unlocked (Earth only), otherwise references a tech/milestone ID */
  unlockCondition: string | null;
  initialState: PlanetInitialState;
  visual: PlanetVisualData;
  /** Ordered phase display names, indexed by terraformingPhase. */
  phases: PlanetPhase[];
}

/**
 * Initial atmospheric and visual state for a planet at game start.
 */
export interface PlanetInitialState {
  /** Atmospheric pressure in Earth atmospheres (atm). Must be >= 0. */
  atmospherePressure: number;
  /** Surface temperature in Celsius. Can be negative. */
  temperatureCelsius: number;
  /** Starting terraforming phase (0-based). Must be non-negative integer. */
  terraformingPhase: number;
  /** Visual planet axis spin speed used by the orrery. Must be >= 0. */
  axisSpinSpeed: number;
  /** Visual planet axis spin direction used by the orrery. */
  axisRotationDirection: PlanetRotationDirection;
  /** Cloud layer rotation speed. Must be >= 0. */
  cloudRotationSpeed: number;
  /** Hex color string (e.g., '#87ceeb'). Must include '#' prefix. */
  atmosphereColor: string;
  /** Atmosphere visual density [0-1+]. Must be >= 0. */
  atmosphereDensity: number;
}

/**
 * Static visual asset data for a planet.
 * Planet-specific fields (lava*, cityLights*) should only appear on their respective planets.
 *
 * @validation Use validateVisualData() to check UV ranges and planet-specific field placement
 */
export interface PlanetVisualData {
  /** Hex color for base planet material. Must include '#' prefix. */
  baseColor: string;
  /** Map of visual layer name to equirectangular SVG texture path. */
  layerTextures: Record<string, string>;
  /** Static render metadata for the orrery atmosphere rim glow. */
  atmosphereGlow?: PlanetAtmosphereGlowData;
  /** UV coordinates [u, v] for water spot centers. Each component must be in [0,1]. */
  waterSpotUvs: [number, number][];
  /** UV coordinates [u, v] for vegetation spot centers. Each component must be in [0,1]. */
  greenSpotUvs: [number, number][];
  /** Mars only: UV coordinates for lava spots. */
  lavaSpotUvs?: [number, number][];
  /** Mars only: Hue shift data for lava cooling animation. Hues in [0,360] degrees. */
  lavaHueData?: { hotHue: number; cooledHue: number };
}

export interface PlanetAtmosphereGlowData {
  /** Whether the orrery should draw an additive atmosphere rim for this planet. */
  enabled: boolean;
  /** Optional static override. Runtime visualParams.atmosphereColor usually wins. */
  color?: string;
  /** Per-planet glow strength multiplier. Must be >= 0. */
  intensity?: number;
}

/**
 * Mutable runtime state for a planet. Stored in GameStateService signals.
 * Serialized to save files.
 *
 * @validation Use validatePlanetState() when loading from save files
 * @see sanitizePlanetState() to clamp corrupted values to safe ranges
 */
export interface PlanetState {
  id: PlanetId;
  /** Current atmospheric pressure in atm. Must be >= 0 (can underflow in edge cases). */
  atmospherePressure: number;
  /** Current surface temperature in Celsius. Can be negative. */
  temperatureCelsius: number;
  /** Current terraforming phase (0-based). Must be non-negative integer. */
  terraformingPhase: number;
  /** Progress within current phase [0.0-1.0]. Advances to next phase at 1.0. */
  terraformingProgress: number;
  /** Active terraforming choices by choice ID. Keys must not include '__proto__', 'constructor', etc. */
  terraformingChoices: Record<string, TerraformingChoice>;
  /** Choice IDs permanently locked out by other choices. Must not contain duplicates. */
  lockedOutChoices: string[];
  /** Current population count. Must be non-negative integer (can be fractional due to bugs). */
  population: number;
  /** Whether a biodome is operational on this planet. */
  hasBiodome: boolean;
  /** Current computed visual parameters for rendering. See PlanetVisualParams validation rules. */
  visualParams: PlanetVisualParams;
  /** Year when current terraforming transition started. Must be <= terraformEndYear. */
  terraformStartYear: number;
  /** Year when current terraforming transition ends. Used by getValueAtYear() pattern. */
  terraformEndYear: number;
  /** Mars only: game year when polar-detonation radiation hazard clears. 0 = no active hazard. */
  marsRadiationClearYear?: number;
}

/**
 * A terraforming choice (tech-applied intervention) affecting a planet.
 */
export interface TerraformingChoice {
  /** Whether this choice is currently active and contributing to terraforming rates. */
  active: boolean;
  /** Game year when this choice was activated. */
  startedYear: number;
  /** If true, this choice cannot be deactivated once started. */
  permanent: boolean;
}

/**
 * Current computed visual parameters for planet rendering.
 * These values are derived from gameYear + terraformStartYear/EndYear using getValueAtYear().
 * Never cached — always computed fresh to ensure save/load determinism.
 *
 * @validation Use validateVisualParams() to check ranges before rendering
 */
export interface PlanetVisualParams {
  /** Radius of water spot growth effect. Must be >= 0. */
  waterGrowthRadius: number;
  /** Opacity of water layer [0-1]. */
  waterOpacity: number;
  /** Radius of vegetation spot growth effect. Must be >= 0. */
  greenGrowthRadius: number;
  /** Opacity of vegetation layer [0-1]. */
  greenOpacity: number;
  /** Opacity of lava layer [0-1]. Mars only. */
  lavaOpacity: number;
  /** Lava hue shift [0-1]: 0 = hot red, 1 = cooled black. Mars only. */
  lavaHueShift: number;
  /** Opacity of cloud layer [0-1]. */
  cloudOpacity: number;
  /** Visual density of atmosphere effect. Must be >= 0. */
  atmosphereDensity: number;
  /** Current atmosphere color (hex string with '#' prefix). Changes as planet transforms. */
  atmosphereColor: string;
  /** Current cloud rotation speed. Must be >= 0. */
  cloudRotationSpeed: number;
  /** Current planet axis spin speed. Must be >= 0. */
  axisSpinSpeed: number;
  /** Current planet axis spin direction used by the orrery. */
  axisRotationDirection: PlanetRotationDirection;
  /** Intensity of city lights overlay [0-1]. */
  cityLightsIntensity: number;
}
