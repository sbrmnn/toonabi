export type AnimDirective = {
  emotion: string
  gestures: string[]
  mouthStyle?: string
  intensity?: number
  reengage?: "soon" | "later" | "leave_space" | "none"
}

const OPEN = "[[ANIM "
const CLOSE = "]]"

export type AnimParseResult = {
  directive: AnimDirective | null
  stripped: string
  done: boolean
}

// Pulls a [[ANIM {...}]] directive off the front of a streaming buffer.
// `done` is true once we've either parsed it or decided there isn't one
// (first newline seen before the directive starts, or the buffer grew past
// 512 chars without a closing "]]").
export function parseAnim(buffer: string): AnimParseResult {
  const trimmed = buffer.trimStart()
  const leading = buffer.length - trimmed.length
  const hiddenPrefix = buffer.slice(0, leading)

  if (!trimmed.startsWith(OPEN)) {
    // Might still be a prefix of OPEN that hasn't fully arrived yet.
    if (trimmed.length < OPEN.length && OPEN.startsWith(trimmed)) {
      return { directive: null, stripped: hiddenPrefix, done: false }
    }
    // First non-prefix content isn't a directive — give up.
    return { directive: null, stripped: buffer, done: true }
  }

  const closeIdx = trimmed.indexOf(CLOSE, OPEN.length)
  if (closeIdx === -1) {
    if (buffer.length > 512) {
      // Runaway — bail out without stripping.
      return { directive: null, stripped: buffer, done: true }
    }
    return { directive: null, stripped: hiddenPrefix, done: false }
  }

  const jsonText = trimmed.slice(OPEN.length, closeIdx)
  let after = closeIdx + CLOSE.length
  // Skip a single trailing newline so the visible text starts cleanly.
  if (trimmed[after] === "\r") after += 1
  if (trimmed[after] === "\n") after += 1

  let directive: AnimDirective | null = null
  try {
    directive = JSON.parse(jsonText) as AnimDirective
  } catch {
    directive = null
  }
  return {
    directive,
    stripped: buffer.slice(0, leading) + trimmed.slice(after),
    done: true,
  }
}
