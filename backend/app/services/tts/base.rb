module Tts
  # Abstract base for text-to-speech providers.
  #
  # Subclasses implement #stream, which yields binary audio chunks as they
  # arrive from the upstream provider. Callers can either consume chunks
  # directly (HTTP streaming to the client) or buffer them into a full file.
  class Base
    Error = Class.new(StandardError)
    ConfigurationError = Class.new(Error)
    UpstreamError = Class.new(Error)

    def stream(text:, voice_id:, language: "ja", format: "mp3", &block)
      raise NotImplementedError, "#{self.class.name} must implement #stream"
    end

    # Used by Character#voice_ids and controller logging to identify which
    # provider produced the audio. Derived from the class name so adapter
    # implementations don't need to repeat themselves.
    def provider_key
      self.class.name.demodulize.underscore.sub(/_adapter\z/, "").to_sym
    end
  end
end
