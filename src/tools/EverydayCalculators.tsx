import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Select,
  StatTile,
  Workspace,
} from "@/components/ui";
import { formatNumber, parseNumeric } from "@/lib/utils";
import { R, decimal, formatRational, rational, type Rational } from "@/lib/rational";

/* --------------------------- percentage change ---------------------------- */

export function PercentageChangeCalculator() {
  const [original, setOriginal] = useState("250");
  const [updated, setUpdated] = useState("310");

  const both = parseNumeric(original);
  const next = parseNumeric(updated);
  const valid = Number.isFinite(both) && Number.isFinite(next) && both !== 0;
  const change = valid ? ((next - both) / Math.abs(both)) * 100 : Number.NaN;
  const direction = !valid ? null : change > 0 ? "increase" : change < 0 ? "decrease" : "no change";
  const difference = valid ? next - both : Number.NaN;
  const multiplier = valid ? next / both : Number.NaN;

  return (
    <Workspace slug="percentage-increase-calculator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original value" htmlFor="pct-original">
            <Input id="pct-original" type="number" inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} className="font-mono" />
          </Field>
          <Field label="New value" htmlFor="pct-new">
            <Input id="pct-new" type="number" inputMode="decimal" value={updated} onChange={(e) => setUpdated(e.target.value)} className="font-mono" />
          </Field>
        </div>

        {!valid ? (
          <Note tone="warn">{both === 0 ? "The original value cannot be zero — percentage change is undefined from zero." : "Enter two numbers to compare."}</Note>
        ) : (
          <>
            <ResultCard
              label={`Percentage ${direction}`}
              value={`${change > 0 ? "+" : ""}${formatNumber(change, 2)}`}
              suffix="%"
              hint={`(${formatNumber(next)} − ${formatNumber(both)}) ÷ ${formatNumber(Math.abs(both))} × 100 = ${formatNumber(change, 2)}%`}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Difference" value={`${difference > 0 ? "+" : ""}${formatNumber(difference, 2)}`} />
              <StatTile label="Multiplier" value={`${formatNumber(multiplier, 4)}×`} />
              <StatTile label="Original" value={formatNumber(both)} />
              <StatTile label="New" value={formatNumber(next)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={`${change >= 0 ? "+" : ""}${formatNumber(change, 2)}% (${direction})`} label="Copy result" copiedLabel="Copied" />
              <Button variant="ghost" size="sm" onClick={() => { setOriginal(updated); setUpdated(original); }}>
                <Icon name="arrowUpDown" size={14} /> Reverse
              </Button>
            </div>
          </>
        )}

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <p className="text-[12px] font-semibold text-mist-200">Worked examples</p>
          <ul className="mt-2 space-y-1.5 text-[11.5px] text-mist-500">
            <li>• 80 → 100 is a <span className="text-mist-200">+25%</span> increase.</li>
            <li>• 100 → 80 is a <span className="text-mist-200">−20%</span> decrease (the base changes).</li>
            <li>• A 25% rise followed by a 25% fall returns to 93.75%, not 100%.</li>
          </ul>
        </div>

        <Note tone="info">
          The change is measured relative to the original value. Negative original values use their
          absolute value as the base, which keeps the direction intuitive. This is different from the
          three-mode{" "}
          <a href="/tools/percentage-calculator" className="text-brand-200 underline decoration-brand-400/30 underline-offset-2">
            percentage calculator
          </a>.
        </Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- discount -------------------------------- */

export function DiscountCalculator() {
  const [price, setPrice] = useState("249.99");
  const [discount, setDiscount] = useState("30");
  const [tax, setTax] = useState("0");
  const [extra, setExtra] = useState("0");

  const base = parseNumeric(price);
  const percent = parseNumeric(discount);
  const taxRate = parseNumeric(tax) || 0;
  const extraOff = parseNumeric(extra) || 0;
  const valid = Number.isFinite(base) && base >= 0 && Number.isFinite(percent) && percent >= 0 && percent <= 100;

  const savingsFromPercent = valid ? (base * percent) / 100 : 0;
  const afterPercent = valid ? base - savingsFromPercent : 0;
  const afterExtra = Math.max(0, afterPercent - extraOff);
  const taxAmount = (afterExtra * taxRate) / 100;
  const total = afterExtra + taxAmount;
  const totalSaved = valid ? base - afterExtra : 0;
  const effectiveDiscount = valid && base > 0 ? (totalSaved / base) * 100 : 0;

  return (
    <Workspace slug="discount-calculator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original price" htmlFor="discount-price">
            <Input id="discount-price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Discount" htmlFor="discount-percent" hint="0–100%">
            <Input id="discount-percent" type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Extra fixed discount" htmlFor="discount-extra" optional>
            <Input id="discount-extra" type="number" min={0} step="0.01" value={extra} onChange={(e) => setExtra(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Sales tax / VAT" htmlFor="discount-tax" hint="optional %">
            <Input id="discount-tax" type="number" min={0} step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} className="font-mono" />
          </Field>
        </div>

        {!valid ? (
          <Note tone="warn">Enter a non-negative price and a discount between 0 and 100%.</Note>
        ) : (
          <>
            <ResultCard
              label="Final price"
              value={formatNumber(total, 2)}
              hint={`You save ${formatNumber(totalSaved, 2)} — an effective ${formatNumber(effectiveDiscount, 2)}% off.`}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Discount amount" value={formatNumber(savingsFromPercent, 2)} />
              <StatTile label="After discount" value={formatNumber(afterExtra, 2)} />
              <StatTile label="Tax added" value={formatNumber(taxAmount, 2)} />
              <StatTile label="Total saved" value={formatNumber(totalSaved, 2)} />
            </div>
            <CopyButton
              value={`Original ${formatNumber(base, 2)} → final ${formatNumber(total, 2)}. Discount ${formatNumber(percent, 2)}%${extraOff ? ` plus ${formatNumber(extraOff, 2)} extra off` : ""}${taxRate ? ` plus ${formatNumber(taxRate, 2)}% tax` : ""}. Saved ${formatNumber(totalSaved, 2)}.`}
              label="Copy breakdown"
              copiedLabel="Copied"
            />
          </>
        )}

        <Note tone="info">
          The percentage is applied first, then any fixed extra discount, then tax on the reduced
          price. Retailers may round differently or apply tax before discounts — check the receipt if
          the numbers must match exactly.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- average -------------------------------- */

function parseList(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));
}

export function AverageCalculator() {
  const [raw, setRaw] = useState("12, 18, 9, 24, 18, 30");

  const numbers = useMemo(() => parseList(raw), [raw]);
  const stats = useMemo(() => {
    if (numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((total, value) => total + value, 0);
    const mean = sum / numbers.length;
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const counts = new Map<number, number>();
    numbers.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    const highest = Math.max(...counts.values());
    const modes = [...counts.entries()].filter(([, count]) => count === highest).map(([value]) => value);
    const variance = numbers.reduce((total, value) => total + (value - mean) ** 2, 0) / numbers.length;
    return {
      count: numbers.length,
      sum,
      mean,
      median,
      mode: highest === 1 ? "none (all unique)" : modes.map((value) => formatNumber(value)).join(", "),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0],
      stdDev: Math.sqrt(variance),
    };
  }, [numbers]);

  return (
    <Workspace slug="average-calculator">
      <div className="space-y-5">
        <Field label="Your numbers" htmlFor="average-input" hint="separate with commas, spaces or new lines">
          <textarea
            id="average-input"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="10, 20, 30"
            className="field-input resize-y font-mono text-[13px] leading-relaxed"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRaw("-5, 2.5, 10, 10, 18")}>
            <Icon name="fileText" size={13} /> Load example
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRaw("")} disabled={!raw}>
            <Icon name="trash" size={13} /> Clear
          </Button>
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
            {numbers.length} valid {numbers.length === 1 ? "number" : "numbers"}
          </span>
        </div>

        {!stats ? (
          <Note tone="warn">Enter at least one number. Letters are ignored, so check the count above if a value is missing.</Note>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Mean" value={formatNumber(stats.mean, 6)} />
              <StatTile label="Median" value={formatNumber(stats.median, 6)} />
              <StatTile label="Mode" value={stats.mode} />
              <StatTile label="Count" value={formatNumber(stats.count)} />
              <StatTile label="Sum" value={formatNumber(stats.sum, 6)} />
              <StatTile label="Smallest" value={formatNumber(stats.min, 6)} />
              <StatTile label="Largest" value={formatNumber(stats.max, 6)} />
              <StatTile label="Range" value={formatNumber(stats.range, 6)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <StatTile label="Standard deviation (population)" value={formatNumber(stats.stdDev, 6)} hint="for the full set, not a sample estimate" />
              <StatTile label="Sorted input" value={<span className="break-all font-mono text-[11px]">{[...numbers].sort((a, b) => a - b).join(", ")}</span>} />
            </div>
            <CopyButton
              value={`Count: ${stats.count}\nSum: ${formatNumber(stats.sum, 6)}\nMean: ${formatNumber(stats.mean, 6)}\nMedian: ${formatNumber(stats.median, 6)}\nMode: ${stats.mode}\nRange: ${formatNumber(stats.range, 6)}\nPopulation SD: ${formatNumber(stats.stdDev, 6)}`}
              label="Copy statistics"
              copiedLabel="Copied"
            />
          </>
        )}

        <Note tone="info">
          Mean is the arithmetic average. Median is the middle value when sorted, which is less
          affected by outliers. Range is largest minus smallest. The standard deviation here
          describes the entered set as a population; for a sample estimate of a wider population,
          divide by n − 1 instead.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------------- grade --------------------------------- */

type GradeRow = { id: string; name: string; score: string; weight: string };
let gradeRowId = 0;
const newGradeRow = (name = ""): GradeRow => {
  gradeRowId += 1;
  return { id: `grade-${gradeRowId}`, name, score: "", weight: "" };
};

function letterFor(percent: number): string {
  if (percent >= 97) return "A+";
  if (percent >= 93) return "A";
  if (percent >= 90) return "A−";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B−";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C−";
  if (percent >= 67) return "D+";
  if (percent >= 63) return "D";
  if (percent >= 60) return "D−";
  return "F";
}

export function GradeCalculator() {
  const [rows, setRows] = useState<GradeRow[]>([
    { ...newGradeRow("Assignments"), score: "88", weight: "30" },
    { ...newGradeRow("Tests"), score: "76", weight: "40" },
    { ...newGradeRow("Final exam"), score: "0", weight: "30" },
  ]);
  const [target, setTarget] = useState("90");

  const parsed = rows
    .map((row) => ({ ...row, scoreValue: parseNumeric(row.score), weightValue: parseNumeric(row.weight) }))
    .filter((row) => Number.isFinite(row.scoreValue) && Number.isFinite(row.weightValue) && row.weightValue > 0);

  const totalWeight = parsed.reduce((total, row) => total + row.weightValue, 0);
  const weighted = parsed.reduce((total, row) => total + row.scoreValue * row.weightValue, 0);
  const average = totalWeight > 0 ? weighted / totalWeight : Number.NaN;
  const valid = Number.isFinite(average) && parsed.every((row) => row.scoreValue >= 0 && row.scoreValue <= 150);

  const finalRow = rows.find((row) => /final/i.test(row.name));
  const finalWeight = finalRow ? parseNumeric(finalRow.weight) : Number.NaN;
  const currentRows = parsed.filter((row) => row.name !== finalRow?.name);
  const currentWeight = currentRows.reduce((total, row) => total + row.weightValue, 0);
  const currentAverage = currentWeight > 0
    ? currentRows.reduce((total, row) => total + row.scoreValue * row.weightValue, 0) / currentWeight
    : Number.NaN;
  const targetValue = parseNumeric(target);
  const needed =
    Number.isFinite(currentAverage) && Number.isFinite(finalWeight) && finalWeight > 0 && finalWeight < 100 && Number.isFinite(targetValue)
      ? (targetValue - currentAverage * (1 - finalWeight / 100)) / (finalWeight / 100)
      : Number.NaN;

  function updateRow(id: string, patch: Partial<GradeRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <Workspace slug="grade-calculator">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-mist-200">Grade components</p>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">
              total weight {formatNumber(totalWeight, 2)}%
            </span>
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_72px_72px_30px] items-end gap-2 rounded-xl border border-white/[0.07] bg-white/[0.015] p-2">
                <Input value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} aria-label="Component name" placeholder="Component" className="h-9 text-[12px]" />
                <Input value={row.score} onChange={(e) => updateRow(row.id, { score: e.target.value })} aria-label={`${row.name || "Component"} score`} type="number" placeholder="Score" className="h-9 font-mono text-[12px]" />
                <Input value={row.weight} onChange={(e) => updateRow(row.id, { weight: e.target.value })} aria-label={`${row.name || "Component"} weight`} type="number" placeholder="Weight" className="h-9 font-mono text-[12px]" />
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                  aria-label={`Remove ${row.name || "component"}`}
                  className="grid size-8 place-items-center rounded-lg border border-white/8 text-mist-500 transition hover:border-rose-400/30 hover:text-rose-300"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRows((current) => [...current, newGradeRow()])}>
              <Icon name="plus" size={13} /> Add component
            </Button>
            <span className="self-center font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">score % · weight %</span>
          </div>
        </div>

        {!valid ? (
          <Note tone="warn">Enter a score between 0 and 150 and a positive weight for at least one component.</Note>
        ) : (
          <>
            <ResultCard
              label="Weighted grade"
              value={formatNumber(average, 2)}
              suffix="%"
              hint={`Letter grade ${letterFor(average)} · based on ${parsed.length} graded ${parsed.length === 1 ? "component" : "components"} totalling ${formatNumber(totalWeight, 2)}% weight`}
            />
            {Math.abs(totalWeight - 100) > 0.01 && (
              <Note tone="warn">
                Weights add up to {formatNumber(totalWeight, 2)}%, not 100%. The result is normalised
                to the weights entered, so include every graded component for an accurate course grade.
              </Note>
            )}
          </>
        )}

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <p className="text-[12px] font-semibold text-mist-200">What do I need on the final?</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="Target course grade" htmlFor="grade-target" hint="%">
              <Input id="grade-target" type="number" min={0} max={100} value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono" />
            </Field>
            <div className="flex items-end">
              <p className="text-[11px] leading-relaxed text-mist-500">
                Uses the component named “Final exam”, its weight, and the other rows as your current grade.
              </p>
            </div>
          </div>
          {Number.isFinite(needed) ? (
            <div className="mt-3 rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2.5">
              <p className="text-[12px] text-mist-300">
                You need about{" "}
                <span className="font-mono text-[15px] font-semibold text-brand-200">{formatNumber(needed, 1)}%</span>{" "}
                on the final to reach {formatNumber(targetValue, 1)}% overall
                {needed > 100 && " — above the maximum score, so the target is not reachable with this final alone"}.
              </p>
              <p className="mt-1 text-[10.5px] text-mist-500">
                Current grade among other components: {formatNumber(currentAverage, 1)}% · final weight {formatNumber(finalWeight, 1)}%.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[11.5px] text-mist-500">
              Add a component named “Final exam” with its weight (below 100%) to see the score needed.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton
            value={valid ? `Weighted grade: ${formatNumber(average, 2)}% (${letterFor(average)}).${Number.isFinite(needed) ? ` Needs ${formatNumber(needed, 1)}% on the final for ${formatNumber(targetValue, 1)}%.` : ""}` : ""}
            label="Copy result"
            copiedLabel="Copied"
          />
          <Button variant="ghost" size="sm" onClick={() => setRows([newGradeRow()])}>
            <Icon name="refresh" size={13} /> Start over
          </Button>
        </div>

        <Note tone="info">
          Letter grades use a common US-style scale (A 93+, A− 90+, B 83+, …). Schools differ, so the
          percentage is the reliable figure. Scores above 100% are allowed for extra credit.
        </Note>
      </div>
    </Workspace>
  );
}

/* --------------------------- cooking measurement --------------------------- */

type KitchenSystem = "us" | "metric";
type KitchenCategory = "volume" | "weight" | "temperature";

const US_UNITS: Record<string, { label: string; ml: Rational }> = {
  tsp: { label: "Teaspoon (US)", ml: rational(492892159375n, 100000000000n) },
  tbsp: { label: "Tablespoon (US)", ml: rational(492892159375n * 3n, 100000000000n) },
  floz: { label: "Fluid ounce (US)", ml: rational(492892159375n * 6n, 100000000000n) },
  cup: { label: "Cup (US, 8 fl oz)", ml: rational(492892159375n * 48n, 100000000000n) },
  pint: { label: "Pint (US)", ml: rational(492892159375n * 96n, 100000000000n) },
  quart: { label: "Quart (US)", ml: rational(492892159375n * 192n, 100000000000n) },
  gallon: { label: "Gallon (US)", ml: rational(492892159375n * 768n, 100000000000n) },
  ml: { label: "Millilitre", ml: rational(1n) },
  l: { label: "Litre", ml: rational(1000n) },
};

const METRIC_UNITS: Record<string, { label: string; ml: Rational }> = {
  tsp: { label: "Teaspoon (metric, 5 mL)", ml: rational(5n) },
  tbsp: { label: "Tablespoon (metric, 15 mL)", ml: rational(15n) },
  cup: { label: "Cup (metric, 250 mL)", ml: rational(250n) },
  ml: { label: "Millilitre", ml: rational(1n) },
  l: { label: "Litre", ml: rational(1000n) },
};

const WEIGHT_UNITS: Record<string, { label: string; g: Rational }> = {
  g: { label: "Gram", g: rational(1n) },
  kg: { label: "Kilogram", g: rational(1000n) },
  oz: { label: "Ounce", g: rational(28349523125n, 1000000000n) },
  lb: { label: "Pound", g: rational(28349523125n * 16n, 1000000000n) },
  stick: { label: "Stick of butter (US, ½ cup)", g: rational(1133980925n, 10000000n) },
};

export function CookingConverter() {
  const [system, setSystem] = useState<KitchenSystem>("us");
  const [category, setCategory] = useState<KitchenCategory>("volume");
  const [from, setFrom] = useState("cup");
  const [to, setTo] = useState("ml");
  const [value, setValue] = useState("1");

  const amount = decimal(value);
  const volumeUnits = system === "us" ? US_UNITS : METRIC_UNITS;

  const result = useMemo(() => {
    if (!amount) return null;
    if (category === "volume") {
      const fromUnit = volumeUnits[from] ?? Object.values(volumeUnits)[0];
      const toUnit = volumeUnits[to] ?? Object.values(volumeUnits)[1];
      return { value: R.div(R.mul(amount, fromUnit.ml), toUnit.ml), fromLabel: fromUnit.label, toLabel: toUnit.label };
    }
    if (category === "weight") {
      const fromUnit = WEIGHT_UNITS[from] ?? WEIGHT_UNITS.g;
      const toUnit = WEIGHT_UNITS[to] ?? WEIGHT_UNITS.kg;
      return { value: R.div(R.mul(amount, fromUnit.g), toUnit.g), fromLabel: fromUnit.label, toLabel: toUnit.label };
    }
    return null;
  }, [amount, category, from, to, volumeUnits]);

  const [temperature, setTemperature] = useState<"c" | "f">("c");
  const celsiusToFahrenheit = (c: Rational) => R.add(R.div(R.mul(c, rational(9n)), rational(5n)), rational(32n));
  const temperatureResult = amount
    ? temperature === "c"
      ? { value: celsiusToFahrenheit(amount), label: "Fahrenheit" }
      : { value: R.mul(R.sub(amount, rational(32n)), rational(5n, 9n)), label: "Celsius" }
    : null;

  const unitEntries = category === "volume" ? Object.entries(volumeUnits) : Object.entries(WEIGHT_UNITS);

  function changeCategory(nextCategory: KitchenCategory) {
    setCategory(nextCategory);
    if (nextCategory === "volume") {
      setFrom(system === "us" ? "cup" : "cup");
      setTo("ml");
    } else if (nextCategory === "weight") {
      setFrom("oz");
      setTo("g");
    }
  }

  function changeSystem(nextSystem: KitchenSystem) {
    setSystem(nextSystem);
    if (category === "volume") {
      setFrom("cup");
      setTo("ml");
    }
  }

  return (
    <Workspace slug="cooking-measurement-converter">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(["volume", "weight", "temperature"] as KitchenCategory[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeCategory(item)}
              aria-pressed={category === item}
              className={
                category === item
                  ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold capitalize text-brand-200"
                  : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] capitalize text-mist-400 transition hover:border-white/20 hover:text-mist-100"
              }
            >
              {item}
            </button>
          ))}
          {category === "volume" && (
            <div className="ml-auto flex gap-1">
              {(["us", "metric"] as KitchenSystem[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeSystem(item)}
                  aria-pressed={system === item}
                  className={
                    system === item
                      ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-200"
                      : "rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[11px] uppercase tracking-wide text-mist-400 transition hover:text-mist-100"
                  }
                >
                  {item === "us" ? "US customary" : "Metric cups"}
                </button>
              ))}
            </div>
          )}
        </div>

        {category === "temperature" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Value" htmlFor="cook-temp-value">
                <Input id="cook-temp-value" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-[15px]" />
              </Field>
              <Field label="Convert to" htmlFor="cook-temp-direction">
                <Select
                  id="cook-temp-direction"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value as "c" | "f")}
                  options={[
                    { value: "c", label: "Fahrenheit (from °C)" },
                    { value: "f", label: "Celsius (from °F)" },
                  ]}
                />
              </Field>
            </div>
            {!amount || !temperatureResult ? (
              <Note tone="warn">Enter a number to convert.</Note>
            ) : (
              <>
                <ResultCard
                  label={`Temperature in ${temperatureResult.label}`}
                  value={formatRational(temperatureResult.value, 2)}
                  suffix={temperature === "c" ? "°F" : "°C"}
                  hint={temperature === "c" ? "°F = (°C × 9/5) + 32" : "°C = (°F − 32) × 5/9"}
                />
                <CopyButton value={`${formatRational(temperatureResult.value, 2)}${temperature === "c" ? " °F" : " °C"}`} label="Copy result" copiedLabel="Copied" />
              </>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Amount" htmlFor="cook-value">
                <Input id="cook-value" type="number" inputMode="decimal" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-[15px]" />
              </Field>
              <Field label="From" htmlFor="cook-from">
                <Select id="cook-from" value={from} onChange={(e) => setFrom(e.target.value)} options={unitEntries.map(([id, unit]) => ({ value: id, label: unit.label }))} />
              </Field>
              <Field label="To" htmlFor="cook-to">
                <Select id="cook-to" value={to} onChange={(e) => setTo(e.target.value)} options={unitEntries.map(([id, unit]) => ({ value: id, label: unit.label }))} />
              </Field>
            </div>

            {!amount ? (
              <Note tone="warn">Use a number such as 1, 2.5 or 0.75.</Note>
            ) : result ? (
              <>
                <ResultCard
                  label="Converted amount"
                  value={formatRational(result.value, 4)}
                  hint={`${value} × ${result.fromLabel} → ${result.toLabel}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={formatRational(result.value, 4)} label="Copy result" copiedLabel="Copied" />
                  <Button variant="secondary" size="sm" onClick={() => { setFrom(to); setTo(from); }}>
                    <Icon name="arrowUpDown" size={14} /> Swap units
                  </Button>
                </div>
              </>
            ) : null}

            {amount && (
              <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                <p className="border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
                  {value} {unitEntries.find(([id]) => id === from)?.[1].label ?? ""} in common units
                </p>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {unitEntries.map(([id, unit]) => {
                    const base = "ml" in unit ? unit.ml : unit.g;
                    const fromBase = category === "volume" ? (volumeUnits[from] ?? volumeUnits.ml).ml : (WEIGHT_UNITS[from] ?? WEIGHT_UNITS.g).g;
                    const converted = R.div(R.mul(amount, fromBase), base);
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 border-b border-white/[0.04] px-3 py-1.5 text-[11.5px]">
                        <span className="text-mist-500">{unit.label}</span>
                        <span className="font-mono text-mist-200">{formatRational(converted, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <Note tone="info">
          US customary volumes use the exact US teaspoon (4.92892159375 mL), cup (236.5882365 mL) and
          pound (453.59237 g). Metric cups are 250 mL with 5 mL teaspoons and 15 mL tablespoons —
          always state which system a recipe uses. Conversions are computed with exact rational
          arithmetic, then rounded for display.
        </Note>
      </div>
    </Workspace>
  );
}
