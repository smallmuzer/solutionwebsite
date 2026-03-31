import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link, Undo, Redo, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const ToolbarBtn = ({ icon: Icon, command, arg, title }: { icon: any; command: string; arg?: string; title: string }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); document.execCommand(command, false, arg); }}
    title={title}
    className="p-1.5 rounded hover:bg-secondary/20 transition-colors text-muted-foreground hover:text-foreground"
  >
    <Icon size={14} />
  </button>
);

const RichTextEditor = ({ value, onChange, placeholder = "Type here...", minHeight = "100px" }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const internal  = useRef(false);

  useEffect(() => {
    if (editorRef.current && !internal.current) {
      if (editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || "";
    }
    internal.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) { internal.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const insertLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = prompt("Enter URL:");
    if (url) { document.execCommand("createLink", false, url); handleInput(); }
  };

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-transparent">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/40 bg-muted/10 flex-wrap">
        <ToolbarBtn icon={Bold}         command="bold"                 title="Bold" />
        <ToolbarBtn icon={Italic}       command="italic"               title="Italic" />
        <ToolbarBtn icon={Underline}    command="underline"            title="Underline" />
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolbarBtn icon={List}         command="insertUnorderedList"  title="Bullet List" />
        <ToolbarBtn icon={ListOrdered}  command="insertOrderedList"    title="Numbered List" />
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolbarBtn icon={AlignLeft}    command="justifyLeft"          title="Align Left" />
        <ToolbarBtn icon={AlignCenter}  command="justifyCenter"        title="Align Center" />
        <ToolbarBtn icon={AlignRight}   command="justifyRight"         title="Align Right" />
        <div className="w-px h-4 bg-border/50 mx-1" />
        <button type="button" onMouseDown={insertLink} title="Insert Link"
          className="p-1.5 rounded hover:bg-secondary/20 transition-colors text-muted-foreground hover:text-foreground">
          <Link size={14} />
        </button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolbarBtn icon={Undo} command="undo" title="Undo" />
        <ToolbarBtn icon={Redo} command="redo" title="Redo" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="px-3 py-2 text-sm text-foreground outline-none overflow-y-auto bg-transparent
          prose prose-sm max-w-none dark:prose-invert
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/40
          focus:ring-1 focus:ring-secondary/30"
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
