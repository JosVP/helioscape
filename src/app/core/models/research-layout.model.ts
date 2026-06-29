export interface ResearchLayoutData {
  readonly hexSize: number;
  readonly hexGap: number;
  readonly regions: ResearchLayoutRegion[];
  readonly nodes: ResearchLayoutNode[];
}

export interface ResearchLayoutRegion {
  readonly id: string;
  readonly displayName: string;
  readonly anchor: ResearchAxialCoord;
}

export interface ResearchLayoutNode {
  readonly nodeId: string;
  readonly q: number;
  readonly r: number;
  readonly region: string;
}

export interface ResearchAxialCoord {
  readonly q: number;
  readonly r: number;
}

export interface ResearchPixelPoint {
  readonly x: number;
  readonly y: number;
}

export type ResearchHexSide = 'top' | 'upper-right' | 'lower-right' | 'bottom' | 'lower-left' | 'upper-left';