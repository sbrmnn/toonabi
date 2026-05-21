import type { Character } from "../types/character"

export const characters: Character[] = [
  {
    id: "saki",
    name: "SAKI",
    nameJp: "サキ",
    kanji: "咲",
    personality: { jp: "活発", en: "Cheerful" },
    traits: [
      { jp: "明るい", en: "Bright" },
      { jp: "声優", en: "Vocal" },
      { jp: "音楽", en: "Music" },
    ],
    voice: "Energetic soprano",
    greeting: {
      jp: "今日はどんな気分ですか？",
      en: "How are you feeling today?",
    },
    latestMessage: {
      jp: "また話しましょう！",
      en: "Wanna hear a song I've been practicing?",
    },
    affinity: 4,
    online: true,
    imageUrl: "/avatars/saki.jpg",
    accentColor: "#e07a6a",
  },
  {
    id: "yuki",
    name: "YUKI",
    nameJp: "ユキ",
    kanji: "雪",
    personality: { jp: "落ち着き", en: "Calm" },
    traits: [
      { jp: "知的", en: "Thoughtful" },
      { jp: "読書", en: "Reading" },
      { jp: "静か", en: "Quiet" },
    ],
    voice: "Soft alto",
    greeting: {
      jp: "ゆっくり話しましょう。",
      en: "Let's talk slowly.",
    },
    latestMessage: {
      jp: "おやすみなさい。",
      en: "I was just thinking about what you said last time.",
    },
    affinity: 3,
    online: true,
    imageUrl: "/avatars/yuki.jpg",
    accentColor: "#7a9ac9",
  },
  {
    id: "hana",
    name: "HANA",
    nameJp: "ハナ",
    kanji: "花",
    personality: { jp: "元気", en: "Energetic" },
    traits: [
      { jp: "歌", en: "Singing" },
      { jp: "ダンス", en: "Dance" },
      { jp: "笑顔", en: "Smiling" },
    ],
    voice: "Bright soprano",
    greeting: {
      jp: "一緒に歌いましょうよ！",
      en: "Let's sing together!",
    },
    latestMessage: {
      jp: "今日は良い日になりそう！",
      en: "Today feels like a dancing-in-the-sunshine kind of day!",
    },
    affinity: 5,
    online: true,
    imageUrl: "/avatars/hana.jpg",
    accentColor: "#c9a96e",
  },
  {
    id: "aoi",
    name: "AOI",
    nameJp: "アオイ",
    kanji: "葵",
    personality: { jp: "知的", en: "Witty" },
    traits: [
      { jp: "本好き", en: "Bookish" },
      { jp: "皮肉", en: "Sardonic" },
      { jp: "鋭い", en: "Sharp" },
    ],
    voice: "Cool mezzo",
    greeting: {
      jp: "面白い本を読んだ？",
      en: "Read anything interesting lately?",
    },
    latestMessage: {
      jp: "なるほど…興味深いですね。",
      en: "Oh? That's a surprisingly clever take.",
    },
    affinity: 3,
    online: true,
    imageUrl: "/avatars/aoi.jpg",
    accentColor: "#7ecec4",
  },
  {
    id: "koharu",
    name: "KOHARU",
    nameJp: "コハル",
    kanji: "小春",
    personality: { jp: "優しい", en: "Gentle" },
    traits: [
      { jp: "穏やか", en: "Tender" },
      { jp: "料理", en: "Cooking" },
      { jp: "癒し", en: "Soothing" },
    ],
    voice: "Warm alto",
    greeting: {
      jp: "お疲れさまです。一息つきませんか？",
      en: "You've worked hard. Let's take a break.",
    },
    latestMessage: {
      jp: "気をつけて帰ってね。",
      en: "I made tea. Come sit with me for a while.",
    },
    affinity: 4,
    online: true,
    imageUrl: "/avatars/koharu.jpg",
    accentColor: "#dfc28e",
  },
  {
    id: "mei",
    name: "MEI",
    nameJp: "メイ",
    kanji: "芽衣",
    personality: { jp: "好奇心", en: "Curious" },
    traits: [
      { jp: "冒険", en: "Adventurous" },
      { jp: "質問", en: "Inquisitive" },
      { jp: "陽気", en: "Playful" },
    ],
    voice: "Bright mezzo",
    greeting: {
      jp: "ねえねえ、何か面白い話して！",
      en: "Hey, tell me something interesting!",
    },
    latestMessage: {
      jp: "もっと教えて！",
      en: "Wait wait wait, what happened next?!",
    },
    affinity: 4,
    online: true,
    imageUrl: "/avatars/mei.jpg",
    accentColor: "#a3ddd9",
  },
  {
    id: "akira",
    name: "AKIRA",
    nameJp: "アキラ",
    kanji: "明",
    personality: { jp: "落ち着き", en: "Composed" },
    traits: [
      { jp: "誠実", en: "Earnest" },
      { jp: "聞き上手", en: "Listener" },
      { jp: "穏やか", en: "Steady" },
    ],
    voice: "Soft tenor",
    greeting: {
      jp: "こんにちは。今日はどうでしたか？",
      en: "Hello. How was your day?",
    },
    latestMessage: {
      jp: "ゆっくりでいいですよ。",
      en: "I'm here whenever you're ready to talk.",
    },
    affinity: 4,
    online: true,
    imageUrl: "/avatars/akira.jpg",
    accentColor: "#5a7d9a",
  },
]

export function getCharacter(id: string): Character | undefined {
  return characters.find((c) => c.id === id)
}
