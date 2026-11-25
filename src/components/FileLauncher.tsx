import { useState } from "react";
import { Link } from "@/lib/router";
import { Icon } from "@/components/Icons";
import { getTool } from "@/lib/tools";

type Detection = { kind: string; label: string; extension: string; tools: string[]; note?: string };

const RULES: { kind: string; label: string; extensions: string[]; tools: string[]; note?: string }[] = [
  { kind: "pdf", label: "PDF document", extensions: ["pdf"], tools: ["pdf-compressor", "pdf-to-images", "pdf-organizer", "pdf-merge", "pdf-split", "pdf-page-extractor", "pdf-to-text", "pdf-metadata-viewer"], note: "Encrypted PDFs are rejected. Compression rasterises text; text extraction needs a text layer." },
  { kind: "image", label: "Image", extensions: ["jpg", "jpeg", "png", "webp", "gif", "avif"], tools: ["image-compressor", "bulk-image-processor", "image-resizer", "image-cropper", "image-format-converter", "social-media-image-resizer", "favicon-generator", "image-dimensions-checker", "image-metadata-viewer", "images-to-pdf", "image-to-base64"] },
  { kind: "spreadsheet", label: "Spreadsheet", extensions: ["xlsx", "xls"], tools: ["xlsx-preview"] },
  { kind: "csv", label: "CSV data", extensions: ["csv", "tsv"], tools: ["csv-viewer-editor", "csv-column-sorter", "csv-duplicate-remover", "csv-json-converter"] },
  { kind: "json", label: "JSON data", extensions: ["json"], tools: ["json-formatter-validator", "csv-json-converter", "json-xml-converter"] },
  { kind: "xml", label: "XML data", extensions: ["xml"], tools: ["xml-formatter", "json-xml-converter"] },
  { kind: "markdown", label: "Markdown document", extensions: ["md", "markdown"], tools: ["markdown-editor"] },
  { kind: "text", label: "Text document", extensions: ["txt", "log"], tools: ["word-counter", "text-cleaner", "text-diff-checker", "sort-text-lines", "remove-duplicate-lines"] },
];

export function FileLauncher() {
  const [detection, setDetection] = useState<Detection | null>(null);
  const [active, setActive] = useState(false);
  const [warning, setWarning] = useState("");

  function inspect(files: File[]) {
    const file = files[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const rule = RULES.find((entry) => entry.extensions.includes(extension));
    if (!rule) {
      setDetection(null);
      setWarning(`“${file.name}” is not a format these tools can open. Supported: PDF, images, XLSX, CSV, JSON, XML, Markdown and text.`);
      return;
    }
    setWarning("");
    setDetection({ kind: rule.kind, label: rule.label, extension, tools: rule.tools, note: rule.note });
  }

  return (
    <section aria-labelledby="launcher-heading" className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg border border-brand-400/20 bg-brand-400/[0.07] text-brand-300"><Icon name="layers" size={15} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="launcher-heading" className="text-[13.5px] font-semibold text-mist-100">Drop a file to find the right tool</h2>
          <p className="text-[11px] text-mist-500">We detect the format and suggest compatible operations. The file is not read, uploaded or processed until you open a tool and choose it there.</p>
        </div>
      </div>
      <div
        onDragOver={(event) => { event.preventDefault(); setActive(true); }}
        onDragLeave={() => setActive(false)}
        onDrop={(event) => { event.preventDefault(); setActive(false); inspect([...event.dataTransfer.files]); }}
        className={`mt-3 rounded-xl border border-dashed px-4 py-5 text-center transition ${active ? "border-brand-400/60 bg-brand-400/[0.06]" : "border-white/[0.12] bg-white/[0.012]"}`}
      >
        <p className="text-[11.5px] text-mist-400">Drag a file here, or</p>
        <label className="mt-1 inline-flex min-h-9 cursor-pointer items-center gap-1.5 px-1 text-[11.5px] font-semibold text-brand-300 hover:text-brand-200">
          choose a file to detect its type
          <input type="file" className="sr-only" onChange={(event) => { inspect([...event.target.files ?? []]); event.target.value = ""; }} />
        </label>
        <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-600">PDF · JPG · PNG · WebP · XLSX · CSV · JSON · XML · MD · TXT</p>
      </div>
      {warning && <p className="mt-2 text-[11.5px] text-amber-300">{warning}</p>}
      {detection && (
        <div className="mt-3">
          <p className="text-[11.5px] text-mist-300">Detected <span className="font-semibold text-mist-100">{detection.label}</span> (.{detection.extension}). Choose an operation:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {detection.tools.map((slug) => {
              const tool = getTool(slug);
              if (!tool) return null;
              return (
                <Link key={slug} href={`/tools/${slug}`} className="group inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-mist-300 transition hover:border-brand-400/30 hover:text-mist-50">
                  <Icon name={tool.icon} size={11} className="text-mist-500 group-hover:text-brand-300" />
                  {tool.shortName}
                  <Icon name="arrowUpRight" size={10} className="text-mist-600" />
                </Link>
              );
            })}
          </div>
          {detection.note && <p className="mt-2 text-[10.5px] leading-relaxed text-mist-500">{detection.note}</p>}
          <p className="mt-1.5 text-[10px] text-mist-600">Nothing was uploaded. Re-select the file inside the chosen tool to process it.</p>
        </div>
      )}
    </section>
  );
}
