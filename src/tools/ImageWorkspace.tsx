import { useEffect, useRef, useState } from "react";
import { zipSync } from "fflate";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, Select, Slider, StatTile, Workspace } from "@/components/ui";
import { downloadBlob } from "@/pdf/engine";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The browser could not decode this image."));
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed."))), type, quality);
  });
}

type ImageItem = { id: string; file: File; url: string; width: number; height: number };

function useImageFiles() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const urlsRef = useRef<string[]>([]);
  urlsRef.current = items.map((item) => item.url);

  // Revoke only on unmount. Revoking on every items change broke previously
  // added files (and their previews) when a second batch was appended.
  useEffect(() => () => { urlsRef.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  async function add(files: File[]) {
    setError("");
    const next: ImageItem[] = [];
    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) { setError(`${file.name}: supported formats are JPEG, PNG, WebP, GIF and AVIF.`); continue; }
      if (file.size > 40 * 1024 * 1024) { setError(`${file.name} is larger than 40 MB.`); continue; }
      const url = URL.createObjectURL(file);
      try {
        const image = await loadImage(url);
        next.push({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, url, width: image.naturalWidth, height: image.naturalHeight });
      } catch {
        URL.revokeObjectURL(url);
        setError(`${file.name} could not be decoded.`);
      }
    }
    setItems((current) => [...current, ...next]);
  }

  return { items, setItems, error, setError, add, dragging, setDragging };
}

function DropArea({ onFiles, label, multiple = true, testId }: { onFiles: (files: File[]) => void; label: string; multiple?: boolean; testId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => { event.preventDefault(); setActive(false); onFiles([...event.dataTransfer.files]); }}
      className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${active ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"}`}
    >
      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300"><Icon name="image" size={20} /></span>
      <p className="mt-3 text-[13.5px] font-semibold text-mist-100">{label}</p>
      <p className="mt-1 text-[11px] text-mist-500">Drop files here or choose them. Up to 40 MB each. Local processing only.</p>
      <Button className="mt-3" onClick={() => inputRef.current?.click()}><Icon name="plus" size={14} /> Choose image{multiple ? "s" : ""}</Button>
      <input ref={inputRef} data-testid={testId} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple={multiple} className="sr-only" onChange={(event) => { onFiles([...event.target.files ?? []]); event.target.value = ""; }} />
    </div>
  );
}

/* ------------------------------ bulk processor ---------------------------- */

type BulkResult = { id: string; name: string; url: string; size: number; original: number; ok: boolean; reason?: string };

export function BulkImageProcessor() {
  const { items, setItems, error, setError, add } = useImageFiles();
  const [maxWidth, setMaxWidth] = useState("1600");
  const [quality, setQuality] = useState(78);
  const [format, setFormat] = useState<"image/jpeg" | "image/webp" | "image/png">("image/webp");
  const [skipSmaller, setSkipSmaller] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [results, setResults] = useState<BulkResult[]>([]);
  const resultUrlsRef = useRef<string[]>([]);

  // Result URLs must stay alive while the list is visible; revoking them on
  // each progress update made Save links and the ZIP download fail.
  useEffect(() => () => { resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  async function run() {
    if (!items.length) return;
    setBusy(true); setDone(0); setError("");
    resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    resultUrlsRef.current = [];
    setResults([]);
    const produced: BulkResult[] = [];
    const limit = Math.max(1, Math.min(8000, Number(maxWidth) || 1600));
    for (const [index, item] of items.entries()) {
      try {
        const image = await loadImage(item.url);
        const scale = image.naturalWidth > limit ? limit / image.naturalWidth : 1;
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        if (format === "image/jpeg") { context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); }
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, width, height);
        const blob = await toBlob(canvas, format, quality / 100);
        if (skipSmaller && blob.size >= item.file.size && scale === 1) {
          produced.push({ id: item.id, name: item.file.name, url: item.url, size: item.file.size, original: item.file.size, ok: false, reason: "Skipped: result would be larger" });
        } else {
          const resultUrl = URL.createObjectURL(blob);
          resultUrlsRef.current.push(resultUrl);
          produced.push({ id: item.id, name: item.file.name.replace(/\.[^.]+$/, ""), url: resultUrl, size: blob.size, original: item.file.size, ok: true });
        }
      } catch (caught) {
        produced.push({ id: item.id, name: item.file.name, url: "", size: 0, original: item.file.size, ok: false, reason: caught instanceof Error ? caught.message : "Failed" });
      }
      setDone(index + 1);
      setResults([...produced]);
    }
    setBusy(false);
  }

  function downloadZip() {
    const good = results.filter((result) => result.ok && result.url);
    if (!good.length) return;
    const files: Record<string, Uint8Array> = {};
    const extension = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
    (async () => {
      for (const result of good) {
        const response = await fetch(result.url);
        files[`${result.name}-toolora.${extension}`] = new Uint8Array(await response.arrayBuffer());
      }
      downloadBlob(new Blob([zipSync(files) as unknown as BlobPart], { type: "application/zip" }), "toolora-images.zip");
    })().catch(() => setError("Could not build the ZIP archive. Try downloading files individually."));
  }

  const totalOriginal = results.reduce((sum, result) => sum + result.original, 0);
  const totalResult = results.reduce((sum, result) => sum + (result.ok ? result.size : 0), 0);
  const failed = results.filter((result) => !result.ok);

  return (
    <Workspace slug="bulk-image-processor">
      <div className="space-y-4">
        <DropArea label="Process multiple images at once" onFiles={(files) => void add(files)} testId="bulk-input" />
        {error && <Note tone="warn">{error}</Note>}
        {items.length > 0 && (
          <>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-mist-200">{items.length} file{items.length === 1 ? "" : "s"} ready</p>
                <Button variant="ghost" size="sm" onClick={() => { setItems([]); resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); resultUrlsRef.current = []; setResults([]); }}>Remove all</Button>
              </div>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-950/40 px-2 py-1.5">
                    <img src={item.url} alt="" className="size-8 rounded object-cover" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-mist-300">{item.file.name}</span>
                    <span className="shrink-0 font-mono text-[9px] text-mist-600">{item.width}×{item.height} · {formatBytes(item.file.size)}</span>
                    <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="grid size-6 shrink-0 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="close" size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 sm:grid-cols-3">
              <Field label="Max width (px)" htmlFor="bulk-width"><Input id="bulk-width" type="number" min={16} max={8000} value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} className="font-mono" /></Field>
              <Field label="Output format" htmlFor="bulk-format"><Select id="bulk-format" value={format} onChange={(event) => setFormat(event.target.value as typeof format)} options={[{ value: "image/webp", label: "WebP" }, { value: "image/jpeg", label: "JPEG" }, { value: "image/png", label: "PNG" }]} /></Field>
              <div className="flex items-end"><Slider label="Quality" value={quality} min={20} max={100} onChange={setQuality} suffix="%" /></div>
            </div>
            <label className="flex items-center gap-2 text-[11.5px] text-mist-400">
              <input type="checkbox" checked={skipSmaller} onChange={(event) => setSkipSmaller(event.target.checked)} className="size-4 accent-[#C7F05F]" />
              Keep the original when a result would be larger (recommended)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void run()} disabled={busy}><Icon name={busy ? "refresh" : "layers"} size={15} className={busy ? "animate-spin" : ""} />{busy ? `Processing ${done}/${items.length}…` : `Process ${items.length} image${items.length === 1 ? "" : "s"}`}</Button>
              {results.some((result) => result.ok) && <Button variant="secondary" size="sm" onClick={downloadZip}><Icon name="download" size={14} /> Download ZIP</Button>}
            </div>
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatTile label="Original total" value={formatBytes(totalOriginal)} />
                  <StatTile label="Result total" value={formatBytes(totalResult)} />
                  <StatTile label="Completed" value={String(results.filter((result) => result.ok).length)} />
                  <StatTile label="Failed / skipped" value={String(failed.length)} />
                </div>
                <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                  {results.map((result) => (
                    <div key={result.id} className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-b-0">
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-mist-300">{result.name}</span>
                      <span className="font-mono text-[9.5px] text-mist-500">{formatBytes(result.original)} → {result.ok ? formatBytes(result.size) : "—"}</span>
                      {result.ok ? <a href={result.url} download={`${result.name}-toolora`} className="inline-flex h-7 items-center gap-1 rounded border border-white/10 px-2 text-[10.5px] text-mist-200 hover:text-brand-200"><Icon name="download" size={11} /> Save</a> : <span className="text-[10px] text-amber-300">{result.reason}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        <Note tone="info">Processing is sequential so the page stays responsive. A little size growth can happen; keep the flagged originals. ZIP is generated locally with fflate.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- dimensions ------------------------------- */

export function ImageDimensionsChecker() {
  const { items, setItems, error, add } = useImageFiles();
  return (
    <Workspace slug="image-dimensions-checker">
      <div className="space-y-4">
        <DropArea label="Check image dimensions" onFiles={(files) => void add(files)} />
        {error && <Note tone="warn">{error}</Note>}
        {items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            <div className="grid grid-cols-[minmax(0,1fr)_80px_80px_90px_70px] gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-mist-500"><span>File</span><span className="text-right">W</span><span className="text-right">H</span><span className="text-right">Ratio</span><span className="text-right">Size</span></div>
            {items.map((item) => {
              const ratio = simplifyRatio(item.width, item.height);
              return (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_80px_80px_90px_70px] items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-[11px] last:border-b-0">
                  <span className="flex min-w-0 items-center gap-2"><img src={item.url} alt="" className="size-7 rounded object-cover" /><span className="truncate font-mono text-mist-300">{item.file.name}</span></span>
                  <span className="text-right font-mono text-mist-200">{item.width}</span>
                  <span className="text-right font-mono text-mist-200">{item.height}</span>
                  <span className="text-right font-mono text-mist-400">{ratio}</span>
                  <span className="text-right font-mono text-mist-500">{formatBytes(item.file.size)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && <CopyButton value={items.map((item) => `${item.file.name}: ${item.width}×${item.height} (${simplifyRatio(item.width, item.height)}), ${formatBytes(item.file.size)}`).join("\n")} label="Copy report" copiedLabel="Copied" />}
          {items.length > 0 && <Button variant="ghost" size="sm" onClick={() => setItems([])}>Clear</Button>}
        </div>
        <Note tone="info">Megapixels = width × height ÷ 1,000,000. For print, ask the printer how many pixels they need at the final size — screen dimensions alone do not determine print quality.</Note>
      </div>
    </Workspace>
  );
}

function simplifyRatio(width: number, height: number): string {
  if (!width || !height) return "—";
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/* ----------------------------- metadata viewer ---------------------------- */

function parseExif(buffer: ArrayBuffer): { tag: string; value: string }[] {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return [];
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1) {
      const start = offset + 4;
      if (String.fromCharCode(view.getUint8(start), view.getUint8(start + 1)) !== "Ex") return [];
      const tiff = start + 6;
      const little = view.getUint16(tiff) === 0x4949;
      const get16 = (at: number) => view.getUint16(at, little);
      const get32 = (at: number) => view.getUint32(at, little);
      if (get16(tiff + 2) !== 0x002a) return [];
      const dirStart = tiff + get32(tiff + 4);
      const count = get16(dirStart);
      const rows: { tag: string; value: string }[] = [];
      for (let index = 0; index < count; index += 1) {
        const entry = dirStart + 2 + index * 12;
        if (entry + 12 > view.byteLength) break;
        const tag = get16(entry);
        const type = get16(entry + 2);
        const length = get32(entry + 4);
        if (type === 2 && length > 1 && length < 500) {
          const valueOffset = length <= 4 ? entry + 8 : tiff + get32(entry + 8);
          let text = "";
          for (let i = 0; i < length - 1 && valueOffset + i < view.byteLength; i += 1) text += String.fromCharCode(view.getUint8(valueOffset + i));
          if (text.trim()) rows.push({ tag: EXIF_NAMES[tag] ?? `Tag 0x${tag.toString(16)}`, value: text.trim() });
        }
        if (type === 3 && length === 1) {
          rows.push({ tag: EXIF_NAMES[tag] ?? `Tag 0x${tag.toString(16)}`, value: String(get16(entry + 8)) });
        }
      }
      return rows;
    }
    if (!size) break;
    offset += 2 + size;
  }
  return [];
}

const EXIF_NAMES: Record<number, string> = {
  0x010f: "Camera make", 0x0110: "Camera model", 0x0112: "Orientation", 0x0131: "Software", 0x0132: "Modified",
  0x9003: "Captured", 0x8827: "ISO", 0x829a: "Exposure time", 0x829d: "Aperture (f-number)", 0x920a: "Focal length",
  0x9004: "Created", 0x010e: "Description", 0x8298: "Copyright", 0x011a: "X resolution",
};

export function ImageMetadataViewer() {
  const [rows, setRows] = useState<{ tag: string; value: string }[]>([]);
  const [info, setInfo] = useState<ImageItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setRows([]); setInfo(null); setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      setInfo({ id: "meta", file, url, width: image.naturalWidth, height: image.naturalHeight });
      if (file.type !== "image/jpeg") {
        setError("Full EXIF parsing is available for JPEG files. Basic dimensions are shown for other formats.");
      } else {
        setRows(parseExif(await file.arrayBuffer()));
      }
    } catch {
      setError("This image could not be decoded.");
    } finally { setBusy(false); }
  }

  return (
    <Workspace slug="image-metadata-viewer">
      <div className="space-y-4">
        <DropArea label="Inspect photo metadata" multiple={false} onFiles={(files) => void accept(files)} />
        {busy && <p className="text-[12px] text-mist-500">Reading metadata…</p>}
        {error && <Note tone="warn">{error}</Note>}
        {info && (
          <>
            <div className="flex flex-wrap gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              <img src={info.url} alt="Selected" className="max-h-32 rounded-lg border border-white/[0.08] object-contain" />
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <StatTile label="File" value={<span className="truncate text-[10.5px]">{info.file.name}</span>} />
                <StatTile label="Dimensions" value={`${info.width}×${info.height}`} />
                <StatTile label="Size" value={formatBytes(info.file.size)} />
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              {rows.length > 0 ? rows.map((row, index) => (
                <div key={`${row.tag}-${index}`} className="flex items-start justify-between gap-3 border-b border-white/[0.04] px-3 py-2 text-[11.5px] last:border-b-0">
                  <span className="text-mist-500">{row.tag}</span>
                  <span className="max-w-[60%] break-words text-right text-mist-200">{row.value}</span>
                </div>
              )) : <p className="px-3 py-4 text-[11.5px] text-mist-500">No readable EXIF fields were found. Many platforms strip metadata automatically.</p>}
            </div>
            {rows.length > 0 && <CopyButton value={rows.map((row) => `${row.tag}: ${row.value}`).join("\n")} label="Copy metadata" copiedLabel="Copied" />}
          </>
        )}
        <Note tone="warn">EXIF can contain GPS coordinates, device identifiers and timestamps. Re-encoding with the Image Compressor or Bulk Processor usually removes this metadata before sharing.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- favicon -------------------------------- */

export function FaviconGenerator() {
  const [mode, setMode] = useState<"letter" | "image">("letter");
  const [letter, setLetter] = useState("T");
  const [background, setBackground] = useState("#C7F05F");
  const [foreground, setForeground] = useState("#08090C");
  const [rounded, setRounded] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [outputs, setOutputs] = useState<{ size: number; url: string }[]>([]);
  const [error, setError] = useState("");
  const sizes = [16, 32, 48, 180, 512];

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  useEffect(() => () => { outputs.forEach((output) => URL.revokeObjectURL(output.url)); }, [outputs]);

  async function renderAll() {
    setError("");
    outputs.forEach((output) => URL.revokeObjectURL(output.url));
    const produced: { size: number; url: string }[] = [];
    try {
      let image: HTMLImageElement | null = null;
      if (mode === "image") {
        if (!imageUrl) { setError("Choose a square source image first."); return; }
        image = await loadImage(imageUrl);
      }
      for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        context.clearRect(0, 0, size, size);
        const radius = rounded ? size * 0.2 : 0;
        context.beginPath();
        context.moveTo(radius, 0);
        context.arcTo(size, 0, size, size, radius);
        context.arcTo(size, size, 0, size, radius);
        context.arcTo(0, size, 0, 0, radius);
        context.arcTo(0, 0, size, 0, radius);
        context.closePath();
        context.fillStyle = background;
        context.fill();
        if (mode === "letter") {
          context.fillStyle = foreground;
          context.font = `800 ${Math.round(size * 0.62)}px system-ui, sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText((letter || "T").slice(0, 2), size / 2, size * 0.54);
        } else if (image) {
          const scale = Math.min(size / image.width, size / image.height) * 0.82;
          const width = image.width * scale;
          const height = image.height * scale;
          context.save();
          context.beginPath();
          context.arc(size / 2, size / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
          context.clip();
          context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          context.restore();
        }
        const blob = await toBlob(canvas, "image/png", 1);
        produced.push({ size, url: URL.createObjectURL(blob) });
      }
      setOutputs(produced);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate icons.");
    }
  }

  const html = outputSnippet();
  return (
    <Workspace slug="favicon-generator">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["letter", "image"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setMode(value)} aria-pressed={mode === value} className={mode === value ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold capitalize text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] capitalize text-mist-400"}>{value === "letter" ? "Letter mark" : "From image"}</button>
          ))}
        </div>
        {mode === "letter" ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Letter(s)" htmlFor="favicon-letter"><Input id="favicon-letter" value={letter} onChange={(event) => setLetter(event.target.value.slice(0, 2))} maxLength={2} className="text-center text-[18px] font-bold" /></Field>
            <Field label="Background" htmlFor="favicon-bg"><input id="favicon-bg" type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-ink-900 p-1" /></Field>
            <Field label="Letter colour" htmlFor="favicon-fg"><input id="favicon-fg" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-ink-900 p-1" /></Field>
            <div className="flex items-end"><label className="flex items-center gap-2 text-[11.5px] text-mist-400"><input type="checkbox" checked={rounded} onChange={(event) => setRounded(event.target.checked)} className="size-4 accent-[#C7F05F]" /> Rounded</label></div>
          </div>
        ) : (
          <label className="block cursor-pointer rounded-xl border border-dashed border-white/15 p-4 text-center text-[12px] text-mist-400">
            <Icon name="image" size={18} className="mx-auto text-brand-300" />
            <span className="mt-1 block">Choose a square image for the icon</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); }} />
          </label>
        )}
        {error && <Note tone="warn">{error}</Note>}
        <Button onClick={() => void renderAll()}><Icon name="sparkles" size={15} /> Generate favicon set</Button>
        {outputs.length > 0 && (
          <>
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              {outputs.map((output) => (
                <div key={output.size} className="text-center">
                  <span className="grid place-items-center rounded-lg bg-white p-1.5" style={{ width: Math.max(32, Math.min(output.size, 96)), height: Math.max(32, Math.min(output.size, 96)) }}>
                    <img src={output.url} alt={`${output.size}px favicon`} width={Math.min(output.size, 88)} height={Math.min(output.size, 88)} />
                  </span>
                  <span className="mt-1 block font-mono text-[9px] text-mist-500">{output.size}px</span>
                  <a href={output.url} download={`favicon-${output.size}.png`} className="mt-1 inline-flex text-brand-300 hover:text-brand-200" aria-label={`Download ${output.size}px favicon`}><Icon name="download" size={12} /></a>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-mist-200">HTML for your &lt;head&gt;</p>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-ink-950/60 p-3 font-mono text-[10.5px] leading-relaxed text-mist-300"><code>{html}</code></pre>
              <div className="mt-2"><CopyButton value={html} label="Copy HTML" copiedLabel="Copied" /></div>
            </div>
          </>
        )}
        <Note tone="info">PNG icons work in modern browsers. Some older systems still request /favicon.ico, which this tool does not generate. The 512 px icon is suitable for the PWA manifest.</Note>
      </div>
    </Workspace>
  );
}

function outputSnippet(): string {
  return `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
<link rel="manifest" href="/site.webmanifest">`;
}

/* ----------------------------- social resizer ----------------------------- */

const SOCIAL_PRESETS = [
  { id: "instagram-square", label: "Instagram post", width: 1080, height: 1080 },
  { id: "instagram-story", label: "Instagram story / Reel", width: 1080, height: 1920 },
  { id: "facebook-post", label: "Facebook post", width: 1200, height: 630 },
  { id: "x-post", label: "X post", width: 1600, height: 900 },
  { id: "linkedin", label: "LinkedIn post", width: 1200, height: 627 },
  { id: "youtube-thumb", label: "YouTube thumbnail", width: 1280, height: 720 },
  { id: "og", label: "Open Graph image", width: 1200, height: 630 },
  { id: "profile", label: "Profile picture", width: 400, height: 400 },
];

export function SocialImageResizer() {
  const [preset, setPreset] = useState(SOCIAL_PRESETS[0].id);
  const [mode, setMode] = useState<"cover" | "fit">("cover");
  const [source, setSource] = useState<ImageItem | null>(null);
  const [result, setResult] = useState<string>("");
  const [size, setSize] = useState(0);
  const [error, setError] = useState("");

  const active = SOCIAL_PRESETS.find((item) => item.id === preset) ?? SOCIAL_PRESETS[0];

  useEffect(() => () => { if (result) URL.revokeObjectURL(result); }, [result]);

  async function accept(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(""); setResult("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      setSource({ id: "social", file, url, width: image.naturalWidth, height: image.naturalHeight });
    } catch { URL.revokeObjectURL(url); setError("This image could not be decoded."); }
  }

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    (async () => {
      try {
        const image = await loadImage(source.url);
        const canvas = document.createElement("canvas");
        canvas.width = active.width; canvas.height = active.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        context.fillStyle = "#0B0D11";
        context.fillRect(0, 0, active.width, active.height);
        const scale = mode === "cover" ? Math.max(active.width / image.width, active.height / image.height) : Math.min(active.width / image.width, active.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, (active.width - width) / 2, (active.height - height) / 2, width, height);
        const blob = await toBlob(canvas, "image/png", 0.95);
        if (!cancelled) { setResult(URL.createObjectURL(blob)); setSize(blob.size); }
      } catch (caught) { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not render this preset."); }
    })();
    return () => { cancelled = true; };
  }, [source, active, mode]);

  return (
    <Workspace slug="social-media-image-resizer">
      <div className="space-y-4">
        {!source ? <DropArea label="Resize an image for social media" multiple={false} onFiles={(files) => void accept(files)} /> : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-mist-300">{source.file.name}</span>
              <Button variant="ghost" size="sm" onClick={() => { setSource(null); setResult(""); }}>Replace</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Preset" htmlFor="social-preset"><Select id="social-preset" value={preset} onChange={(event) => setPreset(event.target.value)} options={SOCIAL_PRESETS.map((item) => ({ value: item.id, label: `${item.label} · ${item.width}×${item.height}` }))} /></Field>
              <Field label="Fit mode" htmlFor="social-mode"><Select id="social-mode" value={mode} onChange={(event) => setMode(event.target.value as "cover" | "fit")} options={[{ value: "cover", label: "Cover — fill and crop" }, { value: "fit", label: "Fit — letterbox" }]} /></Field>
              <div className="flex items-end"><span className="font-mono text-[11px] text-mist-400">{active.width} × {active.height} px</span></div>
            </div>
            {error && <Note tone="warn">{error}</Note>}
            {result && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">Original · {source.width}×{source.height}</p><img src={source.url} alt="Original" className="max-h-[240px] rounded-xl border border-white/[0.08] object-contain" /></div>
                  <div><p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-brand-300">Result · {active.width}×{active.height}</p><img src={result} alt="Resized result" className="max-h-[240px] rounded-xl border border-brand-400/25 object-contain" /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={result} download={`toolora-${active.id}.png`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-400 px-4 text-[13px] font-bold text-ink-950 hover:bg-brand-300"><Icon name="download" size={15} /> Download PNG · {formatBytes(size)}</a>
                </div>
              </>
            )}
          </>
        )}
        <Note tone="info">Presets are practical starting sizes, not guarantees — platforms change crops and safe zones. Important content should stay away from edges, especially in story formats.</Note>
      </div>
    </Workspace>
  );
}
