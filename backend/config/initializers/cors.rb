# Cross-Origin Resource Sharing for the SPA frontend.
# Locked to dev origins; add production origin via FRONTEND_ORIGIN env var.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      *[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        ENV["FRONTEND_ORIGIN"]
      ].compact
    )

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :options ],
      expose: [ "X-Session-Id" ]
  end
end
