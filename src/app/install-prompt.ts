import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallResult = "accepted" | "dismissed" | "manual" | "share";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallResult> => {
    if (!deferredPrompt) {
      if (isIOS() && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
          return "share";
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return "dismissed";
          }
        }
      }
      return "manual";
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome;
  }, [deferredPrompt]);

  // Hiện nút cả khi trình duyệt chưa phát beforeinstallprompt để người dùng
  // vẫn có hướng dẫn cài thủ công từ menu trình duyệt.
  // Android/Chrome chỉ cài tự động khi trình duyệt đã cung cấp prompt.
  // iOS không hỗ trợ prompt này nên vẫn cho phép mở hướng dẫn cài thủ công.
  return { canInstall: !installed && (!!deferredPrompt || isIOS()), install };
}
