import { useEffect, useMemo, useRef } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { CanvasTexture, Color, Object3D, RepeatWrapping, SRGBColorSpace, type InstancedMesh } from 'three';
import { useGameStore } from '../state';
import { OptionalGlb } from './OptionalGlb';
import { Terrain } from './Terrain';

const STREETS = [-60, -30, 0, 30, 60];
const COLORS = ['#c6a17c', '#c7c3ae', '#99aaa0', '#b98d79', '#d0bc93', '#8fa3a4', '#bfad9a', '#c48b59'];

function Facade({ color, height, seed }: { color: string; height: number; seed: number }) {
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const rows = Math.max(1, Math.round(height / 6.5));
  const { map, glow } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const lit = document.createElement('canvas'); lit.width = 256; lit.height = 512;
    const lctx = lit.getContext('2d')!; lctx.fillStyle = '#000'; lctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 512);
    const brick = color === '#b98d79' || color === '#c48b59';
    if (brick) {
      ctx.globalAlpha = 0.28; ctx.strokeStyle = '#664b3b'; ctx.lineWidth = 2;
      for (let row = 0; row < 30; row++) {
        const y = row * 18;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        for (let col = row % 2 ? -8 : 0; col < 256; col += 32) { ctx.beginPath(); ctx.moveTo(col, y); ctx.lineTo(col, y + 18); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    }
    for (let row = 0; row < 7; row++) for (let col = 0; col < 4; col++) {
      const x = 22 + col * 62; const y = 24 + row * 68;
      ctx.fillStyle = '#54483e'; ctx.fillRect(x - 4, y - 4, 43, 43);
      const on = ((seed * 31 + row * 17 + col * 7) % 5) < 2;
      ctx.fillStyle = ['#73929b', '#91a7a7', '#667f86', '#a6aaa1'][(row + col) % 4]; ctx.fillRect(x, y, 35, 33);
      if (on) { lctx.fillStyle = ['#ffd995', '#ffe7b8', '#ffc978'][(row + col + seed) % 3]; lctx.fillRect(x, y, 35, 33); }
      ctx.fillStyle = '#d2c7b1'; ctx.fillRect(x + 16, y, 3, 33); ctx.fillRect(x, y + 29, 35, 4);
    }
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#3d3730';
    for (let i = 0; i < 140; i++) { const x = (i * 73) % 256; const y = (i * 137) % 512; ctx.fillRect(x, y, 2 + (i % 4), 1 + (i % 3)); }
    const base = new CanvasTexture(canvas); base.colorSpace = SRGBColorSpace; base.anisotropy = 8; base.wrapT = RepeatWrapping; base.repeat.set(1, rows);
    const emit = new CanvasTexture(lit); emit.colorSpace = SRGBColorSpace; emit.wrapT = RepeatWrapping; emit.repeat.set(1, rows);
    return { map: base, glow: emit };
  }, [color, rows, seed]);
  return <meshStandardMaterial map={map} roughness={0.82} metalness={0.04} emissive="#ffffff" emissiveMap={glow} emissiveIntensity={night ? 1.5 : 0} />;
}

function Building({ x, z, width, depth, height, color, seed }: { x: number; z: number; width: number; depth: number; height: number; color: string; seed: number }) {
  const floors = Math.max(1, Math.min(4, Math.round(height / 6.5)));
  const tank = seed % 3 === 0;
  return <RigidBody type="fixed" colliders={false} position={[x, height / 2, z]}>
    <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
    <OptionalGlb url="/models/predio.glb" scale={[width, height, depth]} fallback={<>
      <mesh castShadow receiveShadow><boxGeometry args={[width, height, depth]} /><Facade color={color} height={height} seed={seed} /></mesh>
      <mesh castShadow position={[0, height / 2 + 0.08, 0]}><boxGeometry args={[width + 0.38, 0.16, depth + 0.38]} /><meshStandardMaterial color={seed % 2 ? '#69675c' : '#777166'} roughness={0.95} /></mesh>
      <mesh castShadow position={[0, -height / 2 + 0.58, depth / 2 + 0.026]}><boxGeometry args={[0.92, 1.12, 0.07]} /><meshStandardMaterial color="#493b31" roughness={0.92} /></mesh>
      <mesh position={[0, -height / 2 + 1.36, depth / 2 + 0.03]}><boxGeometry args={[1.18, 0.09, 0.09]} /><meshStandardMaterial color="#c5b38d" roughness={0.94} /></mesh>
      {[-1, 1].map((side) => <group key={side} position={[side * width * 0.29, -height / 2 + 1.9, depth / 2 + 0.025]}>
        <mesh castShadow><boxGeometry args={[Math.max(1.25, width * 0.25), 1.22, 0.08]} /><meshStandardMaterial color="#3d403b" roughness={0.88} /></mesh>
        <mesh position={[0, 0, 0.05]}><boxGeometry args={[Math.max(1.04, width * 0.21), 0.98, 0.035]} /><meshStandardMaterial color={seed % 2 ? '#77939a' : '#91a0a0'} roughness={0.42} metalness={0.08} /></mesh>
        <mesh position={[0, 0.02, 0.08]}><boxGeometry args={[0.055, 1.0, 0.035]} /><meshStandardMaterial color="#c8baa0" /></mesh>
      </group>)}
      <mesh castShadow position={[0, -height / 2 + 0.12, 0]}><boxGeometry args={[width + 0.42, 0.24, depth + 0.42]} /><meshStandardMaterial color="#77766c" roughness={1} /></mesh>
      <mesh castShadow position={[-width * 0.22, height / 2 + 0.42, depth * 0.18]}><boxGeometry args={[1.5, 0.7, 1.1]} /><meshStandardMaterial color="#8b8d87" roughness={0.7} metalness={0.3} /></mesh>
      {height > 10 && <mesh castShadow position={[width * 0.3, height / 2 + 2.2, -depth * 0.2]}><cylinderGeometry args={[0.04, 0.06, 4.4, 5]} /><meshStandardMaterial color="#444" metalness={0.8} /></mesh>}
      {tank && <group position={[width * 0.25, height / 2 + 0.86, -depth * 0.2]}>
        <mesh castShadow><cylinderGeometry args={[0.7, 0.74, 1.45, 12]} /><meshStandardMaterial color="#77786d" roughness={0.8} /></mesh>
        <mesh position-y={0.75}><cylinderGeometry args={[0.72, 0.72, 0.1, 12]} /><meshStandardMaterial color="#454943" /></mesh>
        <mesh position-y={0.78}><cylinderGeometry args={[0.55, 0.55, 0.025, 12]} /><meshStandardMaterial color="#78989a" metalness={0.25} roughness={0.3} /></mesh>
      </group>}
    </>} />
    {Array.from({ length: Math.max(0, floors) }, (_, floor) => <Balcony key={floor} width={width} depth={depth} y={-height / 2 + 3.5 + floor * 7} />)}
  </RigidBody>;
}

function Balcony({ width, depth, y }: { width: number; depth: number; y: number }) {
  const span = Math.min(width * 0.58, 6.2);
  return <group position={[0, y, depth / 2]}>
    <mesh castShadow receiveShadow position={[0, 0, 0.72]}><boxGeometry args={[span, 0.14, 1.48]} /><meshStandardMaterial color="#b9b8ad" roughness={0.78} /></mesh>
    <mesh position={[0, 0.48, 1.42]}><boxGeometry args={[span - 0.12, 0.62, 0.045]} /><meshStandardMaterial color="#95a9aa" transparent opacity={0.5} roughness={0.22} metalness={0.22} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (span / 2 - 0.06), 0.45, 0.76]}><boxGeometry args={[0.07, 0.72, 1.42]} /><meshStandardMaterial color="#555d5c" metalness={0.55} /></mesh>)}
    <mesh castShadow position={[0, 0.34, 0.48]}><boxGeometry args={[0.62, 0.1, 0.52]} /><meshStandardMaterial color="#75634a" roughness={0.9} /></mesh>
    <mesh castShadow position={[0, 0.15, 0.48]}><cylinderGeometry args={[0.055, 0.07, 0.34, 8]} /><meshStandardMaterial color="#574b3b" /></mesh>
    {[-0.55, 0.55].map((side) => <group key={side} position={[side, 0, 0.48]}>
      <mesh castShadow position-y={0.28}><boxGeometry args={[0.42, 0.1, 0.42]} /><meshStandardMaterial color="#a38a65" /></mesh>
      <mesh castShadow position={[0, 0.55, -0.17]}><boxGeometry args={[0.42, 0.48, 0.08]} /><meshStandardMaterial color="#817055" /></mesh>
      <mesh castShadow position={[0, 0.43, 0]}><boxGeometry args={[0.3, 0.12, 0.3]} /><meshStandardMaterial color="#665a48" /></mesh>
    </group>)}
    <group position={[-span / 2 + 0.38, 0, 0.1]}><mesh castShadow position-y={0.36}><sphereGeometry args={[0.3, 9, 8]} /><meshStandardMaterial color="#55734f" roughness={1} /></mesh><mesh position-y={0.15}><cylinderGeometry args={[0.23, 0.28, 0.3, 9]} /><meshStandardMaterial color="#837c6d" /></mesh></group>
  </group>;
}

function TreeInstances({ trees }: { trees: [number, number][] }) {
  const trunk = useRef<InstancedMesh>(null); const canopy = useRef<InstancedMesh>(null); const canopyLeft = useRef<InstancedMesh>(null); const canopyRight = useRef<InstancedMesh>(null);
  useEffect(() => {
    const dummy = new Object3D(); const green = ['#48644a', '#536c4d', '#52684c', '#405c47'];
    trees.forEach(([x, z], index) => {
      const set = (mesh: InstancedMesh | null, slot: number, y: number, scale: [number, number, number]) => {
        if (!mesh) return;
        dummy.position.set(x + (slot === 1 ? -0.55 : slot === 2 ? 0.52 : 0), y, z + (slot === 1 ? 0.08 : slot === 2 ? -0.04 : 0));
        dummy.rotation.set(0, 0, 0); dummy.scale.set(...scale); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
        if (slot > 0) mesh.setColorAt(index, new Color(green[Math.abs(Math.round(x * 3 + z)) % green.length]));
      };
      set(trunk.current, 0, 1.1, [0.17, 1.1, 0.17]);
      set(canopy.current, 0, 2.55, [0.92, 1.08, 0.88]);
      set(canopyLeft.current, 1, 2.25, [0.5, 0.62, 0.55]);
      set(canopyRight.current, 2, 2.32, [0.53, 0.64, 0.58]);
    });
    for (const mesh of [trunk.current, canopy.current, canopyLeft.current, canopyRight.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }, [trees]);
  return <>
    <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} castShadow={false}><cylinderGeometry args={[0.14, 0.18, 2, 7]} /><meshStandardMaterial color="#66513c" roughness={0.95} /></instancedMesh>
    <instancedMesh ref={canopy} args={[undefined, undefined, trees.length]} castShadow={false}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#48644a" roughness={0.96} /></instancedMesh>
    <instancedMesh ref={canopyLeft} args={[undefined, undefined, trees.length]} castShadow={false}><sphereGeometry args={[0.78, 8, 7]} /><meshStandardMaterial color="#48644a" roughness={0.96} /></instancedMesh>
    <instancedMesh ref={canopyRight} args={[undefined, undefined, trees.length]} castShadow={false}><sphereGeometry args={[0.8, 8, 7]} /><meshStandardMaterial color="#48644a" roughness={0.96} /></instancedMesh>
  </>;
}

function StreetLamp({ x, z, illuminate }: { x: number; z: number; illuminate: boolean }) {
  const isNight = useGameStore((state) => state.timeOfDay === 'night');
  return <group position={[x, 0, z]}>
    <mesh castShadow position-y={3.1}><cylinderGeometry args={[0.055, 0.08, 6.2, 7]} /><meshStandardMaterial color="#464b47" metalness={0.65} /></mesh>
    <mesh castShadow position={[0.45, 6.05, 0]} rotation-z={-Math.PI / 4}><boxGeometry args={[1.1, 0.09, 0.12]} /><meshStandardMaterial color="#464b47" metalness={0.65} /></mesh>
    <mesh position={[0.82, 5.7, 0]}><boxGeometry args={[0.46, 0.1, 0.28]} /><meshStandardMaterial color="#f3dca3" emissive="#8a6930" emissiveIntensity={isNight ? 2.1 : 0.08} /></mesh>
    {isNight && illuminate && <pointLight position={[0.82, 5.65, 0]} color="#ffd99a" intensity={1.2} distance={11} decay={2} />}
  </group>;
}

function RoadNetwork() {
  const wet = useGameStore((state) => state.weather === 'rain');
  const roadRoughness = wet ? 0.28 : 0.97; const roadMetal = wet ? 0.35 : 0;
  const dashes = Array.from({ length: 12 }, (_, i) => (i - 5.5) * 12);
  const asphalt = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#34393a'; ctx.fillRect(0, 0, 256, 256);
    let seed = 38192;
    const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let i = 0; i < 3600; i++) {
      const tone = 50 + Math.floor(random() * 45); const alpha = 0.08 + random() * 0.18;
      ctx.fillStyle = `rgba(${tone},${tone},${tone},${alpha})`;
      const size = 1 + Math.floor(random() * 3); ctx.fillRect(random() * 256, random() * 256, size, size);
    }
    const map = new CanvasTexture(canvas); map.wrapS = RepeatWrapping; map.wrapT = RepeatWrapping; map.repeat.set(1, 8); map.colorSpace = SRGBColorSpace; map.anisotropy = 4; return map;
  }, []);
  return <group>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.08, 0]}><planeGeometry args={[180, 180]} /><meshStandardMaterial color="#8d8b7c" roughness={1} /></mesh>
    {STREETS.map((x) => <group key={`v${x}`}>
      <mesh receiveShadow position={[x, 0.015, 0]}><boxGeometry args={[12, 0.08, 160]} /><meshStandardMaterial map={asphalt} color={wet ? "#3c4244" : "#55595a"} roughness={roadRoughness} metalness={roadMetal} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} receiveShadow position={[x + side * 7.8, 0.13, 0]}><boxGeometry args={[3.4, 0.24, 160]} /><meshStandardMaterial color={wet ? "#8d8b7f" : "#a9a696"} roughness={wet ? 0.55 : 0.95} /></mesh>)}
      {dashes.map((z) => <mesh key={z} position={[x, 0.067, z]}><boxGeometry args={[0.16, 0.025, 4.6]} /><meshStandardMaterial color="#dfd5ae" /></mesh>)}
    </group>)}
    {STREETS.map((z) => <group key={`h${z}`}>
      {STREETS.slice(0, -1).map((x, segment) => {
        const center = x + 15;
        const segmentDashes = Array.from({ length: 2 }, (_, i) => center + (i ? 4.5 : -4.5));
        return <group key={segment}>
          <mesh receiveShadow position={[center, 0.016, z]}><boxGeometry args={[18, 0.08, 12]} /><meshStandardMaterial map={asphalt} color={wet ? "#3c4244" : "#55595a"} roughness={roadRoughness} metalness={roadMetal} /></mesh>
          {[-1, 1].map((side) => <mesh key={side} receiveShadow position={[center, 0.13, z + side * 7.8]}><boxGeometry args={[18, 0.24, 3.4]} /><meshStandardMaterial color={wet ? "#8d8b7f" : "#a9a696"} roughness={wet ? 0.55 : 0.95} /></mesh>)}
          {segmentDashes.map((dash) => <mesh key={dash} position={[dash, 0.068, z]}><boxGeometry args={[4.2, 0.025, 0.16]} /><meshStandardMaterial color="#dfd5ae" /></mesh>)}
        </group>;
      })}
    </group>)}
    {[-0.16, 0.16].map((offset) => <group key={offset}>
      <mesh position={[offset, 0.071, 0]}><boxGeometry args={[0.075, 0.028, 158]} /><meshStandardMaterial color="#cfaa49" /></mesh>
      <mesh position={[0, 0.071, offset]}><boxGeometry args={[158, 0.028, 0.075]} /><meshStandardMaterial color="#cfaa49" /></mesh>
    </group>)}
    {STREETS.flatMap((x) => STREETS.flatMap((z) => [-1, 1].flatMap((side) => [0, 1, 2, 3].map((stripe) => (
      <mesh key={`cross-${x}-${z}-${side}-${stripe}`} position={[x + side * (1.8 + stripe * 0.72), 0.069, z + 7.2]}>
        <boxGeometry args={[0.42, 0.025, 3.1]} /><meshStandardMaterial color="#e5e0cb" />
      </mesh>
    )))))}
  </group>;
}

export function City() {
  const buildings = useMemo(() => {
    const sites: { x: number; z: number; width: number; depth: number; height: number; color: string }[] = [];
    for (const blockX of [-45, -15, 15, 45]) for (const blockZ of [-45, -15, 15, 45]) {
      if ((blockX === -15 && blockZ === 15) || (blockX === 45 && blockZ === -45)) continue;
      for (const row of [-1, 1]) for (const column of [-1, 1]) {
        const seed = Math.abs(blockX * 137 + blockZ * 71 + row * 43 + column * 29);
        const width = 7.1 + seed % 9 * 0.12;
        const depth = 7.2 + (seed >> 2) % 8 * 0.1;
        const floors = seed % 5 === 0 ? 2 : 1;
        const tower = ((blockX === 15 && blockZ === 15) || (blockX === 15 && blockZ === -15) || (blockX === -15 && blockZ === -15)) && (seed % 3 !== 0);
        sites.push({
          x: blockX + column * 4.55 + ((seed % 3) - 1) * 0.28,
          z: blockZ + row * 4.55 + (((seed >> 1) % 3) - 1) * 0.28,
          width, depth, height: tower ? 13 + (seed % 5) * 3.4 : floors === 2 ? 6.4 + (seed % 5) * 0.22 : 3.7 + (seed % 6) * 0.16,
          color: COLORS[seed % COLORS.length],
        });
      }
    }
    return sites;
  }, []);
  const trees = useMemo(() => [
    [-15, 15], [-15, 15], [-15, 15], [-15, 15],
    [45, -45], [45, -45], [45, -45], [45, -45],
    [-71, -40], [-72, 37], [72, 39], [74, -38], [0, 82],
  ] as [number, number][], []);
  const lamps = useMemo(() => STREETS.flatMap((x) => STREETS.map((z) => [x + 9.2, z + 9.2] as [number, number])), []);
  return <group>
    <Terrain />
    <RoadNetwork />
    {buildings.map((building, i) => <Building key={i} {...building} seed={i * 11 + 5} />)}
    <TreeInstances trees={trees} />
    {lamps.map(([x, z], i) => <StreetLamp key={i} x={x} z={z} illuminate={i % 6 === 0} />)}
  </group>;
}
