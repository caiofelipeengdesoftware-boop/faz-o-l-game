import type { StateCreator } from 'zustand';
import type { PersonLook } from '../../world/Person';

export type PlayerProfile = { name: string; look: PersonLook };
export const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Investigador',
  look: { skin: '#c98d69', top: '#1f3556', bottom: '#17263d', outfit: 'uniform', hair: 'police-cap', hairColor: '#2b211c', badge: true, build: 'male' },
};
export type Stats = { playSeconds: number; shotsFired: number; enemiesDown: number; arrests: number; deaths: number; distance: number; purchases: number };
export const EMPTY_STATS: Stats = { playSeconds: 0, shotsFired: 0, enemiesDown: 0, arrests: 0, deaths: 0, distance: 0, purchases: 0 };

export type ProfileSlice = {
  wallet: number; profile: PlayerProfile; stats: Stats; lastShotAt: number; ownedOutfits: string[];
  setProfile: (profile: PlayerProfile) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  addStat: (key: keyof Stats, amount?: number) => void;
  markShot: () => void;
  ownOutfit: (id: string) => void;
  restoreProfile: (data: Partial<Pick<ProfileSlice, 'wallet' | 'profile' | 'stats' | 'ownedOutfits'>>) => void;
  resetProfile: () => void;
};

export const createProfileSlice: StateCreator<ProfileSlice, [], [], ProfileSlice> = (set, get) => ({
  wallet: 1200, profile: DEFAULT_PROFILE, stats: EMPTY_STATS, lastShotAt: 0, ownedOutfits: ['uniforme'],
  setProfile: (profile) => set({ profile }),
  addMoney: (amount) => set((state) => ({ wallet: Math.max(0, state.wallet + amount) })),
  spendMoney: (amount) => { if (get().wallet < amount) return false; set((state) => ({ wallet: state.wallet - amount })); return true; },
  addStat: (key, amount = 1) => set((state) => ({ stats: { ...state.stats, [key]: state.stats[key] + amount } })),
  markShot: () => set((state) => ({ lastShotAt: performance.now(), stats: { ...state.stats, shotsFired: state.stats.shotsFired + 1 } })),
  ownOutfit: (id) => set((state) => state.ownedOutfits.includes(id) ? {} : { ownedOutfits: [...state.ownedOutfits, id] }),
  restoreProfile: (data) => set((state) => ({ wallet: data.wallet ?? state.wallet, profile: data.profile ?? state.profile, stats: { ...EMPTY_STATS, ...(data.stats ?? {}) }, ownedOutfits: data.ownedOutfits ?? state.ownedOutfits })),
  resetProfile: () => set((state) => ({ wallet: 1200, stats: EMPTY_STATS, ownedOutfits: ['uniforme'], profile: { ...DEFAULT_PROFILE, name: state.profile.name, look: state.profile.look } })),
});
