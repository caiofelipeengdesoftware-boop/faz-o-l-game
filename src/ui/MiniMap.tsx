import { useMemo } from 'react';
import { useGameStore } from '../state';
import { currentObjective } from '../data/objectives';
import { useMultiplayerStore } from '../multiplayer/Multiplayer';
import { BLOCK_CENTERS, MANSION_CENTER, POIS, SKIPPED_BLOCKS, STADIUM_CENTER, STREETS } from '../data/world';

const SCALE = 0.62; const HALF = 46;
export const POI_STYLE: Record<string, { color: string; glyph: string }> = {
  police: { color: '#6ea3e0', glyph: 'P' }, club: { color: '#d77fc5', glyph: 'C' }, shop: { color: '#e2c274', glyph: '$' }, depot: { color: '#d98f4a', glyph: 'D' },
  cafe: { color: '#c4a66f', glyph: '☕' }, home: { color: '#7ad2b8', glyph: '⌂' }, stadium: { color: '#d9604a', glyph: 'E' }, mansion: { color: '#e8d9a8', glyph: 'M' }, friend: { color: '#8ee3bd', glyph: '●' },
};

/** Desenha ruas, quadras e distritos em metros do mundo. Usado pelo minimapa (em SVG). */
function WorldLayer() {
  return <g>
    <rect x={-250} y={-130} width={500} height={260} fill="#1f2b22" />
    <rect x={-84} y={-84} width={168} height={168} fill="#2c3230" />
    {STREETS.map((s) => <g key={s}><rect x={s - 6} y={-84} width={12} height={168} fill="#6d6e66" /><rect x={-84} y={s - 6} width={168} height={12} fill="#6d6e66" /></g>)}
    {[-1, 1].map((side) => <rect key={side} x={side > 0 ? 84 : -108} y={-6} width={24} height={12} fill="#6d6e66" />)}
    {BLOCK_CENTERS.flatMap((x) => BLOCK_CENTERS.map((z) => SKIPPED_BLOCKS.some(([a, b]) => a === x && b === z) ? null : <rect key={`${x}-${z}`} x={x - 8.3} y={z - 8.3} width={16.6} height={16.6} rx={1.4} fill="#4a4f49" />))}
    <rect x={-24} y={6.8} width={18} height={16} rx={1.4} fill="#4a5a76" /><rect x={36} y={-54} width={18} height={18} rx={1.4} fill="#6a5640" />
    <g transform={`translate(${STADIUM_CENTER[0]} ${STADIUM_CENTER[1]})`}><ellipse rx={52} ry={34} fill="#8a2e33" /><rect x={-30} y={-19} width={60} height={38} rx={3} fill="#3a7d35" /><rect x={-62} y={-14} width={4} height={28} fill="#6d6e66" /></g>
    <g transform={`translate(${MANSION_CENTER[0]} ${MANSION_CENTER[1]})`}><rect x={-20} y={-32} width={62} height={64} rx={3} fill="#34502f" /><rect x={-16} y={-20} width={14} height={40} fill="#c9b99a" /><rect x={-4} y={-22} width={22} height={9} fill="#c9b99a" /><rect x={-4} y={13} width={22} height={9} fill="#c9b99a" /><circle cx={13} cy={0} r={4} fill="#5aa9c4" /></g>
  </g>;
}

export function MiniMap() {
  const [px, pz] = useGameStore((state) => state.playerPosition);
  const vehicle = useGameStore((state) => state.vehiclePosition);
  const driving = useGameStore((state) => state.isDriving);
  const quests = useGameStore((state) => state.quests);
  const tracked = useGameStore((state) => state.trackedQuestId);
  const phase = useGameStore((state) => state.missionPhase);
  const chasePosition = useGameStore((state) => state.chasePosition);
  const waypoint = useGameStore((state) => state.waypoint);
  const trackedPlayerId = useGameStore((state) => state.trackedPlayerId);
  const players = useMultiplayerStore((state) => state.players);
  const speaking = useMultiplayerStore((state) => state.speaking);
  const objective = useMemo(() => currentObjective({ quests, trackedQuestId: tracked, missionPhase: phase, chasePosition }), [quests, tracked, phase, chasePosition]);
  const edge = (x: number, z: number) => { const dx = (x - px) * SCALE; const dz = (z - pz) * SCALE; const d = Math.hypot(dx, dz); const k = d > HALF ? HALF / d : 1; return { x: 50 + dx * k, y: 50 + dz * k, off: d > HALF, angle: Math.atan2(dz, dx) }; };
  const marker = (key: string, x: number, z: number, color: string, glyph: string, ring = false) => {
    const p = edge(x, z);
    return <g key={key} transform={`translate(${p.x} ${p.y})`}>{p.off && <path transform={`rotate(${(p.angle * 180) / Math.PI})`} d="M5 0 L2 -2 L2 2Z" fill={color} />}<circle r={ring ? 3.6 : 3} fill={color} stroke="#10140f" strokeWidth=".7" /><text y="1.1" textAnchor="middle" fontSize="3" fontWeight="700" fill="#10140f">{glyph}</text></g>;
  };
  return <section className="map-panel" aria-label="Minimapa">
    <header><span>AURORA</span><b>{waypoint ? `${Math.round(Math.hypot(waypoint[0] - px, waypoint[1] - pz))} m` : 'N ↑'}</b></header>
    <svg viewBox="0 0 100 100" role="img" aria-label="Minimapa com ruas, jogador, amigos e objetivo">
      <defs><clipPath id="mini-clip"><rect width="100" height="100" /></clipPath></defs>
      <g clipPath="url(#mini-clip)">
        <g transform={`translate(50 50) scale(${SCALE}) translate(${-px} ${-pz})`}><WorldLayer /></g>
        {POIS.map((poi) => { const p = edge(poi.x, poi.z); if (p.off) return null; const style = POI_STYLE[poi.kind]; return <g key={poi.id} transform={`translate(${p.x} ${p.y})`}><circle r="2.6" fill={style.color} stroke="#10140f" strokeWidth=".6" /><text y="1" textAnchor="middle" fontSize="2.6" fontWeight="700" fill="#10140f">{style.glyph}</text></g>; })}
        {objective && marker('objective', objective[0], objective[1], '#f28c66', '!', true)}
        {waypoint && marker('waypoint', waypoint[0], waypoint[1], '#7ad2b8', '◆', true)}
        {players.map((player) => marker(player.id, player.x, player.z, speaking.includes(player.id) ? '#b9ffd9' : trackedPlayerId === player.id ? '#ffe28a' : '#8ee3bd', player.name.slice(0, 1).toUpperCase(), trackedPlayerId === player.id))}
        <g transform={`translate(${edge(vehicle[0], vehicle[1]).x} ${edge(vehicle[0], vehicle[1]).y})`}><rect x="-1.6" y="-2.4" width="3.2" height="4.8" rx="1" fill="#d7d5c9" stroke="#202625" strokeWidth=".6" /></g>
        <g transform="translate(50 50)"><circle r="4.6" fill="#70c5ac" opacity=".28" /><circle r="2" fill={driving ? '#d7d5c9' : '#7ad2b8'} stroke="#eaf7e8" strokeWidth=".8" /></g>
      </g>
    </svg>
    <footer><span><i className="legend-player" />Você</span><span><i className="legend-objective" />Objetivo</span><span className="map-key">Menu: mapa completo</span></footer>
  </section>;
}
