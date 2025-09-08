'use client'

import React, { forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/utils/editor/html-sanitizer'
import { convertMarkdownToHTML, convertHTMLToMarkdown } from '@/utils/editor/markdown-converter'
import { getAppleEmojiHTML, emojiRegex } from '@/utils/editor/emoji-utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface EditorContentProps {
  content: string | undefined
  isEditing: boolean
  fontSize: string
  fontFamily: string
  onContentChange: (content: string) => void
  onEditorClick: () => void
  onEditorBlur: (e: React.FocusEvent) => void
  onEditorPaste: (e: React.ClipboardEvent) => void
  onEditorKeyDown: (e: React.KeyboardEvent) => void
  onEditorInput: (e: React.FormEvent<HTMLDivElement>) => void
}

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(
  (
    {
      content,
      isEditing,
      fontSize,
      fontFamily,
      onContentChange,
      onEditorClick,
      onEditorBlur,
      onEditorPaste,
      onEditorKeyDown,
      onEditorInput
    },
    ref
  ) => {
    // Ensure we have content to display
    const displayContent = content || ''
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault()

      try {
        // Try to get HTML content first, then fall back to plain text
        const htmlPaste = e.clipboardData.getData('text/html')
        const plainPaste = e.clipboardData.getData('text/plain')

        const selection = window.getSelection()

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()

          if (htmlPaste) {
            // For HTML content, sanitize before insert
            const safe = sanitizeHtml(htmlPaste)
            document.execCommand('insertHTML', false, safe)
          } else if (plainPaste) {
            // Check if it contains emojis and convert them to Apple emojis
            if (emojiRegex.test(plainPaste)) {
              // Convert emojis to Apple emoji images
              const convertedContent = plainPaste.replace(emojiRegex, (emoji) => {
                return getAppleEmojiHTML(emoji)
              })
              document.execCommand('insertHTML', false, sanitizeHtml(convertedContent))
            } else {
              // Regular text, insert as text node
              const textNode = document.createTextNode(plainPaste)
              range.insertNode(textNode)
              range.setStartAfter(textNode)
              range.collapse(true)

              selection.removeAllRanges()
              selection.addRange(range)
            }
          }

          // Trigger the input handler through the parent
          onEditorPaste(e)
        }
      } catch (error) {
        console.error('Error handling paste:', error)
        // Fallback to default paste behavior
        onEditorPaste(e)
      }
    }, [onEditorPaste])

    if (isEditing) {
      return (
        <div 
          className="flex-1 overflow-y-auto"
          onClick={onEditorClick}
        >
          <div className="px-6 py-4">
            <div
              ref={ref}
              contentEditable={isEditing}
              className={cn(
                "min-h-[500px] focus:outline-none prose prose-sm dark:prose-invert max-w-none",
                "prose-headings:font-semibold prose-p:my-3 prose-ul:my-3 prose-li:my-1",
                "prose-strong:font-bold prose-em:italic",
                "[&>*]:text-gray-900 dark:[&>*]:text-gray-100",
                "[&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-800 [&_mark]:px-1 [&_mark]:rounded"
              )}
              style={{
                fontSize,
                fontFamily,
                lineHeight: '1.6',
                caretColor: 'currentColor'
              }}
              onInput={onEditorInput}
              onBlur={onEditorBlur}
              onPaste={handlePaste}
              onKeyDown={onEditorKeyDown}
              suppressContentEditableWarning={true}
              spellCheck={true}
            />
          </div>
        </div>
      )
    }

    // Preview mode - render markdown
    return (
      <div 
        className="flex-1 overflow-y-auto cursor-text"
        onClick={onEditorClick}
      >
        <div className="px-6 py-4">
          <div 
            className={cn(
              "min-h-[500px] prose prose-sm dark:prose-invert max-w-none",
              "prose-headings:font-semibold prose-p:my-3 prose-ul:my-3 prose-li:my-1",
              "prose-strong:font-bold prose-em:italic",
              "[&>*]:text-gray-900 dark:[&>*]:text-gray-100"
            )}
            style={{
              fontSize,
              fontFamily,
              lineHeight: '1.6'
            }}
          >
            {displayContent ? (
              (() => {
                // Auto-detect whether content is likely HTML or Markdown
                const isLikelyHTML = /<\/?[a-z][\s\S]*>/i.test(displayContent)
                if (isLikelyHTML) {
                  // Render sanitized HTML so previously-saved HTML notes appear without clicking
                  const safe = sanitizeHtml(displayContent)
                  return (
                    <div
                      className="[&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-800 [&_mark]:px-1 [&_mark]:rounded"
                      dangerouslySetInnerHTML={{ __html: safe }}
                    />
                  )
                }
                // Default to Markdown rendering
                return (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom rendering for enhanced markdown elements
                      mark: ({ children }) => (
                        <mark className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                          {children}
                        </mark>
                      ),
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <img 
                          src={src} 
                          alt={alt} 
                          className="rounded-lg shadow-md max-w-full h-auto"
                        />
                      ),
                      code: (props) => {
                        const { inline, children } = props as any
                        if (inline) {
                          return (
                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                              {children}
                            </code>
                          )
                        }
                        return (
                          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                            <code>{children}</code>
                          </pre>
                        )
                      }
                    }}
                  >
                    {displayContent}
                  </ReactMarkdown>
                )
              })()
            ) : (
              <div className="text-gray-400 dark:text-gray-600 italic">
                <p>Click to start writing...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )  
  }
)

EditorContent.displayName = 'EditorContent'
