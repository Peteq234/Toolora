import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { Link } from "@/lib/router";
import {
  Button,
  CopyButton,
  Note,
  StatTile,
  Workspace,
} from "@/components/ui";
import { downloadFile, formatNumber } from "@/lib/utils";

/* ------------------------------- word counter ------------------------------ */

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "did", "do",
  "does", "for", "from", "had", "has", "have", "he", "her", "here", "him", "his", "how", "i",
  "if", "in", "into", "is", "it", "its", "just", "me", "more", "most", "my", "no", "not", "of",
  "on", "or", "our", "out", "she", "should", "so", "some", "such", "than", "that", "the", "their",
  "them", "then", "there", "these", "they", "this", "those", "to", "too", "up", "us", "very",
  "was", "we", "were", "what", "when", "where", "which", "who", "why", "will", "with", "would",
  "you", "your", "about", "also", "any", "because", "been", "being", "both", "each", "few",
]);

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu;

function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours}h ${rest}m`;
}

export function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed.match(WORD_PATTERN) ?? [];
    const wordCount = words.length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed
      ? (trimmed.match(/[^.!?…]+[.!?…]*/g) ?? []).filter((sentence) => sentence.trim().length > 0)
          .length
      : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((block) => block.trim()).length : 0;
    const lines = text ? text.split(/\n/).length : 0;
    const reading = wordCount / 200;
    const speaking = wordCount / 130;

    const counts = new Map<string, number>();
    for (const word of words) {
      const normalized = word.toLowerCase();
      if (normalized.length < 2 || STOP_WORDS.has(normalized)) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    const keywords = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([word, count]) => ({
        word,
        count,
        density: wordCount ? (count / wordCount) * 100 : 0,
      }));

    return {
      wordCount,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      lines,
      reading,
      speaking,
      keywords,
    };
  }, [text]);

  return (
    <Workspace slug="word-counter">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="word-counter-text" className="text-[13px] font-semibold text-mist-200">
              Your text
            </label>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
              live counting · nothing uploaded
            </span>
          </div>
          <textarea
            id="word-counter-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="Start typing or paste your draft here…"
            className="field-input min-h-[240px] resize-y font-normal text-[14px] leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton value={text} label="Copy text" copiedLabel="Copied" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadFile(text, "toolora-text.txt")}
              disabled={!text}
            >
              <Icon name="download" size={14} />
              Download .txt
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Icon name="trash" size={14} />
              Clear
            </Button>
            <Link
              href="/tools/case-converter"
              className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200"
            >
              Need to change the case?
              <Icon name="arrowUpRight" size={12} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Words" value={formatNumber(stats.wordCount)} />
          <StatTile label="Characters" value={formatNumber(stats.characters)} hint="with spaces" />
          <StatTile label="No spaces" value={formatNumber(stats.charactersNoSpaces)} />
          <StatTile label="Sentences" value={formatNumber(stats.sentences)} />
          <StatTile label="Paragraphs" value={formatNumber(stats.paragraphs)} />
          <StatTile label="Lines" value={formatNumber(stats.lines)} />
          <StatTile label="Reading time" value={formatReadingTime(stats.reading)} hint="200 wpm" />
          <StatTile label="Speaking time" value={formatReadingTime(stats.speaking)} hint="130 wpm" />
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-mist-200">Keyword density</h3>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-600">
              common words excluded
            </span>
          </div>
          {stats.keywords.length === 0 ? (
            <p className="mt-3 text-[12px] text-mist-500">
              Add a few sentences to see your most repeated meaningful words.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {stats.keywords.map((keyword) => {
                const maxCount = stats.keywords[0]?.count || 1;
                return (
                  <li key={keyword.word} className="grid grid-cols-[110px_1fr_72px] items-center gap-3">
                    <span className="truncate font-mono text-[11.5px] text-mist-300">
                      {keyword.word}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <span
                        className="block h-full rounded-full bg-brand-400/80"
                        style={{ width: `${Math.max(6, (keyword.count / maxCount) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-[10px] text-mist-500">
                      {keyword.count}× · {keyword.density.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Note tone="info">
          Counts follow common word-processor conventions: hyphenated words count once and symbols
          alone don't count as words. Reading and speaking times are estimates, not limits.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- case converter ---------------------------- */

type CaseAction = {
  id: string;
  label: string;
  preview: string;
  transform: (input: string) => string;
};

function words(text: string): string[] {
  return text.match(WORD_PATTERN) ?? [];
}

function titleCase(text: string): string {
  return text.replace(WORD_PATTERN, (word) => {
    const lower = word.toLocaleLowerCase();
    return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
  });
}

function sentenceCase(text: string): string {
  const lowered = text.toLocaleLowerCase();
  return lowered.replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_match, prefix: string, letter: string) => {
    return `${prefix}${letter.toLocaleUpperCase()}`;
  });
}

function camelCase(text: string): string {
  return words(text)
    .map((word, index) => {
      const lower = word.toLocaleLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
    })
    .join("");
}

function pascalCase(text: string): string {
  return words(text)
    .map((word) => {
      const lower = word.toLocaleLowerCase();
      return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
    })
    .join("");
}

function alternatingCase(text: string): string {
  let counter = 0;
  return [...text]
    .map((character) => {
      if (!/[a-zA-Z]/.test(character)) return character;
      const result = counter % 2 === 0 ? character.toLocaleLowerCase() : character.toLocaleUpperCase();
      counter += 1;
      return result;
    })
    .join("");
}

function inverseCase(text: string): string {
  return [...text]
    .map((character) => {
      if (!/[a-zA-Z]/.test(character)) return character;
      return character === character.toLocaleUpperCase()
        ? character.toLocaleLowerCase()
        : character.toLocaleUpperCase();
    })
    .join("");
}

const CASE_ACTIONS: CaseAction[] = [
  { id: "upper", label: "UPPERCASE", preview: "DESIGN TOOLS", transform: (text) => text.toLocaleUpperCase() },
  { id: "lower", label: "lowercase", preview: "design tools", transform: (text) => text.toLocaleLowerCase() },
  { id: "title", label: "Title Case", preview: "Design Tools", transform: titleCase },
  { id: "sentence", label: "Sentence case", preview: "Design tools for everyone.", transform: sentenceCase },
  { id: "camel", label: "camelCase", preview: "designTools", transform: camelCase },
  { id: "pascal", label: "PascalCase", preview: "DesignTools", transform: pascalCase },
  { id: "snake", label: "snake_case", preview: "design_tools", transform: (text) => words(text).map((word) => word.toLocaleLowerCase()).join("_") },
  { id: "kebab", label: "kebab-case", preview: "design-tools", transform: (text) => words(text).map((word) => word.toLocaleLowerCase()).join("-") },
  { id: "alternating", label: "aLtErNaTiNg", preview: "DeSiGn ToOlS", transform: alternatingCase },
  { id: "inverse", label: "InVeRsE", preview: "dESIGN tOOLS", transform: inverseCase },
];

const SAMPLE_TEXT = "Toolora keeps everyday tools simple, fast, and private.";

export function CaseConverter() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [history, setHistory] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("");

  const wordCount = words(text).length;

  function apply(action: CaseAction) {
    setHistory((current) => [text, ...current].slice(0, 10));
    setText(action.transform(text));
    setLastAction(action.label);
  }

  function undo() {
    setHistory((current) => {
      if (current.length === 0) return current;
      setText(current[0]);
      return current.slice(1);
    });
  }

  return (
    <Workspace slug="case-converter">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="case-text" className="text-[13px] font-semibold text-mist-200">
              Your text
            </label>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
              {wordCount} words · {text.length} characters
            </span>
          </div>
          <textarea
            id="case-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={8}
            placeholder="Type or paste text, then pick a case below…"
            className="field-input min-h-[200px] resize-y text-[14px] leading-relaxed"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-mist-200">Choose a case</p>
            {lastAction && (
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-300/80">
                applied: {lastAction}
              </span>
            )}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CASE_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => apply(action)}
                disabled={!text}
                className="group flex flex-col items-start gap-1 rounded-xl border border-white/[0.08] bg-white/[0.022] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand-400/30 hover:bg-brand-400/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="font-mono text-[11.5px] font-medium text-mist-200 group-hover:text-brand-200">
                  {action.label}
                </span>
                <span className="truncate font-mono text-[9px] text-mist-600">{action.preview}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={text} label="Copy text" copiedLabel="Copied" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadFile(text, "toolora-text.txt")}
            disabled={!text}
          >
            <Icon name="download" size={14} />
            Download .txt
          </Button>
          <Button variant="secondary" size="sm" onClick={undo} disabled={history.length === 0}>
            <Icon name="arrowLeft" size={14} />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setHistory((current) => [text, ...current].slice(0, 10));
              setText("");
              setLastAction("Cleared");
            }}
            disabled={!text}
          >
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        <Note tone="info">
          Transformations apply to the text above, so you can chain them. Line breaks and punctuation
          are preserved. Title Case capitalises every word — adjust short words manually if you
          follow a specific style guide.
        </Note>
      </div>
    </Workspace>
  );
}
