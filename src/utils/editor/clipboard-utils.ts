/**
 * Clipboard utilities for safe copy operations
 */

export const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (
      typeof navigator !== 'undefined' && 
      navigator.clipboard && 
      typeof navigator.clipboard.writeText === 'function' && 
      (window as any).isSecureContext !== false
    ) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall back to execCommand
  }
  
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
