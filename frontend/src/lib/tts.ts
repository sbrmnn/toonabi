import { attachAudio, detachAudio } from "./lipsync"

// Plays character TTS by POSTing to /api/v1/tts/stream and feeding the
// response to an <audio> element. A module-level AudioController lets a new
// utterance interrupt the previous one (chat messages arrive in sequence, so
// the latest assistant message should win). The returned promise resolves when
// playback actually finishes (or is aborted), not just when audio starts.

let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null
let currentAbort: AbortController | null = null
const STREAM_MIME = "audio/mpeg"

export type PlayOptions = {
  provider?: "fish" | "elevenlabs"
}

export async function playCharacterVoice(
  characterId: string,
  text: string,
  options: PlayOptions = {},
): Promise<void> {
  stopCurrent()

  const abort = new AbortController()
  currentAbort = abort

  const res = await fetch("/api/v1/tts/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      character_id: characterId,
      text,
      provider: options.provider ?? "fish",
    }),
    signal: abort.signal,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`TTS request failed: ${res.status} ${detail}`)
  }

  try {
    if (supportsStreamingPlayback(res)) {
      await playStreamingAudio(res, abort)
    } else {
      await playBufferedAudio(res, abort)
    }
  } catch (err) {
    if (abort.signal.aborted) return
    cleanup()
    throw err
  }
}

export function stopCurrent(): void {
  currentAbort?.abort()
  currentAbort = null
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ""
  }
  cleanup()
}

function cleanup() {
  if (currentUrl) URL.revokeObjectURL(currentUrl)
  currentAudio = null
  currentUrl = null
  detachAudio()
}

function supportsStreamingPlayback(res: Response): boolean {
  return (
    !!res.body &&
    typeof MediaSource !== "undefined" &&
    MediaSource.isTypeSupported(STREAM_MIME) &&
    (res.headers.get("Content-Type") ?? "").includes(STREAM_MIME)
  )
}

async function playBufferedAudio(
  res: Response,
  abort: AbortController,
): Promise<void> {
  const blob = await res.blob()
  if (abort.signal.aborted) return

  const url = URL.createObjectURL(blob)
  const audio = registerAudio(new Audio(url), url)
  await audio.play()
  await waitForPlaybackToFinish(audio, abort.signal)
}

async function playStreamingAudio(
  res: Response,
  abort: AbortController,
): Promise<void> {
  const mediaSource = new MediaSource()
  const url = URL.createObjectURL(mediaSource)
  const audio = registerAudio(new Audio(url), url)
  const sourceBuffer = await openSourceBuffer(mediaSource)
  const reader = res.body!.getReader()
  let playbackStarted = false

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (!value?.byteLength) continue

    await appendChunk(sourceBuffer, value)

    if (!playbackStarted) {
      playbackStarted = true
      await audio.play()
    }
  }

  if (!playbackStarted) {
    await audio.play()
  }

  if (mediaSource.readyState === "open") {
    mediaSource.endOfStream()
  }

  await waitForPlaybackToFinish(audio, abort.signal)
}

function registerAudio(
  audio: HTMLAudioElement,
  url: string,
): HTMLAudioElement {
  currentAudio = audio
  currentUrl = url

  attachAudio(audio)

  audio.addEventListener("ended", () => {
    if (currentAudio === audio) cleanup()
  })
  audio.addEventListener("error", () => {
    if (currentAudio === audio) cleanup()
  })

  return audio
}

function openSourceBuffer(mediaSource: MediaSource): Promise<SourceBuffer> {
  if (mediaSource.readyState === "open") {
    return Promise.resolve(mediaSource.addSourceBuffer(STREAM_MIME))
  }

  return new Promise((resolve, reject) => {
    const handleOpen = () => {
      cleanupListeners()
      resolve(mediaSource.addSourceBuffer(STREAM_MIME))
    }
    const handleError = () => {
      cleanupListeners()
      reject(new Error("Failed to initialize streaming audio source"))
    }
    const cleanupListeners = () => {
      mediaSource.removeEventListener("sourceopen", handleOpen)
      mediaSource.removeEventListener("error", handleError)
    }

    mediaSource.addEventListener("sourceopen", handleOpen, { once: true })
    mediaSource.addEventListener("error", handleError, { once: true })
  })
}

function appendChunk(
  sourceBuffer: SourceBuffer,
  chunk: Uint8Array,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const copy = new Uint8Array(chunk.byteLength)
    copy.set(chunk)
    const handleUpdateEnd = () => {
      cleanupListeners()
      resolve()
    }
    const handleError = () => {
      cleanupListeners()
      reject(new Error("Streaming audio append failed"))
    }
    const cleanupListeners = () => {
      sourceBuffer.removeEventListener("updateend", handleUpdateEnd)
      sourceBuffer.removeEventListener("error", handleError)
    }

    sourceBuffer.addEventListener("updateend", handleUpdateEnd, { once: true })
    sourceBuffer.addEventListener("error", handleError, { once: true })
    sourceBuffer.appendBuffer(copy)
  })
}

function waitForPlaybackToFinish(
  audio: HTMLAudioElement,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return Promise.resolve()
  if (audio.ended) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const handleEnded = () => {
      cleanupListeners()
      resolve()
    }
    const handleAbort = () => {
      cleanupListeners()
      resolve()
    }
    const handleError = () => {
      cleanupListeners()
      reject(new Error("Audio playback failed"))
    }
    const cleanupListeners = () => {
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      signal.removeEventListener("abort", handleAbort)
    }

    audio.addEventListener("ended", handleEnded, { once: true })
    audio.addEventListener("error", handleError, { once: true })
    signal.addEventListener("abort", handleAbort, { once: true })
  })
}
