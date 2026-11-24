import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, Select, StatTile, Toggle, Workspace } from "@/components/ui";
import { downloadText, flatten, parseCsv, rowsToObjects, toCsv } from "@/lib/csv";
import { formatNumber, parseNumeric } from "@/lib/utils";

function FileDrop({ accept, label, onText, onFile, testId }: { accept: string; label: string; onText?: (text: string, name: string) => void; onFile?: (file: File) => void; testId?: string }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  async function handle(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError("");
    if (file.size > 15 * 1024 * 1024) { setError("Files up to 15 MB are supported."); return; }
    if (onFile) { onFile(file); return; }
    try { onText?.(await file.text(), file.name); } catch { setError("The file could not be read as text."); }
  }
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => { event.preventDefault(); setActive(false); void handle([...event.dataTransfer.files]); }}
      className={`rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${active ? "border-brand-400/60 bg-brand-400/[0.07]" : "border-white/[0.12] bg-white/[0.015]"}`}
    >
      <span className="mx-auto grid size-10 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.07] text-brand-300"><Icon name="fileText" size={19} /></span>
      <p className="mt-2 text-[13px] font-semibold text-mist-100">{label}</p>
      <p className="mt-1 text-[11px] text-mist-500">Drop a file or choose one. Read locally; nothing is uploaded.</p>
      <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-brand-400 px-3.5 text-[12px] font-bold text-ink-950 hover:bg-brand-300">
        <Icon name="plus" size={14} /> Choose file
        <input data-testid={testId} type="file" accept={accept} className="sr-only" onChange={(event) => { void handle([...event.target.files ?? []]); event.target.value = ""; }} />
      </label>
      {error && <p className="mt-2 text-[11.5px] text-rose-300">{error}</p>}
    </div>
  );
}

/* ------------------------------ CSV ↔ JSON ------------------------------- */

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [typed, setTyped] = useState(true);
  const [fileName, setFileName] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "", warnings: [] as string[] };
    try {
      if (direction === "csv-to-json") {
        const parsed = parseCsv(input, delimiter || undefined);
        if (!parsed.ok) return { output: "", error: parsed.error, warnings: [] };
        const objects = rowsToObjects(parsed.rows);
        const typedObjects = typed
          ? objects.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
              if (value === "") return [key, null];
              if (/^-?\d+(\.\d+)?$/.test(value)) return [key, Number(value)];
              if (/^(true|false)$/i.test(value)) return [key, value.toLowerCase() === "true"];
              return [key, value];
            })))
          : objects;
        return { output: JSON.stringify(typedObjects, null, 2), error: "", warnings: parsed.errors };
      }
      const parsed = JSON.parse(input) as unknown;
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const records = list.map((entry) => flatten(entry));
      const header = [...new Set(records.flatMap((record) => Object.keys(record)))];
      const rows = [header, ...records.map((record) => header.map((key) => record[key] ?? ""))];
      return { output: toCsv(rows, delimiter || ","), error: "", warnings: [] };
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : "Invalid JSON.", warnings: [] };
    }
  }, [input, direction, delimiter, typed]);

  return (
    <Workspace slug="csv-json-converter">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["csv-to-json", "json-to-csv"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setDirection(value)} aria-pressed={direction === value} className={direction === value ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] text-mist-400"}>
              {value === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
            </button>
          ))}
          <div className="ml-auto w-[150px]">
            <Select value={delimiter} onChange={(event) => setDelimiter(event.target.value)} aria-label="Delimiter" options={[{ value: "", label: "Auto delimiter" }, { value: ",", label: "Comma" }, { value: ";", label: "Semicolon" }, { value: "\t", label: "Tab" }, { value: "|", label: "Pipe" }]} />
          </div>
        </div>
        <FileDrop accept=".csv,.json,text/csv,application/json" label={direction === "csv-to-json" ? "Drop a CSV file" : "Drop a JSON file"} onText={(text, name) => { setInput(text); setFileName(name); }} testId="csv-json-file" />
        {fileName && <p className="font-mono text-[10px] text-mist-500">Loaded: {fileName}</p>}
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Input" htmlFor="csv-json-input"><textarea id="csv-json-input" value={input} onChange={(event) => setInput(event.target.value)} rows={12} spellCheck={false} placeholder={direction === "csv-to-json" ? "name,age\nAda,36" : '[{"name":"Ada","age":36}]'} className="field-input min-h-[240px] resize-y font-mono text-[11.5px]" /></Field>
          <Field label="Output" htmlFor="csv-json-output" error={result.error}><textarea id="csv-json-output" value={result.output} readOnly rows={12} className="field-input min-h-[240px] resize-y bg-ink-950/50 font-mono text-[11.5px]" /></Field>
        </div>
        {direction === "csv-to-json" && <Toggle label="Detect numbers and booleans" description="Off keeps every value as a string" checked={typed} onChange={setTyped} />}
        {result.warnings.length > 0 && <Note tone="warn" title="Data warnings"><ul className="space-y-1">{result.warnings.slice(0, 8).map((warning) => <li key={warning}>• {warning}</li>)}</ul></Note>}
        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy output" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" disabled={!result.output} onClick={() => downloadText(result.output, direction === "csv-to-json" ? "toolora-data.json" : "toolora-data.csv", direction === "csv-to-json" ? "application/json" : "text/csv")}><Icon name="download" size={13} /> Download {direction === "csv-to-json" ? ".json" : ".csv"}</Button>
          <span className="ml-auto font-mono text-[9.5px] text-mist-600">{(result.output.match(/\n/g)?.length ?? 0) + (result.output ? 1 : 0)} output lines</span>
        </div>
      </div>
    </Workspace>
  );
}

/* ------------------------------- JSON ↔ XML ------------------------------ */

function jsonToXml(value: unknown, name = "root", depth = 0): string {
  const indent = "  ".repeat(depth);
  if (value === null || value === undefined) return `${indent}<${name}/>`;
  if (Array.isArray(value)) return value.map((entry) => jsonToXml(entry, "item", depth)).join("\n");
  if (typeof value === "object") {
    const children = Object.entries(value as Record<string, unknown>).map(([key, child]) => {
      const safe = key.replace(/[^\w.-]/g, "_");
      return jsonToXml(child, /^[A-Za-z_]/.test(safe) ? safe : `_${safe}`, depth + 1);
    }).join("\n");
    return `${indent}<${name}>\n${children}\n${indent}</${name}>`;
  }
  const text = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `${indent}<${name}>${text}</${name}>`;
}

function xmlToJson(node: Element): unknown {
  const result: Record<string, unknown> = {};
  for (const attribute of [...node.attributes]) result[`@${attribute.name}`] = attribute.value;
  const children = [...node.children];
  const text = [...node.childNodes].filter((child) => child.nodeType === 3).map((child) => child.textContent ?? "").join("").trim();
  if (children.length === 0) return Object.keys(result).length ? { ...result, "#text": text } : text;
  const grouped: Record<string, unknown[]> = {};
  for (const child of children) {
    const name = child.nodeName;
    (grouped[name] ??= []).push(xmlToJson(child));
  }
  for (const [name, values] of Object.entries(grouped)) result[name] = values.length === 1 ? values[0] : values;
  if (text && Object.keys(result).length === 0) return text;
  return result;
}

export function JsonXmlConverter() {
  const [direction, setDirection] = useState<"json-to-xml" | "xml-to-json">("json-to-xml");
  const [input, setInput] = useState("");
  const [root, setRoot] = useState("root");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (direction === "json-to-xml") {
        const parsed = JSON.parse(input) as unknown;
        return { output: `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parsed, root.trim() || "root")}`, error: "" };
      }
      const document = new DOMParser().parseFromString(input, "application/xml");
      if (document.querySelector("parsererror")) return { output: "", error: "The XML is not well-formed. Check unclosed tags, attributes and entities." };
      return { output: JSON.stringify(xmlToJson(document.documentElement), null, 2), error: "" };
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : "Conversion failed." };
    }
  }, [input, direction, root]);

  return (
    <Workspace slug="json-xml-converter">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["json-to-xml", "xml-to-json"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setDirection(value)} aria-pressed={direction === value} className={direction === value ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] text-mist-400"}>
              {value === "json-to-xml" ? "JSON → XML" : "XML → JSON"}
            </button>
          ))}
          {direction === "json-to-xml" && <div className="ml-auto w-[160px]"><Field label="Root element" htmlFor="xml-root"><Input id="xml-root" value={root} onChange={(event) => setRoot(event.target.value.replace(/[^\w.-]/g, ""))} className="h-9 font-mono text-[12px]" /></Field></div>}
        </div>
        <FileDrop accept=".json,.xml,application/json,application/xml,text/xml" label={direction === "json-to-xml" ? "Drop a JSON file" : "Drop an XML file"} onText={(text) => setInput(text)} testId="json-xml-file" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Input" htmlFor="json-xml-input"><textarea id="json-xml-input" value={input} onChange={(event) => setInput(event.target.value)} rows={12} spellCheck={false} className="field-input min-h-[240px] resize-y font-mono text-[11.5px]" placeholder={direction === "json-to-xml" ? '{"user":{"name":"Ada"}}' : '<user><name>Ada</name></user>'} /></Field>
          <Field label="Output" htmlFor="json-xml-output" error={result.error}><textarea id="json-xml-output" value={result.output} readOnly rows={12} className="field-input min-h-[240px] resize-y bg-ink-950/50 font-mono text-[11.5px]" /></Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy output" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" disabled={!result.output} onClick={() => downloadText(result.output, direction === "json-to-xml" ? "toolora-data.xml" : "toolora-data.json")}><Icon name="download" size={13} /> Download</Button>
        </div>
        <Note tone="info">XML attributes become keys prefixed with @. Arrays use &lt;item&gt; elements. Comments, processing instructions and mixed content have no JSON equivalent and are not preserved.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ CSV viewer/editor ------------------------ */

export function CsvViewerEditor() {
  const [text, setText] = useState("name,role,city\nAda,Engineer,Warsaw\nGrace,Admiral,New York\nAlan,Mathematician,London");
  const [rows, setRows] = useState<string[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");

  function load() {
    const parsed = parseCsv(text);
    if (!parsed.ok) { setErrors([parsed.error]); setRows([]); return; }
    setRows(parsed.rows); setErrors(parsed.errors); setStatus(`${parsed.rows.length} rows × ${parsed.rows[0]?.length ?? 0} columns`);
  }

  useEffect(() => { load(); /* initial sample */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(rowIndex: number, colIndex: number, value: string) {
    setRows((current) => current.map((row, r) => r === rowIndex ? row.map((cell, c) => c === colIndex ? value : cell) : row));
  }

  const preview = useMemo(() => (rows.length ? toCsv(rows) : ""), [rows]);
  const width = rows[0]?.length ?? 0;

  return (
    <Workspace slug="csv-viewer-editor">
      <div className="space-y-4">
        <Field label="Paste CSV" htmlFor="csv-editor-raw" hint="or drop a file below"><textarea id="csv-editor-raw" value={text} onChange={(event) => setText(event.target.value)} rows={4} className="field-input resize-y font-mono text-[11.5px]" /></Field>
        <FileDrop accept=".csv,text/csv" label="Drop a CSV file" onText={(content, fileName) => { setText(content); setName(fileName); }} testId="csv-editor-file" />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={load}><Icon name="refresh" size={14} /> Parse & view</Button>
          {name && <span className="font-mono text-[10px] text-mist-500">{name}</span>}
          {status && <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{status}</span>}
        </div>
        {errors.length > 0 && <Note tone="warn" title="CSV warnings"><ul className="space-y-1">{errors.slice(0, 6).map((error) => <li key={error}>• {error}</li>)}</ul></Note>}
        {rows.length > 0 && (
          <>
            <div className="max-h-[420px] overflow-auto rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[560px] border-collapse text-left text-[11.5px]">
                <thead className="sticky top-0 bg-ink-850">
                  <tr>{rows[0].map((header, index) => <th key={index} className="border-b border-white/[0.08] px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-mist-400">{header || `col ${index + 1}`}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(1, 301).map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-white/[0.012]">
                      {Array.from({ length: width }, (_, colIndex) => (
                        <td key={colIndex} className="border-b border-white/[0.04] p-0">
                          <input value={row[colIndex] ?? ""} onChange={(event) => update(rowIndex + 1, colIndex, event.target.value)} aria-label={`Row ${rowIndex + 2}, column ${colIndex + 1}`} className="w-full min-w-[90px] bg-transparent px-2 py-1.5 text-mist-200 outline-none focus:bg-brand-400/10" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 301 && <p className="text-[10.5px] text-mist-500">Editing the first 300 data rows; export includes every parsed row.</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setRows((current) => [...current, Array.from({ length: width }, () => "")]); }}><Icon name="plus" size={13} /> Add row</Button>
              <Button variant="secondary" size="sm" onClick={() => { setRows((current) => [...current, ...rows.slice(1).map(() => Array.from({ length: width }, () => ""))].slice(0, current.length + 1)); }}>Duplicate first row</Button>
              <Button variant="ghost" size="sm" onClick={() => setRows((current) => current.slice(0, Math.max(1, current.length - 1)))}><Icon name="minus" size={13} /> Remove last row</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={preview} label="Copy CSV" copiedLabel="Copied" />
              <Button variant="primary" size="sm" onClick={() => downloadText(preview, "toolora-edited.csv", "text/csv")}><Icon name="download" size={13} /> Download CSV</Button>
              <span className="ml-auto font-mono text-[9.5px] text-mist-600">{(preview.length / 1024).toFixed(1)} KB</span>
            </div>
          </>
        )}
        <Note tone="info">Values are treated as text; spreadsheet formulas are not executed. Very large files are capped for editing so the page stays responsive.</Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------- CSV sorter/dedupe ------------------------- */

export function CsvColumnSorter() {
  const [text, setText] = useState("name,score\nAda,90\nGrace,72\nAlan,90\nEdsger,66");
  const [column, setColumn] = useState("0");
  const [descending, setDescending] = useState(false);
  const [numeric, setNumeric] = useState(true);

  const parsed = useMemo(() => parseCsv(text), [text]);
  const sorted = useMemo(() => {
    if (!parsed.ok) return "";
    const [header, ...rows] = parsed.rows;
    const index = Math.min(Number(column) || 0, header.length - 1);
    const compared = [...rows].sort((a, b) => {
      const left = a[index] ?? "";
      const right = b[index] ?? "";
      const comparison = numeric && Number.isFinite(Number(left)) && Number.isFinite(Number(right)) && left !== "" && right !== ""
        ? Number(left) - Number(right)
        : left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });
      return descending ? -comparison : comparison;
    });
    return toCsv([header, ...compared]);
  }, [parsed, column, descending, numeric]);

  return (
    <Workspace slug="csv-column-sorter">
      <div className="space-y-4">
        <FileDrop accept=".csv,text/csv" label="Drop a CSV file" onText={(content) => setText(content)} testId="csv-sort-file" />
        <Field label="CSV data" htmlFor="csv-sort-input"><textarea id="csv-sort-input" value={text} onChange={(event) => setText(event.target.value)} rows={7} className="field-input resize-y font-mono text-[11.5px]" /></Field>
        {!parsed.ok ? <Note tone="warn">{parsed.error}</Note> : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Sort by column" htmlFor="csv-sort-column"><Select id="csv-sort-column" value={column} onChange={(event) => setColumn(event.target.value)} options={parsed.rows[0].map((header, index) => ({ value: String(index), label: header || `Column ${index + 1}` }))} /></Field>
              <Field label="Direction" htmlFor="csv-sort-direction"><Select id="csv-sort-direction" value={descending ? "desc" : "asc"} onChange={(event) => setDescending(event.target.value === "desc")} options={[{ value: "asc", label: "Ascending" }, { value: "desc", label: "Descending" }]} /></Field>
              <div className="flex items-end"><Toggle label="Numeric comparison" description="2 before 10" checked={numeric} onChange={setNumeric} /></div>
            </div>
            {parsed.errors.length > 0 && <Note tone="warn">{parsed.errors[0]}</Note>}
            <textarea readOnly value={sorted} rows={8} aria-label="Sorted CSV output" className="field-input resize-y bg-ink-950/50 font-mono text-[11.5px]" />
            <div className="flex gap-2"><CopyButton value={sorted} label="Copy sorted CSV" copiedLabel="Copied" /><Button variant="secondary" size="sm" onClick={() => downloadText(sorted, "toolora-sorted.csv", "text/csv")}><Icon name="download" size={13} /> Download</Button></div>
          </>
        )}
      </div>
    </Workspace>
  );
}

export function CsvDuplicateRemover() {
  const [text, setText] = useState("email,name\nada@example.com,Ada\ngrace@example.com,Grace\nada@example.com,Ada");
  const [keyIndex, setKeyIndex] = useState("0");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const parsed = useMemo(() => parseCsv(text), [text]);
  const result = useMemo(() => {
    if (!parsed.ok) return { rows: [] as string[][], removed: 0, output: "" };
    const index = Math.min(Number(keyIndex) || 0, (parsed.rows[0]?.length ?? 1) - 1);
    const seen = new Set<string>();
    const kept = [parsed.rows[0]];
    let removed = 0;
    for (const row of parsed.rows.slice(1)) {
      const raw = (row[index] ?? "").trim();
      const key = ignoreCase ? raw.toLowerCase() : raw;
      if (seen.has(key)) { removed += 1; continue; }
      seen.add(key); kept.push(row);
    }
    return { rows: kept, removed, output: toCsv(kept) };
  }, [parsed, keyIndex, ignoreCase]);

  return (
    <Workspace slug="csv-duplicate-remover">
      <div className="space-y-4">
        <FileDrop accept=".csv,text/csv" label="Drop a CSV file" onText={(content) => setText(content)} testId="csv-dedupe-file" />
        <Field label="CSV data" htmlFor="csv-dedupe-input"><textarea id="csv-dedupe-input" value={text} onChange={(event) => setText(event.target.value)} rows={7} className="field-input resize-y font-mono text-[11.5px]" /></Field>
        {!parsed.ok ? <Note tone="warn">{parsed.error}</Note> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Compare by" htmlFor="csv-dedupe-key"><Select id="csv-dedupe-key" value={keyIndex} onChange={(event) => setKeyIndex(event.target.value)} options={[{ value: "-1", label: "Whole row" }, ...parsed.rows[0].map((header, index) => ({ value: String(index), label: header || `Column ${index + 1}` }))]} /></Field>
              <div className="flex items-end"><Toggle label="Ignore letter case" checked={ignoreCase} onChange={setIgnoreCase} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile label="Rows kept" value={String(Math.max(0, result.rows.length - 1))} />
              <StatTile label="Duplicates removed" value={<span className="text-brand-300">{result.removed}</span>} />
              <StatTile label="Columns" value={String(parsed.rows[0]?.length ?? 0)} />
            </div>
            <textarea readOnly value={result.output} rows={7} aria-label="CSV without duplicates" className="field-input resize-y bg-ink-950/50 font-mono text-[11.5px]" />
            <div className="flex gap-2"><CopyButton value={result.output} label="Copy cleaned CSV" copiedLabel="Copied" /><Button variant="secondary" size="sm" onClick={() => downloadText(result.output, "toolora-deduplicated.csv", "text/csv")}><Icon name="download" size={13} /> Download</Button></div>
          </>
        )}
      </div>
    </Workspace>
  );
}

/* ------------------------------- XLSX preview ---------------------------- */

export function XlsxPreview() {
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[]>([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handle(file: File) {
    setError(""); setSheets([]); setStatus("loading"); setFileName(file.name);
    if (file.size > 12 * 1024 * 1024) { setError("Workbooks up to 12 MB are supported in the browser preview."); setStatus("idle"); return; }
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, dense: true });
      const parsed = workbook.SheetNames.slice(0, 12).map((name) => {
        const sheet = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: false, defval: "" });
        return { name, rows: rows.slice(0, 2000).map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [])) };
      }).filter((sheet) => sheet.rows.length > 0);
      if (parsed.length === 0) { setError("No worksheet data was found in this workbook."); setStatus("idle"); return; }
      setSheets(parsed); setActive(0); setStatus("ready");
    } catch {
      setError("This workbook could not be read. Password-protected, corrupt or unusual formats are not supported.");
      setStatus("idle");
    }
  }

  const sheet = sheets[active];
  const width = Math.min(sheet?.rows[0]?.length ?? 0, 30);
  return (
    <Workspace slug="xlsx-preview">
      <div className="space-y-4">
        <FileDrop accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" label="Preview an Excel workbook" onFile={(file) => void handle(file)} testId="xlsx-file" />
        {fileName && <p className="font-mono text-[10px] text-mist-500">{fileName}</p>}
        {status === "loading" && <p className="text-[12px] text-mist-400">Reading workbook… the spreadsheet library is loaded only when needed.</p>}
        {error && <Note tone="warn">{error}</Note>}
        {sheets.length > 0 && sheet && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {sheets.map((option, index) => <button key={option.name} type="button" onClick={() => setActive(index)} aria-pressed={index === active} className={index === active ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[11.5px] text-mist-400"}>{option.name}</button>)}
            </div>
            <div className="max-h-[440px] overflow-auto rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[520px] border-collapse text-left text-[11px]">
                <tbody>
                  {sheet.rows.slice(0, 400).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? "bg-white/[0.04]" : "odd:bg-white/[0.012]"}>
                      {Array.from({ length: width }, (_, colIndex) => (
                        <td key={colIndex} className="border-b border-white/[0.04] px-2 py-1.5 text-mist-300">{row[colIndex] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatTile label="Rows shown" value={String(Math.min(sheet.rows.length, 400))} />
              <StatTile label="Columns" value={String(width)} />
              <CopyButton value={toCsv(sheet.rows.slice(0, 500).map((row) => Array.from({ length: width }, (_, index) => row[index] ?? "")))} label="Copy as CSV" copiedLabel="Copied" />
              <Button variant="secondary" size="sm" onClick={() => downloadText(toCsv(sheet.rows.slice(0, 500).map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""))), "toolora-sheet.csv", "text/csv")}><Icon name="download" size={13} /> Download visible rows</Button>
            </div>
            <Note tone="info">This is a value preview: formulas are not recalculated, and charts, images, macros and most cell formatting are not shown. Multi-sheet workbooks are limited to the first 12 sheets.</Note>
          </>
        )}
      </div>
    </Workspace>
  );
}

/* ----------------------------- file size converter ----------------------- */

const SIZE_UNITS = [
  { id: "B", label: "Bytes (B)", factor: 1 },
  { id: "kB", label: "Kilobytes (kB, decimal)", factor: 1000 },
  { id: "MB", label: "Megabytes (MB, decimal)", factor: 1000 ** 2 },
  { id: "GB", label: "Gigabytes (GB, decimal)", factor: 1000 ** 3 },
  { id: "TB", label: "Terabytes (TB, decimal)", factor: 1000 ** 4 },
  { id: "KiB", label: "Kibibytes (KiB, binary)", factor: 1024 },
  { id: "MiB", label: "Mebibytes (MiB, binary)", factor: 1024 ** 2 },
  { id: "GiB", label: "Gibibytes (GiB, binary)", factor: 1024 ** 3 },
  { id: "TiB", label: "Tebibytes (TiB, binary)", factor: 1024 ** 4 },
];

export function FileSizeConverter() {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("GB");
  const numeric = parseNumeric(value);
  const unitFactor = SIZE_UNITS.find((entry) => entry.id === unit)?.factor ?? 1;
  const bytes = Number.isFinite(numeric) && numeric >= 0 ? numeric * unitFactor : Number.NaN;

  return (
    <Workspace slug="file-size-converter">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Value" htmlFor="size-value"><Input id="size-value" type="number" min={0} step="any" value={value} onChange={(event) => setValue(event.target.value)} className="font-mono" /></Field>
          <Field label="Unit" htmlFor="size-unit"><Select id="size-unit" value={unit} onChange={(event) => setUnit(event.target.value)} options={SIZE_UNITS.map((entry) => ({ value: entry.id, label: entry.label }))} /></Field>
        </div>
        {!Number.isFinite(bytes) || bytes < 0 ? <Note tone="warn">Enter a non-negative number.</Note> : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Bytes" value={formatNumber(bytes, 0)} />
              <StatTile label="Decimal MB" value={formatNumber(bytes / 1000 ** 2, 4)} />
              <StatTile label="Binary MiB" value={formatNumber(bytes / 1024 ** 2, 4)} />
              <StatTile label="GB (decimal)" value={formatNumber(bytes / 1000 ** 3, 4)} />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              {SIZE_UNITS.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-3 py-2 text-[11.5px] last:border-b-0">
                  <span className="text-mist-500">{entry.label}</span>
                  <span className="font-mono text-mist-200">{formatNumber(bytes / entry.factor, 6)}</span>
                </div>
              ))}
            </div>
            <CopyButton value={`${value} ${unit} = ${formatNumber(bytes, 0)} bytes = ${formatNumber(bytes / 1024 ** 2, 2)} MiB = ${formatNumber(bytes / 1000 ** 2, 2)} MB`} label="Copy conversion" copiedLabel="Copied" />
          </>
        )}
        <Note tone="info">Decimal units use powers of 1000; binary units (KiB, MiB, GiB) use powers of 1024. Operating systems often display binary values with decimal-looking labels, which explains apparent capacity differences.</Note>
      </div>
    </Workspace>
  );
}
