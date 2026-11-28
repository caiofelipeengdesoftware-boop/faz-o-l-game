/** Falas especiais ligadas às missões: retorna true quando a conversa foi tratada pela missão. */
export const talkHandlers = new Map<string, () => boolean>();
export const ambush = { remaining: 0, done: false };
