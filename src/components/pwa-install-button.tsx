import { toast } from "sonner";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/app/install-prompt";
import { Button } from "@/components/ui/button";

export function PwaInstallButton() {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  async function handleInstall() {
    const result = await install();
    if (result === "manual") {
      toast.info("Mở menu trình duyệt và chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính");
    }
  }

  return (
    <Button
      type="button"
      className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
      onClick={() => void handleInstall()}
    >
      <Download className="h-4 w-4" />
      Cài ứng dụng
    </Button>
  );
}
