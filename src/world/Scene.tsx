import { Suspense, useEffect, useState } from 'react';
import { Physics, RigidBody } from '@react-three/rapier';
import { Environment, Lightformer } from '@react-three/drei';
import { useGameStore } from '../state';
import { InputManager } from '../systems/gameInput';
import { City } from './City';
import { Atmosphere, Rain } from './Environment';
import { Traffic } from './Traffic';
import { Player } from './Player';
import { PoliceStation } from './PoliceStation';
import { Vehicle, ParkedCar } from './Vehicle';
import { Pedestrians } from './Pedestrians';
import { EvidenceSite, FactionEnemy, MissionOfficer, QuestObjectives } from './MissionActors';
import { HouseDoor, InteriorRoom } from './Interior';
import { ClubExterior, ClubInterior, ClubSoundscape } from './Club';
import { Animals } from './Animals';
import { RemotePlayers } from '../multiplayer/Multiplayer';
import { Effects } from './Effects';

export function Scene({ onInteract, enabled }: { onInteract: () => void; enabled: boolean }) {
  const isInside = useGameStore((state) => state.isInside);
  const interiorKind = useGameStore((state) => state.interiorKind);
  const showQuestBoard = useGameStore((state) => state.showQuestBoard);
  return <>
    <color attach="background" args={['#a8afa4']} /><fogExp2 attach="fog" args={['#a8afa4', 0.0019]} />
    <Atmosphere /><Rain /><ReflectionEnvironment /><ClubSoundscape />
    <Physics gravity={[0, -9.81, 0]} timeStep="vary" paused={!enabled || showQuestBoard}>
      <InputManager enabled={enabled && !showQuestBoard} />
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.6, 0]}><mesh receiveShadow><boxGeometry args={[180, 1.2, 180]} /><meshStandardMaterial color="#393b38" roughness={0.98} /></mesh></RigidBody>
      {isInside ? (interiorKind === 'club' ? <ClubInterior /> : <InteriorRoom />) : <>
        <City /><HouseDoor /><ClubExterior /><PoliceStation onInteract={onInteract} />
        <Vehicle /><Traffic />
        <ParkedCar position={[-69, 0.72, -8]} color="#667e84" />
        <ParkedCar position={[69, 0.72, 10]} color="#a84d39" />
        <Pedestrians /><Animals /><MissionOfficer /><EvidenceSite /><QuestObjectives /><RemotePlayers />
        {[0, 1, 2, 3].map((index) => <FactionEnemy key={index} index={index} />)}
      </>}
      <Player />
    </Physics>
    <Effects />
  </>;
}

function ProceduralEnvironment() {
  return <Environment resolution={128} frames={1} background={false}>
    <Lightformer intensity={2.1} position={[0, 5, -8]} scale={[10, 5, 1]} color="#d9e4e8" />
    <Lightformer intensity={1.4} position={[-8, 2, 0]} scale={[3, 6, 1]} color="#c7d1d5" />
    <Lightformer intensity={1.6} position={[8, 3, 2]} scale={[4, 5, 1]} color="#efe2c3" />
  </Environment>;
}

function ReflectionEnvironment() {
  const [hasHdri, setHasHdri] = useState(false);
  useEffect(() => { let current = true; void fetch('/models/environment.hdr', { method: 'HEAD' }).then((response) => { if (current) setHasHdri(response.ok && !response.headers.get('content-type')?.includes('text/html')); }).catch(() => { if (current) setHasHdri(false); }); return () => { current = false; }; }, []);
  return hasHdri ? <Suspense fallback={<ProceduralEnvironment />}><Environment files="/models/environment.hdr" background={false} /></Suspense> : <ProceduralEnvironment />;
}
