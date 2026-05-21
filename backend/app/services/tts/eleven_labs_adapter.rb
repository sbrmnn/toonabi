require "net/http"
require "json"
require "uri"

module Tts
  # ElevenLabs TTS adapter.
  #
  # API: https://elevenlabs.io/docs/api-reference/streaming
  # POST https://api.elevenlabs.io/v1/text-to-speech/<voice_id>/stream
  #   xi-api-key: <ELEVENLABS_API_KEY>
  # Body JSON: { text, model_id, voice_settings }
  # Returns audio bytes (chunked transfer).
  class ElevenLabsAdapter < Base
    API_BASE = "https://api.elevenlabs.io".freeze
    DEFAULT_MODEL = "eleven_multilingual_v2".freeze

    def initialize(api_key: default_api_key, model: default_model)
      raise ConfigurationError, "ELEVENLABS_API_KEY is not set" if api_key.to_s.strip.empty?
      @api_key = api_key
      @model = model
    end

    # Used as a safety net when a character doesn't have its own voice_id mapped.
    FALLBACK_VOICE_ID = "EST9Ui6982FZPSi7gCHi".freeze

    def stream(text:, voice_id:, language: "ja", format: "mp3", &block)
      voice_id = FALLBACK_VOICE_ID if voice_id.to_s.strip.empty?

      uri = URI.join(API_BASE, "/v1/text-to-speech/#{voice_id}/stream")
      uri.query = URI.encode_www_form(output_format: output_format_for(format))

      req = Net::HTTP::Post.new(uri)
      req["xi-api-key"] = @api_key
      req["Content-Type"] = "application/json"
      req["Accept"] = "audio/mpeg"
      req.body = {
        text: text,
        model_id: @model,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }.to_json

      Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 60) do |http|
        http.request(req) do |response|
          unless response.is_a?(Net::HTTPSuccess)
            body = response.body rescue ""
            raise UpstreamError, "ElevenLabs #{response.code}: #{body}"
          end
          response.read_body { |chunk| block.call(chunk) }
        end
      end
    end

    private

    def default_api_key
      Rails.application.credentials.dig(:elevenlabs, :api_key) || ENV["ELEVENLABS_API_KEY"]
    end

    def default_model
      Rails.application.credentials.dig(:elevenlabs, :model) ||
        ENV.fetch("ELEVENLABS_MODEL", DEFAULT_MODEL)
    end

    def output_format_for(format)
      case format.to_s
      when "mp3" then "mp3_44100_128"
      when "pcm" then "pcm_16000"
      else format.to_s
      end
    end
  end
end
