// Feature flags — flip the constant or set the env var to toggle without a deploy

// Multilingual support (EN / HI / GU language switcher)
// Code switch: set ENABLED to false
// Env switch:  VITE_MULTILINGUAL_ENABLED=false  in .env / GitHub Secrets
const ENABLED = false

export const MULTILINGUAL_ENABLED =
  import.meta.env.VITE_MULTILINGUAL_ENABLED !== undefined
    ? import.meta.env.VITE_MULTILINGUAL_ENABLED !== 'false'
    : ENABLED
