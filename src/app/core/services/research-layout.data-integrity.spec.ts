import { describe, expect, it } from 'vitest';
import layout from '../../../../public/data/research-layout.json';
import researchNodes from '../../../../public/data/research-tracks.json';
import type { ResearchLayoutData, ResearchNode } from '@app/core/models';

const typedLayout = layout as ResearchLayoutData;
const typedResearchNodes = researchNodes as ResearchNode[];

describe('research layout data integrity', () => {
  it('has one authored layout entry for every research node', () => {
    const researchNodeIds = new Set(typedResearchNodes.map((node) => node.id));
    const layoutNodeIds = new Set(typedLayout.nodes.map((node) => node.nodeId));

    expect(layoutNodeIds.size).toBe(typedLayout.nodes.length);
    expect(layoutNodeIds).toEqual(researchNodeIds);
  });

  it('does not place two nodes on the same axial coordinate', () => {
    const coordinates = typedLayout.nodes.map((node) => `${node.q},${node.r}`);

    expect(new Set(coordinates).size).toBe(coordinates.length);
  });

  it('places every node in a known region', () => {
    const regionIds = new Set(typedLayout.regions.map((region) => region.id));

    expect(typedLayout.nodes.every((node) => regionIds.has(node.region))).toBe(true);
  });
});