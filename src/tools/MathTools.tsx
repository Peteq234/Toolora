import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  Select,
  StatTile,
  Workspace,
} from "@/components/ui";
import { clamp, formatNumber, parseNumeric } from "@/lib/utils";

/* --------------------------- percentage calculator ------------------------- */

type PercentMode = "of" | "is" | "change";

const PERCENT_MODES: { value: PercentMode; label: string }[] = [
  { value: "of", label: "X% of Y" },
  { value: "is", label: "X is what % of Y" },
  { value: "change", label: "Percent change" },
];

export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentMode>("of");
  const [a, setA] = useState("15");
  const [b, setB] = useState("200");

  const calculation = useMemo(() => {
    const x = parseNumeric(a);
    const y = parseNumeric(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { value: null as number | null, formula: "Enter two numbers to see the result.", label: "", suffix: "", note: "" };
    }

    if (mode === "of") {
      const value = (x / 100) * y;
      return {
        value,
        label: `${formatNumber(x)}% of ${formatNumber(y)}`,
        suffix: "",
        formula: `(${formatNumber(x)} ÷ 100) × ${formatNumber(y)} = ${formatNumber(value)}`,
        note: "To take a percentage off a price, subtract this result from the original amount.",
      };
    }
    if (mode === "is") {
      if (y === 0) {
        return { value: null, label: "Percentage relationship", suffix: "%", formula: `(${formatNumber(x)} ÷ ${formatNumber(y)}) × 100`, note: "Division by zero is undefined, so there is no percentage here." };
      }
      const value = (x / y) * 100;
      return {
        value,
        label: `${formatNumber(x)} as a share of ${formatNumber(y)}`,
        suffix: "%",
        formula: `(${formatNumber(x)} ÷ ${formatNumber(y)}) × 100 = ${formatNumber(value)}%`,
        note: "This answers the question: how large is the first number compared with the second?",
      };
    }

    if (x === 0) {
      return { value: null, label: "Percentage change", suffix: "%", formula: "((new − old) ÷ old) × 100", note: "Percentage change from zero is undefined — it cannot be expressed as a relative increase." };
    }
    const value = ((y - x) / x) * 100;
    const direction = value > 0 ? "increase" : value < 0 ? "decrease" : "no change";
    return {
      value,
      label: `From ${formatNumber(x)} to ${formatNumber(y)}`,
      suffix: "%",
      formula: `((${formatNumber(y)} − ${formatNumber(x)}) ÷ ${formatNumber(x)}) × 100 = ${formatNumber(value)}%`,
      note: `That is a ${direction}${value !== 0 ? ` of ${formatNumber(Math.abs(value))}%` : ""}.`,
    };
  }, [a, b, mode]);

  const copyValue =
    calculation.value === null ? "" : `${formatNumber(calculation.value, 4)}${calculation.suffix}`;

  return (
    <Workspace slug="percentage-calculator">
      <div className="space-y-5">
        <Segmented label="Percentage question" value={mode} onChange={setMode} options={PERCENT_MODES} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={
              mode === "of" ? "Percentage (X)" : mode === "is" ? "First value (X)" : "Original value"
            }
            htmlFor="percent-a"
          >
            <Input
              id="percent-a"
              type="number"
              inputMode="decimal"
              value={a}
              onChange={(event) => setA(event.target.value)}
              className="font-mono"
              placeholder="15"
            />
          </Field>
          <Field
            label={mode === "of" ? "Of value (Y)" : mode === "is" ? "Second value (Y)" : "New value"}
            htmlFor="percent-b"
          >
            <Input
              id="percent-b"
              type="number"
              inputMode="decimal"
              value={b}
              onChange={(event) => setB(event.target.value)}
              className="font-mono"
              placeholder="200"
            />
          </Field>
        </div>

        <ResultCard
          label={calculation.label || "Result"}
          value={calculation.value === null ? "—" : formatNumber(calculation.value, 4)}
          suffix={calculation.value === null ? undefined : calculation.suffix}
          hint={calculation.formula}
        />

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={copyValue} label="Copy result" copiedLabel="Copied" />
          <span className="text-[11.5px] text-mist-500">{calculation.note}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile label="Decimal" value={calculation.value === null ? "—" : formatNumber(calculation.value / (mode === "of" ? 100 : 1), 4)} hint="handy for formulas" />
          <StatTile label="Rounded" value={calculation.value === null ? "—" : `${formatNumber(calculation.value, 2)}${calculation.suffix}`} hint="two decimal places" />
          <StatTile label="Mode" value={<span className="font-sans text-[13px]">{PERCENT_MODES.find((item) => item.value === mode)?.label}</span>} />
        </div>

        <Note tone="info">
          Calculations use full precision, then round for display. Clear both fields if you want to
          start another question. Nothing is sent anywhere.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- unit converter ---------------------------- */

type UnitCategoryId = "length" | "weight" | "temperature" | "speed";

type Unit = { id: string; label: string; symbol: string; factor: number };

const UNIT_GROUPS: Record<
  UnitCategoryId,
  { label: string; units: Unit[]; defaults: { from: string; to: string } }
> = {
  length: {
    label: "Length",
    defaults: { from: "m", to: "ft" },
    units: [
      { id: "mm", label: "Millimetres", symbol: "mm", factor: 0.001 },
      { id: "cm", label: "Centimetres", symbol: "cm", factor: 0.01 },
      { id: "m", label: "Metres", symbol: "m", factor: 1 },
      { id: "km", label: "Kilometres", symbol: "km", factor: 1000 },
      { id: "in", label: "Inches", symbol: "in", factor: 0.0254 },
      { id: "ft", label: "Feet", symbol: "ft", factor: 0.3048 },
      { id: "yd", label: "Yards", symbol: "yd", factor: 0.9144 },
      { id: "mi", label: "Miles", symbol: "mi", factor: 1609.344 },
    ],
  },
  weight: {
    label: "Weight",
    defaults: { from: "kg", to: "lb" },
    units: [
      { id: "mg", label: "Milligrams", symbol: "mg", factor: 0.000001 },
      { id: "g", label: "Grams", symbol: "g", factor: 0.001 },
      { id: "kg", label: "Kilograms", symbol: "kg", factor: 1 },
      { id: "t", label: "Tonnes", symbol: "t", factor: 1000 },
      { id: "oz", label: "Ounces", symbol: "oz", factor: 0.028349523125 },
      { id: "lb", label: "Pounds", symbol: "lb", factor: 0.45359237 },
      { id: "st", label: "Stones", symbol: "st", factor: 6.35029318 },
    ],
  },
  temperature: {
    label: "Temperature",
    defaults: { from: "c", to: "f" },
    units: [
      { id: "c", label: "Celsius", symbol: "°C", factor: 1 },
      { id: "f", label: "Fahrenheit", symbol: "°F", factor: 1 },
      { id: "k", label: "Kelvin", symbol: "K", factor: 1 },
    ],
  },
  speed: {
    label: "Speed",
    defaults: { from: "kmh", to: "mph" },
    units: [
      { id: "ms", label: "Metres per second", symbol: "m/s", factor: 1 },
      { id: "kmh", label: "Kilometres per hour", symbol: "km/h", factor: 1 / 3.6 },
      { id: "mph", label: "Miles per hour", symbol: "mph", factor: 0.44704 },
      { id: "fts", label: "Feet per second", symbol: "ft/s", factor: 0.3048 },
      { id: "knot", label: "Knots", symbol: "kn", factor: 0.514444444 },
    ],
  },
};

const UNIT_CATEGORIES: { value: UnitCategoryId; label: string }[] = [
  { value: "length", label: "Length" },
  { value: "weight", label: "Weight" },
  { value: "temperature", label: "Temperature" },
  { value: "speed", label: "Speed" },
];

function convertUnit(category: UnitCategoryId, value: number, from: string, to: string): number {
  if (category === "temperature") {
    let celsius = value;
    if (from === "f") celsius = ((value - 32) * 5) / 9;
    if (from === "k") celsius = value - 273.15;
    if (to === "f") return (celsius * 9) / 5 + 32;
    if (to === "k") return celsius + 273.15;
    return celsius;
  }
  const units = UNIT_GROUPS[category].units;
  const fromUnit = units.find((unit) => unit.id === from) ?? units[0];
  const toUnit = units.find((unit) => unit.id === to) ?? units[1];
  return (value * fromUnit.factor) / toUnit.factor;
}

function formatConverted(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.000001 || absolute >= 1_000_000_000_000)) {
    return value.toExponential(4);
  }
  return formatNumber(value, 6);
}

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategoryId>("length");
  const [valueInput, setValueInput] = useState("1");
  const [from, setFrom] = useState(UNIT_GROUPS.length.defaults.from);
  const [to, setTo] = useState(UNIT_GROUPS.length.defaults.to);

  const group = UNIT_GROUPS[category];
  const numeric = parseNumeric(valueInput);
  const valid = Number.isFinite(numeric);
  const result = valid ? convertUnit(category, numeric, from, to) : Number.NaN;
  const fromUnit = group.units.find((unit) => unit.id === from) ?? group.units[0];
  const toUnit = group.units.find((unit) => unit.id === to) ?? group.units[1];

  function changeCategory(next: UnitCategoryId) {
    setCategory(next);
    setFrom(UNIT_GROUPS[next].defaults.from);
    setTo(UNIT_GROUPS[next].defaults.to);
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const unitOptions = group.units.map((unit) => ({
    value: unit.id,
    label: `${unit.label} (${unit.symbol})`,
  }));

  return (
    <Workspace slug="unit-converter">
      <div className="space-y-5">
        <Segmented label="Conversion category" value={category} onChange={changeCategory} options={UNIT_CATEGORIES} />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <Field label="From" htmlFor="unit-from">
            <Select id="unit-from" value={from} onChange={(event) => setFrom(event.target.value)} options={unitOptions} />
          </Field>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap units"
            className="mb-0.5 grid size-10 place-items-center justify-self-start rounded-xl border border-white/10 bg-white/[0.03] text-mist-300 transition hover:border-brand-400/30 hover:text-brand-300 sm:justify-self-center"
          >
            <Icon name="arrowUpDown" size={16} />
          </button>
          <Field label="To" htmlFor="unit-to">
            <Select id="unit-to" value={to} onChange={(event) => setTo(event.target.value)} options={unitOptions} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Value in ${fromUnit.symbol}`} htmlFor="unit-value">
            <Input
              id="unit-value"
              type="number"
              inputMode="decimal"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              className="font-mono text-[15px]"
            />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold leading-none text-mist-200">Result</p>
            <div className="flex items-center gap-2">
              <div className="field-input flex-1 overflow-x-auto whitespace-nowrap font-mono text-[15px] text-brand-200">
                {valid ? formatConverted(result) : "—"} <span className="text-mist-400">{toUnit.symbol}</span>
              </div>
              <CopyButton
                value={valid ? `${formatConverted(result)} ${toUnit.symbol}` : ""}
                label="Copy result"
                copiedLabel="Copied"
                iconOnly
                className="size-11 shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mist-500">
            {formatNumber(valid ? numeric : 1, 6)} {fromUnit.symbol} =
          </p>
          <p className="mt-1 font-mono text-lg text-mist-100">
            {formatConverted(valid ? result : 0)} {toUnit.symbol}
          </p>
          <p className="mt-2 text-[11.5px] text-mist-500">
            {category === "temperature"
              ? "Temperature scales have different zero points, so the conversion uses a formula."
              : `Standard conversion factor: 1 ${fromUnit.symbol} = ${formatConverted(
                  convertUnit(category, 1, from, to)
                )} ${toUnit.symbol}.`}
          </p>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-mist-200">
            {valid ? `${formatNumber(numeric, 4)} ${fromUnit.symbol} in every unit` : "All units"}
          </h3>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.units.map((unit) => {
              const unitValue = valid ? convertUnit(category, numeric, from, unit.id) : Number.NaN;
              return (
                <div
                  key={unit.id}
                  className={
                    unit.id === to
                      ? "flex items-center justify-between gap-2 rounded-lg border border-brand-400/25 bg-brand-400/[0.06] px-3 py-2"
                      : "flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.018] px-3 py-2"
                  }
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-mist-300">{unit.label}</span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-mist-600">{unit.symbol}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11.5px] text-mist-100">{formatConverted(unitValue)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Note tone="info">
          Factors follow international definitions (for example, 1 inch = 25.4 mm and 1 lb =
          0.45359237 kg). Displayed values are rounded — use a calibrated reference for engineering
          tolerances.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------------- BMI ----------------------------------- */

type BmiUnits = "metric" | "imperial";

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", tone: "text-sky-300", bg: "bg-sky-400/10 border-sky-400/25" };
  if (bmi < 25) return { label: "Healthy range", tone: "text-brand-300", bg: "bg-brand-400/10 border-brand-400/25" };
  if (bmi < 30) return { label: "Overweight", tone: "text-amber-300", bg: "bg-amber-400/10 border-amber-400/25" };
  return { label: "Obesity range", tone: "text-rose-300", bg: "bg-rose-400/10 border-rose-400/25" };
}

export function BmiCalculator() {
  const [units, setUnits] = useState<BmiUnits>("metric");
  const [cm, setCm] = useState("175");
  const [kg, setKg] = useState("70");
  const [ft, setFt] = useState("5");
  const [inches, setInches] = useState("9");
  const [lb, setLb] = useState("154");

  const calculation = useMemo(() => {
    const heightM =
      units === "metric"
        ? parseNumeric(cm) / 100
        : (parseNumeric(ft) * 12 + parseNumeric(inches)) * 0.0254;
    const weightKg = units === "metric" ? parseNumeric(kg) : parseNumeric(lb) * 0.45359237;
    const valid =
      Number.isFinite(heightM) && Number.isFinite(weightKg) && heightM > 0.5 && weightKg > 0;

    if (!valid) {
      return { valid: false, bmi: Number.NaN, heightM, weightKg, healthyMin: Number.NaN, healthyMax: Number.NaN };
    }
    const bmi = weightKg / (heightM * heightM);
    return {
      valid: Number.isFinite(bmi),
      bmi,
      heightM,
      weightKg,
      healthyMin: 18.5 * heightM * heightM,
      healthyMax: 24.9 * heightM * heightM,
    };
  }, [units, cm, kg, ft, inches, lb]);

  const category = calculation.valid ? bmiCategory(calculation.bmi) : null;
  const markerPosition = calculation.valid
    ? clamp(((calculation.bmi - 14) / (40 - 14)) * 100, 0, 100)
    : 0;
  const rangeInDisplayUnits = units === "metric"
    ? `${formatNumber(calculation.healthyMin, 1)} – ${formatNumber(calculation.healthyMax, 1)} kg`
    : `${formatNumber(calculation.healthyMin / 0.45359237, 1)} – ${formatNumber(calculation.healthyMax / 0.45359237, 1)} lb`;

  return (
    <Workspace slug="bmi-calculator">
      <div className="space-y-5">
        <Segmented
          label="Measurement units"
          value={units}
          onChange={setUnits}
          options={[
            { value: "metric", label: "Metric (cm / kg)" },
            { value: "imperial", label: "Imperial (ft / lb)" },
          ]}
          className="sm:max-w-sm"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {units === "metric" ? (
            <>
              <Field label="Height (cm)" htmlFor="bmi-cm">
                <Input id="bmi-cm" type="number" inputMode="decimal" min={0} value={cm} onChange={(event) => setCm(event.target.value)} className="font-mono" />
              </Field>
              <Field label="Weight (kg)" htmlFor="bmi-kg">
                <Input id="bmi-kg" type="number" inputMode="decimal" min={0} value={kg} onChange={(event) => setKg(event.target.value)} className="font-mono" />
              </Field>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (ft)" htmlFor="bmi-ft">
                  <Input id="bmi-ft" type="number" inputMode="numeric" min={0} max={8} value={ft} onChange={(event) => setFt(event.target.value)} className="font-mono" />
                </Field>
                <Field label="Height (in)" htmlFor="bmi-in">
                  <Input id="bmi-in" type="number" inputMode="numeric" min={0} max={11} value={inches} onChange={(event) => setInches(event.target.value)} className="font-mono" />
                </Field>
              </div>
              <Field label="Weight (lb)" htmlFor="bmi-lb">
                <Input id="bmi-lb" type="number" inputMode="decimal" min={0} value={lb} onChange={(event) => setLb(event.target.value)} className="font-mono" />
              </Field>
            </>
          )}
        </div>

        <ResultCard
          label="Estimated BMI"
          value={calculation.valid ? formatNumber(calculation.bmi, 1) : "—"}
          suffix={calculation.valid ? "kg/m²" : undefined}
          hint={
            calculation.valid ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] ${category?.bg} ${category?.tone}`}>
                  {category?.label}
                </span>
                <span>For adults, WHO thresholds. Not a medical diagnosis.</span>
              </span>
            ) : (
              "Enter a valid height and weight to calculate BMI."
            )
          }
        />

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <div className="relative">
            <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
              <span className="w-[17%] bg-sky-400/70" />
              <span className="w-[25%] bg-brand-400" />
              <span className="w-[19%] bg-amber-400" />
              <span className="w-[39%] bg-rose-400/80" />
            </div>
            {calculation.valid && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 h-[22px] w-[3px] -translate-x-1/2 rounded-full bg-mist-50 shadow-[0_0_0_2px_rgba(6,7,9,0.65)]"
                style={{ left: `${markerPosition}%` }}
              />
            )}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-mist-600">
            <span>Under 18.5</span>
            <span>18.5–24.9</span>
            <span>25–29.9</span>
            <span>30+</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <StatTile label="Healthy weight range" value={calculation.valid ? rangeInDisplayUnits : "—"} hint="for your height (BMI 18.5–24.9)" />
            <StatTile label="Height used" value={calculation.valid ? `${formatNumber(calculation.heightM * 100, 0)} cm` : "—"} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            value={
              calculation.valid
                ? `BMI: ${formatNumber(calculation.bmi, 1)} (${category?.label}). Healthy weight range for this height: ${rangeInDisplayUnits}. Screening estimate only, not medical advice.`
                : ""
            }
            label="Copy summary"
            copiedLabel="Copied"
          />
          <span className="text-[11.5px] text-mist-500">
            BMI cannot distinguish muscle from fat or describe fat distribution.
          </span>
        </div>

        <Note tone="warn" title="A screening number, not a diagnosis">
          BMI is not valid during pregnancy and is interpreted differently for children, older adults
          and some ethnic groups. Athletes may measure high because of muscle. Speak with a qualified
          clinician for personal health advice.
        </Note>
      </div>
    </Workspace>
  );
}
