import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ChatPanel } from './ChatPanel';
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { MathUtils, type Group } from 'three';
import { useGameStore } from '../state';
import type { QuestId, QuestProgress } from '../state/slices/questSlice';
import { gameInput } from '../systems/gameInput';
import { newMotion, Person, type PersonLook } from '../world/Person';

export type GameRole = 'police' | 'civilian' | 'criminal';
export type RemotePlayer = { id: string; name: string; role: GameRole; x: number; z: number; yaw: number; walking: boolean; sprinting: boolean; driving: boolean };
export type ChatMessage = { id: string; name: string; role: GameRole; text: string; at: number };
type MultiplayerState = { messages: ChatMessage[]; voiceOn: boolean; selfId: string | null; addMessage: (message: ChatMessage) => void; setVoiceOn: (value: boolean) => void; setSelfId: (id: string | null) => void; connected: boolean; players: RemotePlayer[]; speaking: string[]; setConnected: (value: boolean) => void; setPlayers: (players: RemotePlayer[]) => void; setSpeaking: (id: string, value: boolean) => void };
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  messages: [], voiceOn: false, selfId: null, addMessage: (message) => set((state) => ({ messages: [...state.messages.slice(-39), message] })), setVoiceOn: (voiceOn) => set({ voiceOn }), setSelfId: (selfId) => set({ selfId }),
  connected: false, players: [], speaking: [], setConnected: (connected) => set({ connected }), setPlayers: (players) => set({ players }),
  setSpeaking: (id, value) => set((state) => ({ speaking: value ? Array.from(new Set([...state.speaking, id])) : state.speaking.filter((item) => item !== id) })),
}));

let activeSocket: Socket | null = null;
export function sendChat(text: string) { activeSocket?.emit('chat:send', { text }); }

type PeerAudio = { connection: RTCPeerConnection; panner: PannerNode | null; pendingIce: RTCIceCandidateInit[] };

export function MultiplayerOverlay({ active }: { active: boolean }) {
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const microphone = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const micAnalyser = useRef<AnalyserNode | null>(null);
  const micData = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const peers = useRef(new Map<string, PeerAudio>());
  const lastQuestSnapshot = useRef('');
  const lastMissionSnapshot = useRef('');
  const connected = useMultiplayerStore((state) => state.connected);
  const remotePlayers = useMultiplayerStore((state) => state.players);

  useEffect(() => {
    if (!active) return;
    const endpoint = import.meta.env.VITE_MULTIPLAYER_URL || window.location.origin;
    const socket = io(endpoint, { transports: ['websocket', 'polling'], reconnectionAttempts: 8, timeout: 5000 });
    socketRef.current = socket;
    const name = localStorage.getItem('faz-o-l-player-name') || `Investigador ${Math.floor(100 + Math.random() * 900)}`;
    const role = (localStorage.getItem('faz-o-l-online-role') || 'civilian') as GameRole;
    localStorage.setItem('faz-o-l-player-name', name);

    const closePeer = (id: string) => {
      const peer = peers.current.get(id); if (!peer) return;
      peer.connection.ontrack = null; peer.connection.onicecandidate = null; peer.connection.close(); peer.panner?.disconnect();
      peers.current.delete(id); useMultiplayerStore.getState().setSpeaking(id, false);
    };
    const connectPeer = async (id: string, shouldOffer: boolean) => {
      if (!microphone.current || peers.current.has(id)) return;
      const context = audioContext.current;
      if (!context) return;
      const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      const peer: PeerAudio = { connection, panner: null, pendingIce: [] };
      peers.current.set(id, peer);
      for (const track of microphone.current.getAudioTracks()) connection.addTrack(track, microphone.current);
      connection.onicecandidate = (event) => { if (event.candidate) socket.emit('voice:signal', { to: id, signal: { type: 'ice', candidate: event.candidate.toJSON() } }); };
      connection.ontrack = (event) => {
        const source = context.createMediaStreamSource(event.streams[0]);
        const panner = context.createPanner(); panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse'; panner.refDistance = 1; panner.maxDistance = 26; panner.rolloffFactor = 1.35;
        source.connect(panner).connect(context.destination); peer.panner = panner;
      };
      if (shouldOffer) {
        const offer = await connection.createOffer(); await connection.setLocalDescription(offer);
        socket.emit('voice:signal', { to: id, signal: { type: 'offer', description: connection.localDescription } });
      }
    };

    socket.on('chat:message', (message: ChatMessage) => useMultiplayerStore.getState().addMessage(message));
    socket.on('connect', () => { activeSocket = socket; useMultiplayerStore.getState().setSelfId(socket.id ?? null); useMultiplayerStore.getState().setConnected(true); socket.emit('room:join', { name, role }); });
    socket.on('disconnect', () => { useMultiplayerStore.getState().setConnected(false); useMultiplayerStore.getState().setPlayers([]); });
    socket.on('connect_error', () => useMultiplayerStore.getState().setConnected(false));
    socket.on('room:players', (list: RemotePlayer[]) => useMultiplayerStore.getState().setPlayers(list));
    socket.on('player:join', (player: RemotePlayer) => useMultiplayerStore.setState((state) => ({ players: [...state.players.filter((item) => item.id !== player.id), player] })));
    socket.on('player:move', (player: RemotePlayer) => useMultiplayerStore.setState((state) => ({ players: [...state.players.filter((item) => item.id !== player.id), player] })));
    socket.on('player:leave', ({ id }: { id: string }) => { useMultiplayerStore.setState((state) => ({ players: state.players.filter((player) => player.id !== id) })); closePeer(id); });
    socket.on('voice:peers', (list: { id: string }[]) => { for (const peer of list) if (socket.id && socket.id < peer.id) void connectPeer(peer.id, true); });
    socket.on('voice:peer-joined', ({ id }: { id: string }) => { if (socket.id && socket.id < id) void connectPeer(id, true); });
    socket.on('voice:peer-left', ({ id }: { id: string }) => closePeer(id));
    socket.on('voice:talking', ({ id, speaking }: { id: string; speaking: boolean }) => useMultiplayerStore.getState().setSpeaking(id, speaking));
    const applySharedMission = (mission: { missionPhase: 'available' | 'evidence' | 'shootout' | 'complete'; enemiesRemaining: number }) => {
      lastMissionSnapshot.current = JSON.stringify(mission);
      const missionText: Record<typeof mission.missionPhase, string> = { available: 'Fale com a inspetora na delegacia para receber uma missão.', evidence: 'Investigue o depósito e recupere as provas.', shootout: `Confronto em andamento · ${mission.enemiesRemaining} adversário(s).`, complete: 'Missão concluída. As provas foram recuperadas.' };
      useGameStore.setState({ missionPhase: mission.missionPhase, missionText: missionText[mission.missionPhase], enemiesRemaining: mission.enemiesRemaining });
    };
    const applySharedQuests = (snapshot: { quests: QuestProgress[]; trackedQuestId: QuestId | null }) => {
      lastQuestSnapshot.current = JSON.stringify(snapshot);
      useGameStore.getState().restoreQuestState(snapshot.quests, snapshot.trackedQuestId);
    };
    socket.on('room:mission', applySharedMission); socket.on('mission:sync', applySharedMission);
    socket.on('room:quests', applySharedQuests); socket.on('quests:sync', applySharedQuests);
    socket.on('voice:signal', async ({ from, signal }: { from: string; signal: { type: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit } }) => {
      if (!microphone.current || !audioContext.current) return;
      await connectPeer(from, false);
      const peer = peers.current.get(from); if (!peer) return;
      if (signal.type === 'offer' && signal.description) {
        await peer.connection.setRemoteDescription(signal.description);
        for (const candidate of peer.pendingIce.splice(0)) await peer.connection.addIceCandidate(candidate);
        const answer = await peer.connection.createAnswer(); await peer.connection.setLocalDescription(answer);
        socket.emit('voice:signal', { to: from, signal: { type: 'answer', description: peer.connection.localDescription } });
      } else if (signal.type === 'answer' && signal.description) {
        await peer.connection.setRemoteDescription(signal.description);
        for (const candidate of peer.pendingIce.splice(0)) await peer.connection.addIceCandidate(candidate);
      } else if (signal.type === 'ice' && signal.candidate) {
        if (peer.connection.remoteDescription) await peer.connection.addIceCandidate(signal.candidate);
        else peer.pendingIce.push(signal.candidate);
      }
    });

    const moveTimer = window.setInterval(() => {
      const game = useGameStore.getState();
      socket.volatile.emit('player:move', { x: game.playerPosition[0], z: game.playerPosition[1], yaw: game.playerYaw, walking: Math.hypot(gameInput.moveX, gameInput.moveY) > 0.08, sprinting: gameInput.run, driving: game.isDriving });
      const questSnapshot = JSON.stringify({ quests: game.quests, trackedQuestId: game.trackedQuestId });
      if (questSnapshot !== lastQuestSnapshot.current) { lastQuestSnapshot.current = questSnapshot; socket.emit('quests:update', JSON.parse(questSnapshot)); }
      const missionSnapshot = JSON.stringify({ missionPhase: game.missionPhase, enemiesRemaining: game.enemiesRemaining });
      if (missionSnapshot !== lastMissionSnapshot.current) { lastMissionSnapshot.current = missionSnapshot; socket.emit('mission:update', JSON.parse(missionSnapshot)); }
      const context = audioContext.current;
      if (context) {
        const local = game.playerPosition;
        const listener = context.listener;
        if (listener.positionX) { listener.positionX.setTargetAtTime(local[0], context.currentTime, 0.08); listener.positionY.setTargetAtTime(0, context.currentTime, 0.08); listener.positionZ.setTargetAtTime(local[1], context.currentTime, 0.08); }
        const yaw = game.playerYaw;
        if (listener.forwardX) { listener.forwardX.setTargetAtTime(Math.sin(yaw), context.currentTime, 0.08); listener.forwardY.setTargetAtTime(0, context.currentTime, 0.08); listener.forwardZ.setTargetAtTime(Math.cos(yaw), context.currentTime, 0.08); }
        for (const player of useMultiplayerStore.getState().players) {
          const panner = peers.current.get(player.id)?.panner; if (!panner) continue;
          panner.positionX.setTargetAtTime(player.x, context.currentTime, 0.1); panner.positionY.setTargetAtTime(1.5, context.currentTime, 0.1); panner.positionZ.setTargetAtTime(player.z, context.currentTime, 0.1);
        }
      }
    }, 50);
    const talkTimer = window.setInterval(() => {
      const analyser = micAnalyser.current; const data = micData.current;
      if (!analyser || !data) return;
      analyser.getByteTimeDomainData(data);
      const level = Math.sqrt(data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / data.length);
      const speaking = level > 0.04; socket.emit('voice:talking', { speaking });
      useMultiplayerStore.getState().setSpeaking(socket.id ?? 'self', speaking);
    }, 180);

    return () => {
      window.clearInterval(moveTimer); window.clearInterval(talkTimer);
      socket.emit('voice:leave'); socket.disconnect(); socketRef.current = null;
      for (const id of peers.current.keys()) closePeer(id);
      microphone.current?.getTracks().forEach((track) => track.stop()); microphone.current = null;
      micAnalyser.current?.disconnect(); micAnalyser.current = null; micData.current = null;
      void audioContext.current?.close(); audioContext.current = null;
      useMultiplayerStore.getState().setConnected(false); useMultiplayerStore.getState().setPlayers([]); useMultiplayerStore.getState().setSpeaking('self', false);
    };
  }, [active]);

  const toggleVoice = async () => {
    setVoiceError('');
    if (voiceOn) {
      socketRef.current?.emit('voice:leave');
      for (const id of peers.current.keys()) { peers.current.get(id)?.connection.close(); peers.current.delete(id); }
      microphone.current?.getTracks().forEach((track) => track.stop()); microphone.current = null;
      micAnalyser.current?.disconnect(); micAnalyser.current = null; micData.current = null;
      await audioContext.current?.close(); audioContext.current = null; setVoiceOn(false); useMultiplayerStore.getState().setVoiceOn(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      microphone.current = stream;
      audioContext.current = new AudioContext(); await audioContext.current.resume();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyser = audioContext.current.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
      micAnalyser.current = analyser; micData.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      socketRef.current?.emit('voice:join'); setVoiceOn(true); useMultiplayerStore.getState().setVoiceOn(true);
    } catch (error) { setVoiceError(error instanceof Error ? error.message : 'Microfone indisponível'); }
  };

  const toggleRef = useRef(toggleVoice); toggleRef.current = toggleVoice;
  useEffect(() => { const handler = () => { void toggleRef.current(); }; window.addEventListener('faz:voice-toggle', handler); return () => window.removeEventListener('faz:voice-toggle', handler); }, []);
  if (!active) return null;
  return <><ChatPanel connected={connected} /><div className="multiplayer-badge"><span className={connected ? 'network-dot online' : 'network-dot'} />{connected ? `${remotePlayers.length + 1} NO DISTRITO` : 'ONLINE INDISPONÍVEL'}<button title={voiceError || (voiceOn ? 'Desativar chat de voz' : 'Ativar microfone')} onClick={() => void toggleVoice()} className={voiceOn ? 'voice-on' : ''}>🎙 {voiceOn ? 'VOZ ATIVA' : 'VOZ'}</button></div></>;
}

const TOPS = ['#5892ad', '#b96545', '#6b8180', '#c4a66f', '#6e627c', '#a38674', '#3f7a8c'];
function remoteLook(player: RemotePlayer): PersonLook {
  const seed = Array.from(player.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const skins = ['#f0c8a8', '#d9a074', '#b97a55', '#8d5a3b', '#6b4430'];
  if (player.role === 'police') return { skin: skins[seed % 5], top: '#1f3556', bottom: '#17263d', outfit: 'uniform', hair: 'police-cap', badge: true };
  if (player.role === 'criminal') return { skin: skins[seed % 5], top: '#2a2d30', bottom: '#1d1f22', outfit: 'hoodie', hair: 'beanie', hairColor: '#111', mask: seed % 2 === 0 };
  return { skin: skins[seed % 5], top: TOPS[seed % TOPS.length], bottom: '#2d333a', hair: (['short', 'long', 'curly', 'bun', 'cap'] as const)[seed % 5], hairColor: '#2b211c', shortSleeves: seed % 2 === 0 };
}

function RemoteAvatar({ player }: { player: RemotePlayer }) {
  const root = useRef<Group>(null); const latest = useRef(player); const motion = useRef(newMotion());
  latest.current = player;
  const speaking = useMultiplayerStore((state) => state.speaking.includes(player.id));
  const look = useMemo(() => remoteLook(player), [player.name, player.role]);
  const roleLabel = player.role === 'police' ? 'POLÍCIA' : player.role === 'criminal' ? 'FORAGIDO' : 'CIDADÃO';
  useFrame((_, delta) => {
    const group = root.current; if (!group) return;
    const target = latest.current;
    const blend = 1 - Math.exp(-10 * Math.min(delta, 0.05));
    group.position.x = MathUtils.lerp(group.position.x, target.x, blend);
    group.position.z = MathUtils.lerp(group.position.z, target.z, blend);
    const difference = Math.atan2(Math.sin(target.yaw - group.rotation.y), Math.cos(target.yaw - group.rotation.y));
    group.rotation.y += difference * blend;
    motion.current.speed = target.walking ? (target.sprinting ? 1.8 : 1) : 0;
  });
  return <group ref={root} position={[player.x, 0, player.z]}>
    <Person look={look} motion={motion} />
    <Html position={[0, 2.2, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className="npc-tag" style={{ borderLeftColor: speaking ? '#8ee3bd' : '#e2c274' }}><b>{player.name}{speaking ? ' · VOZ' : ''}</b><small>{roleLabel}</small></div>
    </Html>
  </group>;
}

export function RemotePlayers() {
  const players = useMultiplayerStore((state) => state.players);
  return <group>{players.map((player) => <RemoteAvatar key={player.id} player={player} />)}</group>;
}
