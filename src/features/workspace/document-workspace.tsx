import { lazy, Suspense, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { renderAsync } from "docx-preview";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileType,
  FileUp,
  FolderOpen,
  RotateCw,
  Presentation,
  Search,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SpreadsheetViewer = lazy(() => import("./spreadsheet-viewer"));

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const ACCEPTED_EXTENSIONS = ["docx", "xls", "xlsx", "pptx", "pdf"] as const;
type SupportedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

type WorkspaceFile = {
  id: string;
  file: File;
  extension: SupportedExtension;
};

type Slide = {
  title: string;
  lines: string[];
};

type SpreadsheetCell = {
  display: string;
  type?: string;
  style?: { fgColor?: { rgb?: string } };
};

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getSupportedExtension(file: File): SupportedExtension | null {
  const extension = extensionOf(file.name);
  return ACCEPTED_EXTENSIONS.includes(extension as SupportedExtension)
    ? (extension as SupportedExtension)
    : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(file: File): string {
  if (!file.lastModified) return "Vừa thêm";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(file.lastModified);
}

function fileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function fileIcon(extension: SupportedExtension) {
  switch (extension) {
    case "pdf":
      return FileType;
    case "xls":
    case "xlsx":
      return FileSpreadsheet;
    case "pptx":
      return Presentation;
    default:
      return FileText;
  }
}

function extensionLabel(extension: SupportedExtension): string {
  return extension.toUpperCase();
}

export function DocumentWorkspacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeFile = files.find((item) => item.id === activeId) ?? null;

  function addFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList)
      .map((file): WorkspaceFile | null => {
        const extension = getSupportedExtension(file);
        return extension ? { id: fileId(file), file, extension } : null;
      })
      .filter((item): item is WorkspaceFile => item !== null);

    if (nextFiles.length === 0) return;

    setFiles((current) => {
      const existing = new Set(current.map((item) => item.id));
      return [...current, ...nextFiles.filter((item) => !existing.has(item.id))];
    });
    setActiveId((current) => current ?? nextFiles[0]?.id ?? null);
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const index = current.findIndex((item) => item.id === id);
      const next = current.filter((item) => item.id !== id);
      if (id === activeId) {
        setActiveId(next[Math.max(0, index - 1)]?.id ?? next[0]?.id ?? null);
      }
      return next;
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <AppShell title="Workspace" subtitle="Đọc tài liệu · Beta" fullBleed>
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/20 md:flex-row"
        onDragOver={(event) => {
          if (Array.from(event.dataTransfer.types).includes("Files")) {
            event.preventDefault();
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <aside className="flex w-full shrink-0 flex-col border-b bg-background md:w-72 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-3 border-b p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <h1 className="truncate text-sm font-semibold">Tài liệu của bạn</h1>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Beta</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Chỉ đọc trên thiết bị này</p>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => inputRef.current?.click()}
              title="Thêm tài liệu"
              aria-label="Thêm tài liệu"
            >
              <FileUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {files.length === 0 ? (
              <button
                type="button"
                className="flex w-full flex-col items-center rounded-lg border border-dashed p-6 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50"
                onClick={() => inputRef.current?.click()}
              >
                <UploadCloud className="mb-2 h-7 w-7 text-primary/70" />
                <span className="text-sm font-medium text-foreground">Mở tài liệu</span>
                <span className="mt-1 text-xs">Kéo thả hoặc chọn file</span>
              </button>
            ) : (
              <div className="space-y-1">
                {files.map((item) => {
                  const Icon = fileIcon(item.extension);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors",
                        item.id === activeId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{item.file.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{extensionLabel(item.extension)} · {formatBytes(item.file.size)}</span>
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Đóng ${item.file.name}`}
                        className="hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:block"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFile(item.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            removeFile(item.id);
                          }
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t p-3 text-[11px] leading-relaxed text-muted-foreground">
            Hỗ trợ beta: <span className="font-medium text-foreground">DOCX, XLSX, PPTX, PDF</span>. File được xử lý cục bộ và không tự động tải lên máy chủ.
          </div>
        </aside>

        <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {isDragging && (
            <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-sm font-medium text-primary">
              Thả tài liệu vào đây để mở
            </div>
          )}
          {activeFile ? (
            <DocumentReader document={activeFile} onClose={() => removeFile(activeFile.id)} />
          ) : (
            <EmptyWorkspace onOpen={() => inputRef.current?.click()} />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function EmptyWorkspace({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Archive className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold">Workspace đọc tài liệu</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Mở một file DOCX, XLSX, PPTX hoặc PDF để xem nội dung ngay trong ứng dụng.
      </p>
      <Button className="mt-5" onClick={onOpen}>
        <FileUp />
        Chọn tài liệu
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Tính năng beta · xử lý cục bộ trên trình duyệt</p>
    </div>
  );
}

function DocumentReader({ document, onClose }: { document: WorkspaceFile; onClose: () => void }) {
  const Icon = fileIcon(document.extension);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{document.file.name}</h2>
          <p className="text-xs text-muted-foreground">{extensionLabel(document.extension)} · {formatBytes(document.file.size)} · {formatDate(document.file)}</p>
        </div>
        <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">Chỉ đọc</Badge>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose} title="Đóng tài liệu" aria-label="Đóng tài liệu">
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {document.extension === "pdf" && <PdfReader file={document.file} />}
        {document.extension === "docx" && <DocxReader file={document.file} />}
        {document.extension === "xls" && <XlsxReader file={document.file} />}
        {document.extension === "xlsx" && (
          <Suspense fallback={<LoadingReader label="Đang tải spreadsheet viewer…" />}>
            <SpreadsheetViewer file={document.file} />
          </Suspense>
        )}
        {document.extension === "pptx" && <PptxReader file={document.file} />}
      </div>
    </div>
  );
}

function ReaderState({ children, error }: { children: ReactNode; error?: string }) {
  if (error) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center p-6">
        <Card className="max-w-lg border-destructive/30">
          <CardContent className="flex gap-3 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div><p className="font-medium">Không thể đọc tài liệu</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

function DocxReader({ file }: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    if (containerRef.current) containerRef.current.replaceChildren();
    void file.arrayBuffer().then((arrayBuffer) => {
      if (cancelled || !containerRef.current) return;
      return renderAsync(arrayBuffer, containerRef.current, undefined, {
        className: "docx-preview-container",
        inWrapper: false,
      });
    }).then(() => {
      if (!cancelled) setLoaded(true);
    }).catch(() => {
      if (!cancelled) setError("File DOCX có thể bị hỏng hoặc không đúng định dạng.");
    });
    return () => { cancelled = true; };
  }, [file]);

  if (error) return <ReaderState error={error}>{null}</ReaderState>;
  return <ReaderState><div className="relative flex min-h-64 justify-center"><div ref={containerRef} className={loaded ? "min-w-max p-4 md:p-8" : "hidden"} />{!loaded && <LoadingReader label="Đang hiển thị tài liệu Word…" />}</div></ReaderState>;
  if (!loaded) return <LoadingReader label="Đang chuyển đổi tài liệu Word…" />;
  return <ReaderState><div ref={containerRef} className="min-w-max p-4 md:p-8" /></ReaderState>;
}

function XlsxReader({ file }: { file: File }) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook>();
  const [activeSheet, setActiveSheet] = useState("");
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  useEffect(() => {
    let cancelled = false;
    setWorkbook(undefined);
    setError(undefined);
    setQuery("");
    void file.arrayBuffer().then((arrayBuffer) => {
      const nextWorkbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true, cellNF: true, cellDates: true });
      if (!cancelled) {
        setWorkbook(nextWorkbook);
        setActiveSheet(nextWorkbook.SheetNames[0] ?? "");
      }
    }).catch(() => {
      if (!cancelled) setError("File XLSX có thể bị hỏng hoặc không đúng định dạng.");
    });
    return () => { cancelled = true; };
  }, [file]);

  if (error) return <ReaderState error={error}>{null}</ReaderState>;
  if (!workbook || !activeSheet) return <LoadingReader label="Đang đọc bảng tính…" />;
  const worksheet = workbook.Sheets[activeSheet];
  const range = worksheet["!ref"] ? XLSX.utils.decode_range(worksheet["!ref"]) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  const rowCount = Math.max(1, range.e.r - range.s.r + 1);
  const columnCount = Math.max(1, range.e.c - range.s.c + 1, ...rows.map((row) => row.length));
  const normalizedRows = Array.from({ length: rowCount }, (_, sourceIndex) => ({
    sourceIndex,
    cells: Array.from({ length: columnCount }, (_, columnIndex): SpreadsheetCell => {
      const address = XLSX.utils.encode_cell({ r: range.s.r + sourceIndex, c: range.s.c + columnIndex });
      const cell = worksheet[address] as XLSX.CellObject | undefined;
      const value = cell?.w ?? cell?.v;
      return {
        display: value instanceof Date ? value.toLocaleString("vi-VN") : String(value ?? ""),
        type: cell?.t,
        style: typeof cell?.s === "object" && cell.s !== null ? cell.s as SpreadsheetCell["style"] : undefined,
      };
    }),
  }));
  const visibleRows = (() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return normalizedRows;
    return normalizedRows.filter(({ cells }) => cells.some((cell) => cell.display.toLowerCase().includes(normalizedQuery)));
  })();
  const columnWidths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const column = worksheet["!cols"]?.[columnIndex];
    if (column?.wpx) return Math.max(48, Math.round(column.wpx));
    const characterWidth = column?.wch ?? column?.width ?? 10;
    return Math.max(48, Math.round(characterWidth * 7 + 5));
  });
  const rowHeights = worksheet["!rows"] ?? [];
  return (
    <div className="flex min-w-full flex-col items-center p-4 md:p-6">
      <div className="mb-4 flex w-full max-w-5xl flex-wrap items-center gap-2 border-b pb-2">
        {workbook.SheetNames.map((sheet) => <button key={sheet} type="button" onClick={() => { setActiveSheet(sheet); setQuery(""); }} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeSheet === sheet ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>{sheet}</button>)}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong sheet" className="h-7 w-40 rounded-md border bg-background px-2 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
      </div>
      <div className="max-w-full overflow-auto rounded-lg border bg-background">
        <table className="mx-auto border-collapse text-xs" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 48 }} />
            {columnWidths.map((width, columnIndex) => <col key={columnIndex} style={{ width }} />)}
          </colgroup>
          <tbody>
            {visibleRows.map(({ cells, sourceIndex }) => <tr key={sourceIndex} style={rowHeights[sourceIndex]?.hpx || rowHeights[sourceIndex]?.hpt ? { height: rowHeights[sourceIndex].hpx ?? rowHeights[sourceIndex].hpt! * 1.333 } : undefined} className="border-b last:border-b-0 hover:bg-muted/40">
              <td className="sticky left-0 border-r bg-muted/60 px-2 py-1.5 text-center text-xs text-muted-foreground">{sourceIndex + 1}</td>
              {cells.map((cell, columnIndex) => <td key={columnIndex} title={cell.display} style={cell.style?.fgColor?.rgb ? { backgroundColor: `#${cell.style.fgColor.rgb.slice(-6)}` } : undefined} className={cn("overflow-hidden border-r px-2 py-1.5 align-top last:border-r-0 whitespace-nowrap text-ellipsis", cell.type === "n" ? "text-right tabular-nums" : "text-left")}>{cell.display}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{workbook.SheetNames.length} sheet · {rows.length} dòng · chế độ chỉ đọc</p>
    </div>
  );
}

function PptxReader({ file }: { file: File }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    void extractSlides(file).then((nextSlides) => {
      if (!cancelled) { setSlides(nextSlides); setLoaded(true); }
    }).catch(() => {
      if (!cancelled) setError("File PPTX có thể bị hỏng hoặc không đúng định dạng.");
    });
    return () => { cancelled = true; };
  }, [file]);

  if (error) return <ReaderState error={error}>{null}</ReaderState>;
  if (!loaded) return <LoadingReader label="Đang đọc bản trình chiếu…" />;
  if (slides.length === 0) return <ReaderState error="Không tìm thấy slide văn bản trong file PPTX.">{null}</ReaderState>;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-8">
      {slides.map((slide, index) => <Card key={index} className="overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slide {index + 1}</span><Presentation className="h-4 w-4 text-primary" /></div>
        <CardContent className="p-6"><h3 className="mb-4 text-lg font-semibold">{slide.title || `Slide ${index + 1}`}</h3><div className="space-y-2 text-sm leading-6">{slide.lines.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</div></CardContent>
      </Card>)}
      <p className="text-xs text-muted-foreground">{slides.length} slide · nội dung văn bản được trích xuất để đọc nhanh</p>
    </div>
  );
}

async function extractSlides(file: File): Promise<Slide[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
  return Promise.all(slideNames.map(async (name) => {
    const xml = await zip.files[name].async("string");
    const document = new DOMParser().parseFromString(xml, "application/xml");
    const lines = Array.from(document.getElementsByTagNameNS("*", "t"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean);
    return { title: lines[0] ?? "", lines: lines.slice(1) };
  }));
}

function PdfReader({ file }: { file: File }) {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    setPdf(null);
    setPageCount(0);
    setCurrentPage(1);
    void file.arrayBuffer().then((arrayBuffer) => pdfjsLib.getDocument({ data: arrayBuffer }).promise).then((nextPdf) => {
      if (cancelled) return;
      setPdf(nextPdf);
      setPageCount(nextPdf.numPages);
      setCurrentPage(1);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError("File PDF có thể bị hỏng hoặc không đúng định dạng."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pdf || pageCount === 0) return;
    let cancelled = false;
    void (async () => {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = canvasRefs.current[pageNumber - 1];
        if (!canvas) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
      }
    })().catch(() => { if (!cancelled) setError("Không thể hiển thị một hoặc nhiều trang PDF."); });
    return () => { cancelled = true; };
  }, [pdf, pageCount, zoom, rotation]);

  if (error) return <ReaderState error={error}>{null}</ReaderState>;
  if (loading || !pdf) return <LoadingReader label="Đang hiển thị PDF…" />;
  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, pageCount));
    setCurrentPage(nextPage);
    document.getElementById(`pdf-page-${nextPage}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} aria-label="Trang trước"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-16 text-center text-xs">{currentPage} / {pageCount}</span>
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40" disabled={currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)} aria-label="Trang sau"><ChevronRight className="h-4 w-4" /></button>
        <span className="h-4 w-px bg-border" />
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40" disabled={zoom <= 0.75} onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))} aria-label="Thu nhỏ"><ZoomOut className="h-4 w-4" /></button>
        <span className="min-w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40" disabled={zoom >= 2.5} onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))} aria-label="Phóng to"><ZoomIn className="h-4 w-4" /></button>
        <button type="button" className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent" onClick={() => setRotation((value) => (value + 90) % 360)} aria-label="Xoay"><RotateCw className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-col items-center gap-4 overflow-auto bg-muted/40 p-4 md:p-8">
        {Array.from({ length: pageCount }, (_, index) => <div id={`pdf-page-${index + 1}`} key={index} className="bg-white shadow-md"><canvas ref={(canvas) => { canvasRefs.current[index] = canvas; }} className="h-auto max-w-full" /></div>)}
      </div>
    </div>
  );
}

function LoadingReader({ label }: { label: string }) {
  return <div className="flex h-full min-h-64 items-center justify-center p-6 text-sm text-muted-foreground"><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />{label}</div>;
}
