import type { ReactNode } from "react";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";

export const PIECE_NAMES: Record<PieceType, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/**
 * Toolsy chess set — an original flat-vector set on a 45×45 grid.
 *
 * Each piece is a single filled silhouette. Interior detail is drawn as a
 * separate stroke-only overlay, so black pieces never inherit a dark fill that
 * hides their own shapes. All pieces share the same plinth and collar, giving
 * one consistent family across the board at any size.
 */
const PLINTH =
  "M11.7 35.2h21.6a1.5 1.5 0 0 1 1.5 1.5v1.7a1.5 1.5 0 0 1-1.5 1.5H11.7a1.5 1.5 0 0 1-1.5-1.5v-1.7a1.5 1.5 0 0 1 1.5-1.5Z";
const COLLAR = "M14.1 31.3h16.8l1.3 3.7H12.8l1.3-3.7Z";
const LINE = { fill: "none", strokeWidth: 1.15, opacity: 0.42, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const BODIES: Record<PieceType, ReactNode> = {
  p: (
    <>
      <circle cx="22.5" cy="12.3" r="4.8" />
      <path d="M18.2 17.3h8.6l.8 2.4h-10.2l.8-2.4Z" />
      <path d="M18.8 19.7h7.4c.4 3.9 1.8 7.1 4.1 9.3l.9.9H13.8l.9-.9c2.3-2.2 3.7-5.4 4.1-9.3Z" />
      <path d={COLLAR} />
      <path d={PLINTH} />
    </>
  ),
  r: (
    <>
      <path d="M12.2 7.5h4v3h3.3v-3h4v3h3.3v-3h4v7.4l-2.2 2v14.1H14.4V17l-2.2-2V7.5Z" />
      <path d={COLLAR} />
      <path d={PLINTH} />
    </>
  ),
  n: (
    <>
      <path d="M15.3 34.2c-.3-4.6 1.1-8.3 4.2-11.1l2.5-2.3-1.2-2.9 2.4-4.9 1.2 3.4 2.2-1.7 3.3 2.2c2.9 1.9 4.4 4.8 4.4 8.6v8.7H15.3Z" />
      <path d={COLLAR} />
      <path d={PLINTH} />
    </>
  ),
  b: (
    <>
      <circle cx="22.5" cy="7.7" r="1.9" />
      <path d="M22.5 9.9c5.7 4.7 9 8.6 9 12 0 3.5-3.5 6.1-9 7.1-5.5-1-9-3.6-9-7.1 0-3.4 3.3-7.3 9-12Z" />
      <path d="M15.9 27h13.2c.9 0 1.5.6 1.5 1.4v.7c0 .8-.6 1.4-1.5 1.4H15.9c-.9 0-1.5-.6-1.5-1.4v-.7c0-.8.6-1.4 1.5-1.4Z" />
      <path d="M17.6 30.5h9.8l2 3.8H15.6l2-3.8Z" />
      <path d={PLINTH} />
    </>
  ),
  q: (
    <>
      <circle cx="12" cy="10.5" r="1.9" />
      <circle cx="17.3" cy="7.8" r="1.9" />
      <circle cx="22.5" cy="6.8" r="2.1" />
      <circle cx="27.7" cy="7.8" r="1.9" />
      <circle cx="33" cy="10.5" r="1.9" />
      <path d="M12.4 12.4 14.6 24.8h15.8l2.2-12.4-5.1 3.6-2.5-6.6-2.5 6.6-2.5-6.6-2.5 6.6-5.1-3.6Z" />
      <path d="M16.7 24.8h11.6l1.5 4.6H15.2l1.5-4.6Z" />
      <path d={PLINTH} />
    </>
  ),
  k: (
    <>
      <path d="M20.7 3.6h3.6v3.4h3.4v3.6h-3.4v3.2h-3.6V10.6h-3.4V7h3.4V3.6Z" />
      <path d="M22.5 13.8c2.4 1.9 5.2 2.9 8.4 2.9 1 0 2-.1 3-.4l-1.9 13.5H13l-1.9-13.5c1 .3 2 .4 3 .4 3.2 0 6-1 8.4-2.9Z" />
      <path d="M15.8 29.8h13.4l1.4 3.4H14.4l1.4-3.4Z" />
      <path d={PLINTH} />
    </>
  ),
};

const DETAIL: Record<PieceType, ReactNode> = {
  p: null,
  r: (
    <>
      <path d="M15.6 17.4h13.8" />
      <path d="M18.2 27.2h8.6" />
    </>
  ),
  n: (
    <>
      <path d="M19.4 22.6c2.7-1.3 5.3-1.2 7.8 0 2.1 1 4 1 5.5.2" />
      <path d="M21.9 16.2l2.3-3.2" />
      <circle cx="27.6" cy="20.4" r="1.05" fill="currentColor" stroke="none" opacity="0.9" />
    </>
  ),
  b: (
    <>
      <path d="M22.5 15.6v8.3M18.4 19.8h8.3" />
    </>
  ),
  q: (
    <>
      <path d="M17 24.8h11" />
      <path d="M18.3 28.9h8.4" />
    </>
  ),
  k: (
    <>
      <path d="M16.4 23.4c2.1.9 4.1.9 6.1.1M23.4 23.5c2.1.8 4.1.8 6-.1" />
      <path d="M18.4 29h10.2" />
    </>
  ),
};

export function ChessPiece({
  type,
  color,
  className,
  decorative = false,
}: {
  type: PieceType;
  color: PieceColor;
  className?: string;
  decorative?: boolean;
}) {
  const white = color === "w";
  const outline = white ? "#2b3226" : "#e8eedd";
  return (
    <svg
      viewBox="0 0 45 45"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${white ? "White" : "Black"} ${PIECE_NAMES[type]}`}
      style={{ filter: white ? "drop-shadow(0 1px 1px rgba(10,14,8,0.5))" : "drop-shadow(0 1px 1px rgba(0,0,0,0.45))" }}
    >
      <g
        fill={white ? "#f9f6ea" : "#20261c"}
        stroke={outline}
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
        color={outline}
      >
        {BODIES[type]}
      </g>
      <g fill="none" stroke={outline} strokeWidth={LINE.strokeWidth} opacity={LINE.opacity} strokeLinecap="round" strokeLinejoin="round">
        {DETAIL[type]}
      </g>
    </svg>
  );
}
