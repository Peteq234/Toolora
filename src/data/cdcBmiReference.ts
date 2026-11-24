import { CDC_LMS, CDC_SOURCE, type LmsRecord } from "@/data/cdcBmiData";

export { CDC_SOURCE };
export type { LmsRecord };

/**
 * CDC tables are published at 24 months and then at every month + 0.5.
 * A completed age of N whole months maps to the record for N (age 24)
 * or N + 0.5 (all later months), which is the band covering that month.
 */
export function lmsForAgeMonths(sex: "male" | "female", wholeMonths: number): LmsRecord | null {
  if (!Number.isInteger(wholeMonths)) return null;
  if (wholeMonths < CDC_SOURCE.minMonths || wholeMonths > CDC_SOURCE.maxMonths) return null;
  const target = wholeMonths === 24 ? 24 : wholeMonths + 0.5;
  return CDC_LMS[sex].find((record) => record.agemos === target) ?? null;
}

/** Standard normal cumulative distribution. Absolute error below 1.5e-7. */
export function normalCdf(z: number): number {
  const x = z / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + (x >= 0 ? erf : -erf));
}

const Z_85 = 1.036433389; // 85th percentile
const Z_95 = 1.644853627; // 95th percentile

/** Value of the growth measurement at a given z-score, from LMS. */
export function valueAtZ(lms: LmsRecord, z: number): number {
  return lms.L === 0 ? lms.M * Math.exp(lms.S * z) : lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L);
}

export type CdcBmiResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      zScore: number;
      percentile: number | null;
      percentileText: string;
      category: "below 5th" | "5th–85th" | "85th–95th" | "95th or above";
      categoryCopy: string;
      median: number;
      p85: number;
      p95: number;
      lms: LmsRecord;
    };

/**
 * CDC BMI-for-age z-score using the LMS method:
 *   z = ((BMI / M)^L - 1) / (L * S)   when L != 0
 *   z = ln(BMI / M) / S               when L == 0
 *
 * CDC's 2000 reference should not be used to report a specific percentile above
 * the 95th, so the tool reports "at or above the 95th" there instead of an
 * inflated percentile. This is a screening category, never a diagnosis.
 */
export function cdcBmiForAge(bmi: number, sex: "male" | "female", wholeMonths: number): CdcBmiResult {
  const lms = lmsForAgeMonths(sex, wholeMonths);
  if (!lms) {
    return {
      ok: false,
      reason: `This reference covers ages 2 to 20. Enter a completed age between 2 and 20 years.`,
    };
  }
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return { ok: false, reason: "Enter a valid height and weight to calculate BMI." };
  }

  const zScore =
    lms.L === 0 ? Math.log(bmi / lms.M) / lms.S : (Math.pow(bmi / lms.M, lms.L) - 1) / (lms.L * lms.S);
  const percentile = normalCdf(zScore) * 100;
  const above95 = percentile >= 95;
  const percentileText = above95
    ? "at or above the 95th percentile"
    : `around the ${Math.max(1, Math.round(percentile))}th percentile`;

  let category: "below 5th" | "5th–85th" | "85th–95th" | "95th or above";
  let categoryCopy: string;
  if (percentile < 5) {
    category = "below 5th";
    categoryCopy =
      "Below the 5th percentile on the CDC reference. Growth patterns vary; a healthcare professional can look at the trend over time and your child's overall health.";
  } else if (percentile < 85) {
    category = "5th–85th";
    categoryCopy =
      "Between the 5th and 85th percentile on the CDC reference — the range where most children fall. Keep focusing on balanced meals, activity and sleep.";
  } else if (percentile < 95) {
    category = "85th–95th";
    categoryCopy =
      "Between the 85th and 95th percentile on the CDC reference. This is a screening category, not a diagnosis; a clinician can consider growth over time and family context.";
  } else {
    category = "95th or above";
    categoryCopy =
      "At or above the 95th percentile on the CDC reference. CDC does not recommend reporting an exact percentile above this point from the 2000 charts. A paediatric professional can assess growth over time and offer supportive guidance.";
  }

  return {
    ok: true,
    zScore,
    percentile: above95 ? null : Math.round(percentile),
    percentileText,
    category,
    categoryCopy,
    median: lms.M,
    p85: valueAtZ(lms, Z_85),
    p95: valueAtZ(lms, Z_95),
    lms,
  };
}

export function describeAge(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${years} yr${years === 1 ? "" : "s"}${rest ? ` ${rest} mo` : ""}`;
}
