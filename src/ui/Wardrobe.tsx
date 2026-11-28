import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../state';
import { WARDROBE, isCivilian, type WardrobeItem } from '../data/wardrobe';
import { Person, type PersonLook } from '../world/Person';

function Turntable({ look, spin }: { look: PersonLook; spin: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.4 + spin * 0.02; });
  return <group ref={ref}><Person look={look} /></group>;
}

/** Provador da loja: escolha cada peça, veja no boneco 3D girando e pague só pelo que for novo. */
export function Wardrobe() {
  const profile = useGameStore((state) => state.profile); const wallet = useGameStore((state) => state.wallet); const owned = useGameStore((state) => state.ownedOutfits);
  const [look, setLook] = useState<PersonLook>(profile.look); const [picked, setPicked] = useState<WardrobeItem[]>([]); const [categoryId, setCategoryId] = useState(WARDROBE[0].id); const [message, setMessage] = useState('');
  const category = WARDROBE.find((item) => item.id === categoryId)!;
  const cost = useMemo(() => picked.filter((item, index, list) => item.price > 0 && !owned.includes(item.id) && list.findIndex((other) => other.id === item.id) === index).reduce((sum, item) => sum + item.price, 0), [picked, owned]);
  const close = () => useGameStore.getState().setWardrobeOpen(false);
  const choose = (item: WardrobeItem) => { setLook((current) => ({ ...current, ...item.patch })); setPicked((list) => [...list, item]); setMessage(''); };
  const buy = () => {
    const store = useGameStore.getState();
    if (cost > store.wallet) { setMessage(`Faltam R$ ${cost - store.wallet} para esse visual.`); return; }
    if (cost > 0) store.spendMoney(cost);
    for (const item of picked) store.ownOutfit(item.id);
    store.setProfile({ ...store.profile, look }); if (cost > 0) store.addStat('purchases', picked.length);
    if (isCivilian(look)) { for (let i = 0; i < 3; i++) { const q = useGameStore.getState().quests.find((item) => item.id === 'disguise'); if (q?.status === 'active' && q.progress < 2) useGameStore.getState().advanceQuest('disguise'); } }
    store.showNotice(isCivilian(look) ? 'Visual civil pronto. Ninguém vai te reconhecer como policial.' : 'Visual atualizado.'); close();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    const onBack = () => close(); const onTab = (event: Event) => { const delta = (event as CustomEvent).detail as number; setCategoryId((id) => WARDROBE[(WARDROBE.findIndex((c) => c.id === id) + delta + WARDROBE.length) % WARDROBE.length].id); };
    window.addEventListener('keydown', onKey); window.addEventListener('pad:back', onBack); window.addEventListener('pad:tab', onTab);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pad:back', onBack); window.removeEventListener('pad:tab', onTab); };
  }, []);
  const active = (item: WardrobeItem) => Object.entries(item.patch).every(([key, value]) => (look as Record<string, unknown>)[key] === value);
  return <div className="wardrobe" data-pad-scope role="dialog" aria-label="Provador">
    <header><div><small>AURORA STYLE · PROVADOR</small><h2>Monte seu visual</h2></div><b>R$ {wallet.toLocaleString('pt-BR')}</b></header>
    <div className="wardrobe-grid">
      <nav>{WARDROBE.map((item) => <button key={item.id} className={item.id === categoryId ? 'is-active' : ''} onClick={() => setCategoryId(item.id)} data-pad-default={item.id === categoryId ? '' : undefined}>{item.label}</button>)}<small>LB / RB troca de categoria</small></nav>
      <div className="wardrobe-preview"><Canvas camera={{ position: [0, 1.0, 4.2], fov: 30 }} dpr={[1, 1.5]} onCreated={({ camera }) => camera.lookAt(0, 0.92, 0)}>
        <color attach="background" args={['#1a1030']} /><hemisphereLight args={['#fbeaff', '#2a1844', 1.2]} /><directionalLight position={[3, 5, 4]} intensity={2.4} /><directionalLight position={[-3, 2, -3]} intensity={1} color="#ff9ad0" />
        <mesh rotation-x={-Math.PI / 2} position-y={0}><circleGeometry args={[1.1, 40]} /><meshStandardMaterial color="#3a2658" /></mesh>
        <Turntable look={look} spin={0} /></Canvas></div>
      <div className="wardrobe-items">{category.items.map((item) => { const have = item.price === 0 || owned.includes(item.id);
        return <button key={item.id} className={active(item) ? 'is-active' : ''} onClick={() => choose(item)} title={item.label}>
          {item.swatch ? <i style={{ background: item.swatch }} /> : null}<span>{item.label}</span><em>{have ? (item.price === 0 ? 'grátis' : 'comprado') : `R$ ${item.price}`}</em></button>; })}</div>
    </div>
    <footer><span>{message || (cost ? `Total: R$ ${cost}` : 'Sem custo para este visual')}</span>
      <button onClick={() => { setLook(profile.look); setPicked([]); }}>Desfazer</button><button onClick={close}>Cancelar</button><button className="wardrobe-buy" onClick={buy}>{cost ? `Comprar e vestir · R$ ${cost}` : 'Vestir'}</button></footer>
  </div>;
}
