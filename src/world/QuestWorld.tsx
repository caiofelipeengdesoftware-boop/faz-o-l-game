import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group, type Mesh } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { registerCombatTarget, unregisterCombatTarget } from '../systems/combatTargets';
import { playGunshot, playImpact } from '../systems/audio';
import { setHint } from '../systems/hints';
import { ambush, talkHandlers } from '../systems/questTalk';
import { useGameStore } from '../state';
import { ENEMY_LOOKS } from '../data/story';
import { MANSION_GATE, MANSION_SAFE, STADIUM_GATE } from '../data/world';
import { isCivilian } from '../data/wardrobe';
import { newMotion, Person } from './Person';

const THUG_SPAWNS: [number, number][] = [[88, -16], [90, 14], [97, 25]];

/** Capanga genérico das missões (emboscada no estádio): persegue, circula, atira e cai com três acertos. */
function Thug({ index, spawn }: { index: number; spawn: [number, number] }) {
  const [alive, setAlive] = useState(true); const root = useRef<Group>(null); const tracer = useRef<Mesh>(null);
  const hp = useRef(3); const attack = useRef(1.2 + index * 0.5); const tracerTime = useRef(0); const direction = useRef(new Vector3()); const motion = useRef(newMotion()); const quaternion = useRef(new Quaternion());
  useEffect(() => {
    if (!alive || !root.current) return; const id = `thug-${index}`;
    registerCombatTarget(id, root.current, () => {
      hp.current -= 1; playImpact();
      if (hp.current <= 0) { setAlive(false); ambush.remaining = Math.max(0, ambush.remaining - 1); const store = useGameStore.getState(); store.addStat('enemiesDown'); store.addMoney(60); if (ambush.remaining === 0) { ambush.done = true; store.showNotice('Emboscada superada. Leve o envelope ao Sargento Duarte.'); } }
    });
    return () => unregisterCombatTarget(id);
  }, [alive, index]);
  useFrame((_, delta) => {
    const group = root.current; if (!group || !alive || !gameInput.enabled) return;
    const [px, pz] = useGameStore.getState().playerPosition; direction.current.set(px - group.position.x, 0, pz - group.position.z);
    const distance = direction.current.length(); const nx = direction.current.x / (distance || 1); const nz = direction.current.z / (distance || 1); const step = Math.min(delta, 0.05);
    if (distance > 8) { group.position.x += nx * step * 3; group.position.z += nz * step * 3; motion.current.speed = 1.6; }
    else if (distance < 4.5) { group.position.x -= nx * step * 1.6; group.position.z -= nz * step * 1.6; motion.current.speed = 1; }
    else { const side = Math.sin(performance.now() * 0.0011 + index * 2.3) > 0 ? 1 : -1; group.position.x += -nz * side * step * 1.7; group.position.z += nx * side * step * 1.7; motion.current.speed = 1.1; }
    group.rotation.y = Math.atan2(direction.current.x, direction.current.z);
    attack.current -= delta;
    if (distance < 18 && attack.current <= 0) {
      attack.current = 1.7 + index * 0.25; playGunshot(); if (distance < 15) { useGameStore.getState().damagePlayer(6); playImpact(); }
      tracerTime.current = 0.12;
      if (tracer.current) { tracer.current.visible = true; const ray = direction.current.clone().normalize(); tracer.current.position.set(ray.x * distance / 2, 1.05, ray.z * distance / 2); quaternion.current.setFromUnitVectors(new Vector3(0, 1, 0), ray); tracer.current.quaternion.copy(quaternion.current); tracer.current.scale.y = distance; }
    }
    tracerTime.current -= delta; if (tracerTime.current <= 0 && tracer.current) tracer.current.visible = false;
  });
  if (!alive) return null;
  return <group ref={root} position={[spawn[0], 0, spawn[1]]}><Person look={ENEMY_LOOKS[(index + 1) % ENEMY_LOOKS.length]} motion={motion} /><mesh ref={tracer} visible={false}><cylinderGeometry args={[0.035, 0.035, 1, 5]} /><meshBasicMaterial color="#ff6f42" /></mesh></group>;
}

/** Lógica das missões Disfarce, Jogo marcado (estádio) e Mansão Brandão. */
export function QuestWorld() {
  const stadium = useGameStore((state) => state.quests.find((q) => q.id === 'stadium'));
  const spawnAmbush = stadium?.status === 'active' && stadium.progress === 2 && !ambush.done;
  useEffect(() => { if (spawnAmbush && ambush.remaining === 0) ambush.remaining = THUG_SPAWNS.length; }, [spawnAmbush]);
  useEffect(() => {
    const q = (id: string) => useGameStore.getState().quests.find((item) => item.id === id);
    talkHandlers.set('cambista', () => {
      const s = q('stadium'); const store = useGameStore.getState(); if (s?.status !== 'active') return false;
      if (s.progress <= 1) {
        if (s.progress === 0) store.advanceQuest('stadium');
        store.advanceQuest('stadium'); ambush.done = false; ambush.remaining = THUG_SPAWNS.length;
        store.showCharacterDialogue('Cambista', 'Polícia? Tá bom, tá bom! O envelope tem os repasses da bilheteria. Pega e some, antes que o pessoal do Brandão apareça. Eles já vêm aí!');
        store.showNotice('Você pegou o envelope. Cuidado: capangas se aproximam!'); return true;
      }
      return false;
    });
    talkHandlers.set('duarte', () => {
      const s = q('stadium'); const store = useGameStore.getState(); if (s?.status !== 'active' || s.progress !== 2) return false;
      if (ambush.remaining > 0) { store.showCharacterDialogue('Sargento Duarte', 'Tem gente atirando em você! Resolva isso primeiro. Eu seguro o envelope aqui.'); return true; }
      store.showCharacterDialogue('Sargento Duarte', 'O envelope bate com os recibos do Tavinho. Bom trabalho. Agora o Brandão não tem para onde correr. Falta o cofre dele.'); store.advanceQuest('stadium'); return true;
    });
    const guard = () => {
      const m = q('mansion'); const store = useGameStore.getState(); if (m?.status !== 'active') return false;
      if (!isCivilian(store.profile.look)) { store.showCharacterDialogue('Segurança', 'Polícia? Sem mandado, ninguém passa. Volte quando não estiver com cara de investigação.'); return true; }
      if (m.progress === 0) store.advanceQuest('mansion');
      store.showCharacterDialogue('Segurança', 'Convidado do secretário? Pode entrar. O escritório fica no fundo da casa, pela entrada principal.'); return true;
    };
    talkHandlers.set('guarda1', guard); talkHandlers.set('guarda2', guard);
    return () => { talkHandlers.delete('cambista'); talkHandlers.delete('duarte'); talkHandlers.delete('guarda1'); talkHandlers.delete('guarda2'); };
  }, []);
  useFrame(() => {
    if (!gameInput.enabled) { setHint('quest-safe', null); return; }
    const store = useGameStore.getState(); const [px, pz] = store.playerPosition; const get = (id: string) => store.quests.find((item) => item.id === id);
    const s = get('stadium'); if (s?.status === 'active' && s.progress === 0 && Math.hypot(px - STADIUM_GATE[0], pz - STADIUM_GATE[1]) < 20) { store.advanceQuest('stadium'); store.showNotice('Você chegou ao estádio. Procure o cambista na bilheteria.'); }
    const m = get('mansion');
    if (m?.status === 'active') {
      if (m.progress === 0 && isCivilian(store.profile.look) && Math.hypot(px - MANSION_GATE[0], pz - MANSION_GATE[1]) < 4.5) { store.advanceQuest('mansion'); store.showNotice('Sem a farda, ninguém te barrou. Siga até o cofre, no fundo do pórtico.'); }
      if (m.progress === 1 || m.progress === 2) {
        const near = Math.hypot(px - MANSION_SAFE[0], pz - MANSION_SAFE[1]) < 3;
        setHint('quest-safe', near ? (m.progress === 1 ? 'Abrir o cofre' : 'Fotografar os recibos') : null);
        if (near && gameInput.interactPressed && consumeInteraction()) { setHint('quest-safe', null); store.advanceQuest('mansion'); store.showNotice(m.progress === 1 ? 'Cofre aberto. Agora fotografe os recibos.' : 'Recibos fotografados. Saia da propriedade sem ser visto.'); }
      } else setHint('quest-safe', null);
      if (m.progress === 3 && px > -108) store.advanceQuest('mansion');
    } else setHint('quest-safe', null);
  });
  return <>{spawnAmbush && THUG_SPAWNS.map((spawn, index) => <Thug key={index} index={index} spawn={spawn} />)}</>;
}
