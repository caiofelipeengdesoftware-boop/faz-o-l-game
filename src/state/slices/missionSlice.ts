import type { StateCreator } from 'zustand';
import type { GameStore } from '../index';

export type MissionPhase = 'available' | 'evidence' | 'shootout' | 'complete';
export interface MissionSlice {
  missionPhase: MissionPhase;
  missionText: string;
  enemiesRemaining: number;
  beginMission: () => void;
  collectEvidence: () => void;
  defeatEnemy: () => void;
  resetMission: () => void;
}

export const createMissionSlice: StateCreator<GameStore, [], [], MissionSlice> = (set, get) => ({
  missionPhase: 'available',
  missionText: 'Fale com a inspetora na delegacia para receber uma missão.',
  enemiesRemaining: 0,
  beginMission: () => set({ missionPhase: 'evidence', missionText: 'Investigue o depósito no bairro industrial e recupere a pasta de contratos.', enemiesRemaining: 0 }),
  collectEvidence: () => set({ missionPhase: 'shootout', missionText: 'A facção chegou! Proteja-se e neutralize os quatro agressores.', enemiesRemaining: 4 }),
  defeatEnemy: () => {
    if (get().missionPhase !== 'shootout') return;
    const remaining = Math.max(0, get().enemiesRemaining - 1);
    set({ enemiesRemaining: remaining, ...(remaining === 0 ? { missionPhase: 'complete' as const, missionText: 'Missão concluída. As provas foram recuperadas.' } : {}) });
    if (remaining === 0) get().advanceQuest('contracts');
  },
  resetMission: () => set({ missionPhase: 'available', missionText: 'Fale com a inspetora na delegacia para receber uma missão.', enemiesRemaining: 0 }),
});
