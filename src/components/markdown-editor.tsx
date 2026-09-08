import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { useTheme } from "@/app/theme-context";
import { cn } from "@/lib/utils";
import type { Extension } from "@codemirror/state";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** placeholder hiển thị khi rỗng */
  placeholder?: string;
  /** đọc-only (dùng cho mode preview / read-only) */
  readOnly?: boolean;
}

/**
 * Editor markdown dựa trên CodeMirror 6:
 * - số dòng (lineNumbers), syntax highlight markdown + code ngôn ngữ lồng (tsx, js, mermaid...).
 * - theme theo app (githubLight / githubDark) — đồng bộ dark/light.
 * - Hỗ trợ GFM markdown (bảng, task list) qua lang-markdown.
 */
export function MarkdownEditor({
  value,
  onChange,
  className,
  placeholder,
  readOnly = false,
}: MarkdownEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const extensions = useMemo<Extension[]>(
    () => [
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
        addKeymap: true,
      }),
    ],
    [],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={isDark ? githubDark : githubLight}
      height="100%"
      style={{ height: "100%", fontSize: 13 }}
      className={cn("h-full", className)}
      placeholder={placeholder}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightSpecialChars: true,
        foldGutter: true,
        drawSelection: true,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
      }}
      editable={!readOnly}
    />
  );
}
