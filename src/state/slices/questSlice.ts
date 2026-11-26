import type { StateCreator } from 'zustand';
import type { GameStore } from '../index';

export type QuestId = 'contracts' | 'witness' | 'patrol' | 'chase';
export type QuestStatus = 'available' | 'active' | 'complete';
export type QuestProgress = { id: QuestId; status: QuestStatus; progress: number };
export const QUESTS: { id: QuestId; title: string; description: string; steps: string[]; reward: number; reputation: number; target: [number, number]; requires?: QuestId }[] = [
  { id: 'contracts', title: 'Contratos suspeitos', description: 'Encontre a pasta no depósito e recupere as provas.', steps: ['Aceitar a ocorrência', 'Investigar o depósito', 'Concluir o confronto'], reward: 700, reputation: 8, target: [45, -43] },
  { id: 'witness', title: 'Uma testemunha ouviu', description: 'Converse com Marina, na esquina da avenida central com a rua norte.', steps: ['Localizar Marina', 'Registrar o depoimento'], reward: 350, reputation: 5, target: [-5.4, -27] },
  { id: 'patrol', title: 'Ronda preventiva', description: 'Passe por três pontos do bairro para verificar a área.', steps: ['Visitar ponto 1', 'Visitar ponto 2', 'Visitar ponto 3'], reward: 500, reputation: 4, target: [-45, -15] },
  { id: 'chase', title: 'Perseguição: o mensageiro', description: 'Tavinho entregava as caixas do esquema. Alcance-o a pé antes que ele escape e faça-o falar.', steps: ['Encontrar Tavinho', 'Alcançar o fugitivo', 'Interrogar Tavinho'], reward: 900, reputation: 10, target: [35.4, -33], requires: 'witness' },
];
const INITIAL: QuestProgress[] = QUESTS.map(({ id }) => ({ id, status: 'available', progress: 0 }));

export interface QuestSlice {
  quests: QuestProgress[];
  trackedQuestId: QuestId | null;
  acceptQuest: (id: QuestId) => void;
  trackQuest: (id: QuestId | null) => void;
  advanceQuest: (id: QuestId) => void;
  setQuestProgress: (id: QuestId, progress: number) => void;
  restoreQuestState: (quests: QuestProgress[], tracked: QuestId | null) => void;
  resetQuests: () => void;
}

export const createQuestSlice: StateCreator<GameStore, [], [], QuestSlice> = (set, get) => ({
  quests: INITIAL.map((quest) => ({ ...quest })), trackedQuestId: null,
  acceptQuest: (id) => {
    const found = get().quests.find((quest) => quest.id === id);
    if (!found || found.status !== 'available') return;
    const required = QUESTS.find((quest) => quest.id === id)?.requires;
    if (required && get().quests.find((quest) => quest.id === required)?.status !== 'complete') return;
    set((state) => ({ quests: state.quests.map((quest) => quest.id === id ? { ...quest, status: 'active' } : quest), trackedQuestId: id }));
  },
  trackQuest: (id) => set((state) => ({ trackedQuestId: id && state.quests.some((quest) => quest.id === id && quest.status === 'active') ? id : null })),
  advanceQuest: (id) => {
    const progress = get().quests.find((quest) => quest.id === id);
    const config = QUESTS.find((quest) => quest.id === id);
    if (!progress || !config || progress.status !== 'active') return;
    const nextProgress = progress.progress + 1;
    const complete = nextProgress >= config.steps.length;
    set((state) => ({
      quests: state.quests.map((quest) => quest.id === id ? { ...quest, progress: nextProgress, status: complete ? 'complete' : 'active' } : quest),
      trackedQuestId: complete && state.trackedQuestId === id ? state.quests.find((quest) => quest.id !== id && quest.status === 'active')?.id ?? null : state.trackedQuestId,
      ...(complete ? { legalAssets: state.legalAssets + config.reward, reputation: Math.min(100, state.reputation + config.reputation) } : {}),
    }));
  },
  setQuestProgress: (id, progress) => set((state) => ({ quests: state.quests.map((quest) => quest.id === id && quest.status === 'active' ? { ...quest, progress: Math.max(0, Math.min(QUESTS.find((item) => item.id === id)?.steps.length ?? 0, progress)) } : quest) })),
  restoreQuestState: (quests, tracked) => set({ quests: INITIAL.map((base) => quests.find((saved) => saved.id === base.id) ?? { ...base }), trackedQuestId: tracked }),
  resetQuests: () => set({ quests: INITIAL.map((quest) => ({ ...quest })), trackedQuestId: null }),
});
