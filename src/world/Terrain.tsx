import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, Color, MathUtils, Object3D, PlaneGeometry, type InstancedMesh } from 'three';

const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x: number, y: number) {
  const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi); const b = hash(xi + 1, yi); const c = hash(xi, yi + 1); const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, z: number) {
  let amp = 1; let freq = 1; let sum = 0; let norm = 0;
  for (let i = 0; i < 5; i++) { sum += noise(x * freq, z * freq) * amp; norm += amp; amp *= 0.5; freq *= 2.03; }
  return sum / norm;
}

/** Altura do relevo ao redor da cidade. A cidade (|x|,|z| < 92) fica plana; fora dela o terreno sobe em morros e serras. */
export function terrainHeight(x: number, z: number) {
  const edge = Math.max(Math.abs(x), Math.abs(z));
  const t = MathUtils.clamp((edge - 92) / 175, 0, 1);
  const rise = t * t * (3 - 2 * t);
  const ridge = 1 - Math.abs(fbm(x * 0.006 + 9, z * 0.006 + 3) * 2 - 1);
  return -0.12 + rise * (12 + fbm(x * 0.013, z * 0.013) * 48 + ridge * 30);
}

const GRASS = new Color('#5d7a43'); const GRASS_DARK = new Color('#44603a'); const DIRT = new Color('#7d7656'); const ROCK = new Color('#8b8a80'); const tmp = new Color();

export function Terrain() {
  const geometry = useMemo(() => {
    const size = 800; const segments = 180;
    const geo = new PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position') as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const z = pos.getZ(i); const h = terrainHeight(x, z);
      pos.setY(i, h);
      const edge = Math.max(Math.abs(x), Math.abs(z));
      const patch = fbm(x * 0.05 + 40, z * 0.05 - 17);
      tmp.copy(GRASS).lerp(GRASS_DARK, patch);
      if (edge < 106) tmp.lerp(DIRT, MathUtils.clamp((106 - edge) / 14, 0, 1) * 0.85);
      const rock = MathUtils.clamp((h - 34) / 26, 0, 1) * (0.4 + patch * 0.6);
      tmp.lerp(ROCK, rock);
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  const trees = useMemo(() => {
    let seed = 90211; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const list: { x: number; y: number; z: number; s: number; tone: number }[] = [];
    let guard = 0;
    while (list.length < 420 && guard++ < 5000) {
      const x = (random() - 0.5) * 520; const z = (random() - 0.5) * 520;
      const edge = Math.max(Math.abs(x), Math.abs(z));
      const h = terrainHeight(x, z);
      if (edge < 98 || h > 46 || fbm(x * 0.03, z * 0.03) < 0.42) continue;
      list.push({ x, y: h, z, s: 0.8 + random() * 1.1, tone: random() });
    }
    return list;
  }, []);
  const cones = useRef<InstancedMesh>(null); const trunks = useRef<InstancedMesh>(null);
  useEffect(() => {
    const dummy = new Object3D(); const color = new Color();
    trees.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.y + 3.4 * tree.s, tree.z); dummy.scale.set(tree.s, tree.s, tree.s); dummy.rotation.set(0, tree.tone * 6, 0); dummy.updateMatrix();
      cones.current?.setMatrixAt(index, dummy.matrix);
      cones.current?.setColorAt(index, color.set('#2f4a33').lerp(new Color('#4d6b3d'), tree.tone));
      dummy.position.set(tree.x, tree.y + 0.9 * tree.s, tree.z); dummy.updateMatrix();
      trunks.current?.setMatrixAt(index, dummy.matrix);
    });
    for (const mesh of [cones.current, trunks.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }, [trees]);
  return <group>
    <mesh geometry={geometry} receiveShadow={false}><meshStandardMaterial vertexColors roughness={1} metalness={0} /></mesh>
    <instancedMesh ref={cones} args={[undefined, undefined, trees.length]} frustumCulled={false}><coneGeometry args={[1.9, 6.8, 7]} /><meshStandardMaterial roughness={1} /></instancedMesh>
    <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} frustumCulled={false}><cylinderGeometry args={[0.2, 0.28, 1.8, 6]} /><meshStandardMaterial color="#5b4630" roughness={1} /></instancedMesh>
  </group>;
}
