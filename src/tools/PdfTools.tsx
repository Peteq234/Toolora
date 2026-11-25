import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, StatTile, Workspace } from "@/components/ui";
import { downloadFile } from "@/lib/utils";

type PdfFile = { file: File; pages: number; bytes: ArrayBuffer };

type PdfLike = {
  getPageCount(): number;
  copyPages(source: PdfLike, indices: number[]): Promise<unknown[]>;
  addPage(page: unknown): void;
  save(): Promise<Uint8Array>;
};

async function loadPdf(data: ArrayBuffer): Promise<PdfLike> {
  const { PDFDocument } = await import("pdf-lib");
  try {
    return (await PDFDocument.load(data, { ignoreEncryption: false })) as unknown as PdfLike;
  } catch {
    throw new Error("This PDF could not be opened. Password-protected or corrupted PDFs are not supported.");
  }
}

async function readPdf(file: File): Promise<PdfFile> {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error(`${file.name} is not a PDF file.`);
  }
  if (file.size > 80 * 1024 * 1024) throw new Error(`${file.name} is larger than 80 MB.`);
  const bytes = await file.arrayBuffer();
  const pdf = await loadPdf(bytes);
  return { file, pages: pdf.getPageCount(), bytes };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parsePageRanges(raw: string, pageCount: number): number[] | { error: string } {
  const cleaned = raw.trim();
  if (!cleaned) return { error: "Enter at least one page or range, for example 1-3, 5." };
  const pages = new Set<number>();
  for (const part of cleaned.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < start) return { error: `"${token}" is not a valid range.` };
      if (end > pageCount) return { error: `Page ${end} is outside this PDF, which has ${pageCount} pages.` };
      for (let page = start; page <= end; page += 1) pages.add(page);
      continue;
    }
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > pageCount) return { error: `Page ${page} is outside this PDF, which has ${pageCount} pages.` };
      pages.add(page);
      continue;
    }
    return { error: `"${token}" is not a page number or range.` };
  }
  if (pages.size === 0) return { error: "No valid pages were selected." };
  return [...pages].sort((a, b) => a - b);
}

async function buildPdf(sourceBytes: ArrayBuffer, pages: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const source = await loadPdf(sourceBytes);
  const target = (await PDFDocument.create()) as unknown as PdfLike;
  const copied = await target.copyPages(source, pages.map((page) => page - 1));
  copied.forEach((page) => target.addPage(page));
  return target.save();
}

function PdfDrop({
  multiple = false,
  onFiles,
  label,
}: {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label: string;
}) {
  const [active, setActive] = useState(false);
  const [inputKey] = useState(() => `pdf-${Math.random().toString(36).slice(2)}`);
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        onFiles([...event.dataTransfer.files].filter((file) => file.name.toLowerCase().endsWith(".pdf")));
      }}
      className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${active ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"}`}
    >
      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300">
        <Icon name="fileText" size={20} />
      </span>
      <p className="mt-3 text-[13.5px] font-semibold text-mist-100">{label}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-mist-500">
        PDF files are read and rewritten in your browser with pdf-lib. Nothing is uploaded. Files up
        to 80 MB each.
      </p>
      <label htmlFor={inputKey} className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-400 px-4 text-[13px] font-bold text-ink-950 transition hover:bg-brand-300">
        <Icon name="plus" size={15} /> Choose {multiple ? "PDF files" : "a PDF"}
      </label>
      <input
        id={inputKey}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles([...event.target.files ?? []].filter((file) => file.name.toLowerCase().endsWith(".pdf")));
          event.target.value = "";
        }}
      />
    </div>
  );
}

/* --------------------------------- PDF merge ------------------------------- */

export function PdfMerge() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  useEffect(() => () => setResult(null), []);

  async function addFiles(incoming: File[]) {
    setError("");
    const accepted: PdfFile[] = [];
    for (const file of incoming) {
      try {
        accepted.push(await readPdf(file));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "A file could not be read.");
      }
    }
    setFiles((current) => [...current, ...accepted]);
  }

  function move(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function merge() {
    if (files.length < 2) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const item of files) {
        const source = await PDFDocument.load(item.bytes);
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      setResult({ bytes, pages: merged.getPageCount() });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The merge failed. One file may be protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Workspace slug="pdf-merge">
      <div className="space-y-4">
        <PdfDrop multiple label="Drop PDFs to combine" onFiles={(files) => void addFiles(files)} />

        {files.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            {files.map((item, index) => (
              <div key={`${item.file.name}-${index}`} className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-b-0">
                <span className="w-5 font-mono text-[10px] text-mist-600">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-mist-200">{item.file.name}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-mist-500">{item.pages} pages · {formatBytes(item.file.size)}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="grid size-7 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30 hover:text-mist-100">
                    <Icon name="chevronDown" size={11} className="rotate-180" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === files.length - 1} aria-label="Move down" className="grid size-7 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30 hover:text-mist-100">
                    <Icon name="chevronDown" size={11} />
                  </button>
                  <button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${item.file.name}`} className="grid size-7 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300">
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <Note tone="warn">{error}</Note>}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void merge()} disabled={files.length < 2 || busy}>
            <Icon name={busy ? "refresh" : "layers"} size={15} className={busy ? "animate-spin" : ""} />
            {busy ? "Merging locally…" : `Merge ${files.length || ""} PDFs`}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setResult(null); }} disabled={!files.length}>
            <Icon name="trash" size={13} /> Remove all
          </Button>
        </div>

        {files.length === 1 && <Note tone="info">Add at least one more PDF to merge. Use PDF Split or Page Extractor for a single file.</Note>}

        {result && (
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.05] p-4">
            <p className="text-[12.5px] font-semibold text-mist-100">Merged PDF ready · {result.pages} pages · {formatBytes(result.bytes.length)}</p>
            <Button className="mt-2" size="sm" onClick={() => downloadFile(result.bytes as unknown as string, "toolsy-merged.pdf", "application/pdf")}>
              <Icon name="download" size={14} /> Download merged PDF
            </Button>
          </div>
        )}

        <Note tone="info">
          Order matters: files are merged top to bottom. Bookmarks, forms, annotations and digital
          signatures cannot be preserved by a browser-side merge, and encrypted PDFs are rejected with
          an explanation rather than silently producing a broken file.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- PDF split ------------------------------- */

export function PdfSplit() {
  const [source, setSource] = useState<PdfFile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outputs, setOutputs] = useState<{ label: string; bytes: Uint8Array }[]>([]);
  const [everyPage, setEveryPage] = useState(false);

  async function accept(files: File[]) {
    if (!files[0]) return;
    setError("");
    setOutputs([]);
    try {
      setSource(await readPdf(files[0]));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read this PDF.");
    }
  }

  async function split() {
    if (!source) return;
    setBusy(true);
    setError("");
    setOutputs([]);
    try {
      if (everyPage) {
        const parts: { label: string; bytes: Uint8Array }[] = [];
        for (let page = 1; page <= source.pages; page += 1) {
          parts.push({ label: `page-${page}.pdf`, bytes: await buildPdf(source.bytes, [page]) });
        }
        setOutputs(parts);
      } else {
        const half = Math.ceil(source.pages / 2);
        setOutputs([
          { label: `pages-1-${half}.pdf`, bytes: await buildPdf(source.bytes, Array.from({ length: half }, (_, i) => i + 1)) },
          ...(half < source.pages ? [{ label: `pages-${half + 1}-${source.pages}.pdf`, bytes: await buildPdf(source.bytes, Array.from({ length: source.pages - half }, (_, i) => half + i + 1)) }] : []),
        ]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Splitting failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Workspace slug="pdf-split">
      <div className="space-y-4">
        {!source ? (
          <PdfDrop label="Drop a PDF to split" onFiles={(files) => void accept(files)} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <span className="truncate font-mono text-[11.5px] text-mist-200">{source.file.name}</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{source.pages} pages · {formatBytes(source.file.size)}</span>
              <Button variant="ghost" size="sm" onClick={() => { setSource(null); setOutputs([]); }}>
                <Icon name="trash" size={12} /> Remove
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEveryPage(false)}
                aria-pressed={!everyPage}
                className={!everyPage ? "rounded-xl border border-brand-400/40 bg-brand-400/[0.07] p-3 text-left" : "rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left"}
              >
                <p className="text-[12.5px] font-semibold text-mist-100">Split into two halves</p>
                <p className="mt-0.5 text-[11px] text-mist-500">Useful for large documents sent in parts.</p>
              </button>
              <button
                type="button"
                onClick={() => setEveryPage(true)}
                aria-pressed={everyPage}
                className={everyPage ? "rounded-xl border border-brand-400/40 bg-brand-400/[0.07] p-3 text-left" : "rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left"}
              >
                <p className="text-[12.5px] font-semibold text-mist-100">One PDF per page</p>
                <p className="mt-0.5 text-[11px] text-mist-500">Each page becomes a separate download.</p>
              </button>
            </div>

            {error && <Note tone="warn">{error}</Note>}

            <Button onClick={() => void split()} disabled={busy}>
              <Icon name={busy ? "refresh" : "layers"} size={15} className={busy ? "animate-spin" : ""} />
              {busy ? "Splitting locally…" : "Split PDF"}
            </Button>

            {outputs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-mist-100">{outputs.length} output {outputs.length === 1 ? "file" : "files"} ready</p>
                <div className="max-h-[260px] space-y-1.5 overflow-auto pr-1">
                  {outputs.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.018] px-3 py-2">
                      <span className="truncate font-mono text-[11px] text-mist-300">{item.label}</span>
                      <span className="shrink-0 font-mono text-[9.5px] text-mist-600">{formatBytes(item.bytes.length)}</span>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(item.bytes as unknown as string, item.label, "application/pdf")}>
                        <Icon name="download" size={12} /> Save
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] text-mist-500">Browsers may ask permission for multiple downloads. Save each file individually.</p>
              </div>
            )}

            <Note tone="info">
              Splitting preserves page content but not document-level features such as outlines,
              embedded fonts not needed by the pages, or signatures. Encrypted PDFs are refused.
            </Note>
          </>
        )}
      </div>
    </Workspace>
  );
}

/* ------------------------------ page extractor ----------------------------- */

export function PdfPageExtractor() {
  const [source, setSource] = useState<PdfFile | null>(null);
  const [ranges, setRanges] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function accept(files: File[]) {
    if (!files[0]) return;
    setError("");
    setResult(null);
    try {
      const loaded = await readPdf(files[0]);
      setSource(loaded);
      setRanges(`1-${Math.min(loaded.pages, 3)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read this PDF.");
    }
  }

  const parsed = source ? parsePageRanges(ranges, source.pages) : null;

  async function extract() {
    if (!source || !parsed || "error" in parsed) return;
    setBusy(true);
    setError("");
    try {
      const bytes = await buildPdf(source.bytes, parsed);
      setResult(bytes);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Workspace slug="pdf-page-extractor">
      <div className="space-y-4">
        {!source ? (
          <PdfDrop label="Drop a PDF to extract pages" onFiles={(files) => void accept(files)} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <span className="truncate font-mono text-[11.5px] text-mist-200">{source.file.name}</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{source.pages} pages</span>
              <Button variant="ghost" size="sm" onClick={() => { setSource(null); setResult(null); setRanges(""); }}>
                <Icon name="trash" size={12} /> Remove
              </Button>
            </div>

            <Field label="Pages to extract" htmlFor="extract-ranges" hint="comma separated, 1-based">
              <Input id="extract-ranges" value={ranges} onChange={(event) => setRanges(event.target.value)} placeholder="1-3, 5, 8-10" className="font-mono" />
            </Field>
            {"error" in (parsed ?? {}) && (
              <Note tone="warn">{parsed && "error" in parsed ? parsed.error : ""}</Note>
            )}
            {parsed && !("error" in parsed) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-mist-500">{parsed.length} pages selected:</span>
                <span className="font-mono text-[11px] text-brand-200">{parsed.join(", ")}</span>
              </div>
            )}

            {error && <Note tone="warn">{error}</Note>}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void extract()} disabled={busy || !parsed || "error" in parsed}>
                <Icon name={busy ? "refresh" : "fileText"} size={15} className={busy ? "animate-spin" : ""} />
                {busy ? "Extracting…" : "Extract selected pages"}
              </Button>
              {result && (
                <Button variant="primary" size="sm" onClick={() => downloadFile(result as unknown as string, "toolsy-extracted-pages.pdf", "application/pdf")}>
                  <Icon name="download" size={14} /> Download extracted PDF
                </Button>
              )}
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatTile label="Output size" value={formatBytes(result.length)} />
                <StatTile label="Pages" value={parsed && !("error" in parsed) ? String(parsed.length) : "—"} />
                <StatTile label="Source pages" value={String(source.pages)} />
              </div>
            )}

            <CopyButton
              value={parsed && !("error" in parsed) ? parsed.join(", ") : ""}
              label="Copy selected page numbers"
              copiedLabel="Copied"
            />

            <Note tone="info">
              Example: <span className="font-mono text-mist-300">1-3, 7, 10-12</span> extracts ten pages
              in that order. Pages are renumbered in the output. Repeat a number to duplicate a page.
            </Note>
          </>
        )}
      </div>
    </Workspace>
  );
}
