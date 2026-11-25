import { useEffect, useMemo, useState } from "react";
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
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { downloadFile, formatNumber } from "@/lib/utils";

function byteLength(value: string): number {
  if (!value) return 0;
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  if (typeof Blob !== "undefined") return new Blob([value]).size;
  return unescape(encodeURIComponent(value)).length;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ------------------------------ JSON formatter ----------------------------- */

type JsonIssue = { message: string; line: number; column: number; snippet: string };

const JSON_SAMPLE = `{"project":"Toolsy","version":2,"private":true,"tools":25,"categories":["generators","text","developer","design"],"settings":{"theme":"dark","localOnly":true},"author":{"name":"Toolsy","url":"https://toolsy.com"}}`;

function inspectJsonError(raw: string, error: unknown): JsonIssue {
  const fallback = error instanceof Error ? error.message : "This is not valid JSON.";
  const positionOnly = /position (\d+)/i.exec(fallback);
  const lineColumn = /line (\d+) column (\d+)/i.exec(fallback);
  let line = 1;
  let column = 1;

  if (lineColumn) {
    line = Number(lineColumn[1]);
    column = Number(lineColumn[2]);
  } else if (positionOnly) {
    const position = Math.min(Number(positionOnly[1]), raw.length);
    const before = raw.slice(0, position);
    const lines = before.split("\n");
    line = lines.length;
    column = (lines[lines.length - 1]?.length ?? 0) + 1;
  }

  const allLines = raw.split("\n");
  const start = Math.max(0, line - 2);
  const end = Math.min(allLines.length, line + 1);
  const width = String(end).length;
  const snippet = allLines
    .slice(start, end)
    .map((text, index) => {
      const number = start + index + 1;
      return `${number === line ? ">" : " "} ${String(number).padStart(width, " ")} | ${text}`;
    })
    .join("\n");

  const message = fallback
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/\s+in JSON at position \d+.*$/i, "")
    .replace(/\s+at position \d+.*$/i, "")
    .replace(/\s*\(line \d+ column \d+\)\s*$/i, "")
    .trim();

  return { message: message || fallback, line, column, snippet };
}

function collectJsonStats(value: unknown): { keys: number; depth: number; arrays: number } {
  let keys = 0;
  let arrays = 0;
  let depth = 0;

  function walk(node: unknown, level: number) {
    depth = Math.max(depth, level);
    if (Array.isArray(node)) {
      arrays += 1;
      node.forEach((item) => walk(item, level + 1));
    } else if (node && typeof node === "object") {
      const entries = Object.entries(node as Record<string, unknown>);
      keys += entries.length;
      entries.forEach(([, item]) => walk(item, level + 1));
    }
  }

  walk(value, 1);
  return { keys, depth, arrays };
}

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState("");

  const parseResult = useMemo(() => {
    if (!input.trim()) return { status: "empty" as const, value: undefined, issue: null };
    try {
      return { status: "valid" as const, value: JSON.parse(input) as unknown, issue: null };
    } catch (error) {
      return { status: "invalid" as const, value: undefined, issue: inspectJsonError(input, error) };
    }
  }, [input]);

  const stats = useMemo(() => {
    if (parseResult.status !== "valid") return null;
    const base = collectJsonStats(parseResult.value);
    return {
      ...base,
      type: Array.isArray(parseResult.value)
        ? `Array · ${parseResult.value.length} items`
        : parseResult.value === null
          ? "null"
          : typeof parseResult.value,
    };
  }, [parseResult]);

  function stringify(value: unknown, spaces: number | string) {
    return JSON.stringify(value, null, spaces);
  }

  function formatJson(spaces: number | string) {
    if (parseResult.status !== "valid") return;
    let value = parseResult.value;
    if (sortKeys && value && typeof value === "object" && !Array.isArray(value)) {
      value = sortObject(value as Record<string, unknown>);
    }
    setOutput(stringify(value, spaces));
  }

  function minifyJson() {
    if (parseResult.status !== "valid") return;
    setOutput(JSON.stringify(parseResult.value));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formatJson(Number(indent) || 2);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // The handler only needs the latest parsed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseResult, indent, sortKeys]);

  const issue = parseResult.issue;

  return (
    <Workspace slug="json-formatter-validator">
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Your JSON"
            htmlFor="json-input"
            hint={`${formatNumber(input.length)} chars`}
          >
            <textarea
              id="json-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={12}
              spellCheck={false}
              placeholder='{"paste":"your JSON here"}'
              className="field-input min-h-[230px] resize-y font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
          <Field label="Output" htmlFor="json-output" hint={output ? `${formatNumber(output.length)} chars` : "format to populate"}>
            <textarea
              id="json-output"
              value={output}
              readOnly
              rows={12}
              spellCheck={false}
              placeholder="Formatted or minified JSON appears here."
              className="field-input min-h-[230px] resize-y bg-ink-950/50 font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <Field label="Indentation" htmlFor="json-indent">
            <Select
              id="json-indent"
              value={indent}
              onChange={(event) => setIndent(event.target.value)}
              options={[
                { value: "2", label: "2 spaces" },
                { value: "4", label: "4 spaces" },
                { value: "tab", label: "Tabs" },
              ]}
            />
          </Field>
          <Toggle
            label="Sort object keys"
            description="Alphabetical order, applied when formatting"
            checked={sortKeys}
            onChange={setSortKeys}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => formatJson(indent === "tab" ? "\t" : Number(indent))} disabled={parseResult.status !== "valid"}>
            <Icon name="sparkles" size={15} />
            Format JSON
          </Button>
          <Button variant="secondary" onClick={minifyJson} disabled={parseResult.status !== "valid"}>
            <Icon name="minus" size={15} />
            Minify
          </Button>
          <CopyButton value={output} label="Copy output" copiedLabel="Copied" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(output, "toolsy.json", "application/json")}
            disabled={!output}
          >
            <Icon name="download" size={14} />
            Download .json
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            disabled={!input && !output}
          >
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        {parseResult.status === "empty" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-[12px] text-mist-500">Paste JSON to validate it live, or start from a sample.</p>
            <Button variant="secondary" size="sm" onClick={() => setInput(JSON_SAMPLE)}>
              <Icon name="fileText" size={13} />
              Load sample
            </Button>
          </div>
        ) : parseResult.status === "valid" ? (
          <>
            <Note tone="brand" title="Valid JSON">
              Parsed successfully. {stats && `Type: ${stats.type}.`} Nothing leaves your browser.
            </Note>
            {stats && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Keys" value={formatNumber(stats.keys)} />
                <StatTile label="Depth" value={formatNumber(stats.depth)} />
                <StatTile label="Arrays" value={formatNumber(stats.arrays)} />
                <StatTile label="Input size" value={formatBytes(byteLength(input))} />
              </div>
            )}
          </>
        ) : (
          issue && (
            <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Icon name="alert" size={15} className="text-rose-300" />
                <p className="text-[12.5px] font-semibold text-rose-100">
                  Invalid JSON · line {issue.line}, column {issue.column}
                </p>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-rose-100/65">{issue.message}</p>
              {issue.snippet && (
                <pre className="mt-3 overflow-x-auto rounded-lg border border-rose-400/15 bg-ink-950/60 p-3 font-mono text-[11px] leading-relaxed text-mist-300">
                  <code>{issue.snippet}</code>
                </pre>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
                A <span className="text-mist-300">^</span> style error hints: check the quoted key before
                the indicated position, or look for a trailing comma.
              </p>
            </div>
          )
        )}

        <Note tone="info">
          Keyboard shortcut: <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">⌘/Ctrl + Enter</kbd>{" "}
          formats the document. JSON must use double quotes, no comments and no trailing commas.
        </Note>
      </div>
    </Workspace>
  );
}

function sortObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = value[key];
      return result;
    }, {});
}

/* --------------------------------- Base64 --------------------------------- */

type Direction = "encode" | "decode";

function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

function decodeBase64(text: string): string {
  let normalized = text.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!normalized) return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error("The input contains characters that are not part of the Base64 alphabet.");
  }
  while (normalized.length % 4 !== 0) normalized += "=";
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function Base64Tool() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("Toolsy — narzędzia online ✨");
  const [urlSafe, setUrlSafe] = useState(false);

  const result = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      const output = direction === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input);
      return { output, error: "" };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.name === "TypeError"
            ? "This doesn't look like valid Base64. Check that the whole value was copied."
            : error.message
          : "Could not convert this value.";
      return { output: "", error: message };
    }
  }, [direction, input, urlSafe]);

  return (
    <Workspace slug="base64-encoder-decoder">
      <div className="space-y-5">
        <Segmented
          label="Conversion direction"
          value={direction}
          onChange={setDirection}
          options={[
            { value: "encode", label: "Text → Base64" },
            { value: "decode", label: "Base64 → Text" },
          ]}
          className="sm:max-w-sm"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={direction === "encode" ? "Text to encode" : "Base64 to decode"} htmlFor="base64-input" hint={formatBytes(byteLength(input))}>
            <textarea
              id="base64-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={direction === "encode" ? "Type anything, including emoji 🚀" : "SGVsbG8sIFRvb2xvcmE="}
              className="field-input min-h-[190px] resize-y font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
          <Field label="Result" htmlFor="base64-output" hint={result.output ? formatBytes(byteLength(result.output)) : "live"}>
            <textarea
              id="base64-output"
              value={result.output}
              readOnly
              rows={9}
              spellCheck={false}
              placeholder="The converted value appears here."
              className="field-input min-h-[190px] resize-y bg-ink-950/50 font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
        </div>

        {direction === "encode" && (
          <Toggle
            label="URL-safe Base64"
            description="Uses - and _ instead of + and /, and removes = padding"
            checked={urlSafe}
            onChange={setUrlSafe}
          />
        )}

        {result.error ? (
          <Note tone="warn" title="Could not decode">
            {result.error}
          </Note>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Input size" value={formatBytes(byteLength(input))} />
            <StatTile label="Output size" value={formatBytes(byteLength(result.output))} />
            <StatTile
              label="Change"
              value={
                input && result.output
                  ? `${result.output.length > input.length ? "+" : ""}${Math.round(((result.output.length - input.length) / Math.max(input.length, 1)) * 100)}%`
                  : "—"
              }
            />
            <StatTile label="Characters" value={formatNumber(result.output.length)} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={result.output} label="Copy result" copiedLabel="Copied" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setInput(result.output);
              setDirection(direction === "encode" ? "decode" : "encode");
            }}
            disabled={!result.output}
          >
            <Icon name="arrowUpDown" size={14} />
            Swap direction
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(result.output, direction === "encode" ? "toolsy-base64.txt" : "toolsy-decoded.txt")}
            disabled={!result.output}
          >
            <Icon name="download" size={14} />
            Download
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        <Note tone="info">
          Base64 is an encoding, not encryption. This tool handles Unicode correctly by converting
          through UTF-8 bytes, so accents, emoji and non-Latin scripts survive the round trip.
        </Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- URL encoder ------------------------------ */

type UrlMode = "full" | "component";

function analyzeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol)) return null;
    return {
      protocol: url.protocol.replace(":", ""),
      host: url.host,
      path: url.pathname || "/",
      hash: url.hash,
      params: [...url.searchParams.entries()],
    };
  } catch {
    return null;
  }
}

export function UrlEncoderTool() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [mode, setMode] = useState<UrlMode>("full");
  const [plusAsSpace, setPlusAsSpace] = useState(false);
  const [input, setInput] = useState(
    "https://toolsy.com/tools/url-encoder-decoder?query=free online tools&lang=pl"
  );

  const result = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      let output: string;
      if (direction === "encode") {
        output = mode === "full" ? encodeURI(input) : encodeURIComponent(input);
      } else {
        const prepared = plusAsSpace ? input.replace(/\+/g, " ") : input;
        output = mode === "full" ? decodeURI(prepared) : decodeURIComponent(prepared);
      }
      return { output, error: "" };
    } catch {
      return {
        output: "",
        error:
          "The input contains a malformed percent sequence (for example a lone % or invalid UTF-8). Fix the escaped characters and try again.",
      };
    }
  }, [direction, input, mode, plusAsSpace]);

  const analysis = useMemo(() => analyzeUrl(direction === "decode" ? result.output : input), [direction, input, result.output]);

  return (
    <Workspace slug="url-encoder-decoder">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Direction</p>
            <Segmented
              label="Direction"
              value={direction}
              onChange={setDirection}
              options={[
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Scope</p>
            <Segmented
              label="Scope"
              value={mode}
              onChange={setMode}
              options={[
                { value: "full", label: "Whole URL" },
                { value: "component", label: "Component" },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Input" htmlFor="url-input" hint={`${input.length} chars`}>
            <textarea
              id="url-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="https://example.com/search?q=free tools"
              className="field-input min-h-[170px] resize-y font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
          <Field label="Result" htmlFor="url-output" hint="live">
            <textarea
              id="url-output"
              value={result.output}
              readOnly
              rows={8}
              spellCheck={false}
              placeholder="Encoded or decoded output appears here."
              className="field-input min-h-[170px] resize-y bg-ink-950/50 font-mono text-[12.5px] leading-relaxed"
            />
          </Field>
        </div>

        {direction === "decode" && (
          <Toggle
            label="Treat + as a space"
            description="Common in form-encoded query strings"
            checked={plusAsSpace}
            onChange={setPlusAsSpace}
          />
        )}

        {result.error && (
          <Note tone="warn" title="Malformed URL encoding">
            {result.error}
          </Note>
        )}

        <Note tone="info">
          {mode === "full"
            ? "Whole URL mode preserves structure characters such as / ? & = so the address stays usable."
            : "Component mode escapes / ? & = as well — use it for a single query value or path segment."}
        </Note>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={result.output} label="Copy result" copiedLabel="Copied" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setInput(result.output);
              setDirection(direction === "encode" ? "decode" : "encode");
            }}
            disabled={!result.output}
          >
            <Icon name="arrowUpDown" size={14} />
            Swap
          </Button>
          <CopyButton value={input} label="Copy input" copiedLabel="Copied" variant="ghost" />
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        {analysis && (
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
            <div className="flex items-center gap-2">
              <Icon name="globe" size={14} className="text-brand-300" />
              <h3 className="text-[13px] font-semibold text-mist-100">URL breakdown</h3>
            </div>
            <dl className="mt-3 grid gap-2 text-[11.5px] sm:grid-cols-2">
              {[
                ["Protocol", analysis.protocol],
                ["Host", analysis.host],
                ["Path", analysis.path],
                ["Fragment", analysis.hash || "—"],
              ].map(([term, value]) => (
                <div key={term} className="flex items-baseline justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                  <dt className="text-mist-500">{term}</dt>
                  <dd className="min-w-0 truncate font-mono text-mist-200">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
              Query parameters ({analysis.params.length})
            </p>
            {analysis.params.length === 0 ? (
              <p className="mt-1.5 text-[11.5px] text-mist-500">This URL has no query parameters.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {analysis.params.map(([key, value], index) => (
                  <div key={`${key}-${index}`} className="flex flex-col gap-1 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-[11px] text-brand-200">{key}</span>
                    <span className="min-w-0 break-all font-mono text-[11px] text-mist-300">{value || "(empty)"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Workspace>
  );
}

/* ----------------------------- timestamp converter ------------------------- */

type TimestampDirection = "toDate" | "toTimestamp";
type TimeUnit = "auto" | "seconds" | "milliseconds";

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function relativeFromNow(date: Date): string {
  const difference = date.getTime() - Date.now();
  const absolute = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absolute < 60_000) return formatter.format(Math.round(difference / 1000), "second");
  if (absolute < 3_600_000) return formatter.format(Math.round(difference / 60_000), "minute");
  if (absolute < 86_400_000) return formatter.format(Math.round(difference / 3_600_000), "hour");
  if (absolute < 2_592_000_000) return formatter.format(Math.round(difference / 86_400_000), "day");
  if (absolute < 31_536_000_000) return formatter.format(Math.round(difference / 2_592_000_000), "month");
  return formatter.format(Math.round(difference / 31_536_000_000), "year");
}

export function TimestampConverter() {
  const [direction, setDirection] = useState<TimestampDirection>("toDate");
  const [unit, setUnit] = useState<TimeUnit>("auto");
  const [timestampInput, setTimestampInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => toDateTimeLocal(new Date()));

  const timestampResult = useMemo(() => {
    const raw = timestampInput.trim();
    if (!raw) return { date: null as Date | null, error: "", usedUnit: "" };
    if (!/^-?\d+$/.test(raw)) {
      return { date: null, error: "Use a whole number, optionally negative. Decimals and letters are not Unix timestamps.", usedUnit: "" };
    }
    const numeric = Number(raw);
    const usedUnit =
      unit === "auto" ? (Math.abs(numeric) >= 100_000_000_000 ? "milliseconds" : "seconds") : unit;
    const milliseconds = usedUnit === "milliseconds" ? numeric : numeric * 1000;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) {
      return { date: null, error: "That value is outside the range of valid JavaScript dates.", usedUnit };
    }
    return { date, error: "", usedUnit };
  }, [timestampInput, unit]);

  const dateResult = useMemo(() => {
    if (!dateInput) return { valid: false, date: null as Date | null };
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return { valid: false, date: null };
    return { valid: true, date };
  }, [dateInput]);

  function useNow() {
    const now = new Date();
    setTimestampInput(String(Math.floor(now.getTime() / 1000)));
    setDateInput(toDateTimeLocal(now));
  }

  const date = direction === "toDate" ? timestampResult.date : dateResult.date;

  return (
    <Workspace slug="timestamp-converter">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Conversion direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: "toDate", label: "Timestamp → Date" },
              { value: "toTimestamp", label: "Date → Timestamp" },
            ]}
            className="sm:max-w-sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={useNow}
            className="ml-auto"
          >
            <Icon name="clock" size={13} />
            Use current time
          </Button>
        </div>

        {direction === "toDate" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <Field label="Unix timestamp" htmlFor="timestamp-input" hint={timestampResult.usedUnit || "auto-detect"}>
                <Input
                  id="timestamp-input"
                  value={timestampInput}
                  onChange={(event) => setTimestampInput(event.target.value)}
                  inputMode="numeric"
                  spellCheck={false}
                  placeholder="1767225600"
                  className="font-mono text-[15px]"
                />
              </Field>
              <Field label="Unit" htmlFor="timestamp-unit">
                <Select
                  id="timestamp-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as TimeUnit)}
                  options={[
                    { value: "auto", label: "Auto-detect" },
                    { value: "seconds", label: "Seconds" },
                    { value: "milliseconds", label: "Milliseconds" },
                  ]}
                />
              </Field>
            </div>

            {timestampResult.error ? (
              <Note tone="warn" title="Cannot convert">
                {timestampResult.error}
              </Note>
            ) : date ? (
              <>
                <ResultCard
                  label="Human-readable time"
                  value={date.toLocaleString("en-US", { dateStyle: "full", timeStyle: "long" })}
                  hint={`Interpreted as ${timestampResult.usedUnit} since 1 January 1970 · ${relativeFromNow(date)}`}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["UTC", date.toUTCString()],
                    ["ISO 8601", date.toISOString()],
                    ["Local time", date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" })],
                    ["Local parts", `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`],
                    ["Milliseconds", String(date.getTime())],
                    ["Seconds", String(Math.floor(date.getTime() / 1000))],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.018] px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">{label}</p>
                        <p className="mt-0.5 break-all font-mono text-[11.5px] text-mist-200">{value}</p>
                      </div>
                      <Icon name="clock" size={13} className="shrink-0 text-mist-600" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={String(Math.floor(date.getTime() / 1000))} label="Copy seconds" copiedLabel="Copied" />
                  <CopyButton value={String(date.getTime())} label="Copy milliseconds" copiedLabel="Copied" />
                  <CopyButton value={date.toISOString()} label="Copy ISO" copiedLabel="Copied" />
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <Field label="Date and local time" htmlFor="date-input" hint="read in your browser's time zone">
              <Input
                id="date-input"
                type="datetime-local"
                step={1}
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                className="font-mono"
              />
            </Field>

            {!dateResult.valid ? (
              <Note tone="warn">Choose a valid date and time to generate a timestamp.</Note>
            ) : (
              dateResult.date && (
                <>
                  <ResultCard
                    label="Unix timestamp"
                    value={String(Math.floor(dateResult.date.getTime() / 1000))}
                    suffix="seconds"
                    hint={`${String(dateResult.date.getTime())} milliseconds · ${dateResult.date.toLocaleString("en-US", { dateStyle: "full", timeStyle: "long" })}`}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <StatTile label="Milliseconds" value={String(dateResult.date.getTime())} hint="JS Date.getTime()" />
                    <StatTile label="ISO 8601 (UTC)" value={<span className="break-all text-[12px]">{dateResult.date.toISOString()}</span>} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton value={String(Math.floor(dateResult.date.getTime() / 1000))} label="Copy seconds" copiedLabel="Copied" />
                    <CopyButton value={String(dateResult.date.getTime())} label="Copy milliseconds" copiedLabel="Copied" />
                  </div>
                </>
              )
            )}
          </>
        )}

        <Note tone="info">
          Unix time is seconds since 1 January 1970 at 00:00 UTC and has no time zone of its own.
          Current timestamps have 10 digits in seconds or 13 in milliseconds. Auto-detect uses that
          magnitude rule.
        </Note>
      </div>
    </Workspace>
  );
}
