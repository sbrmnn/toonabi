module Tts
  DEFAULT_PROVIDER = :fish_audio

  # Map of provider key -> zero-arg builder returning a fresh adapter instance.
  # Adapters read their credentials from ENV inside #initialize so a missing
  # API key fails fast with a clear ConfigurationError instead of building a
  # half-initialized object.
  PROVIDERS = {
    fish_audio: -> { FishAudioAdapter.new },
    eleven_labs: -> { ElevenLabsAdapter.new }
  }.freeze

  ALIASES = {
    "fish" => :fish_audio,
    "fishaudio" => :fish_audio,
    "fish_audio" => :fish_audio,
    "elevenlabs" => :eleven_labs,
    "eleven_labs" => :eleven_labs,
    "11labs" => :eleven_labs
  }.freeze

  module_function

  # Returns a fresh adapter for the requested provider, or the default
  # (fish_audio) when no name is given. Falls back to ENV["TTS_PROVIDER"]
  # so deploys can switch providers without a code change.
  def adapter(name = nil)
    key = resolve(name) || resolve(ENV["TTS_PROVIDER"]) || DEFAULT_PROVIDER
    factory = PROVIDERS[key]
    raise Base::ConfigurationError, "Unknown TTS provider: #{key}" unless factory
    factory.call
  end

  def resolve(name)
    return nil if name.nil? || name.to_s.strip.empty?
    ALIASES[name.to_s.downcase]
  end
end
