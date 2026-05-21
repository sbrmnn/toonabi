import { CharacterCard } from "../components/CharacterCard"
import { Divider } from "../components/Divider"
import { Hero } from "../components/Hero"
import { JP } from "../components/JP"
import { characters } from "../data/characters"

export function Home() {
  const featured = characters[0]
  const rest = characters.slice(1)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-10 flex flex-col items-start gap-2">
        <JP className="text-xl font-semibold text-rose-400 md:text-2xl">
          キャラクター
        </JP>
        <h1
          className="text-6xl text-sage-600 md:text-7xl"
          style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
        >
          choose a friend
        </h1>
        <p className="text-base text-text-secondary">
          Each one has their own way of speaking, listening, and being.
        </p>
      </div>

      <Hero character={featured} />

      <Divider en="friends" jp="キャラクター一覧" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-7 lg:grid-cols-3">
        {rest.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>

      <Divider en="features" jp="このアプリについて" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            jp: "声で話す",
            en: "talk out loud",
            body: "Each friend has their own voice. Hear them respond in real time.",
            emoji: "🎵",
          },
          {
            jp: "表情豊か",
            en: "expressive",
            body: "3D avatars that react with gesture and emotion to your words.",
            emoji: "✨",
          },
          {
            jp: "個性",
            en: "real personality",
            body: "Each friend has their own perspective, taste, and way of being.",
            emoji: "🌿",
          },
        ].map((feature) => (
          <div
            key={feature.en}
            className="watercolor-card relative flex flex-col gap-3 p-6"
          >
            <span className="absolute right-4 top-4 text-3xl float">
              {feature.emoji}
            </span>
            <JP className="text-sm font-semibold text-rose-400">{feature.jp}</JP>
            <h3
              className="text-3xl text-sage-600"
              style={{ fontFamily: "var(--font-display)", lineHeight: "1" }}
            >
              {feature.en}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
