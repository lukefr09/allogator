/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINNHUB_API_KEY: string
  readonly VITE_FINNHUB_API_KEYS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}