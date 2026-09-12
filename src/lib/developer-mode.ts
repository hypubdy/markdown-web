/** Workspace beta chỉ được mở khi bật rõ ràng trong môi trường triển khai. */
export const DEVELOPER_MODE_CHANGED_EVENT = "markdown-developer-mode-changed";
const STORAGE_KEY = "markdown-developer-mode";

export function isDeveloperModeEnabled(): boolean {
  if (import.meta.env.VITE_DEVELOPER_MODE === "true") return true;
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableDeveloperMode(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Vẫn phát sự kiện để UI cập nhật trong trường hợp localStorage bị chặn.
  }
  window.dispatchEvent(new Event(DEVELOPER_MODE_CHANGED_EVENT));
}
