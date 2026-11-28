import type { PersonLook } from '../world/Person';
import type { QuestId, QuestProgress } from '../state/slices/questSlice';

export type CastMember = {
  id: string; name: string; role: string; bio: string; accent: string;
  position?: [number, number]; facing?: number; look: PersonLook;
};

/** Elenco da história. Os personagens com `position` ficam parados na cidade e conversam com o jogador. */
export const CAST: CastMember[] = [
  { id: 'player', name: 'Você', role: 'Investigador novato', accent: '#7ad2b8', bio: 'Recém-chegado à equipe de Helena. Ainda não sabe em quem confiar, e cada escolha tem um preço.',
    look: { skin: '#c98d69', top: '#1f3556', bottom: '#17263d', outfit: 'uniform', hair: 'police-cap', badge: true } },
  { id: 'helena', name: 'Inspetora Helena', role: 'Chefe da investigação', accent: '#e2c274', bio: 'Meses seguindo o rastro do dinheiro público desviado. Dura, justa e cada vez mais isolada dentro da corporação.',
    look: { skin: '#8d5a3b', top: '#243447', bottom: '#1b2530', outfit: 'suit', hair: 'long', hairColor: '#1b1412', build: 'female', badge: true, tie: '#b9923a', scale: 0.98 } },
  { id: 'duarte', name: 'Sargento Duarte', role: 'Parceiro de plantão', accent: '#8fb3d9', bio: 'Veterano da base. Fala pouco, vê muito e é o único colega que Helena garante ser de confiança.', position: [-5.4, 7], facing: Math.PI / 2,
    look: { skin: '#c99673', top: '#1f3556', bottom: '#17263d', outfit: 'uniform', hair: 'police-cap', badge: true, scale: 1.05, width: 1.08 } },
  { id: 'marina', name: 'Marina', role: 'Testemunha', accent: '#e59a6b', bio: 'Moradora da avenida central. Viu caminhonetes descarregando caixas de madrugada e tem medo de falar.', position: [-5.4, -27], facing: Math.PI / 2,
    look: { skin: '#a06a46', top: '#c4623d', bottom: '#2d3a4a', hair: 'curly', hairColor: '#2a1a14', build: 'female', shortSleeves: true, scale: 0.97 } },
  { id: 'carla', name: 'Carla Mendes', role: 'Repórter', accent: '#d96b7c', bio: 'Cobre licitações da prefeitura há anos. Quer publicar tudo, mas só com prova na mão.', position: [5.4, -12], facing: -Math.PI / 2,
    look: { skin: '#e0b08a', top: '#8a2f3c', bottom: '#222831', outfit: 'suit', hair: 'bun', hairColor: '#5b3a24', build: 'female', glasses: true, scale: 0.98 } },
  { id: 'ze', name: 'Zé do Café', role: 'Informante', accent: '#c4a66f', bio: 'Dono do café da esquina. Escuta a cidade inteira passar pelo balcão e vende informação em troca de proteção.', position: [24.6, -21], facing: Math.PI / 2,
    look: { skin: '#d9a074', top: '#e8e2d2', bottom: '#4b4033', hair: 'cap', hairColor: '#7a2c24', shortSleeves: true, width: 1.12 } },
  { id: 'tavinho', name: 'Tavinho', role: 'Mensageiro do esquema', accent: '#6fb39b', bio: 'Rapaz das entregas. Levava as caixas do depósito sem saber o que carregava, ou fingindo não saber. Corre rápido.',
    look: { skin: '#b57a55', top: '#2d5a54', bottom: '#20262b', outfit: 'hoodie', hair: 'beanie', hairColor: '#e2873a', backpack: true, scale: 0.96 } },
  { id: 'ramos', name: 'Delegado Ramos', role: 'Chefe da delegacia', accent: '#b0b4ba', bio: 'Sorriso fácil, mãos limpas demais. Insiste em ficar com todos os arquivos do caso.', position: [-5.4, 17], facing: Math.PI / 2,
    look: { skin: '#d3a182', top: '#17263d', bottom: '#111a29', outfit: 'uniform', hair: 'police-cap', badge: true, glasses: true, width: 1.14 } },
  { id: 'brandao', name: 'Otávio Brandão', role: 'Secretário de Obras', accent: '#c7a14b', bio: 'Dono de metade dos contratos da cidade e de muitos favores. Sempre acompanhado, nunca pessoalmente envolvido.', position: [54.6, 24], facing: Math.PI / 2,
    look: { skin: '#d3a182', top: '#2a2d33', bottom: '#202328', outfit: 'suit', tie: '#c7a14b', hair: 'short', hairColor: '#a3a3a3', glasses: true, scale: 1.02 } },
  { id: 'cambista', name: 'Cambista', role: 'Vende ingressos e segredos', accent: '#d98f4a', bio: 'Revende ingressos na porta do estádio e entrega envelopes para quem paga. Nervoso com policiais.', position: [104, 3.6], facing: 0,
    look: { skin: '#b97a55', top: '#3b6b8c', bottom: '#2a2f36', hair: 'cap', hairColor: '#e2873a', shortSleeves: true, glasses: true, scale: 0.98 } },
  { id: 'guarda1', name: 'Segurança', role: 'Capanga do secretário', accent: '#8a8a8a', bio: 'Contratado para parecer discreto. Não consegue.', position: [-120.8, 4.4], facing: Math.PI / 2,
    look: { skin: '#a77a5b', top: '#14171a', bottom: '#14171a', outfit: 'suit', hair: 'none', glasses: true, scale: 1.08, width: 1.12 } },
  { id: 'guarda2', name: 'Segurança', role: 'Capanga do secretário', accent: '#8a8a8a', bio: 'O outro segurança. Tão discreto quanto o primeiro.', position: [-120.8, -4.4], facing: Math.PI / 2,
    look: { skin: '#e0b08a', top: '#14171a', bottom: '#14171a', outfit: 'suit', hair: 'short', hairColor: '#171717', scale: 1.06, width: 1.1 } },
];
export const lookOf = (id: string) => CAST.find((member) => member.id === id)!.look;

export const ENEMY_LOOKS: PersonLook[] = [
  { skin: '#a77a5b', top: '#2a2d30', bottom: '#1d1f22', outfit: 'vest', hair: 'none', mask: true, armed: true, scale: 1.03, width: 1.08 },
  { skin: '#d3a182', top: '#7a2c24', bottom: '#1f2226', outfit: 'hoodie', hair: 'beanie', hairColor: '#111', armed: true },
  { skin: '#8d5a3b', top: '#2a2d30', bottom: '#2c3138', outfit: 'vest', hair: 'cap', hairColor: '#15171a', glasses: true, armed: true, scale: 1.06 },
  { skin: '#c99673', top: '#33403a', bottom: '#1d1f22', outfit: 'vest', hair: 'short', hairColor: '#201a16', mask: true, armed: true, width: 1.12 },
];

type Snapshot = { quests: QuestProgress[]; missionPhase: string };
const status = (s: Snapshot, id: QuestId) => s.quests.find((quest) => quest.id === id)?.status ?? 'available';

/** Fala de cada personagem conforme o andamento da história. */
export function npcDialogue(id: string, s: Snapshot): { speaker: string; text: string } {
  const contracts = status(s, 'contracts'); const witness = status(s, 'witness'); const chase = status(s, 'chase');
  switch (id) {
    case 'duarte':
      if (chase === 'complete') return { speaker: 'Sargento Duarte', text: 'Com o depoimento do Tavinho dá para chegar ao Brandão. Mas cuidado: ele tem amigos aqui dentro, e alguns usam farda.' };
      if (contracts === 'complete') return { speaker: 'Sargento Duarte', text: 'O delegado Ramos pediu a pasta original. Ele nunca pede nada que já não tenha cópia. Guarde uma cópia sua, investigador.' };
      return { speaker: 'Sargento Duarte', text: 'Duarte, plantão da base. A inspetora precisa de alguém de confiança, e aqui dentro nem todo mundo é. Fale com ela primeiro.' };
    case 'marina':
      if (witness === 'complete') return { speaker: 'Marina', text: 'Obrigada por me ouvir. Se quiser o rapaz das entregas, Tavinho, procure perto do cruzamento da avenida leste. Ele corre muito. Não deixe escapar.' };
      return { speaker: 'Marina', text: 'Eu vi coisas na madrugada, mas tenho medo de falar. Se a inspetora mandar você, volte aqui. Aí eu conto tudo.' };
    case 'carla':
      if (chase === 'complete') return { speaker: 'Carla Mendes', text: 'Se o Tavinho confirmar em juízo, eu publico. Mas preciso de prova, não de boato. A cidade merece um nome, não um rumor.' };
      return { speaker: 'Carla Mendes', text: 'Carla Mendes, repórter. Cobri licitações da prefeitura por anos e todas passaram pela mesma empresa de fachada. Me avise quando tiver algo concreto.' };
    case 'ze':
      return { speaker: 'Zé do Café', text: 'Quem trabalha com café escuta tudo. Toda quinta o secretário Brandão almoça com o delegado Ramos. Ninguém paga a conta: ela já vem paga.' };
    case 'ramos':
      if (contracts === 'complete') return { speaker: 'Delegado Ramos', text: 'A pasta? Deixe comigo, eu cuido da papelada. Esses casos queimam carreiras, investigador. Não queime a sua.' };
      return { speaker: 'Delegado Ramos', text: 'Helena é dedicada, mas teimosa. Qualquer coisa que você encontrar, traga primeiro para mim. É o protocolo.' };
    case 'brandao':
      if (chase === 'complete') return { speaker: 'Otávio Brandão', text: 'Você tem coragem, investigador. Mas coragem não paga aluguel. Posso resolver muitos problemas seus. Pense com carinho.' };
      return { speaker: 'Otávio Brandão', text: 'Se tem denúncia, protocole na ouvidoria. A cidade precisa de quem constrói, não de quem inventa escândalo.' };
    case 'guarda1': case 'guarda2':
      return { speaker: 'Segurança', text: 'O secretário não recebe sem agendamento. Circulando.' };
    default: return { speaker: 'Morador', text: 'Boa tarde.' };
  }
}
