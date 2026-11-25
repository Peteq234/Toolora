import { useEffect, useMemo, useRef, useState } from "react";
import { parseDocument, stringify as yamlStringify } from "yaml";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, ResultCard, Select, StatTile, Toggle, Workspace } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

/* --------------------------------- helpers -------------------------------- */

function bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}
function sizeLabel(text: string): string {
  const total = bytes(text);
  return total < 1024 ? `${total} B` : `${(total / 1024).toFixed(1)} KB`;
}
function download(text: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ------------------------------ SVG optimiser ------------------------------ */

const SVG_KEEP = ["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "use", "symbol", "pattern", "filter", "image", "title", "desc"];

function roundNumbers(value: string): string {
  return value.replace(/-?\d+\.\d{3,}/g, (match) => String(Math.round(Number(match) * 100) / 100));
}

function optimiseSvg(source: string, options: { metadata: boolean; emptyGroups: boolean; decimals: boolean; comments: boolean }): { output: string; error: string; removed: number } {
  if (!source.trim()) return { output: "", error: "", removed: 0 };
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror")) return { output: "", error: "This is not valid SVG. Check that every element and attribute is closed correctly.", removed: 0 };
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "svg") return { output: "", error: "The root element must be <svg>.", removed: 0 };
  const before = bytes(source);
  let removed = 0;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ALL);
  const nodes: Node[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeType === 8 && options.comments) { node.parentNode?.removeChild(node); removed += 1; continue; }
    if (node.nodeType === 1) {
      const el = node as Element;
      if (options.metadata && ["metadata", "sodipodi:namedview"].includes(el.tagName)) { el.remove(); removed += 1; continue; }
      if (!SVG_KEEP.includes(el.tagName) && ["metadata"].includes(el.tagName)) { el.remove(); removed += 1; continue; }
      [...el.attributes].forEach((attr) => {
        if (options.metadata && /^(inkscape|sodipodi|data-name|xmlns:inkscape|xmlns:sodipodi):/.test(attr.name)) { el.removeAttribute(attr.name); removed += 1; }
      });
      if (options.emptyGroups && el.tagName === "g" && el.children.length === 0 && !(el.textContent ?? "").trim()) { el.remove(); removed += 1; }
    }
  }
  let output = new XMLSerializer().serializeToString(root);
  if (options.decimals) output = roundNumbers(output);
  output = output.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  if (!output.includes("xmlns=\"http://www.w3.org/2000/svg\"")) output = output.replace("<svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"");
  return { output, error: "", removed: removed + Math.max(0, before - bytes(output)) };
}

export function SvgOptimizer() {
  const [input, setInput] = useState('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">\n  <!-- replace this sample with your own SVG -->\n  <g>\n    <circle cx="60.0000" cy="60.0000" r="46.0000" fill="#c7f05f"/>\n    <path d="M38.12345 62.45678 L60 40 L81.87654 62.45678" fill="none" stroke="#0b0d11" stroke-width="7.0000" stroke-linecap="round"/>\n  </g>\n</svg>');
  const [metadata, setMetadata] = useState(true);
  const [emptyGroups, setEmptyGroups] = useState(true);
  const [decimals, setDecimals] = useState(true);
  const [comments, setComments] = useState(true);
  const result = useMemo(() => optimiseSvg(input, { metadata, emptyGroups, decimals, comments }), [input, metadata, emptyGroups, decimals, comments]);
  const saved = input ? Math.round((1 - bytes(result.output) / Math.max(1, bytes(input))) * 100) : 0;

  async function loadFile(file: File) {
    if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
      setInput("<!-- Please choose an .svg file. -->");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setInput("<!-- SVG files up to 3 MB are supported. -->");
      return;
    }
    setInput(await file.text());
  }

  return (
    <Workspace slug="svg-optimizer">
      <div className="space-y-4">
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-[12.5px] text-mist-300 hover:border-brand-400/40">
          <Icon name="image" size={15} /> Drop or choose an SVG file
          <input type="file" accept=".svg,image/svg+xml" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); event.target.value = ""; }} />
        </label>
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Original SVG" htmlFor="svg-input" hint={sizeLabel(input)}>
            <textarea id="svg-input" value={input} onChange={(event) => setInput(event.target.value)} rows={12} spellCheck={false} className="field-input min-h-[240px] resize-y font-mono text-[11px] leading-relaxed" />
          </Field>
          <Field label="Optimised SVG" htmlFor="svg-output" hint={sizeLabel(result.output)} error={result.error}>
            <textarea id="svg-output" value={result.output} readOnly rows={12} spellCheck={false} className="field-input min-h-[240px] resize-y bg-ink-950/50 font-mono text-[11px] leading-relaxed" />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Remove metadata" description="Inkscape/Sodipodi attributes and <metadata>" checked={metadata} onChange={setMetadata} />
          <Toggle label="Remove empty groups" checked={emptyGroups} onChange={setEmptyGroups} />
          <Toggle label="Round long decimals" description="Two decimal places" checked={decimals} onChange={setDecimals} />
          <Toggle label="Strip comments" checked={comments} onChange={setComments} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Original" value={sizeLabel(input)} />
          <StatTile label="Optimised" value={sizeLabel(result.output)} />
          <StatTile label="Saved" value={input ? `${Math.max(0, saved)}%` : "—"} />
          <StatTile label="Elements trimmed" value={String(result.removed)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy SVG" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => download(result.output, "toolsy-optimised.svg", "image/svg+xml")} disabled={!result.output}><Icon name="download" size={13} /> Download .svg</Button>
        </div>
        <Note tone="info">Optimisation is structural: it removes editor metadata, comments, empty groups and excess decimals. It does not re-draw geometry, so shapes stay identical. Preview the result before replacing the original asset.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------- colour extraction ---------------------------- */

type Swatch = { hex: string; count: number; share: number };

function extractPalette(image: HTMLImageElement, count: number): Swatch[] {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 240 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 125) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.n += 1;
    buckets.set(key, bucket);
  }
  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.n, 0) || 1;
  const merged = [...buckets.values()]
    .map((bucket) => ({
      hex: `#${[bucket.r / bucket.n, bucket.g / bucket.n, bucket.b / bucket.n].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase(),
      count: bucket.n,
      share: (bucket.n / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
  // Collapse near-identical colours so the result is a usable palette.
  const unique: Swatch[] = [];
  for (const candidate of merged) {
    if (unique.length >= count) break;
    if (unique.some((existing) => colourDistance(existing.hex, candidate.hex) < 28)) continue;
    unique.push(candidate);
  }
  return unique;
}

function colourDistance(a: string, b: string): number {
  const parse = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function ColorPaletteExtractor() {
  const [imageUrl, setImageUrl] = useState("");
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [count, setCount] = useState("6");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  async function handle(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose a JPEG, PNG, WebP or GIF image."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Images up to 20 MB are supported."); return; }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const image = new window.Image();
    image.onload = () => setSwatches(extractPalette(image, Number(count) || 6));
    image.onerror = () => setError("This image could not be decoded.");
    image.src = url;
  }

  return (
    <Workspace slug="color-palette-extractor">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => inputRef.current?.click()}><Icon name="image" size={14} /> Choose image</Button>
            {imageUrl && <Button variant="ghost" size="sm" onClick={() => { setImageUrl(""); setSwatches([]); }}>Clear</Button>}
            <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handle(file); event.target.value = ""; }} />
          </div>
          <Field label="Colours" htmlFor="palette-count">
            <Select id="palette-count" value={count} onChange={(event) => setCount(event.target.value)} options={[4, 5, 6, 8, 10].map((value) => ({ value: String(value), label: `${value} colours` }))} />
          </Field>
        </div>
        {error && <Note tone="warn">{error}</Note>}
        {imageUrl ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Source image</p>
              <img src={imageUrl} alt="Uploaded image" className="max-h-[260px] w-full rounded-xl border border-white/[0.08] object-contain" />
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Extracted palette</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {swatches.map((swatch) => (
                  <button key={swatch.hex} type="button" onClick={() => void navigator.clipboard.writeText(swatch.hex)} className="overflow-hidden rounded-lg border border-white/10 text-left" aria-label={`Copy ${swatch.hex}`}>
                    <span className="block h-14 w-full" style={{ backgroundColor: swatch.hex }} />
                    <span className="block bg-ink-900 px-2 py-1.5 font-mono text-[10px] text-mist-200">{swatch.hex}</span>
                    <span className="block bg-ink-900 px-2 pb-1.5 font-mono text-[8.5px] text-mist-500">{swatch.share.toFixed(1)}% of pixels</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center">
            <Icon name="palette" size={20} className="mx-auto text-brand-300" />
            <p className="mt-2 text-[13px] font-semibold text-mist-100">Drop an image to extract its colours</p>
            <p className="mt-1 text-[11.5px] text-mist-500">Click a swatch to copy its HEX code. Processed locally — the image is never uploaded.</p>
          </div>
        )}
        {swatches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CopyButton value={swatches.map((swatch) => swatch.hex).join(", ")} label="Copy HEX list" copiedLabel="Copied" />
            <CopyButton value={`${swatches.map((swatch) => swatch.hex).join(", ")}`} label="Copy all" copiedLabel="Copied" variant="secondary" />
          </div>
        )}
        <Note tone="info">Colours are grouped from a downsampled version of the image. Transparent pixels are ignored. Use the result as a starting point, then verify contrast for text.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ JS formatter ------------------------------ */

function formatJs(source: string, indent: "2" | "4" | "tab", keepBlank: boolean): string {
  const unit = indent === "tab" ? "\t" : " ".repeat(Number(indent));
  // Tokenise once, protecting strings, template literals, regex literals and comments,
  // then insert line breaks after structural tokens. This handles minified one-liners.
  let normalized = "";
  let index = 0;
  let state: "code" | "single" | "double" | "template" | "line" | "block" | "regex" = "code";
  let lastSignificant = "";
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "code") {
      if (char === "/" && next === "/") { state = "line"; normalized += char; index += 1; continue; }
      if (char === "/" && next === "*") { state = "block"; normalized += char; index += 1; continue; }
      if (char === "'") { state = "single"; normalized += char; index += 1; continue; }
      if (char === '"') { state = "double"; normalized += char; index += 1; continue; }
      if (char === "`") { state = "template"; normalized += char; index += 1; continue; }
      if (char === "/" && /[=(,:[!&|?{};+\-*%<>~^]$/.test(lastSignificant)) {
        state = "regex"; normalized += char; index += 1; continue;
      }
      if (char === "{" || char === "}") { normalized += `${char}\n`; if (char === "{") lastSignificant = char; index += 1; continue; }
      if (char === ";") { normalized += ";\n"; lastSignificant = ";"; index += 1; continue; }
      normalized += char;
      if (!/\s/.test(char)) lastSignificant = char;
      index += 1;
      continue;
    }
    normalized += char;
    if (state === "regex" && char === "\\") { normalized += next ?? ""; index += 2; continue; }
    if (char === "\\" && state !== "line" && state !== "block") { normalized += next ?? ""; index += 2; continue; }
    if (state === "line" && char === "\n") state = "code";
    else if (state === "block" && char === "*" && next === "/") { normalized += "/"; index += 2; state = "code"; continue; }
    else if (state === "regex" && char === "/") state = "code";
    else if (state === "single" && char === "'") state = "code";
    else if (state === "double" && char === '"') state = "code";
    else if (state === "template" && char === "`") state = "code";
    index += 1;
  }

  const lines = normalized.replace(/\r\n/g, "\n").split("\n");
  let depth = 0;
  const out: string[] = [];
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) { if (keepBlank && out.length && out[out.length - 1] !== "") out.push(""); continue; }
    const leadingClosers = (line.match(/^[}\])]+/)?.[0] ?? "").length;
    depth = Math.max(0, depth - leadingClosers);
    const stripped = line.replace(/'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`/g, "''");
    out.push(unit.repeat(depth) + line);
    const opens = (stripped.match(/[{[(]/g) ?? []).length;
    const closes = (stripped.match(/[}\]]/g) ?? []).length;
    depth = Math.max(0, depth + opens - closes + leadingClosers);
  }
  return out.join("\n");
}

export function JsFormatter() {
  const [input, setInput] = useState("const toolsy={name:'Toolsy',tools:89,features:['search','favorites'],run(){return this.tools}};\nfunction greet(user){if(!user){return 'guest'}return `Hello ${user}`}");
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [keepBlank, setKeepBlank] = useState(true);
  const output = useMemo(() => formatJs(input, indent, keepBlank), [input, indent, keepBlank]);
  return (
    <Workspace slug="javascript-formatter">
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Input JavaScript" htmlFor="jsf-in"><textarea id="jsf-in" value={input} onChange={(event) => setInput(event.target.value)} rows={14} spellCheck={false} className="field-input min-h-[260px] resize-y font-mono text-[11.5px]" /></Field>
        <Field label="Formatted output" htmlFor="jsf-out"><textarea id="jsf-out" value={output} readOnly rows={14} spellCheck={false} className="field-input min-h-[260px] resize-y bg-ink-950/50 font-mono text-[11.5px]" /></Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Indentation" htmlFor="jsf-indent"><Select id="jsf-indent" value={indent} onChange={(event) => setIndent(event.target.value as "2" | "4" | "tab")} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]} /></Field>
        <div className="flex items-end"><Toggle label="Keep blank lines" checked={keepBlank} onChange={setKeepBlank} /></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton value={output} label="Copy code" copiedLabel="Copied" />
        <Button variant="secondary" size="sm" onClick={() => download(output, "toolsy-formatted.js", "text/javascript")}><Icon name="download" size={13} /> Download .js</Button>
        <span className="ml-auto self-center font-mono text-[9.5px] text-mist-500">{sizeLabel(input)} → {sizeLabel(output)}</span>
      </div>
      <Note tone="warn">Formatting is whitespace-only: it never changes tokens inside strings, templates or comments. It is not a parser, so unusual syntax may indent imperfectly — check before deploying.</Note>
    </Workspace>
  );
}

/* ---------------------------------- YAML ---------------------------------- */

export function YamlFormatter() {
  const [input, setInput] = useState("service:\n  name: toolsy\n  port: 3000\n  features:\n    - search\n    - favorites\n  enabled: true");
  const [indent, setIndent] = useState("2");
  const [mode, setMode] = useState<"yaml" | "json">("yaml");
  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const doc = parseDocument(input, { prettyErrors: true });
      if (doc.errors.length > 0) {
        const first = doc.errors[0];
        const line = first.linePos?.[0]?.line ?? 0;
        return { output: "", error: `Line ${line || "?"}: ${first.message.replace(/\n[\s\S]*$/, "")}` };
      }
      const value = doc.toJS();
      return { output: mode === "json" ? JSON.stringify(value, null, Number(indent)) : yamlStringify(value, { indent: Number(indent), lineWidth: 0 }), error: "" };
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message.split("\n")[0] : "This YAML could not be parsed." };
    }
  }, [input, indent, mode]);
  return (
    <Workspace slug="yaml-formatter">
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="YAML input" htmlFor="yaml-in"><textarea id="yaml-in" value={input} onChange={(event) => setInput(event.target.value)} rows={14} spellCheck={false} className="field-input min-h-[260px] resize-y font-mono text-[11.5px]" /></Field>
        <Field label="Output" htmlFor="yaml-out" error={result.error}><textarea id="yaml-out" value={result.output} readOnly rows={14} spellCheck={false} className="field-input min-h-[260px] resize-y bg-ink-950/50 font-mono text-[11.5px]" /></Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Indentation" htmlFor="yaml-indent"><Select id="yaml-indent" value={indent} onChange={(event) => setIndent(event.target.value)} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "8", label: "8 spaces" }]} /></Field>
        <Field label="Output format" htmlFor="yaml-mode"><Select id="yaml-mode" value={mode} onChange={(event) => setMode(event.target.value as "yaml" | "json")} options={[{ value: "yaml", label: "Formatted YAML" }, { value: "json", label: "JSON (converted)" }]} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton value={result.output} label="Copy output" copiedLabel="Copied" />
        <Button variant="secondary" size="sm" disabled={!result.output} onClick={() => download(result.output, mode === "json" ? "toolsy.json" : "toolsy.yaml")}><Icon name="download" size={13} /> Download</Button>
      </div>
      {result.error ? <div className="mt-3"><Note tone="warn" title="YAML error">{result.error}</Note></div> : <div className="mt-3"><Note tone="info">Parsed with a full YAML 1.2 parser (<code className="font-mono">yaml</code>), so anchors, aliases and block scalars work. Formatting normalises indentation and converts to JSON when selected.</Note></div>}
    </Workspace>
  );
}

/* ---------------------------------- hashes -------------------------------- */

const HASH_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function HashGenerator() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("Toolsy");
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<(typeof HASH_ALGOS)[number]>("SHA-256");
  const [hashes, setHashes] = useState<{ algo: string; hex: string; base64: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function compute() {
    setError(""); setBusy(true);
    try {
      const data = mode === "file" && file ? await file.arrayBuffer() : new TextEncoder().encode(text);
      const list = mode === "file" ? [algorithm] : HASH_ALGOS;
      const next: { algo: string; hex: string; base64: string }[] = [];
      for (const algo of list) {
        const digest = await crypto.subtle.digest(algo, data);
        next.push({ algo, hex: toHex(digest), base64: toBase64(digest) });
      }
      setHashes(next);
    } catch {
      setError("Hashing failed. Web Crypto requires a secure context (https or localhost).");
    } finally { setBusy(false); }
  }

  useEffect(() => { if (mode === "text") void compute(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mode, text, file]);

  return (
    <Workspace slug="hash-generator">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["text", "file"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setMode(option)} aria-pressed={mode === option} className={mode === option ? "min-h-9 rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold capitalize text-brand-200" : "min-h-9 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] capitalize text-mist-400"}>{option}</button>
          ))}
        </div>
        {mode === "text" ? (
          <Field label="Text to hash" htmlFor="hash-text"><textarea id="hash-text" value={text} onChange={(event) => setText(event.target.value)} rows={4} className="field-input resize-y font-mono text-[12px]" /></Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 text-[12px] text-mist-300 hover:border-brand-400/40">
              <Icon name="fileText" size={15} /> {file ? file.name : "Choose a file to hash"}
              <input type="file" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); event.target.value = ""; }} />
            </label>
            <Field label="Algorithm" htmlFor="hash-algo"><Select id="hash-algo" value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)} options={HASH_ALGOS.map((algo) => ({ value: algo, label: algo }))} /></Field>
          </div>
        )}
        {error && <Note tone="warn">{error}</Note>}
        {hashes.length > 0 && (
          <div className="space-y-2">
            {hashes.map((entry) => (
              <div key={entry.algo} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-300">{entry.algo}</span>
                  <CopyButton value={entry.hex} label="Copy" copiedLabel="Copied" variant="ghost" size="sm" />
                </div>
                <p className="mt-1 break-all font-mono text-[11.5px] leading-relaxed text-mist-200">{entry.hex}</p>
                <p className="mt-1 break-all font-mono text-[9.5px] text-mist-500">base64: {entry.base64}</p>
              </div>
            ))}
          </div>
        )}
        <Button onClick={() => void compute()} disabled={busy}><Icon name={busy ? "refresh" : "shield"} size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Hashing…" : "Compute hashes"}</Button>
        <Note tone="info">Uses the browser&apos;s Web Crypto API. SHA-1 is included only for legacy checks and is not collision-safe. MD5 is not available in Web Crypto and is deliberately not faked. Files are read locally.</Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------------- JWT ---------------------------------- */

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function JwtDecoder() {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [verification, setVerification] = useState<"idle" | "valid" | "invalid" | "unsupported">("idle");
  const parsed = useMemo(() => {
    const clean = token.trim();
    if (!clean) return { error: "", header: "", payload: "", claims: null as Record<string, unknown> | null, signature: "", algorithm: "" };
    const parts = clean.split(".");
    if (parts.length !== 3) return { error: "A JWT needs three parts separated by dots: header.payload.signature.", header: "", payload: "", claims: null, signature: "", algorithm: "" };
    try {
      const header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
      const payload = JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2);
      const claims = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
      return { error: "", header, payload, claims, signature: parts[2], algorithm: (JSON.parse(base64UrlDecode(parts[0])) as { alg?: string }).alg ?? "" };
    } catch {
      return { error: "This token is not valid Base64URL-encoded JSON.", header: "", payload: "", claims: null, signature: "", algorithm: "" };
    }
  }, [token]);

  async function verify() {
    try {
      const [headerPart, payloadPart, signaturePart] = token.trim().split(".");
      const algo = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }[parsed.algorithm];
      if (!algo) { setVerification("unsupported"); return; }
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: algo }, false, ["sign"]);
      const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerPart}.${payloadPart}`)));
      const expected = btoa(String.fromCharCode(...signature)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      setVerification(expected === signaturePart ? "valid" : "invalid");
    } catch { setVerification("unsupported"); }
  }

  const numeric = (value: unknown) => typeof value === "number" ? new Date(value * 1000).toLocaleString("en-GB") : null;
  const claims = parsed.claims;
  return (
    <Workspace slug="jwt-decoder">
      <div className="space-y-4">
        <Field label="JWT" htmlFor="jwt-input" hint="header.payload.signature"><textarea id="jwt-input" value={token} onChange={(event) => { setToken(event.target.value); setVerification("idle"); }} rows={5} spellCheck={false} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" className="field-input resize-y font-mono text-[11px]" /></Field>
        {parsed.error && <Note tone="warn">{parsed.error}</Note>}
        {claims && (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <StatTile label="Algorithm" value={parsed.algorithm || "unknown"} />
              <StatTile label="Expires" value={numeric(claims.exp) ?? "not set"} />
              <StatTile label="Status" value={numeric(claims.exp) && (claims.exp as number) * 1000 < Date.now() ? <span className="text-rose-300">expired</span> : numeric(claims.exp) ? <span className="text-brand-300">valid time window</span> : "unknown"} />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Header" htmlFor="jwt-header"><textarea id="jwt-header" value={parsed.header} readOnly rows={7} className="field-input resize-y bg-ink-950/50 font-mono text-[11px]" /></Field>
              <Field label="Payload" htmlFor="jwt-payload"><textarea id="jwt-payload" value={parsed.payload} readOnly rows={7} className="field-input resize-y bg-ink-950/50 font-mono text-[11px]" /></Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <StatTile label="Issued at" value={numeric(claims.iat) ?? "—"} />
              <StatTile label="Not before" value={numeric(claims.nbf) ?? "—"} />
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              <p className="text-[12px] font-semibold text-mist-200">Verify HS256/384/512 signature locally (optional)</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input type="password" value={secret} onChange={(event) => { setSecret(event.target.value); setVerification("idle"); }} placeholder="HMAC secret" aria-label="HMAC secret" className="font-mono" />
                <Button size="md" className="shrink-0" onClick={() => void verify()} disabled={!secret || !parsed.signature}>Verify</Button>
              </div>
              {verification === "valid" && <p className="mt-2 text-[11.5px] text-brand-300">Signature matches for this secret.</p>}
              {verification === "invalid" && <p className="mt-2 text-[11.5px] text-rose-300">Signature does not match this secret.</p>}
              {verification === "unsupported" && <p className="mt-2 text-[11.5px] text-amber-300">Only HS256, HS384 and HS512 can be verified in the browser. RS/ES algorithms need the public key and are not verified here.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={parsed.payload} label="Copy payload" copiedLabel="Copied" />
              <CopyButton value={token.trim()} label="Copy token" copiedLabel="Copied" variant="secondary" />
            </div>
          </>
        )}
        <Note tone="warn" title="Decoding is not validation">This decodes token contents locally and never sends them anywhere. Never paste production secrets into any website. A valid signature check here does not prove the issuer is trustworthy.</Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------------- cron --------------------------------- */

const CRON_FIELDS = [
  { name: "Minute", min: 0, max: 59 },
  { name: "Hour", min: 0, max: 23 },
  { name: "Day of month", min: 1, max: 31 },
  { name: "Month", min: 1, max: 12 },
  { name: "Day of week", min: 0, max: 6 },
];

function parseCronPart(part: string, min: number, max: number): { values: number[]; error: string } {
  const values = new Set<number>();
  for (const chunk of part.split(",")) {
    const piece = chunk.trim();
    if (!piece) return { values: [], error: "Empty list item" };
    const stepMatch = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(piece);
    if (!stepMatch) return { values: [], error: `Invalid value “${piece}”` };
    const step = stepMatch[2] ? Number(stepMatch[2]) : 1;
    if (step < 1) return { values: [], error: "Step must be at least 1" };
    let start = min, end = max;
    if (stepMatch[1] !== "*") {
      if (stepMatch[1].includes("-")) {
        const [a, b] = stepMatch[1].split("-").map(Number);
        start = a; end = b;
      } else {
        start = Number(stepMatch[1]);
        end = stepMatch[2] ? max : start;
      }
    }
    if (start < min || end > max || start > end) return { values: [], error: `Out of range (${min}–${max})` };
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return { values: [...values].sort((a, b) => a - b), error: "" };
}

function nextRuns(expression: string, count = 5): { runs: Date[]; error: string; human: string[] } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return { runs: [], error: "A standard cron expression has five fields: minute hour day-of-month month day-of-week.", human: [] };
  const parsed = CRON_FIELDS.map((field, index) => ({ ...field, ...parseCronPart(parts[index], field.min, field.max) }));
  const invalid = parsed.find((field) => field.error);
  if (invalid) return { runs: [], error: `${invalid.name}: ${invalid.error}`, human: [] };
  const [minute, hour, day, month, week] = parsed;
  const runs: Date[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);
  for (let i = 0; i < 60 * 24 * 366 && runs.length < count; i += 1) {
    if (
      minute.values.includes(cursor.getMinutes()) &&
      hour.values.includes(cursor.getHours()) &&
      month.values.includes(cursor.getMonth() + 1) &&
      day.values.includes(cursor.getDate()) &&
      week.values.includes(cursor.getDay())
    ) runs.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  const human = [
    `At minute ${parts[0] === "*" ? "every minute" : minute.values.join(", ")}`,
    `at hour ${parts[1] === "*" ? "every hour" : hour.values.join(", ")}`,
    `on day-of-month ${parts[2] === "*" ? "every day" : day.values.join(", ")}`,
    `in month ${parts[3] === "*" ? "every month" : month.values.join(", ")}`,
    `on weekday ${parts[4] === "*" ? "any day" : week.values.map((value) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][value]).join(", ")}`,
  ];
  return { runs, error: "", human };
}

export function CronHelper() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const result = useMemo(() => nextRuns(expression, 5), [expression]);
  const presets = [
    { label: "Every weekday at 09:00", value: "0 9 * * 1-5" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "First day of each month", value: "0 0 1 * *" },
    { label: "Every Sunday at 03:30", value: "30 3 * * 0" },
  ];
  return (
    <Workspace slug="cron-expression-helper">
      <div className="space-y-4">
        <Field label="Cron expression" htmlFor="cron-input" hint="minute hour day month weekday">
          <Input id="cron-input" value={expression} onChange={(event) => setExpression(event.target.value)} spellCheck={false} className="font-mono text-[15px]" />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button key={preset.value} type="button" onClick={() => setExpression(preset.value)} className="min-h-9 rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-mist-400 hover:border-brand-400/30 hover:text-brand-200">{preset.label}</button>
          ))}
        </div>
        {result.error ? <Note tone="warn" title="Invalid expression">{result.error}</Note> : (
          <>
            <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.045] p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-300">Runs</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-mist-300">{result.human.join(", ")}.</p>
              <p className="mt-1 text-[10.5px] text-mist-500">Times use your local time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              {result.runs.map((run, index) => (
                <div key={index} className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2 text-[11.5px] last:border-b-0">
                  <span className="font-mono text-mist-500">#{index + 1}</span>
                  <span className="text-mist-200">{run.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" })}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <CopyButton value={expression} label="Copy expression" copiedLabel="Copied" />
        <Note tone="info">Standard five-field cron. Supports *, lists (a,b), ranges (a-b) and steps (*/n). Six-field cron with seconds and non-standard macros such as @daily are not evaluated here.</Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------------- chmod --------------------------------- */

function symbolicFromOctal(digits: string): { symbolic: string; special: string; error: string } {
  if (!/^[0-7]{3,4}$/.test(digits)) return { symbolic: "", special: "", error: "Enter 3 or 4 octal digits (0–7), for example 644 or 0755." };
  const value = digits.padStart(4, "0");
  const [special, owner, group, other] = value.split("").map(Number);
  const triplet = (digit: number) => `${digit & 4 ? "r" : "-"}${digit & 2 ? "w" : "-"}${digit & 1 ? "x" : "-"}`;
  const specialFlags = [special & 4 ? "setuid" : "", special & 2 ? "setgid" : "", special & 1 ? "sticky" : ""].filter(Boolean);
  return { symbolic: `${triplet(owner)}${triplet(group)}${triplet(other)}`, special: specialFlags.join(", "), error: "" };
}

export function UnixPermissions() {
  const [octal, setOctal] = useState("644");
  const parsed = symbolicFromOctal(octal.trim());
  const rows = parsed.error ? [] : ["owner", "group", "others"].map((who, index) => {
    const triple = parsed.symbolic.slice(index * 3, index * 3 + 3);
    return { who, triple, octal: octal.trim().padStart(4, "0")[index + 1] };
  });
  function updateSymbolic(who: number, position: number) {
    if (parsed.error) return;
    const chars = parsed.symbolic.split("");
    chars[who * 3 + position] = chars[who * 3 + position] === "-" ? ["r", "w", "x"][position] : "-";
    const digitOf = (triple: string) => (triple[0] === "r" ? 4 : 0) + (triple[1] === "w" ? 2 : 0) + (triple[2] === "x" ? 1 : 0);
    const next = `${digitOf(chars.slice(0, 3).join(""))}${digitOf(chars.slice(3, 6).join(""))}${digitOf(chars.slice(6, 9).join(""))}`;
    setOctal(next);
  }
  return (
    <Workspace slug="unix-permissions-calculator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
          <Field label="Octal mode" htmlFor="chmod-octal" error={parsed.error}>
            <Input id="chmod-octal" value={octal} onChange={(event) => setOctal(event.target.value.replace(/[^0-7]/g, "").slice(0, 4))} className="font-mono text-[16px]" />
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-mist-200">Symbolic</p>
            <p className="rounded-xl border border-white/[0.07] bg-ink-950/50 px-3 py-2.5 font-mono text-[15px] text-brand-200">{parsed.error ? "—" : parsed.symbolic}</p>
          </div>
        </div>
        {!parsed.error && (
          <>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="grid grid-cols-[1fr_60px_110px] gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500"><span>Who</span><span className="text-center">Octal</span><span className="text-center">Read / write / execute</span></div>
              {rows.map((row, index) => (
                <div key={row.who} className="grid grid-cols-[1fr_60px_110px] items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-[12px] capitalize text-mist-300 last:border-b-0">
                  <span>{row.who}</span>
                  <span className="text-center font-mono">{row.octal}</span>
                  <span className="flex justify-center gap-1">
                    {["r", "w", "x"].map((letter, position) => (
                      <button key={letter} type="button" onClick={() => updateSymbolic(index, position)} aria-pressed={row.triple[position] === letter} className={row.triple[position] === letter ? "grid size-7 place-items-center rounded border border-brand-400/40 bg-brand-400/15 font-mono text-[11px] text-brand-200" : "grid size-7 place-items-center rounded border border-white/10 font-mono text-[11px] text-mist-600"}>{letter}</button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            {parsed.special && <Note tone="warn" title="Special bits set">{parsed.special}. These change execution semantics; apply deliberately.</Note>}
            <div className="flex flex-wrap gap-2">
              <CopyButton value={`chmod ${octal.trim()}`} label="Copy chmod command" copiedLabel="Copied" />
              <CopyButton value={parsed.symbolic} label="Copy symbolic" copiedLabel="Copied" variant="secondary" />
            </div>
          </>
        )}
        <Note tone="info">Common modes: 644 files, 755 executables and directories, 600 private files, 775 shared directories. Toggle the letters to explore. This is a reference tool — check your system&apos;s security policy before applying permissions.</Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- number base ----------------------------- */

const BASES = [
  { value: "2", label: "Binary (2)" },
  { value: "8", label: "Octal (8)" },
  { value: "10", label: "Decimal (10)" },
  { value: "16", label: "Hexadecimal (16)" },
  { value: "32", label: "Base 32" },
  { value: "36", label: "Base 36" },
];

export function NumberBaseConverter() {
  const [value, setValue] = useState("255");
  const [fromBase, setFromBase] = useState("10");
  const result = useMemo(() => {
    const clean = value.trim().toLowerCase().replace(/^0x/, "").replace(/[\s_]/g, "");
    if (!clean) return { error: "", decimal: "", rows: [] as { base: number; label: string; output: string }[] };
    const base = Number(fromBase);
    try {
      if (!/^-?[0-9a-z]+$/.test(clean)) throw new Error("invalid");
      const negative = clean.startsWith("-");
      const digits = negative ? clean.slice(1) : clean;
      let total = 0n;
      for (const character of digits) {
        const digit = parseInt(character, 36);
        if (!Number.isFinite(digit) || digit >= base) throw new Error("invalid");
        total = total * BigInt(base) + BigInt(digit);
      }
      if (negative) total = -total;
      const rows = [2, 8, 10, 16, 32, 36].map((target) => ({ base: target, label: BASES.find((entry) => entry.value === String(target))?.label ?? `Base ${target}`, output: total.toString(target).toUpperCase() }));
      return { error: "", decimal: total.toString(10), rows };
    } catch {
      return { error: `“${value}” is not a valid base-${fromBase} number.`, decimal: "", rows: [] };
    }
  }, [value, fromBase]);
  return (
    <Workspace slug="number-base-converter">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_190px] sm:items-end">
          <Field label="Number" htmlFor="base-value" error={result.error}>
            <Input id="base-value" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} className="font-mono text-[15px]" />
          </Field>
          <Field label="Input base" htmlFor="base-from">
            <Select id="base-from" value={fromBase} onChange={(event) => setFromBase(event.target.value)} options={BASES} />
          </Field>
        </div>
        {result.rows.length > 0 && (
          <>
            <ResultCard label="Decimal value" value={formatNumber(Number(result.decimal))} hint="Converted with exact integer arithmetic, so very large values stay accurate." />
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              {result.rows.map((row) => (
                <div key={row.base} className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-b-0">
                  <span className="w-[110px] shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">{row.label}</span>
                  <span className="min-w-0 flex-1 break-all font-mono text-[12px] text-mist-200">{row.output}</span>
                  <CopyButton value={row.output} label="Copy" copiedLabel="Copied" variant="ghost" size="sm" />
                </div>
              ))}
            </div>
          </>
        )}
        <Note tone="info">Supports bases 2–36 using digits 0–9 and letters A–Z. Prefixes such as 0x are accepted. Very large numbers are handled with BigInt instead of floating point, so no digits are lost.</Note>
      </div>
    </Workspace>
  );
}
