import { OPENINGS_RAW, OPENINGS_SOURCE } from "@/data/chessOpenings";
import { OPENING_NOTES, findOpeningNotes, type OpeningNotes } from "@/data/chessOpeningNotes";

export type OpeningLine = {
  eco: string;
  name: string;
  moves: string[];
  family: string;
  slug: string;
};

export type OpeningCategoryId = "open" | "semi-open" | "closed" | "indian" | "flank";

export const OPENING_CATEGORIES: { id: OpeningCategoryId; label: string }[] = [
  { id: "open", label: "Open Games" },
  { id: "semi-open", label: "Semi-Open Games" },
  { id: "closed", label: "Closed Games" },
  { id: "indian", label: "Indian Defenses" },
  { id: "flank", label: "Flank Openings" },
];

export type Continuation = { san: string; name: string; eco: string; plies: number; weight: number };

export type Recognition = {
  /** Deepest matching database line for the current move sequence. */
  line: OpeningLine | null;
  /** Entry stored exactly at the current position, if the dataset names it. */
  atNode: OpeningLine | null;
  /** Shallowest matching line — useful to name the wider family. */
  base: OpeningLine | null;
  notes: OpeningNotes | null;
  /** How many of the played plies exist in the database tree. */
  knownDepth: number;
  continuations: Continuation[];
};

export const CHESS_SOURCE = OPENINGS_SOURCE;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function openingCategory(moves: string[]): OpeningCategoryId {
  const white = moves[0] ?? "";
  const black = moves[1] ?? "";
  if (white === "e4") return black === "e5" ? "open" : "semi-open";
  if (white === "d4") return black === "d5" ? "closed" : black === "Nf6" ? "indian" : "closed";
  return "flank";
}

export function classifyOpeningType(name: string): "Gambit" | "Defense" | "Attack" | "Standard opening" {
  if (/gambit/i.test(name)) return "Gambit";
  if (/defen[cs]e/i.test(name)) return "Defense";
  if (/attack/i.test(name)) return "Attack";
  return "Standard opening";
}

type LineWithKey = OpeningLine & { key: string };

let cachedLines: LineWithKey[] | null = null;

function parseLines(): LineWithKey[] {
  if (cachedLines) return cachedLines;
  const parsed: LineWithKey[] = [];
  for (const raw of OPENINGS_RAW.split("\n")) {
    if (!raw) continue;
    const [eco, name, san] = raw.split("\t");
    if (!eco || !name || !san) continue;
    const moves = san.split(" ").filter(Boolean);
    parsed.push({
      eco,
      name,
      moves,
      family: name.split(":")[0].trim(),
      slug: slugify(name),
      key: moves.join(" "),
    });
  }
  cachedLines = parsed;
  return parsed;
}

export function allOpenings(): OpeningLine[] {
  return parseLines();
}

/* --------------------------------- trie ---------------------------------- */

type TrieNode = { children: Map<string, TrieNode>; line?: OpeningLine; weight: number };

/** Check/mate markers are not needed to identify an opening line. */
function normaliseSan(san: string): string {
  return san.replace(/[+#]/g, "").replace(/[!?]/g, "");
}

let trie: TrieNode | null = null;

function buildTrie(): TrieNode {
  if (trie) return trie;
  const root: TrieNode = { children: new Map(), weight: 0 };
  for (const line of parseLines()) {
    let node = root;
    for (const rawSan of line.moves) {
      const san = normaliseSan(rawSan);
      let child = node.children.get(san);
      if (!child) {
        child = { children: new Map(), weight: 0 };
        node.children.set(san, child);
      }
      child.weight += 1;
      node = child;
    }
    if (!node.line) {
      node.line = { eco: line.eco, name: line.name, moves: line.moves, family: line.family, slug: line.slug };
    }
  }
  trie = root;
  return root;
}

function firstLineInSubtree(node: TrieNode): OpeningLine | null {
  if (node.line) return node.line;
  for (const child of node.children.values()) {
    const found = firstLineInSubtree(child);
    if (found) return found;
  }
  return null;
}

/** Recognise the opening reached by a SAN move sequence. */
export function recogniseOpening(sanMoves: string[]): Recognition {
  const empty: Recognition = { line: null, atNode: null, base: null, notes: null, knownDepth: 0, continuations: [] };
  if (sanMoves.length === 0) return empty;

  const root = buildTrie();
  let node = root;
  let line: OpeningLine | null = null;
  let base: OpeningLine | null = null;
  let knownDepth = 0;

  for (const rawSan of sanMoves) {
    const san = normaliseSan(rawSan);
    const child = node.children.get(san);
    if (!child) {
      return { ...empty, line, atNode: null, base, notes: line ? findOpeningNotes(line.name) : null, knownDepth };
    }
    node = child;
    knownDepth += 1;
    if (child.line) {
      line = child.line;
      if (!base) base = child.line;
    }
  }

  const continuations: Continuation[] = [];
  for (const [san, child] of node.children) {
    const found = firstLineInSubtree(child);
    if (found) continuations.push({ san, name: found.name, eco: found.eco, plies: found.moves.length, weight: child.weight });
  }
  continuations.sort((a, b) => b.weight - a.weight || a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name));

  return {
    line,
    atNode: node.line ?? null,
    base,
    notes: line ? findOpeningNotes(line.name) : null,
    knownDepth,
    continuations: continuations.slice(0, 16),
  };
}

export function openingVariation(name: string): string | null {
  const parts = name.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : null;
}

/* -------------------------------- library -------------------------------- */

export type LibraryEntry = {
  slug: string;
  family: string;
  eco: string;
  moves: string[];
  category: OpeningCategoryId;
  gambit: boolean;
  variations: number;
  line: OpeningLine;
};

let cachedLibrary: LibraryEntry[] | null = null;

/** One entry per opening family, using its shortest database line. */
export function openingLibrary(): LibraryEntry[] {
  if (cachedLibrary) return cachedLibrary;
  const byFamily = new Map<string, { line: OpeningLine; variations: Set<string> }>();
  for (const line of parseLines()) {
    const existing = byFamily.get(line.family);
    if (!existing) {
      byFamily.set(line.family, { line, variations: new Set([line.name]) });
      continue;
    }
    existing.variations.add(line.name);
    if (line.moves.length < existing.line.moves.length) existing.line = line;
  }
  cachedLibrary = [...byFamily.entries()].map(([family, value]) => ({
    slug: slugify(family),
    family,
    eco: value.line.eco,
    moves: value.line.moves,
    category: openingCategory(value.line.moves),
    gambit: /gambit/i.test(family),
    variations: value.variations.size,
    line: value.line,
  }));
  cachedLibrary.sort((a, b) => a.family.localeCompare(b.family));
  return cachedLibrary;
}

export function searchOpenings(query: string, limit = 80): OpeningLine[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const results = parseLines().filter((line) =>
    `${line.name} ${line.eco} ${line.moves.join(" ")}`.toLowerCase().includes(normalized)
  );
  results.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(normalized) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(normalized) ? 0 : 1;
    return aStarts - bStarts || a.moves.length - b.moves.length || a.name.localeCompare(b.name);
  });
  return results.slice(0, limit).map(({ eco, name, moves, family, slug }) => ({ eco, name, moves, family, slug }));
}

/** Resolve a curated notes key to the shortest matching database line. */
export function lineForCuratedKey(key: string): OpeningLine | null {
  const normalized = key.toLowerCase();
  const matches = parseLines().filter((line) => line.name.toLowerCase().startsWith(normalized));
  if (matches.length === 0) return null;
  matches.sort((a, b) => a.moves.length - b.moves.length || a.name.localeCompare(b.name));
  const { eco, name, moves, family, slug } = matches[0];
  return { eco, name, moves, family, slug };
}

export function curatedStarters(limit = 24): LibraryEntry[] {
  const library = openingLibrary();
  const starters: LibraryEntry[] = [];
  const seen = new Set<string>();
  for (const notes of OPENING_NOTES) {
    const line = lineForCuratedKey(notes.key);
    if (!line) continue;
    const entry = library.find((item) => item.family === line.family) ?? null;
    if (!entry || seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    starters.push(entry);
    if (starters.length >= limit) break;
  }
  return starters;
}

export function randomOpening(): LibraryEntry | null {
  const pool = curatedStarters(40);
  if (pool.length === 0) return null;
  const bytes = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else bytes[0] = Math.floor(Math.random() * 4294967296);
  return pool[bytes[0] % pool.length];
}

export function openingInfoFor(line: OpeningLine | null): {
  name: string;
  variation: string | null;
  eco: string;
  type: string;
  notes: OpeningNotes | null;
  category: OpeningCategoryId | null;
} | null {
  if (!line) return null;
  return {
    name: line.family,
    variation: openingVariation(line.name),
    eco: line.eco,
    type: classifyOpeningType(line.name),
    notes: findOpeningNotes(line.name),
    category: line.moves.length ? openingCategory(line.moves) : null,
  };
}
