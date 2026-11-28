/** Dados do mundo compartilhados entre cidade, mapa, missões e minimapa. */
export const STREETS = [-60, -30, 0, 30, 60];
export const STADIUM_CENTER: [number, number] = [160, 0];
export const MANSION_CENTER: [number, number] = [-160, 0];
export const SHOP_DOOR: [number, number] = [-49.55, -5.7];
export const STADIUM_GATE: [number, number] = [108, 0];
export const MANSION_GATE: [number, number] = [-122, 0];
export const MANSION_SAFE: [number, number] = [-174.4, 0];
export const TICKET_BOOTH: [number, number] = [104, 7];
export const FLAT_X = 222; export const FLAT_Z = 92;
export const WORLD_X = 215; export const WORLD_Z = 90;
/** Faixas planas fora da cidade: estádio a leste, mansão a oeste. */
export const DISTRICTS = [
  { id: 'east', x0: 90, x1: 215, z0: -85, z1: 85 },
  { id: 'west', x0: -215, x1: -90, z0: -85, z1: 85 },
] as const;

export type PoiKind = 'police' | 'club' | 'shop' | 'depot' | 'cafe' | 'home' | 'stadium' | 'mansion' | 'friend';
export const POIS: { id: string; kind: PoiKind; label: string; x: number; z: number }[] = [
  { id: 'police', kind: 'police', label: 'Delegacia', x: -15, z: 15 },
  { id: 'club', kind: 'club', label: 'Club Aurora', x: -15, z: 8 },
  { id: 'shop', kind: 'shop', label: 'Aurora Style', x: SHOP_DOOR[0], z: SHOP_DOOR[1] },
  { id: 'depot', kind: 'depot', label: 'Depósito industrial', x: 45, z: -45 },
  { id: 'cafe', kind: 'cafe', label: 'Café do Zé', x: 24.6, z: -21 },
  { id: 'home', kind: 'home', label: 'Seu apartamento', x: -45, z: -37 },
  { id: 'stadium', kind: 'stadium', label: 'Estádio Aurora', x: 160, z: 0 },
  { id: 'mansion', kind: 'mansion', label: 'Mansão Brandão', x: -150, z: 0 },
  { id: 'brandao', kind: 'cafe', label: 'Secretário Brandão', x: 54.6, z: 24 },
];

/** Posições nas calçadas (borda do asfalto), sem cruzamentos, para árvores e postes. */
export function curbSlots(spacing: number, offset = 6.45, range = 76) {
  const slots: { x: number; z: number; along: 'x' | 'z'; side: 1 | -1 }[] = [];
  for (const line of STREETS) {
    for (let t = -range; t <= range; t += spacing) {
      if (STREETS.some((cross) => Math.abs(t - cross) < 8.5)) continue;
      for (const side of [-1, 1] as const) {
        slots.push({ x: line + side * offset, z: t, along: 'z', side });
        slots.push({ x: t, z: line + side * offset, along: 'x', side });
      }
    }
  }
  return slots;
}

export const BLOCK_CENTERS = [-45, -15, 15, 45];
export const SKIPPED_BLOCKS = [[-15, 15], [45, -45]];
