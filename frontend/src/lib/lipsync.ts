// Module-level lip-sync signal. The TTS layer pushes audio elements in via
// attachAudio(); the VrmViewer reads getMouthOpen() once per animation frame.
// A single AudioContext is reused across plays so we don't spawn a new one
// per utterance (browsers cap the total).

let ctx: AudioContext | null = null
let activeAnalyser: AnalyserNode | null = null
let rafId: number | null = null
let mouthOpen = 0

function ensureCtx(): AudioContext {
  if (!ctx) {
    const Ctor = (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)
    ctx = new Ctor()
  }
  return ctx!
}

function loop() {
  if (activeAnalyser) {
    const bins = new Uint8Array(activeAnalyser.frequencyBinCount)
    activeAnalyser.getByteFrequencyData(bins)
    let sum = 0
    for (let i = 4; i < 16; i++) sum += bins[i]
    const avg = sum / 12 / 255
    mouthOpen = Math.min(1, avg * 2.5)
  } else if (mouthOpen > 0) {
    mouthOpen *= 0.7
    if (mouthOpen < 0.01) mouthOpen = 0
  }
  rafId = requestAnimationFrame(loop)
}

export function attachAudio(audio: HTMLAudioElement): void {
  const c = ensureCtx()
  if (c.state === "suspended") c.resume().catch(() => {})
  try {
    const source = c.createMediaElementSource(audio)
    const analyser = c.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.5
    source.connect(analyser)
    analyser.connect(c.destination)
    activeAnalyser = analyser
  } catch (err) {
    // createMediaElementSource throws if called twice on the same element.
    // The caller creates a fresh Audio per utterance, so this is just a guard.
    console.warn("lipsync attach failed:", err)
    activeAnalyser = null
  }
  if (rafId === null) loop()
}

export function detachAudio(): void {
  activeAnalyser = null
}

export function getMouthOpen(): number {
  return mouthOpen
}
