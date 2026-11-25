import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Note,
  Slider,
  Toggle,
  Workspace,
} from "@/components/ui";
import { secureRandomInt, shuffleSecure } from "@/lib/utils";

type CharacterOptions = {
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

const CHARACTER_SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/|~",
};

const LOOKALIKES = /[0OoIl1|`'"]/g;

function buildPassword(length: number, options: CharacterOptions, avoidLookalikes: boolean): string {
  const enabledPools = (Object.keys(CHARACTER_SETS) as (keyof CharacterOptions)[])
    .filter((key) => options[key])
    .map((key) => {
      const source = CHARACTER_SETS[key];
      return avoidLookalikes ? source.replace(LOOKALIKES, "") : source;
    })
    .filter((pool) => pool.length > 0);

  if (enabledPools.length === 0) return "";

  const all = enabledPools.join("");
  const characters: string[] = enabledPools.map((pool) => pool[secureRandomInt(pool.length)]);

  while (characters.length < length) {
    characters.push(all[secureRandomInt(all.length)]);
  }

  return shuffleSecure(characters).slice(0, length).join("");
}

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState<CharacterOptions>({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
  });
  const [avoidLookalikes, setAvoidLookalikes] = useState(false);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);

  const enabledCount = Object.values(options).filter(Boolean).length;

  useEffect(() => {
    setPassword(buildPassword(length, options, avoidLookalikes));
  }, [length, options, avoidLookalikes]);

  const strength = useMemo(() => {
    const poolSize = (Object.keys(CHARACTER_SETS) as (keyof CharacterOptions)[])
      .filter((key) => options[key])
      .reduce((total, key) => {
        const source = CHARACTER_SETS[key];
        return total + (avoidLookalikes ? source.replace(LOOKALIKES, "").length : source.length);
      }, 0);
    const bits = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;
    const level = bits < 45 ? 1 : bits < 70 ? 2 : bits < 100 ? 3 : 4;
    const labels = ["No character types selected", "Weak for a shared secret", "Good", "Strong", "Excellent"];
    return { bits, level, label: labels[level], poolSize };
  }, [length, options, avoidLookalikes]);

  function toggleOption(key: keyof CharacterOptions) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <Workspace slug="password-generator">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
              Generated password
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mist-600">
              never leaves this tab
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-brand-400/20 bg-brand-400/[0.045] p-3 sm:flex-row sm:items-center">
            <output
              aria-label="Generated password"
              className="min-h-[42px] flex-1 select-all break-all rounded-lg bg-ink-950/60 px-3 py-2.5 font-mono text-[15px] leading-relaxed tracking-wide text-mist-50 sm:text-[17px]"
            >
              {password ? (visible ? password : "•".repeat(Math.min(password.length, 40))) : "Select at least one character type"}
            </output>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? "Hide password" : "Show password"}
                className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-300 transition hover:bg-white/[0.07] hover:text-mist-50"
              >
                <Icon name={visible ? "eyeOff" : "eye"} size={16} />
              </button>
              <CopyButton value={password} label="Copy" copiedLabel="Copied" size="md" />
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPassword(buildPassword(length, options, avoidLookalikes))}
                aria-label="Generate a new password"
                iconOnly
              >
                <Icon name="refresh" size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
          <Slider label="Password length" value={length} min={8} max={64} onChange={setLength} suffix="chars" />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {[12, 16, 24, 32, 48].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLength(preset)}
                className={
                  length === preset
                    ? "rounded-md border border-brand-400/40 bg-brand-400/10 px-2 py-1 font-mono text-[10px] text-brand-200"
                    : "rounded-md border border-white/8 bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-mist-500 transition hover:border-white/15 hover:text-mist-200"
                }
              >
                {preset}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-mist-500">16+ recommended</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-mist-200">Character types</h3>
            <span className="font-mono text-[10px] text-mist-500">
              pool size {strength.poolSize}
            </span>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <Toggle label="Uppercase" description="A – Z" checked={options.upper} onChange={() => toggleOption("upper")} />
            <Toggle label="Lowercase" description="a – z" checked={options.lower} onChange={() => toggleOption("lower")} />
            <Toggle label="Numbers" description="0 – 9" checked={options.numbers} onChange={() => toggleOption("numbers")} />
            <Toggle label="Symbols" description="! @ # $ % & *" checked={options.symbols} onChange={() => toggleOption("symbols")} />
          </div>
          <div className="mt-2">
            <Toggle
              label="Avoid look-alike characters"
              description="Removes 0/O, 1/l/I and similar characters"
              checked={avoidLookalikes}
              onChange={setAvoidLookalikes}
            />
          </div>
          {enabledCount === 0 && (
            <Note tone="warn" className="mt-2">
              Turn on at least one character type to generate a password.
            </Note>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold text-mist-200">Estimated strength</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist-400">
              {strength.label} · {strength.bits} bits
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={
                  strength.level >= segment
                    ? segment === 1
                      ? "h-1.5 rounded-full bg-rose-400"
                      : segment === 2
                        ? "h-1.5 rounded-full bg-amber-300"
                        : segment === 3
                          ? "h-1.5 rounded-full bg-brand-400"
                          : "h-1.5 rounded-full bg-emerald-300"
                    : "h-1.5 rounded-full bg-ink-700"
                }
              />
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-mist-500">
            Entropy is estimated from length × log₂(pool size). It measures unpredictability, not
            whether a website will accept the password. Store it in a password manager and never
            reuse it.
          </p>
        </div>

        <Note tone="brand" icon>
          Passwords are created with <span className="text-mist-200">crypto.getRandomValues</span> on
          your device. Toolsy has no server endpoint that receives them, and reloading clears this
          one.
        </Note>
      </div>
    </Workspace>
  );
}
