import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { Button, CopyButton, Field, Input, Note, Select, Slider, Toggle, Workspace } from "@/components/ui";
import { randomInt, secureRandomInt } from "@/lib/utils";

function cryptoBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let index = 0; index < length; index += 1) bytes[index] = secureRandomInt(256);
  return bytes;
}
function toHex(bytes: Uint8Array): string { return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function toBase64(bytes: Uint8Array, urlSafe: boolean): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

/* -------------------------------- passphrase ----------------------------- */

const WORDS = "amber anchor apple arrow autumn badge bamboo barrel basket beacon birch biscuit bishop blanket blossom bottle branch breeze bridge bronze bubble bucket butter cabin cactus camera candle canvas canyon carbon carpet castle cedar chalk cherry chimney cider cinnamon circle citrus clover cobalt coffee comet copper coral cotton crane crater cricket crimson crystal daisy dawn delta desert diamond dock dolphin donkey dragon drift eagle earth ember engine falcon feather fern field finch fire flame flint forest fossil fountain fox frost garden garlic gecko ginger glacier glass globe gold goose granite grape grass harbor hazel heron hill honey horizon horse island ivory jade jaguar jasmine juniper kettle kiwi lagoon lake lantern leaf lemon lilac lily linen lion lizard lobster lotus lunar magnet mango maple marble meadow melon meteor mint mirror mist molar monkey moss mountain nectar needle nickel night north oak ocean olive onion orchid otter owl paddle paper peach pearl pebble pepper pine planet plum pocket pond poppy prairie prism puffin pumpkin quartz quince rabbit radar rain raven reef ribbon rice river robin rocket rose rowan ruby saddle saffron sage salmon sand satin scarlet shell silver sky slate snail snow sparrow spice spring spruce squid star stone storm sugar summit sunset surf swan syrup tea teal thistle thunder tide tiger timber toffee topaz torch trail tulip tundra turtle valley velvet violet walnut wave wheat willow window winter wolf wood wool yellow zebra".split(" ");
const SEPARATORS = [{ value: "-", label: "Hyphen ( - )" }, { value: ".", label: "Dot ( . )" }, { value: "_", label: "Underscore ( _ )" }, { value: " ", label: "Space" }];

export function PassphraseGenerator() {
  const [count, setCount] = useState(5);
  const [separator, setSeparator] = useState("-");
  const [capitalise, setCapitalise] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [result, setResult] = useState("");
  const bits = Math.round(count * Math.log2(WORDS.length));

  function generate() {
    const picked = Array.from({ length: count }, () => WORDS[cryptoBytes(2)[0] % WORDS.length]);
    const words = capitalise ? picked.map((word) => word.charAt(0).toUpperCase() + word.slice(1)) : picked;
    setResult(`${words.join(separator)}${addNumber ? separator + randomInt(10, 99) : ""}`);
  }
  useEffect(() => { generate(); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, separator, capitalise, addNumber]);

  return (
    <Workspace slug="passphrase-generator">
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.045] p-3">
          <output aria-label="Generated passphrase" className="block break-words rounded-lg bg-ink-950/60 px-3 py-2.5 font-mono text-[16px] tracking-wide text-mist-50">{result}</output>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton value={result} label="Copy passphrase" copiedLabel="Copied" />
            <Button variant="secondary" size="sm" onClick={generate}><Icon name="refresh" size={13} /> Regenerate</Button>
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{bits} bits · local</span>
          </div>
        </div>
        <Slider label="Words" value={count} min={3} max={10} onChange={setCount} suffix="words" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Separator" htmlFor="pass-separator"><Select id="pass-separator" value={separator} onChange={(event) => setSeparator(event.target.value)} options={SEPARATORS} /></Field>
          <div className="grid gap-2">
            <Toggle label="Capitalise each word" checked={capitalise} onChange={setCapitalise} />
            <Toggle label="Append a two-digit number" checked={addNumber} onChange={setAddNumber} />
          </div>
        </div>
        <Note tone="warn" title="Strength is approximate">Entropy assumes the words are chosen uniformly from this {WORDS.length}-word list. Fewer words means less entropy. Use a unique passphrase per important account and store it in a password manager. Nothing is transmitted or saved.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- UUID ---------------------------------- */

export function UuidGenerator() {
  const [count, setCount] = useState("10");
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [list, setList] = useState<string[]>([]);

  const amount = Math.max(1, Math.min(1000, parseInt(count, 10) || 1));

  function generate() {
    const ids = Array.from({ length: amount }, () => {
      let value: string;
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") value = crypto.randomUUID();
      else {
        const bytes = cryptoBytes(16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = toHex(bytes);
        value = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
      if (!hyphens) value = value.replace(/-/g, "");
      if (uppercase) value = value.toUpperCase();
      if (braces) value = `{${value}}`;
      return value;
    });
    setList(ids);
  }
  useEffect(() => { generate(); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, uppercase, braces, hyphens]);

  return (
    <Workspace slug="uuid-generator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="How many UUIDs?" htmlFor="uuid-count"><Input id="uuid-count" type="number" min={1} max={1000} value={count} onChange={(event) => setCount(event.target.value)} className="font-mono" /></Field>
          <div className="grid gap-2">
            <Toggle label="Uppercase" checked={uppercase} onChange={setUppercase} />
            <Toggle label="Wrap in braces" checked={braces} onChange={setBraces} />
            <Toggle label="Keep hyphens" checked={hyphens} onChange={setHyphens} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-2">
          <textarea readOnly value={list.join("\n")} rows={10} aria-label="Generated UUIDs" className="w-full resize-y bg-transparent font-mono text-[11.5px] leading-relaxed text-mist-200 outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={generate}><Icon name="refresh" size={14} /> Generate</Button>
          <CopyButton value={list.join("\n")} label="Copy all" copiedLabel="Copied" />
          <Button variant="secondary" size="sm" onClick={() => {
            const blob = new Blob([list.join("\n")], { type: "text/plain" });
            const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "toolora-uuids.txt"; a.click(); URL.revokeObjectURL(url);
          }}><Icon name="download" size={13} /> Download .txt</Button>
        </div>
        <Note tone="warn">UUIDs are identifiers, not secrets. For password-reset links or API keys, use the Secure Token Generator. Generation uses the browser's cryptographic random source.</Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- tokens --------------------------------- */

export function SecureTokenGenerator() {
  const [bytes, setBytes] = useState(32);
  const [encoding, setEncoding] = useState<"hex" | "base64" | "base64url">("hex");
  const [token, setToken] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  function generate() {
    const next = encoding === "hex" ? toHex(cryptoBytes(bytes)) : toBase64(cryptoBytes(bytes), encoding === "base64url");
    setToken(next);
    setHistory((current) => [next, ...current].slice(0, 5));
  }
  useEffect(() => { generate(); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, encoding]);

  return (
    <Workspace slug="secure-token-generator">
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.045] p-3">
          <output aria-label="Generated token" className="block break-all rounded-lg bg-ink-950/60 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-mist-50">{token}</output>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton value={token} label="Copy token" copiedLabel="Copied" />
            <Button variant="secondary" size="sm" onClick={generate}><Icon name="refresh" size={13} /> New token</Button>
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-500">{bytes * 8} bits · not stored</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="Random bytes" value={bytes} min={8} max={128} step={8} onChange={setBytes} suffix="bytes" />
          <Field label="Encoding" htmlFor="token-encoding"><Select id="token-encoding" value={encoding} onChange={(event) => setEncoding(event.target.value as typeof encoding)} options={[{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }, { value: "base64url", label: "Base64 URL-safe" }]} /></Field>
        </div>
        {history.length > 1 && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Earlier tokens (this page only)</p>
            <div className="mt-1.5 space-y-1">{history.slice(1).map((item, index) => <p key={index} className="truncate rounded border border-white/[0.05] px-2 py-1 font-mono text-[10px] text-mist-500">{item}</p>)}</div>
          </div>
        )}
        <Note tone="warn" title="Treat this as a secret">Bytes come from crypto.getRandomValues. Toolora neither transmits nor stores tokens, so you must copy it now. Store it in a secret manager and rotate it if exposed.</Note>
      </div>
    </Workspace>
  );
}

/* --------------------------------- teams --------------------------------- */

export function RandomTeamGenerator() {
  const [names, setNames] = useState("Ada\nGrace\nAlan\nEdsger\nBarbara\nDonald\nMargaret\nKen");
  const [teams, setTeams] = useState("2");
  const [result, setResult] = useState<string[][]>([]);

  const participants = useMemo(() => [...new Set(names.split("\n").map((name) => name.trim()).filter(Boolean))], [names]);
  const teamCount = Math.max(1, Math.min(20, parseInt(teams, 10) || 1));

  function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = secureRandomInt(index + 1);
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }
  function draw() {
    if (participants.length === 0) return;
    const buckets: string[][] = Array.from({ length: teamCount }, () => []);
    shuffle(participants).forEach((name, index) => buckets[index % teamCount].push(name));
    setResult(buckets);
  }

  return (
    <Workspace slug="random-team-generator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <Field label="Participants" htmlFor="team-names" hint="one name per line"><textarea id="team-names" value={names} onChange={(event) => setNames(event.target.value)} rows={8} className="field-input resize-y font-mono text-[12px]" /></Field>
          <Field label="Teams" htmlFor="team-count"><Input id="team-count" type="number" min={1} max={20} value={teams} onChange={(event) => setTeams(event.target.value)} className="font-mono" /></Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={draw} disabled={participants.length < teamCount}><Icon name="shuffle" size={14} /> Draw teams</Button>
          <CopyButton value={result.map((team, index) => `Team ${index + 1}: ${team.join(", ")}`).join("\n")} label="Copy teams" copiedLabel="Copied" />
          <span className="ml-auto self-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">{participants.length} people · {teamCount} teams</span>
        </div>
        {result.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {result.map((team, index) => (
              <div key={index} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-300">Team {index + 1}</p>
                <ul className="mt-1.5 space-y-1 text-[12px] text-mist-200">{team.map((name) => <li key={name}>{name}</li>)}</ul>
              </div>
            ))}
          </div>
        )}
        <Note tone="info">Names are shuffled with secure randomness before dealing, so list order gives no advantage. Treat results as a fair one-off draw, not a permanent grouping.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ study timer ------------------------------ */

export function StudyPomodoroTimer() {
  const [focus, setFocus] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [cycle, setCycle] = useState(4);
  const [phase, setPhase] = useState<"focus" | "short" | "long">("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [sound, setSound] = useState(true);
  const target = useRef(0);
  const audio = useRef<AudioContext | null>(null);

  const durations = { focus: focus * 60, short: shortBreak * 60, long: longBreak * 60 };
  const total = durations[phase];

  useEffect(() => { if (!running) setSecondsLeft(durations[phase]); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [focus, shortBreak, longBreak, phase]);

  function chime() {
    if (!sound) return;
    try {
      const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      audio.current ??= new Ctor();
      const context = audio.current;
      void context.resume();
      const now = context.currentTime;
      [0, 0.2].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = index ? 1046 : 784;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(now + offset); oscillator.stop(now + offset + 0.28);
      });
    } catch { /* audio unavailable */ }
  }

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.round((target.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(interval);
        setRunning(false);
        chime();
        if (phase === "focus") {
          const nextCount = completed + 1;
          setCompleted(nextCount);
          setPhase(nextCount % cycle === 0 ? "long" : "short");
        } else {
          setPhase("focus");
        }
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [running, phase, completed, cycle, sound]);

  useEffect(() => () => { if (audio.current) void audio.current.close().catch(() => undefined); }, []);

  function toggle() {
    if (running) { setRunning(false); return; }
    target.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
  }
  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const progress = total ? 1 - secondsLeft / total : 0;

  return (
    <Workspace slug="study-pomodoro-timer">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.07] bg-ink-950/60 px-4 py-8 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-300">{phase === "focus" ? "Focus session" : phase === "short" ? "Short break" : "Long break"}</p>
          <output aria-label="Time remaining" className="mt-2 block font-mono text-[56px] leading-none tracking-tight text-mist-50">{clock}</output>
          <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-ink-700"><span className="block h-full rounded-full bg-brand-400 transition-[width] duration-300" style={{ width: `${Math.min(100, progress * 100)}%` }} /></div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">{completed} focus session{completed === 1 ? "" : "s"} completed this visit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={toggle} className="min-w-[120px]"><Icon name={running ? "pause" : "play"} size={15} /> {running ? "Pause" : secondsLeft < total ? "Resume" : "Start"}</Button>
          <Button variant="secondary" size="md" onClick={() => { setRunning(false); setSecondsLeft(durations[phase]); }}><Icon name="refresh" size={14} /> Reset</Button>
          <Button variant="ghost" size="sm" onClick={() => { setRunning(false); setPhase("focus"); }}>Back to focus</Button>
          <div className="ml-auto"><Toggle label="Sound cue" checked={sound} onChange={setSound} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Focus (min)" htmlFor="pomo-focus"><Input id="pomo-focus" type="number" min={1} max={120} value={focus} onChange={(event) => setFocus(Math.max(1, Math.min(120, Number(event.target.value) || 25)))} className="font-mono" /></Field>
          <Field label="Short break" htmlFor="pomo-short"><Input id="pomo-short" type="number" min={1} max={60} value={shortBreak} onChange={(event) => setShortBreak(Math.max(1, Math.min(60, Number(event.target.value) || 5)))} className="font-mono" /></Field>
          <Field label="Long break" htmlFor="pomo-long"><Input id="pomo-long" type="number" min={1} max={90} value={longBreak} onChange={(event) => setLongBreak(Math.max(1, Math.min(90, Number(event.target.value) || 15)))} className="font-mono" /></Field>
          <Field label="Sessions per cycle" htmlFor="pomo-cycle"><Input id="pomo-cycle" type="number" min={2} max={12} value={cycle} onChange={(event) => setCycle(Math.max(2, Math.min(12, Number(event.target.value) || 4)))} className="font-mono" /></Field>
        </div>
        <Note tone="info">Timer phases recalculate from timestamps, so background tabs do not cause drift. Session history resets when you reload — it is not uploaded or saved.</Note>
      </div>
    </Workspace>
  );
}

/* ---------------------------- exam countdown ----------------------------- */

type ExamEntry = { id: string; title: string; date: string; done: boolean };
const EXAM_KEY = "toolora:exams:v1";

export function ExamCountdown() {
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [now, setNow] = useState(Date.now());
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem(EXAM_KEY); if (raw) setEntries(JSON.parse(raw) as ExamEntry[]); } catch { setStorageError("Saved exams could not be read from this browser."); }
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(EXAM_KEY, JSON.stringify(entries)); } catch { setStorageError("This browser refused to save the list (storage may be full or blocked)."); }
  }, [entries]);

  function add() {
    if (title.trim().length < 2 || !date) return;
    setEntries((current) => [...current, { id: `exam-${Date.now()}`, title: title.trim(), date, done: false }]);
    setTitle(""); setDate("");
  }

  return (
    <Workspace slug="exam-countdown">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <Field label="Exam or deadline" htmlFor="exam-title"><Input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mathematics final" maxLength={80} /></Field>
          <Field label="Date" htmlFor="exam-date"><Input id="exam-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="font-mono" /></Field>
          <Button onClick={add} disabled={title.trim().length < 2 || !date}><Icon name="plus" size={14} /> Add</Button>
        </div>
        {storageError && <Note tone="warn">{storageError}</Note>}
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center"><Icon name="calendar" size={20} className="mx-auto text-mist-500" /><p className="mt-2 text-[12.5px] font-semibold text-mist-200">No exams added yet</p><p className="mt-1 text-[11px] text-mist-500">Entries are saved in this browser only. No account and no notifications.</p></div>
        ) : (
          <div className="space-y-2">
            {[...entries].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => {
              const target = new Date(`${entry.date}T00:00:00`);
              const diff = target.getTime() - now;
              const days = Math.ceil(diff / 86_400_000);
              const hours = Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000));
              return (
                <div key={entry.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] px-3 py-2.5">
                  <input type="checkbox" checked={entry.done} onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, done: event.target.checked } : item))} aria-label={`Mark ${entry.title} complete`} className="size-4 accent-[#C7F05F]" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12.5px] font-medium ${entry.done ? "text-mist-500 line-through" : "text-mist-100"}`}>{entry.title}</p>
                    <p className="font-mono text-[9.5px] text-mist-500">{target.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={days < 0 ? "font-mono text-[10px] uppercase tracking-wider text-mist-600" : days <= 3 ? "font-mono text-[10px] uppercase tracking-wider text-amber-300" : "font-mono text-[10px] uppercase tracking-wider text-brand-300"}>
                    {days < 0 ? `${Math.abs(days)} d ago` : days === 0 ? `today · ${hours} h left` : `${days} day${days === 1 ? "" : "s"} left`}
                  </span>
                  <button type="button" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))} aria-label={`Delete ${entry.title}`} className="grid size-7 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="trash" size={11} /></button>
                </div>
              );
            })}
          </div>
        )}
        <Note tone="info">Saved locally on this device with localStorage. It cannot send reminders while the site is closed, and clearing site data removes the list.</Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------- flashcards ------------------------------ */

type Card = { id: string; front: string; back: string };
const CARD_KEY = "toolora:flashcards:v1";

export function FlashcardCreator() {
  const [cards, setCards] = useState<Card[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState<Card[] | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem(CARD_KEY); if (raw) setCards(JSON.parse(raw) as Card[]); } catch { setNotice("Saved cards could not be read."); }
  }, []);
  useEffect(() => { try { localStorage.setItem(CARD_KEY, JSON.stringify(cards)); } catch { setNotice("Cards could not be saved; local storage may be full."); } }, [cards]);

  const deck = shuffled ?? cards;
  const current = deck[index];

  function addCard() {
    if (!front.trim() || !back.trim()) return;
    setCards((current) => [...current, { id: `card-${Date.now()}`, front: front.trim(), back: back.trim() }]);
    setFront(""); setBack(""); setShuffled(null); setIndex(0); setFlipped(false);
  }
  function studyOrder() {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) { const j = secureRandomInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    setShuffled(copy); setIndex(0); setFlipped(false);
  }

  return (
    <Workspace slug="flashcard-creator">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Front (prompt)" htmlFor="card-front"><Input id="card-front" value={front} onChange={(event) => setFront(event.target.value)} placeholder="What is 7 × 8?" maxLength={300} /></Field>
          <Field label="Back (answer)" htmlFor="card-back"><Input id="card-back" value={back} onChange={(event) => setBack(event.target.value)} placeholder="56" maxLength={300} /></Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={addCard} disabled={!front.trim() || !back.trim()}><Icon name="plus" size={14} /> Add card</Button>
          <Button variant="secondary" size="sm" onClick={studyOrder} disabled={cards.length < 2}><Icon name="shuffle" size={13} /> Study shuffled</Button>
          <Button variant="ghost" size="sm" onClick={() => { setCards([]); setShuffled(null); setIndex(0); }} disabled={!cards.length}>Clear deck</Button>
          <span className="ml-auto self-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">{cards.length} cards · local</span>
        </div>
        {notice && <Note tone="warn">{notice}</Note>}
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center"><Icon name="fileText" size={20} className="mx-auto text-mist-500" /><p className="mt-2 text-[12.5px] font-semibold text-mist-200">Your deck is empty</p><p className="mt-1 text-[11px] text-mist-500">Add a prompt and answer to start studying.</p></div>
        ) : current && (
          <div>
            <button type="button" onClick={() => setFlipped((value) => !value)} className="grid min-h-[190px] w-full place-items-center rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-400/[0.08] to-transparent p-5 text-center">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-300">{flipped ? "Answer" : "Prompt"} · card {index + 1} of {deck.length}</p>
                <p className="mt-3 text-[20px] font-medium leading-snug text-mist-50">{flipped ? current.back : current.front}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[10.5px] text-mist-500"><Icon name="refresh" size={11} /> Tap to flip</span>
              </div>
            </button>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setIndex((index - 1 + deck.length) % deck.length); setFlipped(false); }}><Icon name="arrowLeft" size={13} /> Previous</Button>
              <Button variant="ghost" size="sm" onClick={() => { setIndex((index + 1) % deck.length); setFlipped(false); }}>Next <Icon name="arrowRight" size={13} /></Button>
            </div>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {cards.map((card, cardIndex) => (
                <div key={card.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2 py-1.5">
                  <button type="button" onClick={() => { setShuffled(null); setIndex(cardIndex); setFlipped(false); }} className="min-w-0 flex-1 truncate text-left text-[11px] text-mist-300 hover:text-mist-100">{card.front}</button>
                  <button type="button" onClick={() => setCards((current) => current.filter((entry) => entry.id !== card.id))} aria-label={`Delete card ${card.front}`} className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="trash" size={10} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <Note tone="info">Flip-and-shuffle review supports active recall; it is not a spaced-repetition scheduler. Cards are stored in this browser only.</Note>
      </div>
    </Workspace>
  );
}

/* -------------------------------- checklist ------------------------------ */

type CheckItem = { id: string; text: string; done: boolean };
const CHECK_KEY = "toolora:checklist:v1";

export function ChecklistMaker() {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem(CHECK_KEY); if (raw) setItems(JSON.parse(raw) as CheckItem[]); } catch { setNotice("Saved checklist could not be read."); }
  }, []);
  useEffect(() => { try { localStorage.setItem(CHECK_KEY, JSON.stringify(items)); } catch { setNotice("Checklist could not be saved; local storage may be full."); } }, [items]);

  const done = items.filter((item) => item.done).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <Workspace slug="checklist-maker">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && text.trim()) { setItems((current) => [...current, { id: `item-${Date.now()}`, text: text.trim(), done: false }]); setText(""); } }} placeholder="Add a task and press Enter" aria-label="New checklist item" />
          <Button onClick={() => { if (!text.trim()) return; setItems((current) => [...current, { id: `item-${Date.now()}`, text: text.trim(), done: false }]); setText(""); }} disabled={!text.trim()}><Icon name="plus" size={14} /> Add</Button>
        </div>
        {notice && <Note tone="warn">{notice}</Note>}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3">
          <div className="flex items-center justify-between text-[11.5px] text-mist-300"><span>{done} of {items.length} complete</span><span className="font-mono text-brand-300">{percent}%</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700"><span className="block h-full rounded-full bg-brand-400" style={{ width: `${percent}%` }} /></div>
        </div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-[11.5px] text-mist-500">Your checklist is empty. Add the first item above.</div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.012] px-2.5 py-1.5">
                <input type="checkbox" checked={item.done} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: event.target.checked } : entry))} aria-label={`Mark ${item.text} complete`} className="size-4 accent-[#C7F05F]" />
                <span className={`min-w-0 flex-1 truncate text-[12px] ${item.done ? "text-mist-500 line-through" : "text-mist-200"}`}>{item.text}</span>
                <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`Delete ${item.text}`} className="grid size-6 place-items-center rounded border border-white/8 text-mist-500 hover:text-rose-300"><Icon name="trash" size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <CopyButton value={items.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n")} label="Copy checklist" copiedLabel="Copied" />
          <Button variant="ghost" size="sm" onClick={() => setItems((current) => current.filter((item) => !item.done))} disabled={!done}>Remove completed</Button>
          <Button variant="ghost" size="sm" onClick={() => setItems([])} disabled={!items.length}>Clear all</Button>
        </div>
        <Note tone="info">One local checklist stored in this browser — no account and no sync. Copy important items before clearing site data.</Note>
      </div>
    </Workspace>
  );
}
