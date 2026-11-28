import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, BufferAttribute, BufferGeometry, Color, MathUtils, type Mesh, type MeshBasicMaterial, type Points, type PointsMaterial, type ShaderMaterial, type AmbientLight as AmbientLightType, type DirectionalLight as DirectionalLightType, type HemisphereLight as HemisphereLightType, type Group } from 'three';
import { useGameStore } from '../state';

const C = {
  zenithDay: new Color('#4f8fd0'), horizonDay: new Color('#cfe1ea'), zenithDusk: new Color('#3a4a7c'), horizonDusk: new Color('#f08d52'),
  zenithNight: new Color('#04060e'), horizonNight: new Color('#131b33'), zenithRain: new Color('#555e66'), horizonRain: new Color('#8a9298'),
  sunDay: new Color('#fff3dc'), sunDusk: new Color('#ff9a5a'), sunNight: new Color('#8fa6d8'),
  hemiDay: new Color('#c7d5dc'), hemiNight: new Color('#647596'), groundDay: new Color('#625849'), groundNight: new Color('#171b26'),
};
const skyVertex = 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const skyFragment = 'uniform vec3 top; uniform vec3 bottom; varying vec3 vDir; void main(){ float h = clamp(vDir.y * 1.25 + 0.08, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.65)), 1.0); }';

export function Atmosphere() {
  const sun = useRef<DirectionalLightType>(null); const hemi = useRef<HemisphereLightType>(null); const ambient = useRef<AmbientLightType>(null);
  const dome = useRef<Group>(null); const skyMaterial = useRef<ShaderMaterial>(null); const stars = useRef<Points>(null); const sunDisc = useRef<Mesh>(null); const moonDisc = useRef<Mesh>(null);
  const scene = useThree((state) => state.scene);
  const time = useGameStore((state) => state.timeOfDay);
  const weather = useGameStore((state) => state.weather);
  const factors = useRef({ night: time === 'night' ? 1 : 0, rain: weather === 'rain' ? 1 : 0 });
  const zenith = useRef(new Color()); const horizon = useRef(new Color()); const tint = useRef(new Color());
  const starGeometry = useMemo(() => {
    const count = 700; const positions = new Float32Array(count * 3); let seed = 7712;
    const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let i = 0; i < count; i++) { const theta = random() * Math.PI * 2; const y = 0.08 + random() * 0.92; const r = Math.sqrt(1 - y * y); positions.set([Math.cos(theta) * r * 440, y * 440, Math.sin(theta) * r * 440], i * 3); }
    const geo = new BufferGeometry(); geo.setAttribute('position', new BufferAttribute(positions, 3)); return geo;
  }, []);
  useEffect(() => { const target = sun.current?.target; if (!target) return; scene.add(target); return () => { scene.remove(target); }; }, [scene]);
  const uniforms = useMemo(() => ({ top: { value: new Color('#4f8fd0') }, bottom: { value: new Color('#cfe1ea') } }), []);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); const f = factors.current;
    f.night = MathUtils.damp(f.night, time === 'night' ? 1 : 0, 1.6, dt);
    f.rain = MathUtils.damp(f.rain, weather === 'rain' ? 1 : 0, 0.9, dt);
    const night = f.night; const rain = f.rain; const golden = Math.sin(Math.PI * night) ** 2 * (1 - rain * 0.7);
    zenith.current.copy(C.zenithDay).lerp(C.zenithNight, night).lerp(C.zenithDusk, golden * 0.8).lerp(C.zenithRain, rain * (1 - night * 0.65));
    horizon.current.copy(C.horizonDay).lerp(C.horizonNight, night).lerp(C.horizonDusk, golden).lerp(C.horizonRain, rain * (1 - night * 0.75));
    uniforms.top.value.copy(zenith.current); uniforms.bottom.value.copy(horizon.current);
    const dirY = MathUtils.lerp(52, 30, night); const dirX = MathUtils.lerp(28, -24, night);
    if (sun.current) {
      const [spx, spz] = useGameStore.getState().playerPosition;
      sun.current.target.position.set(spx, 0, spz); sun.current.target.updateMatrixWorld();
      sun.current.position.set(spx + dirX, dirY * (1 - golden * 0.45), spz + 17);
      sun.current.intensity = MathUtils.lerp(2.5, 0.34, night) * (1 - rain * 0.55);
      sun.current.color.copy(C.sunDay).lerp(C.sunNight, night).lerp(C.sunDusk, golden);
    }
    if (hemi.current) { hemi.current.intensity = MathUtils.lerp(1.15, 0.48, night) * (1 - rain * 0.18); hemi.current.color.copy(C.hemiDay).lerp(C.hemiNight, night); hemi.current.groundColor.copy(C.groundDay).lerp(C.groundNight, night); }
    if (ambient.current) ambient.current.intensity = MathUtils.lerp(0.48, 0.24, night);
    tint.current.copy(horizon.current);
    if (scene.background instanceof Color) scene.background.copy(tint.current);
    if (scene.fog) { scene.fog.color.copy(tint.current); (scene.fog as unknown as { density: number }).density = MathUtils.lerp(0.0019, 0.0027, night) + rain * 0.0024; }
    if (dome.current) dome.current.position.copy(state.camera.position);
    if (stars.current) { const material = stars.current.material as PointsMaterial; material.opacity = Math.max(0, night - 0.35) / 0.65 * (1 - rain); stars.current.visible = material.opacity > 0.02; }
    if (sunDisc.current) { sunDisc.current.position.set(dirX * 6.5, dirY * 6.5, 17 * 6.5); sunDisc.current.visible = night < 0.85 && rain < 0.75; (sunDisc.current.material as MeshBasicMaterial).color.copy(C.sunDay).lerp(C.sunDusk, golden); }
    if (moonDisc.current) { moonDisc.current.position.set(-dirX * 6.5 + 40, dirY * 5.5, -17 * 6.5); moonDisc.current.visible = night > 0.4 && rain < 0.8; }
  });
  return <>
    <hemisphereLight ref={hemi} args={['#c7d5dc', '#625849', 1.15]} />
    <ambientLight ref={ambient} intensity={0.48} />
    <directionalLight ref={sun} position={[28, 52, 17]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} shadow-camera-far={260} />
    <group ref={dome} renderOrder={-10}>
      <mesh renderOrder={-10}><sphereGeometry args={[470, 32, 18]} /><shaderMaterial ref={skyMaterial} side={BackSide} depthWrite={false} fog={false} uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment} /></mesh>
      <points ref={stars} geometry={starGeometry} renderOrder={-9}><pointsMaterial color="#ffffff" size={2.1} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} /></points>
      <mesh ref={sunDisc} renderOrder={-9}><sphereGeometry args={[16, 16, 12]} /><meshBasicMaterial color="#fff3dc" fog={false} depthWrite={false} /></mesh>
      <mesh ref={moonDisc} renderOrder={-9}><sphereGeometry args={[11, 16, 12]} /><meshBasicMaterial color="#e6ecff" fog={false} depthWrite={false} /></mesh>
    </group>
  </>;
}

export function Rain() {
  const group = useRef<Group>(null);
  const player = useGameStore((state) => state.playerPosition);
  const weather = useGameStore((state) => state.weather);
  const { geometry, data } = useMemo(() => {
    const count = 620; const positions = new Float32Array(count * 6);
    let seed = 48193; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let i = 0; i < count; i++) { const x = (random() - 0.5) * 56; const z = (random() - 0.5) * 56; const y = random() * 24; positions.set([x, y, z, x - 0.14, y - 0.9, z], i * 6); }
    const geo = new BufferGeometry(); geo.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry: geo, data: positions };
  }, []);
  useFrame((_, delta) => {
    if (!group.current || weather !== 'rain') return;
    group.current.position.set(player[0], 0, player[1]);
    for (let i = 0; i < data.length; i += 6) {
      data[i + 1] -= delta * 26; data[i + 4] -= delta * 26;
      if (data[i + 1] < 0) { const x = (Math.random() - 0.5) * 56; const z = (Math.random() - 0.5) * 56; const y = 22 + Math.random() * 5; data.set([x, y, z, x - 0.14, y - 0.9, z], i); }
    }
    (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  });
  return <group ref={group} visible={weather === 'rain'}><lineSegments geometry={geometry}><lineBasicMaterial color="#b5c6d7" transparent opacity={0.45} /></lineSegments></group>;
}
