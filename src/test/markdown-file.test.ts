import { describe, expect, it } from "vitest";
import { isMarkdownFile, readMarkdownFile } from "@/features/notes/markdown-file";

describe("markdown file helpers", () => {
  it("accepts .md files and creates a draft from the filename", async () => {
    const file = new File(["# Hello\n\nMarkdown content"], "README.md", {
      type: "text/markdown",
    });

    expect(isMarkdownFile(file)).toBe(true);
    await expect(readMarkdownFile(file)).resolves.toEqual({
      title: "README",
      content: "# Hello\n\nMarkdown content",
    });
  });

  it("rejects files without the .md extension", async () => {
    const file = new File(["plain text"], "notes.txt", { type: "text/plain" });

    expect(isMarkdownFile(file)).toBe(false);
    await expect(readMarkdownFile(file)).rejects.toThrow(".md");
  });

  it("uses a fallback title when the filename is only the extension", async () => {
    const file = new File(["content"], ".md", { type: "text/markdown" });

    await expect(readMarkdownFile(file)).resolves.toMatchObject({ title: "Ghi chú mới" });
  });
});
