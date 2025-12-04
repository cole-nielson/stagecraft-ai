/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_API_URL: string
  readonly REACT_APP_UPLOAD_MAX_SIZE: string
  readonly REACT_APP_SUPPORTED_FORMATS: string
  readonly REACT_APP_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}