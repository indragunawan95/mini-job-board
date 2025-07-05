'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// --- Toolbar Component for Editor Actions ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-base-200 rounded-t-lg border border-base-300">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`btn btn-sm btn-ghost ${editor.isActive('bold') ? 'btn-active' : ''}`}>
                Bold
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`btn btn-sm btn-ghost ${editor.isActive('italic') ? 'btn-active' : ''}`}>
                Italic
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={`btn btn-sm btn-ghost ${editor.isActive('strike') ? 'btn-active' : ''}`}>
                Strike
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn btn-sm btn-ghost ${editor.isActive('bulletList') ? 'btn-active' : ''}`}>
                List
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`btn btn-sm btn-ghost ${editor.isActive('orderedList') ? 'btn-active' : ''}`}>
                Numbered List
            </button>
        </div>
    )
}

// --- Main Rich Text Editor Component ---
interface RichTextEditorProps {
    value: string;
    onChange: (richText: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // You can disable extensions here if you want
                // e.g., heading: false,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                // This class makes the editor look like a DaisyUI textarea
                class: 'prose max-w-none p-4 min-h-[12rem] focus:outline-none bg-base-100 border border-t-0 border-base-300 rounded-b-lg',
            },
        },
        onUpdate({ editor }) {
            // Tiptap outputs HTML, which is perfect for storing in the database
            onChange(editor.getHTML());
        },
    });

    return (
        <div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} placeholder={placeholder} />
        </div>
    )
}