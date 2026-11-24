import { useMemo, useState } from "react";
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
import { formatNumber } from "@/lib/utils";

/* ----------------------------- date difference ---------------------------- */

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  return date;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const days = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), days));
  return result;
}

function calendarSpan(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let anchor = addMonths(from, years * 12);
  if (anchor.getTime() > to.getTime()) {
    years -= 1;
    anchor = addMonths(from, years * 12);
  }
  let months = 0;
  while (months < 11) {
    const next = addMonths(anchor, months + 1);
    if (next.getTime() <= to.getTime()) months += 1;
    else break;
  }
  anchor = addMonths(anchor, months);
  const days = Math.round((to.getTime() - anchor.getTime()) / 86_400_000);
  return { years, months, days };
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 40_000) {
    if (!isWeekend(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return count;
}

export function DateDifference() {
  const today = new Date();
  const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [start, setStart] = useState(iso(today));
  const [end, setEnd] = useState(iso(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())));
  const [includeEnd, setIncludeEnd] = useState(false);
  const [holidays, setHolidays] = useState("");

  const result = useMemo(() => {
    const from = parseDate(start);
    const to = parseDate(end);
    if (!from || !to) return { error: "Choose two valid dates." as string };
    const [early, late] = from.getTime() <= to.getTime() ? [from, to] : [to, from];
    const rawDays = Math.round((late.getTime() - early.getTime()) / 86_400_000);
    const days = rawDays + (includeEnd ? 1 : 0);
    const span = calendarSpan(early, late);
    const holidayDates = holidays
      .split(/[\n,]+/)
      .map((value) => parseDate(value.trim()))
      .filter((value): value is Date => Boolean(value));
    const weekdays = countWeekdays(early, late) - holidayDates.filter((d) => d >= early && d <= late && !isWeekend(d)).length;
    return { from: early, to: late, days, rawDays, span, weekdays, weeks: Math.floor(days / 7), remainder: days % 7, reversed: from.getTime() > to.getTime() };
  }, [start, end, includeEnd, holidays]);

  return (
    <Workspace slug="date-difference-calculator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="date-start">
            <Input id="date-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} className="font-mono" />
          </Field>
          <Field label="End date" htmlFor="date-end">
            <Input id="date-end" type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="font-mono" />
          </Field>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Include the end date" description="Counts the final day as well" checked={includeEnd} onChange={setIncludeEnd} />
          <Field label="Public holidays" htmlFor="date-holidays" hint="optional, comma separated">
            <Input id="date-holidays" value={holidays} onChange={(event) => setHolidays(event.target.value)} placeholder="2026-12-25, 2026-12-26" className="font-mono text-[12px]" />
          </Field>
        </div>

        {"error" in result ? (
          <Note tone="warn">{result.error}</Note>
        ) : (
          <>
            <ResultCard
              label="Difference in days"
              value={formatNumber(result.days)}
              suffix={result.days === 1 ? "day" : "days"}
              hint={`${formatNumber(result.weeks)} weeks and ${result.remainder} days${result.reversed ? " · dates were swapped into chronological order" : ""}`}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Calendar span" value={`${result.span.years}y ${result.span.months}m ${result.span.days}d`} />
              <StatTile label="Business days" value={formatNumber(result.weekdays)} hint="Mon–Fri, holidays excluded" />
              <StatTile label="Weeks" value={formatNumber(Math.floor(result.days / 7))} />
              <StatTile label="Hours" value={formatNumber(result.days * 24)} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setStart(end); setEnd(start); }}>
                <Icon name="arrowUpDown" size={14} /> Swap dates
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setStart(iso(new Date())); setEnd(iso(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()))); }}>
                <Icon name="refresh" size={13} /> Today + 1 month
              </Button>
              <CopyButton value={`${result.days} days from ${start} to ${end} (${result.weeks} weeks and ${result.remainder} days; ${result.weekdays} business days).`} label="Copy result" copiedLabel="Copied" />
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
              <p className="text-[12px] font-semibold text-mist-200">Details</p>
              <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-mist-500">
                <li>• {result.from.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} → {result.to.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.</li>
                <li>• Without {includeEnd ? "excluding" : "including"} the end date, the elapsed-day count is {formatNumber(result.rawDays)}.</li>
                <li>• Business days use Monday–Friday and exclude any valid holiday dates you entered.</li>
              </ul>
            </div>
          </>
        )}

        <Note tone="info">
          Dates are handled as local calendar days, so daylight-saving changes do not shift the result.
          Business-day counts are an estimate for planning: they do not know regional working weeks or
          holidays unless you enter them.
        </Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- time duration ------------------------------- */

type DurationRow = { id: string; label: string; start: string; end: string; breakMinutes: string };
let rowCounter = 0;
const makeRow = (label = ""): DurationRow => {
  rowCounter += 1;
  return { id: `duration-${rowCounter}`, label, start: "09:00", end: "17:00", breakMinutes: "30" };
};

function minutesFromTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatDuration(totalMinutes: number): { clock: string; hours: string; minutes: string } {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60);
  const minutes = Math.round(safe % 60);
  return {
    clock: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    hours: (safe / 60).toFixed(2),
    minutes: safe.toFixed(0),
  };
}

export function TimeDurationCalculator() {
  const [rows, setRows] = useState<DurationRow[]>([makeRow("Shift")]);
  const [overnight, setOvernight] = useState(true);

  const calculated = rows.map((row) => {
    const start = minutesFromTime(row.start);
    const end = minutesFromTime(row.end);
    const paidBreak = Math.max(0, parseFloat(row.breakMinutes || "0") || 0);
    if (start === null || end === null) return { ...row, error: "Use HH:MM times.", minutes: 0, changed: false };
    let span = end - start;
    let crossed = false;
    if (span < 0) {
      if (!overnight) return { ...row, error: "End is before start. Enable overnight or fix the times.", minutes: 0, changed: false };
      span += 1440;
      crossed = true;
    }
    if (span === 0 && !overnight) return { ...row, error: "Start and end are the same.", minutes: 0, changed: false };
    const minutes = Math.max(0, span - paidBreak);
    return { ...row, error: "", minutes, changed: crossed };
  });

  const total = calculated.reduce((sum, row) => sum + row.minutes, 0);
  const totalBreak = rows.reduce((sum, row) => sum + Math.max(0, parseFloat(row.breakMinutes || "0") || 0), 0);
  const formatted = formatDuration(total);

  function update(id: string, patch: Partial<DurationRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <Workspace slug="time-duration-calculator">
      <div className="space-y-5">
        <div className="space-y-2">
          {calculated.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-2.5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_96px_96px_86px_30px] sm:items-center">
                <Input value={row.label} onChange={(event) => update(row.id, { label: event.target.value })} placeholder="Label" aria-label="Entry label" className="col-span-2 h-9 text-[12px] sm:col-span-1" />
                <div>
                  <Input type="time" value={row.start} onChange={(event) => update(row.id, { start: event.target.value })} aria-label={`${row.label || "Entry"} start time`} className="h-9 font-mono text-[12px]" />
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600">start</p>
                </div>
                <div>
                  <Input type="time" value={row.end} onChange={(event) => update(row.id, { end: event.target.value })} aria-label={`${row.label || "Entry"} end time`} className="h-9 font-mono text-[12px]" />
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600">end</p>
                </div>
                <div>
                  <Input type="number" min={0} max={720} value={row.breakMinutes} onChange={(event) => update(row.id, { breakMinutes: event.target.value })} aria-label={`${row.label || "Entry"} unpaid break minutes`} className="h-9 font-mono text-[12px]" />
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600">break min</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRows((current) => (current.length > 1 ? current.filter((item) => item.id !== row.id) : current))}
                  disabled={rows.length === 1}
                  aria-label={`Remove ${row.label || "entry"}`}
                  className="grid size-8 place-items-center justify-self-end rounded-lg border border-white/8 text-mist-500 transition hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-30"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
              {row.error ? (
                <p className="mt-1.5 text-[11px] font-medium text-rose-300">{row.error}</p>
              ) : (
                <p className="mt-1.5 font-mono text-[10px] text-mist-500">
                  {formatDuration(row.minutes).clock} worked
                  {row.changed && " · crosses midnight"}
                  {parseFloat(row.breakMinutes) > 0 && ` · ${formatDuration(parseFloat(row.breakMinutes)).clock} break deducted`}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRows((current) => [...current, makeRow()])}>
            <Icon name="plus" size={13} /> Add entry
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRows([makeRow()])}>
            <Icon name="refresh" size={13} /> Reset
          </Button>
          <div className="ml-auto">
            <Toggle label="Allow overnight spans" description="End before start counts into the next day" checked={overnight} onChange={setOvernight} />
          </div>
        </div>

        <ResultCard
          label="Total duration"
          value={formatted.clock}
          hint={`${formatted.hours} decimal hours · ${formatted.minutes} minutes · ${formatDuration(total + totalBreak).clock} gross before breaks`}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatTile label="Decimal hours" value={formatted.hours} hint="useful for payroll" />
          <StatTile label="Total minutes" value={formatted.minutes} />
          <StatTile label="Unpaid breaks" value={`${totalBreak}`} hint="minutes deducted" />
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton
            value={calculated.filter((row) => !row.error).map((row) => `${row.label || "Entry"}: ${row.start}–${row.end}, break ${row.breakMinutes || 0} min → ${formatDuration(row.minutes).clock} (${formatDuration(row.minutes).hours} h)`).join("\n") + `\nTotal: ${formatted.clock} (${formatted.hours} decimal hours)`}
            label="Copy timesheet"
            copiedLabel="Copied"
          />
        </div>

        <Note tone="info">
          This is an arithmetic time calculator, not legal payroll advice. Rounding rules, overtime and
          unpaid breaks vary by employer and location. Each entry is converted to minutes, breaks are
          deducted, then all entries are summed.
        </Note>
      </div>
    </Workspace>
  );
}
