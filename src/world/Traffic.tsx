import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

const ROUTE: [number, number][] = [[-60, -60], [-60, 0], [-60, 60], [0, 60], [60, 60], [60, 0], [60, -60], [0, -60]];
const COLORS = ['#b34032', '#d5d0c4', '#354b5b', '#bda54e', '#4e6b54', '#74777a'];
function TrafficCar({ index }: { index: number }) {
  const ref = useRef<Group>(null);
  const route = useMemo(() => {
    const lane = index % 2 ? 2.1 : -2.1;
    return ROUTE.map(([x, z], i) => {
      const [nx, nz] = ROUTE[(i + 1) % ROUTE.length];
      const dx = nx - x; const dz = nz - z; const length = Math.hypot(dx, dz) || 1;
      return [x - dz / length * lane, z + dx / length * lane] as [number, number];
    });
  }, [index]);
  const lengths = useMemo(() => route.map((point, i) => {
    const next = route[(i + 1) % route.length]; return Math.hypot(next[0] - point[0], next[1] - point[1]);
  }), [route]);
  const total = lengths.reduce((sum, length) => sum + length, 0);
  useFrame((state) => {
    if (!ref.current) return;
    let travel = (state.clock.elapsedTime * (4.4 + index % 3) + index * total / 5) % total;
    let segment = 0;
    while (travel > lengths[segment] && segment < lengths.length - 1) { travel -= lengths[segment]; segment++; }
    const start = route[segment]; const end = route[(segment + 1) % route.length];
    const progress = travel / lengths[segment];
    const dx = end[0] - start[0]; const dz = end[1] - start[1];
    ref.current.position.set(start[0] + dx * progress, 0.55, start[1] + dz * progress);
    ref.current.rotation.y = Math.atan2(dx, dz);
  });
  return <group ref={ref}>
    <mesh castShadow position-y={0.1}><boxGeometry args={[1.7, 0.52, 3.7]} /><meshStandardMaterial color={COLORS[index % COLORS.length]} metalness={0.24} roughness={0.5} /></mesh>
    <mesh castShadow position={[0, 0.56, -0.17]}><boxGeometry args={[1.44, 0.56, 1.82]} /><meshStandardMaterial color="#263b45" metalness={0.3} roughness={0.24} /></mesh>
    <mesh position={[0, 0.2, 1.86]}><boxGeometry args={[1.25, 0.12, 0.05]} /><meshStandardMaterial color="#f3e6b9" emissive="#9a7840" emissiveIntensity={0.18} /></mesh>
    <mesh position={[0, 0.2, -1.86]}><boxGeometry args={[1.25, 0.12, 0.05]} /><meshStandardMaterial color="#9d3429" emissive="#9d3429" emissiveIntensity={0.5} /></mesh>
    {[-1, 1].flatMap((side) => [-1.12, 1.12].map((z) => <mesh key={`${side}-${z}`} castShadow position={[side * 0.86, -0.15, z]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.29, 0.29, 0.16, 12]} /><meshStandardMaterial color="#202324" roughness={0.9} /></mesh>))}
  </group>;
}
function TrafficMotorcycle({ index }: { index: number }) {
  const ref = useRef<Group>(null);
  const wheelFront = useRef<Group>(null); const wheelRear = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const direction = index % 2 ? -1 : 1;
    const z = ((state.clock.elapsedTime * 8 * direction + index * 67 + 90) % 180 + 180) % 180 - 90;
    ref.current.position.set(index % 2 ? 33 : -33, 0, z);
    ref.current.rotation.y = direction > 0 ? 0 : Math.PI;
    if (wheelFront.current) wheelFront.current.rotation.x = state.clock.elapsedTime * 8 * direction;
    if (wheelRear.current) wheelRear.current.rotation.x = state.clock.elapsedTime * 8 * direction;
  });
  const paint = index % 2 ? '#c34d3b' : '#477c88';
  return <group ref={ref}>
    <group ref={wheelFront} position={[0, 0.35, 0.86]} rotation-x={Math.PI / 2}><mesh><cylinderGeometry args={[0.34, 0.34, 0.14, 14]} /><meshStandardMaterial color="#181a1b" roughness={0.95} /></mesh><mesh><cylinderGeometry args={[0.16, 0.16, 0.17, 10]} /><meshStandardMaterial color="#92918b" metalness={0.7} /></mesh></group>
    <group ref={wheelRear} position={[0, 0.35, -0.77]} rotation-x={Math.PI / 2}><mesh><cylinderGeometry args={[0.34, 0.34, 0.14, 14]} /><meshStandardMaterial color="#181a1b" roughness={0.95} /></mesh><mesh><cylinderGeometry args={[0.16, 0.16, 0.17, 10]} /><meshStandardMaterial color="#92918b" metalness={0.7} /></mesh></group>
    <mesh castShadow={false} position={[0, 0.67, 0]} rotation-x={-0.12}><boxGeometry args={[0.38, 0.31, 0.78]} /><meshStandardMaterial color={paint} metalness={0.42} roughness={0.42} /></mesh>
    <mesh position={[0, 0.82, -0.23]}><boxGeometry args={[0.42, 0.11, 0.52]} /><meshStandardMaterial color="#262322" roughness={0.76} /></mesh>
    <mesh position={[0, 0.82, 0.68]} rotation-x={0.2}><boxGeometry args={[0.16, 0.12, 0.52]} /><meshStandardMaterial color="#3b4242" metalness={0.5} /></mesh>
    <mesh position={[0, 0.49, 0.02]}><cylinderGeometry args={[0.22, 0.19, 0.32, 10]} /><meshStandardMaterial color="#45494a" metalness={0.62} /></mesh>
    <group position={[0, 0.82, -0.06]}>
      <mesh castShadow={false} position-y={0.5}><capsuleGeometry args={[0.2, 0.58, 4, 7]} /><meshStandardMaterial color={index % 2 ? '#374d5d' : '#665b4e'} /></mesh>
      <mesh castShadow={false} position-y={0.98}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color="#292c2e" roughness={0.42} metalness={0.18} /></mesh>
      <mesh position={[0, 0.98, 0.16]}><sphereGeometry args={[0.095, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.45]} /><meshStandardMaterial color="#72aeb9" metalness={0.55} roughness={0.22} /></mesh>
      <mesh castShadow={false} position={[0.24, 0.58, 0.18]} rotation-z={-0.9}><capsuleGeometry args={[0.065, 0.42, 3, 6]} /><meshStandardMaterial color={index % 2 ? '#374d5d' : '#665b4e'} /></mesh>
      <mesh castShadow={false} position={[-0.24, 0.58, 0.18]} rotation-z={0.9}><capsuleGeometry args={[0.065, 0.42, 3, 6]} /><meshStandardMaterial color={index % 2 ? '#374d5d' : '#665b4e'} /></mesh>
    </group>
    <mesh position={[0, 0.48, 1.03]}><sphereGeometry args={[0.09, 8, 6]} /><meshStandardMaterial color="#f5e8c5" emissive="#e1c783" emissiveIntensity={0.75} /></mesh>
    <mesh position={[0, 0.45, -0.93]}><boxGeometry args={[0.18, 0.09, 0.09]} /><meshStandardMaterial color="#bb3428" emissive="#bb3428" emissiveIntensity={0.65} /></mesh>
  </group>;
}

export function Traffic() { return <group>{Array.from({ length: 5 }, (_, index) => <TrafficCar key={`car-${index}`} index={index} />)}{[0, 1].map((index) => <TrafficMotorcycle key={`moto-${index}`} index={index} />)}</group>; }
