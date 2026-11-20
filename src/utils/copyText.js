/**
 * Copies text to the clipboard. Uses the Clipboard API when available (secure pages), otherwise
 * a hidden textarea + execCommand('copy'). Resolves true on success, false if both fail.
 */
export async function copyText(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through to the textarea fallback */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand?.('copy') ?? false
    ta.remove()
    return Boolean(ok)
  } catch {
    return false
  }
}
