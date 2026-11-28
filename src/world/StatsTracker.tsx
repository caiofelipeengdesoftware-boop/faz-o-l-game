import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameInput } from '../systems/gameInput';
import { useGameStore } from '../state';

/** Conta tempo de serviço, distância percorrida e quedas para a aba Estatísticas. */
export function StatsTracker() {
  const clock = useRef(0); const last = useRef<[number, number] | null>(null); const meters = useRef(0); const alive = useRef(true);
  useFrame((_, delta) => {
    if (!gameInput.enabled) return;
    const store = useGameStore.getState(); const [x, z] = store.playerPosition;
    if (last.current) { const d = Math.hypot(x - last.current[0], z - last.current[1]); if (d < 3) meters.current += d; }
    last.current = [x, z]; clock.current += delta;
    if (clock.current >= 1) { store.addStat('playSeconds', 1); if (meters.current >= 1) { store.addStat('distance', Math.round(meters.current)); meters.current = 0; } clock.current -= 1; }
    const dead = store.playerHealth <= 0; if (dead && alive.current) { store.addStat('deaths'); alive.current = false; } else if (!dead) alive.current = true;
  });
  return null;
}
