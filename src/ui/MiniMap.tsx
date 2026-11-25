import { EVIDENCE_POSITION } from '../world/MissionActors';
import { useGameStore } from '../state';

const streets = [-60, -30, 0, 30, 60];
const blocks = [-45, -15, 15, 45];
const mapX = (x: number) => 50 + x * 0.6;
const mapY = (z: number) => 50 + z * 0.6;

export function MiniMap() {
  const player = useGameStore((state) => state.playerPosition);
  const vehicle = useGameStore((state) => state.vehiclePosition);
  const phase = useGameStore((state) => state.missionPhase);
  const driving = useGameStore((state) => state.isDriving);
  const large = useGameStore((state) => state.showMap);
  const tracked = useGameStore((state) => state.trackedQuestId);
  const quests = useGameStore((state) => state.quests);
  const patrol = quests.find((quest) => quest.id === 'patrol');
  const patrolPoints: [number, number, number][] = [[-45, 0, -15], [0, 0, -45], [45, 0, 15]];
  const target = tracked === 'witness' ? [-8, 0, -25] as [number, number, number]
    : tracked === 'patrol' ? patrolPoints[Math.min(patrol?.progress ?? 0, patrolPoints.length - 1)]
      : phase === 'evidence' || phase === 'shootout' ? EVIDENCE_POSITION : [-11, 0, 10] as [number, number, number];
  const hasTarget = tracked ? Boolean(quests.find((quest) => quest.id === tracked && quest.status === 'active')) : phase !== 'complete';
  return <section className={`map-panel ${large ? 'map-large' : ''}`} aria-label="Mapa da cidade">
    <header><span>{large ? 'MAPA DA CIDADE' : 'AURORA'}</span><b>N ↑</b></header>
    <svg viewBox="0 0 100 100" role="img" aria-label="Mapa com ruas, jogador, veículo e objetivo">
      <rect width="100" height="100" fill="#252a26" />
      {blocks.flatMap((x) => blocks.map((z) => <rect key={`${x}-${z}`} x={mapX(x) - 6.6} y={mapY(z) - 6.6} width="13.2" height="13.2" rx="1.3" fill="#62685d" stroke="#7b806e" strokeWidth="0.35" />))}
      {streets.map((street) => <g key={street}>
        <line x1={mapX(street)} y1="0" x2={mapX(street)} y2="100" stroke="#99968a" strokeWidth="5" />
        <line x1="0" y1={mapY(street)} x2="100" y2={mapY(street)} stroke="#99968a" strokeWidth="5" />
        <line x1={mapX(street)} y1="0" x2={mapX(street)} y2="100" stroke="#d8c990" strokeWidth="0.35" strokeDasharray="2 2.3" />
        <line x1="0" y1={mapY(street)} x2="100" y2={mapY(street)} stroke="#d8c990" strokeWidth="0.35" strokeDasharray="2 2.3" />
      </g>)}
      {hasTarget && <line x1={mapX(player[0])} y1={mapY(player[1])} x2={mapX(target[0])} y2={mapY(target[2])} stroke="#e2c274" strokeWidth="0.7" strokeDasharray="2 2" opacity=".8" />}
      {hasTarget && <g transform={`translate(${mapX(target[0])} ${mapY(target[2])})`}><circle r="3.5" fill="#df6847" opacity=".22" /><circle r="1.8" fill="#f28c66" stroke="#f7d7a5" strokeWidth=".6" /></g>}
      <g transform={`translate(${mapX(-15)} ${mapY(8)})`}><circle r="2.4" fill="#d77fc5" stroke="#f2d8ec" strokeWidth=".55" /><text y=".85" textAnchor="middle" fontSize="2.2" fontWeight="700" fill="#211923">C</text></g>
      <g transform={`translate(${mapX(vehicle[0])} ${mapY(vehicle[1])})`}><rect x="-1.8" y="-2.7" width="3.6" height="5.4" rx="1.1" fill="#d7d5c9" stroke="#202625" strokeWidth=".7" /></g>
      <g transform={`translate(${mapX(player[0])} ${mapY(player[1])})`}><circle r="4" fill="#70c5ac" opacity=".28" /><circle r="1.7" fill={driving ? '#d7d5c9' : '#7ad2b8'} stroke="#eaf7e8" strokeWidth=".7" /></g>
      <g transform={`translate(${mapX(-11)} ${mapY(10)})`}><path d="M0 -2 L2 0 L0 2 L-2 0Z" fill="#e2c274" stroke="#1f211d" strokeWidth=".5" /></g>
    </svg>
    <footer><span><i className="legend-player" />Você</span><span><i className="legend-objective" />Objetivo</span><span>◉ Clube</span><span className="map-key">{large ? 'M fechar' : 'M mapa'}</span></footer>
  </section>;
}
