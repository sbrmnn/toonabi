import { Link } from "react-router"
import { JP } from "../components/JP"
import { characters } from "../data/characters"

export function GestureLabIndex() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <JP className="text-xl font-semibold text-rose-400 md:text-2xl">
          ジェスチャー監査
        </JP>
        <h1
          className="text-5xl text-sage-700 md:text-6xl"
          style={{ fontFamily: "var(--font-display)", lineHeight: "0.98" }}
        >
          gesture selector
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
          Pick a character to open the gesture audit lab. Each lab page lets you
          cycle individual gestures, run the 10 combo checks, and decide what
          should stay, be tweaked, or get removed.
        </p>
      </div>

      <div className="mb-8 rounded-[28px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-sage-200 bg-sage-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-sage-500">
              Audit Flow
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sage-700">
              1. Choose a character.
              <br />
              2. Run combos and individual gestures.
              <br />
              3. Note anything to keep, tweak, or remove.
            </p>
          </div>
          <div className="rounded-[22px] border border-rose-200 bg-rose-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-rose-400">
              Best View
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sage-700">
              Start in torso framing for conversational readability, then switch
              to portrait when you want to inspect expression-heavy beats.
            </p>
          </div>
          <div className="rounded-[22px] border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-500">
              Quick Link
            </p>
            <Link
              to={`/lab/gestures/${characters[0]?.id ?? "saki"}?combo=warm_welcome`}
              className="mt-2 inline-flex rounded-full border border-amber-300 bg-white/90 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              open first combo audit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {characters.map((character) => (
          <article
            key={character.id}
            className="rounded-[30px] border border-cream-300 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-3xl text-sage-700"
                  style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
                >
                  {character.name.toLowerCase()}
                </p>
                <JP className="mt-1 text-sm font-semibold text-rose-400">
                  {character.kanji} · {character.personality.jp}
                </JP>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${character.accentColor}22`,
                  color: character.accentColor,
                }}
              >
                {character.personality.en.toLowerCase()}
              </span>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-text-secondary">
              Audit {character.name} across the full combo set and the full
              individual gesture list.
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/lab/gestures/${character.id}`}
                className="rounded-full border border-sage-300 bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-700 transition hover:bg-sage-100"
              >
                open lab
              </Link>
              <Link
                to={`/lab/gestures/${character.id}?combo=warm_welcome`}
                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
              >
                start combo audit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
