import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  Select,
  Workspace,
} from "@/components/ui";
import { clamp, downloadDataUrl, randomInt, useCopy } from "@/lib/utils";

/* --------------------------------- color ---------------------------------- */

type Harmony = "analogous" | "complementary" | "triadic" | "monochromatic" | "split" | "random";

const HARMONIES: { value: Harmony; label: string }[] = [
  { value: "analogous", label: "Analogous" },
  { value: "complementary", label: "Complementary" },
  { value: "triadic", label: "Triadic" },
  { value: "monochromatic", label: "Monochromatic" },
  { value: "split", label: "Split complementary" },
  { value: "random", label: "Surprise me" },
];

type Hsl = { h: number; s: number; l: number };

function normalizeHex(input: string): string | null {
  let value = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    value = value
      .split("")
      .map((character) => character + character)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return `#${value.toUpperCase()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const f = (n: number) => lightness - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function contrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.42 ? "#0B0D11" : "#F7F8F3";
}

const HARMONY_STEPS: Record<Exclude<Harmony, "random">, { hue: number; sat: number; light: number }[]> = {
  analogous: [
    { hue: -35, sat: -6, light: 16 },
    { hue: -18, sat: 0, light: 6 },
    { hue: 0, sat: 0, light: 0 },
    { hue: 18, sat: 4, light: -8 },
    { hue: 35, sat: 0, light: -18 },
  ],
  complementary: [
    { hue: 0, sat: -6, light: 16 },
    { hue: 0, sat: 0, light: 4 },
    { hue: 0, sat: 0, light: -14 },
    { hue: 180, sat: 0, light: 6 },
    { hue: 180, sat: 0, light: -12 },
  ],
  triadic: [
    { hue: 0, sat: 0, light: 15 },
    { hue: 0, sat: 0, light: -12 },
    { hue: 120, sat: 0, light: 4 },
    { hue: 240, sat: 0, light: 10 },
    { hue: 240, sat: 0, light: -14 },
  ],
  monochromatic: [
    { hue: 0, sat: 8, light: -26 },
    { hue: 0, sat: 4, light: -12 },
    { hue: 0, sat: 0, light: 2 },
    { hue: 0, sat: -6, light: 16 },
    { hue: 0, sat: -10, light: 28 },
  ],
  split: [
    { hue: 0, sat: 0, light: 12 },
    { hue: 150, sat: 0, light: 2 },
    { hue: 150, sat: 0, light: -16 },
    { hue: 210, sat: 0, light: 8 },
    { hue: 210, sat: 0, light: -10 },
  ],
};

function buildPalette(base: string, harmony: Harmony): string[] {
  const { h, s, l } = hexToHsl(base);
  if (harmony === "random") {
    return Array.from({ length: 5 }, (_, index) => {
      const hueShift = index === 2 ? 0 : randomInt(25, 335);
      return hslToHex(
        h + hueShift,
        clamp(s + randomInt(-18, 18), 24, 92),
        clamp(l + randomInt(-22, 22), 16, 88)
      );
    });
  }
  return HARMONY_STEPS[harmony].map((step) =>
    hslToHex(h + step.hue, s + step.sat, l + step.light)
  );
}

const DEFAULT_BASE = "#A78BFA";

export function ColorPaletteGenerator() {
  const [base, setBase] = useState(DEFAULT_BASE);
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  const [palette, setPalette] = useState<string[]>(() => buildPalette(DEFAULT_BASE, "analogous"));
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [hexInput, setHexInput] = useState(DEFAULT_BASE);
  const { copiedKey, copy } = useCopy();

  useEffect(() => {
    const next = buildPalette(base, harmony);
    setPalette((current) => next.map((color, index) => (locked[index] ? current[index] : color)));
    // Locks are intentionally not a dependency: locking a swatch should not immediately regenerate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, harmony]);

  useEffect(() => {
    setHexInput(base);
  }, [base]);

  const css = useMemo(
    () =>
      `:root {\n${palette
        .map((color, index) => `  --palette-${index + 1}: ${color};`)
        .join("\n")}\n}`,
    [palette]
  );

  const hexList = palette.join(", ");
  const lockedCount = locked.filter(Boolean).length;

  function surprise() {
    setBase(hslToHex(randomInt(0, 359), randomInt(58, 82), randomInt(48, 70)));
  }

  return (
    <Workspace slug="color-palette-generator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <Field label="Base color" htmlFor="palette-color">
            <div className="flex items-center gap-2">
              <input
                id="palette-color"
                type="color"
                value={base.toLowerCase()}
                onChange={(event) => setBase(event.target.value.toUpperCase())}
                className="size-11 cursor-pointer rounded-xl border border-white/10 bg-ink-900 p-1"
                aria-label="Pick a base color"
              />
              <div className="w-[116px]">
                <Input
                  value={hexInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setHexInput(value);
                    const normalized = normalizeHex(value);
                    if (normalized) setBase(normalized);
                  }}
                  aria-label="Base color hex value"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
              </div>
            </div>
          </Field>
          <Field label="Harmony" htmlFor="palette-harmony">
            <Select
              id="palette-harmony"
              value={harmony}
              onChange={(event) => setHarmony(event.target.value as Harmony)}
              options={HARMONIES}
            />
          </Field>
          <Button variant="secondary" onClick={surprise}>
            <Icon name="shuffle" size={15} />
            Surprise me
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {palette.map((color, index) => {
            const text = contrastText(color);
            const rgb = hexToRgb(color);
            const isLocked = locked[index];
            const copied = copiedKey === `swatch-${index}`;
            return (
              <div
                key={index}
                className="flex min-h-[172px] flex-col justify-between rounded-xl border border-white/10 p-3 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: color, color: text }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLocked((current) => current.map((value, i) => (i === index ? !value : value)))
                    }
                    aria-pressed={isLocked}
                    aria-label={`${isLocked ? "Unlock" : "Lock"} color ${color}`}
                    className="grid size-7 place-items-center rounded-md border transition"
                    style={{
                      borderColor: `${text}33`,
                      backgroundColor: isLocked ? `${text}22` : "transparent",
                      opacity: isLocked ? 1 : 0.6,
                    }}
                  >
                    <Icon name="lock" size={12} />
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => void copy(color, `swatch-${index}`)}
                    className="flex items-center gap-1.5 rounded font-mono text-[13.5px] font-semibold tracking-wide transition hover:opacity-80"
                    aria-label={`Copy ${color}`}
                  >
                    {copied ? "COPIED!" : color}
                    <Icon name={copied ? "check" : "copy"} size={12} className="opacity-60" />
                  </button>
                  <p className="mt-1 font-mono text-[9px] opacity-55">
                    RGB {rgb.r} · {rgb.g} · {rgb.b}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={css} label="Copy CSS" copiedLabel="CSS copied" />
          <CopyButton value={hexList} label="Copy HEX list" copiedLabel="Copied" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPalette(buildPalette(base, harmony).map((color, index) => (locked[index] ? palette[index] : color)))}
          >
            <Icon name="refresh" size={14} />
            Regenerate unlocked
          </Button>
          {lockedCount > 0 && (
            <button
              type="button"
              onClick={() => setLocked([false, false, false, false, false])}
              className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200"
            >
              <Icon name="lock" size={12} />
              Unlock {lockedCount}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">
              CSS variables
            </span>
            <CopyButton
              value={css}
              label="Copy"
              copiedLabel="Copied"
              iconOnly
              variant="ghost"
              size="sm"
            />
          </div>
          <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-mist-300">
            <code>{css}</code>
          </pre>
        </div>

        {!normalizeHex(hexInput) && (
          <Note tone="warn">Use a three- or six-digit HEX value, such as #A78BFA.</Note>
        )}

        <Note tone="info">
          Lock a swatch to keep it while you regenerate the rest. All color maths happens locally.
          Check text contrast before publishing a palette — a pretty color can still be hard to
          read.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- QR code -------------------------------- */

type ErrorLevel = "L" | "M" | "Q" | "H";

const DARK_COLORS = [
  { value: "#0B0D11", label: "Charcoal" },
  { value: "#1E3A8A", label: "Navy" },
  { value: "#14532D", label: "Forest" },
  { value: "#7C2D12", label: "Rust" },
];

export function QrCodeGenerator() {
  const [text, setText] = useState("https://toolsy.com");
  const [size, setSize] = useState("512");
  const [level, setLevel] = useState<ErrorLevel>("M");
  const [dark, setDark] = useState(DARK_COLORS[0].value);
  const [error, setError] = useState("");
  const [hasCode, setHasCode] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const value = text.trim();
    if (!value) {
      const context = canvas.getContext("2d");
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      setHasCode(false);
      setError("");
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      try {
        QRCode.toCanvas(
          canvas,
          value,
          {
            width: Number(size),
            margin: 2,
            errorCorrectionLevel: level,
            color: { dark, light: "#FFFFFF" },
          },
          (qrError) => {
            if (cancelled) return;
            if (qrError) {
              setError("That content is too long for the selected error-correction level. Try a shorter value or level L.");
              setHasCode(false);
            } else {
              setError("");
              setHasCode(true);
            }
          }
        );
      } catch {
        if (!cancelled) {
          setError("Your browser couldn't draw the QR code canvas. Try another browser or reload the page.");
          setHasCode(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [text, size, level, dark]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !hasCode) return;
    downloadDataUrl(canvas.toDataURL("image/png"), `toolsy-qr-${size}.png`);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <Workspace slug="qr-code-generator">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Field label="Link or text" htmlFor="qr-text" hint={`${text.length}/1000 characters`}>
            <textarea
              id="qr-text"
              value={text}
              maxLength={1000}
              rows={4}
              onChange={(event) => setText(event.target.value)}
              placeholder="https://example.com/page"
              className="field-input resize-y font-mono text-[13px] leading-relaxed"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Download size" htmlFor="qr-size">
              <Select
                id="qr-size"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                options={[
                  { value: "256", label: "256 × 256 px" },
                  { value: "512", label: "512 × 512 px" },
                  { value: "1024", label: "1024 × 1024 px" },
                ]}
              />
            </Field>
            <Field label="Error correction" htmlFor="qr-level" hint="higher = sturdier">
              <Select
                id="qr-level"
                value={level}
                onChange={(event) => setLevel(event.target.value as ErrorLevel)}
                options={[
                  { value: "L", label: "L — 7% recovery" },
                  { value: "M", label: "M — 15% recovery" },
                  { value: "Q", label: "Q — 25% recovery" },
                  { value: "H", label: "H — 30% recovery" },
                ]}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Code color</p>
            <div className="flex flex-wrap gap-2">
              {DARK_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setDark(color.value)}
                  aria-pressed={dark === color.value}
                  className={
                    dark === color.value
                      ? "inline-flex items-center gap-2 rounded-lg border border-brand-400/50 bg-brand-400/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-mist-100"
                      : "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[11.5px] text-mist-400 transition hover:border-white/20 hover:text-mist-100"
                  }
                >
                  <span className="size-3 rounded-full border border-white/20" style={{ backgroundColor: color.value }} />
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {error && <Note tone="warn">{error}</Note>}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={download} disabled={!hasCode}>
              <Icon name={downloaded ? "check" : "download"} size={16} />
              {downloaded ? "Downloaded" : "Download PNG"}
            </Button>
            <CopyButton value={text} label="Copy text" copiedLabel="Copied" />
            <CopyButton
              value="https://toolsy.com/tools/qr-code-generator"
              label="Copy tool link"
              copiedLabel="Link copied"
              variant="ghost"
            />
          </div>

          <Note tone="brand">
            This is a static QR code — the data lives in the image, with no redirect and no expiry.
            Test the downloaded file with a phone camera before printing.
          </Note>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="grid w-full place-items-center rounded-2xl border border-white/[0.08] bg-[repeating-conic-gradient(#12161c_0%_25%,#0d1116_0%_50%)] bg-[length:18px_18px] p-4">
            <div className="grid size-[236px] max-w-full place-items-center rounded-xl bg-white p-3">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={hasCode ? "Generated QR code" : "QR code preview"}
                className="h-auto w-full max-w-[212px]"
              />
              {!text.trim() && (
                <p className="py-10 text-center text-[11px] text-ink-600">Enter content to generate</p>
              )}
            </div>
          </div>
          <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-600">
            {size} × {size} px · level {level}
          </p>
          <p className="text-center text-[11px] leading-relaxed text-mist-500">
            Generated in your browser.
            <br />
            Scan to verify before you share.
          </p>

        </div>
      </div>
    </Workspace>
  );
}
