import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Icon } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { ChessBoard, type BoardMatrix } from "@/components/chess/ChessBoard";
import { ChessPiece, type PieceType } from "@/components/chess/pieces";
import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  Input,
  Note,
  StatTile,
  Workspace,
} from "@/components/ui";
import {
  CHESS_SOURCE,
  OPENING_CATEGORIES,
  classifyOpeningType,
  openingLibrary,
  openingVariation,
  randomOpening,
  curatedStarters,
  recogniseOpening,
  searchOpenings,
  type LibraryEntry,
  type OpeningCategoryId,
  type OpeningLine,
} from "@/lib/chessOpenings";
import { downloadFile } from "@/lib/utils";

const START_FEN = new Chess().fen();
const PROMOTION_PIECES: { piece: PieceType; label: string }[] = [
  { piece: "q", label: "Queen" },
  { piece: "r", label: "Rook" },
  { piece: "b", label: "Bishop" },
  { piece: "n", label: "Knight" },
];

type GameNode = {
  id: string;
  parentId: string | null;
  san: string;
  from: string;
  to: string;
  fen: string;
  children: string[];
  lastChild: string | null;
};

type PromotionPiece = "q" | "r" | "b" | "n";

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `n${sequence}-${Date.now().toString(36)}`;
}

function createRoot(fen: string): GameNode {
  return { id: "root", parentId: null, san: "", from: "", to: "", fen, children: [], lastChild: null };
}

function findMoveBySan(game: Chess, san: string): Move | null {
  const target = san.replace(/[+#]/g, "");
  return game.moves({ verbose: true }).find((move) => move.san.replace(/[+#]/g, "") === target) ?? null;
}

function pathNodes(nodes: Record<string, GameNode>, currentId: string): GameNode[] {
  const result: GameNode[] = [];
  const seen = new Set<string>();
  let id: string | null = currentId;
  while (id && id !== "root" && !seen.has(id)) {
    seen.add(id);
    const node: GameNode | undefined = nodes[id];
    if (!node) break;
    result.unshift(node);
    id = node.parentId;
  }
  return result;
}

function mainLineEnd(nodes: Record<string, GameNode>): string {
  let id = "root";
  const seen = new Set<string>();
  while (nodes[id]?.children.length) {
    id = nodes[id].children[0];
    if (seen.has(id)) break;
    seen.add(id);
  }
  return id;
}

function moveLabel(ply: number): string {
  return `${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? "." : "..."}`;
}

function serialize(nodes: Record<string, GameNode>, parentId: string, ply: number): string {
  const children = nodes[parentId]?.children ?? [];
  if (children.length === 0) return "";
  const [mainId, ...alternatives] = children;
  const main = nodes[mainId];
  let text = `${moveLabel(ply)} ${main.san}`;
  for (const altId of alternatives) {
    const alt = nodes[altId];
    const tail = serialize(nodes, altId, ply + 1);
    text += ` (${moveLabel(ply)} ${alt.san}${tail ? ` ${tail}` : ""})`;
  }
  const continuation = serialize(nodes, mainId, ply + 1);
  return `${text}${continuation ? ` ${continuation}` : ""}`.trim();
}

function buildPgn(nodes: Record<string, GameNode>, rootFen: string): string {
  const parts = rootFen.split(" ");
  const fullmove = Number(parts[5] ?? 1);
  const side = parts[1] === "b" ? 1 : 0;
  const startPly = (Math.max(1, fullmove) - 1) * 2 + side;
  const date = new Date();
  const headers = [
    '[Event "Toolsy Chess Playground"]',
    '[Site "Toolsy"]',
    `[Date "${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}"]`,
    '[Round "-"]',
    '[White "?"]',
    '[Black "?"]',
    '[Result "*"]',
  ];
  if (rootFen !== START_FEN) headers.push('[SetUp "1"]', `[FEN "${rootFen}"]`);
  const body = serialize(nodes, "root", startPly) || "*";
  return `${headers.join("\n")}\n\n${body} *\n`;
}

function formatMoveList(moves: string[], maxPlies = 8): string {
  const shown = moves.slice(0, maxPlies);
  const pairs: string[] = [];
  for (let index = 0; index < shown.length; index += 2) {
    const number = Math.floor(index / 2) + 1;
    pairs.push(`${number}. ${shown[index]}${shown[index + 1] ? ` ${shown[index + 1]}` : ""}`);
  }
  return `${pairs.join(" ")}${moves.length > maxPlies ? " …" : ""}`;
}

export function ChessPlayground() {
  const [nodes, setNodes] = useState<Record<string, GameNode>>(() => ({ root: createRoot(START_FEN) }));
  const [currentId, setCurrentId] = useState("root");
  const [rootFen, setRootFen] = useState(START_FEN);
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [coordinates, setCoordinates] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [tab, setTab] = useState<"opening" | "explorer" | "library" | "data">("opening");
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [fenInput, setFenInput] = useState("");
  const [pgnInput, setPgnInput] = useState("");
  const [libQuery, setLibQuery] = useState("");
  const [libCategory, setLibCategory] = useState<"all" | "gambit" | OpeningCategoryId>("all");
  const [libLimit, setLibLimit] = useState(36);
  const [showAllContinuations, setShowAllContinuations] = useState(false);
  const [autoTab, setAutoTab] = useState(true);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const flash = useCallback((tone: "ok" | "error" | "info", text: string) => {
    setNotice({ tone, text });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5500);
  }, []);

  const current = nodes[currentId] ?? nodes.root;
  const game = useMemo(() => new Chess(current.fen), [current.fen]);
  const board = game.board() as unknown as BoardMatrix;
  const turn = game.turn();
  const path = useMemo(() => pathNodes(nodes, currentId), [nodes, currentId]);
  const sanMoves = useMemo(() => path.map((node) => node.san), [path]);
  const sanKey = sanMoves.join(" ");
  const recognition = useMemo(
    () => (rootFen === START_FEN ? recogniseOpening(sanKey ? sanKey.split(" ") : []) : null),
    [rootFen, sanKey]
  );
  const lastMove = path.length ? { from: path[path.length - 1].from, to: path[path.length - 1].to } : null;
  const fullmove = Number(game.fen().split(" ")[5] ?? 1);
  const inTrie = Boolean(recognition && recognition.knownDepth === path.length);
  const isNamedPosition = Boolean(inTrie && recognition?.atNode);

  const checkSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    const targetColor = game.turn();
    for (let rowIndex = 0; rowIndex < 8; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < 8; columnIndex += 1) {
        const piece = board[rowIndex]?.[columnIndex];
        if (piece && piece.type === "k" && piece.color === targetColor) {
          return `${"abcdefgh"[columnIndex]}${8 - rowIndex}`;
        }
      }
    }
    return null;
  }, [board, game]);

  const legalTargets = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!selected) return map;
    try {
      for (const move of game.moves({ square: selected as Square, verbose: true })) {
        map.set(move.to, move.flags.includes("c") || move.flags.includes("e"));
      }
    } catch {
      /* invalid square */
    }
    return map;
  }, [game, selected]);

  const status = useMemo(() => {
    if (game.isCheckmate()) return `${game.turn() === "w" ? "Black" : "White"} wins by checkmate`;
    if (game.isStalemate()) return "Stalemate — no legal moves";
    if (game.isInsufficientMaterial()) return "Draw — insufficient material";
    if (game.isThreefoldRepetition()) return "Draw — threefold repetition";
    if (game.isGameOver()) return "Draw";
    return `${game.turn() === "w" ? "White" : "Black"} to move${game.inCheck() ? " · check" : ""}`;
  }, [game]);

  const pgn = useMemo(() => buildPgn(nodes, rootFen), [nodes, rootFen]);

  /**
   * Navigate to a node. The variation tree keeps children[0] as the main line
   * and records lastChild purely for redo, so navigating never reorders moves.
   */
  const goTo = useCallback((id: string) => {
    setNodes((prev) => {
      const target = prev[id];
      if (!target || !target.parentId) return prev;
      const parent = prev[target.parentId];
      if (!parent || parent.lastChild === id) return prev;
      return { ...prev, [target.parentId]: { ...parent, lastChild: id } };
    });
    setCurrentId(id);
    setSelected(null);
    setPromotion(null);
  }, []);

  const playMove = useCallback(
    (from: string, to: string, promotionPiece?: PromotionPiece) => {
      const parent = nodes[currentId] ?? nodes.root;
      const next = new Chess(parent.fen);
      let candidates: Move[];
      try {
        candidates = next.moves({ square: from as Square, verbose: true }).filter((move) => move.to === to);
      } catch {
        return false;
      }
      if (candidates.length === 0) return false;
      const needsPromotion = candidates.some((move) => Boolean(move.promotion));
      if (needsPromotion && !promotionPiece) {
        setPromotion({ from, to });
        return true;
      }
      let moved: Move;
      try {
        moved = next.move({
          from: from as Square,
          to: to as Square,
          ...(needsPromotion ? { promotion: promotionPiece ?? "q" } : {}),
        });
      } catch {
        return false;
      }
      const fen = next.fen();
      const existing = parent.children.find((id) => nodes[id]?.san === moved.san && nodes[id]?.fen === fen);
      setPromotion(null);
      setSelected(null);
      if (existing) {
        goTo(existing);
        return true;
      }
      const id = nextId();
      const node: GameNode = {
        id,
        parentId: parent.id,
        san: moved.san,
        from: moved.from,
        to: moved.to,
        fen,
        children: [],
        lastChild: null,
      };
      setNodes((prev) => ({
        ...prev,
        [id]: node,
        // Append new branches after the existing main line so the original line is never reordered.
        [parent.id]: { ...prev[parent.id], children: [...prev[parent.id].children, id], lastChild: id },
      }));
      setCurrentId(id);
      if (autoTab) setTab("opening");
      return true;
    },
    [autoTab, currentId, goTo, nodes]
  );

  const playSan = useCallback(
    (san: string) => {
      const next = new Chess(current.fen);
      const found = findMoveBySan(next, san);
      if (!found) {
        flash("error", `“${san}” is not legal in this position.`);
        return;
      }
      playMove(found.from, found.to, found.promotion as PromotionPiece | undefined);
    },
    [current.fen, flash, playMove]
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      if (promotion) return;
      const position = new Chess(current.fen);
      const piece = position.get(square as Square);
      if (selected) {
        if (selected === square) {
          setSelected(null);
          return;
        }
        const legal = position.moves({ square: selected as Square, verbose: true }).some((move) => move.to === square);
        if (legal) {
          playMove(selected, square);
          return;
        }
        if (piece && piece.color === position.turn()) {
          setSelected(square);
          return;
        }
        setSelected(null);
        return;
      }
      if (piece && piece.color === position.turn()) setSelected(square);
    },
    [current.fen, playMove, promotion, selected]
  );

  const loadSequence = useCallback(
    (moves: string[], startFen = START_FEN) => {
      const replay = new Chess(startFen);
      const map: Record<string, GameNode> = { root: createRoot(startFen) };
      let parentId = "root";
      let lastId = "root";
      let applied = 0;
      for (const san of moves) {
        const found = findMoveBySan(replay, san);
        if (!found) break;
        let moved: Move;
        try {
          moved = replay.move(found);
        } catch {
          break;
        }
        const id = nextId();
        map[id] = {
          id,
          parentId,
          san: moved.san,
          from: moved.from,
          to: moved.to,
          fen: replay.fen(),
          children: [],
          lastChild: null,
        };
        map[parentId] = { ...map[parentId], children: [...map[parentId].children, id], lastChild: id };
        parentId = id;
        lastId = id;
        applied += 1;
      }
      setNodes(map);
      setCurrentId(lastId);
      setRootFen(startFen);
      setSelected(null);
      setPromotion(null);
      return applied;
    },
    []
  );

  const resetBoard = useCallback(() => {
    setNodes({ root: createRoot(START_FEN) });
    setCurrentId("root");
    setRootFen(START_FEN);
    setSelected(null);
    setPromotion(null);
    setNotice(null);
    setTab("opening");
  }, []);

  const loadOpening = useCallback(
    (line: OpeningLine) => {
      const applied = loadSequence(line.moves);
      setTab("opening");
      setAutoTab(true);
      flash("ok", `Loaded ${line.name} (${line.eco})${applied < line.moves.length ? " — stopped at an illegal move" : ""}.`);
    },
    [flash, loadSequence]
  );

  const loadRandom = useCallback(() => {
    const entry = randomOpening();
    if (!entry) {
      flash("error", "The opening library could not be loaded.");
      return;
    }
    loadSequence(entry.moves);
    setTab("opening");
    flash("ok", `Loaded ${entry.family} (${entry.eco}).`);
  }, [flash, loadSequence]);

  const importFen = useCallback(() => {
    const value = fenInput.trim();
    if (!value) {
      flash("error", "Paste a FEN string first.");
      return;
    }
    try {
      const probe = new Chess();
      probe.load(value);
      const fen = probe.fen();
      setNodes({ root: createRoot(fen) });
      setCurrentId("root");
      setRootFen(fen);
      setSelected(null);
      setPromotion(null);
      setTab("opening");
      flash("ok", fen === START_FEN ? "Standard starting position loaded." : "FEN loaded. Opening recognition starts from the standard position only.");
    } catch {
      flash("error", "That FEN is not valid. Check the piece placement, side to move and counters.");
    }
  }, [fenInput, flash]);

  const importPgn = useCallback(() => {
    const text = pgnInput.trim();
    if (!text) {
      flash("error", "Paste a PGN game or line first.");
      return;
    }
    const fenMatch = /\[FEN\s+"([^"]+)"\]/i.exec(text);
    const startFen = fenMatch?.[1] ?? START_FEN;
    let parsed: Chess;
    try {
      parsed = new Chess();
      parsed.loadPgn(text);
    } catch {
      flash("error", "That PGN could not be read. Check the move text and headers.");
      return;
    }
    const history = parsed.history({ verbose: true });
    if (history.length === 0) {
      flash("error", "No moves were found in that PGN.");
      return;
    }
    const startValid = (() => {
      try {
        const probe = new Chess();
        probe.load(startFen);
        return true;
      } catch {
        return false;
      }
    })();
    if (!startValid) {
      flash("error", "The PGN has an invalid FEN header.");
      return;
    }
    const applied = loadSequence(history.map((move) => move.san), startFen);
    setTab("opening");
    flash(
      "ok",
      applied === history.length
        ? `Imported ${applied} move${applied === 1 ? "" : "s"}. Nested variations are replayed as the main line only.`
        : `Imported ${applied} of ${history.length} moves; the rest were not legal in this position.`
    );
  }, [flash, loadSequence, pgnInput]);

  const undo = useCallback(() => {
    if (current.parentId) goTo(current.parentId);
  }, [current.parentId, goTo]);

  const redo = useCallback(() => {
    if (current.lastChild) goTo(current.lastChild);
  }, [current.lastChild, goTo]);

  const mainEnd = useMemo(() => mainLineEnd(nodes), [nodes]);
  const atMainEnd = currentId === mainEnd;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowLeft" && !event.metaKey && !event.ctrlKey) {
        if (current.parentId) {
          event.preventDefault();
          undo();
        }
      } else if (event.key === "ArrowRight" && !event.metaKey && !event.ctrlKey) {
        if (current.lastChild) {
          event.preventDefault();
          redo();
        }
      } else if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey) {
        setOrientation((value) => (value === "w" ? "b" : "w"));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current.lastChild, current.parentId, redo, undo]);

  const info = recognition?.line ?? null;
  const variation = info ? openingVariation(info.name) : null;
  const notes = recognition?.notes ?? null;
  const origin = rootFen !== START_FEN;

  const library = useMemo(() => openingLibrary(), []);
  const openingOfTheDay = useMemo(() => {
    const pool = curatedStarters(40);
    if (pool.length === 0) return null;
    const now = new Date();
    const dayKey = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
    return pool[dayKey % pool.length];
  }, []);
  const libraryEntries = useMemo(
    () =>
      library.filter((entry) => {
        if (libCategory === "all") return true;
        if (libCategory === "gambit") return entry.gambit;
        return entry.category === libCategory;
      }),
    [libCategory, library]
  );
  const searchResults = useMemo(() => (libQuery.trim() ? searchOpenings(libQuery, 80) : null), [libQuery]);
  const siblingIds = useMemo(() => {
    if (!current.parentId) return [];
    return (nodes[current.parentId]?.children ?? []).filter((id) => id !== current.id);
  }, [current.id, current.parentId, nodes]);
  const continuations = recognition?.continuations ?? [];
  const visibleContinuations = showAllContinuations ? continuations : continuations.slice(0, 8);
  const movePairs = useMemo(() => {
    const rows: { number: number; white?: GameNode; black?: GameNode }[] = [];
    path.forEach((node, index) => {
      const number = Math.floor(index / 2) + 1;
      const side = index % 2 === 0 ? "white" : "black";
      const existing = rows.find((row) => row.number === number);
      if (existing) existing[side] = node;
      else rows.push(side === "white" ? { number, white: node } : { number, black: node });
    });
    return rows;
  }, [path]);

  return (
    <Workspace slug="chess-playground">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">Opening explorer</Badge>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
            no engine · no clocks · local browser
          </span>
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:ml-auto sm:w-auto">
            <Button variant="secondary" size="sm" onClick={loadRandom} className="min-h-10 flex-1 sm:flex-none">
              <Icon name="shuffle" size={13} /> Random opening
            </Button>
            <Button variant="ghost" size="sm" onClick={resetBoard} className="min-h-10 flex-1 sm:flex-none">
              <Icon name="refresh" size={13} /> Start position
            </Button>
          </div>
        </div>

        {openingOfTheDay && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-400/20 bg-gradient-to-r from-brand-400/[0.07] to-transparent px-3 py-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand-400/25 bg-brand-400/[0.08] text-brand-300">
              <Icon name="sparkles" size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-brand-300/80">Opening of the day</p>
              <p className="truncate text-[12.5px] font-semibold text-mist-100">{openingOfTheDay.family}</p>
              <p className="truncate font-mono text-[9.5px] text-mist-500">{openingOfTheDay.eco} · {formatMoveList(openingOfTheDay.moves, 6)}</p>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => loadOpening(openingOfTheDay.line)}>
              Load <Icon name="arrowRight" size={12} />
            </Button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className={cn(
              "rounded-xl border px-3 py-2 text-[11.5px] leading-relaxed",
              notice.tone === "ok"
                ? "border-brand-400/25 bg-brand-400/[0.06] text-mist-200"
                : notice.tone === "error"
                  ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-100"
                  : "border-white/10 bg-white/[0.03] text-mist-300"
            )}
          >
            {notice.text}
          </div>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,330px)] xl:gap-5">
          <div className="min-w-0 space-y-3">
            <div className="relative mx-auto w-full max-w-[min(100%,560px)] sm:max-w-[520px] lg:max-w-[560px]">
              <ChessBoard
                board={board}
                orientation={orientation}
                turn={turn}
                selected={selected}
                legalTargets={legalTargets}
                lastMove={lastMove}
                checkSquare={checkSquare}
                coordinates={coordinates}
                onSquareClick={handleSquareClick}
                onMove={(from, to) => playMove(from, to)}
                disabled={Boolean(promotion)}
              />
              {promotion && (
                <div className="absolute inset-0 z-30 grid place-items-center rounded-xl bg-ink-950/80 p-4 backdrop-blur-sm">
                  <div className="rounded-xl border border-white/15 bg-ink-850 p-4 text-center shadow-2xl">
                    <p className="text-[12.5px] font-semibold text-mist-100">Promote pawn to</p>
                    <div className="mt-2 flex gap-2">
                      {PROMOTION_PIECES.map((option) => (
                        <button
                          key={option.piece}
                          type="button"
                          onClick={() => playMove(promotion.from, promotion.to, option.piece as PromotionPiece)}
                          aria-label={`Promote to ${option.label}`}
                          className="grid size-12 place-items-center rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-brand-400/40 hover:bg-brand-400/[0.08]"
                        >
                          <ChessPiece type={option.piece} color={turn} className="size-9" decorative />
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setPromotion(null); setSelected(null); }} className="mt-2 text-[10.5px] text-mist-500 underline underline-offset-2 hover:text-mist-200">
                      Cancel promotion
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center gap-1.5 px-0.5">
              <Button variant="secondary" size="sm" onClick={undo} disabled={!current.parentId} aria-label="Undo move" title="Undo (←)" className="min-h-10 flex-1 sm:flex-none">
                <Icon name="arrowLeft" size={13} /> Undo
              </Button>
              <Button variant="secondary" size="sm" onClick={redo} disabled={!current.lastChild} aria-label="Redo move" title="Redo (→)" className="min-h-10 flex-1 sm:flex-none">
                <Icon name="arrowRight" size={13} /> Redo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOrientation((value) => (value === "w" ? "b" : "w"))} title="Flip board (F)" className="min-h-10 shrink-0">
                <Icon name="arrowUpDown" size={13} /> Flip
              </Button>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 px-1 text-[11px] text-mist-400">
                <input type="checkbox" checked={coordinates} onChange={(event) => setCoordinates(event.target.checked)} className="size-4 accent-[#C7F05F]" />
                <span className="hidden sm:inline">Coordinates</span><span className="sm:hidden">Coords</span>
              </label>
              {!atMainEnd && (
                <Button variant="ghost" size="sm" onClick={() => goTo(mainEnd)} className="ml-auto min-h-10 text-brand-300">
                  Main line <Icon name="arrowRight" size={12} />
                </Button>
              )}
            </div>

            <div className="mx-auto flex w-full max-w-[560px] items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] text-mist-300">
                <span className={cn("size-2 shrink-0 rounded-full", turn === "w" ? "bg-mist-100" : "border border-mist-500 bg-ink-900")} />
                <span className="truncate">{status}</span>
              </span>
              <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">move {fullmove}</span>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-mist-200">Moves</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">{path.length} ply</span>
              </div>
              {path.length === 0 ? (
                <p className="mt-1.5 text-[11.5px] text-mist-500">
                  {origin ? "Imported position — play or navigate to add moves." : "Starting position. Play a move to begin; the opening is recognised automatically."}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-[24px_1fr_1fr] gap-x-1.5 text-[12px]">
                  <span />
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-600">White</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-600">Black</span>
                  {movePairs.map((row) => (
                    <div key={row.number} className="col-span-3 grid grid-cols-[24px_1fr_1fr] items-center gap-1.5 border-b border-white/[0.04] py-0.5 last:border-b-0">
                      <span className="font-mono text-[10px] text-mist-600">{row.number}.</span>
                      {(["white", "black"] as const).map((side) => {
                        const node = row[side];
                        if (!node) return <span key={side} />;
                        const active = node.id === currentId;
                        return (
                          <button
                            key={side}
                            type="button"
                            onClick={() => goTo(node.id)}
                            className={cn(
                              "min-h-8 truncate rounded px-1.5 py-1 text-left font-mono transition",
                              active ? "bg-brand-400 font-bold text-ink-950" : "text-mist-300 hover:bg-white/[0.06] hover:text-mist-50"
                            )}
                            aria-current={active ? "true" : undefined}
                          >
                            {node.san}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <CopyButton value={game.fen()} label="Copy FEN" copiedLabel="Copied" variant="ghost" size="sm" />
                <CopyButton value={pgn} label="Copy PGN" copiedLabel="Copied" variant="ghost" size="sm" />
                <Button variant="ghost" size="sm" onClick={() => downloadFile(pgn, "toolsy-chess.pgn", "application/x-chess-pgn")}>
                  <Icon name="download" size={12} /> PGN
                </Button>
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015]">
            <div role="tablist" aria-label="Chess panels" className="grid grid-cols-4 gap-1 border-b border-white/[0.07] p-1.5">
              {([
                ["opening", "Opening"],
                ["explorer", "Explorer"],
                ["library", "Library"],
                ["data", "FEN / PGN"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "min-h-10 rounded-lg px-1.5 py-1.5 text-[11px] leading-tight transition sm:px-2.5 sm:text-[11.5px]",
                    tab === id ? "bg-brand-400 font-bold text-ink-950" : "font-medium text-mist-400 hover:bg-white/[0.05] hover:text-mist-100"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-3">
              {tab === "opening" && (
                <div className="space-y-3">
                  {origin ? (
                    <Note tone="info" title="Imported position">
                      Opening recognition runs from the standard starting position. Load a FEN equal to the initial
                      position, or press “Start position”, to identify openings again.
                    </Note>
                  ) : path.length === 0 ? (
                    <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.04] p-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-300">Starting position</p>
                      <p className="mt-1 text-[15px] font-semibold text-mist-50">No opening yet</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">
                        Play a move on the board. The name, ECO code and variation update automatically from a real
                        opening database.
                      </p>
                    </div>
                  ) : info && recognition && inTrie ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.045] p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-brand-400/30 bg-brand-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brand-200">{info.eco}</span>
                          <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-mist-400">{classifyOpeningType(info.name)}</span>
                          <span className="font-mono text-[8.5px] uppercase tracking-wider text-mist-600">{notes?.difficulty ?? "difficulty not rated"}</span>
                        </div>
                        <h3 className="mt-2 text-[16px] font-semibold leading-snug text-mist-50">{info.family}</h3>
                        {variation && <p className="mt-0.5 text-[11.5px] text-mist-400">{variation}</p>}
                        <p className="mt-1.5 font-mono text-[9px] text-mist-600">
                          {info.moves.length} plies in this database line · move {fullmove}
                        </p>
                      </div>

                      {!isNamedPosition && (
                        <Note tone="info" title="Nearest named line">
                          This exact position does not have its own name in the dataset. The opening shown is the
                          nearest named line ({recognition.knownDepth} ply in the book).
                        </Note>
                      )}

                      {notes ? (
                        <div className="space-y-2.5">
                          <section>
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-300/80">Main idea</p>
                            <p className="mt-1 text-[11.5px] leading-relaxed text-mist-300">{notes.idea}</p>
                          </section>
                          <section>
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-300/80">Plans for White</p>
                            <ul className="mt-1 space-y-1">
                              {notes.whitePlans.map((plan) => (
                                <li key={plan} className="flex gap-1.5 text-[11px] leading-relaxed text-mist-400">
                                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-mist-100" />{plan}
                                </li>
                              ))}
                            </ul>
                          </section>
                          <section>
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-300/80">Plans for Black</p>
                            <ul className="mt-1 space-y-1">
                              {notes.blackPlans.map((plan) => (
                                <li key={plan} className="flex gap-1.5 text-[11px] leading-relaxed text-mist-400">
                                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-mist-500" />{plan}
                                </li>
                              ))}
                            </ul>
                          </section>
                          <section>
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300/80">Common mistakes</p>
                            <ul className="mt-1 space-y-1">
                              {notes.mistakes.map((mistake) => (
                                <li key={mistake} className="flex gap-1.5 text-[11px] leading-relaxed text-mist-400">
                                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-300/70" />{mistake}
                                </li>
                              ))}
                            </ul>
                          </section>
                          <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">Good to know</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-mist-400">{notes.fact}</p>
                          </section>
                        </div>
                      ) : (
                        <Note tone="info" title="Curated notes not available">
                          This line is identified by the Lichess dataset, but Toolsy has no hand-written notes for it.
                          Rather than invent a plan, the name and ECO code are shown as stored in the dataset.
                        </Note>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <EmptyState
                        icon="search"
                        title="Unknown opening"
                        description="This position is outside the opening database. Toolsy does not guess a name — play back into a stored line, or press Start position."
                      />
                      {info && recognition && (
                        <Note tone="warn" title="Last matching line">
                          {info.family}
                          {variation ? `: ${variation}` : ""} ({info.eco}) was recognised after move
                          {" "}{recognition.knownDepth}. The move{path.length - recognition.knownDepth === 1 ? "" : "s"} after
                          that leave the stored lines.
                        </Note>
                      )}
                    </div>
                  )}
                  <p className="text-[9.5px] leading-relaxed text-mist-600">
                    Names and ECO codes: {CHESS_SOURCE.name} ({CHESS_SOURCE.license}), {CHESS_SOURCE.lines.toLocaleString("en-US")} lines.
                  </p>
                </div>
              )}

              {tab === "explorer" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[12px] font-semibold text-mist-200">Opening book moves</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-mist-500">
                      Continuations stored in the database, most common lines first. Click one to play it.
                    </p>
                    {!recognition ? (
                      <Note tone="info" className="mt-2">Opening moves are available from the standard starting position.</Note>
                    ) : continuations.length === 0 ? (
                      <p className="mt-2 text-[11px] text-mist-500">No further database moves from this position.</p>
                    ) : (
                      <>
                        <div className="mt-2 space-y-1">
                          {visibleContinuations.map((move) => (
                            <button
                              key={move.san}
                              type="button"
                              onClick={() => playSan(move.san)}
                              className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-left transition hover:border-brand-400/30 hover:bg-brand-400/[0.04]"
                            >
                              <span className="w-10 shrink-0 font-mono text-[11.5px] font-semibold text-brand-200">{move.san}</span>
                              <span className="min-w-0 flex-1 truncate text-[10.5px] text-mist-400">{move.name}</span>
                              <span className="shrink-0 font-mono text-[8.5px] text-mist-600">{move.eco}</span>
                            </button>
                          ))}
                        </div>
                        {continuations.length > 8 && (
                          <button type="button" onClick={() => setShowAllContinuations((value) => !value)} className="mt-1.5 text-[10.5px] font-medium text-brand-300 hover:text-brand-200">
                            {showAllContinuations ? "Show fewer" : `Show all ${continuations.length}`}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-2.5">
                    <p className="text-[12px] font-semibold text-mist-200">Your variations</p>
                    {siblingIds.length === 0 ? (
                      <p className="mt-0.5 text-[10.5px] text-mist-500">No alternative branch at this point. Go back and play a different move to create one.</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {siblingIds.map((id) => (
                          <button key={id} type="button" onClick={() => goTo(id)} className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 font-mono text-[10.5px] text-mist-300 hover:border-brand-400/30 hover:text-brand-200">
                            {nodes[id]?.san}
                          </button>
                        ))}
                      </div>
                    )}
                    {current.children.length > 0 && (
                      <div className="mt-2">
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist-600">Continue your line</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {current.children.map((id) => (
                            <button key={id} type="button" onClick={() => goTo(id)} className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10.5px] text-mist-300 hover:border-brand-400/30 hover:text-brand-200">
                              {nodes[id]?.san}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-2.5 text-[10px] leading-relaxed text-mist-600">
                    Your explored branches stay in this session. “Main line” returns to the first variation you
                    followed; undo/redo use ← and →.
                  </div>
                </div>
              )}

              {tab === "library" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Icon name="search" size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
                    <Input
                      value={libQuery}
                      onChange={(event) => setLibQuery(event.target.value)}
                      placeholder="Search by name, ECO or moves…"
                      aria-label="Search the opening library"
                      className="h-9 pl-8 text-[11.5px]"
                    />
                    {libQuery && (
                      <button type="button" onClick={() => setLibQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-mist-500 hover:text-mist-200">
                        <Icon name="close" size={12} />
                      </button>
                    )}
                  </div>

                  {!searchResults && (
                    <div className="flex flex-wrap gap-1">
                      {[{ id: "all" as const, label: "All" }, ...OPENING_CATEGORIES, { id: "gambit" as const, label: "Gambits" }].map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => { setLibCategory(category.id); setLibLimit(36); }}
                          aria-pressed={libCategory === category.id}
                          className={cn(
                            "rounded-md border px-1.5 py-1 text-[9.5px] transition",
                            libCategory === category.id
                              ? "border-brand-400/40 bg-brand-400/10 font-semibold text-brand-200"
                              : "border-white/[0.07] text-mist-500 hover:border-white/15 hover:text-mist-200"
                          )}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="max-h-[420px] space-y-1 overflow-y-auto pr-0.5">
                    {searchResults ? (
                      searchResults.length === 0 ? (
                        <p className="px-1 py-4 text-center text-[11px] text-mist-500">No opening matches “{libQuery}”.</p>
                      ) : (
                        searchResults.map((line) => (
                          <button
                            key={`${line.slug}-${line.moves.join("-")}`}
                            type="button"
                            onClick={() => loadOpening(line)}
                            className="min-h-11 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left transition hover:border-brand-400/30 hover:bg-brand-400/[0.04]"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="rounded border border-brand-400/25 bg-brand-400/[0.07] px-1 font-mono text-[8px] text-brand-200">{line.eco}</span>
                              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-mist-200">{line.name}</span>
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[9px] text-mist-600">{formatMoveList(line.moves, 6)}</span>
                          </button>
                        ))
                      )
                    ) : libraryEntries.length === 0 ? (
                      <p className="px-1 py-4 text-center text-[11px] text-mist-500">No openings in this category.</p>
                    ) : (
                      libraryEntries.slice(0, libLimit).map((entry: LibraryEntry) => (
                        <button
                          key={entry.slug}
                          type="button"
                          onClick={() => loadOpening(entry.line)}
                          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left transition hover:border-brand-400/30 hover:bg-brand-400/[0.04]"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="shrink-0 rounded border border-brand-400/25 bg-brand-400/[0.07] px-1 font-mono text-[8px] text-brand-200">{entry.eco}</span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-mist-200">{entry.family}</span>
                            {entry.gambit && <span className="shrink-0 font-mono text-[8px] uppercase tracking-wider text-amber-300/80">gambit</span>}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate font-mono text-[9px] text-mist-600">{formatMoveList(entry.moves, 6)}</span>
                            {entry.variations > 1 && <span className="shrink-0 font-mono text-[8px] text-mist-600">{entry.variations} lines</span>}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {!searchResults && libraryEntries.length > libLimit && (
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setLibLimit((value) => value + 48)}>
                      Show more ({libraryEntries.length - libLimit} remaining)
                    </Button>
                  )}
                  <p className="text-[9px] leading-relaxed text-mist-600">
                    {library.length} opening families · names, ECO codes and move orders from the Lichess dataset. Click an entry to load it on the board.
                  </p>
                </div>
              )}

              {tab === "data" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-mist-200">Current FEN</p>
                      <CopyButton value={game.fen()} label="Copy" copiedLabel="Copied" variant="ghost" size="sm" />
                    </div>
                    <textarea readOnly value={game.fen()} rows={3} aria-label="Current FEN" className="mt-1.5 field-input resize-y bg-ink-950/50 font-mono text-[10px] leading-relaxed" />
                    <div className="mt-1.5 flex gap-1.5">
                      <Input value={fenInput} onChange={(event) => setFenInput(event.target.value)} placeholder="Paste a FEN to load…" aria-label="FEN to import" className="h-9 font-mono text-[10.5px]" />
                      <Button size="sm" onClick={importFen} className="shrink-0">Load</Button>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-mist-200">PGN</p>
                      <CopyButton value={pgn} label="Copy" copiedLabel="Copied" variant="ghost" size="sm" />
                    </div>
                    <textarea readOnly value={pgn} rows={5} aria-label="PGN export" className="mt-1.5 field-input resize-y bg-ink-950/50 font-mono text-[10px] leading-relaxed" />
                    <div className="mt-1.5 flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => downloadFile(pgn, "toolsy-chess.pgn", "application/x-chess-pgn")}>
                        <Icon name="download" size={12} /> Download .pgn
                      </Button>
                    </div>
                    <textarea
                      value={pgnInput}
                      onChange={(event) => setPgnInput(event.target.value)}
                      rows={4}
                      placeholder="Paste PGN here to import a game or opening line…"
                      aria-label="PGN to import"
                      className="mt-2 field-input resize-y font-mono text-[10px] leading-relaxed"
                    />
                    <Button size="sm" className="mt-1.5" onClick={importPgn}>Import PGN</Button>
                  </div>

                  <Note tone="info">
                    Everything runs in your browser. PGN import replays the main line; nested variations are not
                    reconstructed. Opening recognition needs the standard starting position.
                  </Note>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Database lines" value={CHESS_SOURCE.lines.toLocaleString("en-US")} />
          <StatTile label="Opening families" value={String(library.length)} />
          <StatTile label="Current ply" value={String(path.length)} />
          <StatTile label="Recognition" value={origin ? "FEN start" : path.length === 0 ? "Waiting" : info ? "Matched" : "Unknown"} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] leading-relaxed text-mist-600">
          <Icon name="shield" size={11} className="text-brand-300/70" />
          A study board, not a game: no engine, opponent, clocks, ratings or accounts. Positions and PGN stay in this
          tab. Built on chess.js for legal moves and the CC0 {CHESS_SOURCE.name} for opening names.
        </div>
      </div>
    </Workspace>
  );
}

export default ChessPlayground;
