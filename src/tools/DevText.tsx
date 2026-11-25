import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icons";
import { Link } from "@/lib/router";
import {
  Button,
  CopyButton,
  Note,
  Segmented,
  StatTile,
  Workspace,
} from "@/components/ui";
import { copyToClipboard, downloadFile, formatNumber } from "@/lib/utils";

/* --------------------------------- text diff ------------------------------- */

type DiffOp = {
  type: "same" | "add" | "remove";
  oldNumber: number | null;
  newNumber: number | null;
  text: string;
};

const DIFF_LINE_LIMIT = 800;

function computeLineDiff(oldText: string, newText: string): { ops: DiffOp[]; truncated: boolean } {
  let oldLines = oldText.split("\n");
  let newLines = newText.split("\n");
  const truncated = oldLines.length > DIFF_LINE_LIMIT || newLines.length > DIFF_LINE_LIMIT;
  if (oldLines.length > DIFF_LINE_LIMIT) oldLines = oldLines.slice(0, DIFF_LINE_LIMIT);
  if (newLines.length > DIFF_LINE_LIMIT) newLines = newLines.slice(0, DIFF_LINE_LIMIT);

  const n = oldLines.length;
  const m = newLines.length;
  const table = new Uint32Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[at(i, j)] =
        oldLines[i] === newLines[j]
          ? table[at(i + 1, j + 1)] + 1
          : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      ops.push({ type: "same", oldNumber: i + 1, newNumber: j + 1, text: oldLines[i] });
      i += 1;
      j += 1;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
      ops.push({ type: "remove", oldNumber: i + 1, newNumber: null, text: oldLines[i] });
      i += 1;
    } else {
      ops.push({ type: "add", oldNumber: null, newNumber: j + 1, text: newLines[j] });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "remove", oldNumber: i + 1, newNumber: null, text: oldLines[i] });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "add", oldNumber: null, newNumber: j + 1, text: newLines[j] });
    j += 1;
  }

  return { ops, truncated };
}

const SAMPLE_OLD = `Release notes — Toolsy 1.0

- Fifteen browser tools
- Password generator and QR codes
- Word counter with reading time
- No account required
- Local processing only`;

const SAMPLE_NEW = `Release notes — Toolsy 2.0

- Twenty-five browser tools
- Password generator, JSON formatter and QR codes
- Markdown editor with live preview
- Image compressor and contrast checker
- No account required
- Local processing only
- Recently used tools`;

export function TextDiffChecker() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [view, setView] = useState<"split" | "unified">("split");

  const diff = useMemo(() => {
    if (!oldText && !newText) return null;
    return computeLineDiff(oldText, newText);
  }, [oldText, newText]);

  const stats = useMemo(() => {
    if (!diff) return null;
    const added = diff.ops.filter((op) => op.type === "add").length;
    const removed = diff.ops.filter((op) => op.type === "remove").length;
    const same = diff.ops.filter((op) => op.type === "same").length;
    const total = added + removed + same;
    return {
      added,
      removed,
      same,
      similarity: total ? Math.round((same / total) * 100) : 100,
    };
  }, [diff]);

  const report = useMemo(() => {
    if (!diff) return "";
    return diff.ops.map((op) => `${op.type === "add" ? "+" : op.type === "remove" ? "-" : " "} ${op.text}`).join("\n");
  }, [diff]);

  function renderLineClasses(type: DiffOp["type"], side: "old" | "new") {
    if (type === "same") return "border-transparent bg-transparent text-mist-300";
    if (type === "remove" && side === "old") return "border-rose-400/20 bg-rose-400/[0.09] text-rose-100";
    if (type === "add" && side === "new") return "border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-100";
    return "border-transparent bg-transparent text-transparent select-none";
  }

  return (
    <Workspace slug="text-diff-checker">
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="diff-old" className="text-[13px] font-semibold text-mist-200">
                Original text
              </label>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
                {oldText ? `${oldText.split("\n").length} lines` : "empty"}
              </span>
            </div>
            <textarea
              id="diff-old"
              value={oldText}
              onChange={(event) => setOldText(event.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="Paste the older version here…"
              className="field-input min-h-[170px] resize-y font-mono text-[12px] leading-relaxed"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="diff-new" className="text-[13px] font-semibold text-mist-200">
                New text
              </label>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
                {newText ? `${newText.split("\n").length} lines` : "empty"}
              </span>
            </div>
            <textarea
              id="diff-new"
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="Paste the updated version here…"
              className="field-input min-h-[170px] resize-y font-mono text-[12px] leading-relaxed"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Diff view"
            value={view}
            onChange={setView}
            options={[
              { value: "split", label: "Side by side" },
              { value: "unified", label: "Unified" },
            ]}
            className="sm:max-w-[280px]"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setOldText(SAMPLE_OLD);
              setNewText(SAMPLE_NEW);
            }}
          >
            <Icon name="fileText" size={13} />
            Load sample
          </Button>
          <CopyButton value={report} label="Copy diff" copiedLabel="Diff copied" />
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setOldText("");
              setNewText("");
            }}
            disabled={!oldText && !newText}
          >
            <Icon name="trash" size={14} />
            Clear both
          </Button>
        </div>

        {!diff ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-10 text-center">
            <Icon name="diff" size={20} className="mx-auto text-mist-500" />
            <p className="mt-2 text-[13px] font-semibold text-mist-200">Two versions, one clear comparison</p>
            <p className="mt-1 text-[11.5px] text-mist-500">Paste text on both sides to see additions and removals.</p>
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Added" value={<span className="text-emerald-300">+{stats.added}</span>} hint="new lines" />
                <StatTile label="Removed" value={<span className="text-rose-300">−{stats.removed}</span>} hint="old lines" />
                <StatTile label="Unchanged" value={formatNumber(stats.same)} />
                <StatTile label="Similarity" value={`${stats.similarity}%`} hint="shared lines" />
              </div>
            )}

            {stats && stats.added === 0 && stats.removed === 0 && (oldText || newText) && (
              <Note tone="brand" title="Both versions are identical">
                No differences were found. Every line matches exactly, including case and whitespace.
              </Note>
            )}

            {diff.truncated && (
              <Note tone="warn">
                This comparison is limited to the first {DIFF_LINE_LIMIT} lines of each input to keep
                the page responsive. Compare a smaller excerpt for the complete picture.
              </Note>
            )}

            {diff.ops.length === 0 ? (
              <Note tone="brand">Both versions are identical.</Note>
            ) : view === "unified" ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/40">
                <div className="max-h-[460px] overflow-auto font-mono text-[11.5px] leading-relaxed">
                  {diff.ops.map((op, index) => (
                    <div
                      key={index}
                      className={
                        op.type === "add"
                          ? "flex gap-3 border-l-2 border-emerald-400/50 bg-emerald-400/[0.07] px-3 py-1"
                          : op.type === "remove"
                            ? "flex gap-3 border-l-2 border-rose-400/50 bg-rose-400/[0.07] px-3 py-1"
                            : "flex gap-3 border-l-2 border-transparent px-3 py-1"
                      }
                    >
                      <span className="w-3 shrink-0 select-none text-center text-mist-500">
                        {op.type === "add" ? "+" : op.type === "remove" ? "−" : " "}
                      </span>
                      <span className="min-w-0 whitespace-pre-wrap break-words text-mist-300">{op.text || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-2 lg:grid-cols-2">
                {(["old", "new"] as const).map((side) => (
                  <div key={side} className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/40">
                    <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-3 py-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
                        {side === "old" ? "Original" : "Updated"}
                      </span>
                      <span className="font-mono text-[9px] text-mist-600">
                        {side === "old" ? `${oldText.split("\n").length} lines` : `${newText.split("\n").length} lines`}
                      </span>
                    </div>
                    <div className="max-h-[430px] overflow-auto font-mono text-[11.5px] leading-relaxed">
                      {diff.ops.map((op, index) => {
                        const number = side === "old" ? op.oldNumber : op.newNumber;
                        const hidden = number === null;
                        return (
                          <div
                            key={index}
                            className={`flex gap-2 border-l-2 px-2 py-0.5 ${hidden ? "opacity-0" : renderLineClasses(op.type, side)}`}
                            aria-hidden={hidden || undefined}
                          >
                            <span className="w-7 shrink-0 select-none text-right text-[9px] text-mist-600">
                              {number ?? ""}
                            </span>
                            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{op.text || " "}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Note tone="info">
          The comparison is line-based and exact, so trailing spaces and letter case count as
          changes. Removed lines are highlighted red, additions green. Nothing is uploaded.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ markdown editor ---------------------------- */

const INLINE_PATTERN =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\([^)\s]+\))/g;

const SAFE_LINK = /^(https?:\/\/|mailto:|#|\/)/i;

function safeHref(value: string): string | null {
  return SAFE_LINK.test(value.trim()) ? value.trim() : null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_PATTERN);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.88em] text-brand-100">
          {part.slice(1, -1)}
        </code>
      );
    }
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={key} className="font-bold text-mist-50">{renderInline(part.slice(2, -2), key)}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key} className="italic">{renderInline(part.slice(1, -1), key)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      return (
        <a
          key={key}
          href={href}
          target={href.startsWith("#") ? undefined : "_blank"}
          rel={href.startsWith("#") ? undefined : "noopener noreferrer"}
          className="text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string; key: string }
  | { type: "paragraph"; text: string; key: string }
  | { type: "code"; language: string; code: string; key: string }
  | { type: "quote"; text: string; key: string }
  | { type: "list"; ordered: boolean; items: string[]; key: string }
  | { type: "hr"; key: string }
  | { type: "table"; head: string[]; rows: string[][]; key: string };

function splitTableRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((cell) => cell.trim());
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  let keyCounter = 0;
  const nextKey = () => `block-${keyCounter++}`;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^\s*```(\w*)/.exec(line);
    if (fence) {
      const language = fence[1] || "";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", language, code: codeLines.join("\n"), key: nextKey() });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2], key: nextKey() });
      index += 1;
      continue;
    }

    if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) || /^---+\s*$/.test(line)) {
      blocks.push({ type: "hr", key: nextKey() });
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" "), key: nextKey() });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items, key: nextKey() });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items, key: nextKey() });
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index + 1])) {
      const head = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", head, rows, key: nextKey() });
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6}\s|```|\s*[-*+]\s+|\s*\d+\.\s+|\s*>)/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" "), key: nextKey() });
  }

  return blocks;
}

const HEADING_CLASSES: Record<number, string> = {
  1: "mt-1 text-[26px] font-bold tracking-[-0.03em] text-mist-50",
  2: "mt-6 border-b border-white/[0.08] pb-2 text-[21px] font-semibold tracking-[-0.02em] text-mist-50",
  3: "mt-5 text-[17px] font-semibold text-mist-100",
  4: "mt-4 text-[15px] font-semibold text-mist-100",
  5: "mt-4 text-[13.5px] font-semibold uppercase tracking-wide text-mist-200",
  6: "mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-mist-300",
};

function MarkdownPreview({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);

  if (!source.trim()) {
    return (
      <div className="grid h-full min-h-[280px] place-items-center text-center">
        <div>
          <Icon name="markdown" size={20} className="mx-auto text-mist-500" />
          <p className="mt-2 text-[12px] text-mist-500">Your formatted preview appears here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-mist-300">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const Tag = (`h${Math.min(block.level, 6)}`) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
            return (
              <Tag key={block.key} className={HEADING_CLASSES[block.level]}>
                {renderInline(block.text, block.key)}
              </Tag>
            );
          }
          case "paragraph":
            return <p key={block.key}>{renderInline(block.text, block.key)}</p>;
          case "code":
            return (
              <div key={block.key} className="overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70">
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.025] px-3 py-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
                    {block.language || "code"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(block.code)}
                    className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500 transition hover:text-brand-300"
                  >
                    <Icon name="copy" size={10} />
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-relaxed text-mist-200">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          case "quote":
            return (
              <blockquote key={block.key} className="border-l-2 border-brand-400/60 bg-brand-400/[0.04] py-2 pl-4 pr-3 italic text-mist-400">
                {renderInline(block.text, block.key)}
              </blockquote>
            );
          case "list":
            return block.ordered ? (
              <ol key={block.key} className="ml-5 list-decimal space-y-1 marker:text-mist-500">
                {block.items.map((item, itemIndex) => (
                  <li key={`${block.key}-${itemIndex}`}>{renderInline(item, `${block.key}-${itemIndex}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={block.key} className="ml-5 list-disc space-y-1 marker:text-brand-400/70">
                {block.items.map((item, itemIndex) => (
                  <li key={`${block.key}-${itemIndex}`}>{renderInline(item, `${block.key}-${itemIndex}`)}</li>
                ))}
              </ul>
            );
          case "hr":
            return <hr key={block.key} className="border-white/10" />;
          case "table":
            return (
              <div key={block.key} className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                      {block.head.map((cell, cellIndex) => (
                        <th key={cellIndex} className="px-3 py-2 font-semibold text-mist-100">
                          {renderInline(cell, `${block.key}-h-${cellIndex}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-white/[0.05] last:border-b-0">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-mist-400">
                            {renderInline(cell, `${block.key}-${rowIndex}-${cellIndex}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

const MARKDOWN_SAMPLE = `# Toolsy Markdown

Write on the left, preview on the right. Everything stays in your browser.

## What is supported

- **Bold**, *italic* and \`inline code\`
- Ordered and unordered lists
- [Links](https://toolsy.com/tools)
- Quotes, horizontal rules and tables

> A calm editor for notes, README files and documentation.

## Code blocks

\`\`\`tsx
export function Toolsy() {
  return <h1>Free tools, done properly.</h1>;
}
\`\`\`

### A small table

| Feature | Status |
| --- | --- |
| Live preview | Ready |
| Local processing | Always |

---

Edit this sample or clear it and start writing.`;

export function MarkdownEditor() {
  const [source, setSource] = useState(MARKDOWN_SAMPLE);
  const [view, setView] = useState<"write" | "preview" | "split">("split");

  const stats = useMemo(() => {
    const words = source.trim() ? (source.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) ?? []).length : 0;
    const headings = (source.match(/^#{1,6}\s+/gm) ?? []).length;
    const codeBlocks = Math.floor((source.match(/```/g) ?? []).length / 2);
    return { words, characters: source.length, headings, codeBlocks };
  }, [source]);

  function exportMarkdown() {
    if (!source.trim()) return;
    downloadFile(source, "toolsy-note.md", "text/markdown;charset=utf-8");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        exportMarkdown();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const showEditor = view === "write" || view === "split";
  const showPreview = view === "preview" || view === "split";

  return (
    <Workspace slug="markdown-editor">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Editor view"
            value={view}
            onChange={setView}
            options={[
              { value: "write", label: "Write" },
              { value: "preview", label: "Preview" },
              { value: "split", label: "Split" },
            ]}
            className="sm:max-w-[320px]"
          />
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-600">
            ⌘/Ctrl + S downloads
          </span>
        </div>

        <div className={`grid gap-4 ${view === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {showEditor && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="markdown-source" className="text-[13px] font-semibold text-mist-200">
                  Markdown source
                </label>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">
                  {stats.characters} chars
                </span>
              </div>
              <textarea
                id="markdown-source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                spellCheck={false}
                rows={22}
                placeholder="# Start writing Markdown…"
                className="field-input min-h-[460px] resize-y font-mono text-[12.5px] leading-relaxed"
              />
            </div>
          )}

          {showPreview && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-mist-200">Preview</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-brand-300/80">
                  <span className="size-1.5 rounded-full bg-brand-400" />
                  live
                </span>
              </div>
              <div
                aria-live="polite"
                className="min-h-[460px] overflow-auto rounded-xl border border-white/[0.08] bg-ink-950/45 p-5"
              >
                <MarkdownPreview source={source} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Words" value={formatNumber(stats.words)} />
          <StatTile label="Characters" value={formatNumber(stats.characters)} />
          <StatTile label="Headings" value={formatNumber(stats.headings)} />
          <StatTile label="Code blocks" value={formatNumber(stats.codeBlocks)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={source} label="Copy Markdown" copiedLabel="Markdown copied" />
          <Button variant="secondary" size="sm" onClick={exportMarkdown} disabled={!source.trim()}>
            <Icon name="download" size={14} />
            Download .md
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSource(MARKDOWN_SAMPLE)}
          >
            <Icon name="fileText" size={14} />
            Reset sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setSource("")}
            disabled={!source}
          >
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        <Note tone="info">
          Raw HTML is escaped and only safe link protocols are rendered, so a pasted draft cannot
          execute scripts in the preview. Your writing is never uploaded.
        </Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- regex tester ----------------------------- */

const FLAGS: { key: string; label: string; description: string }[] = [
  { key: "g", label: "g", description: "Global — find every match" },
  { key: "i", label: "i", description: "Case-insensitive" },
  { key: "m", label: "m", description: "Multiline — ^ and $ match line breaks" },
  { key: "s", label: "s", description: "Dot-all — . matches newlines" },
  { key: "u", label: "u", description: "Unicode mode" },
];

const REGEX_PRESETS = [
  { label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s\"']+" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
  { label: "Hex colour", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b" },
  { label: "Digits", pattern: "\\d+" },
];

const REGEX_SAMPLE = `Contact: hello@toolsy.com
Docs: https://toolsy.com/tools/regex-tester
The palette uses #C7F05F and #0B0D11.
Version 2.0 shipped with 25 tools on 2026-02-12.`;

type RegexMatch = {
  index: number;
  value: string;
  groups: string[];
};

function explainRegexError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("unterminated group")) return "A group is missing its closing parenthesis.";
  if (lower.includes("unterminated character class")) return "A character class is missing its closing ].";
  if (lower.includes("nothing to repeat")) return "A quantifier (*, +, ? or {}) has nothing before it to repeat.";
  if (lower.includes("invalid group")) return "The group syntax is invalid. Check for a stray ? after the opening parenthesis.";
  if (lower.includes("invalid escape")) return "An escape sequence is invalid. In Unicode mode, escape literal punctuation carefully.";
  if (lower.includes("lone quantifier")) return "A { } quantifier is malformed — use a form such as {1,3}.";
  if (lower.includes("invalid flags")) return "The combination of flags is not valid.";
  return "Check the pattern's parentheses, brackets, escapes and quantifiers.";
}

export function RegexTester() {
  const [pattern, setPattern] = useState("[\\w.+-]+@[\\w-]+\\.[\\w.]+");
  const [text, setText] = useState(REGEX_SAMPLE);
  const [flags, setFlags] = useState<Record<string, boolean>>({
    g: true,
    i: true,
    m: false,
    s: false,
    u: false,
  });

  const flagString = FLAGS.filter((flag) => flags[flag.key]).map((flag) => flag.key).join("");

  const evaluation = useMemo(() => {
    if (!pattern) return { regex: null as RegExp | null, error: "", matches: [] as RegexMatch[], truncated: false };
    try {
      const regex = new RegExp(pattern, flagString);
      const matches: RegexMatch[] = [];
      let truncated = false;
      if (flagString.includes("g")) {
        let match: RegExpExecArray | null;
        let guard = 0;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            index: match.index,
            value: match[0],
            groups: match.slice(1),
          });
          if (match[0] === "") regex.lastIndex += 1;
          guard += 1;
          if (guard >= 1000) {
            truncated = true;
            break;
          }
          if (match.index > text.length) break;
        }
      } else {
        const match = regex.exec(text);
        if (match) {
          matches.push({ index: match.index, value: match[0], groups: match.slice(1) });
        }
      }
      return { regex, error: "", matches, truncated };
    } catch (error) {
      return {
        regex: null,
        error: `${error instanceof Error ? error.message : "Invalid regular expression."} ${error instanceof Error ? explainRegexError(error.message) : ""}`,
        matches: [] as RegexMatch[],
        truncated: false,
      };
    }
  }, [pattern, text, flagString]);

  const highlighted = useMemo(() => {
    if (evaluation.error || evaluation.matches.length === 0) return null;
    const parts: ReactNode[] = [];
    let cursor = 0;
    evaluation.matches.forEach((match, index) => {
      if (match.index < cursor) return;
      if (match.index > cursor) {
        parts.push(<Fragment key={`text-${index}`}>{text.slice(cursor, match.index)}</Fragment>);
      }
      if (match.value.length === 0) {
        parts.push(
          <mark key={`empty-${index}`} className="rounded-sm bg-amber-400/30 px-0.5 text-amber-100">
            {""}
          </mark>
        );
      } else {
        parts.push(
          <mark key={`match-${index}`} className="rounded-sm bg-brand-400/25 px-0.5 text-brand-100 outline outline-1 outline-brand-400/30">
            {match.value}
          </mark>
        );
      }
      cursor = Math.max(cursor, match.index + match.value.length);
    });
    if (cursor < text.length) parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);
    return parts;
  }, [evaluation, text]);

  const copyValue = useMemo(
    () => evaluation.matches.map((match) => match.value).join("\n"),
    [evaluation.matches]
  );

  return (
    <Workspace slug="regex-tester">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="regex-pattern" className="text-[13px] font-semibold text-mist-200">
              Regular expression
            </label>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">
              JavaScript flavour
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-3 focus-within:border-brand-400/50">
            <span className="select-none font-mono text-[14px] text-mist-500">/</span>
            <input
              id="regex-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder="Enter a pattern without slashes"
              className="h-12 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-mist-50 outline-none placeholder:text-mist-600"
            />
            <span className="select-none font-mono text-[13px] text-mist-500">/</span>
            <span className="font-mono text-[12px] text-brand-300">{flagString}</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-mist-200">Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {FLAGS.map((flag) => {
              const active = flags[flag.key];
              return (
                <button
                  key={flag.key}
                  type="button"
                  aria-pressed={active}
                  title={flag.description}
                  onClick={() => setFlags((current) => ({ ...current, [flag.key]: !current[flag.key] }))}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-200"
                      : "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-[11.5px] text-mist-400 transition hover:border-white/20 hover:text-mist-100"
                  }
                >
                  <span className="font-mono text-[12px]">{flag.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{flag.description.split("—")[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {evaluation.error && (
          <Note tone="warn" title="Invalid regular expression">
            {evaluation.error}
          </Note>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="regex-input" className="text-[13px] font-semibold text-mist-200">
                Test text
              </label>
              <span className="font-mono text-[9.5px] text-mist-500">{formatNumber(text.length)} chars</span>
            </div>
            <textarea
              id="regex-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              rows={14}
              placeholder="Paste the text you want to test against…"
              className="field-input min-h-[300px] resize-y font-mono text-[12px] leading-relaxed"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-mist-200">Highlighted matches</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 font-mono text-[9.5px] text-brand-200">
                {evaluation.matches.length} {evaluation.matches.length === 1 ? "match" : "matches"}
              </span>
            </div>
            <div
              aria-live="polite"
              className="min-h-[300px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-ink-950/45 p-3 font-mono text-[12px] leading-relaxed text-mist-300"
            >
              {highlighted ?? (evaluation.error ? "Fix the pattern to see matches." : "No matches yet — adjust the pattern or text.")}
            </div>
          </div>
        </div>

        {evaluation.matches.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            <div className="grid grid-cols-[40px_minmax(0,1fr)_70px] gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">
              <span>#</span>
              <span>Match / capture groups</span>
              <span className="text-right">Index</span>
            </div>
            <div className="max-h-[220px] overflow-auto">
              {evaluation.matches.map((match, index) => (
                <div key={`${match.index}-${index}`} className="grid grid-cols-[40px_minmax(0,1fr)_70px] gap-2 border-b border-white/[0.04] px-3 py-2 font-mono text-[11px] last:border-b-0">
                  <span className="text-mist-600">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-brand-200">{match.value || "(empty match)"}</span>
                    {match.groups.length > 0 && (
                      <span className="mt-0.5 block truncate text-[10px] text-mist-500">
                        groups: {match.groups.map((group) => group ?? "undefined").join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-mist-400">{match.index}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluation.truncated && (
          <Note tone="warn">Showing the first 1,000 matches. Narrow the pattern or shorten the text for a full list.</Note>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={`/${pattern}/${flagString}`} label="Copy pattern" copiedLabel="Pattern copied" />
          <CopyButton value={copyValue} label="Copy matches" copiedLabel="Matches copied" />
          <Button variant="secondary" size="sm" onClick={() => setPattern("")} disabled={!pattern}>
            <Icon name="trash" size={13} />
            Clear pattern
          </Button>
          <Link
            href="/tools/text-diff-checker"
            className="ml-auto inline-flex min-h-9 items-center gap-1 text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200"
          >
            Comparing text instead?
            <Icon name="arrowUpRight" size={12} />
          </Link>
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">Quick patterns</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REGEX_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPattern(preset.pattern);
                  setFlags((current) => ({ ...current, g: true }));
                }}
                className="rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-mist-400 transition hover:border-brand-400/30 hover:text-mist-100"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <Note tone="info">
          This uses JavaScript's native regular expression engine. Overlapping matches are not
          reported; global search continues after each match. Complex patterns with heavy
          backtracking can be slow on very long text.
        </Note>
      </div>
    </Workspace>
  );
}
