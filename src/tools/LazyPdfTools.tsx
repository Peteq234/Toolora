import { lazy, Suspense } from "react";
import { Workspace } from "@/components/ui";

const loadMerge = () => import("@/tools/PdfTools").then((module) => ({ default: module.PdfMerge }));
const loadSplit = () => import("@/tools/PdfTools").then((module) => ({ default: module.PdfSplit }));
const loadExtract = () => import("@/tools/PdfTools").then((module) => ({ default: module.PdfPageExtractor }));

const PdfMerge = lazy(loadMerge);
const PdfSplit = lazy(loadSplit);
const PdfPageExtractor = lazy(loadExtract);

const loadWorkspace = () => import("@/tools/PdfWorkspace");
const PdfCompressor = lazy(() => loadWorkspace().then((module) => ({ default: module.PdfCompressor })));
const PdfToImages = lazy(() => loadWorkspace().then((module) => ({ default: module.PdfToImages })));
const ImagesToPdf = lazy(() => loadWorkspace().then((module) => ({ default: module.ImagesToPdf })));
const PdfOrganizer = lazy(() => loadWorkspace().then((module) => ({ default: module.PdfOrganizer })));
const PdfMetadataViewer = lazy(() => loadWorkspace().then((module) => ({ default: module.PdfMetadataViewer })));
const PdfToText = lazy(() => loadWorkspace().then((module) => ({ default: module.PdfToText })));

function PdfFallback() {
  return (
    <Workspace slug="pdf-tools">
      <div className="grid min-h-[180px] place-items-center rounded-xl border border-white/[0.07] bg-white/[0.015] text-center" role="status" aria-live="polite">
        <div>
          <span className="mx-auto block size-7 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mist-500">Loading the local PDF engine…</p>
          <p className="mt-1 text-[11px] text-mist-600">The heavy library is only downloaded when you open this tool.</p>
        </div>
      </div>
    </Workspace>
  );
}

export function PdfMergeTool() {
  return <Suspense fallback={<PdfFallback />}><PdfMerge /></Suspense>;
}
export function PdfSplitTool() {
  return <Suspense fallback={<PdfFallback />}><PdfSplit /></Suspense>;
}
export function PdfPageExtractorTool() {
  return <Suspense fallback={<PdfFallback />}><PdfPageExtractor /></Suspense>;
}

export function PdfCompressorTool() { return <Suspense fallback={<PdfFallback />}><PdfCompressor /></Suspense>; }
export function PdfToImagesTool() { return <Suspense fallback={<PdfFallback />}><PdfToImages /></Suspense>; }
export function ImagesToPdfTool() { return <Suspense fallback={<PdfFallback />}><ImagesToPdf /></Suspense>; }
export function PdfOrganizerTool() { return <Suspense fallback={<PdfFallback />}><PdfOrganizer /></Suspense>; }
export function PdfMetadataTool() { return <Suspense fallback={<PdfFallback />}><PdfMetadataViewer /></Suspense>; }
export function PdfToTextTool() { return <Suspense fallback={<PdfFallback />}><PdfToText /></Suspense>; }
