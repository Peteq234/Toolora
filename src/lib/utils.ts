import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------- randomness ------------------------------- */

function cryptoObject(): Crypto | undefined {
  if (typeof globalThis === "undefined") return undefined;
  try {
    return globalThis.crypto ?? undefined;
  } catch {
    return undefined;
  }
}

export function randomUint32(): number {
  const c = cryptoObject();
  if (c) {
    const buffer = new Uint32Array(1);
    c.getRandomValues(buffer);
    return buffer[0];
  }
  return Math.floor(Math.random() * 4294967296);
}

/** Uniform integer in [0, maxExclusive) using rejection sampling (no modulo bias). */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  if (maxExclusive > 4294967296) return Math.floor(randomUint32() * (maxExclusive / 4294967296));
  const limit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
  let value = randomUint32();
  while (value >= limit) value = randomUint32();
  return value % maxExclusive;
}

export function randomInt(min: number, max: number): number {
  return min + secureRandomInt(max - min + 1);
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[secureRandomInt(items.length)];
}

export function shuffleSecure<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* -------------------------------- formatting ------------------------------- */

export function formatNumber(value: number, maxFractionDigits = 4): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  })
    .format(value)
    .toUpperCase();
}

export function parseNumeric(value: string): number {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(/,/g, "").trim());
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pad(value: number, length = 2): string {
  return String(Math.trunc(value)).padStart(length, "0");
}

export function formatStopwatch(ms: number): { main: string; fraction: string } {
  const total = Math.max(0, ms);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centis = Math.floor((total % 1000) / 10);
  const main = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  return { main, fraction: pad(centis) };
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

/* ------------------------------- clipboard -------------------------------- */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy approach */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const success = document.execCommand("copy");
    document.body.removeChild(area);
    return success;
  } catch {
    return false;
  }
}

export function useCopy(resetAfter = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, key = "default") => {
      const success = await copyToClipboard(text);
      if (success) {
        setCopiedKey(key);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopiedKey(null), resetAfter);
      }
      return success;
    },
    [resetAfter]
  );

  return { copiedKey, copy };
}

/* -------------------------------- download -------------------------------- */

export function downloadFile(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
