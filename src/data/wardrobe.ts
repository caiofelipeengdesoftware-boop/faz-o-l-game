import type { Hair, Outfit, PersonLook } from '../world/Person';
import { CAST } from './story';
import { DEFAULT_PROFILE } from '../state/slices/profileSlice';

export type WardrobeItem = { id: string; label: string; price: number; patch: Partial<PersonLook>; swatch?: string };
export type WardrobeCategory = { id: string; label: string; items: WardrobeItem[] };

const castPreset = (id: string, label: string): WardrobeItem => ({ id: `cast-${id}`, label, price: 150, patch: { ...CAST.find((member) => member.id === id)!.look } });
const color = (prefix: string, key: 'top' | 'bottom' | 'shoes' | 'hairColor' | 'skin', values: [string, string][]): WardrobeItem[] => values.map(([hex, label]) => ({ id: `${prefix}-${hex}`, label, price: 0, patch: { [key]: hex }, swatch: hex }));
const style = (hair: Hair, label: string, price = 30): WardrobeItem => ({ id: `hair-${hair}`, label, price, patch: { hair } });
const outfit = (kind: Outfit, label: string, price: number, extra: Partial<PersonLook> = {}): WardrobeItem => ({ id: `outfit-${kind}`, label, price, patch: { outfit: kind, ...extra } });

export const WARDROBE: WardrobeCategory[] = [
  { id: 'looks', label: 'Visuais prontos', items: [
    { id: 'uniforme', label: 'Uniforme da polícia', price: 0, patch: { ...DEFAULT_PROFILE.look } },
    { id: 'civil-azul', label: 'Casual azul', price: 90, patch: { outfit: 'casual', top: '#3f7a8c', bottom: '#2d333a', hair: 'short', badge: false, shortSleeves: true } },
    { id: 'civil-laranja', label: 'Casual laranja', price: 90, patch: { outfit: 'casual', top: '#c4623d', bottom: '#2d3a4a', hair: 'cap', hairColor: '#2b211c', badge: false, shortSleeves: true } },
    { id: 'moletom', label: 'Moletom escuro', price: 110, patch: { outfit: 'hoodie', top: '#2d3a4a', bottom: '#20262b', hair: 'beanie', hairColor: '#111', badge: false, shortSleeves: false } },
    { id: 'executivo', label: 'Terno executivo', price: 320, patch: { outfit: 'suit', top: '#2a2d33', bottom: '#202328', tie: '#c7a14b', hair: 'short', glasses: true, badge: false } },
    { id: 'tatico', label: 'Colete tático', price: 240, patch: { outfit: 'vest', top: '#2a3038', bottom: '#1d1f22', hair: 'cap', hairColor: '#15171a', badge: true } },
    { id: 'vestido', label: 'Vestido social', price: 180, patch: { outfit: 'dress', top: '#8a2f3c', bottom: '#222831', hair: 'long', build: 'female', badge: false } },
    castPreset('helena', 'Visual da Inspetora Helena'), castPreset('marina', 'Visual da Marina'), castPreset('carla', 'Visual da Carla'), castPreset('ze', 'Visual do Zé do Café'), castPreset('cambista', 'Visual do cambista'), castPreset('brandao', 'Visual do Secretário'),
  ] },
  { id: 'hair', label: 'Cabelo', items: [style('police-cap', 'Quepe da polícia', 0), style('short', 'Curto'), style('long', 'Longo'), style('bun', 'Coque'), style('curly', 'Cacheado'), style('cap', 'Boné'), style('beanie', 'Gorro'), style('none', 'Sem cabelo', 20),
    ...color('haircolor', 'hairColor', [['#15110f', 'Preto'], ['#2b211c', 'Castanho escuro'], ['#5b3a24', 'Castanho'], ['#8a6a3a', 'Loiro escuro'], ['#d3b46a', 'Loiro'], ['#a3a3a3', 'Grisalho'], ['#c4623d', 'Ruivo'], ['#e2873a', 'Laranja']])] },
  { id: 'outfit', label: 'Roupa', items: [outfit('uniform', 'Uniforme', 0, { badge: true }), outfit('casual', 'Casual', 60, { badge: false }), outfit('hoodie', 'Moletom', 80, { badge: false }), outfit('suit', 'Terno', 220, { badge: false, tie: '#c7a14b' }), outfit('vest', 'Colete tático', 160), outfit('dress', 'Vestido', 120, { badge: false }),
    { id: 'sleeves-short', label: 'Mangas curtas', price: 0, patch: { shortSleeves: true } }, { id: 'sleeves-long', label: 'Mangas longas', price: 0, patch: { shortSleeves: false } },
    ...color('top', 'top', [['#1f3556', 'Azul-marinho'], ['#3f7a8c', 'Azul'], ['#c4623d', 'Laranja'], ['#c24d5a', 'Vermelho'], ['#586a54', 'Verde'], ['#6e627c', 'Roxo'], ['#d0d0c5', 'Branco'], ['#2a2d33', 'Grafite'], ['#c4a66f', 'Areia'], ['#8a2f3c', 'Vinho']])] },
  { id: 'bottom', label: 'Calça', items: color('bottom', 'bottom', [['#17263d', 'Azul-marinho'], ['#2d333a', 'Grafite'], ['#3b4252', 'Jeans'], ['#4a4034', 'Marrom'], ['#5a5f66', 'Cinza'], ['#202328', 'Preto'], ['#6b5a3a', 'Cáqui'], ['#8a2f3c', 'Vinho']]) },
  { id: 'shoes', label: 'Sapatos', items: color('shoes', 'shoes', [['#151719', 'Preto'], ['#4a3a2a', 'Marrom'], ['#e8e5de', 'Branco'], ['#c24d5a', 'Vermelho'], ['#3f7a8c', 'Azul']]) },
  { id: 'body', label: 'Corpo', items: [{ id: 'build-male', label: 'Corpo masculino', price: 0, patch: { build: 'male' } }, { id: 'build-female', label: 'Corpo feminino', price: 0, patch: { build: 'female' } },
    ...color('skin', 'skin', [['#f0c8a8', 'Pele clara'], ['#e3b48d', 'Pele média clara'], ['#d9a074', 'Pele morena clara'], ['#b97a55', 'Pele morena'], ['#8d5a3b', 'Pele negra clara'], ['#6b4430', 'Pele negra']])] },
  { id: 'extras', label: 'Acessórios', items: [{ id: 'glasses-on', label: 'Óculos', price: 60, patch: { glasses: true } }, { id: 'glasses-off', label: 'Sem óculos', price: 0, patch: { glasses: false } }, { id: 'backpack-on', label: 'Mochila', price: 70, patch: { backpack: true } }, { id: 'backpack-off', label: 'Sem mochila', price: 0, patch: { backpack: false } },
    { id: 'badge-on', label: 'Distintivo', price: 0, patch: { badge: true } }, { id: 'badge-off', label: 'Sem distintivo', price: 0, patch: { badge: false } }, { id: 'mask-on', label: 'Máscara', price: 40, patch: { mask: true } }, { id: 'mask-off', label: 'Sem máscara', price: 0, patch: { mask: false } },
    ...color('tie', 'top', []).slice(0, 0)] },
];
export const isCivilian = (look: PersonLook) => look.outfit !== 'uniform' && look.hair !== 'police-cap' && !look.badge;
