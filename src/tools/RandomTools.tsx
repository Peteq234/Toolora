import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { formatNumber, parseNumeric, pickRandom, randomInt } from "@/lib/utils";

/* --------------------------- random number generator ----------------------- */

const DICE_PRESETS = [
  { label: "D6", min: 1, max: 6 },
  { label: "D20", min: 1, max: 20 },
  { label: "1–100", min: 1, max: 100 },
  { label: "Lottery 1–49", min: 1, max: 49 },
];

export function RandomNumberGenerator() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("5");
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [sorted, setSorted] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<number[][]>([]);

  const minNumber = parseNumeric(min);
  const maxNumber = parseNumeric(max);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generate() {
    const low = parseNumeric(min);
    const high = parseNumeric(max);
    const amount = parseNumeric(count);

    if (!Number.isInteger(low) || !Number.isInteger(high)) {
      setError("Minimum and maximum must be whole numbers.");
      return;
    }
    if (low > high) {
      setError("The minimum cannot be larger than the maximum.");
      return;
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      setError("Choose how many numbers you need, between 1 and 100.");
      return;
    }
    const range = high - low + 1;
    if (!allowDuplicates && amount > range) {
      setError(`That range only contains ${range} distinct values. Reduce the count or allow duplicates.`);
      return;
    }

    const output: number[] = [];
    const used = new Set<number>();
    let guard = 0;
    while (output.length < amount && guard < 5000) {
      const value = randomInt(low, high);
      if (allowDuplicates || !used.has(value)) {
        output.push(value);
        used.add(value);
      }
      guard += 1;
    }

    const final = sorted ? [...output].sort((a, b) => a - b) : output;
    setResults(final);
    setError("");
    setHistory((current) => [final, ...current].slice(0, 4));
  }

  function applyPreset(preset: (typeof DICE_PRESETS)[number]) {
    setMin(String(preset.min));
    setMax(String(preset.max));
    setCount("1");
    setError("");
    const value = randomInt(preset.min, preset.max);
    setResults([value]);
    setHistory((current) => [[value], ...current].slice(0, 4));
  }

  const summary = useMemo(() => {
    if (results.length === 0) return null;
    const sum = results.reduce((total, value) => total + value, 0);
    return { sum, average: sum / results.length, smallest: Math.min(...results), largest: Math.max(...results) };
  }, [results]);

  const rangeIsValid =
    Number.isInteger(minNumber) && Number.isInteger(maxNumber) && minNumber <= maxNumber;

  return (
    <Workspace slug="random-number-generator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum" htmlFor="rn-min" hint="inclusive">
            <Input id="rn-min" type="number" value={min} onChange={(event) => setMin(event.target.value)} className="font-mono" />
          </Field>
          <Field label="Maximum" htmlFor="rn-max" hint="inclusive">
            <Input id="rn-max" type="number" value={max} onChange={(event) => setMax(event.target.value)} className="font-mono" />
          </Field>
          <Field label="How many" htmlFor="rn-count" hint="1–100">
            <Input id="rn-count" type="number" min={1} max={100} value={count} onChange={(event) => setCount(event.target.value)} className="font-mono" />
          </Field>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Allow duplicates" description="The same number may appear more than once" checked={allowDuplicates} onChange={setAllowDuplicates} />
          <Toggle label="Sort results" description="Show numbers from smallest to largest" checked={sorted} onChange={setSorted} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generate}>
            <Icon name="dice" size={15} />
            Generate numbers
          </Button>
          <CopyButton value={results.join(", ")} label="Copy result" copiedLabel="Copied" />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Presets</span>
            {DICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-md border border-white/8 bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-mist-400 transition hover:border-white/15 hover:text-mist-100"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <Note tone="warn">{error}</Note>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-10 text-center text-[13px] text-mist-500">
            Your numbers will appear here.
          </div>
        ) : results.length === 1 ? (
          <ResultCard
            label="Your random number"
            value={formatNumber(results[0])}
            hint={`Drawn from ${formatNumber(minNumber)} to ${formatNumber(maxNumber)} with secure randomness.`}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {results.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="grid h-11 place-items-center rounded-lg border border-white/8 bg-ink-900 font-mono text-[13px] text-mist-100"
                >
                  {formatNumber(value)}
                </span>
              ))}
            </div>
            {summary && (
              <div className="grid gap-2 sm:grid-cols-4">
                <StatTile label="Sum" value={formatNumber(summary.sum)} />
                <StatTile label="Average" value={formatNumber(summary.average, 2)} />
                <StatTile label="Lowest" value={formatNumber(summary.smallest)} />
                <StatTile label="Highest" value={formatNumber(summary.largest)} />
              </div>
            )}
          </div>
        )}

        {history.length > 1 && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">Earlier draws</p>
            <div className="mt-2 space-y-1.5">
              {history.slice(1).map((entry, index) => (
                <p key={index} className="truncate rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-1.5 font-mono text-[11px] text-mist-400">
                  {entry.join(", ")}
                </p>
              ))}
            </div>
          </div>
        )}

        <Note tone="info">
          Results use your browser's cryptographically secure random source with rejection sampling,
          so every integer in the range has an equal chance. This range
          {rangeIsValid ? ` contains ${formatNumber(maxNumber - minNumber + 1)} possible values` : " is not valid yet"}.
          Not suitable for lottery tickets or cryptographic keys.
        </Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------- random choice ------------------------------- */

type SpinState = "idle" | "spinning" | "done";

export function RandomChoicePicker() {
  const [rawOptions, setRawOptions] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [display, setDisplay] = useState("");
  const [winner, setWinner] = useState("");
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [winners, setWinners] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const options = useMemo(() => {
    const lines = rawOptions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return dedupe ? [...new Set(lines)] : lines;
  }, [rawOptions, dedupe]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function pick() {
    if (options.length < 2 || spinState === "spinning") return;
    setSpinState("spinning");
    setWinner("");
    const localOptions = options;
    intervalRef.current = window.setInterval(() => {
      setDisplay(pickRandom(localOptions));
    }, 70);
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      const chosen = pickRandom(localOptions);
      setDisplay(chosen);
      setWinner(chosen);
      setSpinState("done");
      setWinners((current) => [chosen, ...current].slice(0, 8));
      if (removeWinner) {
        setRawOptions((current) => {
          const lines = current.split("\n");
          const index = lines.findIndex((line) => line.trim() === chosen);
          if (index === -1) return current;
          return lines.filter((_, lineIndex) => lineIndex !== index).join("\n");
        });
      }
    }, 850);
  }

  return (
    <Workspace slug="random-choice-picker">
      <div className="space-y-5">
        <Field
          label="Your options"
          htmlFor="choice-list"
          hint={`${options.length} ${options.length === 1 ? "option" : "options"}`}
        >
          <textarea
            id="choice-list"
            value={rawOptions}
            onChange={(event) => setRawOptions(event.target.value)}
            rows={7}
            placeholder={"One option per line\nPizza\nSushi\nTacos\nSalad"}
            className="field-input resize-y font-mono text-[13px] leading-relaxed"
          />
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Ignore duplicates" description="Treat repeated lines as one option" checked={dedupe} onChange={setDedupe} />
          <Toggle label="Remove the winner" description="Draw from the remaining options afterwards" checked={removeWinner} onChange={setRemoveWinner} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={pick} disabled={options.length < 2 || spinState === "spinning"} size="lg">
            <Icon name={spinState === "spinning" ? "refresh" : "shuffle"} size={16} className={spinState === "spinning" ? "animate-spin" : ""} />
            {spinState === "spinning" ? "Choosing…" : "Pick a winner"}
          </Button>
          <CopyButton value={options.join("\n")} label="Copy list" copiedLabel="Copied" />
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setRawOptions("");
              setWinner("");
              setDisplay("");
              setWinners([]);
              setSpinState("idle");
            }}
            disabled={!rawOptions && !winners.length}
          >
            <Icon name="trash" size={14} />
            Clear
          </Button>
        </div>

        <div
          aria-live="polite"
          aria-busy={spinState === "spinning"}
          className="grid min-h-[188px] place-items-center overflow-hidden rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-400/[0.1] via-white/[0.02] to-transparent px-5 py-8 text-center"
        >
          {spinState === "idle" ? (
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-xl border border-white/10 bg-ink-900/60 text-mist-400">
                <Icon name="shuffle" size={19} />
              </span>
              <p className="mt-3 text-[13.5px] font-semibold text-mist-200">A fair draw starts here</p>
              <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-mist-500">
                Add at least two options, then pick once. Every line gets the same chance.
              </p>
            </div>
          ) : spinState === "spinning" ? (
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-200/70">
                Shuffling
              </p>
              <p className="mt-3 break-words font-mono text-2xl text-mist-200 sm:text-3xl">{display}</p>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-200/80">
                The winner is
              </p>
              <p className="mt-3 break-words font-mono text-[28px] leading-tight text-mist-50 sm:text-[36px]">
                {winner}
              </p>
              <button
                type="button"
                onClick={() => {
                  setWinner("");
                  setSpinState("idle");
                }}
                className="mt-4 text-[11.5px] font-medium text-mist-400 underline decoration-white/20 underline-offset-4 transition hover:text-mist-100"
              >
                Draw again
              </button>
            </div>
          )}
        </div>

        {winners.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
              Recent
            </span>
            {winners.slice(1).map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="rounded-full border border-white/8 bg-white/[0.025] px-2.5 py-1 text-[11px] text-mist-400"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <Note tone="info">
          Winner selection uses secure randomness, not list order. Your options stay in this page —
          nothing is uploaded or saved. For a public giveaway, check the competition rules where you
          live.
        </Note>
      </div>
    </Workspace>
  );
}


