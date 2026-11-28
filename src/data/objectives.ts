import { EVIDENCE_POSITION } from '../world/MissionActors';
import { MANSION_GATE, MANSION_SAFE, STADIUM_GATE, TICKET_BOOTH } from './world';
import type { QuestProgress } from '../state/slices/questSlice';

type Snapshot = { quests: QuestProgress[]; trackedQuestId: string | null; missionPhase: string; chasePosition: [number, number] | null };
const PATROL: [number, number][] = [[-45, -15], [0, -45], [45, 15]];

/** Posição do objetivo de cada missão, usada pelo minimapa, mapa, bússola e rastreio. */
export function questObjective(id: string, s: Snapshot): [number, number] | null {
  const q = s.quests.find((item) => item.id === id); if (!q || q.status !== 'active') return null;
  switch (id) {
    case 'contracts': return s.missionPhase === 'evidence' || s.missionPhase === 'shootout' ? [EVIDENCE_POSITION[0], EVIDENCE_POSITION[2]] : [-11, 10];
    case 'witness': return [-5.4, -27];
    case 'patrol': return PATROL[Math.min(q.progress, PATROL.length - 1)];
    case 'chase': return s.chasePosition ?? [35.4, -33];
    case 'disguise': return [-49.55, -5.7];
    case 'stadium': return q.progress === 0 ? STADIUM_GATE : q.progress === 1 ? TICKET_BOOTH : [-5.4, 7];
    case 'mansion': return q.progress <= 0 ? MANSION_GATE : q.progress <= 2 ? MANSION_SAFE : [-100, 0];
    default: return null;
  }
}
export function currentObjective(s: Snapshot): [number, number] | null {
  if (s.trackedQuestId) { const tracked = questObjective(s.trackedQuestId, s); if (tracked) return tracked; }
  for (const q of [...s.quests].reverse()) { const target = questObjective(q.id, s); if (target) return target; }
  return s.missionPhase !== 'complete' ? [-11, 10] : null;
}
