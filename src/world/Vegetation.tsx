import { useEffect, useMemo, useRef } from 'react';
import { Color, Euler, InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { curbSlots, STADIUM_CENTER, MANSION_CENTER } from '../data/world';
import { useGameStore } from '../state';

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

type Palm = { x: number; z: number; h: number; lean: number; yaw: number };
function palmSpots(): Palm[] {
  const random = rng(4242); const list: Palm[] = [];
  curbSlots(15).forEach((slot, index) => { if (index % 2 === 0 && random() > 0.25) list.push({ x: slot.x, z: slot.z, h: 6 + random() * 3.5, lean: (random() - 0.5) * 0.18, yaw: random() * 6.28 }); });
  // vias de acesso aos distritos
  for (const side of [-1, 1]) for (let x = 96; x <= 128; x += 11) for (const s of [-1, 1]) { list.push({ x: side * x, z: s * 8.5, h: 7 + random() * 3, lean: (random() - 0.5) * 0.15, yaw: random() * 6.28 }); }
  // estacionamento e praça dos distritos
  for (let i = 0; i < 14; i++) list.push({ x: STADIUM_CENTER[0] - 50 + (i % 7) * 9, z: (i < 7 ? -1 : 1) * 24, h: 6.5 + random() * 3, lean: (random() - 0.5) * 0.15, yaw: random() * 6.28 });
  for (let i = 0; i < 8; i++) list.push({ x: MANSION_CENTER[0] + 30 + (i % 4) * 4, z: (i < 4 ? -1 : 1) * 12, h: 6 + random() * 2, lean: 0.05, yaw: random() * 6.28 });
  return list;
}

export function Palms() {
  const palms = useMemo(palmSpots, []);
  const trunks = useRef<InstancedMesh>(null); const fronds = useRef<InstancedMesh>(null);
  useEffect(() => {
    const m = new Matrix4(); const q = new Quaternion(); const e = new Euler(); const p = new Vector3(); const sc = new Vector3(1, 1, 1);
    let f = 0;
    palms.forEach((palm, i) => {
      e.set(palm.lean, palm.yaw, palm.lean * 0.5); q.setFromEuler(e);
      p.set(palm.x, palm.h / 2, palm.z); sc.set(1, palm.h, 1); m.compose(p, q, sc); trunks.current?.setMatrixAt(i, m);
      const top = new Vector3(palm.x + Math.sin(palm.lean) * palm.h * 0.5, palm.h, palm.z);
      for (let k = 0; k < 8; k++) {
        const angle = (k / 8) * Math.PI * 2 + palm.yaw;
        const fq = new Quaternion().setFromEuler(new Euler(0.55 + (k % 2) * 0.25, angle, 0, 'YXZ'));
        const dir = new Vector3(0, 0, 1.45).applyQuaternion(fq);
        m.compose(new Vector3(top.x + dir.x * 0.5, top.y + dir.y * 0.5 - 0.1, top.z + dir.z * 0.5), fq, new Vector3(1, 1, 1)); fronds.current?.setMatrixAt(f++, m);
      }
    });
    for (const mesh of [trunks.current, fronds.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
  }, [palms]);
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, palms.length]} castShadow frustumCulled={false}><cylinderGeometry args={[0.13, 0.22, 1, 7]} /><meshStandardMaterial color="#8a6a49" roughness={1} /></instancedMesh>
    <instancedMesh ref={fronds} args={[undefined, undefined, palms.length * 8]} castShadow frustumCulled={false}><boxGeometry args={[0.55, 0.05, 3]} /><meshStandardMaterial color="#3f8f4f" roughness={0.9} /></instancedMesh>
  </group>;
}

export function Lamps() {
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const slots = useMemo(() => curbSlots(30, 6.25).filter((_, i) => i % 2 === 1), []);
  const poles = useRef<InstancedMesh>(null); const heads = useRef<InstancedMesh>(null);
  useEffect(() => {
    const o = new Object3D();
    slots.forEach((slot, i) => {
      o.position.set(slot.x + 7.5 * 0, 2.6, slot.z); o.scale.set(1, 1, 1); o.updateMatrix(); poles.current?.setMatrixAt(i, o.matrix);
      o.position.set(slot.x, 5.35, slot.z); o.updateMatrix(); heads.current?.setMatrixAt(i, o.matrix);
    });
    for (const mesh of [poles.current, heads.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
  }, [slots]);
  return <group>
    <instancedMesh ref={poles} args={[undefined, undefined, slots.length]} frustumCulled={false}><cylinderGeometry args={[0.07, 0.1, 5.2, 6]} /><meshStandardMaterial color="#2b3033" metalness={0.6} roughness={0.5} /></instancedMesh>
    <instancedMesh ref={heads} args={[undefined, undefined, slots.length]} frustumCulled={false}><sphereGeometry args={[0.3, 8, 6]} /><meshStandardMaterial color="#f8f0d4" emissive="#ffd88a" emissiveIntensity={night ? 2.6 : 0.05} /></instancedMesh>
  </group>;
}

export function FlowerBeds() {
  const spots = useMemo(() => { const random = rng(77); return curbSlots(15, 6.55).filter(() => random() > 0.55).map((slot) => ({ ...slot, r: 0.5 + random() * 0.35 })); }, []);
  const bushes = useRef<InstancedMesh>(null); const flowers = useRef<InstancedMesh>(null);
  useEffect(() => {
    const o = new Object3D(); let f = 0; const random = rng(31); const c = new Color();
    spots.forEach((spot, i) => {
      o.position.set(spot.x + 0.6 * spot.side * (spot.along === 'z' ? 1 : 0), 0.4, spot.z + 0.6 * spot.side * (spot.along === 'x' ? 1 : 0)); o.scale.set(spot.r * 1.5, spot.r, spot.r * 1.2); o.rotation.set(0, random() * 6, 0); o.updateMatrix(); bushes.current?.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 4; k++) {
        o.position.set(spot.x + (random() - 0.5) * 1.2, 0.55 + random() * 0.4, spot.z + (random() - 0.5) * 1.2); o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); flowers.current?.setMatrixAt(f, o.matrix);
        flowers.current?.setColorAt(f, c.set(['#e0383e', '#e85d8a', '#f2a03a'][Math.floor(random() * 3)])); f++;
      }
    });
    for (const mesh of [bushes.current, flowers.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }, [spots]);
  return <group>
    <instancedMesh ref={bushes} args={[undefined, undefined, spots.length]} castShadow frustumCulled={false}><sphereGeometry args={[0.8, 8, 6]} /><meshStandardMaterial color="#2f7a43" roughness={1} /></instancedMesh>
    <instancedMesh ref={flowers} args={[undefined, undefined, spots.length * 4]} frustumCulled={false}><sphereGeometry args={[0.15, 6, 5]} /><meshStandardMaterial roughness={0.8} /></instancedMesh>
  </group>;
}

