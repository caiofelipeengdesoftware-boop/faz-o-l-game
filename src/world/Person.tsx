import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, LatheGeometry, MathUtils, Vector2, Vector3, type Group } from 'three';
import { gameInput } from '../systems/gameInput';

export type Hair = 'none' | 'short' | 'long' | 'bun' | 'curly' | 'cap' | 'police-cap' | 'beanie';
export type Outfit = 'casual' | 'uniform' | 'suit' | 'vest' | 'hoodie' | 'dress';
export type PersonLook = {
  skin: string; top: string; bottom?: string; shoes?: string; hair?: Hair; hairColor?: string; outfit?: Outfit;
  shortSleeves?: boolean; glasses?: boolean; badge?: boolean; tie?: string; mask?: boolean; backpack?: boolean; armed?: boolean;
  scale?: number; width?: number; build?: 'male' | 'female';
};
export type Motion = { speed: number; phase: number };
export const newMotion = (): Motion => ({ speed: 0, phase: 0 });

/** Perfis de torso (raio × altura) girados em torno do eixo Y: ombros, peito, cintura e quadril anatômicos. */
const MALE_PROFILE: [number, number][] = [[0, 0.92], [0.12, 0.925], [0.145, 0.96], [0.15, 1.02], [0.138, 1.08], [0.142, 1.15], [0.168, 1.24], [0.186, 1.32], [0.188, 1.4], [0.172, 1.47], [0.115, 1.52], [0.058, 1.545], [0, 1.55]];
const FEMALE_PROFILE: [number, number][] = [[0, 0.92], [0.13, 0.925], [0.165, 0.97], [0.162, 1.02], [0.122, 1.09], [0.126, 1.16], [0.15, 1.24], [0.162, 1.31], [0.164, 1.39], [0.152, 1.46], [0.108, 1.515], [0.056, 1.545], [0, 1.55]];
const torsoGeometry = (profile: [number, number][], grow = 0, from = 0, to = 9) => new LatheGeometry(profile.filter(([, y]) => y >= from && y <= to).map(([r, y]) => new Vector2(r > 0 ? r + grow : 0, y)), 24);

function Hair({ style, color }: { style: Hair; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.85} />;
  const cap = (extra = 0) => <mesh castShadow position={[0, 0.03, -0.004]} scale={[0.088 + extra, 0.104 + extra, 0.1 + extra]}><sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />{mat}</mesh>;
  switch (style) {
    case 'short': return <group>{cap()}<mesh position={[0, 0.062, 0.07]} scale={[0.082, 0.02, 0.03]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh></group>;
    case 'long': return <group>{cap(0.002)}
      <mesh castShadow position={[0, -0.09, -0.07]} scale={[0.092, 0.17, 0.034]}><sphereGeometry args={[1, 12, 10]} />{mat}</mesh>
      {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.083, -0.05, -0.012]} scale={[0.014, 0.09, 0.05]}><sphereGeometry args={[1, 8, 8]} />{mat}</mesh>)}</group>;
    case 'bun': return <group>{cap()}<mesh castShadow position={[0, 0.115, -0.06]}><sphereGeometry args={[0.04, 12, 10]} />{mat}</mesh></group>;
    case 'curly': return <mesh castShadow position={[0, 0.045, -0.008]} scale={[0.112, 0.1, 0.112]}><sphereGeometry args={[1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.72]} />{mat}</mesh>;
    case 'cap': return <group>{cap(-0.004)}
      <mesh castShadow position={[0, 0.082, 0]}><cylinderGeometry args={[0.092, 0.096, 0.05, 18]} />{mat}</mesh>
      <mesh castShadow position={[0, 0.062, 0.1]} rotation-x={0.08} scale={[0.08, 0.008, 0.07]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh></group>;
    case 'beanie': return <group><mesh castShadow position={[0, 0.042, 0]} scale={[0.096, 0.1, 0.106]}><sphereGeometry args={[1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />{mat}</mesh>
      <mesh position={[0, 0.142, 0]}><sphereGeometry args={[0.018, 8, 6]} />{mat}</mesh></group>;
    case 'police-cap': return <group>
      <mesh castShadow position={[0, 0.085, -0.002]}><cylinderGeometry args={[0.093, 0.1, 0.07, 20]} /><meshStandardMaterial color="#17263d" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.125, 0.006]}><cylinderGeometry args={[0.112, 0.094, 0.022, 20]} /><meshStandardMaterial color="#1f3556" roughness={0.65} /></mesh>
      <mesh castShadow position={[0, 0.062, 0.1]} rotation-x={0.14} scale={[0.1, 0.007, 0.06]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#0c0e10" roughness={0.3} /></mesh>
      <mesh position={[0, 0.095, 0.1]}><boxGeometry args={[0.03, 0.03, 0.006]} /><meshStandardMaterial color="#e6c66e" metalness={0.8} roughness={0.3} /></mesh></group>;
    default: return null;
  }
}

function Hand({ side, color, near }: { side: -1 | 1; color: string; near: boolean }) {
  return <group position-y={-0.265}>
    <mesh><sphereGeometry args={[0.034, 10, 8]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
    <mesh castShadow position={[0, -0.05, 0]}><boxGeometry args={[0.074, 0.075, 0.032]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
    {near && <>
      <mesh position={[0, -0.113, 0.005]} rotation-x={-0.2}><boxGeometry args={[0.07, 0.062, 0.026]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
      <mesh position={[-side * 0.045, -0.05, 0.014]} rotation-z={side * 0.5}><capsuleGeometry args={[0.012, 0.045, 3, 6]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
    </>}
  </group>;
}

/** Figura humana procedural com anatomia articulada: pedestres, policiais, bandidos e personagens da história. Pés em y = 0. */
export function Person({ look, motion }: { look: PersonLook; motion?: MutableRefObject<Motion> }) {
  const { skin, top, bottom = '#2d333a', shoes = '#151719', hair = 'short', hairColor = '#2b211c', outfit = 'casual', shortSleeves, glasses, badge, tie, mask, backpack, armed, scale = 1, width = 1, build = 'male' } = look;
  const root = useRef<Group>(null); const bodyRef = useRef<Group>(null); const headRef = useRef<Group>(null);
  const hipL = useRef<Group>(null); const hipR = useRef<Group>(null); const kneeL = useRef<Group>(null); const kneeR = useRef<Group>(null);
  const shoulderL = useRef<Group>(null); const shoulderR = useRef<Group>(null); const elbowL = useRef<Group>(null); const elbowR = useRef<Group>(null);
  const [near, setNear] = useState(true); const lodTimer = useRef(Math.random()); const worldPos = useRef(new Vector3());
  const camera = useThree((state) => state.camera);
  const female = build === 'female'; const profile = female ? FEMALE_PROFILE : MALE_PROFILE;
  const torso = useMemo(() => torsoGeometry(profile), [profile]);
  const vestShell = useMemo(() => torsoGeometry(profile, 0.014, 1.04, 1.46), [profile]);
  const skirt = useMemo(() => new LatheGeometry([[0.15, 1.04], [0.18, 0.96], [0.215, 0.78], [0.235, 0.58]].map(([r, y]) => new Vector2(r, y)), 24), []);
  const shoulderX = female ? 0.186 : 0.205;
  const longSleeve = !(shortSleeves && outfit !== 'uniform' && outfit !== 'suit');
  const sleeveColor = outfit === 'vest' ? '#2a3038' : top;
  const handColor = outfit === 'uniform' || outfit === 'vest' ? '#14171a' : skin;
  const skinMat = <meshStandardMaterial color={skin} roughness={0.72} />;

  useFrame((state, delta) => {
    const group = root.current; if (!group) return;
    lodTimer.current -= delta;
    if (lodTimer.current <= 0) {
      lodTimer.current = 0.3; group.getWorldPosition(worldPos.current);
      const distance = worldPos.current.distanceTo(camera.position);
      group.visible = distance < 95;
      const closeNow = distance < 30; setNear((previous) => previous === closeNow ? previous : closeNow);
    }
    if (!gameInput.enabled || !group.visible) return;
    const dt = Math.min(delta, 0.05); const m = motion?.current; const speed = m?.speed ?? 0;
    if (m && speed > 0.02) m.phase += dt * (6 + speed * 4.5);
    const phase = m?.phase ?? 0; const amp = MathUtils.clamp(speed, 0, 1.8) * 0.5; const move = speed > 0.02;
    const set = (ref: { current: Group | null }, x: number, z = 0) => { const node = ref.current; if (!node) return; node.rotation.x = MathUtils.damp(node.rotation.x, x, 14, dt); node.rotation.z = MathUtils.damp(node.rotation.z, z, 14, dt); };
    const stride = (offset: number) => Math.sin(phase + offset) * amp;
    const flex = (offset: number) => (move ? Math.max(0, Math.cos(phase + offset)) * amp * 1.7 + amp * 0.1 : 0.04);
    set(hipL, -stride(0)); set(hipR, -stride(Math.PI)); set(kneeL, flex(0)); set(kneeR, flex(Math.PI));
    if (armed) { set(shoulderR, -1.32, -0.04); set(elbowR, -0.22); set(shoulderL, -1.18, 0.34); set(elbowL, -0.65); }
    else {
      set(shoulderL, stride(Math.PI) * 1.05, 0.05); set(shoulderR, stride(0) * 1.05, -0.05);
      set(elbowL, -(0.12 + (move ? Math.max(0, -Math.sin(phase)) * amp * 1.2 : 0)), 0); set(elbowR, -(0.12 + (move ? Math.max(0, Math.sin(phase)) * amp * 1.2 : 0)), 0);
    }
    if (bodyRef.current) {
      bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, move ? Math.abs(Math.cos(phase)) * 0.026 * Math.min(speed, 1.3) : Math.sin(state.clock.elapsedTime * 1.6) * 0.002, 14, dt);
      bodyRef.current.rotation.y = MathUtils.damp(bodyRef.current.rotation.y, move ? Math.sin(phase) * 0.12 * amp * 2 : 0, 10, dt);
    }
    if (headRef.current) headRef.current.rotation.y = MathUtils.damp(headRef.current.rotation.y, move ? -Math.sin(phase) * 0.05 * amp * 2 : Math.sin(state.clock.elapsedTime * 0.5 + scale * 9) * 0.1, 6, dt);
  });

  const leg = (side: -1 | 1, hip: typeof hipL, knee: typeof kneeL) => <group ref={hip} position={[side * 0.092, 0.93, 0]}>
    <mesh castShadow><sphereGeometry args={[0.088, 12, 10]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
    <mesh castShadow position-y={-0.215}><cylinderGeometry args={[0.088, 0.064, 0.43, 14]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
    <group ref={knee} position-y={-0.43}>
      <mesh><sphereGeometry args={[0.064, 10, 8]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
      <mesh castShadow position-y={-0.2}><cylinderGeometry args={[0.064, 0.044, 0.4, 14]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
      {near && <mesh position={[0, -0.11, -0.016]} scale={[1, 1.5, 1]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>}
      <group position-y={-0.43}>
        <mesh castShadow position={[0, -0.034, 0.045]}><boxGeometry args={[0.092, 0.07, 0.24]} /><meshStandardMaterial color={shoes} roughness={0.55} /></mesh>
        <mesh castShadow position={[0, -0.034, 0.165]} scale={[1, 0.78, 1.1]}><sphereGeometry args={[0.046, 10, 8]} /><meshStandardMaterial color={shoes} roughness={0.55} /></mesh>
        <mesh position={[0, -0.067, 0.05]}><boxGeometry args={[0.096, 0.012, 0.27]} /><meshStandardMaterial color="#0a0b0c" roughness={0.9} /></mesh>
      </group>
    </group>
  </group>;

  const arm = (side: -1 | 1, shoulder: typeof shoulderL, elbow: typeof elbowL) => <group ref={shoulder} position={[side * shoulderX, 1.47, 0]}>
    <mesh castShadow><sphereGeometry args={[0.052, 12, 10]} /><meshStandardMaterial color={sleeveColor} roughness={0.88} /></mesh>
    <mesh castShadow position-y={-0.145}><cylinderGeometry args={[0.05, 0.041, 0.29, 14]} /><meshStandardMaterial color={sleeveColor} roughness={0.88} /></mesh>
    <group ref={elbow} position-y={-0.29}>
      <mesh><sphereGeometry args={[0.043, 10, 8]} /><meshStandardMaterial color={longSleeve ? sleeveColor : skin} roughness={0.85} /></mesh>
      <mesh castShadow position-y={-0.13}><cylinderGeometry args={[0.043, 0.032, 0.26, 12]} /><meshStandardMaterial color={longSleeve ? sleeveColor : skin} roughness={longSleeve ? 0.88 : 0.72} /></mesh>
      <Hand side={side} color={handColor} near={near} />
      {armed && side === 1 && <group position={[0, -0.34, 0.01]}>
        <mesh castShadow position={[0, -0.04, 0.012]}><boxGeometry args={[0.03, 0.17, 0.05]} /><meshStandardMaterial color="#17191a" metalness={0.6} roughness={0.4} /></mesh>
        <mesh castShadow position={[0, 0.02, 0.045]} rotation-x={0.2}><boxGeometry args={[0.028, 0.045, 0.05]} /><meshStandardMaterial color="#17191a" metalness={0.5} roughness={0.5} /></mesh>
      </group>}
    </group>
  </group>;

  return <group ref={root} scale={[0.975 * scale * width, 0.975 * scale, 0.975 * scale * width]}>
    {leg(-1, hipL, kneeL)}{leg(1, hipR, kneeR)}
    {outfit === 'dress' && <mesh castShadow geometry={skirt} scale={[1, 1, 0.8]}><meshStandardMaterial color={top} roughness={0.9} side={DoubleSide} /></mesh>}
    <group ref={bodyRef}>
      <mesh castShadow geometry={torso} scale={[1, 1, 0.7]}><meshStandardMaterial color={outfit === 'vest' ? '#2a3038' : top} roughness={0.88} /></mesh>
      <mesh position-y={0.93} scale={[1, 1, 0.7]}><sphereGeometry args={[0.135, 14, 10]} /><meshStandardMaterial color={outfit === 'dress' ? top : bottom} roughness={0.9} /></mesh>
      {female && <>{[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.072, 1.315, 0.087]} scale={[1, 0.95, 0.85]}><sphereGeometry args={[0.048, 14, 10]} /><meshStandardMaterial color={outfit === 'vest' ? '#2a3038' : top} roughness={0.88} /></mesh>)}</>}
      {outfit === 'vest' && <>
        <mesh castShadow geometry={vestShell} scale={[1, 1, 0.7]}><meshStandardMaterial color="#17191b" roughness={0.8} /></mesh>
        {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 1.14, 0.114]}><boxGeometry args={[0.09, 0.09, 0.03]} /><meshStandardMaterial color="#25292c" roughness={0.8} /></mesh>)}
      </>}
      {outfit === 'uniform' && <><mesh position={[0, 0.995, 0]} scale={[1, 1, 0.7]}><cylinderGeometry args={[0.153, 0.153, 0.04, 20]} /><meshStandardMaterial color="#0e1011" roughness={0.6} /></mesh>
        <mesh position={[0, 0.995, 0.108]}><boxGeometry args={[0.04, 0.03, 0.01]} /><meshStandardMaterial color="#b9b9b2" metalness={0.8} roughness={0.3} /></mesh></>}
      {outfit === 'suit' && <>
        <mesh position={[0, 1.33, 0.1]}><boxGeometry args={[0.07, 0.2, 0.012]} /><meshStandardMaterial color="#e8e6de" roughness={0.8} /></mesh>
        {tie && <mesh position={[0, 1.31, 0.108]}><boxGeometry args={[0.028, 0.19, 0.01]} /><meshStandardMaterial color={tie} roughness={0.6} /></mesh>}
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.04, 1.37, 0.106]} rotation-z={side * 0.3}><boxGeometry args={[0.03, 0.14, 0.01]} /><meshStandardMaterial color={top} roughness={0.8} /></mesh>)}
      </>}
      {outfit === 'hoodie' && <>
        <mesh castShadow position={[0, 1.53, -0.055]} scale={[0.11, 0.07, 0.07]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={top} roughness={0.95} /></mesh>
        <mesh position={[0, 1.07, 0.105]} scale={[0.1, 0.05, 0.02]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={top} roughness={0.95} /></mesh>
      </>}
      {badge && <mesh position={[-0.075, 1.37, 0.126]}><boxGeometry args={[0.04, 0.048, 0.01]} /><meshStandardMaterial color="#e6c66e" metalness={0.75} roughness={0.3} /></mesh>}
      {backpack && <mesh castShadow position={[0, 1.28, -0.14]}><boxGeometry args={[0.24, 0.3, 0.1]} /><meshStandardMaterial color="#3a3f46" roughness={0.9} /></mesh>}
      {arm(-1, shoulderL, elbowL)}{arm(1, shoulderR, elbowR)}
      <mesh castShadow position-y={1.585}><cylinderGeometry args={[0.044, 0.052, 0.12, 12]} />{skinMat}</mesh>
      <group ref={headRef} position-y={1.725} scale={1.09}>
        <mesh castShadow position-y={0.02} scale={[0.078, 0.1, 0.092]}><sphereGeometry args={[1, 20, 16]} />{skinMat}</mesh>
        <mesh castShadow position={[0, -0.058, 0.006]} scale={[0.064, 0.072, 0.07]}><sphereGeometry args={[1, 16, 12]} />{skinMat}</mesh>
        {near && <>
          <mesh position={[0, -0.018, 0.098]} scale={[0.011, 0.022, 0.02]}><sphereGeometry args={[1, 8, 8]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>
          {[-1, 1].map((side) => <group key={side}>
            <mesh position={[side * 0.034, 0.018, 0.087]} scale={[0.015, 0.0095, 0.008]}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#f2eee6" /></mesh>
            <mesh position={[side * 0.034, 0.018, 0.0945]}><sphereGeometry args={[0.0062, 8, 6]} /><meshBasicMaterial color="#17110d" /></mesh>
            <mesh position={[side * 0.034, 0.042, 0.088]} rotation-z={side * -0.12} scale={[0.0185, 0.0034, 0.006]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={hairColor} roughness={0.9} /></mesh>
            <mesh position={[side * 0.079, 0.0, 0.0]} scale={[0.009, 0.024, 0.018]}><sphereGeometry args={[1, 8, 8]} />{skinMat}</mesh>
          </group>)}
          <mesh position={[0, -0.056, 0.089]} scale={[0.017, 0.0036, 0.006]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#a8645c" roughness={0.6} /></mesh>
        </>}
        {glasses && <group position={[0, 0.018, 0.093]}>
          {[-1, 1].map((side) => <mesh key={side} position={[side * 0.035, 0, 0]}><torusGeometry args={[0.021, 0.0035, 6, 16]} /><meshStandardMaterial color="#0d0f10" roughness={0.3} metalness={0.5} /></mesh>)}
          <mesh scale={[0.026, 0.004, 0.004]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#0d0f10" /></mesh>
        </group>}
        {mask && <mesh position={[0, -0.05, 0.034]} scale={[0.08, 0.052, 0.07]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color="#101214" roughness={0.9} /></mesh>}
        <Hair style={hair} color={hairColor} />
      </group>
    </group>
  </group>;
}
