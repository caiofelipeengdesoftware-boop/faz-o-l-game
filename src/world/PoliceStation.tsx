import { CuboidCollider, RigidBody } from '@react-three/rapier';

export function PoliceStation({ onInteract }: { onInteract: () => void }) {
  return <RigidBody type="fixed" colliders={false} position={[-15, 0, 15]}>
    <CuboidCollider args={[4.6, 2.4, 3.8]} position={[0, 2.4, 0]} />
    <mesh castShadow receiveShadow position-y={2.25}><boxGeometry args={[9.2, 4.5, 7.6]} /><meshStandardMaterial color="#c8c8bc" roughness={0.82} /></mesh>
    <mesh castShadow position={[0, 4.62, 0]}><boxGeometry args={[9.55, 0.22, 7.9]} /><meshStandardMaterial color="#596a70" roughness={0.65} /></mesh>
    <mesh position={[0, 3.55, 3.83]}><planeGeometry args={[5.4, 0.7]} /><meshStandardMaterial color="#244862" /></mesh>
    <mesh position={[0, 3.55, 3.86]}><planeGeometry args={[5.4, 0.7]} /><meshStandardMaterial color="#244862" /></mesh>
    <mesh position={[0, 3.55, 3.89]}><planeGeometry args={[4.5, 0.18]} /><meshStandardMaterial color="#efdb9c" /></mesh>
    <mesh castShadow position={[0, 1.05, 3.84]} onClick={onInteract}><boxGeometry args={[1.3, 2.1, 0.14]} /><meshStandardMaterial color="#2c3436" /></mesh>
    <mesh castShadow position={[-2.8, 2.6, 3.84]}><boxGeometry args={[1.35, 1.2, 0.1]} /><meshStandardMaterial color="#6b8790" metalness={0.2} roughness={0.3} /></mesh>
    <mesh castShadow position={[2.8, 2.6, 3.84]}><boxGeometry args={[1.35, 1.2, 0.1]} /><meshStandardMaterial color="#6b8790" metalness={0.2} roughness={0.3} /></mesh>
    <mesh castShadow position={[-3, 0.38, 1.8]}><boxGeometry args={[1, 0.75, 1.1]} /><meshStandardMaterial color="#4b5660" /></mesh>
  </RigidBody>;
}
