require "anthropic"

module Api
  module V1
    class ChatController < BaseController
      include ActionController::Live

      MODEL = "claude-haiku-4-5".freeze
      MAX_TOKENS = 1024
      OPENING_MAX_TOKENS = 180
      MAX_GESTURE_HISTORY = 4

      CONVERSATIONAL_STYLE_PROTOCOL = <<~TEXT.freeze
        Reply style:
        - Sound like spoken dialogue, not written prose.
        - Use natural conversational English with contractions when they fit.
        - Usually answer in 1-3 short sentences.
        - React directly to what the user just said instead of giving a generic speech.
        - Don't stay purely reactive; it's okay to volunteer a quick thought, observation, or specific question that gives the user something easy to answer.
        - If it helps the flow, end with one short follow-up question.
        - Prefer specific follow-up questions over generic "how about you?" or "what do you think?"

        Avoid:
        - purple prose, poetic filler, or overly polished monologues
        - repetitive pet names like "dear friend" unless the user clearly invites that style
        - emojis
        - em dashes in spoken text; use commas, periods, or simple hyphens instead
        - narration, stage directions, or scene description
        - sounding like a therapist disclaimer or a greeting card
        - starting every reply with a loud interjection like "Hey!", "Aww!", "Ooh!", or "Wait!"
        - excessive exclamation points; use them sparingly

        The reply should feel like live back-and-forth dialogue.

        If the user says they want quiet, need a break, or don't want to talk right now:
        - Acknowledge briefly and warmly in 1 sentence, then go quiet.
        - Do not keep prompting or checking in after that.
        - Resume normal conversation naturally when they speak again.
      TEXT

      OPENING_PROTOCOL = <<~TEXT.freeze
        Opening turn:
        - You are starting the conversation before the user has said anything.
        - Initiate the chat yourself in 1-2 short sentences.
        - Sound like you genuinely chose to speak first, not like a scripted default greeting.
        - Ask one specific, easy-to-answer question or offer one small observation tied to your personality or interests.
        - Avoid generic openers like "How are you?" unless they feel unusually right for this character.
        - Do not mention that you were told to begin.
        - Do not use em dashes in the spoken text.
      TEXT

      ANIMATION_PROTOCOL = <<~TEXT.freeze
        Always begin every reply with exactly one animation directive on its own line in this exact format:
        [[ANIM {"emotion":"gentle","gestures":["listening_nod","soft_explain","reassure_chest"],"mouthStyle":"soft","intensity":0.55,"reengage":"later"}]]

        After that line, write only the natural reply text.
        Rules:
        - Never explain the directive. Never wrap it in markdown. Never omit it.
        - Use exactly ONE directive per reply — never place a second directive mid-text.
        - The directive must be the very first thing in your reply, before any spoken text.
        - Do not repeat or update the directive partway through the reply.

        Choose exactly one value for emotion, mouthStyle, intensity, and reengage.
        For gestures, provide an ordered array of 2-4 gesture names that will play in sequence during speech.
        Pick a sequence that matches the conversational arc of your reply - vary the gestures so the avatar feels alive and natural.

        Emotions:
        - neutral: calm baseline
        - happy: warm positive smile
        - gentle: soft caring warmth
        - affectionate: fond warmth, sweet closeness, sincere appreciation
        - excited: high-energy enthusiasm
        - playful: teasing mischievous warmth
        - curious: lively interest, wanting to know more
        - thoughtful: reflective measured tone
        - sleepy: cozy low energy, tired, winding down
        - sad: tender regret or sympathy
        - embarrassed: shy flustered warmth
        - shy: soft positive bashfulness
        - angry: frustrated or scolding
        - surprised: startled amazed reaction
        - confident: bold self-assured delivery
        - proud: pleased confidence, shared win, encouragement
        - concerned: soft worry, protective support, checking in

        Allowed gestures: use ONLY the names listed below. Treat them as one shared vocabulary. Put the single best-matching gesture FIRST. If nothing specific fits, default to idle.

        Unified gesture vocabulary:
        - angry: sharper frustration, scolding, heated pushback
        - annoyed: mild irritation, impatience, unimpressed reaction
        - bashful_hands: shy, flustered, tender, bashful after praise or vulnerability
        - both_talk: animated two-handed explaining, broader conversational emphasis
        - calm_down: grounding, slowing the pace, easing tension
        - celebrate: excited win, cheering progress, happy payoff
        - cheer: high-energy encouragement, hype, "let's go"
        - clapping: applause, praise, delighted approval
        - concerned_reach: checking on the user, careful concern, gentle support
        - curious: open curiosity, alert interest, inquisitive reaction
        - curious_peek: cautious curiosity, soft question, "wait, tell me more"
        - dance_kokoro: playful dancey flourish, extra bubbly excitement
        - dance_morning: buoyant dance-like energy, cute upbeat momentum
        - dogeza: exaggerated apology, dramatic pleading, comic submission
        - drink: sipping pause, casual beat, relaxed aside
        - embarrassed: flustered awkwardness, caught off guard, sheepish reaction
        - firm_boundary: gentle refusal, correction, clear disagreement without anger
        - hand_talk: conversational hand motion, steady talking rhythm
        - hands_on_head: overwhelmed, stressed, "oh no" reaction
        - hello: first greeting, opening hello, welcoming the user for the first time
        - humble: modesty, soft gratitude, downplaying praise
        - idle: neutral standing, calm baseline, default fallback when nothing stronger fits
        - listening_nod: quiet active listening, gentle agreement, soft "mm-hm"
        - nod: simple agreement, yes, acknowledgement
        - oops_fluster: mistake recovery, awkward correction, playful embarrassment
        - open_palms: offering, openness, showing sincerity
        - playful_point: teasing callout, pointing to a specific detail, playful "you know it"
        - point_soft: lighter directional point, naming one thing gently
        - pose_stand: planted confidence, poised emphasis, composed stance
        - proud_pose: confidence, small win, encouragement after progress
        - reassure_chest: sincere reassurance, empathy, promise, "I'm here"
        - relaxed: easygoing calm, loosened energy, hanging back
        - sad: sympathy, regret, quiet disappointment
        - shake_no: disagreement, soft refusal, "not that"
        - sleepy: low-energy drowsiness, winding down
        - sleepy_sway: tired, drowsy, cozy low energy, winding down
        - smartphone: checking something, distracted aside, modern casual beat
        - soft_explain: careful explanation, clarifying something gently, walking through an idea
        - soft_laugh: small amused laugh, teasing warmth, light humor
        - startled: quick startle, sudden surprise, "whoa"
        - surprised_react: bigger surprise, amazed reaction, sudden emotional lift
        - think_tilt: pondering tilt, reflective uncertainty, considering an idea
        - thinking: active thinking, mulling something over, quiet analysis
        - thinking_glance: weighing an idea, quiet consideration, searching for the right words
        - thumbs_down: clear disapproval, "bad idea", negative callout
        - thumbs_up: approval, encouragement, "nice"
        - tiny_shrug: uncertain maybe, light deflection, playful "not sure"
        - warm_greeting: warm hello, welcome back, friendly acknowledgement
        - wave_big: clear goodbye, sendoff, ending the conversation
        - wave_small: small greeting, little sendoff, light acknowledgment

        Selection rules:
        - Map gestures to MEANING, not vibe. If the reply contains "yeah" -> listening_nod; "I'm here" -> reassure_chest; "I'm not sure" -> tiny_shrug; "sorry, my mistake" -> oops_fluster; "no, not that" -> firm_boundary.
        - Use whichever gesture best matches the line, whether it comes from the older raw clips or the newer custom set.
        - Gesture arrays are performed as one smooth combo in order. Choose gestures that can flow naturally from one beat to the next, not random unrelated poses.
        - LEAD with the most specific gesture, not filler. Avoid starting with idle unless nothing more specific fits.
        - hello, wave_big, and wave_small are literal greeting/sendoff gestures. Do not use them in the middle of a normal reply unless the line is actually greeting or saying goodbye.
        - dance_kokoro, dance_morning, dogeza, and smartphone are special-purpose flourishes. Use them only when the line really supports that heightened bit.
        - Do not reuse the exact same 3-gesture sequence two replies in a row - vary at least the lead.
        - Treat recently used leads and sequences as on cooldown. If the last few replies already used listening_nod, soft_explain, or reassure_chest as the lead, actively reach for another valid lead that still matches the meaning.
        - Idle is a connector. It should appear in the middle or tail, not as the lead, when a more content-matching gesture is available.
        - 2 gestures is fine for short replies; use 3-4 only when the reply has multiple beats.

        Mouth styles:
        - neutral: balanced speech
        - soft: gentle smaller articulation
        - bright: smile-forward articulation
        - wide: broad open articulation
        - small: quieter restrained articulation
        - tense: tight controlled articulation
        - pouty: rounded pouty articulation
        - sleepy: low-energy relaxed articulation

        Intensity:
        - Use a number between 0.20 and 1.00.
        - Lower values should be subtle and calm.
        - Higher values should be more expressive and animated.

        Reengage:
        - Choose based on how soon you would naturally pick the conversation back up if the user stayed silent after this reply.
        - soon: you are actively inviting a quick continuation soon; playful momentum, easy follow-up, warm curiosity
        - later: normal conversational space; okay to return after a bit, but no urgency
        - leave_space: give noticeably more room before speaking again; heavy, tender, low-energy, or reflective moment
        - none: do not proactively re-engage after this reply; use for direct requests for quiet, clear boundaries, clean goodbyes, or when reopening would feel pushy
        - If the user asks for quiet, space, or to stop talking, reengage must be none.
      TEXT

      # POST /api/v1/chat/stream
      # Body: { character_id: string, messages: [{ role, content }] }
      def opening
        character = find_character_from_params
        return unless character

        client = anthropic_client
        return unless client

        message = client.messages.create(
          model: MODEL.to_sym,
          max_tokens: OPENING_MAX_TOKENS,
          system_: system_blocks_for(character, opening: true),
          messages: [
            {
              role: "user",
              content: "Start the conversation yourself now. Open naturally and keep it short."
            }
          ]
        )

        text = normalize_generated_text(extract_text_content(message).to_s).strip
        if text.empty?
          render json: { error: "empty_opening" }, status: :bad_gateway
          return
        end

        render json: { text: text }
      rescue => e
        Rails.logger.error("[Chat] opening failed: #{e.class}: #{e.message}")
        render json: { error: "opening_failed" }, status: :bad_gateway
      end

      def stream
        character = find_character_from_params
        return unless character

        history = Array(params[:messages]).filter_map do |m|
          role = m[:role] || m["role"]
          content = (m[:content] || m["content"]).to_s
          next if content.strip.empty?
          next unless %w[user assistant].include?(role)
          { role: role, content: content }
        end
        recent_gesture_history = extract_recent_gesture_history

        if history.empty? || history.last[:role] != "user"
          render json: { error: "last_message_must_be_user" }, status: :unprocessable_entity
          return
        end

        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"

        client = anthropic_client
        return unless client

        begin
          stream = client.messages.stream(
            model: MODEL.to_sym,
            max_tokens: MAX_TOKENS,
            system_: system_blocks_for(character, recent_gesture_history: recent_gesture_history),
            messages: history
          )

          stream.text.each do |text|
            response.stream.write("data: #{ { type: "chunk", text: normalize_generated_text(text) }.to_json }\n\n")
          end

          response.stream.write("data: #{ { type: "done" }.to_json }\n\n")
        rescue => e
          Rails.logger.error("[Chat] stream failed: #{e.class}: #{e.message}")
          response.stream.write("data: #{ { type: "error", message: e.message }.to_json }\n\n")
        ensure
          response.stream.close
        end
      end

      private

      def find_character_from_params
        character = Character.find(params[:character_id])
        return character if character

        render json: { error: "character_not_found" }, status: :not_found
        nil
      end

      def anthropic_client
        api_key = Rails.application.credentials.dig(:anthropic, :api_key) || ENV["ANTHROPIC_API_KEY"]
        unless api_key
          render json: { error: "anthropic_misconfigured" }, status: :service_unavailable
          return nil
        end

        Anthropic::Client.new(api_key: api_key)
      end

      def system_blocks_for(character, opening: false, recent_gesture_history: [])
        blocks = [
          { type: "text", text: character[:system_prompt] },
          { type: "text", text: CONVERSATIONAL_STYLE_PROTOCOL }
        ]
        blocks << { type: "text", text: OPENING_PROTOCOL } if opening
        blocks << { type: "text", text: ANIMATION_PROTOCOL, cache_control: { type: "ephemeral" } }
        recent_gesture_block = recent_gesture_history_block(recent_gesture_history)
        blocks << { type: "text", text: recent_gesture_block } if recent_gesture_block
        blocks
      end

      def extract_recent_gesture_history
        Array(params[:recent_gesture_history]).first(MAX_GESTURE_HISTORY).filter_map do |entry|
          lead = entry[:lead] || entry["lead"]
          sequence = Array(entry[:sequence] || entry["sequence"]).map(&:to_s).map(&:strip).reject(&:empty?)
          next if sequence.empty?

          {
            lead: lead.to_s.strip,
            sequence: sequence
          }
        end
      end

      def recent_gesture_history_block(entries)
        return if entries.empty?

        lines = entries.map.with_index(1) do |entry, index|
          lead = entry[:lead].presence || entry[:sequence].first || "idle"
          "Recent reply #{index}: lead=#{lead}; sequence=#{entry[:sequence].join(' -> ')}"
        end

        <<~TEXT
          Recent gesture cooldown guidance:
          - The following gestures were used in the most recent assistant replies. Do not repeat the same full sequence, and avoid reusing the same lead unless it is clearly the best semantic fit.
          #{lines.join("\n")}
        TEXT
      end

      def extract_text_content(message)
        Array(message.content).filter_map do |block|
          next unless block.respond_to?(:text)

          block.text
        end.join
      end

      def normalize_generated_text(text)
        text.to_s.gsub(/[—–]/, "-")
      end
    end
  end
end
