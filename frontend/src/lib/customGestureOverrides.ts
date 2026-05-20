import type {
  CharacterCustomGestureOverrides,
  CustomGestureKeyframe,
  CustomGestureVariant,
} from "./customGestures"

const conversationalExplain: CustomGestureKeyframe[] = [
  { time: 0, bones: {} },
  {
    time: 0.24,
    bones: {
      chest: [2, 1, 0],
      head: [1, -2, 0],
      leftLowerArm: [1, 3, -3],
      leftShoulder: [3, 0, -2],
      leftUpperArm: [-2, 3, 2],
      neck: [1, -1, 0],
      rightLowerArm: [1, -3, 3],
      rightShoulder: [4, 0, 3],
      rightUpperArm: [-2, -4, -2],
      spine: [2, 1, 0],
    },
  },
  {
    time: 0.78,
    bones: {
      chest: [3, 1, 0],
      head: [0, 2, 0],
      leftLowerArm: [2, 5, -5],
      leftShoulder: [5, 0, -3],
      leftUpperArm: [-3, 6, 4],
      neck: [0, 1, 0],
      rightLowerArm: [2, -5, 5],
      rightShoulder: [6, 0, 4],
      rightUpperArm: [-3, -7, -4],
      spine: [3, 1, 0],
    },
  },
  {
    time: 1.22,
    bones: {
      chest: [2, 0, 0],
      leftLowerArm: [1, 3, -3],
      leftShoulder: [3, 0, -2],
      leftUpperArm: [-2, 4, 2],
      rightLowerArm: [1, -3, 3],
      rightShoulder: [3, 0, 2],
      rightUpperArm: [-2, -4, -2],
      spine: [2, 0, 0],
    },
  },
  { time: 1.75, bones: {} },
]

const smallUncertainShrug: CustomGestureKeyframe[] = [
  { time: 0, bones: {} },
  {
    time: 0.2,
    bones: {
      head: [0, 0, 5],
      leftShoulder: [3, 0, -2],
      neck: [0, 0, 2],
      rightShoulder: [3, 0, 2],
    },
  },
  {
    time: 0.52,
    bones: {
      chest: [1, 0, 0],
      head: [0, 0, 8],
      leftShoulder: [5, 0, -3],
      neck: [0, 0, 3],
      rightShoulder: [5, 0, 3],
      spine: [1, 0, 0],
    },
  },
  {
    time: 0.86,
    bones: {
      head: [0, 0, 3],
      leftShoulder: [2, 0, -1],
      neck: [0, 0, 1],
      rightShoulder: [2, 0, 1],
    },
  },
  { time: 1.2, bones: {} },
]

const longDressSleepySway: CustomGestureKeyframe[] = [
  { time: 0, bones: {} },
  {
    time: 0.3,
    bones: {
      chest: [3, -1, 0],
      head: [7, -2, 3],
      leftShoulder: [1, 0, -1],
      neck: [3, -1, 1],
      rightShoulder: [1, 0, 1],
      spine: [2, -1, 0],
    },
  },
  {
    time: 0.82,
    bones: {
      chest: [5, 1, -1],
      head: [12, 3, -4],
      leftShoulder: [2, 0, -1],
      neck: [5, 1, -2],
      rightShoulder: [2, 0, 1],
      spine: [4, 1, 0],
    },
  },
  {
    time: 1.28,
    bones: {
      chest: [3, -1, 0],
      head: [8, -1, 2],
      leftShoulder: [1, 0, -1],
      neck: [3, 0, 1],
      rightShoulder: [1, 0, 1],
      spine: [2, 0, 0],
    },
  },
  {
    time: 1.6,
    bones: {
      chest: [1, 0, 0],
      head: [3, 0, 0],
      neck: [1, 0, 0],
      spine: [1, 0, 0],
    },
  },
  { time: 1.85, bones: {} },
]

const longDressGestureOverrides = {
  soft_explain: {
    baseAnimation: "idle",
    description:
      "A low conversational explain variant tuned for long sleeves and taller silhouettes.",
    duration: 1.75,
    keyframes: conversationalExplain,
  },
  tiny_shrug: {
    baseAnimation: "idle",
    description:
      "A compact uncertainty beat that keeps the hands low on long-sleeve or taller rigs.",
    duration: 1.2,
    keyframes: smallUncertainShrug,
  },
  sleepy_sway: {
    baseAnimation: "idle",
    description:
      "A slower, smaller sleepy sway that avoids leg and skirt exaggeration on taller rigs.",
    duration: 1.85,
    keyframes: longDressSleepySway,
  },
}

const sakiGestureOverrides = {
  warm_greeting: {
    description:
      "A brighter greeting tuned for Saki so the hello reads more clearly and lands with more buoyant energy.",
    keyframePatches: {
      1: {
        chest: [3, 2, 0],
        head: [2, -5, 3],
        neck: [1, -2, 2],
        rightShoulder: [-3, 0, 2],
        rightUpperArm: [3, -6, -3],
        spine: [3, 2, 0],
      },
      2: {
        chest: [5, 3, 0],
        head: [4, -8, 5],
        neck: [2, -3, 3],
        rightLowerArm: [2, -4, 4],
        rightShoulder: [-5, 0, 3],
        rightUpperArm: [5, -9, -5],
        spine: [4, 2, 0],
      },
    },
  },
  soft_laugh: {
    description:
      "A springier laugh pass for Saki with a little more shoulder bounce and grin-forward tilt.",
    keyframePatches: {
      1: {
        chest: [4, 0, 0],
        head: [6, 4, -4],
        leftShoulder: [5, 0, -3],
        neck: [3, 2, -2],
        rightShoulder: [5, 0, 3],
        spine: [4, 0, 0],
      },
      3: {
        chest: [5, 0, 0],
        head: [8, 6, -5],
        leftShoulder: [6, 0, -3],
        neck: [4, 3, -2],
        rightShoulder: [6, 0, 3],
        spine: [5, 0, 0],
      },
    },
  },
  playful_point: {
    description:
      "A more extroverted teasing point for Saki, with a clearer forward callout.",
    keyframePatches: {
      1: {
        chest: [4, 4, 0],
        head: [2, -6, 4],
        neck: [1, -3, 2],
        rightLowerArm: [3, -5, 5],
        rightShoulder: [4, 0, 3],
        rightUpperArm: [-3, -8, -4],
        spine: [4, 3, 0],
      },
      2: {
        chest: [5, 6, 0],
        head: [3, -11, 6],
        neck: [2, -5, 3],
        rightLowerArm: [4, -7, 7],
        rightShoulder: [6, 0, 4],
        rightUpperArm: [-4, -11, -6],
        spine: [5, 4, 0],
      },
    },
  },
  proud_pose: {
    description:
      "A slightly more open proud beat for Saki so encouragement reads as lively instead of reserved.",
    keyframePatches: {
      1: {
        chest: [-4, 0, 0],
        head: [-2, 0, 1],
        leftShoulder: [-3, 0, -2],
        rightShoulder: [-3, 0, 2],
        spine: [-3, 0, 0],
      },
      2: {
        chest: [-7, 0, 0],
        head: [-4, 0, 1],
        leftShoulder: [-5, 0, -3],
        rightShoulder: [-5, 0, 3],
        spine: [-5, 0, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const yukiGestureOverrides = {
  curious_peek: {
    description:
      "A quieter curiosity pass for Yuki so the lean-in feels attentive and thoughtful rather than pushy.",
    keyframePatches: {
      1: {
        chest: [2, -2, 0],
        head: [5, -7, -1],
        neck: [1, 2, 2],
        spine: [3, -2, 0],
      },
      2: {
        chest: [4, -4, 0],
        head: [7, -11, -2],
        neck: [1, 4, 3],
        spine: [4, -4, 0],
      },
    },
  },
  reassure_chest: {
    description:
      "A smaller reassurance beat for Yuki that keeps the comfort sincere without feeling theatrical.",
    keyframePatches: {
      1: {
        chest: [3, 0, 0],
        head: [2, -2, 0],
        leftLowerArm: [-7, -9, 9],
        leftShoulder: [-8, 0, 6],
        leftUpperArm: [8, -11, -8],
        rightLowerArm: [-7, 9, -9],
        rightShoulder: [-8, 0, -6],
        rightUpperArm: [8, 11, 8],
        spine: [3, 0, 0],
      },
      2: {
        chest: [4, 0, 0],
        head: [3, -2, 0],
        leftLowerArm: [-12, -14, 14],
        leftShoulder: [-13, 0, 10],
        leftUpperArm: [13, -18, -13],
        rightLowerArm: [-12, 14, -14],
        rightShoulder: [-13, 0, -10],
        rightUpperArm: [13, 18, 13],
        spine: [4, 0, 0],
      },
    },
  },
  calm_down: {
    description:
      "A softer grounding motion for Yuki, with less arm spread and a more contained settle.",
    keyframePatches: {
      1: {
        chest: [1, 0, 0],
        head: [1, 0, 0],
        leftLowerArm: [-10, -12, 12],
        leftShoulder: [-12, 0, 8],
        leftUpperArm: [12, -16, -12],
        rightLowerArm: [-10, 12, -12],
        rightShoulder: [-12, 0, -8],
        rightUpperArm: [12, 16, 12],
        spine: [1, 0, 0],
      },
      2: {
        chest: [3, 0, 0],
        head: [3, 0, 0],
        leftLowerArm: [-18, -23, 23],
        leftShoulder: [-22, 0, 15],
        leftUpperArm: [22, -31, -22],
        rightLowerArm: [-18, 23, -23],
        rightShoulder: [-22, 0, -15],
        rightUpperArm: [22, 31, 22],
        spine: [3, 0, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const hanaGestureOverrides = {
  warm_greeting: {
    description:
      "A friendlier, slightly brighter greeting tuned for Hana's taller silhouette.",
    keyframePatches: {
      1: {
        chest: [3, 2, 0],
        head: [2, -4, 3],
        neck: [1, -2, 2],
        rightShoulder: [-3, 0, 2],
        rightUpperArm: [3, -5, -3],
        spine: [3, 2, 0],
      },
      2: {
        chest: [4, 3, 0],
        head: [3, -6, 5],
        rightLowerArm: [2, -4, 4],
        rightShoulder: [-4, 0, 3],
        rightUpperArm: [4, -7, -4],
        spine: [4, 2, 0],
      },
    },
  },
  proud_pose: {
    description:
      "A clearer, lifted proud beat for Hana that keeps the energy upbeat without widening the silhouette too much.",
    keyframePatches: {
      1: {
        chest: [-4, 0, 0],
        head: [-2, 0, 1],
        leftShoulder: [-3, 0, -2],
        rightShoulder: [-3, 0, 2],
        spine: [-3, 0, 0],
      },
      2: {
        chest: [-7, 0, 0],
        head: [-4, 0, 1],
        leftShoulder: [-5, 0, -3],
        rightShoulder: [-5, 0, 3],
        spine: [-5, 0, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const aoiGestureOverrides = {
  tiny_shrug: {
    description:
      "A slightly more asymmetrical shrug for Aoi so uncertainty lands with dry wit instead of pure softness.",
    keyframePatches: {
      1: {
        head: [0, -2, 7],
        leftShoulder: [5, 0, -2],
        rightShoulder: [7, 0, 4],
      },
      2: {
        chest: [1, 0, 0],
        head: [0, -3, 11],
        leftShoulder: [8, 0, -4],
        neck: [0, -1, 5],
        rightShoulder: [11, 0, 6],
      },
    },
  },
  thinking_glance: {
    description:
      "A drier side-glance pass for Aoi, with a more pointed turn of the head.",
    keyframePatches: {
      1: {
        head: [2, -10, -2],
        neck: [1, -5, -1],
      },
      2: {
        chest: [2, -3, 0],
        head: [4, -17, -4],
        neck: [2, -8, -2],
      },
      3: {
        head: [1, -7, -1],
        neck: [1, -3, 0],
      },
    },
  },
  firm_boundary: {
    description:
      "A crisper refusal beat for Aoi so correction reads as precise and deliberate.",
    keyframePatches: {
      1: {
        head: [-1, -8, 0],
        neck: [0, -4, 0],
      },
      2: {
        chest: [-2, 0, 0],
        head: [-2, 10, 0],
        neck: [-1, 5, 0],
      },
      3: {
        head: [-1, -7, 0],
        neck: [0, -3, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const koharuGestureOverrides = {
  warm_greeting: {
    description:
      "A softer greeting tuned for Koharu so it feels welcoming and restful instead of peppy.",
    keyframePatches: {
      1: {
        chest: [1, 1, 0],
        head: [2, -2, 2],
        neck: [1, -1, 1],
        rightShoulder: [-1, 0, 1],
        rightUpperArm: [1, -3, -1],
        spine: [1, 1, 0],
      },
      2: {
        chest: [2, 1, 0],
        head: [3, -4, 3],
        neck: [1, -2, 1],
        rightLowerArm: [1, -2, 2],
        rightShoulder: [-2, 0, 1],
        rightUpperArm: [2, -5, -2],
        spine: [2, 1, 0],
      },
    },
  },
  reassure_chest: {
    description:
      "A gentler, more nurturing reassurance for Koharu with lower hands and less chest lift.",
    keyframePatches: {
      1: {
        chest: [3, 0, 0],
        head: [2, -2, 0],
        leftLowerArm: [-8, -10, 10],
        leftShoulder: [-10, 0, 7],
        leftUpperArm: [10, -14, -10],
        rightLowerArm: [-8, 10, -10],
        rightShoulder: [-10, 0, -7],
        rightUpperArm: [10, 14, 10],
        spine: [3, 0, 0],
      },
      2: {
        chest: [5, 0, 0],
        head: [4, -3, 0],
        leftLowerArm: [-14, -16, 16],
        leftShoulder: [-16, 0, 11],
        leftUpperArm: [16, -22, -16],
        rightLowerArm: [-14, 16, -16],
        rightShoulder: [-16, 0, -11],
        rightUpperArm: [16, 22, 16],
        spine: [4, 0, 0],
      },
    },
  },
  concerned_reach: {
    description:
      "A kinder, less urgent reach for Koharu so concern feels comforting rather than alarmed.",
    keyframePatches: {
      1: {
        chest: [4, -2, 0],
        head: [4, -4, -1],
        neck: [2, -2, -1],
        rightLowerArm: [3, -4, 5],
        rightShoulder: [4, 0, 3],
        rightUpperArm: [-4, -6, -4],
        spine: [4, -1, 0],
      },
      2: {
        chest: [6, -3, 0],
        head: [6, -7, -2],
        neck: [2, -3, -1],
        rightLowerArm: [4, -7, 8],
        rightShoulder: [6, 0, 4],
        rightUpperArm: [-6, -9, -5],
        spine: [6, -2, 0],
      },
    },
  },
  calm_down: {
    description:
      "A slower-feeling grounded settle for Koharu with a reassuring, tea-time softness.",
    duration: 1.9,
    keyframePatches: {
      1: {
        leftLowerArm: [-12, -15, 15],
        leftShoulder: [-15, 0, 10],
        leftUpperArm: [15, -21, -15],
        rightLowerArm: [-12, 15, -15],
        rightShoulder: [-15, 0, -10],
        rightUpperArm: [15, 21, 15],
      },
      2: {
        chest: [4, 0, 0],
        head: [3, 0, 0],
        leftLowerArm: [-22, -28, 28],
        leftShoulder: [-27, 0, 18],
        leftUpperArm: [27, -37, -27],
        rightLowerArm: [-22, 28, -28],
        rightShoulder: [-27, 0, -18],
        rightUpperArm: [27, 37, 27],
        spine: [3, 0, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const meiGestureOverrides = {
  curious_peek: {
    description:
      "A brighter forward curiosity pass for Mei that leans into her inquisitive personality without losing balance.",
    keyframePatches: {
      1: {
        chest: [4, -5, 0],
        head: [8, -11, -3],
        neck: [2, 5, 4],
        spine: [5, -5, 0],
      },
      2: {
        chest: [7, -8, 0],
        head: [11, -18, -5],
        neck: [3, 8, 6],
        spine: [7, -8, 0],
      },
    },
  },
  playful_point: {
    description:
      "A punchier playful point for Mei so excited callouts read immediately even with the fuller skirt silhouette.",
    keyframePatches: {
      1: {
        chest: [4, 4, 0],
        head: [2, -6, 4],
        neck: [1, -3, 2],
        rightLowerArm: [3, -5, 5],
        rightShoulder: [4, 0, 3],
        rightUpperArm: [-3, -8, -4],
        spine: [4, 3, 0],
      },
      2: {
        chest: [5, 6, 0],
        head: [3, -10, 6],
        neck: [2, -5, 3],
        rightLowerArm: [4, -7, 7],
        rightShoulder: [6, 0, 4],
        rightUpperArm: [-4, -11, -6],
        spine: [5, 4, 0],
      },
    },
  },
  bashful_hands: {
    description:
      "A more believable shy beat for Mei that keeps the hands inward instead of reading too poised.",
    keyframePatches: {
      1: {
        head: [10, -7, -4],
        leftLowerArm: [3, 4, -6],
        leftShoulder: [3, 0, -2],
        leftUpperArm: [-3, 4, 2],
        rightLowerArm: [3, -3, 5],
        rightShoulder: [3, 0, 2],
        rightUpperArm: [-3, -4, -2],
      },
      2: {
        head: [8, -5, -3],
        leftLowerArm: [3, 3, -5],
        leftUpperArm: [-3, 3, 2],
        rightLowerArm: [3, -3, 4],
        rightUpperArm: [-3, -3, -2],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

const akiraGestureOverrides = {
  soft_explain: {
    description:
      "A steadier explanation pass for Akira with lower arm flare and a more grounded posture.",
    keyframePatches: {
      1: {
        chest: [1, 1, 0],
        head: [0, -1, 0],
        leftLowerArm: [1, 2, -2],
        leftShoulder: [2, 0, -1],
        leftUpperArm: [-1, 2, 1],
        neck: [0, -1, 0],
        rightLowerArm: [1, -2, 2],
        rightShoulder: [3, 0, 2],
        rightUpperArm: [-1, -3, -1],
        spine: [1, 1, 0],
      },
      2: {
        chest: [2, 1, 0],
        head: [0, 1, 0],
        leftLowerArm: [1, 4, -4],
        leftShoulder: [4, 0, -2],
        leftUpperArm: [-2, 4, 3],
        rightLowerArm: [1, -4, 4],
        rightShoulder: [5, 0, 3],
        rightUpperArm: [-2, -5, -3],
        spine: [2, 1, 0],
      },
    },
  },
  reassure_chest: {
    description:
      "A grounded reassurance for Akira with broader shoulders and less coy inwardness.",
    keyframePatches: {
      1: {
        chest: [3, 0, 0],
        head: [2, -1, 0],
        leftLowerArm: [-8, -10, 10],
        leftShoulder: [-10, 0, 6],
        leftUpperArm: [10, -13, -10],
        rightLowerArm: [-8, 10, -10],
        rightShoulder: [-10, 0, -6],
        rightUpperArm: [10, 13, 10],
        spine: [3, 0, 0],
      },
      2: {
        chest: [5, 0, 0],
        head: [3, -2, 0],
        leftLowerArm: [-14, -16, 16],
        leftShoulder: [-16, 0, 10],
        leftUpperArm: [16, -21, -16],
        rightLowerArm: [-14, 16, -16],
        rightShoulder: [-16, 0, -10],
        rightUpperArm: [16, 21, 16],
        spine: [4, 0, 0],
      },
    },
  },
  concerned_reach: {
    description:
      "A steadier support reach for Akira, with less delicate tilt and more direct presence.",
    keyframePatches: {
      1: {
        chest: [4, -2, 0],
        head: [4, -4, -1],
        neck: [1, -2, -1],
        rightLowerArm: [3, -5, 6],
        rightShoulder: [5, 0, 3],
        rightUpperArm: [-4, -7, -4],
        spine: [4, -1, 0],
      },
      2: {
        chest: [6, -4, 0],
        head: [6, -7, -2],
        neck: [2, -3, -1],
        rightLowerArm: [5, -8, 9],
        rightShoulder: [7, 0, 4],
        rightUpperArm: [-6, -10, -5],
        spine: [6, -3, 0],
      },
    },
  },
  proud_pose: {
    description:
      "A more square, composed proud stance for Akira so confidence reads grounded rather than dainty.",
    keyframePatches: {
      1: {
        chest: [-4, 0, 0],
        head: [-1, 0, 0],
        leftShoulder: [-3, 0, -1],
        rightShoulder: [-3, 0, 1],
        spine: [-3, 0, 0],
      },
      2: {
        chest: [-7, 0, 0],
        head: [-2, 0, 0],
        leftShoulder: [-5, 0, -2],
        rightShoulder: [-5, 0, 2],
        spine: [-5, 0, 0],
      },
    },
  },
} satisfies Partial<Record<string, CustomGestureVariant>>

export const CUSTOM_GESTURE_OVERRIDES: CharacterCustomGestureOverrides = {
  saki: sakiGestureOverrides,
  yuki: yukiGestureOverrides,
  hana: {
    ...longDressGestureOverrides,
    ...hanaGestureOverrides,
  },
  aoi: aoiGestureOverrides,
  koharu: koharuGestureOverrides,
  mei: {
    ...longDressGestureOverrides,
    ...meiGestureOverrides,
  },
  akira: akiraGestureOverrides,
}
