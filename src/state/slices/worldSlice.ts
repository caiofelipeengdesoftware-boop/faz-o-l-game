import type { StateCreator } from 'zustand';

export interface WorldSlice {
  playerPosition: [number, number];
  playerYaw: number;
  playerTeleport: number;
  vehiclePosition: [number, number];
  playerHealth: number;
  playerArmor: number;
  playerAmmo: number;
  controllerConnected: boolean;
  controllerName: string;
  isDriving: boolean;
  showMap: boolean;
  cameraMode: 'third' | 'first';
  audioEnabled: boolean;
  characterDialogue: { speaker: string; text: string } | null;
  pauseRequested: boolean;
  timeOfDay: 'day' | 'night';
  weather: 'clear' | 'rain';
  inputDevice: 'gamepad' | 'keyboardMouse';
  isInside: boolean;
  interiorKind: 'home' | 'club';
  showQuestBoard: boolean;
  isCrouched: boolean;
  headlightsOn: boolean;
  radioStation: number;
  setPlayerPosition: (x: number, z: number) => void;
  setPlayerYaw: (yaw: number) => void;
  restorePlayerAt: (x: number, z: number) => void;
  setVehiclePosition: (x: number, z: number) => void;
  setDriving: (driving: boolean) => void;
  setControllerConnected: (name: string) => void;
  toggleMap: () => void;
  toggleCamera: () => void;
  toggleAudio: () => void;
  showCharacterDialogue: (speaker: string, text: string) => void;
  closeCharacterDialogue: () => void;
  requestPause: () => void;
  clearPauseRequest: () => void;
  toggleTimeOfDay: () => void;
  toggleWeather: () => void;
  setInputDevice: (device: 'gamepad' | 'keyboardMouse') => void;
  enterInterior: (kind?: 'home' | 'club') => void;
  exitInterior: () => void;
  toggleQuestBoard: () => void;
  toggleCrouch: () => void;
  toggleHeadlights: () => void;
  cycleRadio: () => void;
  damagePlayer: (amount: number) => void;
  restorePlayer: () => void;
  spendAmmo: () => boolean;
  reloadAmmo: () => void;
}

export const createWorldSlice: StateCreator<WorldSlice> = (set, get) => ({
  playerPosition: [0, -8],
  playerYaw: 0,
  playerTeleport: 0,
  vehiclePosition: [0, -3],
  playerHealth: 100,
  playerArmor: 100,
  playerAmmo: 12,
  controllerConnected: false,
  controllerName: '',
  isDriving: false,
  showMap: false,
  cameraMode: 'third',
  audioEnabled: true,
  characterDialogue: null,
  pauseRequested: false,
  timeOfDay: 'day',
  weather: 'clear',
  inputDevice: 'keyboardMouse',
  isInside: false,
  interiorKind: 'home',
  showQuestBoard: false,
  isCrouched: false,
  headlightsOn: false,
  radioStation: 0,
  setPlayerPosition: (x, z) => set({ playerPosition: [x, z] }),
  setPlayerYaw: (playerYaw) => set({ playerYaw }),
  restorePlayerAt: (x, z) => set((state) => ({ playerPosition: [x, z], playerTeleport: state.playerTeleport + 1 })),
  setVehiclePosition: (x, z) => set({ vehiclePosition: [x, z] }),
  setDriving: (isDriving) => set({ isDriving }),
  setControllerConnected: (controllerName) => set({ controllerConnected: Boolean(controllerName), controllerName }),
  toggleMap: () => set((state) => ({ showMap: !state.showMap })),
  toggleCamera: () => set((state) => ({ cameraMode: state.cameraMode === 'third' ? 'first' : 'third' })),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  showCharacterDialogue: (speaker, text) => set({ characterDialogue: { speaker, text } }),
  closeCharacterDialogue: () => set({ characterDialogue: null }),
  requestPause: () => set({ pauseRequested: true }),
  clearPauseRequest: () => set({ pauseRequested: false }),
  toggleTimeOfDay: () => set((state) => ({ timeOfDay: state.timeOfDay === 'day' ? 'night' : 'day' })),
  toggleWeather: () => set((state) => ({ weather: state.weather === 'clear' ? 'rain' : 'clear' })),
  setInputDevice: (inputDevice) => set({ inputDevice }),
  enterInterior: (kind = 'home') => set((state) => ({ isInside: true, interiorKind: kind, playerPosition: [0, 0], playerTeleport: state.playerTeleport + 1 })),
  exitInterior: () => set((state) => ({ isInside: false, playerPosition: state.interiorKind === 'club' ? [-15, 11] : [-45, -37], playerTeleport: state.playerTeleport + 1 })),
  toggleQuestBoard: () => set((state) => ({ showQuestBoard: !state.showQuestBoard })),
  toggleCrouch: () => set((state) => ({ isCrouched: !state.isCrouched })),
  toggleHeadlights: () => set((state) => ({ headlightsOn: !state.headlightsOn })),
  cycleRadio: () => set((state) => ({ radioStation: (state.radioStation + 1) % 4 })),
  damagePlayer: (amount) => set((state) => { const absorbed = Math.min(state.playerArmor, amount); return { playerArmor: state.playerArmor - absorbed, playerHealth: Math.max(0, state.playerHealth - (amount - absorbed)) }; }),
  restorePlayer: () => set({ playerHealth: 100, playerArmor: 100 }),
  spendAmmo: () => {
    if (get().playerAmmo <= 0) return false;
    set((state) => ({ playerAmmo: state.playerAmmo - 1 }));
    return true;
  },
  reloadAmmo: () => set({ playerAmmo: 12 }),
});
