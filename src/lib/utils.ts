import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class + gỡ xung đột tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Định dạng ngày ISO → dd/MM/yyyy HH:mm */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Rút gọn chuỗi, cắt giữa khi quá dài */
export function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.floor(max / 2))}…${value.slice(-Math.floor(max / 2))}`;
}

/** Tạo excerpt dễ đọc từ Markdown để hiển thị trong danh sách note. */
export function markdownExcerpt(value: string, max = 110): string {
  return truncate(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[.*?\]\(.*?\)/g, " ")
      .replace(/[#>*_`~\-]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim(),
    max,
  );
}
