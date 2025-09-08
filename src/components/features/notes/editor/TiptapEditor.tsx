'use client'

import React, { useEffect, useImperativeHandle, forwardRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onUpdate: (content: string) => void
  editable?: boolean
  placeholder?: string
  className?: string
}

export interface TiptapEditorHandle {
  focus: () => void
  blur: () => void
  clearContent: () => void
  getHTML: () => string
  setContent: (content: string) => void
  insertImage: (url: string) => void
  insertLink: (url: string, text?: string) => void
}

const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  ({ content, onUpdate, editable = true, placeholder = 'Start typing...', className = '' }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
          codeBlock: false, // We'll use CodeBlockLowlight instead
        }),
        Highlight.configure({ multicolor: true }),
        Typography,
        Underline,
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg shadow-md max-w-full h-auto',
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        CodeBlockLowlight.configure({
          lowlight,
        }),
      ],
      content,
      editable,
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        onUpdate(html)
      },
    })

    // Update content when it changes from parent
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content)
      }
    }, [content, editor])

    // Update editable state
    useEffect(() => {
      if (editor && editor.isEditable !== editable) {
        editor.setEditable(editable)
      }
    }, [editable, editor])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.chain().focus().run()
      },
      blur: () => {
        editor?.commands.blur()
      },
      clearContent: () => {
        editor?.commands.clearContent()
      },
      getHTML: () => {
        return editor?.getHTML() || ''
      },
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent)
      },
      insertImage: (url: string) => {
        editor?.chain().focus().setImage({ src: url }).run()
      },
      insertLink: (url: string, text?: string) => {
        if (text) {
          editor?.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
        } else {
          editor?.chain().focus().setLink({ href: url }).run()
        }
      },
    }))

    return (
      <div className={`tiptap-editor flex-1 overflow-y-auto bg-white dark:bg-[#0f0f0f] ${className}`}>
        <EditorContent editor={editor} />
      </div>
    )
  }
)

TiptapEditor.displayName = 'TiptapEditor'

export default TiptapEditor
