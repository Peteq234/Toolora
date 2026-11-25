import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  Select,
  Slider,
  StatTile,
  Workspace,
} from "@/components/ui";
import { downloadDataUrl } from "@/lib/utils";

type LoadedImage = {
  file: File;
  url: string;
  width: number;
  height: number;
  type: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode this image."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode this image."))), type, quality);
  });
}

function useLocalImage() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState("");
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const accept = useCallback(async (file: File) => {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("This image is larger than 30 MB. Use a smaller file to keep the browser responsive.");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const element = await loadImageElement(url);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setImage({ file, url, width: element.naturalWidth, height: element.naturalHeight, type: file.type });
    } catch {
      URL.revokeObjectURL(url);
      setError("The browser could not open this image. It may be damaged or unsupported.");
    }
  }, []);

  function clear() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setImage(null);
    setError("");
  }

  return { image, error, setError, accept, clear };
}

function ImageDropzone({
  onFile,
  label = "Drop an image here",
  hint = "JPEG, PNG or WebP up to 30 MB. Processed locally — never uploaded.",
  error,
}: {
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`rounded-2xl border-2 border-dashed px-5 py-9 text-center transition-colors ${active ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300">
        <Icon name="image" size={20} />
      </span>
      <p className="mt-3 text-[13.5px] font-semibold text-mist-100">{label}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-mist-500">{hint}</p>
      <Button className="mt-3" onClick={() => inputRef.current?.click()}>
        <Icon name="download" size={14} className="rotate-180" />
        Choose image
      </Button>
      {error && <p className="mt-2 text-[12px] font-medium text-rose-300" role="alert">{error}</p>}
    </div>
  );
}

function SourceBanner({ image, onReplace, onRemove }: { image: LoadedImage; onReplace: () => void; onRemove: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <span className="min-w-0 truncate font-mono text-[11px] text-mist-300">{image.file.name}</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">
        {image.width}×{image.height} · {formatBytes(image.file.size)}
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onReplace}>Replace</Button>
        <Button variant="ghost" size="sm" onClick={onRemove}><Icon name="trash" size={12} /> Remove</Button>
      </div>
    </div>
  );
}

/* -------------------------------- image resizer ---------------------------- */

export function ImageResizer() {
  const { image, error, setError, accept, clear } = useLocalImage();
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [lock, setLock] = useState(true);
  const [output, setOutput] = useState<string | null>(null);
  const [size, setSize] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image) {
      setWidth(image.width);
      setHeight(image.height);
    }
  }, [image]);

  const ratio = image ? image.width / image.height : 1;

  async function resize() {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      const element = await loadImageElement(image.url);
      const targetWidth = Math.max(1, Math.min(10000, Math.round(width)));
      const targetHeight = Math.max(1, Math.min(10000, Math.round(height)));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available in this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(element, 0, 0, targetWidth, targetHeight);
      const blob = await canvasToBlob(canvas, image.type === "image/jpeg" ? "image/jpeg" : "image/png");
      setOutput(URL.createObjectURL(blob));
      setSize(blob.size);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resize this image.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => { if (output) URL.revokeObjectURL(output); }, [output]);

  return (
    <Workspace slug="image-resizer">
      <div className="space-y-4">
        {!image ? (
          <ImageDropzone onFile={(file) => void accept(file)} error={error} />
        ) : (
          <>
            <SourceBanner image={image} onReplace={() => fileInputRef.current?.click()} onRemove={clear} />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void accept(file); event.target.value = ""; }} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Width (px)" htmlFor="resize-width">
                <Input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={10000}
                  value={width}
                  onChange={(event) => {
                    const next = Math.max(1, Math.round(Number(event.target.value) || 1));
                    setWidth(next);
                    if (lock) setHeight(Math.max(1, Math.round(next / ratio)));
                  }}
                  className="font-mono"
                />
              </Field>
              <Field label="Height (px)" htmlFor="resize-height">
                <Input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={10000}
                  value={height}
                  onChange={(event) => {
                    const next = Math.max(1, Math.round(Number(event.target.value) || 1));
                    setHeight(next);
                    if (lock) setWidth(Math.max(1, Math.round(next * ratio)));
                  }}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setLock((value) => !value)}>
                <Icon name={lock ? "lock" : "plus"} size={13} />
                {lock ? "Aspect ratio locked" : "Free resize"}
              </Button>
              {[50, 75, 100].map((percent) => (
                <Button key={percent} variant="ghost" size="sm" onClick={() => { setWidth(Math.max(1, Math.round(image.width * percent / 100))); setHeight(Math.max(1, Math.round(image.height * percent / 100))); }}>
                  {percent}%
                </Button>
              ))}
              {[1080, 1920].map((preset) => (
                <Button key={preset} variant="ghost" size="sm" onClick={() => { setWidth(preset); setHeight(Math.round(preset / ratio)); }}>
                  {preset}w
                </Button>
              ))}
            </div>

            {error && <Note tone="warn">{error}</Note>}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void resize()} disabled={busy}>
                <Icon name={busy ? "refresh" : "image"} size={15} className={busy ? "animate-spin" : ""} />
                {busy ? "Resizing locally…" : "Resize image"}
              </Button>
              {output && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => downloadDataUrl(output, `toolsy-${width}x${height}.png`)}>
                    <Icon name="download" size={14} /> Download PNG
                  </Button>
                  <span className="font-mono text-[10px] text-mist-500">{formatBytes(size)}</span>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Original</p>
                <img src={image.url} alt="Original" className="max-h-[260px] w-full rounded-xl border border-white/[0.08] object-contain" />
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Resized preview</p>
                {output ? (
                  <img src={output} alt="Resized result" className="max-h-[260px] w-full rounded-xl border border-brand-400/20 object-contain" />
                ) : (
                  <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-white/10 text-[11px] text-mist-500">
                    Press “Resize image” to generate a preview.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <Note tone="brand">
          Resizing happens on an in-browser canvas. Output is PNG (or JPEG for JPEG sources). Upscaling
          adds no detail — reduce only when you need a smaller file. Download before closing the tab.
        </Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- image cropper ---------------------------- */

export function ImageCropper() {
  const { image, error, accept, clear } = useLocalImage();
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [ratio, setRatio] = useState("free");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (image) setCrop({ x: 0, y: 0, width: image.width, height: Math.round(image.width / 1.5) });
  }, [image]);

  useEffect(() => {
    if (ratio === "free" || !image) return;
    const [rw, rh] = ratio.split(":").map(Number);
    const target = rw / rh;
    let width = Math.min(image.width, image.height * target);
    let height = width / target;
    if (height > image.height) {
      height = image.height;
      width = height * target;
    }
    setCrop((current) => ({ ...current, width: Math.round(width), height: Math.round(height) }));
  }, [ratio, image]);

  async function cropNow() {
    if (!image) return;
    setBusy(true);
    try {
      const element = await loadImageElement(image.url);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.min(image.width, Math.round(crop.width)));
      canvas.height = Math.max(1, Math.min(image.height, Math.round(crop.height)));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available.");
      context.drawImage(element, crop.x, crop.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, image.type === "image/jpeg" ? "image/jpeg" : "image/png");
      setPreview(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <Workspace slug="image-cropper">
      {!image ? (
        <ImageDropzone onFile={(file) => void accept(file)} error={error} label="Drop an image to crop" />
      ) : (
        <div className="space-y-4">
          <SourceBanner image={image} onReplace={() => clear()} onRemove={clear} />
          <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/60">
            <img src={image.url} alt="Image to crop" className="block w-full" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-brand-400 bg-brand-400/10"
              style={{
                left: `${(crop.x / image.width) * 100}%`,
                top: `${(crop.y / image.height) * 100}%`,
                width: `${(crop.width / image.width) * 100}%`,
                height: `${(crop.height / image.height) * 100}%`,
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["x", "Left offset", image.width],
              ["y", "Top offset", image.height],
              ["width", "Crop width", image.width],
              ["height", "Crop height", image.height],
            ] as const).map(([key, label, max]) => (
              <Field key={key} label={`${label} (px)`} htmlFor={`crop-${key}`}>
                <Input
                  id={`crop-${key}`}
                  type="number"
                  min={0}
                  max={max}
                  value={crop[key]}
                  onChange={(event) => setCrop((current) => ({ ...current, [key]: Math.max(0, Math.min(max, Number(event.target.value) || 0)) }))}
                  className="font-mono text-[12px]"
                />
              </Field>
            ))}
          </div>

          <Field label="Aspect ratio" htmlFor="crop-ratio">
            <Select
              id="crop-ratio"
              value={ratio}
              onChange={(event) => setRatio(event.target.value)}
              options={[
                { value: "free", label: "Free" },
                { value: "1:1", label: "Square (1:1)" },
                { value: "4:3", label: "Classic (4:3)" },
                { value: "16:9", label: "Wide (16:9)" },
                { value: "3:2", label: "Photo (3:2)" },
              ]}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void cropNow()} disabled={busy}>
              <Icon name={busy ? "refresh" : "image"} size={15} className={busy ? "animate-spin" : ""} />
              {busy ? "Cropping…" : "Crop image"}
            </Button>
            {preview && (
              <Button variant="secondary" size="sm" onClick={() => downloadDataUrl(preview, "toolsy-cropped.png")}>
                <Icon name="download" size={14} /> Download crop
              </Button>
            )}
          </div>

          {preview && (
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Cropped preview</p>
              <img src={preview} alt="Cropped result" className="max-h-[320px] rounded-xl border border-brand-400/20 object-contain" />
            </div>
          )}
          <Note tone="brand">Crop coordinates and rendering stay in your browser. The overlay is a visual guide only; all settings are numeric for precise, repeatable crops.</Note>
        </div>
      )}
    </Workspace>
  );
}

/* --------------------------- format converter ----------------------------- */

export function ImageFormatConverter() {
  const { image, error, setError, accept, clear } = useLocalImage();
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<{ url: string; size: number; type: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function convert() {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      const element = await loadImageElement(image.url);
      const canvas = document.createElement("canvas");
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available.");
      if (format === "image/jpeg") {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(element, 0, 0);
      const blob = await canvasToBlob(canvas, format, quality / 100);
      setResult({ url: URL.createObjectURL(blob), size: blob.size, type: format });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not convert this image.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const extension = format.split("/")[1] === "jpeg" ? "jpg" : format.split("/")[1];

  return (
    <Workspace slug="image-format-converter">
      {!image ? (
        <ImageDropzone onFile={(file) => void accept(file)} error={error} label="Drop an image to convert" />
      ) : (
        <div className="space-y-4">
          <SourceBanner image={image} onReplace={clear} onRemove={clear} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Output format" htmlFor="format-output">
              <Select
                id="format-output"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                options={[
                  { value: "image/png", label: "PNG — lossless, transparency" },
                  { value: "image/jpeg", label: "JPEG — photos, no transparency" },
                  { value: "image/webp", label: "WebP — modern, small" },
                ]}
              />
            </Field>
            <div className="flex items-end">
              {format !== "image/png" ? (
                <Slider label="Quality" value={quality} min={10} max={100} onChange={setQuality} suffix="%" />
              ) : (
                <p className="pb-1 text-[11.5px] text-mist-500">PNG uses lossless compression; quality does not apply.</p>
              )}
            </div>
          </div>
          {error && <Note tone="warn">{error}</Note>}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void convert()} disabled={busy}>
              <Icon name={busy ? "refresh" : "refresh"} size={15} className={busy ? "animate-spin" : ""} />
              {busy ? "Converting…" : `Convert to ${format.split("/")[1].toUpperCase()}`}
            </Button>
            {result && (
              <>
                <Button variant="secondary" size="sm" onClick={() => downloadDataUrl(result.url, `toolsy-converted.${extension}`)}>
                  <Icon name="download" size={14} /> Download .{extension}
                </Button>
                <span className="font-mono text-[10px] text-mist-500">{formatBytes(image.file.size)} → {formatBytes(result.size)}</span>
              </>
            )}
          </div>
          {result && (
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Converted preview</p>
              <img src={result.url} alt="Converted result" className="max-h-[300px] rounded-xl border border-brand-400/20 object-contain" />
            </div>
          )}
          <Note tone="brand">The original file is not modified. Conversion happens locally via canvas; transparency is flattened to white for JPEG exports.</Note>
        </div>
      )}
    </Workspace>
  );
}

/* ---------------------------- image to Base64 ----------------------------- */

export function ImageToBase64() {
  const { image, error, setError, accept, clear } = useLocalImage();
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!image) { setDataUrl(""); return; }
    const reader = new FileReader();
    reader.onload = () => setDataUrl(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("The browser could not read this file.");
    reader.readAsDataURL(image.file);
  }, [image, setError]);

  const base64Only = dataUrl.split(",")[1] ?? "";

  return (
    <Workspace slug="image-to-base64">
      {!image ? (
        <ImageDropzone onFile={(file) => void accept(file)} error={error} label="Drop an image to encode" hint="Produces a data URL and raw Base64. Local only — files are never uploaded." />
      ) : (
        <div className="space-y-4">
          <SourceBanner image={image} onReplace={clear} onRemove={clear} />
          <img src={image.url} alt="Selected upload" className="max-h-[220px] rounded-xl border border-white/[0.08] object-contain" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="File size" value={formatBytes(image.file.size)} />
            <StatTile label="Base64 size" value={formatBytes(base64Only.length)} hint="characters, not bytes" />
            <StatTile label="Dimensions" value={`${image.width}×${image.height}`} />
            <StatTile label="MIME type" value={image.type.replace("image/", "")} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-mist-200">Data URL</p>
              <span className="font-mono text-[9.5px] text-mist-500">{dataUrl.slice(0, 40)}…</span>
            </div>
            <textarea readOnly value={dataUrl} rows={6} className="field-input min-h-[140px] resize-y bg-ink-950/50 font-mono text-[10.5px] leading-relaxed" aria-label="Image data URL" />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Raw Base64 (without the data URL prefix)</p>
            <textarea readOnly value={base64Only} rows={5} className="field-input min-h-[120px] resize-y bg-ink-950/50 font-mono text-[10.5px] leading-relaxed" aria-label="Raw base64 image data" />
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={dataUrl} label="Copy data URL" copiedLabel="Copied" />
            <CopyButton value={base64Only} label="Copy raw Base64" copiedLabel="Copied" />
            <Button variant="secondary" size="sm" onClick={() => {
              void navigator.clipboard.writeText(base64Only).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              });
            }}>
              <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Quick copy"}
            </Button>
          </div>
          <Note tone="brand">
            Use the data URL directly in CSS or an img src. Inline images increase HTML size by about
            33%, so reserve this for small icons and avoid it for photo-heavy pages.
          </Note>
        </div>
      )}
    </Workspace>
  );
}
