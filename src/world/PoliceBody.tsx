import type { RefObject } from 'react';
import type { Group } from 'three';

type Ref = RefObject<Group | null>;
const NAVY = '#1f3556'; const NAVY_DARK = '#17263d'; const SKIN = '#c98d69'; const BLACK = '#14171a';

/** Policial procedural: uniforme, colete tático, quepe, óculos, cinto, luvas e botas. Os grupos recebem as refs usadas na animação. */
export function PoliceBody({ leftArm, rightArm, leftLeg, rightLeg, headRef, muzzleFlash }: { leftArm: Ref; rightArm: Ref; leftLeg: Ref; rightLeg: Ref; headRef: Ref; muzzleFlash: Ref }) {
  return <group>
    <mesh castShadow position={[0, 0.3, 0]}><cylinderGeometry args={[0.3, 0.25, 0.72, 14]} /><meshStandardMaterial color={NAVY} roughness={0.85} /></mesh>
    <mesh castShadow position={[0, 0.4, 0.02]}><boxGeometry args={[0.6, 0.5, 0.36]} /><meshStandardMaterial color="#1a1e22" roughness={0.75} /></mesh>
    <mesh castShadow position={[0.14, 0.47, 0.19]}><boxGeometry args={[0.14, 0.1, 0.03]} /><meshStandardMaterial color={BLACK} roughness={0.7} /></mesh>
    <mesh position={[-0.13, 0.52, 0.2]}><boxGeometry args={[0.08, 0.09, 0.02]} /><meshStandardMaterial color="#e6c66e" metalness={0.75} roughness={0.3} /></mesh>
    <mesh castShadow position={[0, -0.04, 0]}><cylinderGeometry args={[0.285, 0.285, 0.09, 14]} /><meshStandardMaterial color="#0e1011" roughness={0.6} /></mesh>
    <mesh position={[0, -0.04, 0.285]}><boxGeometry args={[0.08, 0.06, 0.02]} /><meshStandardMaterial color="#b9b9b2" metalness={0.8} roughness={0.3} /></mesh>
    <mesh castShadow position={[0.3, -0.16, 0.02]}><boxGeometry args={[0.1, 0.26, 0.2]} /><meshStandardMaterial color={BLACK} roughness={0.6} /></mesh>
    <mesh castShadow position={[-0.2, 0.62, 0.17]}><boxGeometry args={[0.08, 0.14, 0.05]} /><meshStandardMaterial color="#202527" roughness={0.5} metalness={0.4} /></mesh>
    <mesh castShadow position={[0, 0.74, 0]}><cylinderGeometry args={[0.095, 0.11, 0.14, 10]} /><meshStandardMaterial color={SKIN} roughness={0.85} /></mesh>
    <group ref={headRef} position={[0, 0.92, 0]}>
      <mesh castShadow scale={[0.92, 1.05, 0.98]}><sphereGeometry args={[0.22, 20, 16]} /><meshStandardMaterial color={SKIN} roughness={0.85} /></mesh>
      <mesh position={[0, 0.03, 0.2]}><boxGeometry args={[0.32, 0.065, 0.05]} /><meshStandardMaterial color="#090b0d" roughness={0.12} metalness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.17, -0.01]}><cylinderGeometry args={[0.225, 0.24, 0.12, 18]} /><meshStandardMaterial color={NAVY_DARK} roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.235, 0.015]}><cylinderGeometry args={[0.255, 0.235, 0.05, 18]} /><meshStandardMaterial color={NAVY} roughness={0.65} /></mesh>
      <mesh castShadow position={[0, 0.128, 0.225]} rotation-x={0.12}><boxGeometry args={[0.31, 0.022, 0.15]} /><meshStandardMaterial color="#0c0e10" roughness={0.3} metalness={0.2} /></mesh>
      <mesh position={[0, 0.2, 0.235]}><boxGeometry args={[0.07, 0.06, 0.012]} /><meshStandardMaterial color="#e6c66e" metalness={0.8} roughness={0.3} /></mesh>
    </group>
    <group ref={leftArm} position={[-0.39, 0.58, 0]}>
      <mesh castShadow position-y={-0.27}><capsuleGeometry args={[0.105, 0.5, 5, 10]} /><meshStandardMaterial color={NAVY} roughness={0.85} /></mesh>
      <mesh castShadow position-y={-0.6}><sphereGeometry args={[0.095, 10, 8]} /><meshStandardMaterial color={BLACK} roughness={0.6} /></mesh>
    </group>
    <group ref={rightArm} position={[0.39, 0.58, 0]}>
      <mesh castShadow position-y={-0.27}><capsuleGeometry args={[0.105, 0.5, 5, 10]} /><meshStandardMaterial color={NAVY} roughness={0.85} /></mesh>
      <mesh castShadow position-y={-0.6}><sphereGeometry args={[0.095, 10, 8]} /><meshStandardMaterial color={BLACK} roughness={0.6} /></mesh>
    </group>
    {[{ ref: leftLeg, x: -0.16 }, { ref: rightLeg, x: 0.16 }].map(({ ref, x }) => <group key={x} ref={ref} position={[x, -0.28, 0]}>
      <mesh castShadow position-y={-0.32}><capsuleGeometry args={[0.13, 0.55, 5, 10]} /><meshStandardMaterial color={NAVY_DARK} roughness={0.9} /></mesh>
      <mesh castShadow position={[0, -0.66, 0.06]}><boxGeometry args={[0.28, 0.16, 0.42]} /><meshStandardMaterial color="#0d0f10" roughness={0.45} /></mesh>
      <mesh position={[0, -0.74, 0.06]}><boxGeometry args={[0.29, 0.03, 0.44]} /><meshStandardMaterial color="#050606" roughness={0.9} /></mesh>
    </group>)}
    <group position={[0.43, -0.08, 0.14]}>
      <mesh castShadow position={[0, 0.02, 0]}><boxGeometry args={[0.12, 0.16, 0.28]} /><meshStandardMaterial color="#171b1c" metalness={0.55} roughness={0.45} /></mesh>
      <mesh castShadow position={[0, 0.06, 0.16]}><boxGeometry args={[0.08, 0.08, 0.24]} /><meshStandardMaterial color="#242a2a" metalness={0.6} roughness={0.4} /></mesh>
      <group ref={muzzleFlash} visible={false} position={[0, 0.06, 0.3]}><pointLight color="#ffbf5e" intensity={3.5} distance={2.3} /><mesh><sphereGeometry args={[0.075, 8, 6]} /><meshBasicMaterial color="#fff0b0" /></mesh></group>
    </group>
  </group>;
}
