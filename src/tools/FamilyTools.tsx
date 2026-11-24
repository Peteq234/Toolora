import { useMemo, useState } from "react";
import {
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  StatTile,
  Workspace,
} from "@/components/ui";
import { R, decimal, formatRational, rational, type Rational } from "@/lib/rational";
import {
  CDC_SOURCE,
  cdcBmiForAge,
  describeAge,
  normalCdf,
} from "@/data/cdcBmiReference";

/* --------------------------- parent height predictor ---------------------- */

type HeightUnit = "metric" | "imperial";
type ChildSex = "boy" | "girl";

const CM_PER_INCH = decimal("2.54")!;
const TWELVE = rational(12n);
const UNCERTAINTY_CM = rational(85n, 10n); // ±8.5 cm — the usual range quoted for this method

export function ParentHeightPredictor() {
  const [unit, setUnit] = useState<HeightUnit>("metric");
  const [sex, setSex] = useState<ChildSex>("boy");
  const [motherCm, setMotherCm] = useState("165");
  const [fatherCm, setFatherCm] = useState("180");
  const [motherFt, setMotherFt] = useState("5");
  const [motherIn, setMotherIn] = useState("5");
  const [fatherFt, setFatherFt] = useState("5");
  const [fatherIn, setFatherIn] = useState("11");

  const mother = useMemo<Rational | null>(() => {
    if (unit === "metric") return decimal(motherCm);
    const feet = decimal(motherFt);
    const inches = decimal(motherIn || "0");
    if (!feet || !inches) return null;
    return R.mul(R.add(R.mul(feet, TWELVE), inches), CM_PER_INCH);
  }, [unit, motherCm, motherFt, motherIn]);

  const father = useMemo<Rational | null>(() => {
    if (unit === "metric") return decimal(fatherCm);
    const feet = decimal(fatherFt);
    const inches = decimal(fatherIn || "0");
    if (!feet || !inches) return null;
    return R.mul(R.add(R.mul(feet, TWELVE), inches), CM_PER_INCH);
  }, [unit, fatherCm, fatherFt, fatherIn]);

  const calculation = useMemo(() => {
    if (!mother || !father) return null;
    const motherValue = Number(mother.n) / Number(mother.d);
    const fatherValue = Number(father.n) / Number(father.d);
    if (!(motherValue >= 100 && motherValue <= 250) || !(fatherValue >= 100 && fatherValue <= 250)) {
      return { invalid: true as const };
    }
    const sum = R.add(mother, father);
    const sexAdjust = sex === "boy" ? rational(13n) : rational(-13n);
    // Mid-parental method: (mother + father ± 13 cm) / 2, then the commonly
    // quoted +2.5 cm adjustment to convert mid-parental height to a child estimate.
    const midpoint = R.div(R.add(sum, sexAdjust), rational(2n));
    const estimate = R.add(midpoint, rational(5n, 2n));
    return {
      invalid: false as const,
      mother: motherValue,
      father: fatherValue,
      estimate,
      low: R.sub(estimate, UNCERTAINTY_CM),
      high: R.add(estimate, UNCERTAINTY_CM),
      midpoint,
    };
  }, [mother, father, sex]);

  const imperial = (cm: Rational) => {
    const totalInches = R.div(cm, CM_PER_INCH);
    const inchesTotal = Number(totalInches.n) / Number(totalInches.d);
    const wholeFeet = Math.floor(inchesTotal / 12);
    const inches = inchesTotal - wholeFeet * 12;
    return `${wholeFeet} ft ${inches.toFixed(1)} in`;
  };

  type HeightEstimate = {
    mother: number;
    father: number;
    estimate: Rational;
    low: Rational;
    high: Rational;
    midpoint: Rational;
  };
  const estimate: HeightEstimate | null =
    calculation && "estimate" in calculation ? (calculation as HeightEstimate) : null;
  const invalidInput = Boolean(calculation && "invalid" in calculation && calculation.invalid);

  return (
    <Workspace slug="parent-height-predictor">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Height units"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "metric", label: "Centimetres" },
              { value: "imperial", label: "Feet & inches" },
            ]}
            className="sm:max-w-[260px]"
          />
          <div className="ml-auto">
            <Segmented
              label="Child's sex"
              value={sex}
              onChange={setSex}
              options={[
                { value: "boy", label: "Boy" },
                { value: "girl", label: "Girl" },
              ]}
              className="sm:max-w-[180px]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {unit === "metric" ? (
            <>
              <Field label="Mother's height" htmlFor="mother-cm" hint="cm">
                <Input id="mother-cm" type="number" inputMode="decimal" min={100} max={250} step="0.1" value={motherCm} onChange={(e) => setMotherCm(e.target.value)} className="font-mono" />
              </Field>
              <Field label="Father's height" htmlFor="father-cm" hint="cm">
                <Input id="father-cm" type="number" inputMode="decimal" min={100} max={250} step="0.1" value={fatherCm} onChange={(e) => setFatherCm(e.target.value)} className="font-mono" />
              </Field>
            </>
          ) : (
            <>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-mist-200">Mother's height</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input aria-label="Mother's height in feet" type="number" min={3} max={8} value={motherFt} onChange={(e) => setMotherFt(e.target.value)} className="font-mono" />
                  <Input aria-label="Mother's height in inches" type="number" min={0} max={11.9} step="0.5" value={motherIn} onChange={(e) => setMotherIn(e.target.value)} className="font-mono" />
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">feet · inches</p>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-mist-200">Father's height</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input aria-label="Father's height in feet" type="number" min={3} max={8} value={fatherFt} onChange={(e) => setFatherFt(e.target.value)} className="font-mono" />
                  <Input aria-label="Father's height in inches" type="number" min={0} max={11.9} step="0.5" value={fatherIn} onChange={(e) => setFatherIn(e.target.value)} className="font-mono" />
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">feet · inches</p>
              </div>
            </>
          )}
        </div>

        {!estimate ? (
          <Note tone="warn">
            {invalidInput
              ? "Enter both parents' heights within a plausible adult range (100–250 cm, or about 3 ft 3 in to 8 ft 2 in)."
              : "Enter both parents' heights to see an estimate."}
          </Note>
        ) : (
          <>
              <ResultCard
                label={`Estimated adult height · ${sex}`}
                value={formatRational(estimate.estimate, 1)}
                suffix="cm"
                hint={`Typical estimate range: ${formatRational(estimate.low, 1)}–${formatRational(estimate.high, 1)} cm (±8.5 cm). In imperial units: ${imperial(estimate.low)} – ${imperial(estimate.high)}.`}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Mid-parental" value={`${formatRational(estimate.midpoint, 1)} cm`} />
                <StatTile label="Imperial estimate" value={imperial(estimate.estimate)} />
                <StatTile label="Range low" value={`${formatRational(estimate.low, 1)} cm`} />
                <StatTile label="Range high" value={`${formatRational(estimate.high, 1)} cm`} />
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton
                  value={`Mid-parental height estimate: ${formatRational(estimate.estimate, 1)} cm (${imperial(estimate.estimate)}), uncertainty about ±8.5 cm (${formatRational(estimate.low, 1)}–${formatRational(estimate.high, 1)} cm). A rough genetic estimate only, not a prediction or a diagnosis.`}
                  label="Copy estimate"
                  copiedLabel="Copied"
                />
              </div>
          </>
        )}

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <p className="text-[12px] font-semibold text-mist-200">The method, shown</p>
          <ol className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-mist-500">
            <li>1. Add the mother's height and the father's height.</li>
            <li>2. Add 13 cm for a boy, or subtract 13 cm for a girl.</li>
            <li>3. Divide by two — this is the mid-parental height.</li>
            <li>4. Add 2.5 cm to produce the child estimate, then allow roughly ±8.5 cm.</li>
          </ol>
          <p className="mt-2 text-[11px] leading-relaxed text-mist-600">
            Formula: child = (mother + father {sex === "boy" ? "+" : "−"} 13) ÷ 2 + 2.5 cm. Heights are
            converted with exact arithmetic (1 inch = 2.54 cm).
          </p>
        </div>

        <Note tone="warn" title="A rough estimate, not a prediction">
          Adult height is influenced by many genes beyond parents' heights, plus nutrition, sleep,
          health conditions, hormones and puberty timing. Differences of several centimetres from
          this estimate are normal. This tool cannot diagnose short or tall stature. If you have
          concerns about a child's growth, speak with a paediatrician or family doctor who can use
          growth charts over time.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- children's BMI ----------------------------- */

type ChildSexOption = "male" | "female";

export function ChildBmiCalculator() {
  const [sex, setSex] = useState<ChildSexOption>("male");
  const [ageYears, setAgeYears] = useState("9");
  const [ageMonths, setAgeMonths] = useState("6");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [cm, setCm] = useState("138");
  const [kg, setKg] = useState("32");
  const [feet, setFeet] = useState("4");
  const [inches, setInches] = useState("6");
  const [pounds, setPounds] = useState("70");

  const years = parseInt(ageYears || "0", 10) || 0;
  const months = parseInt(ageMonths || "0", 10) || 0;
  const totalMonths = years * 12 + months;
  const ageValid = totalMonths >= 24 && totalMonths <= 240;

  const heightM = useMemo(() => {
    if (unit === "metric") {
      const value = parseFloat(cm);
      return Number.isFinite(value) && value >= 60 && value <= 230 ? value / 100 : Number.NaN;
    }
    const ft = parseFloat(feet);
    const inch = parseFloat(inches || "0");
    if (!Number.isFinite(ft) || !Number.isFinite(inch)) return Number.NaN;
    const totalInches = ft * 12 + inch;
    return totalInches >= 24 && totalInches <= 96 ? totalInches * 0.0254 : Number.NaN;
  }, [unit, cm, feet, inches]);

  const weightKg = useMemo(() => {
    if (unit === "metric") {
      const value = parseFloat(kg);
      return Number.isFinite(value) && value >= 5 && value <= 250 ? value : Number.NaN;
    }
    const value = parseFloat(pounds);
    return Number.isFinite(value) && value >= 10 && value <= 550 ? value * 0.45359237 : Number.NaN;
  }, [unit, kg, pounds]);

  const bmi = Number.isFinite(heightM) && Number.isFinite(weightKg) ? weightKg / (heightM * heightM) : Number.NaN;
  const result = ageValid && Number.isFinite(bmi) ? cdcBmiForAge(bmi, sex, totalMonths) : null;

  const bmiPercentileWithinReference = result?.ok ? normalCdf(result.zScore) * 100 : Number.NaN;

  return (
    <Workspace slug="childrens-bmi-calculator">
      <div className="space-y-5">
        <Note tone="warn" title="For children aged 2 to 20 — not adult BMI categories">
          Children's BMI must be interpreted against age- and sex-specific growth references. Adult
          thresholds (such as “18.5–24.9 healthy”) must not be applied to children. This tool uses the
          US CDC 2000 BMI-for-age reference, which is appropriate for ages 2–20.
        </Note>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Child's sex</p>
            <Segmented
              label="Child's sex"
              value={sex}
              onChange={setSex}
              options={[
                { value: "male", label: "Boy" },
                { value: "female", label: "Girl" },
              ]}
            />
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-mist-500">
              The reference uses biological sex, because the growth tables are sex-specific.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Age</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input type="number" min={2} max={20} value={ageYears} onChange={(e) => setAgeYears(e.target.value)} aria-label="Age in completed years" className="font-mono" />
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">years</p>
              </div>
              <div>
                <Input type="number" min={0} max={11} value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} aria-label="Additional completed months" className="font-mono" />
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">months</p>
              </div>
            </div>
          </div>
        </div>

        {!ageValid && (
          <Note tone="warn" title="Outside this reference's range">
            Enter an age between 2 years 0 months and 20 years 0 months. For children under 2, growth is
            assessed with WHO length- and weight-for-age charts, which use different measurements —
            this tool will not guess a result for those ages.
          </Note>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-mist-200">Height & weight</p>
          <Segmented
            label="Measurement units"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "metric", label: "Metric" },
              { value: "imperial", label: "Imperial" },
            ]}
            className="max-w-[190px]"
          />
        </div>

        {unit === "metric" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Height" htmlFor="child-cm" hint="centimetres">
              <Input id="child-cm" type="number" inputMode="decimal" min={60} max={230} value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight" htmlFor="child-kg" hint="kilograms">
              <Input id="child-kg" type="number" inputMode="decimal" min={5} max={250} value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-mist-200">Height</p>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min={2} max={8} value={feet} onChange={(e) => setFeet(e.target.value)} aria-label="Height in feet" className="font-mono" />
                <Input type="number" min={0} max={11.9} value={inches} onChange={(e) => setInches(e.target.value)} aria-label="Height in inches" className="font-mono" />
              </div>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">feet · inches</p>
            </div>
            <Field label="Weight" htmlFor="child-lb" hint="pounds">
              <Input id="child-lb" type="number" inputMode="decimal" min={10} max={550} value={pounds} onChange={(e) => setPounds(e.target.value)} className="font-mono" />
            </Field>
          </div>
        )}

        {!Number.isFinite(bmi) ? (
          <Note tone="warn">Enter a plausible height and weight for the child's measurement system. Values far outside a child's range are rejected rather than interpreted.</Note>
        ) : !result ? (
          <Note tone="warn">Choose an age between 2 and 20 to interpret this BMI with the CDC reference.</Note>
        ) : !result.ok ? (
          <Note tone="warn">{result.reason}</Note>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
              <ResultCard
                label="BMI-for-age position"
                value={result.percentileText}
                hint={`BMI ${bmi.toFixed(1)} kg/m² · ${describeAge(totalMonths)} · z-score ${result.zScore.toFixed(2)}`}
              />
              <div className="space-y-2">
                <StatTile label="Screening category" value={<span className="font-sans text-[12px] leading-snug">{result.category}</span>} hint="CDC weight-status band, not a diagnosis" />
                <StatTile label="Reference range" value={<span className="font-mono text-[11px]">{result.p85.toFixed(1)} – {result.p95.toFixed(1)} kg/m²</span>} hint="85th to 95th percentile at this age and sex" />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-mist-200">Where this sits on the CDC curve</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">
                  {Number.isFinite(bmiPercentileWithinReference) ? `${Math.round(bmiPercentileWithinReference)}th` : "—"}
                </span>
              </div>
              <div className="relative mt-3 h-2.5 overflow-hidden rounded-full" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 w-[5%] bg-sky-400/60" />
                <span className="absolute inset-y-0 left-[5%] w-[80%] bg-brand-400/70" />
                <span className="absolute inset-y-0 left-[85%] w-[10%] bg-amber-400/70" />
                <span className="absolute inset-y-0 left-[95%] right-0 bg-rose-400/70" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-mist-600">
                <span>5th</span>
                <span>85th</span>
                <span>95th percentile</span>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-mist-400">{result.categoryCopy}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
                Median BMI for this age and sex: {result.median.toFixed(1)} kg/m². Exact percentiles
                above the 95th are not reported from the CDC 2000 reference.
              </p>
            </div>

            <CopyButton
              value={`Children's BMI (CDC 2000 BMI-for-age, ages 2–20): BMI ${bmi.toFixed(1)} kg/m²; ${result.percentileText}; category ${result.category}; z-score ${result.zScore.toFixed(2)}; age ${describeAge(totalMonths)}; sex ${sex}. Screening only — not a diagnosis.`}
              label="Copy summary"
              copiedLabel="Copied"
            />
          </>
        )}

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[12px] font-semibold text-mist-100">Which reference is used?</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-500">
            {CDC_SOURCE.name}, published by the {CDC_SOURCE.publisher}. The tool ships the official
            LMS parameters for {CDC_SOURCE.boys} boys' and {CDC_SOURCE.girls} girls' monthly records,
            covering ages 2–20. Percentile and z-score are calculated with the standard LMS formula
            and a normal distribution.{" "}
            <a href={CDC_SOURCE.url} target="_blank" rel="noopener noreferrer" className="text-brand-200 underline decoration-brand-400/30 underline-offset-2">
              View the source data
            </a>
            . Reference retrieved {CDC_SOURCE.retrieved}.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
            CDC charts are widely used in the United States. Other countries often use WHO growth
            standards (0–5 years) or national charts; percentiles can differ between references. The
            reference used here is stated explicitly so results can be interpreted correctly.
          </p>
        </div>

        <Note tone="info" title="Screening, not diagnosis">
          BMI is a ratio of weight to height. It does not measure body fat, muscle, bone or health,
          and it cannot explain why a child's growth follows a particular pattern. Growth is best
          judged over time by a healthcare professional using accurate measurements, medical history
          and the appropriate chart for the child's age, sex and country. If you are worried about a
          child's growth, speak with a parent or guardian and a paediatric professional — avoid diets
          or weight-focused changes for children without medical advice.
        </Note>
      </div>
    </Workspace>
  );
}
