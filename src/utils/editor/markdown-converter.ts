/**
 * Markdown to HTML and HTML to Markdown conversion utilities
 */

export const convertMarkdownToHTML = (markdown: string): string => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
    // Highlights first so they survive list/formatting
    .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    // Bullet points (* or - at start of line)
    .replace(/^\s*\* (.*$)/gm, '<li class="text-gray-900 dark:text-white">$1</li>')
    .replace(/^\s*- (.*$)/gm, '<li class="text-gray-900 dark:text-white">$1</li>')
    // Wrap each li in a ul (simple approach; consecutive lists will render fine visually)
    .replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="list-disc list-inside mb-3 space-y-1 text-gray-900 dark:text-white">$1</ul>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    // Italics (avoid matching list markers by requiring non-space before *)
    .replace(/(^|\S)\*(.*?)\*/g, (_m, p1, p2) => `${p1}<em class="italic text-gray-900 dark:text-white">${p2}</em>`)
    // Paragraphs for remaining bare lines
    .replace(/^(?!<\/?(h1|h2|h3|ul|li|blockquote|pre|code|p)\b)(.+)$/gm, '<p class="mb-3 text-gray-900 dark:text-white">$2</p>')
    // Clean up empty paragraphs
    .replace(/<p class="mb-3 text-gray-900 dark:text-white"><\/p>/g, '')
}

export const convertHTMLToMarkdown = (html: string): string => {
  return html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
    // Bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    // Italics
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    // Highlights
    .replace(/<mark[^>]*>(.*?)<\/mark>/g, '==$1==')
    // List items
    .replace(/<li[^>]*>(.*?)<\/li>/g, '* $1')
    // Remove list wrappers
    .replace(/<\/?ul[^>]*>/g, '')
    // Paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}
