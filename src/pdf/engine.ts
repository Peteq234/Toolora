import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

let configured = false;

/** PDF.js needs its worker served from the public folder. Load it lazily. */
export function pdfjsLib() {
  if (!configured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    configured = true;
  }
  return pdfjs;
}

export async function openPdf(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  const lib = pdfjsLib();
  return lib.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
}

export async function withPdf<T>(file: File, action: (pdf: PDFDocumentProxy) => Promise<T>): Promise<T> {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error(`${file.name} is not a PDF file.`);
  }
  if (file.size > 80 * 1024 * 1024) throw new Error("PDFs up to 80 MB are supported. Split larger files first.");
  const bytes = await file.arrayBuffer();
  let pdf: PDFDocumentProxy;
  try {
    pdf = await openPdf(bytes);
  } catch {
    throw new Error("This PDF could not be opened. Password-protected or damaged files are not supported.");
  }
  return action(pdf);
}

export type PagePreview = { page: number; url: string; width: number; height: number };

export async function renderPage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.2
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  await page.render({ canvasContext: context, viewport }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode this page."))), type, quality);
  });
}

export function parsePageSelection(input: string, pageCount: number): number[] | { error: string } {
  const raw = input.trim();
  if (!raw) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set<number>();
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < start) return { error: `“${token}” is not a valid range.` };
      if (end > pageCount) return { error: `Page ${end} is outside this PDF (${pageCount} pages).` };
      for (let page = start; page <= end; page += 1) pages.add(page);
    } else if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > pageCount) return { error: `Page ${page} is outside this PDF (${pageCount} pages).` };
      pages.add(page);
    } else {
      return { error: `“${token}” is not a page number or range.` };
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** A size- and page-bounded file input guard shared by the PDF tools. */
export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
