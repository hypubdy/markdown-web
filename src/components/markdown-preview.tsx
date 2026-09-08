import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "@/components/mermaid";
import { useTheme } from "@/app/theme-context";
import { cn } from "@/lib/utils";
import { isValidElement, type ComponentPropsWithoutRef } from "react";

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  /** class bổ sung cho thẻ article bao ngoài */
  wrapperClassName?: string;
}

/** Nhận biết khối fenced code ` ```mermaid ` */
function isMermaidBlock(props: ComponentPropsWithoutRef<"code">): boolean {
  const className = typeof props.className === "string" ? props.className : "";
  const language = className.match(/language-([\w-]+)/)?.[1];
  return language === "mermaid";
}

/** Lấy text thuần từ children của node code */
function textOf(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (isValidElement(children)) return String((children.props as { children?: unknown }).children ?? "");
  return String(children ?? "");
}

/**
 * Render markdown thành HTML an toàn. GFM (bảng, gạch đầu dòng, task list) + Mermaid.
 * Cố ý dùng react-markdown (không dangerouslySetInnerHTML) để tránh XSS;
 * riêng khối ```mermaid được vẽ bằng thư viện mermaid (SVG sinh an toàn).
 *
 * Lưu ý: `prose` (typography plugin) mặc định tô khối code nền slate-800 (tối).
 * Ta override `pre`/`code` về nền sáng để đồng bộ theme sáng của app.
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "prose prose-stone max-w-none text-sm leading-relaxed dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override code để vẽ mermaid, các ngôn ngữ khác giữ nguyên
          code(props) {
            if (isMermaidBlock(props)) {
              return <Mermaid code={textOf(props.children)} />;
            }
            return (
              <code
                className={cn(
                  "rounded px-1 py-0.5 text-sm",
                  isDark ? "bg-secondary text-secondary-foreground" : "bg-muted",
                )}
                {...props}
              />
            );
          },
          // Khối code fenced → nền sáng/tối theo theme, kèm scroll ngang ổn định
          pre(props) {
            return (
              <pre
                className={cn(
                  "my-4 overflow-x-auto rounded-lg border p-3 text-sm leading-relaxed [scrollbar-gutter:stable]",
                  isDark
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-muted/40",
                )}
                {...props}
              />
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
