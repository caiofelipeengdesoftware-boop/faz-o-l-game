export type ControllerProfile = 'auto' | 'xbox' | 'playstation';
export type ControllerSettings = { profile: ControllerProfile; deadzone: number; sensitivity: number; mouseSensitivity: number; graphicsQuality: 'performance' | 'balanced' | 'quality'; invertY: boolean };
const KEY = 'faz-o-l-controller-settings-v1';
const DEFAULTS: ControllerSettings = { profile: 'auto', deadzone: 0.12, sensitivity: 1.4, mouseSensitivity: 1, graphicsQuality: 'balanced', invertY: false };
let settings = (() => {
  try {
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } as ControllerSettings : DEFAULTS;
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
