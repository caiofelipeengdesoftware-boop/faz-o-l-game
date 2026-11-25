type AudioContextFactory = typeof AudioContext;
let context: AudioContext | null = null;
let master: GainNode | null = null;
let effectsBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let clubMusicGain: GainNode | null = null;
let clubMusicNodes: OscillatorNode[] = [];
let enabled = true;
let mix = { master: 0.8, music: 0.72, effects: 0.9 };
try { const saved = localStorage.getItem('faz-o-l-audio-mix'); if (saved) mix = { ...mix, ...JSON.parse(saved) as typeof mix }; } catch { /* audio settings are optional */ }

function getContext() {
  if (context || typeof window === 'undefined') return context;
  const Factory = (window.AudioContext || (window as Window & { webkitAudioContext?: AudioContextFactory }).webkitAudioContext);
  if (!Factory) return null;
  context = new Factory();
  master = context.createGain(); master.gain.value = enabled ? 0.48 * mix.master : 0; master.connect(context.destination);
  effectsBus = context.createGain(); effectsBus.gain.value = mix.effects; effectsBus.connect(master);
  musicBus = context.createGain(); musicBus.gain.value = mix.music; musicBus.connect(master);
  noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.24), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  engineOsc = context.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 56;
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 190;
  engineGain = context.createGain(); engineGain.gain.value = 0;
  engineOsc.connect(filter).connect(engineGain).connect(effectsBus); engineOsc.start();
  return context;
}

export function unlockAudio() { const audio = getContext(); if (audio?.state === 'suspended') void audio.resume(); }
export function setAudioEnabled(value: boolean) {
  enabled = value;
  if (master && context) master.gain.setTargetAtTime(value ? 0.48 * mix.master : 0, context.currentTime, 0.06);
}
export function getAudioMix() { return { ...mix }; }
export function setAudioMix(next: Partial<typeof mix>) {
  mix = { ...mix, ...next };
  try { localStorage.setItem('faz-o-l-audio-mix', JSON.stringify(mix)); } catch { /* audio settings are optional */ }
  if (!context) return { ...mix };
  master?.gain.setTargetAtTime(enabled ? 0.48 * mix.master : 0, context.currentTime, 0.06);
  effectsBus?.gain.setTargetAtTime(mix.effects, context.currentTime, 0.06);
  musicBus?.gain.setTargetAtTime(mix.music, context.currentTime, 0.06);
  return { ...mix };
}

function envelope(gain: GainNode, now: number, peak: number, length: number) {
  gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
}

export function playGunshot() {
  const audio = getContext(); if (!audio || !master || !noiseBuffer || !enabled) return;
  const now = audio.currentTime;
  const noise = audio.createBufferSource(); noise.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1050; filter.Q.value = 0.65;
  const burst = audio.createGain(); envelope(burst, now, 0.46, 0.13); noise.connect(filter).connect(burst).connect(effectsBus!); noise.start(now); noise.stop(now + 0.15);
  const thump = audio.createOscillator(); thump.type = 'triangle'; thump.frequency.setValueAtTime(110, now); thump.frequency.exponentialRampToValueAtTime(42, now + 0.11);
  const bass = audio.createGain(); envelope(bass, now, 0.35, 0.12); thump.connect(bass).connect(effectsBus!); thump.start(now); thump.stop(now + 0.13);
}

export function playFootstep(running = false) {
  const audio = getContext(); if (!audio || !master || !noiseBuffer || !enabled) return;
  const now = audio.currentTime; const source = audio.createBufferSource(); source.buffer = noiseBuffer;
  const low = audio.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = running ? 420 : 300;
  const gain = audio.createGain(); envelope(gain, now, running ? 0.12 : 0.085, 0.075);
  source.connect(low).connect(gain).connect(effectsBus!); source.start(now); source.stop(now + 0.09);
}

export function playReload() {
  const audio = getContext(); if (!audio || !master || !enabled) return;
  const destination = effectsBus!;
  [0, 0.19, 0.42].forEach((delay, index) => {
    const now = audio.currentTime + delay; const osc = audio.createOscillator(); osc.type = 'square'; osc.frequency.value = index === 1 ? 520 : 260;
    const gain = audio.createGain(); envelope(gain, now, 0.06, 0.045); osc.connect(gain).connect(destination); osc.start(now); osc.stop(now + 0.05);
  });
}

export function playImpact() {
  const audio = getContext(); if (!audio || !master || !noiseBuffer || !enabled) return;
  const now = audio.currentTime; const source = audio.createBufferSource(); source.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 260;
  const gain = audio.createGain(); envelope(gain, now, 0.14, 0.1); source.connect(filter).connect(gain).connect(effectsBus!); source.start(now); source.stop(now + 0.11);
}

export function playHorn() {
  const audio = getContext(); if (!audio || !master || !enabled) return;
  const now = audio.currentTime;
  for (const [index, frequency] of [370, 466].entries()) {
    const tone = audio.createOscillator(); tone.type = 'sawtooth'; tone.frequency.value = frequency;
    const gain = audio.createGain(); envelope(gain, now, 0.055, 0.3);
    const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 720;
    tone.connect(filter).connect(gain).connect(effectsBus!); tone.start(now + index * 0.008); tone.stop(now + 0.32);
  }
}

export function updateEngineSound(speed: number, active: boolean) {
  const audio = context; if (!audio || !engineOsc || !engineGain || !enabled) return;
  const magnitude = Math.min(1, Math.abs(speed) / 22);
  engineOsc.frequency.setTargetAtTime(50 + magnitude * 95, audio.currentTime, 0.09);
  engineGain.gain.setTargetAtTime(active ? 0.055 + magnitude * 0.08 : 0.0001, audio.currentTime, active ? 0.16 : 0.45);
}

export function setClubMusicProximity(distance: number, inside: boolean) {
  const audio = getContext();
  if (!audio || !master || !musicBus || !enabled) return;
  if (!clubMusicGain) {
    const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 720;
    clubMusicGain = audio.createGain(); clubMusicGain.gain.value = 0.0001;
    filter.connect(clubMusicGain).connect(musicBus);
    for (const [index, frequency] of [55, 82.4, 110, 164.8].entries()) {
      const oscillator = audio.createOscillator(); oscillator.type = index < 2 ? 'sawtooth' : 'triangle'; oscillator.frequency.value = frequency;
      const voice = audio.createGain(); voice.gain.value = index === 0 ? 0.34 : 0.12;
      oscillator.connect(voice).connect(filter); oscillator.start(); clubMusicNodes.push(oscillator);
    }
    const lfo = audio.createOscillator(); lfo.frequency.value = 2;
    const lfoGain = audio.createGain(); lfoGain.gain.value = 210; lfo.connect(lfoGain).connect(filter.frequency); lfo.start(); clubMusicNodes.push(lfo);
  }
  const proximity = Math.max(0, 1 - distance / 38);
  const volume = inside ? 0.19 : 0.115 * proximity * proximity;
  clubMusicGain.gain.setTargetAtTime(volume, audio.currentTime, inside ? 0.22 : 0.5);
}

export function speakLine(text: string, rate = 0.96) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const speech = window.speechSynthesis;
  speech.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR'; utterance.rate = rate; utterance.pitch = 0.94;
  const voices = speech.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'pt-br') ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt')) ?? null;
  speech.speak(utterance);
}

export function stopSpeech() { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }
