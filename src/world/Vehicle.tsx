import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { MathUtils, Quaternion, Vector2, Vector3 } from 'three';
import { gameInput } from '../systems/gameInput';
import { playGunshot, playHorn, playImpact, updateEngineSound } from '../systems/audio';
import { hitCombatTarget } from '../systems/combatTargets';
import { useGameStore } from '../state';

function VehicleBody({ color = '#ddd9cb', headlightsOn = false }: { color?: string; headlightsOn?: boolean }) {
  const wheelMat = '#252729';
  return <group>
    <mesh castShadow position={[0, 0.13, 0]}><boxGeometry args={[1.85, 0.72, 4.2]} /><meshStandardMaterial color={color} metalness={0.25} roughness={0.55} /></mesh>
    <mesh castShadow position={[0, 0.64, -0.25]}><boxGeometry args={[1.55, 0.68, 2.15]} /><meshStandardMaterial color="#24343c" metalness={0.45} roughness={0.25} /></mesh>
    <mesh position={[0, 0.66, -0.25]}><boxGeometry args={[1.48, 0.52, 2.05]} /><meshStandardMaterial color="#617d8b" metalness={0.5} roughness={0.2} /></mesh>
    <mesh position={[0, 0.3, 2.12]}><boxGeometry args={[1.35, 0.19, 0.08]} /><meshStandardMaterial color="#f0e9cd" emissive="#e8d6a0" emissiveIntensity={headlightsOn ? 2.2 : 0.28} /></mesh>
    {headlightsOn && [-0.55, 0.55].map((x) => <pointLight key={x} position={[x, 0.25, 2.18]} color="#ffe9bd" intensity={7} distance={13} decay={2} />)}
    <mesh position={[0, 0.24, -2.12]}><boxGeometry args={[1.3, 0.15, 0.08]} /><meshStandardMaterial color="#ae3025" emissive="#662018" emissiveIntensity={0.5} /></mesh>
    {[-1, 1].flatMap((side) => [-1.35, 1.35].map((z) => <mesh key={`${side}-${z}`} castShadow position={[side * 0.98, -0.22, z]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.36, 0.36, 0.22, 16]} /><meshStandardMaterial color={wheelMat} roughness={0.95} /></mesh>))}
    <mesh position={[0, 0.6, 1.45]}><boxGeometry args={[0.08, 0.2, 0.03]} /><meshStandardMaterial color="#e7c86d" metalness={0.6} /></mesh>
  </group>;
}

export function Vehicle() {
  const body = useRef<RapierRigidBody>(null);
  const speed = useRef(0);
  const clock = useRef(0);
  const cameraTarget = useRef(new Vector3());
  const cameraOffset = useRef(new Vector3());
  const desiredCamera = useRef(new Vector3());
  const quaternion = useRef(new Quaternion());
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.22);
  const forward = useRef(new Vector3());
  const camera = useThree((state) => state.camera);
  const raycaster = useThree((state) => state.raycaster);
  const isDriving = useGameStore((state) => state.isDriving);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const headlightsOn = useGameStore((state) => state.headlightsOn);
  const fireCooldown = useRef(0);
  const hornWas = useRef(false);

  useFrame((_, delta) => {
    const rigidBody = body.current;
    if (!rigidBody) return;
    const dt = Math.min(delta, 0.05);
    if (!gameInput.enabled) { updateEngineSound(speed.current, false); return; }
    const store = useGameStore.getState();
    const position = rigidBody.translation();
    updateEngineSound(speed.current, isDriving);
    fireCooldown.current = Math.max(0, fireCooldown.current - dt);
    if (gameInput.horn && !hornWas.current) playHorn();
    hornWas.current = gameInput.horn;
    clock.current += dt;
    if (clock.current > 0.12) {
      store.setVehiclePosition(position.x, position.z);
      if (store.isDriving) {
        store.setPlayerPosition(position.x, position.z);
        const facing = rigidBody.rotation();
        store.setPlayerYaw(Math.atan2(2 * (facing.w * facing.y + facing.x * facing.z), 1 - 2 * (facing.y * facing.y + facing.z * facing.z)));
      }
      clock.current = 0;
    }
    if (gameInput.vehiclePressed) {
      if (store.isDriving) {
        quaternion.current.set(rigidBody.rotation().x, rigidBody.rotation().y, rigidBody.rotation().z, rigidBody.rotation().w);
        const exit = new Vector3(1.8, 0, 0).applyQuaternion(quaternion.current).add(new Vector3(position.x, 0.92, position.z));
        store.setPlayerPosition(exit.x, exit.z);
        store.setDriving(false);
      } else {
        const distance = Math.hypot(position.x - store.playerPosition[0], position.z - store.playerPosition[1]);
        if (distance < 4.5) store.setDriving(true);
      }
    }

    if (!isDriving) {
      speed.current = MathUtils.damp(speed.current, 0, 1.5, dt);
      const velocity = rigidBody.linvel();
      rigidBody.setLinvel({ x: velocity.x * 0.94, y: velocity.y, z: velocity.z * 0.94 }, true);
      return;
    }

    const stickThrottle = gameInput.moveY > 0 ? gameInput.moveY : 0;
    const stickReverse = gameInput.moveY < 0 ? -gameInput.moveY : 0;
    const throttle = Math.max(gameInput.throttle, stickThrottle);
    const reverse = Math.max(gameInput.reverse, stickReverse);
    const desired = gameInput.handbrake ? 0 : gameInput.brake ? (speed.current > 0.45 ? 0 : -reverse * 7) : throttle * 22;
    speed.current = MathUtils.damp(speed.current, desired, gameInput.handbrake ? 8 : desired === 0 ? 3.2 : 2.6, dt);
    const yawRate = gameInput.moveX * Math.min(1, Math.abs(speed.current) / 3.5) * Math.sign(speed.current) * (gameInput.handbrake ? 2.15 : 1.35);
    rigidBody.setAngvel({ x: 0, y: yawRate, z: 0 }, true);
    const rotation = rigidBody.rotation();
    quaternion.current.set(rotation.x, rotation.y, rotation.z, rotation.w);
    forward.current.set(0, 0, 1).applyQuaternion(quaternion.current);
    const velocity = rigidBody.linvel();
    rigidBody.setLinvel({ x: forward.current.x * speed.current, y: velocity.y, z: forward.current.z * speed.current }, true);

    const bodyYaw = Math.atan2(2 * (rotation.w * rotation.y + rotation.x * rotation.z), 1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z));
    cameraYaw.current -= gameInput.lookX * dt * 1.8;
    cameraPitch.current = MathUtils.clamp(cameraPitch.current - gameInput.lookY * dt * 1.3, -0.05, 0.55);
    forward.current.set(Math.sin(bodyYaw + (gameInput.lookBack ? Math.PI : 0)), 0, Math.cos(bodyYaw + (gameInput.lookBack ? Math.PI : 0)));
    if (cameraMode === 'first') {
      cameraTarget.current.set(position.x, position.y + 1.08, position.z);
      camera.position.lerp(cameraTarget.current, 1 - Math.exp(-14 * dt));
      camera.lookAt(desiredCamera.current.copy(cameraTarget.current).addScaledVector(forward.current, 12));
    } else {
      const followYaw = bodyYaw + cameraYaw.current + (gameInput.lookBack ? Math.PI : 0);
      const followDistance = 8;
      cameraTarget.current.set(position.x, position.y + 0.75, position.z);
      cameraOffset.current.set(Math.sin(followYaw) * followDistance, 2.9 + cameraPitch.current * 3, -Math.cos(followYaw) * followDistance);
      desiredCamera.current.copy(cameraTarget.current).add(cameraOffset.current);
      camera.position.lerp(desiredCamera.current, 1 - Math.exp(-4 * dt));
      camera.lookAt(cameraTarget.current);
    }
    if (gameInput.fire && fireCooldown.current === 0 && store.missionPhase === 'shootout' && store.spendAmmo()) {
      raycaster.setFromCamera(new Vector2(0, 0), camera);
      if (hitCombatTarget(raycaster)) playImpact();
      playGunshot(); fireCooldown.current = 0.24;
    }
  });

  return <RigidBody ref={body} type="dynamic" colliders={false} mass={1120} canSleep={false} enabledRotations={[false, true, false]} linearDamping={0.35} angularDamping={4} position={[0, 0.72, -3]}>
    <CuboidCollider args={[0.96, 0.64, 2.2]} friction={0.85} restitution={0.05} />
    <VehicleBody headlightsOn={headlightsOn} />
  </RigidBody>;
}

export function ParkedCar({ position, color }: { position: [number, number, number]; color: string }) {
  return <RigidBody type="fixed" colliders={false} position={position}>
    <CuboidCollider args={[0.92, 0.62, 2.08]} />
    <VehicleBody color={color} />
  </RigidBody>;
}
