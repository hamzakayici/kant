"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, Link as LinkIcon, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import PromptModal from "./PromptModal"

export default function RichTextEditor({ 
  content, 
  onChange 
}: { 
  content: string, 
  onChange: (html: string) => void 
}) {
  const [showLinkPrompt, setShowLinkPrompt] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[150px] w-full p-5 focus:outline-none text-foreground',
      },
    },
  })

  // Sync external content changes if needed
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="relative w-full border border-border rounded-xl bg-muted overflow-hidden">
      {editor && (
        <div className="flex flex-wrap items-center gap-1 bg-muted border-b border-border p-2 w-full">
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1.5 rounded transition-colors text-sm font-semibold ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1.5 rounded transition-colors text-sm font-semibold ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1.5 rounded transition-colors text-sm font-semibold ${editor.isActive('heading', { level: 3 }) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            H3
          </button>

          <div className="w-px h-5 bg-muted mx-1"></div>

          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-muted mx-1"></div>

          <label className="relative p-1.5 rounded transition-colors text-muted-foreground hover:bg-accent cursor-pointer flex items-center justify-center overflow-hidden" title="Yazı Rengi">
             <Palette className="w-4 h-4" />
             <input
               type="color"
               onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
               value={editor.getAttributes('textStyle').color || '#e1e3e5'}
               className="absolute opacity-0 w-full h-full cursor-pointer"
             />
          </label>
          
          <div className="w-px h-5 bg-muted mx-1"></div>

          <button
            onClick={() => setShowLinkPrompt(true)}
            className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-muted mx-1"></div>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />

      <PromptModal 
        isOpen={showLinkPrompt}
        title="Bağlantı Ekle"
        placeholder="https://..."
        onConfirm={(url) => {
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          } else {
            editor.chain().focus().unsetLink().run()
          }
        }}
        onCancel={() => setShowLinkPrompt(false)}
      />
    </div>
  )
}
