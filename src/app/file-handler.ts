interface LaunchFileHandle {
  getFile: () => Promise<File>;
}

interface LaunchParams {
  files: LaunchFileHandle[];
}

interface LaunchQueue {
  setConsumer: (consumer: (params: LaunchParams) => void | Promise<void>) => void;
}

declare global {
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

type OpenedFileListener = (file: File) => void;

const listeners = new Set<OpenedFileListener>();
let pendingFile: File | null = null;
let initialized = false;

/** Đăng ký nhận file khi PWA được mở trực tiếp từ File Explorer. */
export function initializeFileHandler() {
  if (initialized || typeof window === "undefined" || !window.launchQueue) return;
  initialized = true;

  window.launchQueue.setConsumer(async ({ files }) => {
    const handle = files[0];
    if (!handle) return;

    const file = await handle.getFile();
    if (listeners.size === 0) {
      pendingFile = file;
      return;
    }

    listeners.forEach((listener) => listener(file));
  });
}

/** Đăng ký component nhận file; giữ lại file nếu app chưa mount trang notes. */
export function subscribeToOpenedFiles(listener: OpenedFileListener) {
  listeners.add(listener);

  if (pendingFile) {
    const file = pendingFile;
    pendingFile = null;
    queueMicrotask(() => listener(file));
  }

  return () => {
    listeners.delete(listener);
  };
}
