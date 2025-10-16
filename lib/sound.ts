let audioCtx: AudioContext | null = null;

export function playClick() {
  try {
    if (!audioCtx) {
      const AudioCtor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
      if (AudioCtor) audioCtx = new AudioCtor();
    }
    const ctx = audioCtx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 800; // short click
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.02, now + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    o.start(now);
    o.stop(now + 0.09);
  } catch {
    // ignore audio errors silently
  }
}
