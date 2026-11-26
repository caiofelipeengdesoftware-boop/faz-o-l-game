import { useEffect, useState } from 'react';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { getControllerSettings } from '../systems/controllerSettings';
import { useGameStore } from '../state';

/** Brilho suave nas luzes à noite e vinheta de cinema. Desligado no modo Desempenho (celulares). */
export function Effects() {
  const [quality, setQuality] = useState(getControllerSettings().graphicsQuality);
  const night = useGameStore((state) => state.timeOfDay === 'night');
  useEffect(() => {
    const onChange = (event: Event) => setQuality((event as CustomEvent).detail.graphicsQuality);
    window.addEventListener('faz:settings-change', onChange);
    return () => window.removeEventListener('faz:settings-change', onChange);
  }, []);
  if (quality === 'performance') return null;
  return <EffectComposer multisampling={quality === 'quality' ? 4 : 0}>
    <Bloom mipmapBlur intensity={night ? 0.85 : 0.3} luminanceThreshold={night ? 0.55 : 0.92} luminanceSmoothing={0.2} />
    <Vignette eskil={false} offset={0.28} darkness={0.55} />
  </EffectComposer>;
}
