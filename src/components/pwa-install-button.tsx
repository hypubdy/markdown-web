import { toast } from "sonner";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/app/install-prompt";
import { Button } from "@/components/ui/button";

export function PwaInstallButton() {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  async function handleInstall() {
    const result = await install();
    if (result === "share") {
      toast.info("Trong bảng chia sẻ, chọn Thêm vào màn hình chính");
      return;
    }
    if (result === "manual") {
      toast.info("Mở menu trình duyệt và chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính");
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      className="pwa-install-button h-11 w-11 rounded-full shadow-lg"
      onClick={() => void handleInstall()}
      aria-label="Cài ứng dụng"
      title="Cài ứng dụng"
    >
      <Download className="h-5 w-5" />
    </Button>
  );
}
