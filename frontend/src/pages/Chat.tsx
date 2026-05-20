import { useEffect, useRef, useState, type SetStateAction } from "react"
import { Link, useParams, useSearchParams } from "react-router"
import { JP } from "../components/JP"
import { VrmViewer } from "../components/vrm/VrmViewer"
import { getCharacter } from "../data/characters"
import { playCharacterVoice, stopCurrent } from "../lib/tts"
import { parseAnim } from "../lib/anim"
import {
  getGestureStepMs,
  normalizeGestureSequence,
} from "../lib/gesturePlayback"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  emotion?: string
  gesture?: string
  gestures?: string[]
  reengage?: ReengageHint
}

type ReengageHint = "soon" | "later" | "leave_space" | "none"

type IdleBand = {
  tier1: [number, number]
  tier2Gap: [number, number]
}

type IdleProfile = {
  soon: IdleBand
  later: IdleBand
  leave_space: IdleBand
}

type AssistantReplyResult = {
  success: boolean
  playback: Promise<void> | null
}

type GestureHistoryEntry = {
  lead: string
  sequence: string[]
}

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type ActivePerformance = {
  emotion: string
  gesture: string
  gestures: string[]
  sourceId: string | null
}

const OPENING_MESSAGE_ID = "opening"
const IDLE_CONTINUATION_PROMPT =
  "A thought just occurred to you related to what you were talking about. Say it naturally, like you just remembered something or want to add a quick thought. Don't mention the silence. Keep it to 1-2 short sentences."
const IDLE_REENGAGEMENT_PROMPT =
  "You feel like picking the conversation back up. Ask one specific, easy question you're genuinely curious about based on what's already been said, or offer one small observation. Don't mention the silence. Keep it to 1-2 short sentences."
const QUIET_PHRASES = [
  "leave me alone",
  "don't want to talk",
  "do not want to talk",
  "be quiet",
  "stop talking",
  "shut up",
  "go away",
  "not now",
  "give me a minute",
  "give me a moment",
  "need some quiet",
  "need a break",
  "need some space",
  "need space",
  "stop bothering",
  "i'm busy",
  "i am busy",
] as const
const IDLE_PROFILES: Record<string, IdleProfile> = {
  saki: {
    soon: { tier1: [28_000, 46_000], tier2Gap: [70_000, 125_000] },
    later: { tier1: [55_000, 90_000], tier2Gap: [95_000, 170_000] },
    leave_space: { tier1: [120_000, 210_000], tier2Gap: [150_000, 260_000] },
  },
  yuki: {
    soon: { tier1: [42_000, 68_000], tier2Gap: [85_000, 145_000] },
    later: { tier1: [75_000, 120_000], tier2Gap: [110_000, 190_000] },
    leave_space: { tier1: [145_000, 240_000], tier2Gap: [170_000, 280_000] },
  },
  hana: {
    soon: { tier1: [24_000, 42_000], tier2Gap: [65_000, 115_000] },
    later: { tier1: [50_000, 85_000], tier2Gap: [90_000, 160_000] },
    leave_space: { tier1: [110_000, 190_000], tier2Gap: [145_000, 245_000] },
  },
  aoi: {
    soon: { tier1: [38_000, 62_000], tier2Gap: [80_000, 140_000] },
    later: { tier1: [70_000, 110_000], tier2Gap: [105_000, 180_000] },
    leave_space: { tier1: [135_000, 225_000], tier2Gap: [165_000, 270_000] },
  },
  koharu: {
    soon: { tier1: [34_000, 56_000], tier2Gap: [78_000, 135_000] },
    later: { tier1: [64_000, 102_000], tier2Gap: [100_000, 175_000] },
    leave_space: { tier1: [130_000, 220_000], tier2Gap: [160_000, 270_000] },
  },
  mei: {
    soon: { tier1: [30_000, 50_000], tier2Gap: [72_000, 128_000] },
    later: { tier1: [58_000, 94_000], tier2Gap: [96_000, 168_000] },
    leave_space: { tier1: [122_000, 212_000], tier2Gap: [152_000, 258_000] },
  },
  akira: {
    soon: { tier1: [40_000, 66_000], tier2Gap: [84_000, 145_000] },
    later: { tier1: [72_000, 115_000], tier2Gap: [108_000, 188_000] },
    leave_space: { tier1: [140_000, 235_000], tier2Gap: [170_000, 280_000] },
  },
}
const REENGAGE_HINTS = new Set<ReengageHint>([
  "soon",
  "later",
  "leave_space",
  "none",
])

function wantsQuiet(text: string): boolean {
  const lower = text.toLowerCase()
  return QUIET_PHRASES.some((phrase) => lower.includes(phrase))
}

function sampleBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * Math.max(0, max - min))
}

function shiftRange(
  [min, max]: [number, number],
  delta: number,
): [number, number] {
  const nextMin = Math.max(15_000, min + delta)
  const nextMax = Math.max(nextMin + 5_000, max + delta)
  return [nextMin, nextMax]
}

function computeIdleDelays(
  characterId: string,
  messages: Message[],
  unsolicitedCount: number,
): { tier1Ms: number; tier2Ms: number } | null {
  const profile = IDLE_PROFILES[characterId] ?? {
    soon: { tier1: [30_000, 50_000] as [number, number], tier2Gap: [75_000, 130_000] as [number, number] },
    later: { tier1: [60_000, 95_000] as [number, number], tier2Gap: [100_000, 175_000] as [number, number] },
    leave_space: { tier1: [125_000, 215_000] as [number, number], tier2Gap: [155_000, 265_000] as [number, number] },
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
  const hint = lastAssistant?.reengage ?? "later"
  if (hint === "none") return null

  const band = profile[hint]
  let tier1 = band.tier1
  let tier2Gap = band.tier2Gap

  if (unsolicitedCount > 0) {
    tier1 = shiftRange(tier1, unsolicitedCount * 25_000)
    tier2Gap = shiftRange(tier2Gap, unsolicitedCount * 40_000)
  }

  const tier1Ms = sampleBetween(...tier1)
  const tier2Ms = tier1Ms + sampleBetween(...tier2Gap)
  return { tier1Ms, tier2Ms }
}

function rotateGestureSequence(gestures: string[], startIndex: number) {
  return gestures.slice(startIndex).concat(gestures.slice(0, startIndex))
}

function scoreGestureSequence(
  candidate: string[],
  recentHistory: GestureHistoryEntry[],
) {
  const recentLeads = recentHistory.map((entry) => entry.lead)
  const recentSequenceKeys = new Set(
    recentHistory.map((entry) => entry.sequence.join(">")),
  )
  const candidateKey = candidate.join(">")
  const candidateLead = candidate[0] ?? "idle"

  let score = 0
  if (recentSequenceKeys.has(candidateKey)) score += 5
  score += recentLeads.filter((lead) => lead === candidateLead).length * 3

  candidate.forEach((gesture, index) => {
    recentHistory.forEach((entry) => {
      if (entry.sequence[index] === gesture) score += 1
    })
  })

  if (candidateLead === "idle") score += 4

  return score
}

function applyGestureCooldown(
  gestures: string[] | undefined,
  recentHistory: GestureHistoryEntry[],
) {
  const sequence = normalizeGestureSequence(gestures)
  if (sequence.length < 2 || recentHistory.length === 0) return sequence

  const candidates = sequence.map((_, startIndex) =>
    rotateGestureSequence(sequence, startIndex),
  )

  return candidates.reduce((best, candidate) => {
    return scoreGestureSequence(candidate, recentHistory) <
      scoreGestureSequence(best, recentHistory)
      ? candidate
      : best
  }, sequence)
}

function parseAssistantMessage(
  rawText: string,
  fallbackEmotion = "neutral",
  recentGestureHistory: GestureHistoryEntry[] = [],
) {
  const result = parseAnim(rawText)
  const gestures = applyGestureCooldown(
    result.directive?.gestures,
    recentGestureHistory,
  )
  const reengage = result.directive?.reengage
  const normalizedReengage =
    reengage && REENGAGE_HINTS.has(reengage) ? reengage : undefined

  return {
    text: result.done ? result.stripped : rawText,
    emotion: result.directive?.emotion ?? fallbackEmotion,
    gesture: gestures[0],
    gestures,
    reengage: normalizedReengage,
  }
}

function getRecentGestureHistory(messages: Message[]): GestureHistoryEntry[] {
  const entries: GestureHistoryEntry[] = []

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "assistant") continue

    const sequence = normalizeGestureSequence(
      message.gestures?.length
        ? message.gestures
        : message.gesture
          ? [message.gesture]
          : undefined,
    )

    if (!sequence.length || sequence.every((gesture) => gesture === "idle")) {
      continue
    }

    entries.push({
      lead: sequence[0] ?? "idle",
      sequence,
    })

    if (entries.length >= 4) break
  }

  return entries
}

function getActivePerformance(messages: Message[]): ActivePerformance {
  let emotion: string | undefined
  let gestures: string[] | undefined
  let sourceId: string | null = null

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "assistant") continue
    if (!emotion && message.emotion) emotion = message.emotion
    if (!gestures && (message.gestures?.length || message.gesture)) {
      gestures = message.gestures?.length
        ? message.gestures
        : [message.gesture ?? "idle"]
      sourceId = message.id
    }
    if (emotion && gestures) break
  }

  const normalizedGestures = normalizeGestureSequence(gestures)

  return {
    emotion: emotion ?? "neutral",
    gesture: normalizedGestures[0] ?? "idle",
    gestures: normalizedGestures,
    sourceId,
  }
}

function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | null {
  if (typeof window === "undefined") return null

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  )
}

export function Chat() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const character = id ? getCharacter(id) : undefined
  const debugCombo = import.meta.env.DEV ? searchParams.get("combo") : null
  const debugEmotion = import.meta.env.DEV
    ? searchParams.get("emotion") ?? "neutral"
    : "neutral"

  const [messages, setMessagesState] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isOpening, setIsOpening] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const openedCharacterIdRef = useRef<string | null>(null)
  const openingAbortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const messagesRef = useRef<Message[]>([])
  const inputRef = useRef("")
  const listeningDraftRef = useRef("")
  const speechBaseInputRef = useRef("")
  const submitSpeechOnEndRef = useRef(false)
  const idleTimerTier1Ref = useRef<number | null>(null)
  const idleTimerTier2Ref = useRef<number | null>(null)
  const gestureSequenceTimersRef = useRef<number[]>([])
  const idlePausedRef = useRef(false)
  const idleNudgeCountRef = useRef(0)
  const isOpeningRef = useRef(false)
  const isListeningRef = useRef(false)
  const isStreamingRef = useRef(false)

  const setMessages = (next: SetStateAction<Message[]>) => {
    setMessagesState((prev) => {
      const resolved =
        typeof next === "function"
          ? (next as (value: Message[]) => Message[])(prev)
          : next
      messagesRef.current = resolved
      return resolved
    })
  }

  const {
    emotion: activeEmotion,
    gesture: activeGesture,
    gestures: activeGestureSequence,
    sourceId: activeGestureSourceId,
  } =
    getActivePerformance(messages)
  const activeGestureSequenceKey =
    `${activeGestureSourceId ?? "none"}:${activeGestureSequence.join(">")}`
  const [sequencedGesture, setSequencedGesture] = useState(activeGesture)
  const [sequencedGestureNonce, setSequencedGestureNonce] = useState(0)
  const speechRecognitionSupported =
    getSpeechRecognitionConstructor() !== null

  function abortCurrentOpening() {
    openingAbortRef.current?.abort()
    openingAbortRef.current = null
    isOpeningRef.current = false
    setIsOpening(false)
    setMessages((prev) =>
      prev.filter((message) => !(message.id === OPENING_MESSAGE_ID && message.text === "...")),
    )
  }

  function clearIdleTimers() {
    if (idleTimerTier1Ref.current !== null) {
      window.clearTimeout(idleTimerTier1Ref.current)
      idleTimerTier1Ref.current = null
    }
    if (idleTimerTier2Ref.current !== null) {
      window.clearTimeout(idleTimerTier2Ref.current)
      idleTimerTier2Ref.current = null
    }
  }

  function clearGestureSequenceTimers() {
    gestureSequenceTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer)
    })
    gestureSequenceTimersRef.current = []
  }

  function stopListening(submitOnEnd = false) {
    submitSpeechOnEndRef.current = submitOnEnd
    recognitionRef.current?.stop()
  }

  function scheduleIdleTimersAfterSpeech(
    assistantId: string,
    playback: Promise<void> | null,
    onBeforeSchedule?: () => void,
  ) {
    const afterPlayback = playback?.catch(() => {}) ?? Promise.resolve()

    void afterPlayback.finally(() => {
      const lastMessage = messagesRef.current[messagesRef.current.length - 1]
      if (!lastMessage || lastMessage.role !== "assistant" || lastMessage.id !== assistantId) {
        return
      }
      if (idlePausedRef.current || isListeningRef.current) return

      onBeforeSchedule?.()
      scheduleIdleTimers()
    })
  }

  async function submitUserMessage(text: string) {
    if (isStreamingRef.current || !character) return

    const trimmed = text.trim()
    if (!trimmed) return

    clearIdleTimers()
    abortCurrentOpening()
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    }
    const assistantId = `a-${Date.now()}`
    const nextMessages = [...messagesRef.current, userMsg]
    setMessages([
      ...nextMessages,
      { id: assistantId, role: "assistant", text: "", emotion: "neutral" },
    ])
    setInput("")
    inputRef.current = ""
    idlePausedRef.current = wantsQuiet(userMsg.text)
    idleNudgeCountRef.current = 0

    const history = nextMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }))

    const result = await streamAssistantReply(
      assistantId,
      history,
      true,
      getRecentGestureHistory(nextMessages),
    )
    if (result.success && !idlePausedRef.current) {
      scheduleIdleTimersAfterSpeech(assistantId, result.playback)
    }
  }

  function startListening() {
    const SpeechRecognition = getSpeechRecognitionConstructor()
    if (!SpeechRecognition || isStreamingRef.current) return

    abortCurrentOpening()
    stopCurrent()
    clearIdleTimers()
    setSpeechError(null)
    speechBaseInputRef.current = inputRef.current.trim()
    listeningDraftRef.current = ""
    submitSpeechOnEndRef.current = true

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript?.trim() ?? ""
        if (!transcript) continue
        if (result.isFinal) {
          finalTranscript += `${transcript} `
        } else {
          interimTranscript += `${transcript} `
        }
      }

      listeningDraftRef.current = finalTranscript.trim()
      const spokenText = [finalTranscript.trim(), interimTranscript.trim()]
        .filter(Boolean)
        .join(" ")
        .trim()
      const combined = [speechBaseInputRef.current, spokenText]
        .filter(Boolean)
        .join(" ")
        .trim()

      inputRef.current = combined
      setInput(combined)
    }

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown"
      if (code === "aborted") return

      submitSpeechOnEndRef.current = false
      if (code === "no-speech") {
        setSpeechError("didn't catch anything")
      } else if (code === "not-allowed" || code === "service-not-allowed") {
        setSpeechError("microphone permission was blocked")
      } else {
        setSpeechError("speech recognition failed")
      }
    }

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return

      recognitionRef.current = null
      isListeningRef.current = false
      setIsListening(false)

      const finalText = [speechBaseInputRef.current, listeningDraftRef.current]
        .filter(Boolean)
        .join(" ")
        .trim()

      if (!submitSpeechOnEndRef.current) {
        inputRef.current = speechBaseInputRef.current
        setInput(speechBaseInputRef.current)
        return
      }

      if (!finalText) {
        inputRef.current = speechBaseInputRef.current
        setInput(speechBaseInputRef.current)
        return
      }

      void submitUserMessage(finalText)
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    setIsListening(true)

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      isListeningRef.current = false
      setIsListening(false)
      submitSpeechOnEndRef.current = false
      setSpeechError("couldn't start microphone")
    }
  }

  function scheduleIdleTimers() {
    clearIdleTimers()
    if (!character) return
    if (
      isOpeningRef.current ||
      isStreamingRef.current ||
      isListeningRef.current ||
      idlePausedRef.current
    ) {
      return
    }
    if (messagesRef.current.length === 0) return

    const delays = computeIdleDelays(
      character.id,
      messagesRef.current,
      idleNudgeCountRef.current,
    )
    if (!delays) return
    const { tier1Ms, tier2Ms } = delays

    idleTimerTier1Ref.current = window.setTimeout(() => {
      if (
        idlePausedRef.current ||
        isOpeningRef.current ||
        isStreamingRef.current ||
        isListeningRef.current
      ) {
        return
      }
      if (inputRef.current.trim()) {
        scheduleIdleTimers()
        return
      }
      void sendProactiveTurn(IDLE_CONTINUATION_PROMPT)
    }, tier1Ms)

    idleTimerTier2Ref.current = window.setTimeout(() => {
      if (
        idlePausedRef.current ||
        isOpeningRef.current ||
        isStreamingRef.current ||
        isListeningRef.current
      ) {
        return
      }
      if (inputRef.current.trim()) {
        scheduleIdleTimers()
        return
      }
      void sendProactiveTurn(IDLE_REENGAGEMENT_PROMPT)
    }, tier2Ms)
  }

  async function streamAssistantReply(
    assistantId: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    showErrorPlaceholder = true,
    recentGestureHistory: GestureHistoryEntry[] = [],
  ): Promise<AssistantReplyResult> {
    if (!character) return { success: false, playback: null }

    isStreamingRef.current = true
    setIsStreaming(true)
    let playback: Promise<void> | null = null
    try {
      const res = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: character.id,
          messages: history,
          recent_gesture_history: recentGestureHistory,
        }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`chat ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let rawText = ""
      let directiveResolved = false
      let directiveLength = 0

      const applyParse = () => {
        if (directiveResolved) {
          return rawText.slice(directiveLength)
        }
        const result = parseAnim(rawText)
        if (result.done) {
          directiveResolved = true
          directiveLength = rawText.length - result.stripped.length
          if (result.directive) {
            const gestures = applyGestureCooldown(
              result.directive.gestures,
              recentGestureHistory,
            )
            const reengage = result.directive.reengage
            const normalizedReengage =
              reengage && REENGAGE_HINTS.has(reengage)
                ? reengage
                : undefined
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      emotion: result.directive?.emotion,
                      gesture: gestures[0],
                      gestures,
                      reengage: normalizedReengage,
                    }
                  : m,
              ),
            )
          }
        }
        return result.stripped
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sep
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          const line = frame.split("\n").find((l) => l.startsWith("data: "))
          if (!line) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === "chunk") {
              rawText += event.text
              const displayed = applyParse()
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: displayed } : m,
                ),
              )
            }
          } catch {
            // ignore malformed frame
          }
        }
      }

      const finalText = applyParse().trim()
      if (finalText) {
        playback = playCharacterVoice(character.id, finalText).catch((err) => {
          console.warn("TTS playback failed:", err)
        })
      }
      return { success: true, playback }
    } catch (err) {
      console.warn("chat stream failed:", err)
      if (showErrorPlaceholder) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: m.text || "(connection error)" }
              : m,
          ),
        )
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      }
      return { success: false, playback: null }
    } finally {
      isStreamingRef.current = false
      setIsStreaming(false)
    }
  }

  async function sendProactiveTurn(prompt: string) {
    if (!character || isOpeningRef.current || isStreamingRef.current || idlePausedRef.current) {
      return
    }
    if (inputRef.current.trim()) {
      scheduleIdleTimers()
      return
    }

    clearIdleTimers()
    const historyMessages = messagesRef.current
    const assistantId = `a-idle-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", text: "", emotion: "neutral" },
    ])

    const result = await streamAssistantReply(
      assistantId,
      [
        ...historyMessages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: prompt },
      ],
      false,
      getRecentGestureHistory(historyMessages),
    )

    if (result.success) {
      scheduleIdleTimersAfterSpeech(assistantId, result.playback, () => {
        idleNudgeCountRef.current += 1
      })
    }
  }

  useEffect(() => {
    if (!character) return
    const openingKey = `${character.id}:${debugCombo ?? ""}:${debugEmotion}`
    if (openedCharacterIdRef.current === openingKey) return

    openedCharacterIdRef.current = openingKey
    let cancelled = false

    clearIdleTimers()
    idlePausedRef.current = false
    idleNudgeCountRef.current = 0
    openingAbortRef.current?.abort()
    stopCurrent()
    setInput("")
    inputRef.current = ""
    isOpeningRef.current = true
    setIsOpening(true)
    setMessages([
      {
        id: OPENING_MESSAGE_ID,
        role: "assistant",
        text: "...",
        emotion: "neutral",
      },
    ])

    if (debugCombo) {
      const gestures = normalizeGestureSequence(
        debugCombo.split(",").map((gesture) => gesture.trim()),
      )
      const opener: Message = {
        id: OPENING_MESSAGE_ID,
        role: "assistant",
        text: `Testing combo: ${gestures.join(" -> ")}`,
        emotion: debugEmotion,
        gesture: gestures[0],
        gestures,
        reengage: "none",
      }
      setMessages([opener])
      isOpeningRef.current = false
      setIsOpening(false)
      return () => {
        cancelled = true
        if (openedCharacterIdRef.current === openingKey) {
          openedCharacterIdRef.current = null
        }
        abortCurrentOpening()
      }
    }

    const loadOpening = async () => {
      const abort = new AbortController()
      openingAbortRef.current = abort
      let openerPlayback: Promise<void> | null = null

      try {
        const res = await fetch("/api/v1/chat/opening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ character_id: character.id }),
          signal: abort.signal,
        })
        if (!res.ok) {
          throw new Error(`opening ${res.status}`)
        }

        const data = (await res.json()) as { text?: string }
        const parsed = parseAssistantMessage(
          data.text ?? "",
          "happy",
          getRecentGestureHistory(messagesRef.current),
        )
        const opener: Message = {
          id: OPENING_MESSAGE_ID,
          role: "assistant",
          text: parsed.text.trim() || character.greeting.en,
          emotion: parsed.emotion,
          gesture: parsed.gesture,
          gestures: parsed.gestures,
          reengage: parsed.reengage,
        }

        if (cancelled) return

        setMessages([opener])
        if (opener.text.trim()) {
          openerPlayback = playCharacterVoice(character.id, opener.text).catch((err) => {
            // Autoplay can be blocked before the first user gesture; that's expected.
            console.warn("TTS playback failed:", err)
          })
        }
      } catch (err) {
        if (abort.signal.aborted || cancelled) return
        console.warn("opening failed:", err)

        const fallbackGreeting: Message = {
          id: OPENING_MESSAGE_ID,
          role: "assistant",
          text: character.greeting.en,
          emotion: "happy",
          reengage: "later",
        }
        setMessages([fallbackGreeting])
        openerPlayback = playCharacterVoice(character.id, fallbackGreeting.text).catch((ttsErr) => {
          console.warn("TTS playback failed:", ttsErr)
        })
      } finally {
        if (!cancelled) {
          if (openingAbortRef.current === abort) {
            openingAbortRef.current = null
          }
          isOpeningRef.current = false
          setIsOpening(false)
          scheduleIdleTimersAfterSpeech(OPENING_MESSAGE_ID, openerPlayback)
        }
      }
    }

    void loadOpening()

    return () => {
      cancelled = true
      if (openedCharacterIdRef.current === openingKey) {
        openedCharacterIdRef.current = null
      }
      abortCurrentOpening()
    }
  }, [character, debugCombo, debugEmotion])

  useEffect(() => {
    return () => {
      abortCurrentOpening()
      clearGestureSequenceTimers()
      stopListening(false)
      stopCurrent()
    }
  }, [])

  useEffect(() => {
    inputRef.current = input
  }, [input])

  useEffect(() => {
    isOpeningRef.current = isOpening
  }, [isOpening])

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isStreamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    return () => clearIdleTimers()
  }, [])

  useEffect(() => {
    clearGestureSequenceTimers()
    if (!character) return

    let elapsedMs = 0
    activeGestureSequence.forEach((gesture, index) => {
      const playGesture = () => {
        setSequencedGesture(gesture)
        setSequencedGestureNonce((value) => value + 1)
      }

      if (index === 0) {
        playGesture()
      } else {
        const timer = window.setTimeout(playGesture, elapsedMs)
        gestureSequenceTimersRef.current.push(timer)
      }

      elapsedMs += getGestureStepMs(gesture, character.id)
    })

    if (activeGestureSequence.some((gesture) => gesture !== "idle")) {
      const returnToIdleTimer = window.setTimeout(() => {
        setSequencedGesture("idle")
        setSequencedGestureNonce((value) => value + 1)
      }, elapsedMs + 240)
      gestureSequenceTimersRef.current.push(returnToIdleTimer)
    }

    return () => clearGestureSequenceTimers()
  }, [activeGestureSequenceKey, character])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  if (!character) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <JP className="text-2xl font-semibold text-rose-400">見つかりません</JP>
        <h1
          className="mt-2 text-4xl text-sage-600"
          style={{ fontFamily: "var(--font-display)" }}
        >
          friend not found
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block text-xl text-sage-500 underline"
          style={{ fontFamily: "var(--font-display)" }}
        >
          back home
        </Link>
      </main>
    )
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (isListening) return
    await submitUserMessage(input)
  }

  return (
    <main className="mx-auto flex h-[calc(100svh-65px)] max-w-7xl flex-col md:grid md:grid-cols-[1.4fr_1fr] md:gap-4 md:p-4">
      {/* Avatar panel */}
      <section className="watercolor-card relative flex min-h-0 flex-[1.35] flex-col overflow-hidden md:flex-none">
        <div
          className="relative flex flex-1 overflow-hidden rounded-t-2xl"
          style={{
            minHeight: "240px",
            background: `radial-gradient(ellipse at 50% 35%, ${character.accentColor}33 0%, var(--color-cream-50) 75%)`,
          }}
        >
          {/* Sky band */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-sky-300/30 to-transparent" />

          {/* Drifting clouds */}
          <span className="pointer-events-none absolute left-12 top-10 text-4xl text-cream-50 float">
            ☁
          </span>
          <span
            className="pointer-events-none absolute right-16 top-6 text-3xl text-cream-50 float"
            style={{ animationDelay: "1.5s" }}
          >
            ☁
          </span>

          <VrmViewer
            url={`${import.meta.env.VITE_VRM_BASE_URL ?? ""}/vrm/${character.id}.vrm`}
            kanji={character.kanji}
            accentColor={character.accentColor}
            characterName={character.name}
            animation={sequencedGesture}
            animationNonce={sequencedGestureNonce}
            characterId={character.id}
            emotion={activeEmotion}
          />

          {/* Top-left character info */}
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            <Link
              to="/"
              className="rounded-full border border-sage-300 bg-cream-50/90 px-3 py-1 text-sm font-semibold text-sage-600 backdrop-blur hover:bg-sage-300 hover:text-cream-50"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.1em" }}
            >
              ← home
            </Link>
            <div className="rounded-2xl border border-sage-300 bg-cream-50/90 px-3 py-2 backdrop-blur">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl text-sage-600"
                  style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
                >
                  {character.name.toLowerCase()}
                </span>
                <JP className="text-lg font-semibold text-rose-400">
                  {character.kanji}
                </JP>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <JP className="font-semibold text-sage-500">
                  {character.personality.jp}
                </JP>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">
                  {character.personality.en}
                </span>
              </div>
            </div>
          </div>

          {/* Online */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-sage-400 bg-cream-50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-sage-500" />
            <span className="text-[10px] font-semibold tracking-wide text-sage-600">
              online
            </span>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex flex-col gap-2 border-t border-dashed border-sage-300 bg-cream-50/60 px-4 py-2 text-xs md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <JP className="font-semibold text-rose-400">感情</JP>
            <span className="text-text-muted">·</span>
            <span className="font-semibold text-emotion-happy">{activeEmotion}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">{sequencedGesture}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="text-[10px] font-semibold tracking-wide text-text-muted">
              motion
            </span>
            <span className="text-text-secondary">model-driven</span>
            <span className="text-[10px] font-semibold tracking-wide text-text-muted">
              voice
            </span>
            <span className="text-text-secondary">{character.voice}</span>
          </div>
        </div>
      </section>

      {/* Chat panel */}
      <section className="watercolor-card-pink relative flex min-h-0 flex-[0.8] flex-col overflow-hidden md:flex-1">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6"
        >
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-dashed border-rose-300 bg-cream-50/60 p-3 md:p-4"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "listening..." : "say something..."}
              readOnly={isListening}
              className="flex-1 rounded-full border border-sage-300 bg-cream-50 px-4 py-2.5 text-sm text-text-primary placeholder:italic placeholder:text-text-muted focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-300/40"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <button
              type="button"
              onClick={() =>
                isListening ? stopListening(true) : startListening()
              }
              disabled={!speechRecognitionSupported || isStreaming}
              className="rounded-full border border-sky-300 bg-sky-200/60 px-4 py-2.5 text-sm font-semibold text-sage-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isListening ? "stop" : "speak"}
            </button>
            <button
              type="submit"
              disabled={isListening}
              className="btn-earthy px-5 py-2.5 text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              send
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold tracking-wide text-text-muted">
            <span>
              <JP className="text-rose-400">送信</JP> · enter to send
            </span>
            <span>50 / day · 0 used</span>
          </div>
          {(isListening || speechError || !speechRecognitionSupported) && (
            <div className="mt-2 text-[10px] font-semibold tracking-wide">
              {isListening && (
                <span className="text-sage-600">mic live · speak naturally and tap stop to send</span>
              )}
              {!isListening && speechError && (
                <span className="text-rose-500">{speechError}</span>
              )}
              {!isListening && !speechError && !speechRecognitionSupported && (
                <span className="text-text-muted">speech input isn't supported in this browser</span>
              )}
            </div>
          )}
        </form>
      </section>
    </main>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[80%] flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "rounded-3xl rounded-br-[6px] bg-sage-300 text-cream-50"
              : "rounded-3xl rounded-bl-[6px] border border-sky-300 bg-sky-200/60 text-text-primary"
          }`}
        >
          {message.text}
        </div>
        {!isUser && message.emotion && (
          <span
            className="ml-2 text-sm text-rose-400"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {message.emotion}
          </span>
        )}
      </div>
    </div>
  )
}
