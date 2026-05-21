module Api
  module V1
    class TtsController < BaseController
      include ActionController::Live

      # POST /api/v1/tts/stream
      # Body: { character_id: string, text: string, provider?: "fish"|"elevenlabs" }
      #
      # Streams audio/mpeg back to the client. Provider defaults to fish_audio,
      # overridable per-request via the provider param or globally via
      # ENV["TTS_PROVIDER"].
      def stream
        character = Character.find(params[:character_id])
        return render json: { error: "character_not_found" }, status: :not_found unless character

        text = params[:text].to_s
        return render json: { error: "text_required" }, status: :unprocessable_entity if text.strip.empty?

        begin
          adapter = Tts.adapter(params[:provider])
        rescue Tts::Base::ConfigurationError => e
          return render json: { error: "tts_misconfigured", detail: e.message }, status: :service_unavailable
        end

        voice_id = character.dig(:voice_ids, adapter.provider_key)

        response.headers["Content-Type"] = "audio/mpeg"
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"
        response.headers["X-Tts-Provider"] = adapter.provider_key.to_s

        begin
          adapter.stream(text: text, voice_id: voice_id, language: "ja", format: "mp3") do |chunk|
            response.stream.write(chunk)
          end
        rescue Tts::Base::UpstreamError, IOError => e
          Rails.logger.error("[TTS] #{adapter.provider_key} stream failed: #{e.class}: #{e.message}")
        ensure
          response.stream.close
        end
      end
    end
  end
end
