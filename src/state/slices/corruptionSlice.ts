import type { StateCreator } from 'zustand';

export interface CorruptionSlice {
  corruption: number;
  legalAssets: number;
  suspiciousAssets: number;
  reputation: number;
  addBribe: (amount: number) => void;
  denounceBribe: () => void;
  applyOutcome: (corruption: number, assets: number, reputation: number) => void;
  resetCorruption: () => void;
}

export const createCorruptionSlice: StateCreator<CorruptionSlice> = (set) => ({
  corruption: 0,
  legalAssets: 1200,
  suspiciousAssets: 0,
  reputation: 50,
  addBribe: (amount) => set((s) => ({ corruption: Math.min(100, s.corruption + amount * 0.1), suspiciousAssets: s.suspiciousAssets + amount })),
  denounceBribe: () => set((s) => ({ corruption: Math.max(0, s.corruption - 5), reputation: Math.min(100, s.reputation + 5) })),
  applyOutcome: (corruption, assets, reputation) => set((s) => ({
    corruption: Math.max(0, Math.min(100, s.corruption + corruption)),
    suspiciousAssets: Math.max(0, s.suspiciousAssets + Math.max(0, assets)),
    legalAssets: Math.max(0, s.legalAssets + Math.min(0, assets)),
    reputation: Math.max(0, Math.min(100, s.reputation + reputation)),
  })),
  resetCorruption: () => set({ corruption: 0, suspiciousAssets: 0 }),
});
