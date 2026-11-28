import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createCorruptionSlice, type CorruptionSlice } from './slices/corruptionSlice';
import { createAlertSlice, type AlertSlice } from './slices/alertSlice';
import { createWorldSlice, type WorldSlice } from './slices/worldSlice';
import { createMissionSlice, type MissionSlice } from './slices/missionSlice';
import { createQuestSlice, type QuestSlice } from './slices/questSlice';
import { createProfileSlice, type ProfileSlice } from './slices/profileSlice';

export type GameStore = CorruptionSlice & AlertSlice & WorldSlice & MissionSlice & QuestSlice & ProfileSlice;
export const useGameStore = create<GameStore>()(subscribeWithSelector((...args) => ({
  ...createCorruptionSlice(...args), ...createAlertSlice(...args), ...createWorldSlice(...args), ...createMissionSlice(...args), ...createQuestSlice(...args), ...createProfileSlice(...args),
})));
