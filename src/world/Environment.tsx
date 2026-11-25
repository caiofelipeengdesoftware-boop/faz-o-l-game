import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, type AmbientLight as AmbientLightType, type DirectionalLight as DirectionalLightType, type HemisphereLight as HemisphereLightType, type Group } from 'three';
import { useGameStore } from '../state';

export function Atmosphere() {
  const sun = useRef<DirectionalLightType>(null); const hemi = useRef<HemisphereLightType>(null); const ambient = useRef<AmbientLightType>(null);
  const scene = useThree((state) => state.scene);
  const time = useGameStore((state) => state.timeOfDay);
  useFrame(() => {
    const night = time === 'night';
    if (sun.current) { sun.current.intensity = night ? 0.24 : 2.5; sun.current.position.set(night ? -24 : 28, night ? 28 : 52, 17); }
    if (hemi.current) { hemi.current.intensity = night ? 0.48 : 1.15; hemi.current.color.set(night ? '#647596' : '#c7d5dc'); hemi.current.groundColor.set(night ? '#171b26' : '#625849'); }
    if (ambient.current) ambient.current.intensity = night ? 0.24 : 0.48;
    const sky = night ? '#111a2a' : '#a8afa4';
    if (scene.background instanceof Color) scene.background.set(sky);
    if (scene.fog) scene.fog.color.set(sky);
  });
  return <>
    <hemisphereLight ref={hemi} args={['#c7d5dc', '#625849', 1.15]} />
    <ambientLight ref={ambient} intensity={0.48} />
    <directionalLight ref={sun} position={[28, 52, 17]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} />
  </>;
}

export function Rain() {
  const group = useRef<Group>(null);
  const player = useGameStore((state) => state.playerPosition);
  const weather = useGameStore((state) => state.weather);
  const { geometry, data } = useMemo(() => {
    const count = 340; const positions = new Float32Array(count * 6);
    let seed = 48193; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let i = 0; i < count; i++) { const x = (random() - 0.5) * 52; const z = (random() - 0.5) * 52; const y = random() * 24; positions.set([x, y, z, x - 0.12, y - 0.65, z], i * 6); }
    const geo = new BufferGeometry(); geo.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry: geo, data: positions };
  }, []);
  useFrame((_, delta) => {
    if (!group.current || weather !== 'rain') return;
    group.current.position.set(player[0], 0, player[1]);
    for (let i = 0; i < data.length; i += 6) {
      data[i + 1] -= delta * 22; data[i + 4] -= delta * 22;
      if (data[i + 1] < 0) { const x = (Math.random() - 0.5) * 52; const z = (Math.random() - 0.5) * 52; const y = 22 + Math.random() * 5; data.set([x, y, z, x - 0.12, y - 0.65, z], i); }
    }
    (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  });
  return <group ref={group} visible={weather === 'rain'}><lineSegments geometry={geometry}><lineBasicMaterial color="#b5c6d7" transparent opacity={0.4} /></lineSegments></group>;
}
