import { useCallback, useEffect, useState } from "react";
import { SpreadSheets, Worksheet } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";
import "@mescius/spread-sheets-io";
import "@mescius/spread-sheets/styles/gc.spread.sheets.excel2013white.css";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const spreadJsLicenseKey = import.meta.env.VITE_SPREADJS_LICENSE_KEY;
if (spreadJsLicenseKey) GC.Spread.Sheets.LicenseKey = spreadJsLicenseKey;

type SpreadsheetViewerProps = {
  file: File;
};

export default function SpreadsheetViewer({ file }: SpreadsheetViewerProps) {
  const [spread, setSpread] = useState<GC.Spread.Sheets.Workbook | null>(null);
  const [importError, setImportError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const handleWorkbookInitialized = useCallback((workbook: GC.Spread.Sheets.Workbook) => {
    workbook.options.allowUserEditFormula = false;
    workbook.options.allowUserResize = false;
    workbook.options.allowUserDragDrop = false;
    workbook.options.allowUserDragFill = false;
    setSpread(workbook);
  }, []);

  useEffect(() => {
    if (!spread) return;

    let cancelled = false;
    setIsLoading(true);
    setImportError(undefined);

    spread.import(
      file,
      () => {
        if (cancelled) return;
        for (let index = 0; index < spread.getSheetCount(); index += 1) {
          spread.getSheet(index).options.isProtected = true;
        }
        setIsLoading(false);
      },
      () => {
        if (!cancelled) {
          setImportError("Không thể hiển thị file Excel bằng spreadsheet viewer.");
          setIsLoading(false);
        }
      },
      {
        fileType: GC.Spread.Sheets.FileType.excel,
        includeStyles: true,
        includeFormulas: true,
        fullRecalc: false,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [file, spread]);

  if (importError) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center p-6">
        <Card className="max-w-lg border-destructive/30">
          <CardContent className="flex gap-3 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">Không thể đọc tài liệu</p>
              <p className="mt-1 text-sm text-muted-foreground">{importError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full bg-background">
      <SpreadSheets
        hostStyle={{ width: "100%", height: "100%" }}
        workbookInitialized={handleWorkbookInitialized}
        tabStripVisible
        allowContextMenu
        allowUserZoom
        showHorizontalScrollbar
        showVerticalScrollbar
      >
        <Worksheet name="Sheet1" />
      </SpreadSheets>
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Đang hiển thị bảng tính…
        </div>
      )}
    </div>
  );
}
