import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { gameInput } from '../systems/gameInput';

export type Hair = 'none' | 'short' | 'long' | 'bun' | 'curly' | 'cap' | 'police-cap' | 'beanie';
export type Outfit = 'casual' | 'uniform' | 'suit' | 'vest' | 'hoodie' | 'dress';
export type PersonLook = {
  skin: string; top: string; bottom?: string; shoes?: string; hair?: Hair; hairColor?: string; outfit?: Outfit;
  shortSleeves?: boolean; glasses?: boolean; badge?: boolean; tie?: string; mask?: boolean; backpack?: boolean; armed?: boolean;
  scale?: number; width?: number;
};
export type Motion = { speed: number; phase: number };
export const newMotion = (): Motion => ({ speed: 0, phase: 0 });

function Hair({ style, color }: { style: Hair; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.9} />;
  switch (style) {
    case 'short': return <mesh castShadow position={[0, 0.02, -0.01]}><sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />{mat}</mesh>;
    case 'long': return <group>
      <mesh castShadow position={[0, 0.02, -0.01]}><sphereGeometry args={[0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />{mat}</mesh>
      <mesh castShadow position={[0, -0.13, -0.13]}><boxGeometry args={[0.37, 0.46, 0.11]} />{mat}</mesh>
    </group>;
    case 'bun': return <group>
      <mesh castShadow position={[0, 0.02, -0.01]}><sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />{mat}</mesh>
      <mesh castShadow position={[0, 0.2, -0.12]}><sphereGeometry args={[0.085, 10, 8]} />{mat}</mesh>
    </group>;
    case 'curly': return <mesh castShadow position={[0, 0.03, -0.02]}><sphereGeometry args={[0.245, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.64]} />{mat}</mesh>;
    case 'cap': return <group>
      <mesh castShadow position={[0, 0.13, 0]}><cylinderGeometry args={[0.2, 0.205, 0.1, 16]} />{mat}</mesh>
      <mesh castShadow position={[0, 0.095, 0.2]}><boxGeometry args={[0.26, 0.018, 0.17]} />{mat}</mesh>
    </group>;
    case 'beanie': return <group>
      <mesh castShadow position={[0, 0.03, 0]}><sphereGeometry args={[0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52]} />{mat}</mesh>
      <mesh position={[0, 0.235, 0]}><sphereGeometry args={[0.04, 8, 6]} />{mat}</mesh>
    </group>;
    case 'police-cap': return <group>
      <mesh castShadow position={[0, 0.15, 0]}><cylinderGeometry args={[0.205, 0.22, 0.12, 18]} /><meshStandardMaterial color="#17263d" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.215, 0.01]}><cylinderGeometry args={[0.245, 0.225, 0.04, 18]} /><meshStandardMaterial color="#1f3556" roughness={0.65} /></mesh>
      <mesh castShadow position={[0, 0.105, 0.215]} rotation-x={0.12}><boxGeometry args={[0.3, 0.02, 0.14]} /><meshStandardMaterial color="#0c0e10" roughness={0.3} /></mesh>
      <mesh position={[0, 0.17, 0.222]}><boxGeometry args={[0.06, 0.055, 0.012]} /><meshStandardMaterial color="#e6c66e" metalness={0.8} roughness={0.3} /></mesh>
    </group>;
    default: return null;
  }
}

/** Figura humana procedural reutilizável: pedestres, policiais, bandidos e personagens da história. Pés em y = 0. */
export function Person({ look, motion }: { look: PersonLook; motion?: MutableRefObject<Motion> }) {
  const { skin, top, bottom = '#2d333a', shoes = '#151719', hair = 'short', hairColor = '#2b211c', outfit = 'casual', shortSleeves, glasses, badge, tie, mask, backpack, armed, scale = 1, width = 1 } = look;
  const leftArm = useRef<Group>(null); const rightArm = useRef<Group>(null); const leftLeg = useRef<Group>(null); const rightLeg = useRef<Group>(null); const head = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!gameInput.enabled) return;
    const m = motion?.current; const speed = m?.speed ?? 0; const dt = Math.min(delta, 0.05);
    if (m && speed > 0.02) m.phase += dt * (6 + speed * 4.5);
    const swing = Math.sin(m?.phase ?? 0) * MathUtils.clamp(speed, 0, 1.8) * 0.5;
    const set = (ref: { current: Group | null }, value: number) => { if (ref.current) ref.current.rotation.x = MathUtils.damp(ref.current.rotation.x, value, 14, dt); };
    set(leftArm, swing); set(rightArm, armed ? -1.35 : -swing); set(leftLeg, -swing); set(rightLeg, swing);
    if (head.current) head.current.position.y = 1.73 + Math.sin(state.clock.elapsedTime * 1.7 + scale * 7) * 0.004;
  });
  const sleeve = shortSleeves && outfit !== 'uniform' && outfit !== 'suit';
  const jacketColor = outfit === 'vest' ? '#1b1e20' : top;
  const arm = (side: -1 | 1, ref: typeof leftArm) => <group ref={ref} position={[side * 0.325, 1.46, 0]}>
    {sleeve ? <>
      <mesh castShadow position-y={-0.1}><capsuleGeometry args={[0.082, 0.14, 4, 8]} /><meshStandardMaterial color={top} roughness={0.9} /></mesh>
      <mesh castShadow position-y={-0.37}><capsuleGeometry args={[0.065, 0.3, 4, 8]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
    </> : <mesh castShadow position-y={-0.3}><capsuleGeometry args={[0.078, 0.46, 4, 8]} /><meshStandardMaterial color={outfit === 'vest' ? '#2a3038' : top} roughness={0.9} /></mesh>}
    <mesh castShadow position-y={-0.62}><sphereGeometry args={[0.066, 10, 8]} /><meshStandardMaterial color={outfit === 'uniform' || outfit === 'vest' ? '#14171a' : skin} roughness={0.8} /></mesh>
    {armed && side === 1 && <mesh castShadow position={[0, -0.66, 0.1]}><boxGeometry args={[0.06, 0.11, 0.24]} /><meshStandardMaterial color="#17191a" metalness={0.6} roughness={0.4} /></mesh>}
  </group>;
  return <group scale={[scale * width, scale, scale * width]}>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * 0.115, 0.9, 0]}>
      <mesh castShadow position-y={-0.4}><capsuleGeometry args={[0.095, 0.58, 4, 8]} /><meshStandardMaterial color={bottom} roughness={0.92} /></mesh>
      <mesh castShadow position={[0, -0.83, 0.05]}><boxGeometry args={[0.17, 0.09, 0.31]} /><meshStandardMaterial color={shoes} roughness={0.6} /></mesh>
    </group>)}
    {outfit === 'dress' && <mesh castShadow position-y={0.74}><cylinderGeometry args={[0.2, 0.31, 0.56, 16]} /><meshStandardMaterial color={top} roughness={0.9} /></mesh>}
    <mesh castShadow position-y={1.2}><cylinderGeometry args={[0.25, 0.21, 0.62, 14]} /><meshStandardMaterial color={outfit === 'suit' ? top : outfit === 'vest' ? '#2a3038' : top} roughness={0.88} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.265, 1.47, 0]}><sphereGeometry args={[0.095, 10, 8]} /><meshStandardMaterial color={jacketColor === '#1b1e20' ? '#2a3038' : top} roughness={0.9} /></mesh>)}
    {outfit === 'suit' && <>
      <mesh position={[0, 1.27, 0.245]}><boxGeometry args={[0.14, 0.4, 0.012]} /><meshStandardMaterial color="#e8e6de" roughness={0.8} /></mesh>
      {tie && <mesh position={[0, 1.24, 0.254]}><boxGeometry args={[0.05, 0.34, 0.012]} /><meshStandardMaterial color={tie} roughness={0.6} /></mesh>}
    </>}
    {outfit === 'vest' && <>
      <mesh castShadow position={[0, 1.24, 0]}><boxGeometry args={[0.54, 0.46, 0.4]} /><meshStandardMaterial color="#17191b" roughness={0.8} /></mesh>
      {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 1.12, 0.21]}><boxGeometry args={[0.15, 0.13, 0.05]} /><meshStandardMaterial color="#25292c" roughness={0.8} /></mesh>)}
    </>}
    {outfit === 'hoodie' && <mesh castShadow position={[0, 1.58, -0.12]} scale={[1, 0.8, 0.6]}><sphereGeometry args={[0.2, 12, 8]} /><meshStandardMaterial color={top} roughness={0.95} /></mesh>}
    {outfit === 'uniform' && <mesh position-y={0.93}><cylinderGeometry args={[0.218, 0.218, 0.07, 14]} /><meshStandardMaterial color="#0e1011" roughness={0.6} /></mesh>}
    {badge && <mesh position={[-0.12, 1.37, 0.252]}><boxGeometry args={[0.07, 0.085, 0.014]} /><meshStandardMaterial color="#e6c66e" metalness={0.75} roughness={0.3} /></mesh>}
    {backpack && <mesh castShadow position={[0, 1.24, -0.27]}><boxGeometry args={[0.34, 0.44, 0.17]} /><meshStandardMaterial color="#3a3f46" roughness={0.9} /></mesh>}
    {arm(-1, leftArm)}{arm(1, rightArm)}
    <mesh castShadow position-y={1.585}><cylinderGeometry args={[0.065, 0.075, 0.1, 10]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
    <group ref={head} position-y={1.73}>
      <mesh castShadow scale={[0.92, 1.06, 0.98]}><sphereGeometry args={[0.19, 18, 14]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
      <mesh position={[0, -0.02, 0.185]}><sphereGeometry args={[0.026, 8, 6]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
      {!glasses && [-1, 1].map((side) => <mesh key={side} position={[side * 0.07, 0.025, 0.172]}><sphereGeometry args={[0.016, 8, 6]} /><meshBasicMaterial color="#141210" /></mesh>)}
      {glasses && <group position={[0, 0.025, 0.178]}>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.075, 0, 0]}><torusGeometry args={[0.046, 0.009, 6, 14]} /><meshStandardMaterial color="#0d0f10" roughness={0.3} metalness={0.5} /></mesh>)}
        <mesh><boxGeometry args={[0.05, 0.01, 0.01]} /><meshStandardMaterial color="#0d0f10" /></mesh>
      </group>}
      {mask && <mesh position={[0, -0.075, 0.07]}><boxGeometry args={[0.32, 0.15, 0.2]} /><meshStandardMaterial color="#101214" roughness={0.9} /></mesh>}
      <Hair style={hair} color={hairColor} />
    </group>
  </group>;
}
