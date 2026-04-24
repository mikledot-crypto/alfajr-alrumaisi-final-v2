import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Image as ImageIcon,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Loader2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/supabase-helpers";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export function RichEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-xl shadow-md max-w-full h-auto my-6 mx-auto border border-border/60",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-gold-deep underline underline-offset-4 font-medium",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder: "اكتب محتوى المقال هنا بطريقة إبداعية..." }),
      TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "right" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-sm max-w-none rounded-b-xl border border-t-0 border-border bg-background p-4 sm:p-6 focus:outline-none min-h-[360px] leading-relaxed",
        dir: "rtl",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    children,
    title,
    disabled,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );

  const addImageByUrl = () => {
    const url = window.prompt("رابط الصورة (URL):");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadMediaFile(file, "editor");
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("تم رفع الصورة وإدراجها في المقال");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("الرابط (URL):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void uploadImage(e.target.files?.[0])}
      />
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="عنوان 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Btn>
          <Btn title="عنوان 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
          <Btn title="عنوان 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="عريض" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
          <Btn title="مائل" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
          <Btn title="اقتباس" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="محاذاة لليمين" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
          <Btn title="توسيط" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
          <Btn title="محاذاة لليسار" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="قائمة نقطية" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
          <Btn title="قائمة مرقمة" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="رابط" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="h-4 w-4" /></Btn>
          <Btn title="إضافة صورة برابط" onClick={addImageByUrl}><ImageIcon className="h-4 w-4" /></Btn>
          <Btn title="رفع صورة من الجهاز أو الهاتف" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Btn>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="تراجع" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
          <Btn title="إعادة" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
      <div className="border-t border-border bg-muted/20 px-4 py-2 text-[11px] leading-5 text-muted-foreground">
        يمكنك رفع الصور مباشرة من الهاتف أو الكمبيوتر. إذا فشل الرفع، شغّل migration الخاص بـ media bucket في Supabase.
      </div>
    </div>
  );
}
