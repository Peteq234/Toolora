/**
 * Exact rational arithmetic with BigInt.
 *
 * Used for unit conversions so that results do not inherit floating-point
 * drift from conversion factors. Factors are defined as exact rationals:
 *   1 inch = 2.54 cm exactly      -> 127/50
 *   1 lb   = 0.45359237 kg exactly -> 45359237/100000000
 */

export type Rational = { n: bigint; d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x || 1n;
}

export function rational(n: bigint | number | string, d: bigint | number | string = 1n): Rational {
  let numerator = typeof n === "bigint" ? n : BigInt(typeof n === "number" ? Math.trunc(n) : n);
  let denominator = typeof d === "bigint" ? d : BigInt(typeof d === "number" ? Math.trunc(d) : d);
  if (denominator === 0n) throw new Error("Division by zero");
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return { n: numerator / divisor, d: denominator / divisor };
}

/** Parse a decimal string ("2.54", "-0.5") into an exact rational. */
export function decimal(value: string): Rational | null {
  const clean = value.trim().replace(/,/g, "");
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(clean);
  if (!match) return null;
  const [, sign, whole = "", fraction = ""] = match;
  if (!whole && !fraction) return null;
  const digits = `${whole || "0"}${fraction}`;
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(digits || "0") * (sign ? -1n : 1n);
  return rational(numerator, denominator);
}

export const R = {
  add: (a: Rational, b: Rational) => rational(a.n * b.d + b.n * a.d, a.d * b.d),
  sub: (a: Rational, b: Rational) => rational(a.n * b.d - b.n * a.d, a.d * b.d),
  mul: (a: Rational, b: Rational) => rational(a.n * b.n, a.d * b.d),
  div: (a: Rational, b: Rational) => {
    if (b.n === 0n) throw new Error("Division by zero");
    return rational(a.n * b.d, a.d * b.n);
  },
  fromInt: (value: number | bigint) => rational(BigInt(value)),
  cmp: (a: Rational, b: Rational) => (a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0),
  isZero: (a: Rational) => a.n === 0n,
};

/** Round to a fixed number of decimal places, half away from zero. */
export function toFixedRounded(value: Rational, places: number): string {
  if (value.d === 0n) return "—";
  const scale = 10n ** BigInt(places);
  const numerator = value.n * scale;
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  let quotient = abs / value.d;
  const remainder = abs % value.d;
  if (remainder * 2n >= value.d) quotient += 1n;
  const text = quotient.toString().padStart(places + 1, "0");
  const whole = text.slice(0, text.length - places) || "0";
  const fraction = places > 0 ? text.slice(text.length - places).replace(/0+$/, "") : "";
  const rendered = fraction ? `${whole}.${fraction}` : whole;
  return `${negative && quotient !== 0n ? "-" : ""}${rendered}`;
}

export function rationalToNumber(value: Rational): number {
  return Number(value.n) / Number(value.d);
}

/** Format with thousands separators while preserving up to N decimals. */
export function formatRational(value: Rational, places = 6): string {
  const text = toFixedRounded(value, places);
  const [whole, fraction] = text.split(".");
  const grouped = Number(whole.replace("-", "")).toLocaleString("en-US");
  const sign = whole.startsWith("-") ? "-" : "";
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}
