import type { VRMHumanBoneName } from "@pixiv/three-vrm"
import { CUSTOM_GESTURE_OVERRIDES } from "./customGestureOverrides"

export type CustomGestureKeyframe = {
  bones: Partial<Record<VRMHumanBoneName, [number, number, number]>>
  time: number
}

export type CustomGestureDefinition = {
  baseAnimation?: string
  description: string
  duration: number
  id: string
  keyframes: CustomGestureKeyframe[]
  label: string
  returnToIdle?: boolean
}

export type CustomGestureKeyframePatches = Partial<
  Record<
    number,
    Partial<Record<VRMHumanBoneName, [number, number, number]>>
  >
>

export type CustomGestureVariant = Partial<
  Omit<CustomGestureDefinition, "id" | "keyframes">
> & {
  keyframes?: CustomGestureKeyframe[]
  keyframePatches?: CustomGestureKeyframePatches
}

export type CharacterCustomGestureOverrides = Record<
  string,
  Partial<Record<string, CustomGestureVariant>>
>

function pose(
  overrides: Partial<Record<VRMHumanBoneName, [number, number, number]>>,
) {
  return overrides
}

export const CUSTOM_GESTURES: CustomGestureDefinition[] = [
  {
    baseAnimation: "idle",
    id: "listening_nod",
    label: "Listening Nod",
    description:
      "A quiet front-facing listen with a small chin dip and soft recovery. Good for active listening or gentle agreement.",
    duration: 1.25,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.14,
        bones: pose({
          head: [-2.5, 0, 0],
          neck: [-1, 0, 0],
        }),
      },
      {
        time: 0.36,
        bones: pose({
          head: [-5.5, 0, 0],
          neck: [-2.5, 0, 0],
        }),
      },
      {
        time: 0.62,
        bones: pose({
          head: [2.5, 0, 0],
          neck: [1.25, 0, 0],
        }),
      },
      {
        time: 0.88,
        bones: pose({
          head: [-1, 0, 0],
          neck: [-1, 0, 0],
        }),
      },
      { time: 1.25, bones: pose({}) },
    ],
  },
  {
    id: "soft_explain",
    baseAnimation: "hand_talk",
    label: "Soft Explain",
    description:
      "A low conversational explanation with a small torso lean and restrained hand movement.",
    duration: 1.75,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.24,
        bones: pose({
          chest: [2, 1, 0],
          head: [1, -2, 0],
          leftLowerArm: [2, 4, -4],
          leftShoulder: [3, 0, -2],
          leftUpperArm: [-2, 4, 3],
          neck: [1, -1, 0],
          rightLowerArm: [2, -4, 4],
          rightShoulder: [4, 0, 3],
          rightUpperArm: [-2, -5, -3],
          spine: [2, 1, 0],
        }),
      },
      {
        time: 0.78,
        bones: pose({
          chest: [3, 1, 0],
          head: [0, 3, 0],
          leftLowerArm: [2, 5, -5],
          leftShoulder: [5, 0, -3],
          leftUpperArm: [-3, 6, 4],
          neck: [0, 1, 0],
          rightLowerArm: [2, -5, 5],
          rightShoulder: [6, 0, 4],
          rightUpperArm: [-3, -7, -4],
          spine: [3, 1, 0],
        }),
      },
      {
        time: 1.22,
        bones: pose({
          chest: [2, 0, 0],
          leftLowerArm: [1, 3, -3],
          leftShoulder: [3, 0, -2],
          leftUpperArm: [-2, 4, 2],
          rightLowerArm: [1, -3, 3],
          rightShoulder: [3, 0, 2],
          rightUpperArm: [-2, -4, -2],
          spine: [2, 0, 0],
        }),
      },
      { time: 1.75, bones: pose({}) },
    ],
  },
  {
    id: "curious_peek",
    baseAnimation: "curious",
    label: "Curious Peek",
    description:
      "A cautious lean-in with a tilted head and one hand slightly raised, for curiosity or a soft question.",
    duration: 1.6,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.2,
        bones: pose({
          chest: [3, -4, 0],
          head: [7, -10, -2],
          neck: [2, 4, 3],
          rightLowerArm: [2, -3, 3],
          rightShoulder: [3, 0, 2],
          rightUpperArm: [-2, -4, -2],
          spine: [4, -4, 0],
        }),
      },
      {
        time: 0.58,
        bones: pose({
          chest: [6, -6, 0],
          head: [10, -16, -4],
          neck: [2, 7, 5],
          rightLowerArm: [3, -4, 4],
          rightShoulder: [4, 0, 3],
          rightUpperArm: [-3, -5, -2],
          spine: [6, -6, 0],
        }),
      },
      {
        time: 1.14,
        bones: pose({
          chest: [3, -3, 0],
          head: [5, -8, -2],
          neck: [1, 3, 2],
          rightShoulder: [2, 0, 1],
          spine: [3, -3, 0],
        }),
      },
      { time: 1.6, bones: pose({}) },
    ],
  },
  {
    baseAnimation: "idle",
    id: "tiny_shrug",
    label: "Tiny Shrug",
    description:
      "A small shoulder lift with a slight head cant, for uncertainty, teasing deflection, or a light 'maybe'.",
    duration: 1.2,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.2,
        bones: pose({
          chest: [1, 0, 0],
          head: [0, 0, 5],
          leftShoulder: [6, 0, -3],
          neck: [0, 0, 2],
          rightShoulder: [6, 0, 3],
          spine: [1, 0, 0],
        }),
      },
      {
        time: 0.52,
        bones: pose({
          chest: [2, 0, 0],
          head: [0, 0, 9],
          leftShoulder: [10, 0, -5],
          neck: [0, 0, 4],
          rightShoulder: [10, 0, 5],
          spine: [2, 0, 0],
        }),
      },
      {
        time: 0.86,
        bones: pose({
          chest: [1, 0, 0],
          head: [0, 0, 5],
          leftShoulder: [4, 0, -2],
          neck: [0, 0, 2],
          rightShoulder: [4, 0, 2],
          spine: [1, 0, 0],
        }),
      },
      { time: 1.2, bones: pose({}) },
    ],
  },
  {
    id: "warm_greeting",
    baseAnimation: "wave_small",
    label: "Warm Greeting",
    description:
      "A contained friendly greeting with a small head tilt, for hello, welcome back, or soft acknowledgement.",
    duration: 1.35,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.22,
        bones: pose({
          chest: [2, 1, 0],
          head: [1, -3, 2],
          neck: [1, -1, 1],
          rightShoulder: [-2, 0, 1],
          rightUpperArm: [2, -4, -2],
          spine: [2, 1, 0],
        }),
      },
      {
        time: 0.68,
        bones: pose({
          chest: [3, 2, 0],
          head: [2, -5, 4],
          neck: [1, -2, 2],
          rightLowerArm: [1, -3, 3],
          rightShoulder: [-3, 0, 2],
          rightUpperArm: [3, -6, -3],
          spine: [3, 1, 0],
        }),
      },
      {
        time: 1.02,
        bones: pose({
          chest: [1, 0, 0],
          head: [0, -2, 1],
          neck: [0, -1, 1],
          spine: [1, 0, 0],
        }),
      },
      { time: 1.35, bones: pose({}) },
    ],
  },
  {
    id: "soft_laugh",
    baseAnimation: "idle",
    label: "Soft Laugh",
    description:
      "A small amused laugh with a shoulder bounce and shy head tilt, for warmth, teasing, or light humor.",
    duration: 1.45,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.18,
        bones: pose({
          chest: [3, 0, 0],
          head: [5, 3, -4],
          leftShoulder: [4, 0, -2],
          neck: [2, 1, -2],
          rightShoulder: [4, 0, 2],
          spine: [3, 0, 0],
        }),
      },
      {
        time: 0.46,
        bones: pose({
          chest: [-1, 0, 0],
          head: [1, 1, -2],
          leftShoulder: [2, 0, -1],
          neck: [1, 0, -1],
          rightShoulder: [2, 0, 1],
          spine: [-1, 0, 0],
        }),
      },
      {
        time: 0.78,
        bones: pose({
          chest: [4, 0, 0],
          head: [7, 5, -5],
          leftShoulder: [5, 0, -3],
          neck: [3, 2, -2],
          rightShoulder: [5, 0, 3],
          spine: [4, 0, 0],
        }),
      },
      { time: 1.45, bones: pose({}) },
    ],
  },
  {
    id: "reassure_chest",
    baseAnimation: "idle",
    label: "Reassure Chest",
    description:
      "A gentle reassurance beat that draws the gesture inward, for empathy, promise, or sincere comfort.",
    duration: 1.65,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.26,
        bones: pose({
          chest: [4, 0, 0],
          head: [3, -2, 0],
          leftLowerArm: [-10, -12, 12],
          leftShoulder: [-12, 0, 8],
          leftUpperArm: [12, -16, -12],
          neck: [2, -1, 0],
          rightLowerArm: [-10, 12, -12],
          rightShoulder: [-12, 0, -8],
          rightUpperArm: [12, 16, 12],
          spine: [4, 0, 0],
        }),
      },
      {
        time: 0.78,
        bones: pose({
          chest: [6, 0, 0],
          head: [5, -3, 0],
          leftLowerArm: [-18, -20, 20],
          leftShoulder: [-20, 0, 14],
          leftUpperArm: [20, -26, -20],
          neck: [3, -2, 0],
          rightLowerArm: [-18, 20, -20],
          rightShoulder: [-20, 0, -14],
          rightUpperArm: [20, 26, 20],
          spine: [5, 0, 0],
        }),
      },
      {
        time: 1.22,
        bones: pose({
          chest: [2, 0, 0],
          head: [2, -1, 0],
          neck: [1, 0, 0],
          spine: [2, 0, 0],
        }),
      },
      { time: 1.65, bones: pose({}) },
    ],
  },
  {
    id: "thinking_glance",
    baseAnimation: "thinking",
    label: "Thinking Glance",
    description:
      "A quieter thinking beat with a side glance, for weighing a thought without looking frozen.",
    duration: 1.55,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.24,
        bones: pose({
          chest: [1, -2, 0],
          head: [2, -8, -2],
          neck: [1, -4, -1],
          spine: [1, -1, 0],
        }),
      },
      {
        time: 0.72,
        bones: pose({
          chest: [2, -4, 0],
          head: [4, -14, -4],
          neck: [2, -7, -2],
          spine: [2, -2, 0],
        }),
      },
      {
        time: 1.1,
        bones: pose({
          chest: [1, -1, 0],
          head: [1, -5, -1],
          neck: [1, -2, 0],
          spine: [1, 0, 0],
        }),
      },
      { time: 1.55, bones: pose({}) },
    ],
  },
  {
    id: "playful_point",
    baseAnimation: "point_soft",
    label: "Playful Point",
    description:
      "A light, teasing point for calling out a detail, joking with the user, or saying 'you know what I mean'.",
    duration: 1.45,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.24,
        bones: pose({
          chest: [3, 3, 0],
          head: [1, -5, 3],
          neck: [1, -2, 1],
          rightLowerArm: [2, -4, 4],
          rightShoulder: [3, 0, 2],
          rightUpperArm: [-2, -6, -3],
          spine: [3, 2, 0],
        }),
      },
      {
        time: 0.72,
        bones: pose({
          chest: [4, 5, 0],
          head: [2, -9, 5],
          neck: [1, -4, 2],
          rightLowerArm: [3, -6, 6],
          rightShoulder: [5, 0, 3],
          rightUpperArm: [-3, -9, -5],
          spine: [4, 3, 0],
        }),
      },
      {
        time: 1.08,
        bones: pose({
          chest: [2, 1, 0],
          head: [1, -3, 2],
          neck: [0, -1, 1],
          spine: [2, 1, 0],
        }),
      },
      { time: 1.45, bones: pose({}) },
    ],
  },
  {
    id: "concerned_reach",
    baseAnimation: "idle",
    label: "Concerned Reach",
    description:
      "A careful lean and small reach, for checking on the user, concern, or gentle support.",
    duration: 1.65,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.22,
        bones: pose({
          chest: [5, -3, 0],
          head: [5, -5, -2],
          neck: [2, -2, -1],
          rightLowerArm: [4, -6, 7],
          rightShoulder: [6, 0, 4],
          rightUpperArm: [-5, -8, -5],
          spine: [5, -2, 0],
        }),
      },
      {
        time: 0.72,
        bones: pose({
          chest: [8, -5, 0],
          head: [8, -9, -3],
          neck: [3, -4, -2],
          rightLowerArm: [6, -10, 11],
          rightShoulder: [9, 0, 6],
          rightUpperArm: [-8, -12, -7],
          spine: [8, -4, 0],
        }),
      },
      {
        time: 1.16,
        bones: pose({
          chest: [4, -2, 0],
          head: [4, -4, -1],
          neck: [1, -2, -1],
          spine: [4, -1, 0],
        }),
      },
      { time: 1.65, bones: pose({}) },
    ],
  },
  {
    id: "proud_pose",
    baseAnimation: "idle",
    label: "Proud Pose",
    description:
      "A composed proud stance for confidence, small wins, or encouraging the user after progress.",
    duration: 1.5,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.24,
        bones: pose({
          chest: [-3, 0, 0],
          head: [-2, 0, 0],
          leftShoulder: [-2, 0, -1],
          neck: [-1, 0, 0],
          rightShoulder: [-2, 0, 1],
          spine: [-2, 0, 0],
        }),
      },
      {
        time: 0.72,
        bones: pose({
          chest: [-6, 0, 0],
          head: [-4, 0, 0],
          leftShoulder: [-4, 0, -2],
          neck: [-2, 0, 0],
          rightShoulder: [-4, 0, 2],
          spine: [-4, 0, 0],
        }),
      },
      {
        time: 1.08,
        bones: pose({
          chest: [-2, 0, 0],
          head: [-1, 0, 0],
          neck: [-1, 0, 0],
          spine: [-2, 0, 0],
        }),
      },
      { time: 1.5, bones: pose({}) },
    ],
  },
  {
    id: "oops_fluster",
    baseAnimation: "embarrassed",
    label: "Oops Fluster",
    description:
      "A quick embarrassed recovery for mistakes, awkward moments, or playful self-correction.",
    duration: 1.45,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.18,
        bones: pose({
          chest: [5, -1, 0],
          head: [10, 8, -6],
          leftShoulder: [3, 0, -2],
          neck: [5, 3, -2],
          rightShoulder: [5, 0, 3],
          spine: [5, 0, 0],
        }),
      },
      {
        time: 0.56,
        bones: pose({
          chest: [8, -2, 0],
          head: [14, 12, -8],
          leftShoulder: [5, 0, -3],
          neck: [7, 5, -3],
          rightShoulder: [7, 0, 4],
          spine: [7, -1, 0],
        }),
      },
      {
        time: 1.02,
        bones: pose({
          chest: [3, 0, 0],
          head: [5, 4, -2],
          neck: [2, 2, -1],
          spine: [3, 0, 0],
        }),
      },
      { time: 1.45, bones: pose({}) },
    ],
  },
  {
    id: "calm_down",
    baseAnimation: "idle",
    label: "Calm Down",
    description:
      "A slow grounding gesture for easing tension, slowing the pace, or saying 'let's breathe'.",
    duration: 1.8,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.28,
        bones: pose({
          chest: [2, 0, 0],
          head: [2, 0, 0],
          leftLowerArm: [-14, -18, 18],
          leftShoulder: [-18, 0, 12],
          leftUpperArm: [18, -24, -18],
          neck: [1, 0, 0],
          rightLowerArm: [-14, 18, -18],
          rightShoulder: [-18, 0, -12],
          rightUpperArm: [18, 24, 18],
          spine: [2, 0, 0],
        }),
      },
      {
        time: 0.92,
        bones: pose({
          chest: [5, 0, 0],
          head: [4, 0, 0],
          leftLowerArm: [-26, -34, 34],
          leftShoulder: [-32, 0, 22],
          leftUpperArm: [32, -44, -32],
          neck: [2, 0, 0],
          rightLowerArm: [-26, 34, -34],
          rightShoulder: [-32, 0, -22],
          rightUpperArm: [32, 44, 32],
          spine: [4, 0, 0],
        }),
      },
      {
        time: 1.36,
        bones: pose({
          chest: [2, 0, 0],
          head: [2, 0, 0],
          neck: [1, 0, 0],
          spine: [2, 0, 0],
        }),
      },
      { time: 1.8, bones: pose({}) },
    ],
  },
  {
    id: "firm_boundary",
    baseAnimation: "shake_no",
    label: "Firm Boundary",
    description:
      "A restrained refusal or boundary beat, for gentle correction, disagreement, or 'not that'.",
    duration: 1.35,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.18,
        bones: pose({
          chest: [-1, 0, 0],
          head: [-1, -6, 0],
          neck: [0, -3, 0],
          spine: [-1, 0, 0],
        }),
      },
      {
        time: 0.42,
        bones: pose({
          chest: [-2, 0, 0],
          head: [-2, 8, 0],
          neck: [-1, 4, 0],
          spine: [-2, 0, 0],
        }),
      },
      {
        time: 0.68,
        bones: pose({
          chest: [-1, 0, 0],
          head: [-1, -5, 0],
          neck: [0, -2, 0],
          spine: [-1, 0, 0],
        }),
      },
      {
        time: 0.98,
        bones: pose({
          chest: [0, 0, 0],
          head: [0, 2, 0],
          neck: [0, 1, 0],
        }),
      },
      { time: 1.35, bones: pose({}) },
    ],
  },
  {
    id: "sleepy_sway",
    baseAnimation: "idle",
    label: "Sleepy Sway",
    description:
      "A drowsy one-shot sway with a slow head dip, for tiredness, winding down, or cozy low energy.",
    duration: 1.85,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.28,
        bones: pose({
          chest: [4, -1, 1],
          head: [9, -3, 4],
          leftShoulder: [2, 0, -1],
          neck: [4, -1, 2],
          rightShoulder: [2, 0, 1],
          spine: [3, -1, 0],
        }),
      },
      {
        time: 0.78,
        bones: pose({
          chest: [8, 2, -2],
          head: [16, 4, -6],
          leftShoulder: [4, 0, -2],
          neck: [7, 2, -3],
          rightShoulder: [4, 0, 2],
          spine: [6, 1, -1],
        }),
      },
      {
        time: 1.22,
        bones: pose({
          chest: [5, -1, 1],
          head: [11, -2, 3],
          leftShoulder: [2, 0, -1],
          neck: [5, -1, 1],
          rightShoulder: [2, 0, 1],
          spine: [4, -1, 0],
        }),
      },
      {
        time: 1.56,
        bones: pose({
          chest: [2, 0, 0],
          head: [4, 0, 1],
          neck: [2, 0, 0],
          spine: [1, 0, 0],
        }),
      },
      { time: 1.85, bones: pose({}) },
    ],
  },
  {
    id: "bashful_hands",
    baseAnimation: "idle",
    label: "Bashful Hands",
    description:
      "A shy downward tilt with a self-conscious hand near the face or chest, for flustered or tender moments.",
    duration: 1.6,
    returnToIdle: true,
    keyframes: [
      { time: 0, bones: pose({}) },
      {
        time: 0.28,
        bones: pose({
          chest: [4, 0, 0],
          head: [12, -8, -5],
          leftLowerArm: [5, 7, -9],
          leftShoulder: [4, 0, -3],
          leftUpperArm: [-4, 5, 3],
          neck: [6, -4, 0],
          rightLowerArm: [5, -5, 7],
          rightShoulder: [4, 0, 3],
          rightUpperArm: [-4, -5, -3],
          spine: [5, 0, 0],
        }),
      },
      {
        time: 0.88,
        bones: pose({
          chest: [3, 0, 0],
          head: [10, -6, -4],
          leftLowerArm: [4, 5, -7],
          leftShoulder: [3, 0, -2],
          leftUpperArm: [-3, 4, 2],
          neck: [5, -3, 0],
          rightLowerArm: [4, -4, 6],
          rightShoulder: [3, 0, 2],
          rightUpperArm: [-3, -4, -2],
          spine: [4, 0, 0],
        }),
      },
      {
        time: 1.26,
        bones: pose({
          chest: [1, 0, 0],
          head: [4, -2, -1],
          neck: [2, -1, 0],
          spine: [1, 0, 0],
        }),
      },
      { time: 1.6, bones: pose({}) },
    ],
  },
]

export const CUSTOM_GESTURE_IDS = CUSTOM_GESTURES.map((gesture) => gesture.id)

export const CUSTOM_GESTURES_BY_ID = new Map(
  CUSTOM_GESTURES.map((gesture) => [gesture.id, gesture]),
)

export function getCustomGestureDefinition(
  gestureId: string,
  characterId?: string,
) {
  const baseGesture = CUSTOM_GESTURES_BY_ID.get(gestureId)
  if (!baseGesture) return undefined

  const override = characterId
    ? CUSTOM_GESTURE_OVERRIDES[characterId]?.[gestureId]
    : undefined

  if (!override) return baseGesture

  const sourceKeyframes = override.keyframes ?? baseGesture.keyframes
  const keyframes = sourceKeyframes.map((keyframe, index) => ({
    ...keyframe,
    bones: {
      ...keyframe.bones,
      ...(override.keyframePatches?.[index] ?? {}),
    },
  }))

  return {
    ...baseGesture,
    ...override,
    id: baseGesture.id,
    keyframes,
  } satisfies CustomGestureDefinition
}

export function getCustomGesturesForCharacter(characterId?: string) {
  return CUSTOM_GESTURES.map((gesture) =>
    getCustomGestureDefinition(gesture.id, characterId) ?? gesture,
  )
}

export function getCustomGesturePeakTime(gesture: CustomGestureDefinition) {
  if (!gesture.keyframes.length) return 0

  let bestTime = gesture.keyframes[0]!.time
  let bestScore = -1

  gesture.keyframes.forEach((keyframe) => {
    const score = Object.values(keyframe.bones).reduce((total, rotation) => {
      if (!rotation) return total
      return total + Math.abs(rotation[0]) + Math.abs(rotation[1]) + Math.abs(rotation[2])
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestTime = keyframe.time
    }
  })

  return bestTime
}
