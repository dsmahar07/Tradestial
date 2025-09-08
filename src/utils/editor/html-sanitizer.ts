/**
 * HTML sanitization utility to prevent XSS attacks
 */

export const sanitizeHtml = (html: string): string => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null)
    const dangerousTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'])
    const dangerousAttrs = [/^on/i, /javascript:/i, /data:text\/html/i]
    let node = walker.currentNode as HTMLElement | null
    
    while (node) {
      const el = node as HTMLElement
      // Remove dangerous elements entirely
      if (dangerousTags.has(el.tagName.toLowerCase())) {
        const toRemove = el
        node = walker.nextNode() as HTMLElement | null
        toRemove.remove()
        continue
      }
      // Strip dangerous attributes
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name
        const value = attr.value
        if (dangerousAttrs.some((re) => re.test(name)) || dangerousAttrs.some((re) => re.test(value))) {
          el.removeAttribute(name)
          continue
        }
        if (name === 'src' || name === 'href') {
          const lowered = value.trim().toLowerCase()
          if (lowered.startsWith('javascript:') || lowered.startsWith('data:text/html')) {
            el.removeAttribute(name)
          }
        }
      }
      node = walker.nextNode() as HTMLElement | null
    }
    return doc.body.innerHTML
  } catch {
    return ''
  }
}
