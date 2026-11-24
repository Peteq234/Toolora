import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  Select,
  Workspace,
} from "@/components/ui";
import { pickRandom, randomInt } from "@/lib/utils";

const ADJECTIVES = [
  "quiet", "lunar", "wild", "neon", "brave", "misty", "silver", "rapid", "cozy", "vivid",
  "amber", "north", "velvet", "cosmic", "clever", "hollow", "golden", "electric", "sunny",
  "tidal", "dusty", "gentle", "atomic", "polar",
];

const NOUNS = [
  "falcon", "river", "ember", "otter", "meadow", "comet", "harbor", "pixel", "willow", "raven",
  "sprocket", "tundra", "lantern", "orbit", "pebble", "cedar", "delta", "finch", "acorn",
  "moss", "signal", "canyon", "quartz", "maple",
];

const ROLES = ["studio", "works", "labs", "collective", "supply", "systems", "atelier", "shop"];
const GAMER_SUFFIXES = ["gg", "hq", "plays", "irl", "tv", "zone", "arena", "clan"];

type Style = "clean" | "playful" | "professional" | "gamer" | "handle";

const STYLES: { value: Style; label: string }[] = [
  { value: "clean", label: "Clean — two words, no clutter" },
  { value: "playful", label: "Playful — friendly and casual" },
  { value: "professional", label: "Professional — studio or brand feel" },
  { value: "gamer", label: "Gamer — short with a suffix" },
  { value: "handle", label: "Handle — keyword-led" },
];

const SEPARATORS = [
  { value: "", label: "No separator" },
  { value: "_", label: "Underscore ( _ )" },
  { value: "-", label: "Hyphen ( - )" },
  { value: ".", label: "Dot ( . )" },
];

const NUMBER_CHOICES = [
  { value: "none", label: "No numbers" },
  { value: "double", label: "Two digits" },
  { value: "triple", label: "Three digits" },
];

function sanitizeKeyword(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
}

function buildName(
  keyword: string,
  style: Style,
  separator: string,
  numbers: string,
  attempt: number
): string {
  const first = keyword || pickRandom(ADJECTIVES);
  const second = pickRandom(NOUNS);
  let core: string;

  switch (style) {
    case "professional":
      core = `${keyword || second}${separator}${pickRandom(ROLES)}`;
      break;
    case "gamer":
      core = `${second}${separator}${pickRandom(GAMER_SUFFIXES)}`;
      break;
    case "playful":
      core = `${first}${separator}${second}`;
      break;
    case "handle":
      core = `${first}${separator}${pickRandom(ADJECTIVES)}`;
      break;
    default:
      core = `${first}${separator}${second}`;
  }

  if (numbers === "double") core += String(attempt + randomInt(10, 90));
  if (numbers === "triple") core += String(randomInt(100, 999));

  return core
    .replace(/\s+/g, "")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 30);
}

export function UsernameGenerator() {
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState<Style>("clean");
  const [separator, setSeparator] = useState("");
  const [numbers, setNumbers] = useState("none");
  const [count, setCount] = useState(6);
  const [results, setResults] = useState<string[]>([]);

  function generate() {
    const cleanKeyword = sanitizeKeyword(keyword);
    const generated = new Set<string>();
    let guard = 0;
    while (generated.size < count && guard < 300) {
      generated.add(buildName(cleanKeyword, style, separator, numbers, guard));
      guard += 1;
    }
    setResults([...generated]);
  }

  useEffect(() => {
    generate();
    // Generate the first batch once; later batches are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Workspace slug="username-generator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Your keyword"
            htmlFor="username-keyword"
            hint="optional"
          >
            <Input
              id="username-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="e.g. nova, moss, alex"
              maxLength={16}
              autoComplete="off"
              className="font-mono"
            />
          </Field>
          <Field label="How many?" htmlFor="username-count">
            <Select
              id="username-count"
              value={String(count)}
              onChange={(event) => setCount(Number(event.target.value))}
              options={[3, 6, 10, 15, 20].map((amount) => ({
                value: String(amount),
                label: `${amount} usernames`,
              }))}
            />
          </Field>
          <Field label="Style" htmlFor="username-style">
            <Select
              id="username-style"
              value={style}
              onChange={(event) => setStyle(event.target.value as Style)}
              options={STYLES}
            />
          </Field>
          <Field label="Separator" htmlFor="username-separator">
            <Select
              id="username-separator"
              value={separator}
              onChange={(event) => setSeparator(event.target.value)}
              options={SEPARATORS}
            />
          </Field>
          <Field label="Numbers" htmlFor="username-numbers" className="sm:col-span-2">
            <Select
              id="username-numbers"
              value={numbers}
              onChange={(event) => setNumbers(event.target.value)}
              options={NUMBER_CHOICES}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generate}>
            <Icon name="sparkles" size={15} />
            Generate usernames
          </Button>
          <CopyButton value={results.join("\n")} label="Copy all" copiedLabel="Copied all" />
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-mist-500">
            {results.length} ideas
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-mist-500">
              Press generate to create your first batch.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {results.map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="group flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 font-mono text-[10px] text-mist-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate font-mono text-[13.5px] text-mist-100">{name}</span>
                  </span>
                  <CopyButton
                    value={name}
                    label={`Copy ${name}`}
                    copiedLabel="Copied"
                    iconOnly
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-mist-500"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Note tone="info">
          These are ideas, not reservations. Toolora cannot check availability or trademark status
          on Steam, Instagram, TikTok, GitHub or anywhere else — verify the name on each platform and
          review its rules before signing up.
        </Note>
      </div>
    </Workspace>
  );
}
