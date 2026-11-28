import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { MathUtils, type Group, type Mesh, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import { gameInput } from '../systems/gameInput';
import { hitCombatTarget, hitNearestCombatTarget } from '../systems/combatTargets';
import { playFootstep, playGunshot, playImpact } from '../systems/audio';
import { useGameStore } from '../state';
import { newMotion, Person } from './Person';

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<Group>(null);
  const motion = useRef(newMotion()); const aimRef = useRef(false); const lookRef = useRef({ yaw: 0, pitch: 0 }); const meleeTimer = useRef(0);
  const look = useGameStore((state) => state.profile.look);
  const firstPersonWeapon = useRef<Group>(null);
  const muzzleFlash = useRef<Group>(null);
  const firstPersonFlash = useRef<Group>(null);
  const impactFlash = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const raycaster = useThree((state) => state.raycaster);
  const cameraRay = useRef(new Raycaster());
  const yaw = useRef(0); const pitch = useRef(0.16);
  const fireCooldown = useRef(0); const muzzleTimer = useRef(0); const impactTimer = useRef(0); const recoil = useRef(0); const mapClock = useRef(0); const footstepClock = useRef(0); const gait = useRef(0);
  const cameraTarget = useRef(new Vector3()); const desiredCamera = useRef(new Vector3());
  const forward = useRef(new Vector3()); const right = useRef(new Vector3()); const movement = useRef(new Vector3());
  const lastSafePosition = useRef<[number, number]>([0, -8]);
  const isDriving = useGameStore((state) => state.isDriving);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const playerTeleport = useGameStore((state) => state.playerTeleport);
  const isCrouched = useGameStore((state) => state.isCrouched);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || isDriving) return;
    const [x, z] = useGameStore.getState().playerPosition;
    lastSafePosition.current = [x, z];
    body.setEnabled(true); body.setTranslation({ x, y: 0.92, z }, true); body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  }, [isDriving, playerTeleport]);

  useEffect(() => {
    const contextMenu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('contextmenu', contextMenu);
    return () => window.removeEventListener('contextmenu', contextMenu);
  }, []);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    if (isDriving) { body.setEnabled(false); return; }
    if (!gameInput.enabled) return;
    const dt = Math.min(delta, 0.05);
    yaw.current -= gameInput.lookX * dt;
    pitch.current = MathUtils.clamp(pitch.current - gameInput.lookY * dt, -0.32, 0.72);

    forward.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    right.current.set(forward.current.z, 0, -forward.current.x);
    movement.current.set(0, 0, 0).addScaledVector(forward.current, gameInput.moveY).addScaledVector(right.current, gameInput.moveX);
    const strength = Math.min(1, movement.current.length());
    if (strength > 0.01) movement.current.normalize();
    const velocity = body.linvel();
    const speed = isCrouched ? 2.15 : gameInput.run ? 6.2 : 4.25;
    const response = strength > 0.01 ? (gameInput.run ? 12 : 15) : 9;
    body.setLinvel({
      x: MathUtils.damp(velocity.x, movement.current.x * speed * strength, response, dt),
      y: velocity.y,
      z: MathUtils.damp(velocity.z, movement.current.z * speed * strength, response, dt),
    }, true);
    if (gameInput.jumpPressed && body.translation().y < 1.0 && Math.abs(velocity.y) < 0.12) body.setLinvel({ x: velocity.x, y: 5.1, z: velocity.z }, true);

    const moving = strength > 0.05 && body.translation().y < 1.02;
    gait.current += dt * (gameInput.run ? 12 : 8.4) * strength;
    motion.current.speed = moving ? (gameInput.run ? 1.8 : 1) * strength : 0; aimRef.current = gameInput.aim; meleeTimer.current = Math.max(0, meleeTimer.current - dt);
    if (modelRef.current && (strength > 0.03 || gameInput.aim)) {
      const heading = gameInput.aim ? yaw.current : Math.atan2(movement.current.x, movement.current.z);
      const deltaYaw = Math.atan2(Math.sin(heading - modelRef.current.rotation.y), Math.cos(heading - modelRef.current.rotation.y));
      modelRef.current.rotation.y += deltaYaw * (1 - Math.exp(-(gameInput.aim ? 12 : 7) * dt));
    }
    if (modelRef.current) modelRef.current.scale.y = MathUtils.damp(modelRef.current.scale.y, isCrouched ? 0.78 : 1, 9, dt);
    if (firstPersonWeapon.current) { firstPersonWeapon.current.rotation.y = yaw.current; firstPersonWeapon.current.rotation.x = -pitch.current; }
    lookRef.current.yaw = yaw.current - (modelRef.current?.rotation.y ?? yaw.current); lookRef.current.pitch = pitch.current;
    if (moving) {
      footstepClock.current += dt;
      if (footstepClock.current > (gameInput.run ? 0.34 : 0.49)) { playFootstep(gameInput.run); footstepClock.current = 0; }
    } else footstepClock.current = Math.min(footstepClock.current, 0.18);

    const position = body.translation();
    const store = useGameStore.getState();
    const positionIsInvalid = !Number.isFinite(position.x + position.y + position.z) || position.y < -2.5 || Math.abs(position.x) > 196 || Math.abs(position.z) > 84;
    if (positionIsInvalid) {
      const [safeX, safeZ] = lastSafePosition.current;
      body.setTranslation({ x: safeX, y: 0.92, z: safeZ }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      store.restorePlayerAt(safeX, safeZ);
      camera.position.set(safeX, 3.5, safeZ - 6);
      camera.lookAt(safeX, 1, safeZ + 4);
      return;
    }
    if (position.y > 0.76 && position.y < 1.3 && Math.abs(velocity.y) < 0.18 && Math.hypot(velocity.x, velocity.z) < 8) {
      lastSafePosition.current = [position.x, position.z];
    }
    if (store.playerHealth <= 0) {
      const [safeX, safeZ] = lastSafePosition.current;
      body.setTranslation({ x: safeX, y: 0.92, z: safeZ }, true); body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      store.restorePlayer(); store.reloadAmmo(); store.resetMission(); store.restorePlayerAt(safeX, safeZ);
      store.setQuestProgress('contracts', 1);
    }
    if (modelRef.current) modelRef.current.visible = cameraMode === 'third';
    if (firstPersonWeapon.current) firstPersonWeapon.current.visible = cameraMode === 'first';

    const eyeHeight = cameraMode === 'first' ? (isCrouched ? 0.57 : 0.82) : (isCrouched ? 0.78 : 1.08);
    cameraTarget.current.set(position.x, position.y + eyeHeight, position.z);
    if (cameraMode === 'first') {
      const viewYaw = yaw.current + (gameInput.lookBack ? Math.PI : 0);
      forward.current.set(Math.sin(viewYaw) * Math.cos(pitch.current), Math.sin(pitch.current), Math.cos(viewYaw) * Math.cos(pitch.current));
      camera.position.lerp(cameraTarget.current, 1 - Math.exp(-18 * dt));
      camera.lookAt(desiredCamera.current.copy(cameraTarget.current).add(forward.current));
    } else {
      const distance = gameInput.aim ? 2.75 : 5.1;
      const viewYaw = yaw.current + (gameInput.lookBack ? Math.PI : 0);
      const horizontal = Math.cos(pitch.current) * distance;
      desiredCamera.current.set(position.x - Math.sin(viewYaw) * horizontal, position.y + (isCrouched ? 0.9 : 1.15) + Math.sin(pitch.current) * distance, position.z - Math.cos(viewYaw) * horizontal);
      if (gameInput.aim) desiredCamera.current.addScaledVector(right.current, 0.62);
      const cameraVector = desiredCamera.current.clone().sub(cameraTarget.current);
      const cameraDistance = cameraVector.length();
      const ray = cameraRay.current; ray.set(cameraTarget.current, cameraVector.normalize()); ray.far = cameraDistance;
      const obstruction = ray.intersectObjects(scene.children, true).find((hit) => {
        if (hit.distance < 0.35) return false;
        for (let node = hit.object; node; node = node.parent!) if (node === modelRef.current || node === firstPersonWeapon.current) return false;
        return true;
      });
      if (obstruction) desiredCamera.current.copy(cameraTarget.current).addScaledVector(ray.ray.direction, Math.max(0.35, obstruction.distance - 0.28));
      camera.position.lerp(desiredCamera.current, 1 - Math.exp(-(gameInput.aim ? 11 : 8) * dt));
      forward.current.set(Math.sin(yaw.current) * Math.cos(pitch.current), Math.sin(pitch.current), Math.cos(yaw.current) * Math.cos(pitch.current));
      camera.lookAt(desiredCamera.current.copy(cameraTarget.current).addScaledVector(forward.current, 18));
    }
    if (camera instanceof PerspectiveCamera) {
      camera.fov = MathUtils.damp(camera.fov, gameInput.aim ? 53 : gameInput.run && strength > 0.3 ? 75 : 68, 5, dt);
      camera.updateProjectionMatrix();
    }
    recoil.current = MathUtils.damp(recoil.current, 0, 12, dt);
    camera.position.y += recoil.current;
    muzzleTimer.current = Math.max(0, muzzleTimer.current - dt);
    if (muzzleFlash.current) muzzleFlash.current.visible = muzzleTimer.current > 0;
    if (firstPersonFlash.current) firstPersonFlash.current.visible = muzzleTimer.current > 0;
    impactTimer.current = Math.max(0, impactTimer.current - dt);
    if (impactFlash.current) impactFlash.current.visible = impactTimer.current > 0;

    mapClock.current += dt;
    if (mapClock.current > 0.12) { store.setPlayerPosition(position.x, position.z); store.setPlayerYaw(yaw.current); mapClock.current = 0; }
    fireCooldown.current = Math.max(0, fireCooldown.current - dt);
    if (gameInput.fire && fireCooldown.current === 0 && store.spendAmmo()) {
      raycaster.setFromCamera(new Vector2(0, 0), camera);
      const hitTarget = hitCombatTarget(raycaster);
      raycaster.far = 120;
      const surfaceHit = raycaster.intersectObjects(scene.children, true).find((hit) => {
        if (hit.distance < 0.45) return false;
        for (let node = hit.object; node; node = node.parent!) if (node === modelRef.current || node === firstPersonWeapon.current || node === impactFlash.current) return false;
        return true;
      });
      if (surfaceHit && impactFlash.current) {
        const bodyPosition = body.translation();
        impactFlash.current.position.set(surfaceHit.point.x - bodyPosition.x, surfaceHit.point.y - bodyPosition.y, surfaceHit.point.z - bodyPosition.z);
        impactFlash.current.visible = true; impactTimer.current = 0.075; playImpact();
      } else if (hitTarget) playImpact();
      playGunshot(); store.markShot(); fireCooldown.current = 0.22; muzzleTimer.current = 0.055; recoil.current = -0.04;
    }
    if (gameInput.meleePressed && fireCooldown.current === 0) {
      if (hitNearestCombatTarget(new Vector3(position.x, position.y + 0.9, position.z), 2.4)) playImpact();
      fireCooldown.current = 0.45; meleeTimer.current = 0.3;
    }
    if (gameInput.vehiclePressed) {
      const vehiclePosition = store.vehiclePosition;
      if (Math.hypot(position.x - vehiclePosition[0], position.z - vehiclePosition[1]) < 4.5) store.setDriving(true);
    }
  });

  return <RigidBody ref={bodyRef} colliders={false} mass={1} enabledRotations={[false, false, false]} position={[0, 0.92, -8]} linearDamping={0}>
    <CapsuleCollider args={[0.55, 0.34]} friction={0.1} />
    <group ref={modelRef}><group position-y={-0.89}><Person look={look} motion={motion} aim={aimRef} muzzleRef={muzzleFlash} lookRef={lookRef} punch={meleeTimer} /></group></group>
    <group ref={firstPersonWeapon} visible={false} position={[0, 0.45, 0]}>
      <mesh castShadow position={[0.36, 0.08, 0.35]}><boxGeometry args={[0.1, 0.1, 0.38]} /><meshStandardMaterial color="#171b1c" metalness={0.55} roughness={0.45} /></mesh>
      <mesh castShadow position={[0.36, -0.08, 0.19]} rotation-x={-0.2}><boxGeometry args={[0.1, 0.2, 0.12]} /><meshStandardMaterial color="#171b1c" roughness={0.8} /></mesh>
      <mesh castShadow position={[0.47, -0.02, 0.09]} rotation-x={-0.2}><capsuleGeometry args={[0.1, 0.45, 4, 7]} /><meshStandardMaterial color="#225b8d" /></mesh>
      <group ref={firstPersonFlash} visible={false} position={[0.36, 0.08, 0.57]}><pointLight color="#ffc468" intensity={3} distance={2} /><mesh><sphereGeometry args={[0.07, 7, 5]} /><meshBasicMaterial color="#fff0b0" /></mesh></group>
    </group>
    <mesh ref={impactFlash} visible={false} castShadow={false}><sphereGeometry args={[0.075, 7, 5]} /><meshStandardMaterial color="#ffb35d" emissive="#e46d24" emissiveIntensity={3.2} /></mesh>
  </RigidBody>;
}
