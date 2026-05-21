require "net/http"
require "json"
require "uri"

module Tts
  # Fish Audio TTS adapter.
  #
  # API: https://docs.fish.audio
  # POST https://api.fish.audio/v1/tts
  #   Authorization: Bearer <FISH_AUDIO_API_KEY>
  #   Model: <model id, e.g. "speech-1.6">
  # Body JSON: { text, reference_id, format, chunk_length, normalize, latency }
  # Returns audio bytes (chunked transfer when streaming).
  class FishAudioAdapter < Base
    API_BASE = "https://api.fish.audio".freeze
    DEFAULT_MODEL = "speech-1.6".freeze
    DEFAULT_CHUNK_LENGTH = 140
    DEFAULT_LATENCY = "balanced".freeze

    def initialize(api_key: default_api_key, model: default_model)
      raise ConfigurationError, "FISH_AUDIO_API_KEY is not set" if api_key.to_s.strip.empty?
      @api_key = api_key
      @model = model
    end

    def stream(text:, voice_id:, language: "ja", format: "mp3", &block)
      uri = URI.join(API_BASE, "/v1/tts")

      req = Net::HTTP::Post.new(uri)
      req["Authorization"] = "Bearer #{@api_key}"
      req["Content-Type"] = "application/json"
      req["Model"] = @model
      req.body = {
        text: text,
        reference_id: voice_id,
        format: format,
        chunk_length: default_chunk_length,
        normalize: true,
        latency: default_latency
      }.compact.to_json

      Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 60) do |http|
        http.request(req) do |response|
          unless response.is_a?(Net::HTTPSuccess)
            body = response.body rescue ""
            raise UpstreamError, "Fish Audio #{response.code}: #{body}"
          end
          response.read_body { |chunk| block.call(chunk) }
        end
      end
    end

    private

    def default_api_key
      Rails.application.credentials.dig(:fish_audio, :api_key) || ENV["FISH_AUDIO_API_KEY"]
    end

    def default_model
      Rails.application.credentials.dig(:fish_audio, :model) ||
        ENV.fetch("FISH_AUDIO_MODEL", DEFAULT_MODEL)
    end

    def default_chunk_length
      ENV.fetch("FISH_AUDIO_CHUNK_LENGTH", DEFAULT_CHUNK_LENGTH).to_i
    end

    def default_latency
      ENV.fetch("FISH_AUDIO_LATENCY", DEFAULT_LATENCY)
    end
  end
end
