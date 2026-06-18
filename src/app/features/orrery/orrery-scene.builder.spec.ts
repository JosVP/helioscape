// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { PlanetData } from '@app/core/models';
import {
  DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG,
  DEFAULT_ORRERY_GRID_OPTIONS,
  ORRERY_ORBIT_RING_CONFIG,
  PLANET_ORBITS,
} from './orrery-scene.config';
import {
  buildAtmosphereGlow,
  buildBackground,
  buildEclipticGrid,
  buildPlanetObjects,
  buildStarfield,
  buildSun,
  buildSunGlow,
  disposeScene,
  loadOrrerySvgTexture,
} from './orrery-scene.builder';
import type {
  OrreryAtmosphereGlowMaterial,
  OrreryBackdropPalette,
  OrreryLayerMaterial,
  OrreryPlanetMaterial,
} from './orrery-scene.types';

const palette: OrreryBackdropPalette = {
  backgroundCore: '#21180f',
  backgroundEdge: '#040609',
  grid: '#6091aa',
  orbit: '#5f91aa',
  orbitHover: '#ffbe76',
  star: '#f4ead1',
  featureStar: '#ffc766',
};

function attributeArray(object: THREE.Object3D): Float32Array {
  const lineSegments = object as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  return lineSegments.geometry.getAttribute('position').array as Float32Array;
}

function makePlanetData(withTexture = false): PlanetData {
  return {
    id: 'earth',
    displayName: 'Earth',
    unlock: { type: 'start_unlocked' },
    initialState: {
      atmospherePressure: 1,
      temperatureCelsius: 15,
      terraformingPhase: 0,
      axisSpinSpeed: 1,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0.002,
      atmosphereColor: '#4488ff',
      atmosphereDensity: 0.35,
    },
    visual: {
      baseColor: '#3a7ab8',
      layerTextures: withTexture
        ? {
            surface: '/assets/svg/planets/textures/earth-surface-texture.svg',
            cloud: '/assets/svg/planets/textures/earth-cloud-texture.svg',
            cityLights: '/assets/svg/planets/textures/earth-city-lights-texture.svg',
          }
        : {},
      atmosphereGlow: { enabled: true, intensity: 0.85 },
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases: [],
  };
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

    const { orbitMesh, orbitMaterial } = buildPlanetObjects(
      scene,
      makePlanetData(),
      PLANET_ORBITS['earth'],
      { color: '#123456', opacity: 0.33 }
    );

    expect(orbitMesh).toBeInstanceOf(THREE.Mesh);
    expect(orbitMesh.geometry).toBeInstanceOf(THREE.RingGeometry);
    expect(orbitMesh.userData['planetId']).toBe('earth');
    expect(orbitMesh.userData['interactionKind']).toBe('orbit');
    expect(orbitMaterial).toBeInstanceOf(THREE.ShaderMaterial);
    expect(`#${orbitMaterial.uniforms.uColor.value.getHexString()}`).toBe('#123456');
    expect(orbitMaterial.uniforms.uOpacity.value).toBe(0.33);
    expect(orbitMaterial.uniforms.uRadius.value).toBe(PLANET_ORBITS['earth'].orreryRadius);
    expect(orbitMaterial.uniforms.uLineWidthPx.value).toBe(ORRERY_ORBIT_RING_CONFIG.lineWidthPx);
    expect(orbitMaterial.transparent).toBe(true);
    expect(orbitMaterial.depthWrite).toBe(false);
    expect(orbitMaterial.side).toBe(THREE.DoubleSide);
    expect(scene.children).toContain(orbitMesh);
  });

  it('buildPlanetObjects adds a wider invisible orbit hit proxy with the planet id', () => {
    const scene = new THREE.Scene();

    const { orbitHitMesh } = buildPlanetObjects(
      scene,
      makePlanetData(),
      PLANET_ORBITS['earth'],
      { color: '#123456', opacity: 0.33 }
    );

    expect(orbitHitMesh).toBeInstanceOf(THREE.Mesh);
    expect(orbitHitMesh.visible).toBe(true);
    expect(orbitHitMesh.userData['planetId']).toBe('earth');
    expect(orbitHitMesh.userData['interactionKind']).toBe('orbit-hit');
    expect(orbitHitMesh.material.opacity).toBe(0);
    expect(orbitHitMesh.material.transparent).toBe(true);
    expect(orbitHitMesh.material.colorWrite).toBe(false);
    expect(orbitHitMesh.geometry.parameters.tube).toBeGreaterThan(0);
    expect(scene.children).toContain(orbitHitMesh);
  });

  it('buildSun renders the sun with an unlit visible texture', () => {
    const scene = new THREE.Scene();
    const sunTexture = new THREE.Texture(new Image());
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockReturnValue(sunTexture);

    buildSun(scene);

    const sunMesh = scene.children[0] as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    expect(sunMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(sunMesh.material.map).toBe(sunTexture);
    expect(sunMesh.material.toneMapped).toBe(false);
  });

  it('buildSunGlow creates an additive sprite with a canvas texture', () => {
    const scene = new THREE.Scene();

    const glow = buildSunGlow(scene, {
      ...DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG.sunGlow,
      color: '#ffbe76',
    });

    expect(glow).not.toBeNull();
    expect(glow?.sprite).toBeInstanceOf(THREE.Sprite);
    expect(glow?.texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(glow?.material.blending).toBe(THREE.AdditiveBlending);
    expect(glow?.material.depthWrite).toBe(false);
    expect(glow?.material.depthTest).toBe(false);
    expect(scene.children).toContain(glow?.sprite);
  });

  it('buildSunGlow returns null when disabled', () => {
    const scene = new THREE.Scene();

    const glow = buildSunGlow(scene, {
      ...DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG.sunGlow,
      enabled: false,
      color: '#ffbe76',
    });

    expect(glow).toBeNull();
    expect(scene.children).toHaveLength(0);
  });

  it('buildAtmosphereGlow creates a larger additive back-side shell when enabled', () => {
    const scene = new THREE.Scene();

    const glow = buildAtmosphereGlow(
      scene,
      makePlanetData(),
      PLANET_ORBITS['earth'],
      { ...DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG.atmosphereGlow, enabled: true }
    );

    expect(glow).not.toBeNull();
    expect(glow?.mesh).toBeInstanceOf(THREE.Mesh);
    expect(glow?.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(glow?.material.blending).toBe(THREE.AdditiveBlending);
    expect(glow?.material.side).toBe(THREE.BackSide);
    expect(glow?.material.depthWrite).toBe(false);
    expect(glow?.mesh.geometry.parameters.radius).toBeGreaterThan(PLANET_ORBITS['earth'].visualRadius);
    expect(scene.children).toContain(glow?.mesh);
  });

  it('buildAtmosphereGlow returns null when planet data disables it', () => {
    const scene = new THREE.Scene();
    const planetData = makePlanetData();
    planetData.visual.atmosphereGlow = { enabled: false, intensity: 0 };

    const glow = buildAtmosphereGlow(
      scene,
      planetData,
      PLANET_ORBITS['earth'],
      DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG.atmosphereGlow
    );

    expect(glow).toBeNull();
    expect(scene.children).toHaveLength(0);
  });

  it('loadOrrerySvgTexture loads and configures a disposable texture from a path', () => {
    const loadedTexture = new THREE.Texture(new Image());
    const loadSpy = vi
      .spyOn(THREE.TextureLoader.prototype, 'load')
      .mockReturnValue(loadedTexture);

    const texture = loadOrrerySvgTexture('/assets/svg/planets/textures/test-world.svg', 'test-world');

    expect(loadSpy).toHaveBeenCalledWith('/assets/svg/planets/textures/test-world.svg');
    expect(texture).toBe(loadedTexture);
    expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(texture.wrapS).toBe(THREE.RepeatWrapping);
    expect(texture.wrapT).toBe(THREE.ClampToEdgeWrapping);
    expect(texture.name).toBe('test-world-svg-texture');
  });

  it('buildPlanetObjects assigns shader uniforms and layer meshes from layer textures', () => {
    const scene = new THREE.Scene();
    const baseTexture = new THREE.Texture(new Image());
    const cloudTexture = new THREE.Texture(new Image());
    const cityLightsTexture = new THREE.Texture(new Image());
    vi.spyOn(THREE.TextureLoader.prototype, 'load')
      .mockReturnValueOnce(baseTexture)
      .mockReturnValueOnce(cloudTexture)
      .mockReturnValueOnce(cityLightsTexture);

    const { planetMaterial, layerObjects } = buildPlanetObjects(
      scene,
      makePlanetData(true),
      PLANET_ORBITS['earth'],
      { color: '#123456', opacity: 0.33 }
    );

    expect(planetMaterial).toBeInstanceOf(THREE.ShaderMaterial);
    expect(planetMaterial.uniforms.uBaseTexture.value).toBe(baseTexture);
    expect(planetMaterial.uniforms.uHasBaseTexture.value).toBe(true);
    expect(`#${planetMaterial.uniforms.uBaseColor.value.getHexString()}`).toBe('#3a7ab8');
    expect(layerObjects.map((layer) => layer.key)).toEqual(['cloud', 'cityLights']);
    expect(layerObjects[0].material.uniforms.uLayerTexture.value).toBe(cloudTexture);
    expect(layerObjects[1].material.uniforms.uLayerTexture.value).toBe(cityLightsTexture);
    expect(layerObjects[1].material.uniforms.uNightOnly.value).toBe(true);
    expect(layerObjects[1].material.blending).toBe(THREE.AdditiveBlending);
    expect(layerObjects[1].mesh.renderOrder).toBeGreaterThan(layerObjects[0].mesh.renderOrder);
    expect(layerObjects[1].material.fragmentShader).toContain('float brightness = uNightOnly ? 1.0');
  });

  it('buildPlanetObjects falls back to base color when no texture path exists', () => {
    const scene = new THREE.Scene();

    const { planetMaterial } = buildPlanetObjects(
      scene,
      makePlanetData(false),
      PLANET_ORBITS['earth'],
      { color: '#123456', opacity: 0.33 }
    );

    expect(planetMaterial).toBeInstanceOf(THREE.ShaderMaterial);
    expect(planetMaterial.uniforms.uHasBaseTexture.value).toBe(false);
    expect(`#${planetMaterial.uniforms.uBaseColor.value.getHexString()}`).toBe('#3a7ab8');
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
    const materialMap = new THREE.CanvasTexture(document.createElement('canvas'));
    const materialMapDispose = vi.spyOn(materialMap, 'dispose');
    const meshMaterial = new THREE.MeshBasicMaterial({ map: materialMap });
    const meshGeometryDispose = vi.spyOn(meshGeometry, 'dispose');
    const meshMaterialDispose = vi.spyOn(meshMaterial, 'dispose');
    scene.add(new THREE.Mesh(meshGeometry, meshMaterial));

    const shaderBaseTexture = new THREE.Texture();
    const shaderLayerTexture = new THREE.Texture();
    const shaderBaseDispose = vi.spyOn(shaderBaseTexture, 'dispose');
    const shaderLayerDispose = vi.spyOn(shaderLayerTexture, 'dispose');
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseTexture: { value: shaderBaseTexture },
        uLayerTexture: { value: shaderLayerTexture },
      },
    }) as OrreryPlanetMaterial | OrreryLayerMaterial;
    const shaderMaterialDispose = vi.spyOn(shaderMaterial, 'dispose');
    scene.add(new THREE.Mesh(new THREE.BufferGeometry(), shaderMaterial));

    const spriteTexture = new THREE.CanvasTexture(document.createElement('canvas'));
    const spriteTextureDispose = vi.spyOn(spriteTexture, 'dispose');
    const spriteMaterial = new THREE.SpriteMaterial({ map: spriteTexture });
    const spriteMaterialDispose = vi.spyOn(spriteMaterial, 'dispose');
    scene.add(new THREE.Sprite(spriteMaterial));

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#4488ff') },
        uIntensity: { value: 1 },
      },
    }) as OrreryAtmosphereGlowMaterial;
    const atmosphereMaterialDispose = vi.spyOn(atmosphereMaterial, 'dispose');
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), atmosphereMaterial));

    const renderer = { dispose: vi.fn() } as unknown as THREE.WebGLRenderer;

    disposeScene(scene, renderer);

    expect(backgroundDispose).toHaveBeenCalledOnce();
    expect(scene.background).toBeNull();
    expect(pointsGeometryDispose).toHaveBeenCalledOnce();
    expect(pointsMaterialDispose).toHaveBeenCalledOnce();
    expect(lineGeometryDispose).toHaveBeenCalledOnce();
    expect(lineMaterialDispose).toHaveBeenCalledOnce();
    expect(meshGeometryDispose).toHaveBeenCalledOnce();
    expect(materialMapDispose).toHaveBeenCalledOnce();
    expect(meshMaterial.map).toBeNull();
    expect(meshMaterialDispose).toHaveBeenCalledOnce();
    expect(shaderBaseDispose).toHaveBeenCalledOnce();
    expect(shaderLayerDispose).toHaveBeenCalledOnce();
    expect(shaderMaterialDispose).toHaveBeenCalledOnce();
    expect(spriteTextureDispose).toHaveBeenCalledOnce();
    expect(spriteMaterialDispose).toHaveBeenCalledOnce();
    expect(atmosphereMaterialDispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });
});
