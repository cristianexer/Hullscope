import { useEffect } from 'react';

let context: AudioContext | null = null;
/** Called only from the user's Storm/sound button gesture. No downloaded audio. */
export function unlockThunder() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => undefined);
  } catch { /* The visual weather remains available without Web Audio. */ }
}

/** Layered rain/surf ambience with distance-delayed thunder, created locally after a user gesture. */
export function useThunder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const sources = new Set<AudioBufferSourceNode>();
    const ambientNodes: AudioNode[] = [];
    let swell: OscillatorNode | null = null;
    const audio = context;
    if (audio) {
      // White noise filtered into rain hiss and low surf; looping buffers have no external assets.
      const buffer = audio.createBuffer(1, audio.sampleRate * 8, audio.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const rain = audio.createBufferSource(), surf = audio.createBufferSource();
      rain.buffer = surf.buffer = buffer; rain.loop = surf.loop = true;
      const rainLow = audio.createBiquadFilter(), rainHigh = audio.createBiquadFilter(), rainGain = audio.createGain();
      rainLow.type = 'lowpass'; rainLow.frequency.value = 5500;
      rainHigh.type = 'highpass'; rainHigh.frequency.value = 850;
      rainGain.gain.setValueAtTime(0, audio.currentTime);
      rainGain.gain.linearRampToValueAtTime(.055, audio.currentTime + 1.2);
      rain.connect(rainHigh); rainHigh.connect(rainLow); rainLow.connect(rainGain); rainGain.connect(audio.destination);
      const surfLow = audio.createBiquadFilter(), surfGain = audio.createGain(), swellDepth = audio.createGain();
      surfLow.type = 'lowpass'; surfLow.frequency.value = 380; surfLow.Q.value = .6;
      surfGain.gain.setValueAtTime(0, audio.currentTime);
      surfGain.gain.linearRampToValueAtTime(.24, audio.currentTime + 1.5);
      swell = audio.createOscillator(); swell.type = 'sine'; swell.frequency.value = .13;
      swellDepth.gain.setValueAtTime(0, audio.currentTime);
      swellDepth.gain.linearRampToValueAtTime(.11, audio.currentTime + 2);
      swell.connect(swellDepth); swellDepth.connect(surfGain.gain);
      surf.connect(surfLow); surfLow.connect(surfGain); surfGain.connect(audio.destination);
      ambientNodes.push(rainHigh,rainLow,rainGain,surfLow,surfGain,swellDepth,swell);
      for (const source of [rain,surf]) { sources.add(source); source.start(); }
      swell.start();
    }
    const visibility = () => {
      if (!audio) return;
      if (document.hidden) void audio.suspend().catch(() => undefined);
      else void audio.resume().catch(() => undefined);
    };
    document.addEventListener('visibilitychange',visibility);
    const lightning = (event: Event) => {
      const audio = context;
      if (!audio || audio.state !== 'running' || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const distance = Math.max(100, Math.min(1800, Number((event as CustomEvent<{distance:number}>).detail?.distance) || 700));
      const duration = 6, buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
      const data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        brown = (brown + .035 * white) / 1.035;
        data[i] = brown * 4 + white * .08;
      }
      const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = .5;
      const start = audio.currentTime + distance / 343;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.28, start + .09);
      gain.gain.exponentialRampToValueAtTime(.11, start + .8);
      gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(audio.destination);
      sources.add(source);
      source.onended = () => { sources.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(start); source.stop(start + duration);
    };
    window.addEventListener('hullscope-lightning', lightning);
    return () => {
      window.removeEventListener('hullscope-lightning', lightning);
      document.removeEventListener('visibilitychange',visibility);
      swell?.stop();
      for (const source of sources) { source.stop(); source.disconnect(); }
      sources.clear();
      for (const node of ambientNodes) node.disconnect();
    };
  }, [enabled]);
  useEffect(() => () => { void context?.close(); context = null; }, []);
}
