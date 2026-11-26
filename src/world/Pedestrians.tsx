import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { setHint } from '../systems/hints';
import { useGameStore } from '../state';
import { newMotion, Person, type Hair, type Outfit, type PersonLook } from './Person';

const SKINS = ['#f0c8a8', '#d9a074', '#b97a55', '#8d5a3b', '#6b4430', '#e3b48d'];
const HAIRS = ['#2b211c', '#15110f', '#5b3a24', '#8a6a3a', '#a3a3a3', '#3a2a22'];
const TOPS = ['#b96545', '#6b8180', '#c4a66f', '#586a54', '#6e627c', '#d0d0c5', '#354b65', '#a38674', '#c24d5a', '#3f7a8c'];
const BOTTOMS = ['#2d333a', '#3b4252', '#4a4034', '#222831', '#5a5f66'];
const STYLES: Hair[] = ['short', 'long', 'curly', 'bun', 'cap', 'short', 'beanie', 'long'];
const OUTFITS: Outfit[] = ['casual', 'casual', 'hoodie', 'casual', 'dress', 'casual', 'hoodie', 'casual'];

/** Os pedestres andam pela borda do asfalto de cada rua, onde não há prédios nem trânsito. */
const WALKERS = [
  { axis: 'z', street: 0, side: 1, start: -40 }, { axis: 'z', street: 0, side: -1, start: 22 }, { axis: 'z', street: 30, side: -1, start: -10 },
  { axis: 'z', street: 30, side: 1, start: 35 }, { axis: 'z', street: -30, side: 1, start: 12 }, { axis: 'z', street: -30, side: -1, start: -35 },
  { axis: 'z', street: 60, side: -1, start: -5 }, { axis: 'z', street: -60, side: 1, start: 28 },
  { axis: 'x', street: 0, side: 1, start: -25 }, { axis: 'x', street: 0, side: -1, start: 40 }, { axis: 'x', street: 30, side: -1, start: 8 },
  { axis: 'x', street: -30, side: 1, start: -42 }, { axis: 'x', street: 60, side: 1, start: -18 }, { axis: 'x', street: -60, side: -1, start: 20 },
] as const;
const NAMES = ['Paulo', 'Dona Célia', 'Ravi', 'Lúcia', 'Davi', 'Nina', 'João', 'Marta', 'Beto', 'Elisa', 'Caio', 'Sônia', 'Rui', 'Bia'];
const LINES = [
  'Meu irmão trabalha no depósito. Esta semana, mandaram todo mundo ir embora mais cedo.',
  'Ouvi sirenes perto dos galpões ontem à noite. Depois disso, ninguém quis falar.',
  'Tem uma rua fechada perto do armazém. A polícia ainda não colocou uma placa.',
  'Um homem deixou uma pasta no balcão do café e saiu correndo. Não voltei a vê-lo.',
  'As obras da avenida foram pagas duas vezes, mas a rua continua cheia de buracos.',
  'Vi carros sem identificação entrando no galpão depois do fechamento.',
  'Os comerciantes do bairro estão recebendo ameaças. A gente só quer trabalhar em paz.',
  'Se encontrar alguma prova, não deixe ela desaparecer dentro de um gabinete.',
  'Aquela luz no depósito fica acesa até de madrugada, mesmo quando dizem que está vazio.',
  'Disseram que o secretário vai inaugurar outra obra. A anterior ainda nem terminou.',
  'Tem muito carro de luxo estacionado na frente da prefeitura ultimamente.',
  'Antigamente a gente confiava na polícia. Hoje a gente só espera.',
  'Se a água faltar de novo, vou direto ao jornal.',
  'Cuidado ao atravessar, tem moto passando rápido por aqui.',
];

function makeLook(index: number): PersonLook {
  const outfit = OUTFITS[index % OUTFITS.length];
  return {
    skin: SKINS[(index * 5 + 1) % SKINS.length], hair: STYLES[index % STYLES.length], hairColor: HAIRS[(index * 3) % HAIRS.length],
    top: TOPS[(index * 7 + 2) % TOPS.length], bottom: BOTTOMS[index % BOTTOMS.length], outfit, shortSleeves: index % 3 === 0,
    glasses: index % 5 === 2, scale: 0.92 + (index % 5) * 0.035, width: 0.94 + (index % 4) * 0.05,
  };
}

function Pedestrian({ index }: { index: number }) {
  const config = WALKERS[index];
  const root = useRef<Group>(null); const motion = useRef(newMotion());
  const look = useMemo(() => makeLook(index), [index]);
  const along = useRef<number>(config.start); const direction = useRef(index % 2 ? 1 : -1);
  const offset = config.side * 5.2; const speed = 1.15 + (index % 4) * 0.12;
  useFrame((_, delta) => {
    const group = root.current; if (!group || !gameInput.enabled) return;
    const dt = Math.min(delta, 0.05);
    along.current += direction.current * speed * dt;
    if (Math.abs(along.current) > 54) { direction.current *= -1; along.current = Math.sign(along.current) * 54; }
    const [px, pz] = useGameStore.getState().playerPosition;
    const x = config.axis === 'z' ? config.street + offset : along.current;
    const z = config.axis === 'z' ? along.current : config.street + offset;
    const near = Math.hypot(px - x, pz - z) < 2.6;
    // Pára e olha para o jogador quando ele chega perto, em vez de andar para dentro dele.
    motion.current.speed = near ? 0 : 1;
    if (!near) {
      group.position.set(x, 0, z);
      group.rotation.y = config.axis === 'z' ? (direction.current > 0 ? 0 : Math.PI) : (direction.current > 0 ? Math.PI / 2 : -Math.PI / 2);
    } else group.rotation.y = Math.atan2(px - group.position.x, pz - group.position.z);
    setHint(`ped-${index}`, near ? `Falar com ${NAMES[index]}` : null);
    if (near) {
      along.current -= direction.current * speed * dt;
      if (gameInput.interactPressed && consumeInteraction()) useGameStore.getState().showCharacterDialogue(NAMES[index], LINES[index]);
    }
  });
  return <group ref={root} position={[config.axis === 'z' ? config.street + offset : config.start, 0, config.axis === 'z' ? config.start : config.street + offset]}><Person look={look} motion={motion} /></group>;
}

export function Pedestrians() { return <>{WALKERS.map((_, index) => <Pedestrian key={index} index={index} />)}</>; }
