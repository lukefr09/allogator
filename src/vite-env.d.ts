/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPHA_VANTAGE_API_KEY_1: string
  readonly VITE_ALPHA_VANTAGE_API_KEY_2: string
  readonly VITE_ALPHA_VANTAGE_API_KEY_3: string
  readonly VITE_ALPHA_VANTAGE_API_KEY_4: string
  readonly VITE_ALPHA_VANTAGE_API_KEY_5: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}