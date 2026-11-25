import { useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, ResultCard, Select, StatTile, Workspace } from "@/components/ui";
import { formatNumber, parseNumeric } from "@/lib/utils";

/* ---------------------------- loan / mortgage ----------------------------- */

export function LoanMortgageCalculator() {
  const [principal, setPrincipal] = useState("250000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("25");
  const [startMonth, setStartMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const calculation = useMemo(() => {
    const amount = parseNumeric(principal);
    const annual = parseNumeric(rate);
    const termYears = parseNumeric(years);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(annual) || annual < 0 || !Number.isFinite(termYears) || termYears <= 0 || termYears > 50) {
      return null;
    }
    const monthlyRate = annual / 100 / 12;
    const payments = Math.round(termYears * 12);
    const monthly = monthlyRate === 0 ? amount / payments : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments));
    const total = monthly * payments;
    const rows: { period: number; payment: number; interest: number; principal: number; balance: number }[] = [];
    let balance = amount;
    for (let period = 1; period <= Math.min(payments, 600); period += 1) {
      const interest = balance * monthlyRate;
      const principalPart = Math.min(monthly - interest, balance);
      balance = Math.max(0, balance - principalPart);
      const yearly = period % 12 === 0 || period === payments;
      if (yearly) rows.push({ period, payment: principalPart + interest, interest, principal: principalPart, balance });
    }
    return { amount, monthly, payments, total, totalInterest: total - amount, rows, monthlyRate };
  }, [principal, rate, years]);

  return (
    <Workspace slug="loan-mortgage-calculator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Loan amount" htmlFor="loan-amount"><Input id="loan-amount" type="number" min={0} step="1000" value={principal} onChange={(event) => setPrincipal(event.target.value)} className="font-mono" /></Field>
          <Field label="Annual interest rate" htmlFor="loan-rate" hint="%"><Input id="loan-rate" type="number" min={0} max={40} step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} className="font-mono" /></Field>
          <Field label="Term" htmlFor="loan-years" hint="years"><Input id="loan-years" type="number" min={1} max={50} value={years} onChange={(event) => setYears(event.target.value)} className="font-mono" /></Field>
          <Field label="First payment" htmlFor="loan-start"><Input id="loan-start" type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className="font-mono" /></Field>
        </div>
        {!calculation ? <Note tone="warn">Enter a positive loan amount, a rate of 0–40% and a term between 1 and 50 years.</Note> : (
          <>
            <ResultCard label="Estimated monthly payment" value={formatNumber(calculation.monthly, 2)} hint={`${calculation.payments} monthly payments · formula P = r·A ÷ (1 − (1+r)⁻ⁿ), r = annual rate ÷ 12`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Principal" value={formatNumber(calculation.amount, 2)} />
              <StatTile label="Total paid" value={formatNumber(calculation.total, 2)} />
              <StatTile label="Total interest" value={formatNumber(calculation.totalInterest, 2)} />
              <StatTile label="Interest share" value={`${formatNumber((calculation.totalInterest / calculation.total) * 100, 1)}%`} />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="grid grid-cols-4 gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-mist-500"><span>Year</span><span className="text-right">Principal</span><span className="text-right">Interest</span><span className="text-right">Balance</span></div>
              <div className="max-h-[260px] overflow-auto">
                {calculation.rows.map((row, index) => (
                  <div key={row.period} className="grid grid-cols-4 gap-2 border-b border-white/[0.04] px-3 py-1.5 text-[10.5px] last:border-b-0">
                    <span className="font-mono text-mist-500">{Math.floor(index) + 1} · {row.period}</span>
                    <span className="text-right font-mono text-mist-200">{formatNumber(row.principal, 0)}</span>
                    <span className="text-right font-mono text-mist-400">{formatNumber(row.interest, 0)}</span>
                    <span className="text-right font-mono text-mist-300">{formatNumber(row.balance, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <CopyButton value={`Loan ${formatNumber(calculation.amount, 2)} at ${formatNumber(parseNumeric(rate), 2)}% for ${formatNumber(parseNumeric(years), 0)} years: monthly payment about ${formatNumber(calculation.monthly, 2)}; total interest about ${formatNumber(calculation.totalInterest, 2)}. Estimate only, not financial advice.`} label="Copy estimate" copiedLabel="Copied" />
          </>
        )}
        <Note tone="warn" title="An estimate, not a loan offer">This excludes fees, insurance, taxes, early-repayment charges and rate changes. Lenders may use different day-count and compounding conventions. It is not financial, tax or legal advice.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- VAT ----------------------------------- */

export function VatCalculator() {
  const [mode, setMode] = useState<"add" | "extract">("add");
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState("20");
  const [preset, setPreset] = useState("20");
  const value = parseNumeric(amount);
  const percentage = parseNumeric(rate);
  const valid = Number.isFinite(value) && value >= 0 && Number.isFinite(percentage) && percentage >= 0 && percentage < 1000;
  const net = valid ? (mode === "add" ? value : value / (1 + percentage / 100)) : Number.NaN;
  const vat = valid ? net * (percentage / 100) : Number.NaN;
  const gross = valid ? net + vat : Number.NaN;
  const presets = [5, 8, 20, 21, 23, 25];

  return (
    <Workspace slug="vat-calculator">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["add", "extract"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setMode(option)} aria-pressed={mode === option} className={mode === option ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] text-mist-400"}>
              {option === "add" ? "Add VAT to net price" : "Extract VAT from gross price"}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={mode === "add" ? "Net amount" : "Gross amount"} htmlFor="vat-amount"><Input id="vat-amount" type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="font-mono text-[15px]" /></Field>
          <Field label="VAT rate" htmlFor="vat-rate" hint="your local rate"><div className="flex gap-2"><Input id="vat-rate" type="number" min={0} max={999} step="0.1" value={rate} onChange={(event) => { setRate(event.target.value); setPreset(""); }} className="font-mono" /><Select aria-label="Common VAT presets" value={preset} onChange={(event) => { setPreset(event.target.value); if (event.target.value) setRate(event.target.value); }} options={[{ value: "", label: "Presets" }, ...presets.map((item) => ({ value: String(item), label: `${item}%` }))]} /></div></Field>
        </div>
        {!valid ? <Note tone="warn">Enter a non-negative amount and a VAT rate.</Note> : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Net" value={formatNumber(net, 2)} />
              <StatTile label="VAT" value={formatNumber(vat, 2)} />
              <StatTile label="Gross" value={formatNumber(gross, 2)} />
            </div>
            <CopyButton value={`Net ${formatNumber(net, 2)} + VAT ${formatNumber(percentage, 2)}% (${formatNumber(vat, 2)}) = gross ${formatNumber(gross, 2)}`} label="Copy breakdown" copiedLabel="Copied" />
            <p className="font-mono text-[10px] leading-relaxed text-mist-500">{mode === "add" ? "Gross = net × (1 + rate/100)" : "VAT = gross × rate ÷ (100 + rate) — not rate% of the gross figure"}</p>
          </>
        )}
        <Note tone="warn">Rates are entered by you. Toolsy does not embed statutory VAT rates, exemptions or territory rules; confirm the correct treatment with a qualified tax adviser. This is arithmetic, not tax advice.</Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- tip / bill split --------------------------- */

export function TipBillSplitter() {
  const [bill, setBill] = useState("120");
  const [tip, setTip] = useState("15");
  const [tax, setTax] = useState("0");
  const [people, setPeople] = useState("4");
  const [tipOnTotal, setTipOnTotal] = useState(true);
  const subtotal = parseNumeric(bill);
  const tipRate = parseNumeric(tip);
  const taxRate = parseNumeric(tax) || 0;
  const count = Math.max(1, Math.floor(parseNumeric(people) || 1));
  const valid = Number.isFinite(subtotal) && subtotal >= 0 && Number.isFinite(tipRate) && tipRate >= 0;
  const base = valid ? subtotal : 0;
  const tipBase = tipOnTotal ? base + (base * taxRate) / 100 : base;
  const tipAmount = (tipBase * tipRate) / 100;
  const taxAmount = (base * taxRate) / 100;
  const total = base + taxAmount + tipAmount;
  const perPerson = total / count;
  const rounded = Math.ceil(perPerson * 100) / 100;

  return (
    <Workspace slug="tip-bill-splitter">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Bill amount" htmlFor="tip-bill"><Input id="tip-bill" type="number" min={0} step="0.01" value={bill} onChange={(event) => setBill(event.target.value)} className="font-mono" /></Field>
          <Field label="Tip" htmlFor="tip-percent" hint="%"><Input id="tip-percent" type="number" min={0} max={100} value={tip} onChange={(event) => setTip(event.target.value)} className="font-mono" /></Field>
          <Field label="Tax" htmlFor="tip-tax" hint="% (optional)"><Input id="tip-tax" type="number" min={0} max={100} value={tax} onChange={(event) => setTax(event.target.value)} className="font-mono" /></Field>
          <Field label="People" htmlFor="tip-people"><Input id="tip-people" type="number" min={1} max={200} value={people} onChange={(event) => setPeople(event.target.value)} className="font-mono" /></Field>
        </div>
        <label className="flex items-center gap-2 text-[11.5px] text-mist-400"><input type="checkbox" checked={tipOnTotal} onChange={(event) => setTipOnTotal(event.target.checked)} className="size-4 accent-[#C7F05F]" /> Calculate tip on the amount including tax</label>
        {!valid ? <Note tone="warn">Enter a non-negative bill and tip percentage.</Note> : (
          <>
            <ResultCard label="Each person pays" value={formatNumber(rounded, 2)} hint={`${formatNumber(total, 2)} total including ${formatNumber(tipAmount, 2)} tip${taxAmount ? ` and ${formatNumber(taxAmount, 2)} tax` : ""} · rounded up to the cent`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Tip amount" value={formatNumber(tipAmount, 2)} />
              <StatTile label="Tax" value={formatNumber(taxAmount, 2)} />
              <StatTile label="Grand total" value={formatNumber(total, 2)} />
              <StatTile label="People" value={String(count)} />
            </div>
            <CopyButton value={`Bill ${formatNumber(base, 2)} + tax ${formatNumber(taxAmount, 2)} + tip ${formatNumber(tipAmount, 2)} = ${formatNumber(total, 2)}; ${count} people pay ${formatNumber(rounded, 2)} each.`} label="Copy split" copiedLabel="Copied" />
          </>
        )}
        <Note tone="info">The per-person amount is rounded up slightly so the collected total covers the bill. Tipping customs differ; nothing here is a recommendation.</Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- fuel ----------------------------------- */

export function FuelCostCalculator() {
  const [distance, setDistance] = useState("300");
  const [efficiency, setEfficiency] = useState("6.5");
  const [unit, setUnit] = useState<"l100" | "mpg-us" | "mpg-uk">("l100");
  const [price, setPrice] = useState("6.50");
  const [roundTrip, setRoundTrip] = useState(false);
  const km = parseNumeric(distance);
  const eff = parseNumeric(efficiency);
  const cost = parseNumeric(price);
  const valid = [km, eff, cost].every((value) => Number.isFinite(value) && value >= 0) && eff > 0;
  const totalKm = valid ? km * (roundTrip ? 2 : 1) : 0;
  const litresPer100 = unit === "l100" ? eff : unit === "mpg-us" ? 235.214583 / eff : 282.480936 / eff;
  const litres = valid ? (totalKm * litresPer100) / 100 : 0;
  const total = litres * cost;

  return (
    <Workspace slug="fuel-cost-calculator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Distance (km)" htmlFor="fuel-distance"><Input id="fuel-distance" type="number" min={0} value={distance} onChange={(event) => setDistance(event.target.value)} className="font-mono" /></Field>
          <Field label="Consumption" htmlFor="fuel-efficiency"><div className="flex gap-2"><Input id="fuel-efficiency" type="number" min={0} step="0.1" value={efficiency} onChange={(event) => setEfficiency(event.target.value)} className="font-mono" /><Select aria-label="Consumption unit" value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)} options={[{ value: "l100", label: "L/100 km" }, { value: "mpg-us", label: "MPG (US)" }, { value: "mpg-uk", label: "MPG (UK)" }]} /></div></Field>
          <Field label="Fuel price per litre" htmlFor="fuel-price"><Input id="fuel-price" type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="font-mono" /></Field>
          <div className="flex items-end"><label className="flex items-center gap-2 text-[11.5px] text-mist-400"><input type="checkbox" checked={roundTrip} onChange={(event) => setRoundTrip(event.target.checked)} className="size-4 accent-[#C7F05F]" /> Round trip (×2)</label></div>
        </div>
        {!valid ? <Note tone="warn">Enter non-zero values. Consumption must be greater than zero.</Note> : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Distance" value={`${formatNumber(totalKm, 1)} km`} />
              <StatTile label="Consumption" value={`${formatNumber(litresPer100, 2)} L/100km`} />
              <StatTile label="Fuel needed" value={`${formatNumber(litres, 2)} L`} />
              <StatTile label="Estimated cost" value={formatNumber(total, 2)} />
            </div>
            <CopyButton value={`${formatNumber(totalKm, 1)} km at ${formatNumber(litresPer100, 2)} L/100km needs ${formatNumber(litres, 2)} L; estimated fuel cost ${formatNumber(total, 2)}.`} label="Copy estimate" copiedLabel="Copied" />
          </>
        )}
        <Note tone="info">An estimate only: traffic, load, tyres, weather and driving style change real consumption. Price is the one you enter, not a live fuel price.</Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------- electricity ------------------------------- */

export function ElectricityCostCalculator() {
  const [watts, setWatts] = useState("2000");
  const [hours, setHours] = useState("4");
  const [price, setPrice] = useState("0.30");
  const [days, setDays] = useState("365");
  const power = parseNumeric(watts);
  const usage = parseNumeric(hours);
  const tariff = parseNumeric(price);
  const daysUsed = Math.max(1, parseNumeric(days) || 365);
  const valid = [power, usage, tariff].every((value) => Number.isFinite(value) && value >= 0) && daysUsed > 0;
  const dailyKwh = (power * usage) / 1000;
  const dailyCost = dailyKwh * tariff;
  const annualKwh = dailyKwh * daysUsed;
  const annualCost = annualKwh * tariff;

  return (
    <Workspace slug="electricity-cost-calculator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Power" htmlFor="elec-watts" hint="watts"><Input id="elec-watts" type="number" min={0} value={watts} onChange={(event) => setWatts(event.target.value)} className="font-mono" /></Field>
          <Field label="Hours per day" htmlFor="elec-hours"><Input id="elec-hours" type="number" min={0} max={24} step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} className="font-mono" /></Field>
          <Field label="Price per kWh" htmlFor="elec-price"><Input id="elec-price" type="number" min={0} step="0.001" value={price} onChange={(event) => setPrice(event.target.value)} className="font-mono" /></Field>
          <Field label="Days per year" htmlFor="elec-days"><Input id="elec-days" type="number" min={1} max={366} value={days} onChange={(event) => setDays(event.target.value)} className="font-mono" /></Field>
        </div>
        {!valid ? <Note tone="warn">Enter non-negative power, hours and price values.</Note> : (
          <>
            <ResultCard label="Estimated annual cost" value={formatNumber(annualCost, 2)} hint={`${formatNumber(dailyKwh, 3)} kWh/day · formula: watts × hours ÷ 1000 × price per kWh`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Daily energy" value={`${formatNumber(dailyKwh, 3)} kWh`} />
              <StatTile label="Daily cost" value={formatNumber(dailyCost, 2)} />
              <StatTile label="Yearly energy" value={`${formatNumber(annualKwh, 1)} kWh`} />
              <StatTile label="Monthly average" value={formatNumber(annualCost / 12, 2)} />
            </div>
            <CopyButton value={`${formatNumber(power, 0)} W for ${formatNumber(usage, 2)} h/day at ${formatNumber(tariff, 4)} per kWh ≈ ${formatNumber(dailyKwh, 2)} kWh/day, ${formatNumber(dailyCost, 2)}/day, ${formatNumber(annualCost, 2)}/year.`} label="Copy estimate" copiedLabel="Copied" />
          </>
        )}
        <Note tone="info">Rated power is usually a maximum; real draw can be lower. Standing charges, tiered tariffs and time-of-use pricing are not included. Use your own unit price for a meaningful estimate.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- time zones ------------------------------ */

const COMMON_ZONES = ["UTC", "Europe/Warsaw", "Europe/London", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney", "America/Sao_Paulo"];

export function TimeZoneConverter() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [source, setSource] = useState(local);
  const [zones, setZones] = useState<string[]>([local, "UTC", "America/New_York", "Asia/Tokyo"].filter((zone, index, list) => list.indexOf(zone) === index));
  const [extra, setExtra] = useState("Europe/London");
  type TzRow = { zone: string; local: string; offset: string };
  const result = useMemo<{ error?: string; rows?: TzRow[] }>(() => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return { error: "Choose a valid date and time." };
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
    const sourceDate = new Date(utcGuess);
    let offset = 0;
    try {
      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: source, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const parts = Object.fromEntries(formatter.formatToParts(sourceDate).map((part) => [part.type, part.value]));
      const asSource = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
      offset = asSource - utcGuess;
    } catch {
      return { error: `Unknown time zone “${source}”.` };
    }
    const instant = new Date(utcGuess - offset);
    const rows: TzRow[] = zones.map((zone) => {
      try {
        return { zone, local: new Intl.DateTimeFormat("en-GB", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(instant), offset: new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "" };
      } catch { return null; }
    }).filter((row): row is TzRow => Boolean(row));
    return { rows };
  }, [date, time, source, zones]);

  return (
    <Workspace slug="time-zone-converter">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Date" htmlFor="tz-date"><Input id="tz-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="font-mono" /></Field>
          <Field label="Time" htmlFor="tz-time"><Input id="tz-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="font-mono" /></Field>
          <Field label="Source zone" htmlFor="tz-source"><Select id="tz-source" value={source} onChange={(event) => setSource(event.target.value)} options={[...new Set([local, ...COMMON_ZONES])].map((zone) => ({ value: zone, label: zone }))} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Add a time zone" value={extra} onChange={(event) => setExtra(event.target.value)} options={COMMON_ZONES.map((zone) => ({ value: zone, label: zone }))} className="max-w-[240px]" />
          <Button variant="secondary" size="sm" onClick={() => setZones((current) => current.includes(extra) ? current : [...current, extra])}><Icon name="plus" size={13} /> Add zone</Button>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">your zone: {local}</span>
        </div>
        {result.error ? <Note tone="warn">{result.error}</Note> : !result.rows?.length ? <Note tone="warn">Choose a valid date and time.</Note> : (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            {result.rows.map((row) => (
              <div key={row.zone} className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-b-0">
                <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-mist-300">{row.zone}</span>
                <span className="font-mono text-[10px] text-mist-500">{row.offset}</span>
                <span className="w-[190px] text-right text-[11.5px] font-medium text-mist-100">{row.local}</span>
                <button type="button" onClick={() => setZones((current) => current.filter((zone) => zone !== row.zone))} aria-label={`Remove ${row.zone}`} className="grid size-6 place-items-center rounded border border-white/8 text-mist-600 hover:text-rose-300"><Icon name="close" size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <Note tone="info">Daylight-saving rules come from the IANA database built into your browser. Check exceptional government changes for official scheduling.</Note>
      </div>
    </Workspace>
  );
}

/* ----------------------------- working days ------------------------------ */

export function WorkingDaysCalculator() {
  const today = new Date();
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const [mode, setMode] = useState<"between" | "add">("between");
  const [start, setStart] = useState(iso(today));
  const [end, setEnd] = useState(iso(new Date(today.getTime() + 30 * 86_400_000)));
  const [addDays, setAddDays] = useState("10");
  const [holidays, setHolidays] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const holidayList = holidays.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);

  function isWeekend(date: Date) { const day = date.getDay(); return day === 0 || day === 6; }
  function isHoliday(date: Date) { return holidayList.includes(iso(date)); }

  const result = useMemo(() => {
    const parse = (value: string) => { const [y, m, d] = value.split("-").map(Number); if (!y) return null; const date = new Date(y, m - 1, d); return Number.isNaN(date.getTime()) ? null : date; };
    if (mode === "add") {
      const from = parse(start);
      const count = Math.max(0, Math.min(2000, parseInt(addDays, 10) || 0));
      if (!from) return { error: "Choose a start date." };
      if (isWeekend(from) || isHoliday(from)) {
        // Advance to the next working day without counting it.
        do { from.setDate(from.getDate() + 1); } while (isWeekend(from) || isHoliday(from));
      }
      let added = 0;
      const cursor = new Date(from);
      while (added < count) {
        cursor.setDate(cursor.getDate() + 1);
        if (!isWeekend(cursor) && !isHoliday(cursor)) added += 1;
      }
      return { target: cursor, count };
    }
    const from = parse(start);
    const to = parse(end);
    if (!from || !to) return { error: "Choose two valid dates." };
    const [early, late] = from <= to ? [from, to] : [to, from];
    let working = 0;
    let calendar = 0;
    const cursor = new Date(early);
    while (cursor <= late) {
      const isEdge = inclusive || (cursor.getTime() !== early.getTime() && cursor.getTime() !== late.getTime());
      if (isEdge && !isWeekend(cursor) && !isHoliday(cursor)) working += 1;
      calendar += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { from: early, to: late, working, calendar };
  }, [mode, start, end, addDays, holidays, inclusive]);

  return (
    <Workspace slug="working-days-calculator">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["between", "add"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setMode(option)} aria-pressed={mode === option} className={mode === option ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-[12px] font-semibold text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[12px] text-mist-400"}>{option === "between" ? "Count between dates" : "Add working days"}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Start date" htmlFor="wd-start"><Input id="wd-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} className="font-mono" /></Field>
          {mode === "between" ? <Field label="End date" htmlFor="wd-end"><Input id="wd-end" type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="font-mono" /></Field> : <Field label="Working days to add" htmlFor="wd-add"><Input id="wd-add" type="number" min={0} max={2000} value={addDays} onChange={(event) => setAddDays(event.target.value)} className="font-mono" /></Field>}
        </div>
        <Field label="Holidays" htmlFor="wd-holidays" hint="YYYY-MM-DD, comma separated"><Input id="wd-holidays" value={holidays} onChange={(event) => setHolidays(event.target.value)} placeholder="2026-12-25, 2026-12-26" className="font-mono text-[12px]" /></Field>
        {mode === "between" && <label className="flex items-center gap-2 text-[11.5px] text-mist-400"><input type="checkbox" checked={inclusive} onChange={(event) => setInclusive(event.target.checked)} className="size-4 accent-[#C7F05F]" /> Include both start and end dates</label>}
        {"error" in result ? <Note tone="warn">{result.error}</Note> : mode === "add" ? (
          <ResultCard label="Target date" value={result.target?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) ?? "—"} hint={`${result.count} working days added, skipping Saturdays, Sundays and the holidays entered`} />
        ) : (
          <>
            <ResultCard label="Working days" value={String(result.working ?? 0)} hint={`${result.calendar ?? 0} calendar days · Monday–Friday only · ${holidayList.length} custom holidays`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile label="Calendar days" value={String(result.calendar ?? 0)} />
              <StatTile label="Working days" value={String(result.working ?? 0)} />
              <StatTile label="Weekend days" value={String((result.calendar ?? 0) - (result.working ?? 0))} />
            </div>
          </>
        )}
        <Note tone="info">Assumes a Monday–Friday working week. Holidays are only those you enter; Toolsy does not embed any country's public holiday calendar. This is not payroll or legal advice.</Note>
      </div>
    </Workspace>
  );
}
