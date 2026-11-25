import { useGameStore } from '../state';
import type { AlertLevel } from '../state/slices/alertSlice';
import type { MissionPhase } from '../state/slices/missionSlice';
import { QUESTS, type QuestProgress, type QuestId } from '../state/slices/questSlice';

const SAVE_KEY = 'faz-o-l-save-v2';
const LEGACY_KEY = 'faz-o-l-save-v1';
type SaveData = {
  version: 2; corruption: number; legalAssets: number; suspiciousAssets: number; reputation: number;
  alertLevel: number; playerHealth: number; playerArmor: number; playerAmmo: number; playerPosition: [number, number];
  missionPhase: MissionPhase; missionText: string; enemiesRemaining: number; cameraMode: 'first' | 'third'; audioEnabled: boolean; timeOfDay: 'day' | 'night'; weather: 'clear' | 'rain';
  quests: QuestProgress[]; trackedQuestId: QuestId | null;
};

export function saveGame() {
  const state = useGameStore.getState();
  const data: SaveData = {
    version: 2, corruption: state.corruption, legalAssets: state.legalAssets, suspiciousAssets: state.suspiciousAssets,
    reputation: state.reputation, alertLevel: state.alertLevel, playerHealth: state.playerHealth, playerArmor: state.playerArmor, playerAmmo: state.playerAmmo,
    playerPosition: state.playerPosition, missionPhase: state.missionPhase, missionText: state.missionText,
    enemiesRemaining: state.enemiesRemaining, cameraMode: state.cameraMode, audioEnabled: state.audioEnabled, timeOfDay: state.timeOfDay, weather: state.weather,
    quests: state.quests, trackedQuestId: state.trackedQuestId,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Omit<Partial<SaveData>, 'version'> & { version?: number; alertLevel?: number };
    const finite = (...values: unknown[]) => values.every((value) => typeof value === 'number' && Number.isFinite(value));
    if (data.version === 1) {
      if (!finite(data.corruption, data.legalAssets, data.suspiciousAssets, data.alertLevel)) return false;
      useGameStore.setState({ corruption: data.corruption!, legalAssets: data.legalAssets!, suspiciousAssets: data.suspiciousAssets!, alertLevel: data.alertLevel as AlertLevel });
      return true;
    }
    if (data.version !== 2 || !finite(data.corruption, data.legalAssets, data.suspiciousAssets, data.reputation, data.alertLevel, data.playerHealth, data.playerAmmo, data.enemiesRemaining) ||
      (data.playerArmor !== undefined && !finite(data.playerArmor)) ||
      !Array.isArray(data.playerPosition) || data.playerPosition.length !== 2 || !finite(...data.playerPosition) ||
      !['available', 'evidence', 'shootout', 'complete'].includes(data.missionPhase ?? '') || !['first', 'third'].includes(data.cameraMode ?? '') || typeof data.audioEnabled !== 'boolean' ||
      (data.timeOfDay !== undefined && !['day', 'night'].includes(data.timeOfDay)) || (data.weather !== undefined && !['clear', 'rain'].includes(data.weather))) return false;
    const store = useGameStore.getState();
    useGameStore.setState({
      corruption: Math.min(100, Math.max(0, data.corruption!)), legalAssets: Math.max(0, data.legalAssets!),
      suspiciousAssets: Math.max(0, data.suspiciousAssets!), reputation: Math.min(100, Math.max(0, data.reputation!)),
      alertLevel: Math.min(5, Math.max(0, data.alertLevel!)) as AlertLevel,
      playerHealth: Math.min(100, Math.max(0, data.playerHealth!)), playerAmmo: Math.min(12, Math.max(0, data.playerAmmo!)),
      missionPhase: data.missionPhase!, missionText: data.missionText ?? store.missionText, enemiesRemaining: Math.max(0, data.enemiesRemaining!),
      cameraMode: data.cameraMode!, audioEnabled: data.audioEnabled, timeOfDay: data.timeOfDay ?? 'day', weather: data.weather ?? 'clear', playerArmor: Math.max(0, Math.min(100, data.playerArmor ?? 100)), isDriving: false,
    });
    if (Array.isArray(data.quests)) {
      const safeQuests: QuestProgress[] = data.quests.flatMap((entry) => {
        if (!entry || !QUESTS.some((quest) => quest.id === entry.id) || !['available', 'active', 'complete'].includes(entry.status) || !Number.isFinite(entry.progress)) return [];
        const definition = QUESTS.find((quest) => quest.id === entry.id)!;
        return [{ id: entry.id, status: entry.status, progress: Math.max(0, Math.min(definition.steps.length, Math.floor(entry.progress))) } as QuestProgress];
      });
      const tracked = QUESTS.some((quest) => quest.id === data.trackedQuestId) ? data.trackedQuestId as QuestId : null;
      useGameStore.getState().restoreQuestState(safeQuests, tracked);
    } else if (data.missionPhase !== 'available') {
      const store = useGameStore.getState(); store.acceptQuest('contracts'); store.trackQuest('contracts'); store.setQuestProgress('contracts', data.missionPhase === 'complete' ? 3 : data.missionPhase === 'shootout' ? 2 : 1);
    }
    useGameStore.getState().restorePlayerAt(data.playerPosition![0], data.playerPosition![1]);
    return true;
  } catch { return false; }
}
