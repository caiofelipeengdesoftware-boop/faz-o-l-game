import type { StateCreator } from 'zustand';
export type AlertLevel = 0 | 1 | 2 | 3 | 4 | 5;
export interface AlertSlice { alertLevel: AlertLevel; raiseAlert: (level: AlertLevel) => void; clearAlert: () => void; }
export const createAlertSlice: StateCreator<AlertSlice> = (set) => ({
  alertLevel: 0,
  raiseAlert: (level) => set((s) => ({ alertLevel: Math.max(s.alertLevel, level) as AlertLevel })),
  clearAlert: () => set({ alertLevel: 0 }),
});
