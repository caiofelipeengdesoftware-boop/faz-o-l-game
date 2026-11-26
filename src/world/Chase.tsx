import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { registerCombatTarget, unregisterCombatTarget } from '../systems/combatTargets';
import { setHint } from '../systems/hints';
import { playImpact } from '../systems/audio';
import { useGameStore } from '../state';
import { lookOf } from '../data/story';
import { newMotion, Person } from './Person';

const START: [number, number, number] = [35.4, 0, -33];
/** Circuito pelas ruas (pista de asfalto, sem trânsito nas avenidas internas). */
const PATH: [number, number][] = [[35.4, 33], [-24.6, 33], [-24.6, -33], [35.4, -33]];
const SPEED = 5.7; const TIME_LIMIT = 85; const NOTICE_RANGE = 11;

/** Perseguição a pé: Tavinho foge pelo circuito; o jogador precisa alcançá-lo e prendê-lo (E) ou derrubá-lo a tiros. */
export function ChaseTarget() {
  const quest = useGameStore((state) => state.quests.find((item) => item.id === 'chase'));
  const active = quest?.status === 'active'; const progress = quest?.progress ?? 0;
  const root = useRef<Group>(null); const motion = useRef(newMotion());
  const waypoint = useRef(0); const timer = useRef(0); const hits = useRef(0); const stumble = useRef(0); const nextStumble = useRef(7);

  const resetPosition = () => { root.current?.position.set(START[0], 0, START[2]); root.current?.rotation.set(0, Math.PI, 0); if (root.current) root.current.scale.set(1, 1, 1); waypoint.current = 0; timer.current = 0; hits.current = 0; stumble.current = 0; nextStumble.current = 7; };
  useEffect(() => { if (active && progress === 0) resetPosition(); }, [active, progress]);
  useEffect(() => () => { setHint('chase', null); useGameStore.getState().setChasePosition(null); }, []);
  useEffect(() => {
    if (!active || progress !== 1 || !root.current) return;
    registerCombatTarget('tavinho', root.current, () => {
      hits.current += 1; playImpact();
      if (hits.current >= 3) catchSuspect();
    });
    return () => unregisterCombatTarget('tavinho');
  }, [active, progress]);

  const catchSuspect = () => {
    const store = useGameStore.getState();
    if (store.quests.find((item) => item.id === 'chase')?.progress !== 1) return;
    motion.current.speed = 0; store.advanceQuest('chase');
    store.showNotice('Tavinho foi detido. Converse com ele.');
  };

  useFrame((_, delta) => {
    const group = root.current;
    if (!group || !active || !gameInput.enabled) return;
    const dt = Math.min(delta, 0.05); const store = useGameStore.getState();
    const [px, pz] = store.playerPosition; const dx = px - group.position.x; const dz = pz - group.position.z; const distance = Math.hypot(dx, dz);
    if (progress === 0) {
      motion.current.speed = 0; group.rotation.y = Math.atan2(dx, dz);
      if (distance < NOTICE_RANGE) { store.advanceQuest('chase'); store.showNotice('Tavinho viu você e correu! Alcance-o!'); timer.current = 0; }
    } else if (progress === 1) {
      timer.current += dt; stumble.current = Math.max(0, stumble.current - dt); nextStumble.current -= dt;
      if (nextStumble.current <= 0) { stumble.current = 1.1; nextStumble.current = 6 + Math.random() * 5; }
      if (timer.current > TIME_LIMIT) {
        store.setQuestProgress('chase', 0); store.setChasePosition(null); setHint('chase', null); resetPosition();
        store.showNotice('Tavinho escapou. Ele voltou ao ponto de partida. Tente de novo.');
        return;
      }
      const [tx, tz] = PATH[waypoint.current]; const wx = tx - group.position.x; const wz = tz - group.position.z; const wd = Math.hypot(wx, wz);
      if (wd < 0.8) waypoint.current = (waypoint.current + 1) % PATH.length;
      const speed = SPEED * (stumble.current > 0 ? 0.35 : 1);
      group.position.x += wx / (wd || 1) * speed * dt; group.position.z += wz / (wd || 1) * speed * dt;
      group.rotation.y = Math.atan2(wx, wz);
      motion.current.speed = stumble.current > 0 ? 0.8 : 1.8;
      store.setChasePosition([group.position.x, group.position.z]);
      const closeEnough = distance < 2.4;
      setHint('chase', closeEnough ? 'Prender o suspeito' : null);
      if (closeEnough && gameInput.interactPressed && consumeInteraction()) { setHint('chase', null); catchSuspect(); }
    } else if (progress === 2) {
      motion.current.speed = 0; group.rotation.y = Math.atan2(dx, dz); group.rotation.x = 0.28; group.scale.y = 0.86;
      store.setChasePosition(null);
      const talkable = distance < 2.8;
      setHint('chase', talkable ? 'Interrogar Tavinho' : null);
      if (talkable && gameInput.interactPressed && consumeInteraction()) {
        setHint('chase', null);
        store.showCharacterDialogue('Tavinho', 'Tá bom, tá bom! Eu só levava as caixas do depósito. O Secretário Brandão manda, o delegado Ramos garante que a polícia não aparece. Os recibos de pagamento estão num cofre da prefeitura. Eu juro, é tudo que eu sei.');
        store.advanceQuest('chase');
      }
    }
  });
  if (!active) return null;
  return <group ref={root} position={START}><Person look={lookOf('tavinho')} motion={motion} /></group>;
}
