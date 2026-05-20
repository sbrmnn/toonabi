import { getGestureStepMs } from "./gesturePlayback"

export type GestureAuditCombo = {
  description: string
  emotion: string
  gestures: string[]
  id: string
  label: string
  note: string
}

export const GESTURE_AUDIT_COMBOS: GestureAuditCombo[] = [
  {
    id: "warm_welcome",
    label: "Warm Welcome",
    emotion: "happy",
    gestures: ["warm_greeting", "listening_nod", "soft_explain"],
    description: "Friendly opener that settles into attentive conversation.",
    note: "Checks whether greeting energy can land into a calm explanation without a snap.",
  },
  {
    id: "curious_followup",
    label: "Curious Follow-Up",
    emotion: "curious",
    gestures: ["curious_peek", "thinking_glance", "soft_explain"],
    description: "Lean in, consider, then answer carefully.",
    note: "Useful for seeing if head and torso rotations unwind cleanly across a question-shaped reply.",
  },
  {
    id: "gentle_reassurance",
    label: "Gentle Reassurance",
    emotion: "gentle",
    gestures: ["listening_nod", "reassure_chest", "calm_down"],
    description: "Listen first, comfort second, settle last.",
    note: "Should feel supportive rather than melodramatic, especially on taller rigs.",
  },
  {
    id: "playful_tease",
    label: "Playful Tease",
    emotion: "playful",
    gestures: ["soft_laugh", "playful_point", "tiny_shrug"],
    description: "A small laugh that lands in a light callout and shrug.",
    note: "Good stress test for asymmetry, timing, and whether teasing reads as charming instead of twitchy.",
  },
  {
    id: "steady_confidence",
    label: "Steady Confidence",
    emotion: "confident",
    gestures: ["proud_pose", "soft_explain", "reassure_chest"],
    description: "Confidence that opens outward, then becomes constructive.",
    note: "Shows whether chest-open poses can return to a gentler center without looking stiff.",
  },
  {
    id: "careful_boundary",
    label: "Careful Boundary",
    emotion: "concerned",
    gestures: ["concerned_reach", "firm_boundary", "soft_explain"],
    description: "Concern, correction, then calm clarification.",
    note: "Useful for checking stronger directional transitions and making sure the refusal beat does not over-swing.",
  },
  {
    id: "bashful_recovery",
    label: "Bashful Recovery",
    emotion: "embarrassed",
    gestures: ["oops_fluster", "bashful_hands", "soft_laugh"],
    description: "A stumble that softens into shy recovery.",
    note: "Should read like one emotional arc, not three separate poses pasted together.",
  },
  {
    id: "sleepy_winddown",
    label: "Sleepy Wind-Down",
    emotion: "sleepy",
    gestures: ["sleepy_sway", "listening_nod", "calm_down"],
    description: "Drowsy sway into a small acknowledgment and soft landing.",
    note: "Particularly important for sleeve and skirt silhouettes, where wide sway can feel floaty.",
  },
  {
    id: "thoughtful_checkin",
    label: "Thoughtful Check-In",
    emotion: "thoughtful",
    gestures: ["thinking_glance", "concerned_reach", "reassure_chest"],
    description: "Reflect, reach out, then reassure.",
    note: "Checks whether inward thinking can flow into outward empathy without breaking character.",
  },
  {
    id: "hello_goodbye_edges",
    label: "Hello / Goodbye Edges",
    emotion: "happy",
    gestures: ["hello", "warm_greeting", "wave_big"],
    description: "Edge-case pass for literal open and close gestures.",
    note: "Not a normal chat combo, but good for checking the most exaggerated bookend motions on every rig.",
  },
]

export function getGestureAuditCombo(comboId: string | null | undefined) {
  if (!comboId) return null
  return GESTURE_AUDIT_COMBOS.find((combo) => combo.id === comboId) ?? null
}

export function getGestureComboDurationMs(
  gestures: string[],
  characterId?: string,
) {
  return gestures.reduce(
    (total, gesture) => total + getGestureStepMs(gesture, characterId),
    0,
  )
}

export function getGestureLabel(gestureId: string) {
  switch (gestureId) {
    case "hello":
      return "Hello"
    case "idle":
      return "Idle"
    case "wave_big":
      return "Wave Big"
    default:
      return gestureId
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}
