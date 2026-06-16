// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  DEFAULT_ORRERY_GRID_OPTIONS,
  PLANET_ORBITS,
  buildBackground,
  buildEclipticGrid,
  buildPlanetObjects,
  buildStarfield,
  disposeScene,
  type OrreryBackdropPalette,
} from './orrery-scene.builder';

const palette: OrreryBackdropPalette = {
  backgroundCore: '#21180f',
  backgroundEdge: '#040609',
  grid: '#6091aa',
  orbit: '#5f91aa',
  star: '#f4ead1',
  featureStar: '#ffc766',
};

function attributeArray(object: THREE.Object3D): Float32Array {
  const lineSegments = object as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  return lineSegments.geometry.getAttribute('position').array as Float32Array;
}

describe('orrery scene builder', () => {
  it('buildBackground assigns and returns a canvas texture', () => {
    const scene = new THREE.Scene();

    const texture = buildBackground(scene, palette);

    expect(texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(scene.background).toBe(texture);
  });

  it('buildStarfield creates one points object with one geometry and one material', () => {
    const scene = new THREE.Scene();

    const points = buildStarfield(scene, {
      palette,
      starCount: 4,
      featureStarCount: 2,
    });

    expect(points).toBeInstanceOf(THREE.Points);
    expect(points.geometry.getAttribute('position').count).toBe(6);
    expect(points.material).toBeInstanceOf(THREE.PointsMaterial);
    expect(scene.children).toContain(points);
  });

  it('buildEclipticGrid aligns rings to configured orbit radii and toggles spokes', () => {
    const scene = new THREE.Scene();

    const grid = buildEclipticGrid(scene, PLANET_ORBITS, {
      color: palette.grid,
      opacity: 0.14,
      showRadialSpokes: false,
    });
    const positions = attributeArray(grid);

    expect(grid).toBeInstanceOf(THREE.LineSegments);
    expect(positions[0]).toBe(PLANET_ORBITS['mercury'].orreryRadius);
    expect(positions[1]).toBeCloseTo(DEFAULT_ORRERY_GRID_OPTIONS.yOffset);
    expect(positions).toHaveLength(Object.keys(PLANET_ORBITS).length * 96 * 2 * 3);
    expect(scene.children).toContain(grid);
  });

  it('buildEclipticGrid adds radial spoke segments when enabled', () => {
    const scene = new THREE.Scene();
    const radialSpokeCount = 6;

    const grid = buildEclipticGrid(scene, PLANET_ORBITS, {
      color: palette.grid,
      showRadialSpokes: true,
      radialSpokeCount,
    });
    const positions = attributeArray(grid);
    const expectedSegments = Object.keys(PLANET_ORBITS).length * 96 + radialSpokeCount;

    expect(positions).toHaveLength(expectedSegments * 2 * 3);
  });

  it('buildPlanetObjects uses passed orbit color and opacity', () => {
    const scene = new THREE.Scene();

    const { orbitMaterial } = buildPlanetObjects(
      scene,
      'earth',
      '#3a7ab8',
      PLANET_ORBITS['earth'],
      { color: '#123456', opacity: 0.33 }
    );

    expect(`#${orbitMaterial.color.getHexString()}`).toBe('#123456');
    expect(orbitMaterial.opacity).toBe(0.33);
    expect(orbitMaterial.transparent).toBe(true);
  });

  it('disposeScene disposes background textures and non-mesh render objects', () => {
    const scene = new THREE.Scene();
    const background = new THREE.Texture();
    const backgroundDispose = vi.spyOn(background, 'dispose');
    scene.background = background;

    const pointsGeometry = new THREE.BufferGeometry();
    const pointsMaterial = new THREE.PointsMaterial();
    const pointsGeometryDispose = vi.spyOn(pointsGeometry, 'dispose');
    const pointsMaterialDispose = vi.spyOn(pointsMaterial, 'dispose');
    scene.add(new THREE.Points(pointsGeometry, pointsMaterial));

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial();
    const lineGeometryDispose = vi.spyOn(lineGeometry, 'dispose');
    const lineMaterialDispose = vi.spyOn(lineMaterial, 'dispose');
    scene.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    const meshGeometry = new THREE.SphereGeometry(1, 8, 8);
    const meshMaterial = new THREE.MeshBasicMaterial();
    const meshGeometryDispose = vi.spyOn(meshGeometry, 'dispose');
    const meshMaterialDispose = vi.spyOn(meshMaterial, 'dispose');
    scene.add(new THREE.Mesh(meshGeometry, meshMaterial));

    const renderer = { dispose: vi.fn() } as unknown as THREE.WebGLRenderer;

    disposeScene(scene, renderer);

    expect(backgroundDispose).toHaveBeenCalledOnce();
    expect(scene.background).toBeNull();
    expect(pointsGeometryDispose).toHaveBeenCalledOnce();
    expect(pointsMaterialDispose).toHaveBeenCalledOnce();
    expect(lineGeometryDispose).toHaveBeenCalledOnce();
    expect(lineMaterialDispose).toHaveBeenCalledOnce();
    expect(meshGeometryDispose).toHaveBeenCalledOnce();
    expect(meshMaterialDispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });
});
