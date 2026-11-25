import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';

const available = new Map<string, Promise<boolean>>();
function hasAsset(url: string) {
  let request = available.get(url);
  if (!request) {
    request = fetch(url, { method: 'HEAD' }).then((response) => response.ok && !response.headers.get('content-type')?.includes('text/html')).catch(() => false);
    available.set(url, request);
  }
  return request;
}

function Model({ url, scale = 1 }: { url: string; scale?: ThreeElements['group']['scale'] }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone(true)} scale={scale} />;
}

class AssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function OptionalGlb({ url, fallback, scale = 1, ...props }: { url: string; fallback: ReactNode; scale?: ThreeElements['group']['scale']; children?: ReactNode } & Omit<ThreeElements['group'], 'children' | 'scale'>) {
  const [found, setFound] = useState<boolean | null>(null);
  useEffect(() => { let current = true; void hasAsset(url).then((value) => { if (current) setFound(value); }); return () => { current = false; }; }, [url]);
  if (!found) return <group {...props}>{fallback}</group>;
  return <group {...props}><AssetBoundary key={url} fallback={fallback}><Suspense fallback={fallback}><Model url={url} scale={scale} /></Suspense></AssetBoundary></group>;
}
