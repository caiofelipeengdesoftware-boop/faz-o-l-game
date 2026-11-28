import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../state';
import { currentObjective } from '../data/objectives';
import { useMultiplayerStore } from '../multiplayer/Multiplayer';
import { BLOCK_CENTERS, MANSION_CENTER, POIS, SKIPPED_BLOCKS, STADIUM_CENTER, STREETS } from '../data/world';
import { terrainHeight } from '../world/Terrain';
import { POI_STYLE } from './MiniMap';

const X0 = -260; const Z0 = -140; const W = 520; const H = 280;
const PAL = { land: '#33265a', city: '#4a3b7c', block: '#5e4d97', road: '#a899e0', grass: '#2f5c63', hillLow: [66, 52, 112], hillHigh: [150, 138, 196], contour: 'rgba(210,200,255,.18)' };

/** Relevo sombreado (hillshade) calculado a partir da mesma função de altura do terreno 3D. */
let reliefCache: HTMLCanvasElement | null = null;
function relief() {
  if (reliefCache) return reliefCache;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const g = canvas.getContext('2d')!; const img = g.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = X0 + i; const z = Z0 + j; const h = terrainHeight(x, z);
    const gx = terrainHeight(x + 2, z) - terrainHeight(x - 2, z); const gz = terrainHeight(x, z + 2) - terrainHeight(x, z - 2);
    const shade = Math.min(1.35, Math.max(0.55, 0.95 + (-gx * 0.9 - gz * 0.7) * 0.07));
    const t = Math.min(1, Math.max(0, (h + 0.12) / 70)); const flat = h < 0.05;
    let r: number; let gg: number; let b: number;
    if (flat) { [r, gg, b] = [51, 38, 90]; } else { r = PAL.hillLow[0] + (PAL.hillHigh[0] - PAL.hillLow[0]) * t; gg = PAL.hillLow[1] + (PAL.hillHigh[1] - PAL.hillLow[1]) * t; b = PAL.hillLow[2] + (PAL.hillHigh[2] - PAL.hillLow[2]) * t; r *= shade; gg *= shade; b *= shade; if (h % 9 < 0.55) { r += 28; gg += 26; b += 40; } }
    const k = (j * W + i) * 4; img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); reliefCache = canvas; return canvas;
}

export function MapView() {
  const wrap = useRef<HTMLDivElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  const [pxz] = [useGameStore((state) => state.playerPosition)]; const [px, pz] = pxz;
  const vehicle = useGameStore((state) => state.vehiclePosition);
  const quests = useGameStore((state) => state.quests); const tracked = useGameStore((state) => state.trackedQuestId);
  const phase = useGameStore((state) => state.missionPhase); const chasePosition = useGameStore((state) => state.chasePosition);
  const waypoint = useGameStore((state) => state.waypoint); const trackedPlayerId = useGameStore((state) => state.trackedPlayerId);
  const players = useMultiplayerStore((state) => state.players);
  const objective = useMemo(() => currentObjective({ quests, trackedQuestId: tracked, missionPhase: phase, chasePosition }), [quests, tracked, phase, chasePosition]);
  const [view, setView] = useState({ x: px, z: pz, zoom: 1.15 }); const [pad, setPad] = useState(false); const [hover, setHover] = useState<string | null>(null);
  const viewRef = useRef(view); viewRef.current = view; const drag = useRef<{ x: number; z: number; moved: boolean } | null>(null); const frame = useRef(0);
  const [size, setSize] = useState({ w: 900, h: 460 });

  useEffect(() => { const el = wrap.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: Math.max(320, el.clientWidth), h: Math.max(240, el.clientHeight) })); ro.observe(el); return () => ro.disconnect(); }, []);
  const scale = (size.w / 300) * view.zoom;
  const toScreen = useCallback((x: number, z: number) => [size.w / 2 + (x - view.x) * scale, size.h / 2 + (z - view.z) * scale] as const, [size, view, scale]);
  const toWorld = useCallback((sx: number, sy: number) => [view.x + (sx - size.w / 2) / scale, view.z + (sy - size.h / 2) / scale] as const, [size, view, scale]);

  const draw = useCallback(() => {
    const el = canvas.current; if (!el) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = size.w * dpr; el.height = size.h * dpr; const g = el.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = PAL.land; g.fillRect(0, 0, size.w, size.h);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const [rx, rz] = toScreen(X0, Z0); g.drawImage(relief(), rx, rz, W * scale, H * scale);
    const rect = (x: number, z: number, w: number, d: number, color: string, radius = 0) => { const [sx, sy] = toScreen(x, z); g.fillStyle = color; if (radius && g.roundRect) { g.beginPath(); g.roundRect(sx, sy, w * scale, d * scale, radius * scale); g.fill(); } else g.fillRect(sx, sy, w * scale, d * scale); };
    rect(-84, -84, 168, 168, PAL.city);
    rect(84, -90, 150, 180, PAL.grass); rect(-234, -90, 150, 180, PAL.grass); rect(-84, -90, 0, 0, PAL.grass);
    for (const s of STREETS) { rect(s - 6, -84, 12, 168, PAL.road); rect(-84, s - 6, 168, 12, PAL.road); }
    rect(84, -6, 28, 12, PAL.road); rect(-112, -6, 28, 12, PAL.road);
    for (const x of BLOCK_CENTERS) for (const z of BLOCK_CENTERS) if (!SKIPPED_BLOCKS.some(([a, b]) => a === x && b === z)) rect(x - 8.3, z - 8.3, 16.6, 16.6, PAL.block, 1.4);
    rect(-24, 6.8, 18, 16, '#6f86c8', 1.4); rect(36, -54, 18, 18, '#a67c57', 1.4);
    { const [sx, sy] = toScreen(STADIUM_CENTER[0], STADIUM_CENTER[1]); g.fillStyle = '#b3414a'; g.beginPath(); g.ellipse(sx, sy, 52 * scale, 34 * scale, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4c9a46'; g.fillRect(sx - 30 * scale, sy - 19 * scale, 60 * scale, 38 * scale); g.strokeStyle = '#f2f2e8'; g.lineWidth = Math.max(1, scale * 0.5); g.strokeRect(sx - 30 * scale, sy - 19 * scale, 60 * scale, 38 * scale); g.beginPath(); g.arc(sx, sy, 6 * scale, 0, Math.PI * 2); g.stroke(); }
    { rect(MANSION_CENTER[0] - 20, MANSION_CENTER[1] - 32, 62, 64, '#3f7a47', 3); rect(MANSION_CENTER[0] - 16, MANSION_CENTER[1] - 20, 14, 40, '#e0d2b0'); rect(MANSION_CENTER[0] - 4, MANSION_CENTER[1] - 22, 22, 9, '#e0d2b0'); rect(MANSION_CENTER[0] - 4, MANSION_CENTER[1] + 13, 22, 9, '#e0d2b0'); const [fx, fy] = toScreen(MANSION_CENTER[0] + 13, MANSION_CENTER[1]); g.fillStyle = '#6ec6e6'; g.beginPath(); g.arc(fx, fy, 4 * scale, 0, Math.PI * 2); g.fill(); }
    const icon = (x: number, z: number, color: string, glyph: string, label?: string, r = 11) => {
      const [sx, sy] = toScreen(x, z); if (sx < -20 || sy < -20 || sx > size.w + 20 || sy > size.h + 20) return;
      g.fillStyle = color; g.strokeStyle = '#120d24'; g.lineWidth = 2; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#120d24'; g.font = `700 ${r}px "DM Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(glyph, sx, sy + 1);
      if (label) { g.font = '600 11px "DM Sans", sans-serif'; g.lineWidth = 3; g.strokeStyle = '#120d24'; g.strokeText(label, sx, sy + r + 11); g.fillStyle = '#f4efe0'; g.fillText(label, sx, sy + r + 11); }
    };
    for (const poi of POIS) { const st = POI_STYLE[poi.kind]; icon(poi.x, poi.z, st.color, st.glyph, view.zoom > 1.1 || hover === poi.id ? poi.label : undefined, hover === poi.id ? 13 : 11); }
    if (objective) icon(objective[0], objective[1], '#f28c66', '!', 'Objetivo', 12);
    if (waypoint) { const [sx, sy] = toScreen(waypoint[0], waypoint[1]); g.fillStyle = '#7ad2b8'; g.strokeStyle = '#120d24'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 9, sy - 20); g.lineTo(sx + 9, sy - 20); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(sx, sy - 24, 8, 0, Math.PI * 2); g.fill(); g.stroke(); }
    for (const player of players) icon(player.x, player.z, trackedPlayerId === player.id ? '#ffe28a' : '#8ee3bd', player.name.slice(0, 1).toUpperCase(), player.name, trackedPlayerId === player.id ? 13 : 11);
    { const [sx, sy] = toScreen(vehicle[0], vehicle[1]); g.fillStyle = '#d7d5c9'; g.fillRect(sx - 4, sy - 6, 8, 12); }
    { const [sx, sy] = toScreen(px, pz); g.fillStyle = 'rgba(122,210,184,.28)'; g.beginPath(); g.arc(sx, sy, 16, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7ad2b8'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(sx, sy, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (pad) { g.strokeStyle = '#ffe28a'; g.lineWidth = 2; g.beginPath(); g.moveTo(size.w / 2 - 14, size.h / 2); g.lineTo(size.w / 2 + 14, size.h / 2); g.moveTo(size.w / 2, size.h / 2 - 14); g.lineTo(size.w / 2, size.h / 2 + 14); g.stroke(); }
  }, [size, scale, toScreen, view.zoom, hover, objective, waypoint, players, trackedPlayerId, vehicle, px, pz, pad]);
  useEffect(() => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame.current); }, [draw]);

  const clampView = (v: { x: number; z: number; zoom: number }) => ({ zoom: Math.min(5, Math.max(0.7, v.zoom)), x: Math.min(250, Math.max(-250, v.x)), z: Math.min(130, Math.max(-130, v.z)) });
  const place = (sx: number, sy: number) => { const [x, z] = toWorld(sx, sy); useGameStore.getState().setWaypoint([Math.round(x), Math.round(z)]); };
  useEffect(() => {
    const onMove = (event: Event) => { setPad(true); const { x, y } = (event as CustomEvent).detail; setView((v) => clampView({ ...v, x: v.x + x * 2.6 / v.zoom, z: v.z + y * 2.6 / v.zoom })); };
    const onZoom = (event: Event) => { const d = (event as CustomEvent).detail as number; setView((v) => clampView({ ...v, zoom: v.zoom * (1 + d * 0.035) })); };
    const onConfirm = () => { const v = viewRef.current; useGameStore.getState().setWaypoint([Math.round(v.x), Math.round(v.z)]); };
    const onAction = (event: Event) => { const d = (event as CustomEvent).detail; if (d === 'x') useGameStore.getState().setWaypoint(null); if (d === 'y') setView((v) => ({ ...v, x: px, z: pz })); };
    window.addEventListener('pad:move', onMove); window.addEventListener('pad:zoom', onZoom); window.addEventListener('pad:confirm', onConfirm); window.addEventListener('pad:action', onAction);
    return () => { window.removeEventListener('pad:move', onMove); window.removeEventListener('pad:zoom', onZoom); window.removeEventListener('pad:confirm', onConfirm); window.removeEventListener('pad:action', onAction); };
  }, [px, pz]);

  const rows = [...POIS.map((poi) => ({ id: poi.id, label: poi.label, x: poi.x, z: poi.z, kind: poi.kind })), ...players.map((p) => ({ id: p.id, label: `${p.name} (amigo)`, x: p.x, z: p.z, kind: 'friend' }))];
  const focusOn = (x: number, z: number) => setView((v) => clampView({ ...v, x, z, zoom: Math.max(v.zoom, 2.2) }));
  return <div className="map-view">
    <div className="map-stage" ref={wrap}>
      <div className="map-canvas-wrap" tabIndex={0} data-pad-focus data-pad-capture data-pad-default aria-label="Mapa. Use o direcional para mover, gatilhos para zoom, A para marcar, X para remover, Y para centralizar">
        <canvas ref={canvas} style={{ width: size.w, height: size.h }}
          onWheel={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const [wx, wz] = toWorld(event.clientX - rect.left, event.clientY - rect.top); const zoom = Math.min(5, Math.max(0.7, view.zoom * (event.deltaY < 0 ? 1.12 : 0.89))); const k = view.zoom / zoom; setView(clampView({ zoom, x: wx + (view.x - wx) * k, z: wz + (view.z - wz) * k })); }}
          onPointerDown={(event) => { setPad(false); drag.current = { x: event.clientX, z: event.clientY, moved: false }; (event.target as HTMLElement).setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect(); const d = drag.current;
            if (d) { const dx = event.clientX - d.x; const dz = event.clientY - d.z; if (Math.abs(dx) + Math.abs(dz) > 3) d.moved = true; if (d.moved) { d.x = event.clientX; d.z = event.clientY; setView((v) => clampView({ ...v, x: v.x - dx / scale, z: v.z - dz / scale })); } }
            const [wx, wz] = toWorld(event.clientX - rect.left, event.clientY - rect.top); const near = POIS.find((poi) => Math.hypot(poi.x - wx, poi.z - wz) * scale < 14); setHover(near?.id ?? null);
          }}
          onPointerUp={(event) => { const d = drag.current; drag.current = null; if (d && !d.moved) { const rect = event.currentTarget.getBoundingClientRect(); place(event.clientX - rect.left, event.clientY - rect.top); } }}
          onContextMenu={(event) => { event.preventDefault(); useGameStore.getState().setWaypoint(null); }} />
      </div>
      <div className="map-tools">
        <button onClick={() => setView((v) => clampView({ ...v, zoom: v.zoom * 1.25 }))} aria-label="Aproximar">+</button>
        <button onClick={() => setView((v) => clampView({ ...v, zoom: v.zoom / 1.25 }))} aria-label="Afastar">−</button>
        <button onClick={() => setView((v) => ({ ...v, x: px, z: pz }))} aria-label="Centralizar em mim">◎</button>
      </div>
      <div className="map-hint"><span>Clique: marcar destino</span><span>Botão direito/X: remover</span><span>Arrastar: mover</span><span>Roda/gatilhos: zoom</span></div>
    </div>
    <aside className="map-side"><h3>Locais e amigos</h3>
      <div className="map-list">{rows.map((row) => { const st = POI_STYLE[row.kind]; const dist = Math.round(Math.hypot(row.x - px, row.z - pz));
        return <div key={row.id} className="map-row" onMouseEnter={() => setHover(row.id)} onMouseLeave={() => setHover(null)}>
          <i style={{ background: st.color }}>{st.glyph}</i><div><b>{row.label}</b><small>{dist} m</small></div>
          <button onClick={() => focusOn(row.x, row.z)}>Ver</button><button onClick={() => { useGameStore.getState().setWaypoint([row.x, row.z]); if (row.kind === 'friend') useGameStore.getState().setTrackedPlayer(row.id); }}>Marcar</button>
        </div>; })}
      </div>
      {waypoint && <button className="map-clear" onClick={() => { useGameStore.getState().setWaypoint(null); useGameStore.getState().setTrackedPlayer(null); }}>Remover marcador ({Math.round(Math.hypot(waypoint[0] - px, waypoint[1] - pz))} m)</button>}
    </aside>
  </div>;
}
