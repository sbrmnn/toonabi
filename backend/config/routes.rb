Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :characters, only: [ :index, :show ]
      post "chat/opening", to: "chat#opening"
      post "chat/stream", to: "chat#stream"
      post "tts/stream", to: "tts#stream"
    end
  end
end
