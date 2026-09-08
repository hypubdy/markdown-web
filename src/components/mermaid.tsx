import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "@/app/theme-context";
import { cn } from "@/lib/utils";

export interface MermaidProps {
  code: string;
  className?: string;
}

interface MermaidApi {
  default: {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, code: string) => Promise<{ svg: string }>;
  };
}

/**
 * Render một khối ` ```mermaid ` thành sơ đồ.
 * - Lazy-load `mermaid` (dynamic import) → tách chunk riêng cho build.
 * - `render()` tạo SVG chuỗi an toàn (mermaid tự escape), nhúng qua dangerouslySetInnerHTML.
 * - Có trạng thái đang render / lỗi để UI không crash khi diagram sai cú pháp.
 * - Theme (dark/light) đồng bộ theo app.
 */
export function Mermaid({ code, className }: MermaidProps) {
  const { theme } = useTheme();
  const id = useId().replace(/[:]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mermaid: MermaidApi["default"] | null = null;

    (async () => {
      try {
        const mod = (await import("mermaid")) as MermaidApi;
        mermaid = mod.default;
        if (!mermaid.initialize) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: theme === "dark" ? "dark" : "default",
          fontFamily: "inherit",
        });
        const { svg: rendered } = await mermaid.render(`mdn_mermaid_${id}`, code);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, code, theme]);

  if (error) {
    return (
      <div
        className={cn(
          "my-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive",
          className,
        )}
      >
        <p className="font-medium">Không vẽ được sơ đồ Mermaid</p>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs opacity-80">
          {code}
        </pre>
      </div>
    );
  }

  if (svg === null) {
    return (
      <div
        className={cn("my-3 flex items-center gap-2 text-xs text-muted-foreground", className)}
        ref={containerRef}
      >
        <span className="animate-pulse">Đang vẽ sơ đồ Mermaid…</span>
      </div>
    );
  }

  return (
    <div
      className={cn("my-3 flex justify-center overflow-x-auto", className)}
      // Mermaid sinh SVG đặc tả — tin cậy; nội dung người dùng đã được mermaid escape/parse
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
