# chat-app

A character chat app with VRM avatars, voice, and Japanese-aesthetic UI.

## Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4 + react-router
- **Backend**: Rails 8 (API-only) + SQLite
- **Future**: Three.js + @pixiv/three-vrm for avatars, Anthropic Claude for chat
- **TTS**: pluggable adapter (Fish Audio default, ElevenLabs alternative) — see [TTS](#tts)

## Layout

```
chat-app/
├── frontend/          ← Vite + React SPA (dev: :5173)
├── backend/           ← Rails 8 API (dev: :3000)
├── Procfile.dev       ← runs both at once via foreman
└── bin/dev            ← entrypoint
```

Frontend talks to backend via Vite's `/api` proxy in dev — no CORS pain. In production they deploy independently (Vercel/Netlify for frontend, Fly/Kamal for backend) and CORS is enforced by the `FRONTEND_ORIGIN` env var.

## Running locally

```bash
# one-time
cd backend && bundle install
cd ../frontend && npm install
gem install foreman   # if not already

# every time
bin/dev               # starts both
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/characters` | list all characters |
| `GET /api/v1/characters/:id` | character details |
| `POST /api/v1/chat/stream` | SSE chat stream (stubbed) |
| `POST /api/v1/tts/stream` | stream `audio/mpeg` for a character + text |
| `GET /up` | health check |

## TTS

Text-to-speech is provider-agnostic. Adapters live in [backend/app/services/tts/](backend/app/services/tts/):

- `Tts::FishAudioAdapter` (default) — Fish Audio's `/v1/tts` HTTP-streaming endpoint
- `Tts::ElevenLabsAdapter` — ElevenLabs' `/v1/text-to-speech/:voice_id/stream`

Pick a provider in this order: per-request `provider` param → `ENV["TTS_PROVIDER"]` → `:fish_audio`. Each character carries per-provider voice IDs under `voice_ids: { fish_audio:, eleven_labs: }`, so swapping providers does not change character identity.

Environment variables:

```
TTS_PROVIDER=fish            # or "elevenlabs"; defaults to fish
FISH_AUDIO_API_KEY=...       # required when using fish
FISH_AUDIO_MODEL=speech-1.6  # optional override
ELEVENLABS_API_KEY=...       # required when using elevenlabs
ELEVENLABS_MODEL=eleven_multilingual_v2
```

Add a new provider by subclassing `Tts::Base`, implementing `#stream`, and registering it in `Tts::PROVIDERS`.

## Design system

Color tokens, typography, and decorative utilities live in `frontend/src/index.css` under `@theme`. Japanese text always uses the `<JP>` component (`frontend/src/components/JP.tsx`) which wraps content in `<span translate="no" lang="ja">` to prevent Chrome auto-translation.
