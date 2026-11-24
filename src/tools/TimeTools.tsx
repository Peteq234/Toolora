import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { clamp, formatCountdown, formatNumber, formatStopwatch } from "@/lib/utils";

/* --------------------------- stopwatch and timer --------------------------- */

type TimeMode = "stopwatch" | "timer";

type Lap = { index: number; split: number; total: number };

function formatLap(ms: number): string {
  const { main, fraction } = formatStopwatch(ms);
  return `${main}.${fraction}`;
}

function TimerDisplay({ remaining, total }: { remaining: number; total: number }) {
  const progress = total > 0 ? clamp(((total - remaining) / total) * 100, 0, 100) : 0;
  return (
    <div>
      <div className="grid place-items-center rounded-2xl border border-white/[0.07] bg-ink-950/60 px-4 py-9">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
          Time remaining
        </span>
        <output
          aria-label="Time remaining"
          className="mt-2 font-mono text-[46px] font-medium leading-none tracking-tight text-mist-50 sm:text-[62px]"
        >
          {formatCountdown(remaining)}
        </output>
        <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink-700">
          <span
            className="block h-full rounded-full bg-brand-400 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function StopwatchTimer() {
  const [mode, setMode] = useState<TimeMode>("stopwatch");

  /* stopwatch */
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const baseRef = useRef(0);
  const startRef = useRef(0);
  const lastLapTotalRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setElapsed(baseRef.current + (performance.now() - startRef.current));
    }, 31);
    return () => window.clearInterval(interval);
  }, [running]);

  function liveElapsed() {
    return running ? baseRef.current + (performance.now() - startRef.current) : baseRef.current;
  }

  function startStopwatch() {
    startRef.current = performance.now();
    setRunning(true);
  }

  function pauseStopwatch() {
    const next = liveElapsed();
    baseRef.current = next;
    setElapsed(next);
    setRunning(false);
  }

  function resetStopwatch() {
    setRunning(false);
    baseRef.current = 0;
    startRef.current = 0;
    lastLapTotalRef.current = 0;
    setElapsed(0);
    setLaps([]);
  }

  function recordLap() {
    if (!running) return;
    const total = liveElapsed();
    const split = total - lastLapTotalRef.current;
    lastLapTotalRef.current = total;
    setLaps((current) => [...current, { index: current.length + 1, split, total }].slice(-50));
  }

  /* timer */
  const [hoursInput, setHoursInput] = useState("0");
  const [minutesInput, setMinutesInput] = useState("5");
  const [secondsInput, setSecondsInput] = useState("0");
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(5 * 60 * 1000);
  const [finished, setFinished] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const targetRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const hours = clamp(parseInt(hoursInput || "0", 10) || 0, 0, 99);
  const minutes = clamp(parseInt(minutesInput || "0", 10) || 0, 0, 59);
  const seconds = clamp(parseInt(secondsInput || "0", 10) || 0, 0, 59);
  const duration = (hours * 3600 + minutes * 60 + seconds) * 1000;

  useEffect(() => {
    if (!timerRunning) {
      setRemaining(duration);
      setFinished(false);
    }
    // Only react to duration edits; the running guard prevents resets while ticking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  function unlockAudio() {
    if (typeof window === "undefined") return;
    const Ctor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!audioRef.current) audioRef.current = new Ctor();
    void audioRef.current.resume().catch(() => undefined);
  }

  function playChime() {
    const context = audioRef.current;
    if (!context) return;
    void context.resume().catch(() => undefined);
    const now = context.currentTime;
    [0, 0.22, 0.44].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index === 2 ? 1046 : 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(0.16, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.24);
    });
  }

  function startTimer() {
    if (duration <= 0) return;
    unlockAudio();
    const startFrom = remaining > 0 && remaining <= duration ? remaining : duration;
    targetRef.current = performance.now() + startFrom;
    setRemaining(startFrom);
    setFinished(false);
    setTimerRunning(true);
  }

  function pauseTimer() {
    const left = Math.max(0, targetRef.current - performance.now());
    setRemaining(left);
    setTimerRunning(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setFinished(false);
    setRemaining(duration);
  }

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      const left = Math.max(0, targetRef.current - performance.now());
      setRemaining(left);
      if (left <= 0) {
        setTimerRunning(false);
        setFinished(true);
        if (soundOn) playChime();
      }
    }, 100);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, soundOn]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        void audioRef.current.close().catch(() => undefined);
        audioRef.current = null;
      }
    };
  }, []);

  function applyPreset(minutesToSet: number) {
    setHoursInput("0");
    setMinutesInput(String(minutesToSet));
    setSecondsInput("0");
    setTimerRunning(false);
    setFinished(false);
    setRemaining(minutesToSet * 60 * 1000);
  }

  const stopwatch = formatStopwatch(elapsed);
  const timerValues: [string, string, string] = [hoursInput, minutesInput, secondsInput];

  return (
    <Workspace slug="stopwatch-timer">
      <div className="space-y-5">
        <Segmented
          label="Choose instrument"
          value={mode}
          onChange={setMode}
          options={[
            { value: "stopwatch", label: "Stopwatch" },
            { value: "timer", label: "Countdown timer" },
          ]}
          className="sm:max-w-xs"
        />

        {mode === "stopwatch" ? (
          <div className="space-y-4">
            <div className="grid place-items-center rounded-2xl border border-white/[0.07] bg-ink-950/60 px-4 py-10">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
                Elapsed time
              </span>
              <output
                aria-label="Stopwatch elapsed time"
                className="mt-2 font-mono text-[48px] leading-none tracking-tight text-mist-50 sm:text-[64px]"
              >
                {stopwatch.main}
                <span className="text-[0.55em] text-mist-500">.{stopwatch.fraction}</span>
              </output>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                hundredths of a second
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                onClick={running ? pauseStopwatch : startStopwatch}
                className="min-w-[128px]"
              >
                <Icon name={running ? "pause" : "play"} size={16} />
                {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
              </Button>
              <Button variant="secondary" size="lg" onClick={recordLap} disabled={!running}>
                <Icon name="flag" size={16} />
                Lap
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={resetStopwatch}
                disabled={elapsed === 0 && laps.length === 0}
                className="ml-auto"
              >
                <Icon name="refresh" size={16} />
                Reset
              </Button>
            </div>

            {laps.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                <div className="grid grid-cols-3 gap-2 border-b border-white/[0.07] bg-white/[0.025] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
                  <span>Lap</span>
                  <span className="text-right">Split</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="max-h-[220px] overflow-y-auto">
                  {[...laps].reverse().map((lap) => (
                    <div
                      key={lap.index}
                      className="grid grid-cols-3 gap-2 border-b border-white/[0.04] px-4 py-2 font-mono text-[11.5px] text-mist-300 last:border-b-0"
                    >
                      <span className="text-mist-500">#{String(lap.index).padStart(2, "0")}</span>
                      <span className="text-right">{formatLap(lap.split)}</span>
                      <span className="text-right text-mist-100">{formatLap(lap.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Note tone="info">
              Elapsed time is derived from timestamps, so it stays accurate if this tab is
              backgrounded. Laps record the split since your previous lap.
            </Note>
          </div>
        ) : (
          <div className="space-y-4">
            {finished && (
              <div role="status" aria-live="assertive">
                <Note tone="brand" title="Time's up">
                  Your countdown has finished. Press reset to use the same duration again.
                </Note>
              </div>
            )}

            <TimerDisplay remaining={remaining} total={duration} />

            <div className="grid grid-cols-3 gap-2">
              {(["Hours", "Minutes", "Seconds"] as const).map((label, index) => (
                <Field key={label} label={label} htmlFor={`timer-${label.toLowerCase()}`}>
                  <Input
                    id={`timer-${label.toLowerCase()}`}
                    type="number"
                    min={0}
                    max={index === 0 ? 99 : 59}
                    value={timerValues[index]}
                    disabled={timerRunning}
                    onChange={(event) => {
                      const setter = [setHoursInput, setMinutesInput, setSecondsInput][index];
                      setter(event.target.value);
                    }}
                    className="text-center font-mono text-[15px]"
                  />
                </Field>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                Presets
              </span>
              {[1, 3, 5, 10, 25].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  disabled={timerRunning}
                  className="rounded-md border border-white/8 bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-mist-400 transition hover:border-white/15 hover:text-mist-100 disabled:opacity-40"
                >
                  {preset} min
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                onClick={timerRunning ? pauseTimer : startTimer}
                disabled={duration <= 0}
                className="min-w-[128px]"
              >
                <Icon name={timerRunning ? "pause" : "play"} size={16} />
                {timerRunning ? "Pause" : remaining > 0 && remaining < duration ? "Resume" : "Start timer"}
              </Button>
              <Button variant="secondary" size="lg" onClick={resetTimer}>
                <Icon name="refresh" size={16} />
                Reset
              </Button>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-mist-500">
                {duration > 0
                  ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
                  : "Set a duration"}
              </span>
            </div>

            <Toggle
              label="Sound alert"
              description="Play a short chime when the timer reaches zero"
              checked={soundOn}
              onChange={setSoundOn}
            />

            <Note tone="info">
              The timer stays accurate across tab switches because it recalculates from a target
              timestamp. Background tabs may throttle the display and delay the sound slightly.
            </Note>
          </div>
        )}
      </div>
    </Workspace>
  );
}

/* -------------------------------- age calculator --------------------------- */

const MS_PER_DAY = 86_400_000;

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setMonth(result.getMonth() + months);
  const daysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), daysInTargetMonth));
  return result;
}

function addYearsClamped(date: Date, years: number): Date {
  return addMonthsClamped(date, years * 12);
}

function calendarAge(birth: Date, target: Date) {
  let years = target.getFullYear() - birth.getFullYear();
  let anchor = addYearsClamped(birth, years);
  if (anchor.getTime() > target.getTime()) {
    years -= 1;
    anchor = addYearsClamped(birth, years);
  }
  let months = 0;
  while (months < 11) {
    const next = addMonthsClamped(anchor, months + 1);
    if (next.getTime() <= target.getTime()) months += 1;
    else break;
  }
  anchor = addMonthsClamped(anchor, months);
  const days = Math.round((target.getTime() - anchor.getTime()) / MS_PER_DAY);
  return { years, months, days };
}

const ZODIAC: { sign: string; untilMonth: number; untilDay: number }[] = [
  { sign: "Capricorn", untilMonth: 1, untilDay: 19 },
  { sign: "Aquarius", untilMonth: 2, untilDay: 18 },
  { sign: "Pisces", untilMonth: 3, untilDay: 20 },
  { sign: "Aries", untilMonth: 4, untilDay: 19 },
  { sign: "Taurus", untilMonth: 5, untilDay: 20 },
  { sign: "Gemini", untilMonth: 6, untilDay: 20 },
  { sign: "Cancer", untilMonth: 7, untilDay: 22 },
  { sign: "Leo", untilMonth: 8, untilDay: 22 },
  { sign: "Virgo", untilMonth: 9, untilDay: 22 },
  { sign: "Libra", untilMonth: 10, untilDay: 22 },
  { sign: "Scorpio", untilMonth: 11, untilDay: 21 },
  { sign: "Sagittarius", untilMonth: 12, untilDay: 21 },
  { sign: "Capricorn", untilMonth: 12, untilDay: 31 },
];

function zodiacFor(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (
    ZODIAC.find((entry) => month < entry.untilMonth || (month === entry.untilMonth && day <= entry.untilDay))
      ?.sign ?? "Capricorn"
  );
}

export function AgeCalculator() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [birthInput, setBirthInput] = useState("");
  const [targetInput, setTargetInput] = useState(toInputValue(today));

  const birth = parseDateInput(birthInput);
  const target = parseDateInput(targetInput);
  const invalid = !birth || !target || birth.getTime() > target.getTime();
  const tooOld = Boolean(birth && birth.getFullYear() < 1900);

  const result = !invalid && birth && target ? calendarAge(birth, target) : null;
  const totalDays = birth && target ? Math.round((target.getTime() - birth.getTime()) / MS_PER_DAY) : 0;

  const nextBirthday = (() => {
    if (!birth || !target) return null;
    let candidate = addYearsClamped(birth, target.getFullYear() - birth.getFullYear());
    if (candidate.getTime() < target.getTime()) {
      candidate = addYearsClamped(birth, target.getFullYear() - birth.getFullYear() + 1);
    }
    const daysUntil = Math.round((candidate.getTime() - target.getTime()) / MS_PER_DAY);
    return { candidate, daysUntil };
  })();

  return (
    <Workspace slug="age-calculator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="age-birth">
            <Input
              id="age-birth"
              type="date"
              value={birthInput}
              max={targetInput}
              min="1900-01-01"
              onChange={(event) => setBirthInput(event.target.value)}
              className="font-mono"
            />
          </Field>
          <Field label="Age on date" htmlFor="age-target" hint="defaults to today">
            <div className="flex gap-2">
              <Input
                id="age-target"
                type="date"
                value={targetInput}
                min={birthInput || "1900-01-01"}
                onChange={(event) => setTargetInput(event.target.value)}
                className="font-mono"
              />
              <Button
                variant="secondary"
                className="shrink-0 px-3"
                onClick={() => setTargetInput(toInputValue(today))}
                aria-label="Use today's date"
              >
                Today
              </Button>
            </div>
          </Field>
        </div>

        {invalid ? (
          <ResultCard
            label="Exact age"
            value="—"
            hint={
              !birth
                ? "Choose a date of birth to calculate age."
                : !target
                  ? "Choose a valid target date."
                  : "The target date must be on or after the birth date."
            }
          />
        ) : (
          result &&
          birth &&
          target && (
            <>
              <div className="rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-400/[0.11] via-white/[0.025] to-transparent p-5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-200/80">
                  Exact age on {target.toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: result.years, label: "years" },
                    { value: result.months, label: "months" },
                    { value: result.days, label: "days" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="font-mono text-[30px] leading-none text-mist-50 sm:text-[38px]">
                        {item.value}
                      </p>
                      <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-mist-400">
                  You were born on a{" "}
                  <span className="text-mist-200">
                    {birth.toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                  . Your Western zodiac sign is{" "}
                  <span className="text-mist-200">{zodiacFor(birth)}</span>.
                </p>
                <div className="mt-3">
                  <CopyButton
                    value={`${result.years} years, ${result.months} months, ${result.days} days (${formatNumber(totalDays)} days total)`}
                    label="Copy age"
                    copiedLabel="Copied"
                  />
                </div>
              </div>

              {nextBirthday && (
                <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">
                    {nextBirthday.daysUntil === 0 ? "Next birthday" : "Next birthday in"}
                  </p>
                  <p className="mt-1.5 text-[15px] font-semibold text-mist-100">
                    {nextBirthday.daysUntil === 0
                      ? "Today — happy birthday!"
                      : `${formatNumber(nextBirthday.daysUntil)} days`}
                  </p>
                  <p className="mt-1 text-[11.5px] text-mist-500">
                    {nextBirthday.candidate.toLocaleDateString("en-US", { dateStyle: "long" })}
                    {birth.getMonth() === 1 && birth.getDate() === 29
                      ? " · for a 29 February birthday, the last day of February is used in non-leap years"
                      : ""}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Total days" value={formatNumber(totalDays)} />
                <StatTile label="Total weeks" value={formatNumber(Math.floor(totalDays / 7))} />
                <StatTile label="Total months" value={formatNumber(result.years * 12 + result.months)} />
                <StatTile label="Total hours" value={formatNumber(totalDays * 24)} />
              </div>
            </>
          )
        )}

        {tooOld && (
          <Note tone="warn">
            Dates before 1900 are outside the range this calculator is designed for.
          </Note>
        )}

        <Note tone="info">
          Calculated with local calendar dates, not by dividing total days by 365.25. Your age in
          hours can differ slightly depending on your time of birth and time zone. Nothing you enter
          is stored.
        </Note>
      </div>
    </Workspace>
  );
}
