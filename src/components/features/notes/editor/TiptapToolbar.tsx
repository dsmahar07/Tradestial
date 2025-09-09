'use client'

import React from 'react'
import { Editor } from '@tiptap/react'

// Official TipTap UI Components
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { HeadingButton } from '@/components/tiptap-ui/heading-button'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ListButton } from '@/components/tiptap-ui/list-button'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { ColorHighlightButton } from '@/components/tiptap-ui/color-highlight-button'
import { ColorHighlightPopover } from '@/components/tiptap-ui/color-highlight-popover'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { LinkPopover } from '@/components/tiptap-ui/link-popover'

// TipTap UI Primitives
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar'
import { Separator } from '@/components/tiptap-ui-primitive/separator'
import { Button } from '@/components/tiptap-ui-primitive/button'

// Icons for custom buttons
import { Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface TiptapToolbarProps {
  editor: Editor | null
}

export const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <Toolbar className="p-2 flex flex-wrap gap-1">
      {/* Undo/Redo */}
      <UndoRedoButton editor={editor} action="undo" />
      <UndoRedoButton editor={editor} action="redo" />

      <Separator orientation="vertical" className="mx-1" />

      {/* Text formatting */}
      <MarkButton editor={editor} type="bold" />
      <MarkButton editor={editor} type="italic" />
      <MarkButton editor={editor} type="underline" />
      <MarkButton editor={editor} type="strike" />
      <MarkButton editor={editor} type="code" />

      <Separator orientation="vertical" className="mx-1" />

      {/* Headings */}
      <HeadingDropdownMenu editor={editor} />

      <Separator orientation="vertical" className="mx-1" />

      {/* Lists */}
      <ListDropdownMenu editor={editor} />

      <Separator orientation="vertical" className="mx-1" />

      {/* Text alignment */}
      <TextAlignButton editor={editor} align="left" />
      <TextAlignButton editor={editor} align="center" />
      <TextAlignButton editor={editor} align="right" />
      <TextAlignButton editor={editor} align="justify" />

      <Separator orientation="vertical" className="mx-1" />

      {/* Color and highlight */}
      <ColorHighlightPopover 
        editor={editor} 
        colors={[
          { label: "Blue highlight", value: "#335CFF", border: "#335CFF" },
          { label: "Orange highlight", value: "#FA7319", border: "#FA7319" },
          { label: "Red highlight", value: "#FB3748", border: "#FB3748" },
          { label: "Green highlight", value: "#1FC16B", border: "#1FC16B" },
          { label: "Yellow highlight", value: "#F6B51E", border: "#F6B51E" },
          { label: "Purple highlight", value: "#693EE0", border: "#693EE0" },
          { label: "Cyan highlight", value: "#47C2FF", border: "#47C2FF" },
          { label: "Pink highlight", value: "#FB4BA3", border: "#FB4BA3" },
          { label: "Teal highlight", value: "#22D3BB", border: "#22D3BB" },
          { label: "Gray highlight", value: "#A3A3A3", border: "#A3A3A3" },
        ]}
      />

      <Separator orientation="vertical" className="mx-1" />

      {/* Block elements */}
      <BlockquoteButton editor={editor} />
      <CodeBlockButton editor={editor} />
      
      {/* Horizontal Rule */}
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Insert horizontal rule"
        tooltip="Insert horizontal rule"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="tiptap-button-icon" />
      </Button>

      <Separator orientation="vertical" className="mx-1" />

      {/* Media and Links */}
      <LinkPopover editor={editor} />
      <ImageUploadButton editor={editor} />

      <Separator orientation="vertical" className="mx-1" />

      {/* Table operations */}
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Insert table"
        tooltip="Insert table (3x3)"
        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <svg className="tiptap-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
      </Button>

      {/* Clear formatting */}
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Clear formatting"
        tooltip="Clear all formatting"
        onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
        className="tiptap-button"
      >
        <svg className="tiptap-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7V4a1 1 0 0 1 1-1h2m0 0V1m0 2h2m0 0V1m0 2h2m0 0V1m0 2h2a1 1 0 0 1 1 1v3M4 7h16M4 7v10a1 1 0 0 0 1 1h4m10-11v10a1 1 0 0 1-1 1h-4m0 0v2m0-2H9m0 0v2"/>
          <path d="m9 11 3 3 3-3"/>
        </svg>
      </Button>
    </Toolbar>
  )
}
