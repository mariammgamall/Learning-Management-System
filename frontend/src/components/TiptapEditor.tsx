'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading3,
  List,
  Code,
} from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with external value resets (e.g. form submit success)
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-beige-300 rounded-xl overflow-hidden bg-white">
      {/* Rich Editor Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-beige-100 border-b border-beige-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('bold') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('italic') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('underline') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('highlight') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('heading', { level: 3 }) ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('bulletList') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-beige-300 transition-all ${
            editor.isActive('codeBlock') ? 'bg-beige-300 text-text-primary' : ''
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} className="tiptap min-h-[150px] p-3 text-xs outline-none" />
    </div>
  );
}
