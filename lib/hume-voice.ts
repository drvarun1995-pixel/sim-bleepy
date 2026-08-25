export function isMicrosoftEdge(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Edg\//.test(navigator.userAgent)
}

export const HUME_TRUST_NETWORK_HINT =
  'The AI patient could not connect. NHS trust networks often block Hume voice (wss://api.hume.ai). Try Chrome, or ask IT to allow api.hume.ai and storage.googleapis.com.'

export function describeHumeVoiceError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''

  if (!raw.trim() || /websocket|network|failed|connect|timeout/i.test(raw)) {
    return HUME_TRUST_NETWORK_HINT
  }

  return raw
}
