import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color, Object3D, PCFSoftShadowMap, type InstancedMesh } from 'three';
import { setAudioEnabled, unlockAudio } from './systems/audio';
import { HUD } from './ui/HUD';
import { MobileControls } from './ui/MobileControls';
import { BribeDialogue } from './ui/Dialogue';
import { CharacterDialogue } from './ui/CharacterDialogue';
import { DonationDialog } from './ui/DonationDialog';
import { MainMenu, type MenuPage } from './ui/MainMenu';
import { loadGame, saveGame } from './persistence/save';
import { useGameStore } from './state';
import type { BribeOffer } from './systems/bribery';
import type { QuestId } from './state/slices/questSlice';
import { AimReticle } from './ui/AimReticle';
import { clearHints } from './systems/hints';
import { getControllerSettings, type ControllerSettings } from './systems/controllerSettings';
const GameScene = lazy(() => import('./world/Scene').then((module) => ({ default: module.Scene })));
const MultiplayerOverlay = lazy(() => import('./multiplayer/Multiplayer').then((module) => ({ default: module.MultiplayerOverlay })));

const offer: BribeOffer = { id: 'first-offer', amount: 2500, description: 'Um empresário local quer que você deixe um contrato passar sem fazer perguntas.' };
type Screen = MenuPage | 'game';
type PhysicsStatus = 'loading' | 'ready' | 'error';

let physicsInitialization: Promise<void> | null = null;
function preparePhysicsRuntime() {
  if (!physicsInitialization) {
    physicsInitialization = import('@dimforge/rapier3d-compat').then(({ init }) => init()).catch((error: unknown) => {
      physicsInitialization = null;
      throw error;
    });
  }
  return physicsInitialization;
}

function GraphicsQuality() {
  const gl = useThree((state) => state.gl);
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    const apply = (settings: ControllerSettings) => {
      const quality = settings.graphicsQuality;
      gl.shadowMap.enabled = quality !== 'performance';
      setDpr(quality === 'performance' ? 0.85 : quality === 'quality' ? 1.2 : 1);
    };
    apply(getControllerSettings());
    const update = (event: Event) => apply((event as CustomEvent<ControllerSettings>).detail);
    window.addEventListener('faz:settings-change', update);
    return () => window.removeEventListener('faz:settings-change', update);
  }, [gl, setDpr]);
  return null;
}

function BackdropTown() {
  const bodies = useRef<InstancedMesh>(null); const roofs = useRef<InstancedMesh>(null); const windows = useRef<InstancedMesh>(null); const doors = useRef<InstancedMesh>(null); const tanks = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null); const crowns = useRef<InstancedMesh>(null);
  const homes = useMemo(() => Array.from({ length: 117 }, (_, index) => {
    const row = Math.floor(index / 13); const col = index % 13; const seed = index * 37 + 11;
    return { x: (col - 6) * 10.7 + (row % 2) * 2.2 + (seed % 3) * 0.45, z: (row - 4) * 12 + (seed % 4) * 0.52, level: Math.max(0, (row - 2) * 0.45), width: 5.8 + seed % 4, depth: 5.4 + (seed >> 2) % 4, height: 3.2 + (seed % 7) * 0.52, wall: ['#c5ad8b', '#b99477', '#9baaa0', '#d0c3a1', '#b5785e', '#97a7a5', '#c5b59b'][seed % 7], roof: seed % 4 === 0 ? '#a95f3d' : '#76776e' };
  }), []);
  useEffect(() => {
    const dummy = new Object3D(); const wallColor = new Color(); const roofColor = new Color(); const glassColor = new Color();
    homes.forEach((home, i) => {
      dummy.position.set(home.x, home.level + home.height / 2, home.z); dummy.scale.set(home.width, home.height, home.depth); dummy.updateMatrix(); bodies.current?.setMatrixAt(i, dummy.matrix); wallColor.set(home.wall); bodies.current?.setColorAt(i, wallColor);
      dummy.position.set(home.x, home.level + home.height + 0.12, home.z); dummy.scale.set(home.width + 0.24, 0.22, home.depth + 0.24); dummy.updateMatrix(); roofs.current?.setMatrixAt(i, dummy.matrix); roofColor.set(home.roof); roofs.current?.setColorAt(i, roofColor);
      dummy.position.set(home.x, home.level + home.height * 0.47, home.z + home.depth / 2 + 0.025); dummy.scale.set(0.8, 1.28, 0.06); dummy.updateMatrix(); doors.current?.setMatrixAt(i, dummy.matrix);
      for (const side of [-1, 1]) { const slot = i * 2 + (side === 1 ? 1 : 0); dummy.position.set(home.x + side * home.width * 0.28, home.level + home.height * 0.62, home.z + home.depth / 2 + 0.03); dummy.scale.set(1.18, 1.05, 0.055); dummy.updateMatrix(); windows.current?.setMatrixAt(slot, dummy.matrix); glassColor.set(side < 0 ? '#637c7d' : '#789092'); windows.current?.setColorAt(slot, glassColor); }
      if (i % 9 === 0) { const slot = Math.floor(i / 9); dummy.position.set(home.x + home.width * 0.25, home.level + home.height + 0.88, home.z - home.depth * 0.2); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); tanks.current?.setMatrixAt(slot, dummy.matrix); }
    });
    for (const mesh of [bodies.current, roofs.current, windows.current, doors.current, tanks.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
    const trees = Array.from({ length: 16 }, (_, i) => [(i % 8 - 3.5) * 20 + 6, (Math.floor(i / 8) ? 34 : -70) + (i % 3) * 5] as [number, number]);
    trees.forEach(([x, z], i) => {
      dummy.position.set(x, 1.35, z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); trunks.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 3.25, z); dummy.scale.set(1.55, 1.85, 1.45); dummy.updateMatrix(); crowns.current?.setMatrixAt(i, dummy.matrix); crowns.current?.setColorAt(i, new Color(i % 2 ? '#3e6443' : '#587449'));
    });
    for (const mesh of [trunks.current, crowns.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }, [homes]);
  return <>
    <instancedMesh ref={bodies} args={[undefined, undefined, homes.length]} castShadow={false} receiveShadow={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.97} /></instancedMesh>
    <instancedMesh ref={roofs} args={[undefined, undefined, homes.length]} castShadow={false} receiveShadow={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.96} /></instancedMesh>
    <instancedMesh ref={doors} args={[undefined, undefined, homes.length]} castShadow={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#493b31" roughness={0.94} /></instancedMesh>
    <instancedMesh ref={windows} args={[undefined, undefined, homes.length * 2]} castShadow={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.5} metalness={0.08} /></instancedMesh>
    <instancedMesh ref={tanks} args={[undefined, undefined, Math.ceil(homes.length / 9)]} castShadow={false}><cylinderGeometry args={[0.62, 0.66, 1.45, 10]} /><meshStandardMaterial color="#777a6d" roughness={0.83} /></instancedMesh>
    <instancedMesh ref={trunks} args={[undefined, undefined, 16]}><cylinderGeometry args={[0.18, 0.24, 2.7, 7]} /><meshStandardMaterial color="#69533a" roughness={1} /></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, 16]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial roughness={1} flatShading /></instancedMesh>
  </>;
}

function TitleBackdrop() {
  const camera = useThree((state) => state.camera);
  useFrame((state) => { const time = state.clock.elapsedTime * 0.025; camera.position.set(Math.sin(time) * 108, 36, Math.cos(time) * 108); camera.lookAt(0, 4, 0); });
  return <>
    <color attach="background" args={['#78d9d1']} /><fogExp2 attach="fog" args={['#a3c89e', 0.0021]} />
    <ambientLight intensity={0.82} /><hemisphereLight args={['#7ddfd7', '#827753', 1.25]} /><directionalLight position={[-35, 58, 24]} intensity={2.45} color="#ffe5ad" />
    <mesh rotation-x={-Math.PI / 2} position-y={-0.16}><planeGeometry args={[220, 220]} /><meshStandardMaterial color="#817b58" roughness={1} /></mesh>
    {[
      { p: [-82, -17, -80] as [number, number, number], s: [52, 25, 36] as [number, number, number], c: '#66734b' }, { p: [72, -20, -86] as [number, number, number], s: [50, 27, 35] as [number, number, number], c: '#768052' },
      { p: [-91, -19, 86] as [number, number, number], s: [48, 27, 43] as [number, number, number], c: '#626f45' }, { p: [88, -21, 86] as [number, number, number], s: [50, 27, 42] as [number, number, number], c: '#798151' },
      { p: [0, -24, 124] as [number, number, number], s: [92, 35, 40] as [number, number, number], c: '#7c8050' },
    ].map((hill, i) => <mesh key={`hill-${i}`} position={hill.p} scale={hill.s}><sphereGeometry args={[1, 24, 12]} /><meshStandardMaterial color={hill.c} roughness={1} flatShading /></mesh>)}
    {[-50, -18, 14, 46].map((z) => <group key={`road-${z}`}><mesh position={[0, -0.025, z]}><boxGeometry args={[194, 0.08, 6.3]} /><meshStandardMaterial color="#3f4540" roughness={0.98} /></mesh><mesh position={[0, 0.025, z]}><boxGeometry args={[194, 0.025, 0.11]} /><meshStandardMaterial color="#d7c69a" roughness={0.9} /></mesh></group>)}
    <BackdropTown />
  </>;
}

function LoadingBackdrop() { return <TitleBackdrop />; }

function enterGameplayView() {
  if (navigator.maxTouchPoints > 0) {
    const fullscreen = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: 'landscape') => Promise<void> };
    if (fullscreen) void fullscreen.then(() => orientation.lock?.('landscape')).catch(() => undefined);
    return;
  }
  document.body.requestPointerLock?.();
}

function exitGameplayView() {
  document.exitPointerLock?.();
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [gameStarted, setGameStarted] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [dialogue, setDialogue] = useState(false);
  const [donating, setDonating] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [physicsStatus, setPhysicsStatus] = useState<PhysicsStatus>('loading');
  const settingsReturn = useRef<MenuPage>('title');
  const driving = useGameStore((state) => state.isDriving);
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const controllerName = useGameStore((state) => state.controllerName);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const weather = useGameStore((state) => state.weather);
  const showQuestBoard = useGameStore((state) => state.showQuestBoard || state.showPhone);
  const characterDialogue = useGameStore((state) => state.characterDialogue);
  const pauseRequested = useGameStore((state) => state.pauseRequested);
  const inGame = screen === 'game';
  const sceneLive = gameStarted && (screen === 'game' || screen === 'pause' || (screen === 'settings' && settingsReturn.current === 'pause'));

  useEffect(() => {
    const found = loadGame(); setHasSave(found);
    setAudioEnabled(useGameStore.getState().audioEnabled);
  }, []);
  useEffect(() => {
    let current = true;
    void preparePhysicsRuntime().then(() => { if (current) setPhysicsStatus('ready'); }).catch((error: unknown) => {
      console.error('Não foi possível iniciar a física da cidade.', error);
      if (current) setPhysicsStatus('error');
    });
    return () => { current = false; };
  }, []);
  useEffect(() => {
    if (inGame && pauseRequested) {
      useGameStore.getState().clearPauseRequest();
      setScreen('pause'); document.exitPointerLock?.();
    }
  }, [inGame, pauseRequested]);
  useEffect(() => {
    if (inGame && (dialogue || donating || characterDialogue)) document.exitPointerLock?.();
  }, [inGame, dialogue, donating, characterDialogue]);

  const resetGame = () => {
    unlockAudio(); setAudioEnabled(useGameStore.getState().audioEnabled);
    const store = useGameStore.getState(); store.resetMission(); store.resetQuests(); store.resetCorruption(); store.restorePlayer(); store.reloadAmmo(); store.setDriving(false); store.restorePlayerAt(0, -8); clearHints(); store.setChasePosition(null);
  };
  const startNewGame = () => { if (physicsStatus !== 'ready') return; resetGame(); setGameStarted(true); setScreen('game'); enterGameplayView(); };
  const startStory = () => { if (physicsStatus !== 'ready') return; resetGame(); setStoryIndex(0); setScreen('intro'); };
  const continueGame = () => {
    if (physicsStatus !== 'ready') return;
    unlockAudio();
    if (loadGame()) { setHasSave(true); setAudioEnabled(useGameStore.getState().audioEnabled); setGameStarted(true); setScreen('game'); enterGameplayView(); }
  };
  const finishStory = () => { if (physicsStatus !== 'ready') return; setGameStarted(true); setScreen('game'); enterGameplayView(); };
  const retryPhysics = () => {
    setPhysicsStatus('loading');
    void preparePhysicsRuntime().then(() => setPhysicsStatus('ready')).catch((error: unknown) => {
      console.error('Não foi possível iniciar a física da cidade.', error);
      setPhysicsStatus('error');
    });
  };
  const storyNext = () => { if (storyIndex >= 2) finishStory(); else setStoryIndex((index) => index + 1); };
  const save = () => { saveGame(); setHasSave(true); };
  const acceptQuest = (id: QuestId) => {
    const store = useGameStore.getState();
    store.acceptQuest(id);
    if (id === 'contracts' && store.missionPhase === 'available') {
      if (store.quests.find((quest) => quest.id === id)?.status === 'available') store.advanceQuest(id);
      store.beginMission();
      store.showCharacterDialogue('Inspetora Helena', 'Temos contratos públicos desviados no distrito industrial. Localize a pasta e recupere as provas.');
    }
    if (store.showQuestBoard) store.toggleQuestBoard();
  };
  const toggleAudio = () => { const next = !useGameStore.getState().audioEnabled; useGameStore.setState({ audioEnabled: next }); setAudioEnabled(next); if (next) unlockAudio(); };
  const openSettings = () => { settingsReturn.current = screen === 'pause' ? 'pause' : 'title'; setScreen('settings'); };
  const goBack = () => setScreen(screen === 'settings' ? settingsReturn.current : 'title');
  const resume = () => { setScreen('game'); enterGameplayView(); };
  const returnToTitle = () => { save(); setGameStarted(false); setScreen('title'); exitGameplayView(); };
  const closeCharacterDialogue = () => { useGameStore.getState().closeCharacterDialogue(); if (inGame && !dialogue && !donating && navigator.maxTouchPoints === 0) document.body.requestPointerLock?.(); };

  return <main className="game-shell">
    <Canvas shadows camera={{ position: [0, 5, 12], fov: 58, near: 0.1, far: 520 }} dpr={[1, 1.2]} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.shadowMap.enabled = true; gl.shadowMap.type = PCFSoftShadowMap; }}>
      {sceneLive ? <Suspense fallback={<LoadingBackdrop />}><GameScene enabled={inGame && !dialogue && !donating && !characterDialogue && !showQuestBoard} onInteract={() => { setDialogue(true); document.exitPointerLock?.(); }} /></Suspense> : <TitleBackdrop />}
      <GraphicsQuality />
    </Canvas>
    {inGame && <HUD onDonate={() => { setDonating(true); document.exitPointerLock?.(); }} onMissionStart={() => acceptQuest('contracts')} onAcceptQuest={acceptQuest}
      onPause={() => { setScreen('pause'); document.exitPointerLock?.(); }} onToggleCamera={() => useGameStore.getState().toggleCamera()} />}
    {inGame && !dialogue && !donating && !characterDialogue && !showQuestBoard && <MobileControls />}
    {screen !== 'game' && <MainMenu page={screen} storyIndex={storyIndex} hasSave={hasSave} soundEnabled={audioEnabled} cameraMode={cameraMode} controllerName={controllerName} timeOfDay={timeOfDay} weather={weather}
      physicsStatus={physicsStatus} onRetryPhysics={retryPhysics} onNewGame={startNewGame} onStoryStart={startStory} onContinue={continueGame} onCredits={() => setScreen('credits')} onSettings={openSettings} onOnline={() => setScreen('online')} onBack={goBack} onCast={() => setScreen('cast')}
      onStoryNext={storyNext} onStorySkip={finishStory} onToggleSound={toggleAudio} onToggleCamera={() => useGameStore.getState().toggleCamera()} onToggleTime={() => useGameStore.getState().toggleTimeOfDay()} onToggleWeather={() => useGameStore.getState().toggleWeather()}
      onPauseResume={resume} onPauseSave={save} onReturnTitle={returnToTitle} />}
    {inGame && dialogue && <BribeDialogue offer={offer} onClose={() => { setDialogue(false); if (!donating && !characterDialogue) document.body.requestPointerLock?.(); }} />}
    {inGame && characterDialogue && <CharacterDialogue onClose={closeCharacterDialogue} />}
    {inGame && donating && <DonationDialog onClose={() => { setDonating(false); if (!dialogue && !characterDialogue) document.body.requestPointerLock?.(); }} />}
    <Suspense fallback={null}>{(inGame || screen === 'pause') && <MultiplayerOverlay active />}</Suspense>
    {inGame && !driving && <AimReticle />}
    <div className="vignette" />
  </main>;
}
