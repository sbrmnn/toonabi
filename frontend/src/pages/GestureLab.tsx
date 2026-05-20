import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"
import { JP } from "../components/JP"
import { VrmViewer } from "../components/vrm/VrmViewer"
import { characters, getCharacter } from "../data/characters"
import {
  getGestureAuditCombo,
  getGestureComboDurationMs,
  getGestureLabel,
  GESTURE_AUDIT_COMBOS,
} from "../lib/gestureCombos"
import {
  getCustomGesturesForCharacter,
  getCustomGesturePeakTime,
} from "../lib/customGestures"
import {
  getGestureStepMs,
  normalizeGestureSequence,
} from "../lib/gesturePlayback"

export function GestureLab() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const character = id ? getCharacter(id) : undefined
  const requestedGesture = searchParams.get("gesture")
  const requestedCombo = searchParams.get("combo")
  const requestedFraming = searchParams.get("framing")
  const requestedHold = searchParams.get("hold")
  const requestedAuditCombo = getGestureAuditCombo(requestedCombo)

  if (!character) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-65px)] max-w-4xl items-center justify-center px-6 py-10">
        <div className="rounded-[28px] border border-cream-300 bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm">
          <p className="text-lg text-sage-700">Character not found.</p>
        </div>
      </div>
    )
  }

  return (
    <GestureLabScreen
      key={`${character.id}:${searchParams.toString()}`}
      character={character}
      initialComboId={requestedAuditCombo?.id ?? null}
      initialFraming={
        requestedFraming === "portrait"
          ? "portrait"
          : requestedFraming === "torso"
            ? "torso"
            : "default"
      }
      initialGesture={requestedAuditCombo?.gestures[0] ?? requestedGesture ?? "idle"}
      initialHoldPeak={requestedHold === "1" || requestedHold === "true"}
    />
  )
}

type GestureLabScreenProps = {
  character: NonNullable<ReturnType<typeof getCharacter>>
  initialComboId: string | null
  initialFraming: "default" | "torso" | "portrait"
  initialGesture: string
  initialHoldPeak: boolean
}

function GestureLabScreen({
  character,
  initialComboId,
  initialFraming,
  initialGesture,
  initialHoldPeak,
}: GestureLabScreenProps) {
  const viewerCardRef = useRef<HTMLDivElement>(null)
  const sequenceTimersRef = useRef<number[]>([])
  const [selectedGesture, setSelectedGesture] = useState(initialGesture)
  const [selectedComboId, setSelectedComboId] = useState<string | null>(initialComboId)
  const [playbackNonce, setPlaybackNonce] = useState(0)
  const [sequencedGesture, setSequencedGesture] = useState(initialGesture)
  const [sequencedGestureNonce, setSequencedGestureNonce] = useState(0)
  const [framing, setFraming] = useState<"default" | "torso" | "portrait">(
    initialFraming,
  )
  const [holdPeak, setHoldPeak] = useState(initialHoldPeak)

  const customGestures = getCustomGesturesForCharacter(character.id)
  const selectedCombo = getGestureAuditCombo(selectedComboId)
  const activeSequence = useMemo(
    () => (
      selectedCombo
        ? normalizeGestureSequence(selectedCombo.gestures)
        : [selectedGesture]
    ),
    [selectedCombo, selectedGesture],
  )
  const activeSequenceKey = `${selectedComboId ?? selectedGesture}:${activeSequence.join(">")}`
  const activeGesture =
    customGestures.find((gesture) => gesture.id === selectedGesture) ?? null
  const currentGesture =
    customGestures.find((gesture) => gesture.id === sequencedGesture) ?? null
  const proceduralGesturePreviewTime =
    !selectedCombo && holdPeak && activeGesture
      ? getCustomGesturePeakTime(activeGesture)
      : undefined

  const clearSequenceTimers = () => {
    sequenceTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer)
    })
    sequenceTimersRef.current = []
  }

  useEffect(() => {
    clearSequenceTimers()

    let elapsedMs = 0
    activeSequence.forEach((gesture, index) => {
      const playStep = () => {
        setSequencedGesture(gesture)
        setSequencedGestureNonce((value) => value + 1)
      }

      if (index === 0) {
        playStep()
      } else {
        const timer = window.setTimeout(playStep, elapsedMs)
        sequenceTimersRef.current.push(timer)
      }

      elapsedMs += getGestureStepMs(gesture, character.id)
    })

    const shouldReturnToIdle =
      activeSequence.some((gesture) => gesture !== "idle") &&
      !(holdPeak && !selectedCombo)

    if (shouldReturnToIdle) {
      const returnToIdleTimer = window.setTimeout(() => {
        setSequencedGesture("idle")
        setSequencedGestureNonce((value) => value + 1)
      }, elapsedMs + 240)
      sequenceTimersRef.current.push(returnToIdleTimer)
    }

    return () => clearSequenceTimers()
  }, [activeSequence, activeSequenceKey, character.id, holdPeak, playbackNonce, selectedCombo])

  const playGesture = (
    gestureId: string,
    options?: { revealViewer?: boolean },
  ) => {
    setSelectedComboId(null)
    setSelectedGesture(gestureId)
    setPlaybackNonce((value) => value + 1)

    if (options?.revealViewer) {
      requestAnimationFrame(() => {
        viewerCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      })
    }
  }

  const activeIndex = customGestures.findIndex(
    (gesture) => gesture.id === selectedGesture,
  )

  const cycleGesture = (direction: -1 | 1) => {
    const baseIndex = activeIndex === -1
      ? direction === 1
        ? -1
        : 0
      : activeIndex
    const nextIndex =
      (baseIndex + direction + customGestures.length) % customGestures.length
    playGesture(customGestures[nextIndex]?.id ?? customGestures[0]?.id ?? "idle")
  }

  const playCombo = (comboId: string) => {
    const combo = getGestureAuditCombo(comboId)
    if (!combo) return

    setSelectedComboId(combo.id)
    setSelectedGesture(combo.gestures[0] ?? "idle")
    setHoldPeak(false)
    setPlaybackNonce((value) => value + 1)

    requestAnimationFrame(() => {
      viewerCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  const buildCharacterLabSearch = (nextCharacterId: string) => {
    const params = new URLSearchParams()
    if (selectedComboId) {
      params.set("combo", selectedComboId)
    } else if (selectedGesture !== "idle") {
      params.set("gesture", selectedGesture)
    }
    if (framing !== "default") params.set("framing", framing)
    if (holdPeak && !selectedComboId) params.set("hold", "1")

    const query = params.toString()
    return `/lab/gestures/${nextCharacterId}${query ? `?${query}` : ""}`
  }

  const comboDurationMs = selectedCombo
    ? getGestureComboDurationMs(selectedCombo.gestures, character.id)
    : null

  return (
    <main className="mx-auto flex min-h-[calc(100svh-65px)] max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <section className="grid gap-4 xl:grid-cols-[minmax(340px,1.15fr)_minmax(320px,0.85fr)]">
        <div
          ref={viewerCardRef}
          className="rounded-[30px] border border-cream-300 bg-white/70 p-3 shadow-sm backdrop-blur-sm"
        >
          <div className="flex h-[58svh] min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-cream-200 bg-[linear-gradient(180deg,rgba(255,249,240,0.98),rgba(251,245,235,0.92))]">
            <div className="flex items-center justify-between border-b border-dashed border-sage-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
                  Internal Gesture Lab
                </p>
                <h1
                  className="text-2xl text-sage-800"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {character.name}
                </h1>
              </div>
              <span className="rounded-full border border-sage-300 bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700">
                neutral face
              </span>
            </div>

            <div className="min-h-0 flex-1">
              <VrmViewer
                url={`/vrm/${character.id}.vrm`}
                kanji={character.kanji}
                accentColor={character.accentColor}
                characterName={character.name}
                animation={sequencedGesture}
                animationNonce={sequencedGestureNonce}
                characterId={character.id}
                proceduralGesturePreviewTime={proceduralGesturePreviewTime}
                emotion="neutral"
                framing={framing}
              />
            </div>

            <div className="border-t border-dashed border-sage-200 px-4 py-3 text-sm text-sage-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sage-500">
                    {selectedCombo ? "Active Combo" : "Active Gesture"}
                  </p>
                  <p
                    className="text-lg text-sage-800"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {selectedCombo?.label ?? activeGesture?.label ?? "Idle stance"}
                  </p>
                  {selectedCombo ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-sage-500">
                      {selectedCombo.gestures.map(getGestureLabel).join(" -> ")}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-sage-700">
                    Now playing: {currentGesture?.label ?? getGestureLabel(sequencedGesture)}
                    {comboDurationMs ? ` · ${(comboDurationMs / 1000).toFixed(2)}s total` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={Boolean(selectedCombo)}
                    onClick={() => setHoldPeak((value) => !value)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      selectedCombo
                        ? "cursor-not-allowed border-sage-200 bg-sage-50 text-sage-400"
                        : holdPeak
                          ? "border-sage-500 bg-sage-500 text-cream-50"
                          : "border-sage-300 bg-sage-50 text-sage-800 hover:-translate-y-0.5 hover:bg-sage-100"
                    }`}
                  >
                    {selectedCombo
                      ? "Peak hold off for combos"
                      : holdPeak
                        ? "Peak hold on"
                        : "Peak hold off"}
                  </button>
                  <div className="flex rounded-full border border-sage-200 bg-white/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFraming("default")}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                        framing === "default"
                          ? "bg-sage-500 text-cream-50"
                          : "text-sage-700 hover:bg-sage-50"
                      }`}
                    >
                      Full body
                    </button>
                    <button
                      type="button"
                      onClick={() => setFraming("torso")}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                        framing === "torso"
                          ? "bg-sage-500 text-cream-50"
                          : "text-sage-700 hover:bg-sage-50"
                      }`}
                    >
                      Upper body
                    </button>
                    <button
                      type="button"
                      onClick={() => setFraming("portrait")}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                        framing === "portrait"
                          ? "bg-sage-500 text-cream-50"
                          : "text-sage-700 hover:bg-sage-50"
                      }`}
                    >
                      Portrait
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleGesture(-1)}
                    className="rounded-full border border-sage-300 bg-sage-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-800 transition hover:-translate-y-0.5 hover:bg-sage-100"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaybackNonce((value) => value + 1)}
                    className="rounded-full border border-sage-300 bg-sage-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-800 transition hover:-translate-y-0.5 hover:bg-sage-200"
                  >
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleGesture(1)}
                    className="rounded-full border border-sage-300 bg-sage-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-800 transition hover:-translate-y-0.5 hover:bg-sage-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="rounded-[28px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
                  Character Switch
                </p>
                <p className="text-sm text-sage-700">
                  Run the same gesture or combo across all seven characters to see whether the silhouettes and timing still read cleanly.
                </p>
              </div>
              <Link
                to={`/chat/${character.id}`}
                className="rounded-full border border-sage-300 bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-800 transition hover:-translate-y-0.5 hover:bg-sage-100"
              >
                Back to chat
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {characters.map((item) => {
                const active = item.id === character.id
                return (
                  <Link
                    key={item.id}
                    to={buildCharacterLabSearch(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      active
                        ? "border-sage-500 bg-sage-500 text-cream-50"
                        : "border-sage-200 bg-white text-sage-700 hover:-translate-y-0.5 hover:border-sage-300 hover:bg-sage-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
                  Combo Audit
                </p>
                <p className="mt-1 text-sm text-sage-700">
                  Ten curated sequences that cover greeting, curiosity, reassurance, humor, apology, boundaries, and sleepy low-energy beats.
                </p>
              </div>
              {selectedCombo ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComboId(null)
                    setSelectedGesture("idle")
                    setPlaybackNonce((value) => value + 1)
                  }}
                  className="rounded-full border border-sage-300 bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-800 transition hover:-translate-y-0.5 hover:bg-sage-100"
                >
                  Clear combo
                </button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3">
              {GESTURE_AUDIT_COMBOS.map((combo) => {
                const active = combo.id === selectedComboId
                const durationMs = getGestureComboDurationMs(combo.gestures, character.id)

                return (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => playCombo(combo.id)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-sage-500 bg-sage-500/10 shadow-sm"
                        : "border-cream-300 bg-white/70 hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p
                          className="text-lg text-sage-800"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {combo.label}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sage-500">
                          {combo.gestures.map(getGestureLabel).join(" -> ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sage-200 bg-sage-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-700">
                          {combo.emotion}
                        </span>
                        <span className="rounded-full border border-sage-200 bg-sage-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-700">
                          {(durationMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-sage-700">
                      {combo.description}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed uppercase tracking-[0.12em] text-sage-500">
                      Watch for: {combo.note}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
              Toonabi Core Customs
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {customGestures.map((gesture) => {
                const active = gesture.id === selectedGesture
                return (
                  <button
                    key={gesture.id}
                    type="button"
                    onClick={() =>
                      playGesture(gesture.id, {
                        revealViewer: true,
                      })}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-sage-500 bg-sage-500/10 shadow-sm"
                        : "border-cream-300 bg-white/70 hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="text-lg text-sage-800"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {gesture.label}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sage-500">
                          {gesture.id}
                        </p>
                      </div>
                      <span className="rounded-full border border-sage-200 bg-sage-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-700">
                        {gesture.duration.toFixed(2)}s
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-sage-700">
                      {gesture.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
              What To Check
            </p>
            <div className="mt-4 space-y-2 text-sm leading-relaxed text-sage-700">
              <p>1. Does the silhouette read immediately at a glance?</p>
              <p>2. Do the shoulders, elbows, and head settle cleanly without snapping?</p>
              <p>3. Does the same combo still feel in-character on Saki, Yuki, Hana, Aoi, Koharu, Mei, and Akira?</p>
              <p>4. Do the long-sleeve and long-skirt rigs keep their hands readable without clipping or floaty drift?</p>
              <p>5. Does the return to idle feel intentional instead of robotic?</p>
            </div>
            <div className="mt-5 rounded-[22px] border border-dashed border-sage-200 bg-cream-50/70 p-4 text-sm text-sage-700">
              <JP className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 not-italic">
                note
              </JP>
              Use the combo audit for timing and transitions, then drop back to individual gestures with peak hold if a specific pose needs silhouette tuning before it goes back into normal chat behavior.
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
