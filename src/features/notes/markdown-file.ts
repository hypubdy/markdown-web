export interface MarkdownDraft {
  title: string;
  content: string;
}

export function isMarkdownFile(file: File) {
  return file.name.toLowerCase().endsWith(".md");
}

export async function readMarkdownFile(file: File): Promise<MarkdownDraft> {
  if (!isMarkdownFile(file)) {
    throw new Error("Vui lòng chọn file có phần mở rộng .md");
  }

  const title = file.name.replace(/\.md$/i, "").trim() || "Ghi chú mới";
  return { title, content: await readFileText(file) };
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc file Markdown"));
    reader.readAsText(file);
  });
}
