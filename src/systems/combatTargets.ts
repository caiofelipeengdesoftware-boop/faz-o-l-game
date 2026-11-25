import { Vector3, type Object3D, type Raycaster } from 'three';

const targets = new Map<string, { object: Object3D; hit: () => void }>();
export function registerCombatTarget(id: string, object: Object3D, hit: () => void) { targets.set(id, { object, hit }); }
export function unregisterCombatTarget(id: string) { targets.delete(id); }
export function hitCombatTarget(raycaster: Raycaster) {
  const entries = Array.from(targets.entries());
  if (!entries.length) return false;
  const intersections = raycaster.intersectObjects(entries.map(([, target]) => target.object), true);
  const hitObject = intersections[0]?.object;
  if (!hitObject) return false;
  for (let parent: Object3D | null = hitObject; parent; parent = parent.parent) {
    const target = entries.find(([, value]) => value.object === parent)?.[1];
    if (target) { target.hit(); return true; }
  }
  return false;
}

export function hitNearestCombatTarget(origin: Vector3, maxDistance: number) {
  let closest: { hit: () => void; distance: number } | null = null;
  const targetPosition = new Vector3();
  for (const target of targets.values()) {
    target.object.getWorldPosition(targetPosition);
    const distance = targetPosition.distanceTo(origin);
    if (distance <= maxDistance && (!closest || distance < closest.distance)) closest = { hit: target.hit, distance };
  }
  if (!closest) return false;
  closest.hit();
  return true;
}
