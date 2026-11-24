import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Note,
  Slider,
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { downloadFile, formatNumber } from "@/lib/utils";

function byteSize(value: string): string {
  const bytes = new Blob([value]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ---------------------------------- shared -------------------------------- */

function EditorPair({
  inputId,
  outputId,
  input,
  output,
  onInput,
  placeholder,
  language,
}: {
  inputId: string;
  outputId: string;
  input: string;
  output: string;
  onInput: (value: string) => void;
  placeholder: string;
  language: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor={inputId} className="text-[13px] font-semibold text-mist-200">Input</label>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">{byteSize(input)}</span>
        </div>
        <textarea id={inputId} value={input} onChange={(event) => onInput(event.target.value)} rows={16} spellCheck={false} placeholder={placeholder} className="field-input min-h-[320px] resize-y bg-ink-950/40 font-mono text-[11.5px] leading-relaxed" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor={outputId} className="text-[13px] font-semibold text-mist-200">Output</label>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-brand-300/80">{language} · {byteSize(output)}</span>
        </div>
        <textarea id={outputId} value={output} readOnly rows={16} spellCheck={false} placeholder="Formatted output appears here." className="field-input min-h-[320px] resize-y bg-ink-950/60 font-mono text-[11.5px] leading-relaxed" />
      </div>
    </div>
  );
}

/* ------------------------------- HTML formatter ---------------------------- */

const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW_ELEMENTS = new Set(["script", "style", "pre", "textarea"]);

type HtmlToken = { type: "open" | "close" | "comment" | "doctype" | "text" | "raw" | "self"; value: string; name: string };

function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  const pattern = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\?[\s\S]*?\?>|<\/?[a-zA-Z][^>]*>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = html.slice(cursor, match.index);
    if (text.trim()) tokens.push({ type: "text", value: text.trim().replace(/\s+/g, " "), name: "" });
    cursor = match.index + match[0].length;
    const raw = match[0];
    if (raw.startsWith("<!--")) { tokens.push({ type: "comment", value: raw, name: "" }); continue; }
    if (/^<!DOCTYPE/i.test(raw)) { tokens.push({ type: "doctype", value: raw, name: "" }); continue; }
    if (raw.startsWith("<?") || raw.startsWith("<!")) { tokens.push({ type: "doctype", value: raw, name: "" }); continue; }
    const closing = /^<\//.test(raw);
    const nameMatch = /^<\/?\s*([a-zA-Z][\w:-]*)/.exec(raw);
    const name = nameMatch?.[1]?.toLowerCase() ?? "";
    const selfClosing = /\/>$/.test(raw) || VOID_ELEMENTS.has(name);
    if (closing) { tokens.push({ type: "close", value: raw, name }); continue; }
    if (RAW_ELEMENTS.has(name) && !selfClosing) {
      const endPattern = new RegExp(`</${name}\\s*>`, "i");
      const rest = html.slice(cursor);
      const end = endPattern.exec(rest);
      if (end) {
        const content = rest.slice(0, end.index);
        tokens.push({ type: "open", value: raw, name });
        tokens.push({ type: "raw", value: content.trim(), name });
        tokens.push({ type: "close", value: end[0], name });
        cursor += end.index + end[0].length;
        pattern.lastIndex = cursor;
      } else {
        tokens.push({ type: "open", value: raw, name });
      }
      continue;
    }
    tokens.push({ type: selfClosing ? "self" : "open", value: raw, name });
  }
  const tail = html.slice(cursor);
  if (tail.trim()) tokens.push({ type: "text", value: tail.trim().replace(/\s+/g, " "), name: "" });
  return tokens;
}

function formatHtml(html: string, indentSize: number, keepInline: boolean): { output: string; problems: string[] } {
  const tokens = tokenizeHtml(html);
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  const stack: string[] = [];
  const problems: string[] = [];
  let depth = 0;
  const inlineTags = new Set(["a", "strong", "em", "b", "i", "span", "code", "small", "label", "button"]);

  tokens.forEach((token) => {
    if (token.type === "close") {
      const index = stack.lastIndexOf(token.name);
      if (index === -1) {
        problems.push(`Unexpected closing tag </${token.name}> — no matching opening tag.`);
        lines.push(`${indent.repeat(Math.max(0, depth))}${token.value}`);
        return;
      }
      if (index !== stack.length - 1) {
        problems.push(`</${token.name}> closes while <${stack[stack.length - 1]}> is still open.`);
        stack.length = index + 1;
      }
      stack.pop();
      depth = Math.max(0, depth - 1);
      lines.push(`${indent.repeat(depth)}${token.value}`);
      return;
    }
    if (token.type === "raw") {
      lines.push(`${indent.repeat(depth)}${token.value}`);
      return;
    }
    if (token.type === "text") {
      lines.push(`${indent.repeat(depth)}${token.value}`);
      return;
    }
    lines.push(`${indent.repeat(depth)}${token.value}`);
    if (token.type === "open" && !(keepInline && inlineTags.has(token.name))) {
      stack.push(token.name);
      depth += 1;
    } else if (token.type === "open") {
      // inline tag left open at this level — still track for the next close
      stack.push(token.name);
      depth += 1;
    }
  });

  if (stack.length > 0) {
    problems.push(`Unclosed tag${stack.length > 1 ? "s" : ""}: ${stack.map((name) => `<${name}>`).join(", ")}.`);
  }

  return { output: lines.join("\n"), problems };
}

export function HtmlFormatter() {
  const [input, setInput] = useState("<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\"><title>Toolora</title></head>\n<body><h1>Free tools</h1><p>Built for <strong>everyday</strong> tasks.</p></body>\n</html>");
  const [indentSize, setIndentSize] = useState(2);
  const [keepInline, setKeepInline] = useState(true);
  const [minify, setMinify] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", problems: [] as string[] };
    if (minify) {
      return { output: input.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim(), problems: [] as string[] };
    }
    return formatHtml(input, indentSize, keepInline);
  }, [input, indentSize, keepInline, minify]);

  return (
    <Workspace slug="html-formatter">
      <div className="space-y-5">
        <EditorPair inputId="html-input" outputId="html-output" input={input} onInput={setInput} output={result.output} placeholder="<div><p>Paste HTML here</p></div>" language={minify ? "minified html" : "formatted html"} />

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Slider label="Indentation" value={indentSize} min={2} max={8} step={2} onChange={setIndentSize} suffix="spaces" />
          <div className="grid gap-2">
            <Toggle label="Keep inline elements together" description="Shortens output for spans, links and emphasis" checked={keepInline} onChange={setKeepInline} />
            <Toggle label="Minify instead" description="Remove comments and collapse whitespace" checked={minify} onChange={setMinify} />
          </div>
        </div>

        {result.problems.length > 0 && (
          <Note tone="warn" title="Possible markup problems">
            <ul className="mt-1 space-y-1">
              {result.problems.map((problem) => <li key={problem}>• {problem}</li>)}
            </ul>
          </Note>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Input" value={byteSize(input)} />
          <StatTile label="Output" value={byteSize(result.output)} />
          <StatTile label="Lines" value={formatNumber(result.output.split("\n").length)} />
          <StatTile label="Warnings" value={String(result.problems.length)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy HTML" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => downloadFile(result.output, "toolora-formatted.html", "text/html")} disabled={!result.output}>
            <Icon name="download" size={14} /> Download .html
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>

        <Note tone="info">
          The formatter is a structural helper, not an HTML validator. It reports mismatched tags it can
          see, but it does not check attribute rules, document validity or browser error recovery.
          Content inside script, style, pre and textarea is preserved rather than reformatted.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- XML formatter --------------------------- */

export function XmlFormatter() {
  const [input, setInput] = useState('<?xml version="1.0" encoding="UTF-8"?>\n<catalog><tool id="1"><name>JSON formatter</name><free>true</free></tool><tool id="2"><name>PDF merge</name><free>true</free></tool></catalog>');
  const [indentSize, setIndentSize] = useState(2);

  const result = useMemo(() => {
    const text = input.trim();
    if (!text) return { output: "", problem: "" };
    if (typeof DOMParser === "undefined") return { output: "", problem: "XML validation requires a browser DOM." };
    const document = new DOMParser().parseFromString(text, "application/xml");
    const error = document.querySelector("parsererror");
    if (error) {
      const message = error.textContent?.replace(/\s+/g, " ").trim() ?? "XML is not well-formed.";
      return { output: "", problem: message.slice(0, 240) };
    }
    const tokens = text.split(/(<[^>]+>)/g).filter((part) => part !== "");
    const indent = " ".repeat(indentSize);
    let depth = 0;
    const lines: string[] = [];
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (/^<\/[\w:.-]+\s*>$/.test(token)) {
        depth = Math.max(0, depth - 1);
        lines.push(indent.repeat(depth) + token.trim());
      } else if (/^<[^!?/][^>]*\/>$/.test(token) || /^<\?/.test(token) || /^<!/.test(token)) {
        lines.push(indent.repeat(depth) + token.trim());
      } else if (/^<[^!?/]/.test(token)) {
        const open = token;
        const next = tokens[index + 1];
        if (next && !next.startsWith("<")) {
          lines.push(indent.repeat(depth) + open.trim() + next.trim() + (tokens[index + 2]?.startsWith("</") ? tokens[index + 2].trim() : ""));
          if (tokens[index + 2]?.startsWith("</")) index += 2;
          else index += 1;
        } else {
          lines.push(indent.repeat(depth) + open.trim());
          depth += 1;
        }
      } else {
        const content = token.trim();
        if (content) lines.push(indent.repeat(depth) + content);
      }
    }
    return { output: lines.join("\n"), problem: "" };
  }, [input, indentSize]);

  return (
    <Workspace slug="xml-formatter">
      <div className="space-y-5">
        <EditorPair inputId="xml-input" outputId="xml-output" input={input} onInput={setInput} output={result.problem ? "" : result.output} placeholder={`<?xml version="1.0"?><root><item>value</item></root>`} language="formatted xml" />
        <Slider label="Indentation" value={indentSize} min={2} max={8} step={2} onChange={setIndentSize} suffix="spaces" />
        {result.problem && <Note tone="warn" title="XML is not well-formed">{result.problem}</Note>}
        {!result.problem && input.trim() && <Note tone="brand">Well-formed XML — open and closing tags balance, and the document parsed successfully.</Note>}
        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy XML" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => downloadFile(result.output, "toolora-formatted.xml", "application/xml")} disabled={!result.output}>
            <Icon name="download" size={14} /> Download .xml
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>
        <Note tone="info">
          Validation uses the browser's native XML parser, so entity and namespace rules follow the XML
          specification. Formatting preserves elements, attributes and text; CDATA, comments and
          processing instructions are kept as single lines. Nothing is uploaded.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- SQL formatter --------------------------- */

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "JOIN", "ON",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
  "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "UNIQUE", "PRIMARY", "KEY", "FOREIGN",
  "REFERENCES", "AS", "CASE", "WHEN", "THEN", "ELSE", "END", "UNION", "ALL", "DISTINCT", "WITH",
  "NULL", "IS", "LIKE", "BETWEEN", "ASC", "DESC", "EXISTS", "RETURNING",
]);

const SQL_NEWLINE_BEFORE = new Set([
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INNER JOIN",
  "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "JOIN", "UNION", "UNION ALL", "INSERT INTO", "VALUES",
  "UPDATE", "SET", "DELETE FROM", "WITH",
]);

function formatSql(sql: string, uppercase: boolean, indentSize: number): string {
  const tokens = sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .match(/'(?:''|[^'])*'|"(?:[^"]|"")*"|`[^`]*`|\w+|\s+|./g) ?? [];
  const lines: string[] = [];
  let current = "";
  let depth = 0;

  function flush() {
    const trimmed = current.trim();
    if (trimmed) lines.push(`${" ".repeat(depth * indentSize)}${trimmed}`);
    current = "";
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^\s+$/.test(token)) continue;
    const upper = token.toUpperCase();
    const next = tokens.slice(index + 1).find((item) => !/^\s+$/.test(item))?.toUpperCase() ?? "";
    const keyword = SQL_KEYWORDS.has(upper);
    const rendered = keyword && uppercase ? upper : token;

    if (token === "(") { current += `${current.endsWith(" ") || !current ? "" : " "}(${current ? "" : ""}`; depth += 1; continue; }
    if (token === ")") { depth = Math.max(0, depth - 1); current = current.trimEnd() + ") "; continue; }

    if (keyword && next && SQL_KEYWORDS.has(next) === false && ["SELECT"].includes(upper)) {
      // handled as normal keyword below
    }

    if (keyword && (SQL_NEWLINE_BEFORE.has(upper) || (upper === "AND" || upper === "OR"))) {
      flush();
      current = rendered;
      if (upper === "SELECT") current += " ";
      continue;
    }

    if (token === ";") { current += ";"; flush(); continue; }
    if (token === ",") { current = `${current.trimEnd()},`; flush(); continue; }

    if (keyword && ["AND", "OR"].includes(upper)) {
      flush();
      current = `${rendered} `;
      continue;
    }
    current += `${current && !current.endsWith(" ") ? " " : ""}${rendered}`;
  }
  flush();
  return lines.join("\n");
}

export function SqlFormatter() {
  const [input, setInput] = useState("select t.id, t.name, count(u.id) as uses from tools t left join usage u on u.tool_id = t.id where t.enabled = true and t.category = 'developer' group by t.id, t.name order by uses desc limit 10;");
  const [uppercase, setUppercase] = useState(true);
  const [indentSize, setIndentSize] = useState(2);

  const output = useMemo(() => (input.trim() ? formatSql(input, uppercase, indentSize) : ""), [input, uppercase, indentSize]);

  return (
    <Workspace slug="sql-formatter">
      <div className="space-y-5">
        <EditorPair inputId="sql-input" outputId="sql-output" input={input} onInput={setInput} output={output} placeholder="select * from tools where enabled = true;" language="formatted sql" />
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Slider label="Indentation" value={indentSize} min={2} max={8} step={2} onChange={setIndentSize} suffix="spaces" />
          <div className="flex items-end"><Toggle label="Uppercase keywords" description="SELECT, FROM, WHERE…" checked={uppercase} onChange={setUppercase} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatTile label="Input" value={byteSize(input)} />
          <StatTile label="Output" value={byteSize(output)} />
          <StatTile label="Statements" value={String(input.split(";").filter((part) => part.trim()).length)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={output} label="Copy SQL" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => downloadFile(output, "toolora-query.sql", "application/sql")} disabled={!output}>
            <Icon name="download" size={14} /> Download .sql
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>
        <Note tone="warn">
          Style only — this does not validate or execute SQL, and it does not connect to a database.
          Comments are removed. Review the output before running it: formatting cannot catch a missing
          WHERE clause or a destructive statement.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ JS minifier -------------------------------- */

function stripJsComments(source: string): { output: string; removed: number } {
  let output = "";
  let index = 0;
  let removed = 0;
  let state: "code" | "single" | "double" | "template" | "line" | "block" | "regex" = "code";
  let lastSignificant = "";

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "code") {
      if (char === "/" && next === "/") { state = "line"; removed += 2; index += 2; continue; }
      if (char === "/" && next === "*") { state = "block"; removed += 2; index += 2; continue; }
      if (char === "'") { state = "single"; output += char; index += 1; continue; }
      if (char === '"') { state = "double"; output += char; index += 1; continue; }
      if (char === "`") { state = "template"; output += char; index += 1; continue; }
      if (char === "/" && /[=(,:[!&|?{};+\-*%<>~^]$/.test(lastSignificant.trim())) {
        state = "regex";
        output += char;
        index += 1;
        continue;
      }
      output += char;
      if (!/\s/.test(char)) lastSignificant = char;
      index += 1;
      continue;
    }

    if (state === "line") {
      if (char === "\n") { state = "code"; output += "\n"; }
      else removed += 1;
      index += 1;
      continue;
    }

    if (state === "block") {
      if (char === "*" && next === "/") { state = "code"; index += 2; }
      else { if (char === "\n") output += "\n"; index += 1; }
      removed += 1;
      continue;
    }

    if (state === "regex") {
      output += char;
      if (char === "\\") { output += next ?? ""; index += 2; continue; }
      if (char === "/") state = "code";
      index += 1;
      continue;
    }

    // inside strings / templates
    output += char;
    if (char === "\\") { output += next ?? ""; index += 2; continue; }
    if (state === "single" && char === "'") state = "code";
    else if (state === "double" && char === '"') state = "code";
    else if (state === "template" && char === "`") state = "code";
    index += 1;
  }

  return { output, removed };
}

export function JsMinifier() {
  const [input, setInput] = useState("// Example utility\nfunction greet(name) {\n  const message = `Hello, ${name}!`;\n  return message;\n}\n\n/* main */\nconsole.log(greet('Toolora'));");
  const [stripComments, setStripComments] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [keepLines, setKeepLines] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", removed: 0, warning: "" };
    let output = input;
    let removed = 0;
    let warning = "";
    if (stripComments) {
      const stripped = stripJsComments(output);
      output = stripped.output;
      removed += stripped.removed;
    }
    if (collapseSpaces) {
      output = output
        .split("\n")
        .map((line) => line.replace(/[ \t]{2,}/g, " ").replace(/^\s+|\s+$/g, keepLines ? (value) => (value.length ? " " : "") : (value) => value))
        .join("\n");
      output = output.replace(/ ?([{};,]) ?/g, "$1");
      output = output.replace(/\n{3,}/g, "\n\n");
    }
    if (!keepLines) {
      output = output.replace(/\n+/g, " ");
      warning = "Line breaks were removed. Automatic semicolon insertion can change behaviour without semicolons, so test the minified code before using it.";
    }
    output = output.trim();
    return { output, removed: removed + Math.max(0, input.length - output.length), warning };
  }, [input, stripComments, collapseSpaces, keepLines]);

  return (
    <Workspace slug="javascript-minifier">
      <div className="space-y-5">
        <EditorPair inputId="js-input" outputId="js-output" input={input} onInput={setInput} output={result.output} placeholder="// Paste JavaScript here" language="conservative minify" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle label="Strip comments" description="Keeps strings, templates and regex intact" checked={stripComments} onChange={setStripComments} />
          <Toggle label="Collapse indentation" description="Trims redundant spaces per line" checked={collapseSpaces} onChange={setCollapseSpaces} />
          <Toggle label="Keep line breaks" description="Safer for code relying on ASI" checked={keepLines} onChange={setKeepLines} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Input" value={byteSize(input)} />
          <StatTile label="Output" value={byteSize(result.output)} />
          <StatTile label="Removed" value={formatNumber(result.removed)} hint="characters incl. whitespace" />
          <StatTile label="Saving" value={input ? `${Math.max(0, Math.round((1 - result.output.length / input.length) * 100))}%` : "—"} />
        </div>

        {result.warning && <Note tone="warn" title="Test before deploying">{result.warning}</Note>}

        <div className="flex flex-wrap gap-2">
          <CopyButton value={result.output} label="Copy JavaScript" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => downloadFile(result.output, "toolora-script.min.js", "text/javascript")} disabled={!result.output}>
            <Icon name="download" size={14} /> Download .js
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>

        <Note tone="warn" title="Conservative by design, not a production bundler">
          This tool removes comments and redundant indentation while protecting ordinary strings,
          template literals and most regex literals. It deliberately does <em>not</em> rename variables,
          inline functions or perform advanced compression. For production assets, use a maintained
          minifier such as Terser or your bundler's built-in minification, then run your tests against
          the minified build.
        </Note>
      </div>
    </Workspace>
  );
}
