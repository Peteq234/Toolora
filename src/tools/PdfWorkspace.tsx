import { useEffect, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, Select, Slider, StatTile, Workspace } from "@/components/ui";
import {
  canvasToBlob,
  downloadBlob,
  downloadBytes,
  formatBytes,
  parsePageSelection,
  renderPage,
  withPdf,
} from "@/pdf/engine";

type PdfSource = { file: File; pages: number };

function SourceRow({ file, pages, onRemove }: { file: File; pages?: number; onRemove: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <Icon name="fileText" size={14} className="shrink-0 text-brand-300" />
      <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-mist-200">{file.name}</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-mist-500">
        {pages ? `${pages} pages · ` : ""}{formatBytes(file.size)}
      </span>
      <Button variant="ghost" size="sm" onClick={onRemove}><Icon name="trash" size={12} /> Remove</Button>
    </div>
  );
}

function PdfDrop({ onFiles, multiple = false, label }: { onFiles: (files: File[]) => void; multiple?: boolean; label: string }) {
  const [active, setActive] = useState(false);
  const id = useMemo(() => `pdf-drop-${Math.random().toString(36).slice(2)}`, []);
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        onFiles([...event.dataTransfer.files].filter((file) => file.name.toLowerCase().endsWith(".pdf")));
      }}
      className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${active ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"}`}
    >
      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300"><Icon name="layers" size={20} /></span>
      <p className="mt-3 text-[13.5px] font-semibold text-mist-100">{label}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-mist-500">PDF processing runs in your browser with PDF.js. Nothing is uploaded. Files up to 80 MB.</p>
      <label htmlFor={id} className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-400 px-4 text-[13px] font-bold text-ink-950 hover:bg-brand-300">
        <Icon name="plus" size={15} /> Choose {multiple ? "PDF files" : "a PDF"}
      </label>
      <input id={id} type="file" accept="application/pdf,.pdf" multiple={multiple} className="sr-only" onChange={(event) => {
        onFiles([...event.target.files ?? []].filter((file) => file.name.toLowerCase().endsWith(".pdf")));
        event.target.value = "";
      }} />
    </div>
  );
}

/* -------------------------------- compressor ------------------------------ */

export function PdfCompressor() {
  const [source, setSource] = useState<PdfSource | null>(null);
  const [quality, setQuality] = useState(60);
  const [scale, setScale] = useState(1.4);
  const [format, setFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ dpi: string; bytes: Uint8Array; originalSize: number; pages: number } | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>("");

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setResult(null); setPreview(""); setSource(null);
    try {
      await withPdf(file, async (pdf) => {
        setSource({ file, pages: pdf.numPages });
        const page = await renderPage(pdf, 1, Math.min(scale, 1.5));
        const blob = await canvasToBlob(page.canvas, "image/jpeg", 0.7);
        setPreview(URL.createObjectURL(blob));
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read this PDF.");
    }
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function compress() {
    if (!source) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const compiled = await withPdf(source.file, async (pdf) => {
        const output = await PDFDocument.create();
        setProgress({ done: 0, total: pdf.numPages });
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const rendered = await renderPage(pdf, pageNumber, scale);
          const blob = await canvasToBlob(rendered.canvas, format, quality / 100);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const embedded = format === "image/webp" && !supportsWebp() ? await output.embedJpg(bytes) : format === "image/jpeg" ? await output.embedJpg(bytes) : await embedWebpOrJpeg(output, bytes);
          const page = output.addPage([rendered.width, rendered.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: rendered.width, height: rendered.height });
          setProgress({ done: pageNumber, total: pdf.numPages });
        }
        return { bytes: await output.save(), pages: output.getPageCount() };
      });
      setResult({ ...compiled, dpi: `${Math.round(scale * 72)}`, originalSize: source.file.size });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Compression failed.");
    } finally {
      setBusy(false);
    }
  }

  const saved = result ? result.originalSize - result.bytes.length : 0;

  return (
    <Workspace slug="pdf-compressor">
      <div className="space-y-4">
        {!source ? <PdfDrop label="Drop a PDF to compress" onFiles={(files) => void accept(files)} /> : (
          <>
            <SourceRow file={source.file} pages={source.pages} onRemove={() => { setSource(null); setResult(null); setPreview(""); }} />
            {preview && <img src={preview} alt="First page preview" className="max-h-[220px] rounded-xl border border-white/[0.08] object-contain" />}
            <div className="grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
              <Slider label="JPEG/WebP quality" value={quality} min={20} max={90} step={5} onChange={setQuality} suffix="%" />
              <Slider label="Render scale" value={Math.round(scale * 10) / 10} min={0.6} max={2} step={0.1} onChange={setScale} suffix="×" />
              <Field label="Image format inside the PDF" htmlFor="pdf-compress-format">
                <Select id="pdf-compress-format" value={format} onChange={(event) => setFormat(event.target.value as typeof format)} options={[
                  { value: "image/jpeg", label: "JPEG — broad compatibility" },
                  { value: "image/webp", label: "WebP — smaller, newer readers only" },
                ]} />
              </Field>
              <p className="text-[10.5px] leading-relaxed text-mist-500">Lower scale reduces resolution and size. Text becomes part of the image; keep the original if selectable text or accessibility matters.</p>
            </div>
            {error && <Note tone="warn">{error}</Note>}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void compress()} disabled={busy}>
                <Icon name={busy ? "refresh" : "layers"} size={15} className={busy ? "animate-spin" : ""} />
                {busy ? `Compressing ${progress.done}/${progress.total}…` : "Compress PDF"}
              </Button>
              {result && (
                <Button variant="primary" size="sm" onClick={() => downloadBytes(result.bytes, "toolora-compressed.pdf")}>
                  <Icon name="download" size={14} /> Download {formatBytes(result.bytes.length)}
                </Button>
              )}
            </div>
            {result && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Original" value={formatBytes(result.originalSize)} />
                <StatTile label="Compressed" value={formatBytes(result.bytes.length)} />
                <StatTile label="Difference" value={<span className={saved > 0 ? "text-brand-300" : "text-amber-300"}>{saved > 0 ? `−${Math.round((saved / result.originalSize) * 100)}%` : "larger"}</span>} />
                <StatTile label="Pages" value={String(result.pages)} />
              </div>
            )}
            {result && saved <= 0 && <Note tone="warn" title="This PDF did not get smaller">Text-heavy PDFs are already efficient. Keep the original, or lower quality and scale further. Rasterising also removes selectable text.</Note>}
          </>
        )}
      </div>
    </Workspace>
  );
}

function supportsWebp(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}
async function embedWebpOrJpeg(doc: PDFDocument, bytes: Uint8Array) {
  try {
    return await (doc as unknown as { embedWebp?: (data: Uint8Array) => Promise<never> }).embedWebp?.(bytes) ?? await doc.embedJpg(bytes);
  } catch {
    return doc.embedJpg(bytes);
  }
}

/* -------------------------------- to images ------------------------------- */

export function PdfToImages() {
  const [source, setSource] = useState<PdfSource | null>(null);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [scale, setScale] = useState(2);
  const [range, setRange] = useState("");
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<{ page: number; url: string; size: number }[]>([]);
  const [error, setError] = useState("");

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setImages([]);
    try {
      await withPdf(file, async (pdf) => { setSource({ file, pages: pdf.numPages }); setRange(`1-${Math.min(pdf.numPages, 5)}`); });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not read this PDF."); }
  }

  useEffect(() => () => { images.forEach((image) => URL.revokeObjectURL(image.url)); }, [images]);

  async function run() {
    if (!source) return;
    setBusy(true); setError("");
    try {
      const selected = parsePageSelection(range, source.pages);
      if ("error" in selected) { setError(selected.error); return; }
      const produced: { page: number; url: string; size: number }[] = [];
      await withPdf(source.file, async (pdf) => {
        for (const pageNumber of selected) {
          const rendered = await renderPage(pdf, pageNumber, scale);
          const blob = await canvasToBlob(rendered.canvas, format === "png" ? "image/png" : "image/jpeg", 0.9);
          produced.push({ page: pageNumber, url: URL.createObjectURL(blob), size: blob.size });
        }
      });
      setImages(produced);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conversion failed. The document may use unsupported features.");
    } finally { setBusy(false); }
  }

  return (
    <Workspace slug="pdf-to-images">
      <div className="space-y-4">
        {!source ? <PdfDrop label="Drop a PDF to convert to images" onFiles={(files) => void accept(files)} /> : (
          <>
            <SourceRow file={source.file} pages={source.pages} onRemove={() => { setSource(null); setImages([]); }} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Format" htmlFor="pdf-img-format"><Select id="pdf-img-format" value={format} onChange={(event) => setFormat(event.target.value as "jpg" | "png")} options={[{ value: "jpg", label: "JPG — smaller" }, { value: "png", label: "PNG — lossless" }]} /></Field>
              <Field label="Pages" htmlFor="pdf-img-range" hint="e.g. 1-3, 7"><Input id="pdf-img-range" value={range} onChange={(event) => setRange(event.target.value)} className="font-mono" /></Field>
              <Field label="Resolution" htmlFor="pdf-img-scale"><Select id="pdf-img-scale" value={String(scale)} onChange={(event) => setScale(Number(event.target.value))} options={[{ value: "1", label: "1× (screen)" }, { value: "2", label: "2× (sharp)" }, { value: "3", label: "3× (print)" }]} /></Field>
            </div>
            {error && <Note tone="warn">{error}</Note>}
            <Button onClick={() => void run()} disabled={busy}><Icon name={busy ? "refresh" : "image"} size={15} className={busy ? "animate-spin" : ""} />{busy ? "Rendering pages…" : "Convert pages"}</Button>
            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <div key={image.page} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-2">
                    <img src={image.url} alt={`Page ${image.page}`} className="rounded-lg border border-white/[0.06] object-contain" />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[9.5px] text-mist-500">p.{image.page} · {formatBytes(image.size)}</span>
                      <a href={image.url} download={`page-${image.page}.${format}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2 text-[11px] text-mist-200 hover:border-brand-400/30 hover:text-brand-200"><Icon name="download" size={12} /> Save</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Workspace>
  );
}

/* ------------------------------- images to PDF ---------------------------- */

export function ImagesToPdf() {
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [pageSize, setPageSize] = useState<"auto" | "a4" | "letter">("a4");
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { files.forEach((item) => URL.revokeObjectURL(item.url)); }, [files]);

  function add(incoming: File[]) {
    const accepted = incoming.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (accepted.length !== incoming.length) setError("Only JPG, PNG and WebP images are supported.");
    setFiles((current) => [...current, ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
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

  async function build() {
    if (!files.length) return;
    setBusy(true); setError("");
    try {
      const pdf = await PDFDocument.create();
      for (const { file } of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        if (pageSize === "auto") {
          const page = pdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        } else {
          const [width, height] = pageSize === "a4" ? [595.28, 841.89] : [612, 792];
          const page = pdf.addPage([width, height]);
          const available = { width: width - margin * 2, height: height - margin * 2 };
          const scale = Math.min(available.width / image.width, available.height / image.height);
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          page.drawImage(image, { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight });
        }
      }
      downloadBytes(await pdf.save(), "toolora-images.pdf");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build the PDF. One image may be unsupported.");
    } finally { setBusy(false); }
  }

  return (
    <Workspace slug="images-to-pdf">
      <div className="space-y-4">
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.015] px-5 py-7 text-center hover:border-brand-400/40">
          <span className="mx-auto grid size-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300"><Icon name="image" size={20} /></span>
          <p className="mt-2 text-[13.5px] font-semibold text-mist-100">Add images to combine</p>
          <p className="mt-1 text-[11px] text-mist-500">JPG, PNG or WebP, multiple files allowed. Processed locally.</p>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { add([...event.target.files ?? []]); event.target.value = ""; }} />
        </label>
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((item, index) => (
              <div key={`${item.file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.018] px-2 py-1.5">
                <img src={item.url} alt="" className="size-8 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-mist-300">{item.file.name}</span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move earlier" className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30"><Icon name="chevronDown" size={10} className="rotate-180" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === files.length - 1} aria-label="Move later" className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30"><Icon name="chevronDown" size={10} /></button>
                <button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} aria-label="Remove image" className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="trash" size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Page size" htmlFor="images-pdf-size"><Select id="images-pdf-size" value={pageSize} onChange={(event) => setPageSize(event.target.value as typeof pageSize)} options={[{ value: "a4", label: "A4 — fit with margins" }, { value: "letter", label: "Letter — fit with margins" }, { value: "auto", label: "Match image dimensions" }]} /></Field>
          <Field label="Margin (pt)" htmlFor="images-pdf-margin"><Input id="images-pdf-margin" type="number" min={0} max={100} value={margin} onChange={(event) => setMargin(Math.max(0, Number(event.target.value) || 0))} className="font-mono" /></Field>
        </div>
        {error && <Note tone="warn">{error}</Note>}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void build()} disabled={!files.length || busy}><Icon name={busy ? "refresh" : "fileText"} size={15} className={busy ? "animate-spin" : ""} />{busy ? "Building PDF…" : `Create PDF from ${files.length} image${files.length === 1 ? "" : "s"}`}</Button>
          <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={!files.length}>Clear</Button>
        </div>
        <Note tone="info">PNG transparency is flattened onto the page background. Tall or wide images are scaled to fit, never cropped.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- page organizer --------------------------- */

type OrganizerPage = { id: string; originalPage: number; rotation: number };

export function PdfOrganizer() {
  const [source, setSource] = useState<PdfSource | null>(null);
  const [pages, setPages] = useState<OrganizerPage[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setThumbnails({}); setPages([]);
    try {
      await withPdf(file, async (pdf) => {
        setSource({ file, pages: pdf.numPages });
        setPages(Array.from({ length: pdf.numPages }, (_, index) => ({ id: `page-${index}-${Date.now()}`, originalPage: index + 1, rotation: 0 })));
        const thumbs: Record<number, string> = {};
        for (let number = 1; number <= Math.min(pdf.numPages, 40); number += 1) {
          const rendered = await renderPage(pdf, number, 0.22);
          const blob = await canvasToBlob(rendered.canvas, "image/jpeg", 0.6);
          thumbs[number] = URL.createObjectURL(blob);
        }
        setThumbnails(thumbs);
      });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not read this PDF."); }
  }

  useEffect(() => () => { Object.values(thumbnails).forEach((url) => URL.revokeObjectURL(url)); }, [thumbnails]);

  function move(from: number, to: number) {
    if (to < 0 || to >= pages.length || from === to) return;
    setPages((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function rotate(index: number) {
    setPages((current) => current.map((page, i) => i === index ? { ...page, rotation: (page.rotation + 90) % 360 } : page));
  }

  async function exportPdf() {
    if (!source || pages.length === 0) return;
    setBusy(true); setError("");
    try {
      const sourceBytes = await source.file.arrayBuffer();
      const original = await PDFDocument.load(sourceBytes);
      const output = await PDFDocument.create();
      for (const page of pages) {
        const [copied] = await output.copyPages(original, [page.originalPage - 1]);
        const size = copied.getSize();
        if (page.rotation % 180 !== 0) copied.setSize(size.height, size.width);
        copied.setRotation({ type: "degrees" as never, angle: page.rotation as 0 | 90 | 180 | 270 });
        output.addPage(copied);
      }
      downloadBytes(await output.save(), "toolora-organised.pdf");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export this PDF.");
    } finally { setBusy(false); }
  }

  return (
    <Workspace slug="pdf-organizer">
      <div className="space-y-4">
        {!source ? <PdfDrop label="Drop a PDF to organise its pages" onFiles={(files) => void accept(files)} /> : (
          <>
            <SourceRow file={source.file} pages={source.pages} onRemove={() => { setSource(null); setPages([]); }} />
            {error && <Note tone="warn">{error}</Note>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { if (dragIndex !== null) move(dragIndex, index); setDragIndex(null); }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-1.5"
                >
                  <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-lg bg-ink-950/60">
                    {thumbnails[page.originalPage] ? (
                      <img src={thumbnails[page.originalPage]} alt={`Page ${page.originalPage}`} className="max-h-full max-w-full object-contain transition-transform" style={{ transform: `rotate(${page.rotation}deg)` }} />
                    ) : <Icon name="fileText" size={18} className="text-mist-600" />}
                    <span className="absolute left-1 top-1 rounded bg-ink-950/80 px-1 font-mono text-[8px] text-mist-300">{index + 1}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-0.5">
                    <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move page earlier" className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30"><Icon name="chevronLeft" size={10} /></button>
                    <button type="button" onClick={() => rotate(index)} aria-label={`Rotate page ${index + 1}`} className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 hover:text-brand-300"><Icon name="refresh" size={10} /></button>
                    <button type="button" onClick={() => setPages((current) => current.filter((_, i) => i !== index))} aria-label={`Delete page ${index + 1}`} className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="trash" size={10} /></button>
                    <button type="button" onClick={() => move(index, index + 1)} disabled={index === pages.length - 1} aria-label="Move page later" className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 disabled:opacity-30"><Icon name="chevronRight" size={10} /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-mist-500">Drag thumbnails to reorder, rotate in 90° steps, or delete pages. The original PDF is never modified.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void exportPdf()} disabled={busy || pages.length === 0}><Icon name={busy ? "refresh" : "download"} size={15} className={busy ? "animate-spin" : ""} />{busy ? "Exporting…" : `Export ${pages.length} pages`}</Button>
              <Button variant="ghost" size="sm" onClick={() => { void accept([source.file]); }}>Reset order</Button>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">thumbnails: first 40 pages</span>
            </div>
          </>
        )}
      </div>
    </Workspace>
  );
}

/* --------------------------------- metadata ------------------------------- */

type MetaEntry = { key: string; value: string };

export function PdfMetadataViewer() {
  const [entries, setEntries] = useState<MetaEntry[]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; pages: number } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "reading">("idle");

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setEntries([]); setStatus("reading");
    try {
      await withPdf(file, async (pdf) => {
        setFileInfo({ name: file.name, size: file.size, pages: pdf.numPages });
        const data = await pdf.getMetadata().catch(() => null);
        const info = (data?.info ?? {}) as Record<string, unknown>;
        const rows: MetaEntry[] = Object.entries(info)
          .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
          .map(([key, value]) => ({ key, value: String(value) }));
        setEntries(rows.length ? rows : []);
      });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not read metadata."); }
    finally { setStatus("idle"); }
  }

  return (
    <Workspace slug="pdf-metadata-viewer">
      <div className="space-y-4">
        <PdfDrop label="Inspect PDF metadata" onFiles={(files) => void accept(files)} />
        {status === "reading" && <p className="text-[12px] text-mist-500">Reading document information…</p>}
        {error && <Note tone="warn">{error}</Note>}
        {fileInfo && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile label="File" value={<span className="truncate text-[11px]">{fileInfo.name}</span>} />
              <StatTile label="Pages" value={String(fileInfo.pages)} />
              <StatTile label="Size" value={formatBytes(fileInfo.size)} />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500"><span>Field</span><span>Value</span></div>
              {entries.map((entry) => (
                <div key={entry.key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] gap-2 border-b border-white/[0.04] px-3 py-2 text-[11.5px] last:border-b-0">
                  <span className="truncate font-mono text-mist-500">{entry.key}</span>
                  <span className="min-w-0 break-words text-mist-200">{entry.value}</span>
                </div>
              ))}
              {entries.length === 0 && <p className="px-3 py-4 text-[11.5px] text-mist-500">This PDF contains no document-information fields.</p>}
            </div>
            <CopyButton value={entries.map((entry) => `${entry.key}: ${entry.value}`).join("\n")} label="Copy metadata" copiedLabel="Copied" />
          </>
        )}
        <Note tone="warn">Metadata can reveal author names, software or GPS data. This viewer only reads it; use a PDF editor to remove fields before publishing.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- to text -------------------------------- */

export function PdfToText() {
  const [source, setSource] = useState<PdfSource | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emptyPages, setEmptyPages] = useState(0);
  const [pageRange, setPageRange] = useState("");

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setText(""); setEmptyPages(0);
    try { await withPdf(file, async (pdf) => { setSource({ file, pages: pdf.numPages }); setPageRange(`1-${Math.min(pdf.numPages, 10)}`); }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not read this PDF."); }
  }

  async function extract() {
    if (!source) return;
    setBusy(true); setError(""); setText("");
    try {
      const selected = parsePageSelection(pageRange, source.pages);
      if ("error" in selected) { setError(selected.error); return; }
      let empty = 0;
      const chunks: string[] = [];
      await withPdf(source.file, async (pdf) => {
        for (const pageNumber of selected) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const items = content.items as { str?: string; hasEOL?: boolean }[];
          const pageText = items.map((item) => `${item.str ?? ""}${item.hasEOL ? "\n" : " "}`).join("").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
          if (!pageText) empty += 1;
          chunks.push(`--- Page ${pageNumber} ---\n${pageText}`);
        }
      });
      setEmptyPages(empty);
      setText(chunks.join("\n\n"));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Text extraction failed."); }
    finally { setBusy(false); }
  }

  function download() {
    if (!text) return;
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "toolora-extracted.txt");
  }

  return (
    <Workspace slug="pdf-to-text">
      <div className="space-y-4">
        {!source ? <PdfDrop label="Extract text from a PDF" onFiles={(files) => void accept(files)} /> : (
          <>
            <SourceRow file={source.file} pages={source.pages} onRemove={() => { setSource(null); setText(""); }} />
            <Field label="Pages to extract" htmlFor="pdf-text-range" hint="e.g. 1-5, 9"><Input id="pdf-text-range" value={pageRange} onChange={(event) => setPageRange(event.target.value)} className="font-mono" /></Field>
            {error && <Note tone="warn">{error}</Note>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void extract()} disabled={busy}><Icon name={busy ? "refresh" : "fileText"} size={15} className={busy ? "animate-spin" : ""} />{busy ? "Extracting…" : "Extract text"}</Button>
              {text && <Button variant="secondary" size="sm" onClick={download}><Icon name="download" size={14} /> Download .txt</Button>}
              {text && <CopyButton value={text} label="Copy text" copiedLabel="Copied" />}
            </div>
            {emptyPages > 0 && <Note tone="warn" title={`${emptyPages} page${emptyPages === 1 ? " has" : "s have"} no text layer`}>This PDF likely contains scanned images. OCR is required to read those pages, and Toolora does not perform OCR in this tool. Nothing is guessed or invented.</Note>}
            {text && <textarea readOnly value={text} rows={14} className="field-input min-h-[260px] resize-y bg-ink-950/50 font-mono text-[11.5px] leading-relaxed" aria-label="Extracted PDF text" />}
          </>
        )}
      </div>
    </Workspace>
  );
}
