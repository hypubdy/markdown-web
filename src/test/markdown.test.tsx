import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "@/components/markdown-preview";

/**
 * Kiểm tra render markdown — đặc biệt nâng cấp: khối ```mermaid được bọc bởi
 * <Mermaid> (không hiển thị dạng code plain). GFM vẫn render bình thường.
 */
describe("MarkdownPreview", () => {
  it("render GFM: bảng + task list + code inline", () => {
    const md = [
      "| A | B |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "- [x] Đã làm",
      "",
      "Inline `code` ở đây.",
    ].join("\n");
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("1")).toBeTruthy(); // bảng
    expect(screen.getByText("Đã làm")).toBeTruthy(); // task list
    expect(screen.getByText("code")).toBeTruthy(); // inline code
  });

  it("render khối ```mermaid thành component Mermaid (không là code plain)", () => {
    const md = "```mermaid\nflowchart LR\n  A --> B\n```";
    render(<MarkdownPreview content={md} />);
    // Không được render như <code> thường
    expect(screen.queryByText("flowchart LR")).toBeNull();
    // Có vùng loading "Đang vẽ sơ đồ Mermaid…" trước khi mermaid render xong
    expect(screen.getByText(/Đang vẽ sơ đồ Mermaid/)).toBeTruthy();
  });

  it("render khối code ngôn ngữ khác vẫn là code plain", () => {
    const md = "```js\nconst x = 1;\n```";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("const x = 1;")).toBeTruthy();
  });
});
