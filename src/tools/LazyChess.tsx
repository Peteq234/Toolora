import { lazy, Suspense } from "react";
import { Workspace } from "@/components/ui";

const ChessPlayground = lazy(() => import("@/tools/ChessPlayground"));

export function ChessPlaygroundTool() {
  return (
    <Suspense
      fallback={
        <Workspace slug="chess-playground">
          <div className="grid min-h-[220px] place-items-center rounded-xl border border-white/[0.07] bg-white/[0.015]" role="status" aria-live="polite">
            <div className="text-center">
              <span className="mx-auto block size-7 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mist-500">Loading the opening database…</p>
              <p className="mt-1 text-[11px] text-mist-600">chess.js and 3,236 opening lines load only on this page.</p>
            </div>
          </div>
        </Workspace>
      }
    >
      <ChessPlayground />
    </Suspense>
  );
}
