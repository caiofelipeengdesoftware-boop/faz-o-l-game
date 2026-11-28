export type ControllerProfile = 'auto' | 'xbox' | 'playstation';
export type Bindings = { chat: string; voice: string; phone: string; padChat: number; padVoice: number; padPhone: number };
export const DEFAULT_BINDINGS: Bindings = { chat: 't', voice: 'v', phone: 'p', padChat: 13, padVoice: 15, padPhone: 14 };
export type ControllerSettings = { bindings: Bindings; profile: ControllerProfile; deadzone: number; sensitivity: number; mouseSensitivity: number; graphicsQuality: 'performance' | 'balanced' | 'quality'; invertY: boolean };
const KEY = 'faz-o-l-controller-settings-v1';
const DEFAULTS: ControllerSettings = { bindings: DEFAULT_BINDINGS, profile: 'auto', deadzone: 0.12, sensitivity: 1.4, mouseSensitivity: 1, graphicsQuality: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 'performance' : 'balanced', invertY: false };
let settings = (() => {
  try {
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
    if (!saved) return DEFAULTS; const parsed = JSON.parse(saved) as Partial<ControllerSettings>; return { ...DEFAULTS, ...parsed, bindings: { ...DEFAULT_BINDINGS, ...(parsed.bindings ?? {}) } } as ControllerSettings;
  } catch { return DEFAULTS; }
})();

export function getControllerSettings() { return settings; }
export function updateControllerSettings(patch: Partial<ControllerSettings>) {
  settings = { ...settings, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* local settings are optional */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('faz:settings-change', { detail: settings }));
  return settings;
}
export function getControllerLabel(name: string, profile = settings.profile) {
  if (profile !== 'auto') return profile === 'playstation' ? 'PlayStation' : 'Xbox / 8BitDo';
  const id = name.toLowerCase();
  if (/playstation|dualshock|dualsense|wireless controller|sony/i.test(id)) return 'PlayStation';
  if (/xbox|xinput|8bitdo.*x/i.test(id)) return 'Xbox / 8BitDo';
  return 'Controle padrão';
}

export function setBinding<K extends keyof Bindings>(key: K, value: Bindings[K]) { return updateControllerSettings({ bindings: { ...settings.bindings, [key]: value } }); }
export const KEY_LABELS: Record<string, string> = { ' ': 'Espaço', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', enter: 'Enter' };
export const keyLabel = (key: string) => KEY_LABELS[key] ?? key.toUpperCase();
export const PAD_LABELS: Record<number, string> = { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 8: 'View', 9: 'Menu', 10: 'L3', 11: 'R3', 12: '↑', 13: '↓', 14: '←', 15: '→' };
