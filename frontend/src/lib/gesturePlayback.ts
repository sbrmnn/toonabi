import {
  CUSTOM_GESTURE_IDS,
  getCustomGestureDefinition,
} from "./customGestures"

export const RAW_GESTURE_OPTIONS = [
  "angry",
  "annoyed",
  "both_talk",
  "celebrate",
  "cheer",
  "clapping",
  "curious",
  "dance_kokoro",
  "dance_morning",
  "dogeza",
  "drink",
  "embarrassed",
  "hand_talk",
  "hands_on_head",
  "hello",
  "humble",
  "idle",
  "lean_in",
  "nod",
  "open_palms",
  "point_soft",
  "pose_stand",
  "relaxed",
  "sad",
  "shake_no",
  "sleepy",
  "smartphone",
  "startled",
  "surprised_react",
  "think_tilt",
  "thinking",
  "thumbs_down",
  "thumbs_up",
  "wave_big",
  "wave_small",
] as const

export const ALLOWED_GESTURES = new Set<string>([
  ...RAW_GESTURE_OPTIONS,
  ...CUSTOM_GESTURE_IDS,
])

const RAW_GESTURE_DURATIONS_MS: Record<string, number> = {
  angry: 1400,
  annoyed: 1350,
  both_talk: 1450,
  celebrate: 1500,
  cheer: 1550,
  clapping: 1500,
  curious: 1350,
  dance_kokoro: 1800,
  dance_morning: 1800,
  dogeza: 1700,
  drink: 1400,
  embarrassed: 1400,
  hand_talk: 1450,
  hands_on_head: 1450,
  hello: 1800,
  humble: 1400,
  idle: 1200,
  lean_in: 1350,
  nod: 1250,
  open_palms: 1450,
  point_soft: 1350,
  pose_stand: 1500,
  relaxed: 1350,
  sad: 1400,
  shake_no: 1300,
  sleepy: 1450,
  smartphone: 1550,
  startled: 1300,
  surprised_react: 1350,
  think_tilt: 1350,
  thinking: 1450,
  thumbs_down: 1350,
  thumbs_up: 1350,
  wave_big: 1900,
  wave_small: 1600,
}

const MIN_GESTURE_STEP_MS = 860
const MAX_GESTURE_STEP_MS = 1820
const GESTURE_STEP_RATIO = 0.9

export function normalizeGestureSequence(gestures: string[] | undefined) {
  const sequence = gestures?.filter((name) => ALLOWED_GESTURES.has(name)) ?? []
  return sequence.length ? sequence : ["idle"]
}

export function getGestureStepMs(gesture: string, characterId?: string) {
  const customGesture = getCustomGestureDefinition(gesture, characterId)
  const durationMs =
    customGesture
      ? customGesture.duration * 1000
      : RAW_GESTURE_DURATIONS_MS[gesture] ?? 1200

  return Math.round(
    Math.min(
      MAX_GESTURE_STEP_MS,
      Math.max(MIN_GESTURE_STEP_MS, durationMs * GESTURE_STEP_RATIO),
    ),
  )
}
