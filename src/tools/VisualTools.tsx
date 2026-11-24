import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  Select,
  Slider,
  StatTile,
  Workspace,
} from "@/components/ui";
import { clamp, randomInt } from "@/lib/utils";

/* ------------------------------ image compressor --------------------------- */

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not encode this image."));
      },
      type,
      quality
    );
  });
}

type ImageSource = {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
};

type CompressedImage = {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  type: string;
};

type OutputFormat = "original" | "image/jpeg" | "image/webp" | "image/png";

const OUTPUT_FORMATS = [
  { value: "original", label: "Keep original format" },
  { value: "image/jpeg", label: "JPEG — smallest for photos" },
  { value: "image/webp", label: "WebP — small, keeps transparency" },
  { value: "image/png", label: "PNG — lossless graphics" },
];

const MAX_WIDTHS = [
  { value: "original", label: "Keep original size" },
  { value: "1920", label: "Max 1920 px wide" },
  { value: "1280", label: "Max 1280 px wide" },
  { value: "800", label: "Max 800 px wide" },
];

export function ImageCompressor() {
  const [source, setSource] = useState<ImageSource | null>(null);
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [quality, setQuality] = useState(0.75);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [maxWidth, setMaxWidth] = useState("original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const releaseSource = useCallback(() => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = null;
  }, []);

  const releaseResult = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    []
  );

  const acceptFile = useCallback(
    async (file: File) => {
      setError("");
      setDownloaded(false);
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        setError("Choose a JPEG, PNG or WebP image. Other formats cannot be re-encoded reliably in the browser.");
        return;
      }
      if (file.size === 0) {
        setError("That file appears to be empty.");
        return;
      }
      if (file.size > 40 * 1024 * 1024) {
        setError("This image is larger than 40 MB. Use a smaller file to keep the browser responsive.");
        return;
      }

      const url = URL.createObjectURL(file);
      try {
        const image = await loadImage(url);
        releaseSource();
        releaseResult();
        sourceUrlRef.current = url;
        resultUrlRef.current = null;
        setSource({
          file,
          url,
          width: image.naturalWidth,
          height: image.naturalHeight,
          size: file.size,
          type: file.type,
          name: file.name,
        });
        setResult(null);
        setFormat("original");
      } catch {
        URL.revokeObjectURL(url);
        setError("The browser could not open this image. It may be damaged or use an unsupported variant.");
      }
    },
    [releaseResult, releaseSource]
  );

  // A rejected file should not leave the previous compression showing a spinner.
  useEffect(() => {
    if (error) setBusy(false);
  }, [error]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setBusy(true);
    setError("");

    const timer = window.setTimeout(async () => {
      try {
        const image = await loadImage(source.url);
        const targetType = format === "original" ? source.type : format;
        const max = maxWidth === "original" ? null : Number(maxWidth);
        const scale = max && image.naturalWidth > max ? max / image.naturalWidth : 1;
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is not available in this browser.");
        if (targetType === "image/jpeg") {
          context.fillStyle = "#FFFFFF";
          context.fillRect(0, 0, width, height);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, width, height);

        const blob = await canvasToBlob(canvas, targetType, quality);
        if (cancelled) return;
        releaseResult();
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        setResult({ url, blob, width, height, type: targetType });
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not compress this image.");
          setResult(null);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, quality, format, maxWidth, releaseResult]);

  async function useSample() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Canvas is not available in this browser, so the sample cannot be created.");
      return;
    }
    const gradient = context.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, "#0B0D11");
    gradient.addColorStop(0.55, "#25330D");
    gradient.addColorStop(1, "#C7F05F");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 800);
    context.fillStyle = "rgba(255,255,255,0.12)";
    for (let index = 0; index < 18; index += 1) {
      context.beginPath();
      context.arc(randomInt(60, 1140), randomInt(60, 740), randomInt(12, 90), 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#F7F8F3";
    context.font = "700 92px sans-serif";
    context.fillText("Toolora", 90, 430);
    context.fillStyle = "rgba(247,248,243,0.7)";
    context.font = "400 34px sans-serif";
    context.fillText("A sample image for local compression", 92, 490);
    const blob = await canvasToBlob(canvas, "image/png", 1);
    await acceptFile(new File([blob], "toolora-sample.png", { type: "image/png" }));
  }

  function reset() {
    releaseSource();
    releaseResult();
    setSource(null);
    setResult(null);
    setError("");
    setBusy(false);
    setDownloaded(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadResult() {
    if (!result || !source) return;
    const extension = result.type === "image/png" ? "png" : result.type === "image/webp" ? "webp" : "jpg";
    const base = source.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 60) || "image";
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = `${base}-compressed.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2000);
  }

  const savings = source && result ? Math.round(((source.size - result.blob.size) / source.size) * 100) : 0;

  return (
    <Workspace slug="image-compressor">
      <div className="space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="image-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void acceptFile(file);
          }}
        />

        {!source ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void acceptFile(file);
            }}
            className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
              dragActive ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"
            }`}
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300">
              <Icon name="image" size={22} />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-mist-100">Drop an image to compress it</p>
            <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-relaxed text-mist-500">
              JPEG, PNG or WebP up to 40 MB. The file is decoded and re-encoded locally — it is never
              uploaded.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()}>
                <Icon name="download" size={15} className="rotate-180" />
                Choose image
              </Button>
              <Button variant="secondary" onClick={() => void useSample()}>
                <Icon name="sparkles" size={15} />
                Use sample image
              </Button>
            </div>
            {error && <p className="mt-3 text-[12px] font-medium text-rose-300" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <Icon name="image" size={14} className="shrink-0 text-brand-300" />
                <span className="truncate font-mono text-[11.5px] text-mist-200">{source.name}</span>
                <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">
                  {source.type.replace("image/", "")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                  Replace
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <Icon name="trash" size={13} />
                  Remove
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">Original</p>
                  <span className="font-mono text-[9.5px] text-mist-500">{formatFileSize(source.size)}</span>
                </div>
                <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-[repeating-conic-gradient(#12161c_0%_25%,#0d1116_0%_50%)] bg-[length:16px_16px]">
                  <img src={source.url} alt="Original upload preview" className="max-h-full max-w-full object-contain" />
                </div>
                <p className="mt-1.5 font-mono text-[9.5px] text-mist-600">
                  {source.width} × {source.height} px
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">Compressed</p>
                  <span className={`font-mono text-[9.5px] ${savings > 0 ? "text-brand-300" : "text-amber-300"}`}>
                    {result ? formatFileSize(result.blob.size) : "—"}
                  </span>
                </div>
                <div
                  aria-busy={busy}
                  className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border border-brand-400/20 bg-ink-950/50"
                >
                  {result ? (
                    <img
                      src={result.url}
                      alt="Compressed result preview"
                      className={`max-h-full max-w-full object-contain transition-opacity ${busy ? "opacity-60" : "opacity-100"}`}
                    />
                  ) : (
                    <div className="text-center">
                      <Icon name="refresh" size={18} className="mx-auto animate-spin text-brand-300" />
                      <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
                        Compressing locally…
                      </p>
                    </div>
                  )}
                  {busy && result && (
                    <span className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-ink-950/90 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-400">
                      updating
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-[9.5px] text-mist-600">
                  {result ? `${result.width} × ${result.height} px · ${result.type.replace("image/", "")}` : "waiting for result"}
                </p>
              </div>
            </div>

            {error && <Note tone="warn" title="Compression problem">{error}</Note>}

            <div className="space-y-4 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
              <Slider
                label="Quality"
                value={Math.round(quality * 100)}
                min={10}
                max={100}
                onChange={(value) => setQuality(value / 100)}
                suffix="%"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Output format" htmlFor="image-format">
                  <Select
                    id="image-format"
                    value={format}
                    onChange={(event) => setFormat(event.target.value as OutputFormat)}
                    options={OUTPUT_FORMATS}
                  />
                </Field>
                <Field label="Maximum width" htmlFor="image-width">
                  <Select
                    id="image-width"
                    value={maxWidth}
                    onChange={(event) => setMaxWidth(event.target.value)}
                    options={MAX_WIDTHS}
                  />
                </Field>
              </div>
              <p className="text-[10.5px] leading-relaxed text-mist-500">
                Quality affects JPEG and WebP. PNG is re-encoded without lossy compression, so its
                size may differ from dedicated PNG optimisers. Transparency is flattened to white
                when exporting JPEG.
              </p>
            </div>

            {result && source && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Original" value={formatFileSize(source.size)} />
                <StatTile label="Compressed" value={formatFileSize(result.blob.size)} />
                <StatTile
                  label={savings >= 0 ? "Saved" : "Larger by"}
                  value={<span className={savings > 0 ? "text-brand-300" : savings === 0 ? "text-mist-100" : "text-amber-300"}>{Math.abs(savings)}%</span>}
                />
                <StatTile label="Dimensions" value={`${result.width}×${result.height}`} />
              </div>
            )}

            {savings < 0 && (
              <Note tone="warn" title="The new file is larger">
                This can happen when a PNG is exported through a canvas, or the chosen quality is very
                high. Keep the original, try WebP, or lower the quality.
              </Note>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={downloadResult} disabled={!result || busy}>
                <Icon name={downloaded ? "check" : "download"} size={15} />
                {downloaded ? "Downloaded" : "Download compressed image"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setQuality(0.75)} disabled={quality === 0.75}>
                <Icon name="refresh" size={14} />
                Reset quality
              </Button>
              <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">
                <Icon name="shield" size={11} className="text-brand-300/80" />
                processed locally
              </span>
            </div>
          </>
        )}

        <Note tone="brand">
          Your image is read with a local object URL and drawn to an in-browser canvas. No upload,
          no account and no server copy. Download the result before closing the tab.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- contrast checker ----------------------------- */

function normalizeHex(value: string): string | null {
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map((character) => character + character).join("");
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function suggestAccessibleForeground(foreground: string, background: string, minimum = 4.5): string | null {
  if (contrastRatio(foreground, background) >= minimum) return foreground;
  const { r, g, b } = hexToRgb(foreground);
  for (let step = 1; step <= 100; step += 1) {
    const amount = step / 100;
    const darker = rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
    const lighter = rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
    const darkerPasses = contrastRatio(darker, background) >= minimum;
    const lighterPasses = contrastRatio(lighter, background) >= minimum;
    if (darkerPasses && lighterPasses) {
      return contrastRatio(darker, background) >= contrastRatio(lighter, background) ? darker : lighter;
    }
    if (darkerPasses) return darker;
    if (lighterPasses) return lighter;
  }
  return null;
}

type ComplianceBadgeProps = { label: string; pass: boolean; requirement: string };

function ComplianceBadge({ label, pass, requirement }: ComplianceBadgeProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
        pass ? "border-brand-400/25 bg-brand-400/[0.07]" : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <div>
        <p className={`text-[11px] font-semibold ${pass ? "text-brand-100" : "text-mist-300"}`}>{label}</p>
        <p className="font-mono text-[9px] text-mist-500">{requirement}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] ${
          pass ? "border-brand-400/40 bg-brand-400/15 text-brand-200" : "border-rose-400/25 bg-rose-400/10 text-rose-200"
        }`}
      >
        <Icon name={pass ? "check" : "close"} size={9} />
        {pass ? "Pass" : "Fail"}
      </span>
    </div>
  );
}

export function ContrastChecker() {
  const [foreground, setForeground] = useState("#F4F5F0");
  const [background, setBackground] = useState("#0B0D11");
  const [foregroundText, setForegroundText] = useState("#F4F5F0");
  const [backgroundText, setBackgroundText] = useState("#0B0D11");

  const foregroundValid = normalizeHex(foregroundText) === foreground;
  const backgroundValid = normalizeHex(backgroundText) === background;

  const ratio = contrastRatio(foreground, background);
  const normalAA = ratio >= 4.5;
  const normalAAA = ratio >= 7;
  const largeAA = ratio >= 3;
  const largeAAA = ratio >= 4.5;
  const suggestion = suggestAccessibleForeground(foreground, background);

  const rating =
    ratio >= 7
      ? { label: "Excellent", tone: "text-brand-300" }
      : ratio >= 4.5
        ? { label: "Good for body text", tone: "text-brand-200" }
        : ratio >= 3
          ? { label: "Large text only", tone: "text-amber-300" }
          : { label: "Too low for text", tone: "text-rose-300" };

  function updateColor(kind: "foreground" | "background", value: string) {
    const normalized = normalizeHex(value);
    if (kind === "foreground") {
      setForegroundText(value);
      if (normalized) setForeground(normalized);
    } else {
      setBackgroundText(value);
      if (normalized) setBackground(normalized);
    }
  }

  const summary = `Contrast ratio: ${ratio.toFixed(2)}:1. AA normal text: ${normalAA ? "pass" : "fail"}; AAA normal text: ${normalAAA ? "pass" : "fail"}. Foreground ${foreground}, background ${background}.`;

  return (
    <Workspace slug="color-contrast-checker">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            {
              key: "foreground" as const,
              label: "Text colour",
              value: foreground,
              text: foregroundText,
              valid: foregroundValid,
            },
            {
              key: "background" as const,
              label: "Background colour",
              value: background,
              text: backgroundText,
              valid: backgroundValid,
            },
          ]).map((item) => (
            <Field
              key={item.key}
              label={item.label}
              htmlFor={`${item.key}-hex`}
              error={item.valid ? undefined : "Use a 3- or 6-digit hex value."}
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={item.value.toLowerCase()}
                  onChange={(event) => updateColor(item.key, event.target.value.toUpperCase())}
                  aria-label={`Pick ${item.label.toLowerCase()}`}
                  className="size-11 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-ink-900 p-1"
                />
                <Input
                  id={`${item.key}-hex`}
                  value={item.text}
                  onChange={(event) => updateColor(item.key, event.target.value)}
                  spellCheck={false}
                  className="font-mono uppercase"
                  aria-invalid={!item.valid}
                />
              </div>
            </Field>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setForeground(background);
              setBackground(foreground);
              setForegroundText(background);
              setBackgroundText(foreground);
            }}
          >
            <Icon name="arrowUpDown" size={14} />
            Swap colours
          </Button>
          <CopyButton value={summary} label="Copy summary" copiedLabel="Copied" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setForeground("#F4F5F0");
              setBackground("#0B0D11");
              setForegroundText("#F4F5F0");
              setBackgroundText("#0B0D11");
            }}
          >
            <Icon name="refresh" size={13} />
            Reset
          </Button>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
            WCAG 2.2 formula
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <ResultCard
              label="Contrast ratio"
              value={`${ratio.toFixed(2)}:1`}
              hint={
                <span className={rating.tone}>
                  {rating.label} · relative luminance {relativeLuminance(foreground).toFixed(3)} /{" "}
                  {relativeLuminance(background).toFixed(3)}
                </span>
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <ComplianceBadge label="AA normal" pass={normalAA} requirement="4.5:1 minimum" />
              <ComplianceBadge label="AAA normal" pass={normalAAA} requirement="7:1 minimum" />
              <ComplianceBadge label="AA large" pass={largeAA} requirement="3:1 minimum" />
              <ComplianceBadge label="AAA large" pass={largeAAA} requirement="4.5:1 minimum" />
            </div>
            {!normalAA && suggestion && (
              <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.05] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-mist-100">Suggested text colour</p>
                    <p className="mt-0.5 font-mono text-[11px] text-mist-400">
                      {suggestion} · {contrastRatio(suggestion, background).toFixed(2)}:1
                    </p>
                  </div>
                  <span className="size-8 shrink-0 rounded-lg border border-white/15" style={{ backgroundColor: suggestion }} />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => {
                    setForeground(suggestion);
                    setForegroundText(suggestion);
                  }}
                >
                  Apply suggestion
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.1]" aria-label="Contrast preview">
            <div style={{ backgroundColor: background, color: foreground }} className="p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Preview surface</p>
              <p className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.02em]">
                Free tools, done properly.
              </p>
              <p className="mt-2 text-[14px] leading-relaxed">
                This is normal body text at 14px. It should stay comfortable to read for more than a
                few seconds.
              </p>
              <p className="mt-3 text-[11px] opacity-80">
                Secondary copy at 11px — smaller text usually needs more contrast, not less.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-[12px] font-semibold">
                Button label
                <Icon name="arrowRight" size={13} />
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/[0.07] border-t border-white/[0.07] bg-ink-900/70 font-mono text-[10px]">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="size-3 rounded border border-white/20" style={{ backgroundColor: foreground }} />
                <span className="text-mist-300">{foreground}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="size-3 rounded border border-white/20" style={{ backgroundColor: background }} />
                <span className="text-mist-300">{background}</span>
              </div>
            </div>
          </div>
        </div>

        <Note tone="info">
          WCAG AA requires 4.5:1 for normal text and 3:1 for large text (about 18pt, or 14pt bold).
          AAA raises those thresholds to 7:1 and 4.5:1. Interface icons and borders generally need
          3:1. Contrast alone does not guarantee colour-blind accessibility.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- gradient generator --------------------------- */

type GradientType = "linear" | "radial";
type GradientStop = { id: string; color: string; position: number };

const GRADIENT_PRESETS: { name: string; type: GradientType; angle: number; stops: [string, number][] }[] = [
  {
    name: "Toolora lime",
    type: "linear",
    angle: 135,
    stops: [
      ["#0B0D11", 0],
      ["#25330D", 55],
      ["#C7F05F", 100],
    ],
  },
  {
    name: "Quiet dusk",
    type: "linear",
    angle: 160,
    stops: [
      ["#101322", 0],
      ["#4C1D95", 55],
      ["#F0ABFC", 100],
    ],
  },
  {
    name: "Ocean depth",
    type: "radial",
    angle: 0,
    stops: [
      ["#0EA5E9", 0],
      ["#0F172A", 70],
      ["#020617", 100],
    ],
  },
  {
    name: "Warm paper",
    type: "radial",
    angle: 0,
    stops: [
      ["#FEF3C7", 0],
      ["#FDBA74", 55],
      ["#FB7185", 100],
    ],
  },
  {
    name: "Mint glass",
    type: "linear",
    angle: 45,
    stops: [
      ["#ECFDF5", 0],
      ["#A7F3D0", 60],
      ["#0F766E", 100],
    ],
  },
];

let stopCounter = 0;
function makeStop(color: string, position: number): GradientStop {
  stopCounter += 1;
  return { id: `stop-${stopCounter}-${Date.now().toString(36)}`, color, position };
}

const RADIAL_POSITIONS = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "top left", label: "Top left" },
  { value: "top right", label: "Top right" },
  { value: "bottom", label: "Bottom" },
  { value: "bottom left", label: "Bottom left" },
  { value: "bottom right", label: "Bottom right" },
];

const STOP_COLORS = ["#C7F05F", "#0EA5E9", "#A78BFA", "#FB7185", "#FBBF24"];

function buildGradientCss(
  type: GradientType,
  angle: number,
  stops: GradientStop[],
  shape: string,
  position: string
): string {
  const colorList = stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
  return type === "linear"
    ? `linear-gradient(${angle}deg, ${colorList})`
    : `radial-gradient(${shape} at ${position}, ${colorList})`;
}

export function GradientGenerator() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState("circle");
  const [position, setPosition] = useState("center");
  const [stops, setStops] = useState<GradientStop[]>([
    makeStop("#0B0D11", 0),
    makeStop("#25330D", 55),
    makeStop("#C7F05F", 100),
  ]);

  const gradientCss = useMemo(
    () => buildGradientCss(type, angle, stops, shape, position),
    [type, angle, stops, shape, position]
  );

  const cssCode = `.gradient {\n  background-image: ${gradientCss};\n  background-color: ${stops[0]?.color ?? "#0B0D11"};\n}`;

  function updateStop(id: string, patch: Partial<GradientStop>) {
    setStops((current) => current.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));
  }

  function addStop() {
    if (stops.length >= 5) return;
    const color = STOP_COLORS[stops.length % STOP_COLORS.length];
    setStops((current) => {
      const sorted = [...current].sort((a, b) => a.position - b.position);
      const positionValue = Math.round((sorted[sorted.length - 1].position + sorted[0].position) / 2) || 50;
      return [...current, makeStop(color, positionValue)];
    });
  }

  function removeStop(id: string) {
    if (stops.length <= 2) return;
    setStops((current) => current.filter((stop) => stop.id !== id));
  }

  function applyPreset(preset: (typeof GRADIENT_PRESETS)[number]) {
    setType(preset.type);
    setAngle(preset.angle);
    setStops(preset.stops.map(([color, value]) => makeStop(color, value)));
  }

  function randomize() {
    const preset = GRADIENT_PRESETS[randomInt(0, GRADIENT_PRESETS.length - 1)];
    applyPreset(preset);
    setAngle(randomInt(0, 359));
  }

  return (
    <Workspace slug="css-gradient-generator">
      <div className="space-y-5">
        <div
          className="relative grid min-h-[240px] place-items-center overflow-hidden rounded-2xl border border-white/[0.1]"
          style={{ backgroundImage: gradientCss }}
          role="img"
          aria-label={`Gradient preview: ${gradientCss}`}
        >
          <div className="px-5 py-8 text-center">
            <p className="text-[26px] font-bold tracking-[-0.03em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              Toolora gradient
            </p>
            <p className="mt-1 text-[12px] text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Live preview · check text readability
            </p>
          </div>
          <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/85 backdrop-blur">
            {type}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Gradient type</p>
            <Segmented
              label="Gradient type"
              value={type}
              onChange={setType}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial" },
              ]}
            />
          </div>
          {type === "linear" ? (
            <Slider label="Angle" value={angle} min={0} max={360} step={1} onChange={setAngle} suffix="deg" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Shape" htmlFor="gradient-shape">
                <Select
                  id="gradient-shape"
                  value={shape}
                  onChange={(event) => setShape(event.target.value)}
                  options={[
                    { value: "circle", label: "Circle" },
                    { value: "ellipse", label: "Ellipse" },
                  ]}
                />
              </Field>
              <Field label="Position" htmlFor="gradient-position">
                <Select
                  id="gradient-position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  options={RADIAL_POSITIONS}
                />
              </Field>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-mist-200">Colour stops</p>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{stops.length} / 5</span>
          </div>
          <div className="mt-2 space-y-2">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.018] p-2 sm:grid-cols-[40px_96px_minmax(0,1fr)_auto]"
              >
                <input
                  type="color"
                  value={stop.color.toLowerCase()}
                  onChange={(event) => updateStop(stop.id, { color: event.target.value.toUpperCase() })}
                  aria-label={`Colour stop ${index + 1}`}
                  className="size-9 cursor-pointer rounded-lg border border-white/10 bg-ink-900 p-1"
                />
                <Input
                  value={stop.color}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(value)) updateStop(stop.id, { color: value.toUpperCase() });
                  }}
                  aria-label={`Hex value for stop ${index + 1}`}
                  spellCheck={false}
                  className="hidden h-9 font-mono text-[11px] sm:block"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(event) => updateStop(stop.id, { position: Number(event.target.value) })}
                  aria-label={`Position of stop ${index + 1}`}
                  className="min-w-0"
                  style={{ ["--range-progress" as string]: `${stop.position}%` }}
                />
                <div className="flex items-center gap-1">
                  <span className="w-8 text-right font-mono text-[10px] text-mist-400">{stop.position}%</span>
                  <button
                    type="button"
                    onClick={() => removeStop(stop.id)}
                    disabled={stops.length <= 2}
                    aria-label={`Remove colour stop ${index + 1}`}
                    className="grid size-7 place-items-center rounded-md border border-white/8 text-mist-500 transition hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-30"
                  >
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={addStop} disabled={stops.length >= 5}>
              <Icon name="plus" size={13} />
              Add stop
            </Button>
            <Button variant="ghost" size="sm" onClick={randomize}>
              <Icon name="shuffle" size={13} />
              Random preset
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-mist-200">Presets</p>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-2 py-1.5 text-[11px] text-mist-400 transition hover:border-white/20 hover:text-mist-100"
              >
                <span
                  className="size-4 rounded border border-white/15"
                  style={{ backgroundImage: buildGradientCss(preset.type, preset.angle, preset.stops.map(([color, value], index) => ({ id: `preset-${index}`, color, position: value })), "circle", "center") }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-mist-200">CSS output</p>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">ready to paste</span>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-ink-950/60 p-4 font-mono text-[11.5px] leading-relaxed text-mist-300">
            <code>{cssCode}</code>
          </pre>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton value={cssCode} label="Copy CSS" copiedLabel="CSS copied" />
            <CopyButton value={gradientCss} label="Copy background" copiedLabel="Copied" variant="secondary" />
          </div>
        </div>

        <Note tone="info">
          The generated CSS uses standard, unprefixed linear-gradient and radial-gradient syntax.
          Gradients are decoration — always verify that text placed over them stays readable. Use the{" "}
          <a href="/tools/color-contrast-checker" className="text-brand-200 underline decoration-brand-400/30 underline-offset-2">
            contrast checker
          </a>{" "}
          for the text colours.
        </Note>
      </div>
    </Workspace>
  );
}
