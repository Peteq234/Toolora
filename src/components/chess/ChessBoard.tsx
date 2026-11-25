import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ChessPiece, PIECE_NAMES, type PieceColor, type PieceType } from "@/components/chess/pieces";

export type BoardPiece = { type: PieceType; color: PieceColor } | null;
export type BoardMatrix = BoardPiece[][];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function squareName(fileIndex: number, rankIndex: number): string {
  return `${FILES[fileIndex]}${rankIndex + 1}`;
}

export function squarePosition(square: string): { file: number; rank: number } {
  return { file: FILES.indexOf(square[0] as (typeof FILES)[number]), rank: Number(square[1]) - 1 };
}

type DragState = {
  from: string;
  piece: BoardPiece;
  x: number;
  y: number;
  moved: boolean;
};

export function ChessBoard({
  board,
  orientation,
  selected,
  legalTargets,
  lastMove,
  checkSquare,
  coordinates = true,
  onSquareClick,
  onMove,
  disabled = false,
  turn,
}: {
  board: BoardMatrix;
  orientation: PieceColor;
  turn: PieceColor;
  selected: string | null;
  legalTargets: Map<string, boolean>;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  coordinates?: boolean;
  onSquareClick: (square: string) => void;
  onMove: (from: string, to: string) => void;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  dragRef.current = drag;

  useEffect(() => {
    if (!drag) return;

    function onPointerMove(event: PointerEvent) {
      setDrag((current) => {
        if (!current) return current;
        const moved =
          current.moved ||
          Math.abs(event.clientX - current.x) > 4 ||
          Math.abs(event.clientY - current.y) > 4;
        return { ...current, x: event.clientX, y: event.clientY, moved };
      });
    }

    function finish(event: PointerEvent) {
      const current = dragRef.current;
      setDrag(null);
      if (!current) return;
      if (current.moved) {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const target = element?.closest<HTMLElement>("[data-square]")?.dataset.square;
        suppressClick.current = true;
        window.setTimeout(() => { suppressClick.current = false; }, 0);
        if (target && target !== current.from) onMove(current.from, target);
        return;
      }
      onSquareClick(current.from);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [drag, onMove, onSquareClick]);

  function startPointer(event: React.PointerEvent<HTMLDivElement>, square: string, piece: BoardPiece) {
    if (disabled || !piece || piece.color !== turn || event.button !== 0) return;
    const dragState: DragState = { from: square, piece, x: event.clientX, y: event.clientY, moved: false };
    // Defer so a plain click remains a click, but a movement starts a drag.
    const startX = event.clientX;
    const startY = event.clientY;
    const onFirstMove = (moveEvent: PointerEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 4 || Math.abs(moveEvent.clientY - startY) > 4) {
        setDrag({ ...dragState, x: moveEvent.clientX, y: moveEvent.clientY, moved: true });
        window.removeEventListener("pointermove", onFirstMove);
      }
    };
    window.addEventListener("pointermove", onFirstMove, { passive: true });
    window.addEventListener(
      "pointerup",
      () => window.removeEventListener("pointermove", onFirstMove),
      { once: true },
    );
  }

  const rows = orientation === "w" ? board : [...board].reverse();
  const orderedRows = rows.map((row) => (orientation === "w" ? row : [...row].reverse()));
  const rankLabels = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const fileLabels = orientation === "w" ? FILES : [...FILES].reverse();

  return (
    <div className="relative select-none">
      <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-[#11150e] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
        <div className="grid grid-cols-8 touch-none" role="grid" aria-label="Chess board">
          {orderedRows.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const rankIndex = orientation === "w" ? 7 - rowIndex : rowIndex;
              const fileIndex = orientation === "w" ? colIndex : 7 - colIndex;
              const square = squareName(fileIndex, rankIndex);
              const light = (fileIndex + rankIndex) % 2 === 1;
              const isSelected = selected === square;
              const isLast = lastMove?.from === square || lastMove?.to === square;
              const isTarget = legalTargets.has(square);
              const isCapture = legalTargets.get(square) === true;
              const isCheck = checkSquare === square;
              const isDragging = drag?.moved && drag.from === square;
              const showRank = colIndex === 0;
              const showFile = rowIndex === 7;
              return (
                <div
                  key={square}
                  data-square={square}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={
                    piece
                      ? `${square}, ${piece.color === "w" ? "white" : "black"} ${PIECE_NAMES[piece.type]}${isTarget ? ", legal destination" : ""}`
                      : `${square}, empty${isTarget ? ", legal destination" : ""}`
                  }
                  aria-selected={isSelected}
                  onPointerDown={(event) => startPointer(event, square, piece)}
                  onClick={() => {
                    if (suppressClick.current || drag?.moved) return;
                    onSquareClick(square);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSquareClick(square);
                    }
                  }}
                  className={cn(
                    "relative aspect-square outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400",
                    light ? "bg-[#e9e3d0]" : "bg-[#69795a]",
                    disabled ? "cursor-default" : "cursor-pointer"
                  )}
                >
                  {isLast && <span aria-hidden="true" className="absolute inset-0 bg-brand-400/[0.42]" />}
                  {isSelected && <span aria-hidden="true" className="absolute inset-0 bg-brand-400/[0.55] shadow-[inset_0_0_0_3px_#a9d93b]" />}
                  {isCheck && <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle,rgba(244,63,94,0.65),transparent_72%)]" />}
                  {coordinates && showRank && (
                    <span className={cn("pointer-events-none absolute left-[3px] top-[1px] font-mono text-[min(1.9vw,10px)] leading-none", light ? "text-[#5b6b4a]/80" : "text-[#e9e3d0]/70")}>
                      {rankLabels[rowIndex]}
                    </span>
                  )}
                  {coordinates && showFile && (
                    <span className={cn("pointer-events-none absolute bottom-[2px] right-[4px] font-mono text-[min(1.9vw,10px)] leading-none", light ? "text-[#5b6b4a]/80" : "text-[#e9e3d0]/70")}>
                      {fileLabels[colIndex]}
                    </span>
                  )}
                  {piece && !isDragging && (
                    <ChessPiece
                      type={piece.type}
                      color={piece.color}
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2"
                      decorative
                    />
                  )}
                  {isTarget && !isCapture && (
                    <span aria-hidden="true" className={cn("pointer-events-none absolute left-1/2 top-1/2 size-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full", light ? "bg-[#2b3a22]/35" : "bg-[#0b0d11]/35")} />
                  )}
                  {isTarget && isCapture && (
                    <span aria-hidden="true" className="pointer-events-none absolute inset-[6%] rounded-full border-[4px] border-[#2b3a22]/40" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {drag?.moved && drag.piece && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-[200] h-[clamp(38px,9vw,58px)] w-[clamp(38px,9vw,58px)] -translate-x-1/2 -translate-y-1/2 scale-110"
          style={{ left: drag.x, top: drag.y }}
        >
          <ChessPiece type={drag.piece.type} color={drag.piece.color} className="h-full w-full" decorative />
        </span>
      )}
    </div>
  );
}
