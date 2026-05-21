import { Link } from "react-router"
import type { Character } from "../types/character"
import { JP } from "./JP"

type Props = {
  character: Character
}

export function Hero({ character }: Props) {
  return (
    <section className="watercolor-card relative overflow-hidden">
      {/* Featured ribbon — like a hand-drawn label */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full bg-rose-300 px-4 py-1.5 shadow-md shadow-rose-300/40">
        <span
          className="text-lg text-cream-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          today's friend
        </span>
        <JP className="text-[10px] font-semibold text-cream-50">今日の友達</JP>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 pt-20 md:grid-cols-[1fr_1.2fr] md:gap-10 md:p-10 md:pt-20">
        {/* Avatar — pastoral scene */}
        <div
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-sage-300"
          style={{
            background: `radial-gradient(ellipse at 50% 35%, ${character.accentColor}55 0%, var(--color-cream-50) 60%, ${character.accentColor}22 100%)`,
          }}
        >
          {/* Sky band at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-sky-300/40 to-transparent" />

          {/* Drifting clouds */}
          <span className="absolute left-8 top-12 text-5xl text-cream-50 float">☁</span>
          <span
            className="absolute right-12 top-8 text-3xl text-cream-50 float"
            style={{ animationDelay: "1s" }}
          >
            ☁
          </span>

          {/* Sun */}
          <span className="absolute right-8 top-16 text-3xl text-sun-400 float"
                style={{ animationDelay: "2s" }}>
            ☀
          </span>

          {/* Grass at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-sage-300/40 to-transparent" />

          <img
            src={character.imageUrl}
            alt={`${character.name} portrait`}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 20%" }}
          />

          {/* Subtle paper-grain texture over the image */}
          <span className="paper-grain absolute inset-0" aria-hidden="true" />

          {/* Floating leaf */}
          <span className="absolute bottom-12 left-8 text-2xl sway">🍃</span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-5">
          <div className="flex items-baseline gap-4">
            <h1
              className="text-7xl text-sage-600 md:text-8xl"
              style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
            >
              {character.name.toLowerCase()}
            </h1>
            <JP className="text-4xl font-semibold text-rose-400 md:text-5xl">
              {character.kanji}
            </JP>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span className="rounded-full border border-sage-300 bg-sage-200/50 px-3 py-1 text-sage-600">
              <JP>{character.personality.jp}</JP> · {character.personality.en}
            </span>
            {character.online && (
              <span className="flex items-center gap-1.5 rounded-full border border-sage-400 bg-cream-50 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-sage-500" />
                <span className="text-[11px] font-semibold tracking-wide text-sage-600">
                  online
                </span>
              </span>
            )}
          </div>

          {/* Greeting — soft cloud speech */}
          <div className="relative rounded-[24px] rounded-bl-[8px] border border-sky-300 bg-sky-200/40 p-5 shadow-sm">
            <span className="absolute -top-3 left-6 rounded-full bg-cream-50 px-2 text-xl text-rose-400">
              ❝
            </span>
            <span className="block text-xl font-medium text-text-primary">
              {character.greeting.en}
            </span>
          </div>

          <Link
            to={`/chat/${character.id}`}
            className="btn-earthy group inline-flex w-fit items-center gap-3 px-7 py-3 text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span>let's talk</span>
            <JP className="text-xs font-semibold not-italic">話そう</JP>
          </Link>
        </div>
      </div>
    </section>
  )
}
