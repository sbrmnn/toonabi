import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import {
  VRMLoaderPlugin,
  VRMUtils,
  type VRM,
  type VRMHumanBoneName,
} from "@pixiv/three-vrm"
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
  type VRMAnimation,
} from "@pixiv/three-vrm-animation"
import { JP } from "../JP"
import {
  getCustomGestureDefinition,
  type CustomGestureDefinition,
} from "../../lib/customGestures"
import { getMouthOpen } from "../../lib/lipsync"

type Props = {
  url: string
  kanji: string
  accentColor: string
  characterName: string
  /** Animation clip to play. Defaults to "idle". */
  animation?: string
  /** Bumps when the same animation should replay from the beginning. */
  animationNonce?: number
  /** Character-specific gesture variants can tune the same gesture per model. */
  characterId?: string
  /** Lab-only override to freeze procedural custom gestures at a specific time. */
  proceduralGesturePreviewTime?: number
  /**
   * Emotion to apply via VRM expression manager. Mapped to the closest
   * preset expression (happy/angry/sad/relaxed/surprised/neutral).
   */
  emotion?: string
  /** Fires once when the VRM model has finished loading. */
  onReady?: () => void
  /**
   * Camera framing.
   * - "default": full body, slight downward angle (used in Chat).
   * - "torso": upper-body conversational framing (used in gesture lab).
   * - "portrait": tight on head + shoulders (used to capture avatars).
   */
  framing?: "default" | "torso" | "portrait"
}

type LoadState = "loading" | "ready" | "error"

// LLM emotion names → standard VRM preset expressions.
const EMOTION_TO_PRESET: Record<string, string> = {
  neutral: "neutral",
  happy: "happy",
  gentle: "relaxed",
  affectionate: "happy",
  excited: "happy",
  playful: "happy",
  curious: "surprised",
  thoughtful: "neutral",
  sleepy: "relaxed",
  sad: "sad",
  embarrassed: "sad",
  shy: "sad",
  angry: "angry",
  surprised: "surprised",
  confident: "relaxed",
  proud: "relaxed",
  concerned: "sad",
}

const VRM_PRESETS = ["happy", "angry", "sad", "relaxed", "surprised", "neutral"]
const LOOPING_ANIMATIONS = new Set([
  "both_talk",
  "hand_talk",
  "idle",
  "relaxed",
  "sleepy",
  "thinking",
])
const ROOT_LOCKED_ANIMATIONS = new Set(["hello"])
const HELLO_LOCKED_BONES = [
  "hips",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
  "leftToes",
  "rightToes",
] as const
const ANIMATION_START_OFFSETS: Partial<Record<string, number>> = {
  hello: 1.15,
}

type LockedBoneName = (typeof HELLO_LOCKED_BONES)[number]
type BoneRestTransform = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

type ProceduralGestureState = {
  definition: CustomGestureDefinition
  keyframesByBone: Map<
    VRMHumanBoneName,
    Array<{ quaternion: THREE.Quaternion; time: number }>
  >
  startedAtMs: number
}

type BoneQuaternionRestore = {
  node: THREE.Object3D
  quaternion: THREE.Quaternion
}

const NORMALIZED_FIRST_PROCEDURAL_BONES = new Set<VRMHumanBoneName>([
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
])

function eulerDegreesToQuaternion(
  x: number,
  y: number,
  z: number,
) {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(x),
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z),
      "XYZ",
    ),
  )
}

function getProceduralBoneNode(vrm: VRM, boneName: VRMHumanBoneName) {
  if (NORMALIZED_FIRST_PROCEDURAL_BONES.has(boneName)) {
    return (
      vrm.humanoid?.getNormalizedBoneNode(boneName) ??
      vrm.humanoid?.getRawBoneNode(boneName)
    )
  }

  return (
    vrm.humanoid?.getRawBoneNode(boneName) ??
    vrm.humanoid?.getNormalizedBoneNode(boneName)
  )
}

function buildProceduralGestureState(
  definition: CustomGestureDefinition,
  vrm: VRM,
) {
  const keyframesByBone = new Map<
    VRMHumanBoneName,
    Array<{ quaternion: THREE.Quaternion; time: number }>
  >()

  definition.keyframes.forEach((keyframe) => {
    Object.entries(keyframe.bones).forEach(([boneName, rotation]) => {
      if (!rotation) return
      const typedBoneName = boneName as VRMHumanBoneName
      const node = getProceduralBoneNode(vrm, typedBoneName)
      if (!node) return

      const current = keyframesByBone.get(typedBoneName) ?? []
      current.push({
        quaternion: eulerDegreesToQuaternion(...rotation),
        time: keyframe.time,
      })
      keyframesByBone.set(typedBoneName, current)
    })
  })

  keyframesByBone.forEach((frames, boneName) => {
    const normalizedFrames = [...frames].sort((a, b) => a.time - b.time)

    if (normalizedFrames[0]?.time !== 0) {
      normalizedFrames.unshift({
        quaternion: new THREE.Quaternion(),
        time: 0,
      })
    }

    if (normalizedFrames[normalizedFrames.length - 1]?.time !== definition.duration) {
      normalizedFrames.push({
        quaternion: new THREE.Quaternion(),
        time: definition.duration,
      })
    }

    keyframesByBone.set(boneName, normalizedFrames)
  })

  if (!keyframesByBone.size) return null

  return {
    definition,
    keyframesByBone,
    startedAtMs: performance.now(),
  } satisfies ProceduralGestureState
}

function sampleProceduralQuaternion(
  frames: Array<{ quaternion: THREE.Quaternion; time: number }>,
  time: number,
) {
  if (frames.length === 1) return frames[0]!.quaternion.clone()

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1]!
    const next = frames[index]!
    if (time > next.time) continue

    const span = Math.max(0.0001, next.time - previous.time)
    const alpha = THREE.MathUtils.clamp((time - previous.time) / span, 0, 1)
    return previous.quaternion.clone().slerp(next.quaternion, alpha)
  }

  return frames[frames.length - 1]!.quaternion.clone()
}

function applyProceduralBoneDeltas(
  vrm: VRM,
  proceduralGesture: ProceduralGestureState,
  elapsed: number,
  useNormalizedFirstBones: boolean,
) {
  const restores: BoneQuaternionRestore[] = []

  proceduralGesture.keyframesByBone.forEach((frames, boneName) => {
    const normalizedFirst =
      NORMALIZED_FIRST_PROCEDURAL_BONES.has(boneName)
    if (normalizedFirst !== useNormalizedFirstBones) return

    const node = normalizedFirst
      ? (
        vrm.humanoid?.getNormalizedBoneNode(boneName) ??
        vrm.humanoid?.getRawBoneNode(boneName)
      )
      : (
        vrm.humanoid?.getRawBoneNode(boneName) ??
        vrm.humanoid?.getNormalizedBoneNode(boneName)
      )
    if (!node) return

    if (normalizedFirst) {
      restores.push({
        node,
        quaternion: node.quaternion.clone(),
      })
    }

    const deltaQuaternion = sampleProceduralQuaternion(frames, elapsed)
    node.quaternion.multiply(deltaQuaternion)
  })

  return restores
}

function restoreBoneQuaternions(restores: BoneQuaternionRestore[]) {
  restores.forEach(({ node, quaternion }) => {
    node.quaternion.copy(quaternion)
  })
}

function createHeldQuaternionTrack(
  nodeName: string,
  quaternion: THREE.Quaternion,
  duration: number,
) {
  return new THREE.QuaternionKeyframeTrack(
    `${nodeName}.quaternion`,
    [0, duration],
    [
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    ],
  )
}

function createHeldPositionTrack(
  nodeName: string,
  position: THREE.Vector3,
  duration: number,
) {
  return new THREE.VectorKeyframeTrack(
    `${nodeName}.position`,
    [0, duration],
    [
      position.x,
      position.y,
      position.z,
      position.x,
      position.y,
      position.z,
    ],
  )
}

function captureBoneRestTransforms(
  vrm: VRM,
  boneNames: readonly LockedBoneName[],
) {
  const transforms = new Map<string, BoneRestTransform>()

  boneNames.forEach((boneName) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(boneName)
    if (!node) return
    transforms.set(node.name, {
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
    })
  })

  return transforms
}

function getTransitionDuration() {
  return 0.2
}

function shouldReturnToIdle(clipName: string) {
  return Boolean(getCustomGestureDefinition(clipName)?.returnToIdle)
}

function framePortraitCamera(camera: THREE.PerspectiveCamera, vrm: VRM) {
  const head = vrm.humanoid?.getNormalizedBoneNode("head")
  if (!head) {
    camera.position.set(0, 1.45, 2.2)
    camera.lookAt(0, 1.45, 0)
    camera.updateProjectionMatrix()
    return
  }

  const headWorld = new THREE.Vector3()
  head.getWorldPosition(headWorld)
  const aimY = headWorld.y - 0.10
  camera.position.set(0, aimY, 2.2)
  camera.lookAt(0, aimY, 0)
  camera.updateProjectionMatrix()
}

function frameTorsoCamera(camera: THREE.PerspectiveCamera, vrm: VRM) {
  const head = vrm.humanoid?.getNormalizedBoneNode("head")
  if (!head) {
    camera.position.set(0, 1.32, 2.85)
    camera.lookAt(0, 1.12, 0)
    camera.updateProjectionMatrix()
    return
  }

  const headWorld = new THREE.Vector3()
  head.getWorldPosition(headWorld)
  const aimY = headWorld.y - 0.34
  camera.position.set(0, aimY + 0.1, 2.85)
  camera.lookAt(0, aimY, 0)
  camera.updateProjectionMatrix()
}

function frameDefaultCamera(
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
  vrm: VRM,
) {
  vrm.scene.updateMatrixWorld(true)

  const bounds = new THREE.Box3().setFromObject(vrm.scene)
  if (bounds.isEmpty()) {
    camera.position.set(0, 1.15, 1.9)
    camera.lookAt(0, 1.0, 0)
    camera.updateProjectionMatrix()
    return
  }

  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  const aspect = container.clientWidth / Math.max(container.clientHeight, 1)
  const compactViewport =
    container.clientHeight < 420 || aspect > 1.75

  const verticalPadding = compactViewport ? 1.08 : 0.96
  const horizontalPadding = compactViewport ? 1.3 : 1.2
  const verticalFov = THREE.MathUtils.degToRad(camera.fov)
  const horizontalFov =
    2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
  const distanceForHeight =
    (size.y * verticalPadding) / (2 * Math.tan(verticalFov / 2))
  const distanceForWidth =
    (size.x * horizontalPadding) / (2 * Math.tan(horizontalFov / 2))
  const distance = Math.max(distanceForHeight, distanceForWidth, compactViewport ? 1.62 : 1.7)
  const lookY = bounds.min.y + size.y * (compactViewport ? 0.5 : 0.53)
  const cameraY = lookY + size.y * (compactViewport ? 0.055 : 0.09)

  camera.position.set(center.x, cameraY, center.z + distance)
  camera.lookAt(center.x, lookY, center.z)
  camera.far = Math.max(20, distance + size.z + 6)
  camera.updateProjectionMatrix()
}

function revealInitialModel(
  vrm: VRM,
  initialMotionAppliedRef: { current: boolean },
  setState: (state: LoadState) => void,
  onReady?: () => void,
) {
  if (initialMotionAppliedRef.current) return
  initialMotionAppliedRef.current = true
  vrm.scene.visible = true
  setState("ready")
  onReady?.()
}

function normalizeAnimationClip(
  clipName: string,
  clip: THREE.AnimationClip,
  vrm: VRM,
  boneRestTransforms: Map<string, BoneRestTransform>,
) {
  if (!ROOT_LOCKED_ANIMATIONS.has(clipName)) return clip

  const lockedTrackNames = new Set<string>()
  const heldTracks: THREE.KeyframeTrack[] = []

  HELLO_LOCKED_BONES.forEach((boneName) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(boneName)
    if (!node) return

    lockedTrackNames.add(`${node.name}.quaternion`)
    const rest = boneRestTransforms.get(node.name)
    if (rest) {
      heldTracks.push(
        createHeldQuaternionTrack(node.name, rest.quaternion, clip.duration),
      )
    }

    if (boneName === "hips") {
      lockedTrackNames.add(`${node.name}.position`)
      if (rest) {
        heldTracks.push(
          createHeldPositionTrack(node.name, rest.position, clip.duration),
        )
      }
    }
  })

  const filteredTracks = clip.tracks.filter(
    (track) => !lockedTrackNames.has(track.name),
  )

  if (filteredTracks.length === clip.tracks.length && heldTracks.length === 0) {
    return clip
  }

  // "hello" was authored as a full-body greeting. Keep the upper-body wave,
  // but hold the hips and legs in the model's base stance so she stays planted.
  return new THREE.AnimationClip(
    clip.name,
    clip.duration,
    [...filteredTracks, ...heldTracks],
    clip.blendMode,
  )
}

function getAnimationStartOffset(clipName: string) {
  return ANIMATION_START_OFFSETS[clipName] ?? 0
}

export function VrmViewer({
  url,
  kanji,
  accentColor,
  characterName,
  animation = "idle",
  animationNonce = 0,
  characterId,
  proceduralGesturePreviewTime,
  emotion,
  onReady,
  framing = "default",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vrmRef = useRef<VRM | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const loaderRef = useRef<GLTFLoader | null>(null)
  const initialMotionAppliedRef = useRef(false)
  const boneRestTransformsRef = useRef<Map<string, BoneRestTransform>>(new Map())
  const proceduralGestureRef = useRef<ProceduralGestureState | null>(null)
  const [progress, setProgress] = useState(0)
  const [state, setState] = useState<LoadState>("loading")
  const [vrmVersion, setVrmVersion] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let frameId: number
    initialMotionAppliedRef.current = false
    currentActionRef.current = null
    proceduralGestureRef.current = null

    const scene = new THREE.Scene()
    const isPortrait = framing === "portrait"
    const isTorso = framing === "torso"
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? 26 : isTorso ? 28 : 30,
      container.clientWidth / container.clientHeight,
      0.1,
      20,
    )
    if (isPortrait) {
      camera.position.set(0, 1.45, 2.2)
      camera.lookAt(0, 1.45, 0)
    } else if (isTorso) {
      camera.position.set(0, 1.32, 2.85)
      camera.lookAt(0, 1.12, 0)
    } else {
      camera.position.set(0, 1.15, 1.9)
      camera.lookAt(0, 1.0, 0)
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xfff5e0, 0.95))
    const key = new THREE.DirectionalLight(0xffe8b3, 0.75)
    key.position.set(1, 2, 1)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xa8c4a2, 0.4)
    rim.position.set(-1, 1, -1)
    scene.add(rim)

    const clock = new THREE.Clock()

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
    loaderRef.current = loader

    loader.load(
      url,
      (gltf) => {
        if (disposed) return
        const loadedVrm = gltf.userData.vrm as VRM
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)

        const meta = loadedVrm.meta as unknown as Record<string, unknown> | null
        if (meta?.metaVersion === "0") {
          loadedVrm.scene.rotation.y = Math.PI
        }

        loadedVrm.scene.updateMatrixWorld(true)
        const head = loadedVrm.humanoid?.getNormalizedBoneNode("head")
        const headWorld = new THREE.Vector3()
        if (head) {
          head.getWorldPosition(headWorld)
          loadedVrm.scene.position.x -= headWorld.x
          loadedVrm.scene.position.z -= headWorld.z
        }
        const bounds = new THREE.Box3().setFromObject(loadedVrm.scene)
        if (!bounds.isEmpty()) {
          loadedVrm.scene.position.y -= bounds.min.y
        }
        loadedVrm.scene.updateMatrixWorld(true)
        loadedVrm.scene.visible = false
        boneRestTransformsRef.current = captureBoneRestTransforms(
          loadedVrm,
          HELLO_LOCKED_BONES,
        )

        scene.add(loadedVrm.scene)
        vrmRef.current = loadedVrm
        mixerRef.current = new THREE.AnimationMixer(loadedVrm.scene)
        setVrmVersion((v) => v + 1)

        if (isPortrait) {
          framePortraitCamera(camera, loadedVrm)
        } else if (isTorso) {
          frameTorsoCamera(camera, loadedVrm)
        } else {
          frameDefaultCamera(camera, container, loadedVrm)
        }

      },
      (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
      (error) => {
        console.error("VRM load failed:", error)
        if (!disposed) setState("error")
      },
    )

    const animate = () => {
      const delta = clock.getDelta()
      mixerRef.current?.update(delta)
      const vrm = vrmRef.current
      if (vrm) {
        const proceduralGesture = proceduralGestureRef.current
        let normalizedBoneRestores: BoneQuaternionRestore[] = []
        let clampedProceduralElapsed: number | null = null
        if (proceduralGesture) {
          const elapsed = proceduralGesturePreviewTime ?? (
            (performance.now() - proceduralGesture.startedAtMs) / 1000
          )

          if (proceduralGesturePreviewTime == null && elapsed >= proceduralGesture.definition.duration) {
            proceduralGestureRef.current = null
          } else {
            clampedProceduralElapsed = THREE.MathUtils.clamp(
              elapsed,
              0,
              proceduralGesture.definition.duration,
            )
            normalizedBoneRestores = applyProceduralBoneDeltas(
              vrm,
              proceduralGesture,
              clampedProceduralElapsed,
              true,
            )
          }
        }

        vrm.expressionManager?.setValue("aa", getMouthOpen())
        vrm.update(delta)
        restoreBoneQuaternions(normalizedBoneRestores)

        if (proceduralGesture && clampedProceduralElapsed !== null) {
          applyProceduralBoneDeltas(
            vrm,
            proceduralGesture,
            clampedProceduralElapsed,
            false,
          )
        }
      }
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      if (vrmRef.current) {
        if (isPortrait) {
          framePortraitCamera(camera, vrmRef.current)
        } else if (isTorso) {
          frameTorsoCamera(camera, vrmRef.current)
        } else {
          frameDefaultCamera(camera, container, vrmRef.current)
        }
      } else {
        camera.updateProjectionMatrix()
      }
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      proceduralGestureRef.current = null
      currentActionRef.current?.stop()
      currentActionRef.current = null
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      const vrm = vrmRef.current
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene)
        scene.remove(vrm.scene)
        vrmRef.current = null
      }
      boneRestTransformsRef.current = new Map()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [url, framing])

  // Swap animation clip without reloading the VRM model.
  useEffect(() => {
    const vrm = vrmRef.current
    const loader = loaderRef.current
    const mixer = mixerRef.current
    if (!vrm || !loader || !mixer) return
    let cancelled = false
    let returnToIdleTimer: number | null = null

    const clipName = animation || "idle"
    const clearReturnToIdleTimer = () => {
      if (returnToIdleTimer !== null) {
        window.clearTimeout(returnToIdleTimer)
        returnToIdleTimer = null
      }
    }
    const scheduleReturnToIdle = (
      sourceAction: THREE.AnimationAction | null,
      delayMs: number,
    ) => {
      clearReturnToIdleTimer()
      returnToIdleTimer = window.setTimeout(() => {
        if (cancelled || currentActionRef.current !== sourceAction) return
        loadAndPlayClip("idle").catch((err) => {
          console.warn('Animation "idle" failed during return-to-idle:', err)
        })
      }, Math.max(180, delayMs))
    }
    const playClip = (nextClipName: string, clip: THREE.AnimationClip) => {
      proceduralGestureRef.current = null
      const transitionDuration = getTransitionDuration()
      const nextAction = mixer.clipAction(clip)
      const shouldLoop = LOOPING_ANIMATIONS.has(nextClipName)
      const holdFinalPose = !shouldLoop

      nextAction.setLoop(
        holdFinalPose ? THREE.LoopOnce : THREE.LoopRepeat,
        holdFinalPose ? 1 : Infinity,
      )
      nextAction.clampWhenFinished = holdFinalPose
      nextAction.reset()
      nextAction.time = getAnimationStartOffset(nextClipName)
      nextAction.fadeIn(transitionDuration).play()
      if (currentActionRef.current && currentActionRef.current !== nextAction) {
        currentActionRef.current.fadeOut(transitionDuration)
      }
      currentActionRef.current = nextAction
      mixer.update(0)
      vrm.update(0)

      revealInitialModel(vrm, initialMotionAppliedRef, setState, onReady)

      clearReturnToIdleTimer()

      if (shouldReturnToIdle(nextClipName)) {
        scheduleReturnToIdle(
          nextAction,
          (clip.duration - getAnimationStartOffset(nextClipName)) * 1000,
        )
      }
    }

    const loadAndPlayClip = async (nextClipName: string) => {
      const customGesture = getCustomGestureDefinition(nextClipName, characterId)
      if (customGesture) {
        const baseAnimation = customGesture.baseAnimation ?? "idle"
        const currentClipName = currentActionRef.current?.getClip().name ?? null
        if (!currentActionRef.current || currentClipName !== baseAnimation) {
          await loadAndPlayClip(baseAnimation)
          if (cancelled) return
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve())
          })
        }
        const proceduralGesture = buildProceduralGestureState(customGesture, vrm)
        if (!proceduralGesture) {
          revealInitialModel(vrm, initialMotionAppliedRef, setState, onReady)
          return
        }
        proceduralGestureRef.current = proceduralGesture
        revealInitialModel(vrm, initialMotionAppliedRef, setState, onReady)
        if (customGesture.returnToIdle && proceduralGesturePreviewTime == null) {
          scheduleReturnToIdle(
            currentActionRef.current,
            customGesture.duration * 1000,
          )
        }
        return
      }

      const gltf = await loader.loadAsync(`/animations/${nextClipName}.vrma`)
      if (cancelled) return
      const animations = gltf.userData.vrmAnimations as
        | VRMAnimation[]
        | undefined
      if (!animations?.length) {
        revealInitialModel(vrm, initialMotionAppliedRef, setState, onReady)
        return
      }
      const rawClip = createVRMAnimationClip(animations[0], vrm)
      const clip = normalizeAnimationClip(
        nextClipName,
        rawClip,
        vrm,
        boneRestTransformsRef.current,
      )
      playClip(nextClipName, clip)
    }

    loadAndPlayClip(clipName).catch((err) => {
      console.warn(`Animation "${clipName}" failed; staying on previous clip:`, err)
      revealInitialModel(vrm, initialMotionAppliedRef, setState, onReady)
    })

    return () => {
      cancelled = true
      clearReturnToIdleTimer()
    }
  }, [animation, animationNonce, characterId, proceduralGesturePreviewTime, vrmVersion])

  // Apply emotion via the VRM expression manager.
  useEffect(() => {
    const vrm = vrmRef.current
    if (!vrm?.expressionManager) return
    const preset = EMOTION_TO_PRESET[emotion ?? "neutral"] ?? "neutral"
    VRM_PRESETS.forEach((name) => {
      vrm.expressionManager?.setValue(name, name === preset ? 1.0 : 0.0)
    })
  }, [emotion, vrmVersion])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={
        framing === "portrait"
          ? undefined
          : {
              backgroundImage: `radial-gradient(circle at 50% 40%, ${accentColor}1f, transparent 70%)`,
            }
      }
    >
      {state !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-[180px] font-light leading-none opacity-30 md:text-[260px]"
            translate="no"
            lang="ja"
            style={{ color: accentColor }}
          >
            {kanji}
          </span>

          {state === "loading" && (
            <div className="absolute bottom-8 flex flex-col items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-cream-100">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "var(--color-sage-400)",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sage-600"
                   style={{ fontFamily: "var(--font-display)" }}>
                <JP className="not-italic">読み込み中</JP>
                <span className="opacity-50">·</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-center">
              <JP className="text-xs font-semibold text-rose-400">
                読み込みに失敗しました
              </JP>
              <span className="text-sm italic text-text-secondary"
                    style={{ fontFamily: "var(--font-display)" }}>
                couldn't load {characterName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
