import { Link } from "react-router"
import type { Character } from "../types/character"
import { JP } from "./JP"

type Props = {
  character: Character
}

const NATURE_ACCENT: Record<string, string> = {
  saki: "🌻",
  yuki: "❄",
  hana: "🌸",
  aoi: "🌿",
  koharu: "🌷",
  mei: "🍃",
}

export function CharacterCard({ character }: Props) {
  const accent = NATURE_ACCENT[character.id] ?? ""

  return (
    <Link
      to={`/chat/${character.id}`}
      className="watercolor-card group relative flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(74,63,58,0.12)]"
    >
      {/* Avatar — soft watercolor wash */}
      <div
        className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${character.accentColor}55 0%, var(--color-cream-50) 75%)`,
        }}
      >
        {/* Floating cloud at top */}
        <span
          className="absolute left-4 top-4 text-3xl float opacity-90"
          style={{ animationDelay: "0.4s" }}
        >
          ☁
        </span>

        {/* Nature accent — top-right */}
        <span
          className="absolute right-4 top-6 text-2xl sway opacity-90"
          style={{ animationDelay: "0.7s" }}
        >
          {accent}
        </span>

        <img
          src={character.imageUrl}
          alt={`${character.name} portrait`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          style={{ objectPosition: "center top" }}
        />

        {/* Subtle paper-grain texture over the image */}
        <span className="paper-grain absolute inset-0" aria-hidden="true" />

        {/* Online — soft sage badge */}
        {character.online && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-sage-400 bg-cream-50/90 px-2.5 py-1 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-sage-500" />
            <span className="text-[10px] font-semibold tracking-wide text-sage-600">
              online
            </span>
          </div>
        )}

        {/* Affinity — flower petals */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full border border-rose-300 bg-cream-50/90 px-2.5 py-1 backdrop-blur">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-xs ${
                i < character.affinity ? "text-rose-400" : "text-rose-300/40"
              }`}
            >
              ❀
            </span>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Name */}
        <div className="flex items-baseline justify-between">
          <h3
            className="text-3xl text-sage-600"
            style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
          >
            {character.name.toLowerCase()}
          </h3>
          <JP className="text-2xl font-semibold text-rose-400">
            {character.kanji}
          </JP>
        </div>

        {/* Personality */}
        <div className="flex items-baseline gap-2 text-sm">
          <JP className="font-medium text-sage-500">{character.personality.jp}</JP>
          <span className="text-text-muted">·</span>
          <span className="text-text-secondary">{character.personality.en}</span>
        </div>

        {/* Trait pills */}
        <div className="flex flex-wrap gap-1.5">
          {character.traits.map((trait) => (
            <span
              key={trait.en}
              className="rounded-full border border-sage-300 bg-cream-100/60 px-2.5 py-0.5 text-[10px] font-medium text-sage-600"
            >
              <JP>{trait.jp}</JP>
              <span className="mx-1 opacity-50">·</span>
              {trait.en}
            </span>
          ))}
        </div>

        {/* Latest message — soft cloud bubble */}
        <div className="rounded-[20px] rounded-bl-[6px] border border-sky-300 bg-sky-200/40 px-3 py-2.5 text-sm leading-relaxed">
          <span className="block text-text-primary">
            {character.latestMessage.en}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-sage-300 pt-3">
          <span className="text-[10px] font-semibold tracking-wide text-text-muted">
            {character.voice}
          </span>
          <span
            className="flex items-center gap-1.5 text-lg text-sage-600 transition-transform group-hover:translate-x-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            chat
          </span>
        </div>
      </div>
    </Link>
  )
}
