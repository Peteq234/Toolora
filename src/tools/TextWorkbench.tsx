import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { Link } from "@/lib/router";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Select,
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { downloadFile, formatNumber, randomInt, secureRandomInt } from "@/lib/utils";

/* ---------------------------- duplicate remover --------------------------- */

export function RemoveDuplicateLines() {
  const [input, setInput] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trim, setTrim] = useState(true);
  const [keepBlank, setKeepBlank] = useState(false);
  const [sort, setSort] = useState(false);

  const analysis = useMemo(() => {
    const lines = input.split("\n");
    const seen = new Set<string>();
    const kept: string[] = [];
    let duplicates = 0;
    let blankRemoved = 0;
    for (const line of lines) {
      const prepared = trim ? line.trim() : line;
      if (!keepBlank && prepared === "") {
        blankRemoved += 1;
        continue;
      }
      const key = ignoreCase ? prepared.toLocaleLowerCase() : prepared;
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      kept.push(prepared);
    }
    return {
      output: (sort ? [...kept].sort((a, b) => a.localeCompare(b)) : kept).join("\n"),
      original: lines.length,
      duplicates,
      blankRemoved,
      unique: kept.length,
    };
  }, [input, ignoreCase, trim, keepBlank, sort]);

  return (
    <Workspace slug="remove-duplicate-lines">
      <div className="space-y-5">
        <Field label="Your list" htmlFor="dedupe-input" hint="one entry per line">
          <textarea
            id="dedupe-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={"apple\nbanana\nApple\nbanana\ncherry"}
            className="field-input min-h-[190px] resize-y font-mono text-[12.5px] leading-relaxed"
          />
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Ignore letter case" description="“Apple” and “apple” count as one" checked={ignoreCase} onChange={setIgnoreCase} />
          <Toggle label="Trim whitespace" description="Remove spaces before comparing and in output" checked={trim} onChange={setTrim} />
          <Toggle label="Keep blank lines" description="Otherwise empty lines are removed" checked={keepBlank} onChange={setKeepBlank} />
          <Toggle label="Sort A → Z" description="Sort the unique results alphabetically" checked={sort} onChange={setSort} />
        </div>

        {!input.trim() ? (
          <Note tone="info">Paste a list to remove repeated lines. The first occurrence is always kept.</Note>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Original lines" value={formatNumber(analysis.original)} />
              <StatTile label="Unique kept" value={formatNumber(analysis.unique)} />
              <StatTile label="Duplicates removed" value={<span className="text-brand-300">{formatNumber(analysis.duplicates)}</span>} />
              <StatTile label="Blank removed" value={formatNumber(analysis.blankRemoved)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-mist-200">Cleaned output</p>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{analysis.unique} lines</span>
              </div>
              <textarea readOnly value={analysis.output} rows={9} spellCheck={false} className="field-input min-h-[190px] resize-y bg-ink-950/50 font-mono text-[12.5px] leading-relaxed" aria-label="Output without duplicate lines" />
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={analysis.output} label="Copy output" copiedLabel="Copied" />
              <Button variant="secondary" size="sm" onClick={() => downloadFile(analysis.output, "toolsy-unique-lines.txt")}>
                <Icon name="download" size={14} /> Download .txt
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput(analysis.output)}>Use output as input</Button>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")}>
                <Icon name="trash" size={14} /> Clear
              </Button>
            </div>
          </>
        )}
        <Note tone="info">Everything is processed in this tab. Nothing is uploaded or stored.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- sort lines ------------------------------- */

type SortMode = "az" | "za" | "length" | "length-desc" | "numeric" | "reverse" | "shuffle";

export function SortTextLines() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SortMode>("az");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [dedupe, setDedupe] = useState(false);
  const [numbering, setNumbering] = useState(false);

  const output = useMemo(() => {
    let lines = input.split("\n");
    if (removeEmpty) lines = lines.filter((line) => line.trim() !== "");
    if (dedupe) lines = [...new Set(lines.map((line) => line.trim()))];
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: ignoreCase ? "base" : "variant" });
    const sorted = [...lines];
    switch (mode) {
      case "za": sorted.sort((a, b) => collator.compare(b, a)); break;
      case "length": sorted.sort((a, b) => a.length - b.length || collator.compare(a, b)); break;
      case "length-desc": sorted.sort((a, b) => b.length - a.length || collator.compare(a, b)); break;
      case "numeric": sorted.sort((a, b) => {
        const numA = parseFloat(a.replace(/[^0-9.-]/g, ""));
        const numB = parseFloat(b.replace(/[^0-9.-]/g, ""));
        if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
        return collator.compare(a, b);
      }); break;
      case "reverse": sorted.reverse(); break;
      case "shuffle": {
        for (let index = sorted.length - 1; index > 0; index -= 1) {
          const swap = secureRandomInt(index + 1);
          [sorted[index], sorted[swap]] = [sorted[swap], sorted[index]];
        }
        break;
      }
      default: sorted.sort((a, b) => collator.compare(a, b));
    }
    const formatted = numbering ? sorted.map((line, index) => `${index + 1}. ${line}`) : sorted;
    return { text: formatted.join("\n"), count: sorted.length };
  }, [input, mode, ignoreCase, removeEmpty, dedupe, numbering]);

  return (
    <Workspace slug="sort-text-lines">
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Input lines" htmlFor="sort-input" hint="one item per line">
            <textarea id="sort-input" value={input} onChange={(event) => setInput(event.target.value)} rows={10} spellCheck={false} placeholder={"Zebra\napple\n10. Widget\n2. Gadget"} className="field-input min-h-[210px] resize-y font-mono text-[12.5px] leading-relaxed" />
          </Field>
          <Field label="Sorted output" htmlFor="sort-output" hint={`${output.count} lines`}>
            <textarea id="sort-output" value={output.text} readOnly rows={10} spellCheck={false} className="field-input min-h-[210px] resize-y bg-ink-950/50 font-mono text-[12.5px] leading-relaxed" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Field label="Sort order" htmlFor="sort-mode">
            <Select
              id="sort-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as SortMode)}
              options={[
                { value: "az", label: "A → Z" },
                { value: "za", label: "Z → A" },
                { value: "length", label: "Shortest first" },
                { value: "length-desc", label: "Longest first" },
                { value: "numeric", label: "Numeric value" },
                { value: "reverse", label: "Reverse current order" },
                { value: "shuffle", label: "Shuffle randomly" },
              ]}
            />
          </Field>
          <div className="grid gap-2">
            <Toggle label="Ignore letter case" description="Sort “apple” next to “Apple”" checked={ignoreCase} onChange={setIgnoreCase} />
            <Toggle label="Remove empty lines" checked={removeEmpty} onChange={setRemoveEmpty} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Remove duplicates" checked={dedupe} onChange={setDedupe} />
          <Toggle label="Number the lines" description="Adds 1. 2. 3. prefixes" checked={numbering} onChange={setNumbering} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={output.text} label="Copy sorted lines" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => setInput(output.text)} disabled={!output.text}>Use output as input</Button>
          <Button variant="ghost" size="sm" onClick={() => downloadFile(output.text, "toolsy-sorted-lines.txt")} disabled={!output.text}>
            <Icon name="download" size={14} /> Download
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>

        <Note tone="info">
          Sorting uses natural numeric awareness, so “item 2” comes before “item 10”. Newest-first
          sorting is available by reversing the original order.
        </Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- text cleaner ---------------------------- */

export function TextCleaner() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState({
    html: true,
    smartQuotes: true,
    whitespace: true,
    invisible: true,
    urls: false,
    numbers: false,
    punctuation: false,
    gettysburg: false,
  });
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  const cleaned = useMemo(() => {
    if (!input) return { text: "", removed: 0 };
    let text = input;
    const before = text.length;
    if (options.html) text = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    if (options.invisible) text = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    if (options.smartQuotes) text = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...");
    if (options.html) text = text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
    if (options.whitespace) text = text.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (options.urls) text = text.replace(/https?:\/\/\S+/g, " ");
    if (options.numbers) text = text.replace(/\d+/g, " ");
    if (options.punctuation) text = text.replace(/[^\p{L}\p{N}\s]/gu, "");
    if (find) {
      try {
        text = text.replace(new RegExp(find, "g"), replace);
      } catch {
        /* invalid pattern is reported below */
      }
    }
    return { text: text.replace(/\n{3,}/g, "\n\n"), removed: Math.max(0, before - text.length) };
  }, [input, options, find, replace]);

  const patternValid = !find || (() => { try { new RegExp(find); return true; } catch { return false; } })();

  return (
    <Workspace slug="text-cleaner">
      <div className="space-y-5">
        <Field label="Text to clean" htmlFor="cleaner-input" hint={`${formatNumber(input.length)} chars`}>
          <textarea id="cleaner-input" value={input} onChange={(event) => setInput(event.target.value)} rows={9} placeholder={"Paste text copied from a website, PDF or document\u2026"} className="field-input min-h-[190px] resize-y text-[12.5px] leading-relaxed" />
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ["html", "Remove HTML tags", "Also decodes &amp; style entities"],
            ["smartQuotes", "Straighten quotes & dashes", "Curly ’ “ ” and — become plain characters"],
            ["whitespace", "Normalise whitespace", "Collapse extra spaces, tabs and blank lines"],
            ["invisible", "Strip invisible characters", "Zero-width spaces and control characters"],
            ["urls", "Remove URLs", "Drops http(s) links"],
            ["numbers", "Remove digits", "Removes standalone numbers too"],
            ["punctuation", "Keep letters and numbers only", "Removes all punctuation"],
            ["gettysburg", "Remove filler words", "Removes common stop words (experimental)"],
          ] as [keyof typeof options, string, string][]).map(([key, label, description]) => (
            <Toggle
              key={key}
              label={label}
              description={description}
              checked={options[key]}
              onChange={(value) => setOptions((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </div>

        <div className="grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 sm:grid-cols-2">
          <Field label="Find (regex)" htmlFor="cleaner-find" hint="optional">
            <Input id="cleaner-find" value={find} onChange={(event) => setFind(event.target.value)} placeholder="e.g. \\[\\d+\\]" className="font-mono text-[12px]" />
          </Field>
          <Field label="Replace with" htmlFor="cleaner-replace" error={patternValid ? undefined : "That is not a valid regular expression."}>
            <Input id="cleaner-replace" value={replace} onChange={(event) => setReplace(event.target.value)} placeholder="leave empty to delete" className="font-mono text-[12px]" />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-mist-200">Cleaned result</p>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{formatNumber(cleaned.removed)} characters removed</span>
          </div>
          <textarea readOnly value={cleaned.text} rows={9} className="field-input min-h-[190px] resize-y bg-ink-950/50 text-[12.5px] leading-relaxed" aria-label="Cleaned text" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={cleaned.text} label="Copy cleaned text" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => downloadFile(cleaned.text, "toolsy-cleaned.txt")} disabled={!cleaned.text}>
            <Icon name="download" size={14} /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput(cleaned.text)} disabled={!cleaned.text}>Use as input</Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setInput("")} disabled={!input}>
            <Icon name="trash" size={14} /> Clear
          </Button>
        </div>

        <Note tone="info">
          “Remove filler words” is intentionally conservative and labelled experimental: it is meant
          for quick tidy-ups, not for rewriting content. Check the result before publishing. All
          processing is local.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ lorem ipsum ------------------------------- */

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

export function LoremIpsumGenerator() {
  const [mode, setMode] = useState<"paragraphs" | "sentences" | "words" | "list">("paragraphs");
  const [count, setCount] = useState("3");
  const [startClassic, setStartClassic] = useState(true);
  const [html, setHtml] = useState(false);

  const amount = Math.min(200, Math.max(1, parseInt(count, 10) || 1));

  const text = useMemo(() => {
    const pick = () => WORDS[randomInt(0, WORDS.length - 1)];
    const sentence = () => {
      const length = randomInt(8, 18);
      const words = Array.from({ length }, pick);
      const result = words.join(" ");
      return `${result.charAt(0).toUpperCase()}${result.slice(1)}.`;
    };
    let blocks: string[] = [];
    if (mode === "words") blocks = [Array.from({ length: amount }, pick).join(" ")];
    else if (mode === "sentences") blocks = [Array.from({ length: amount }, sentence).join(" ")];
    else if (mode === "list") blocks = Array.from({ length: amount }, () => sentence());
    else blocks = Array.from({ length: amount }, () => Array.from({ length: randomInt(3, 5) }, sentence).join(" "));
    if (startClassic && mode !== "list") {
      blocks[0] = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${blocks[0]?.replace(/^[A-Z]/, (c) => c.toLowerCase()) ?? ""}`.trim();
    }
    if (mode === "list") return blocks.map((line) => `- ${html ? `<li>${line}</li>` : line}`).join("\n");
    return blocks.map((block) => (html ? `<p>${block}</p>` : block)).join("\n\n");
  }, [mode, amount, startClassic, html, count]);

  return (
    <Workspace slug="lorem-ipsum-generator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Produce" htmlFor="lorem-mode">
            <Select
              id="lorem-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
              options={[
                { value: "paragraphs", label: "Paragraphs" },
                { value: "sentences", label: "Sentences" },
                { value: "words", label: "Words" },
                { value: "list", label: "List items" },
              ]}
            />
          </Field>
          <Field label="Amount" htmlFor="lorem-count" hint="1–200">
            <Input id="lorem-count" type="number" min={1} max={200} value={count} onChange={(event) => setCount(event.target.value)} className="font-mono" />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Output</p>
            <Button variant="secondary" size="md" className="w-full" onClick={() => setHtml((value) => !value)}>
              <Icon name={html ? "check" : "code"} size={14} />
              {html ? "HTML tags on" : "Plain text"}
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Start with “Lorem ipsum dolor sit amet”" checked={startClassic} onChange={setStartClassic} />
          <Toggle label="Wrap in HTML tags" description="Paragraphs or list items" checked={html} onChange={setHtml} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-mist-200">Generated placeholder</p>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{formatNumber(text.length)} chars</span>
          </div>
          <textarea readOnly value={text} rows={12} className="field-input min-h-[240px] resize-y bg-ink-950/50 text-[12.5px] leading-relaxed" aria-label="Generated lorem ipsum text" />
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={text} label="Copy text" copiedLabel="Copied" />
          <Button variant="primary" size="sm" onClick={() => setCount(String(amount))}>
            <Icon name="refresh" size={14} /> Generate new
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadFile(text, "toolsy-lorem.txt")}>
            <Icon name="download" size={14} /> Download
          </Button>
        </div>

        <Note tone="info">
          Lorem ipsum is scrambled Latin used as neutral placeholder copy. It is not meaningful content
          — replace it before publishing. Generation is random and local.
        </Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------- reading time ------------------------------- */

export function ReadingTimeCalculator() {
  const [text, setText] = useState("");
  const [readingWpm, setReadingWpm] = useState("220");
  const [speakingWpm, setSpeakingWpm] = useState("140");

  const stats = useMemo(() => {
    const words = text.trim() ? (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) ?? []).length : 0;
    const characters = text.length;
    const sentences = text.trim() ? (text.match(/[^.!?…]+[.!?…]*/g) ?? []).filter((s) => s.trim()).length : 0;
    const readSpeed = Math.max(50, Math.min(1000, parseInt(readingWpm, 10) || 220));
    const speakSpeed = Math.max(50, Math.min(500, parseInt(speakingWpm, 10) || 140));
    return {
      words,
      characters,
      sentences,
      readingSeconds: (words / readSpeed) * 60,
      speakingSeconds: (words / speakSpeed) * 60,
      readSpeed,
      speakSpeed,
      minutesAt180: (words / 180) * 60,
      minutesAt250: (words / 250) * 60,
    };
  }, [text, readingWpm, speakingWpm]);

  function clock(seconds: number) {
    if (seconds <= 0) return "0 min";
    if (seconds < 60) return `${Math.ceil(seconds)} sec`;
    const minutes = Math.floor(seconds / 60);
    const rest = Math.round(seconds % 60);
    return `${minutes} min${rest ? ` ${rest} sec` : ""}`;
  }

  return (
    <Workspace slug="reading-time-calculator">
      <div className="space-y-5">
        <Field label="Your text" htmlFor="reading-text" hint="paste an article, script or speech">
          <textarea id="reading-text" value={text} onChange={(event) => setText(event.target.value)} rows={10} placeholder="Paste the text you want to time…" className="field-input min-h-[220px] resize-y text-[13px] leading-relaxed" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reading speed" htmlFor="reading-wpm" hint="words per minute">
            <Input id="reading-wpm" type="number" min={50} max={1000} value={readingWpm} onChange={(event) => setReadingWpm(event.target.value)} className="font-mono" />
          </Field>
          <Field label="Speaking speed" htmlFor="speaking-wpm" hint="words per minute">
            <Input id="speaking-wpm" type="number" min={50} max={500} value={speakingWpm} onChange={(event) => setSpeakingWpm(event.target.value)} className="font-mono" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Words" value={formatNumber(stats.words)} />
          <StatTile label="Characters" value={formatNumber(stats.characters)} />
          <StatTile label="Sentences" value={formatNumber(stats.sentences)} />
          <StatTile label="Avg words / sentence" value={stats.sentences ? (stats.words / stats.sentences).toFixed(1) : "—"} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ResultCard label="Estimated reading time" value={clock(stats.readingSeconds)} hint={`At ${stats.readSpeed} words per minute`} />
          <ResultCard label="Estimated speaking time" value={clock(stats.speakingSeconds)} hint={`At ${stats.speakSpeed} words per minute — presentations usually suit 120–150`} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <StatTile label="At 180 wpm (slow reader)" value={clock(stats.minutesAt180)} />
          <StatTile label="At 250 wpm (fast reader)" value={clock(stats.minutesAt250)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={`Words: ${stats.words}. Reading time: ${clock(stats.readingSeconds)} at ${stats.readSpeed} wpm. Speaking time: ${clock(stats.speakingSeconds)} at ${stats.speakSpeed} wpm.`} label="Copy summary" copiedLabel="Copied" />
          <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
            <Icon name="trash" size={14} /> Clear
          </Button>
          <Link href="/tools/word-counter" className="ml-auto self-center text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200">
            Need full counts and keyword density? Open the word counter →
          </Link>
        </div>

        <Note tone="info">
          Reading speed varies widely: adult silent reading is often around 200–250 words per minute,
          while presentations are usually slower so the audience can follow. These are estimates for
          planning, not guarantees.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- text reverser ---------------------------- */

type ReverseMode = "characters" | "words" | "lines" | "each-word" | "words-in-lines" | "alternating";

export function TextReverser() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ReverseMode>("characters");
  const [preservePunctuation, setPreservePunctuation] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const output = useMemo(() => {
    if (!text) return "";
    switch (mode) {
      case "words": return text.split(/\s+/).filter(Boolean).reverse().join(" ");
      case "lines": return text.split("\n").reverse().join("\n");
      case "each-word": return text.replace(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu, (word) => [...word].reverse().join(""));
      case "words-in-lines": return text.split("\n").map((line) => line.split(/\s+/).filter(Boolean).reverse().join(" ")).join("\n");
      case "alternating": return [...text].map((char, index) => (index % 2 === 0 ? char : char.length)).join("");
      default: return [...text].reverse().join("");
    }
  }, [text, mode]);

  const outputFinal = preservePunctuation
    ? output.replace(/[\p{P}\p{S}]/gu, "")
    : output;

  return (
    <Workspace slug="text-reverser">
      <div className="space-y-5">
        <Field label="Input text" htmlFor="reverse-input">
          <textarea id="reverse-input" value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder="Type or paste text to reverse…" className="field-input min-h-[160px] resize-y text-[13px] leading-relaxed" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Field label="Reverse" htmlFor="reverse-mode">
            <Select
              id="reverse-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as ReverseMode)}
              options={[
                { value: "characters", label: "All characters" },
                { value: "words", label: "Word order" },
                { value: "lines", label: "Line order" },
                { value: "each-word", label: "Letters in each word" },
                { value: "words-in-lines", label: "Words within each line" },
                { value: "alternating", label: "Odd/even characters" },
              ]}
            />
          </Field>
          <div className="flex items-end">
            <Toggle label="Strip punctuation from result" checked={preservePunctuation} onChange={setPreservePunctuation} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-mist-200">Reversed result</p>
          <textarea readOnly value={outputFinal} rows={7} className="field-input min-h-[160px] resize-y bg-ink-950/50 text-[13px] leading-relaxed" aria-label="Reversed text result" />
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={outputFinal} label="Copy result" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => { setHistory((h) => [text, ...h].slice(0, 10)); setText(outputFinal); }} disabled={!text}>
            <Icon name="arrowUpDown" size={14} /> Swap input/output
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setHistory((h) => [text, ...h].slice(0, 10)); setText(""); }} disabled={!text}>Clear</Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setHistory([])} disabled={!history.length}>Clear history</Button>
        </div>

        <Note tone="info">
          Reversing text is useful for puzzles, mirrored displays and testing. Some scripts and
          combined emoji are made of multiple Unicode code points; reversing can separate those
          sequences visually, so check the result before publishing.
        </Note>
      </div>
    </Workspace>
  );
}
