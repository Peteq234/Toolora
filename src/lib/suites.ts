import type { IconName } from "@/components/Icons";
import { tools, type Tool } from "@/lib/tools";

export type SuiteAccent = "amber" | "sky" | "cyan" | "emerald" | "rose" | "pink" | "violet";

export type Suite = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  icon: IconName;
  accent: SuiteAccent;
  /** Ordered tool slugs. Every slug must exist in the tool registry. */
  toolSlugs: string[];
  /** When true, the suite links to dedicated tools instead of rendering them inline. */
  keepSeparate?: boolean;
  about: string[];
  popular?: boolean;
};

export const suites: Suite[] = [
  {
    slug: "calculator-hub",
    name: "Calculator Hub",
    shortName: "Calculators",
    tagline: "Everyday maths, money, dates and kitchen measurements in one place.",
    description:
      "Seventeen practical calculators with shared navigation: percentages and discounts, averages and grades, loans and mortgages, VAT, tips, fuel, electricity, unit and cooking conversions, dates and time zones.",
    metaTitle: "Calculator Hub — Everyday Online Calculators | Toolsy",
    metaDescription:
      "Use ten everyday calculators in one organised hub: percentage change, discounts, averages, grades, age, date difference, work hours, unit and cooking conversions.",
    icon: "calculator",
    accent: "amber",
    about: [
      "The Calculator Hub groups the everyday arithmetic people actually search for. Each calculator keeps its own dedicated page and its own explanation, so you can bookmark exactly the one you need.",
      "Every calculation runs in your browser. Inputs are not uploaded, and each tool shows its formula so you can check the result instead of trusting a black box.",
    ],
    toolSlugs: [
      "percentage-calculator",
      "percentage-increase-calculator",
      "discount-calculator",
      "average-calculator",
      "grade-calculator",
      "age-calculator",
      "date-difference-calculator",
      "time-duration-calculator",
      "unit-converter",
      "cooking-measurement-converter",
      "loan-mortgage-calculator",
      "vat-calculator",
      "tip-bill-splitter",
      "fuel-cost-calculator",
      "electricity-cost-calculator",
      "time-zone-converter",
      "working-days-calculator",
    ],
    popular: true,
  },
  {
    slug: "text-studio",
    name: "Text Studio",
    shortName: "Text",
    tagline: "Count, clean, compare and reshape writing without leaving the page.",
    description:
      "Word and character counting, case conversion, cleaning, de-duplication, sorting, reversing, placeholder copy, reading time and a line-by-line diff.",
    metaTitle: "Text Studio — Count, Clean & Compare Text | Toolsy",
    metaDescription:
      "An organised text workspace: word and character counter, case converter, text cleaner, duplicate remover, line sorter, reverser, lorem ipsum, reading time and diff checker.",
    icon: "fileText",
    accent: "sky",
    about: [
      "Text Studio is a set of independent text utilities that share navigation. Nothing is rewritten automatically: every transformation is applied only when you ask for it, and the original stays in the input until you replace it.",
      "All processing happens in your browser. Pasted drafts, lists and comparison text never leave the page, and nothing is saved between visits.",
    ],
    toolSlugs: [
      "word-counter",
      "case-converter",
      "text-cleaner",
      "remove-duplicate-lines",
      "sort-text-lines",
      "text-reverser",
      "lorem-ipsum-generator",
      "reading-time-calculator",
      "text-diff-checker",
    ],
    popular: true,
  },
  {
    slug: "image-studio",
    name: "Image Studio",
    shortName: "Images",
    tagline: "Compress, resize, crop, convert and inline images — locally.",
    description:
      "Ten image utilities with one consistent workspace, including batch processing with ZIP download, social presets, favicons, dimensions and EXIF inspection. Files are never uploaded.",
    metaTitle: "Image Studio — Compress, Resize, Crop & Convert | Toolsy",
    metaDescription:
      "Compress, resize, crop and convert JPEG, PNG and WebP images, or turn an image into Base64. All processing happens locally — no uploads, no account.",
    icon: "image",
    accent: "cyan",
    about: [
      "Image Studio brings the image workflows together without merging them into one confusing form. Compression, resizing, cropping, format conversion and Base64 encoding each keep a focused interface and a dedicated page.",
      "Images are read with local object URLs, drawn onto an in-browser canvas and exported as a new download. Nothing is transmitted to Toolsy, which matters for personal photos and confidential screenshots.",
    ],
    toolSlugs: [
      "image-compressor",
      "bulk-image-processor",
      "image-resizer",
      "image-cropper",
      "image-format-converter",
      "image-to-base64",
      "social-media-image-resizer",
      "favicon-generator",
      "image-dimensions-checker",
      "image-metadata-viewer",
    ],
    popular: true,
  },
  {
    slug: "developer-toolkit",
    name: "Developer Toolkit",
    shortName: "Developer",
    tagline: "Format, encode, test and look up the things you debug daily.",
    description:
      "Thirteen developer utilities: JSON, HTML, XML and SQL formatting, JavaScript minification, Base64, URL encoding, timestamps, regex, user agents, HTTP status codes and CSS colour tools.",
    metaTitle: "Developer Toolkit — JSON, Regex & Formatting | Toolsy",
    metaDescription:
      "A browser-based developer toolkit: JSON/HTML/XML/SQL formatters, JavaScript minifier, Base64 and URL encoding, timestamp converter, regex tester, HTTP status codes and accessibility colour tools.",
    icon: "code",
    accent: "emerald",
    about: [
      "The Developer Toolkit is an index over independent, focused utilities. Formatting, encoding, parsing and regex testing each have their own page, canonical URL and documentation, which keeps search results specific instead of one bloated page.",
      "Nothing is sent to a server: parsers, the regex engine, encoders and formatters all run in this tab. The JavaScript minifier is deliberately conservative — it removes comments and indentation but never rewrites your code.",
    ],
    toolSlugs: [
      "json-formatter-validator",
      "html-formatter",
      "xml-formatter",
      "sql-formatter",
      "javascript-minifier",
      "base64-encoder-decoder",
      "url-encoder-decoder",
      "timestamp-converter",
      "regex-tester",
      "user-agent-parser",
      "http-status-code-lookup",
      "css-gradient-generator",
      "color-contrast-checker",
      "javascript-formatter",
      "yaml-formatter",
      "hash-generator",
      "jwt-decoder",
      "cron-expression-helper",
      "unix-permissions-calculator",
      "number-base-converter",
    ],
    popular: true,
  },
  {
    slug: "pdf-toolkit",
    name: "PDF Workspace",
    shortName: "PDF",
    tagline: "Compress, convert, organise and extract PDFs — without uploading them.",
    description:
      "Nine PDF tools in one workspace: compress, export pages as images, build a PDF from pictures, reorder/rotate/delete pages, inspect metadata, extract text, merge, split and extract ranges.",
    metaTitle: "PDF Workspace — Compress, Convert & Organise PDFs | Toolsy",
    metaDescription:
      "A browser-based PDF workspace: compress PDFs, convert to JPG/PNG, images to PDF, reorder, rotate or delete pages, read metadata, extract text, merge, split and extract ranges. Files never uploaded.",
    icon: "layers",
    accent: "rose",
    about: [
      "PDF pages are read and rewritten with pdf-lib inside your browser. Confidential contracts, invoices and scans are not uploaded to a server, and the engine is lazy-loaded only when you open one of these tools.",
      "Browser-side PDF work has limits: encrypted files are refused, and some bookmarks, forms or signatures may not survive. Each tool explains that before you download.",
    ],
    toolSlugs: ["pdf-compressor", "pdf-to-images", "images-to-pdf", "pdf-organizer", "pdf-merge", "pdf-split", "pdf-page-extractor", "pdf-metadata-viewer", "pdf-to-text"],
  },
  {
    slug: "qr-toolkit",
    name: "QR Toolkit",
    shortName: "QR codes",
    tagline: "Create link, text and Wi-Fi QR codes that never expire.",
    description:
      "Two QR generators: one for links and short text, one for guest Wi-Fi details. Static codes, generated locally, downloadable as PNG.",
    metaTitle: "QR Toolkit — Link & Wi-Fi QR Codes | Toolsy",
    metaDescription:
      "Generate static QR codes for links or text, and scannable Wi-Fi QR codes with network name and password. Downloadable PNGs, generated locally with no redirects or expiry.",
    icon: "qr",
    accent: "pink",
    about: [
      "Both generators create static QR codes: the data is encoded directly into the pattern, with no shortener or redirect. Codes never expire and scans cannot be tracked by Toolsy.",
      "Wi-Fi codes contain the network password in scannable form. That is their purpose, but it means anyone who can see the code can join — print guest-network codes carefully.",
    ],
    toolSlugs: ["qr-code-generator", "wifi-qr-code-generator"],
  },
  {
    slug: "family-growth",
    name: "Family & Growth",
    shortName: "Family",
    tagline: "Two separate, reference-based growth estimates for children.",
    description:
      "A mid-parental adult-height estimate and a CDC BMI-for-age screening calculator. Deliberately kept as two separate tools with separate results.",
    metaTitle: "Family & Growth — Child Height & BMI Tools | Toolsy",
    metaDescription:
      "Estimate a child's adult height with the mid-parental method, or screen BMI-for-age using the CDC reference. Two separate tools with clear limits, not a diagnosis.",
    icon: "heart",
    accent: "violet",
    about: [
      "These two calculators are kept separate on purpose. One estimates adult height from parents' heights; the other interprets a child's BMI against age- and sex-specific CDC reference data. Combining them would invite the wrong conclusion.",
      "Both are screening or genetic estimates, not diagnoses, and neither replaces a paediatric assessment of growth over time. If you are worried about a child's growth, speak with a healthcare professional.",
    ],
    toolSlugs: ["parent-height-predictor", "childrens-bmi-calculator"],
    keepSeparate: true,
  },
  {
    slug: "file-converter",
    name: "File Converter",
    shortName: "Converters",
    tagline: "Move data between CSV, JSON, XML and spreadsheets — safely.",
    description:
      "Seven data tools: CSV ↔ JSON, JSON ↔ XML, a CSV viewer/editor, column sorter, duplicate remover, XLSX preview and a file size converter. Nothing is silently discarded.",
    metaTitle: "File Converter — CSV, JSON, XML & XLSX Tools | Toolsy",
    metaDescription:
      "Convert CSV to JSON and back, JSON to XML and back, view or edit CSV, sort and deduplicate rows, preview XLSX workbooks and convert file sizes. Local, with explicit data warnings.",
    icon: "code",
    accent: "emerald",
    about: [
      "Conversions are explicit: quoted CSV is parsed according to the format, nested JSON is flattened rather than dropped, and malformed data produces warnings with line references. Large files are processed on demand, not on every keystroke.",
      "Everything runs locally in your browser. Spreadsheet previews are read-only and formulas are not recalculated. The XLSX library is loaded only when you open that tool.",
    ],
    toolSlugs: ["csv-json-converter", "json-xml-converter", "csv-viewer-editor", "csv-column-sorter", "csv-duplicate-remover", "xlsx-preview", "file-size-converter"],
    popular: true,
  },
  {
    slug: "security-generators",
    name: "Security & Generators",
    shortName: "Security",
    tagline: "Passwords, passphrases, tokens, UUIDs and fair random draws.",
    description:
      "Eight generators using cryptographically secure browser randomness. Generated secrets are never transmitted, logged or saved automatically.",
    metaTitle: "Security & Generators — Passwords, Tokens & UUIDs | Toolsy",
    metaDescription:
      "Generate strong passwords, memorable passphrases, API tokens, UUID v4 identifiers, random numbers, fair picks and balanced teams with secure browser randomness. Nothing is uploaded.",
    icon: "shield",
    accent: "violet",
    about: [
      "All secrets are generated in the page with crypto.getRandomValues. Toolsy has no endpoint that receives passwords or tokens, and generated values disappear when you reload. Copy them into a password manager or secret store immediately.",
      "Choose length and randomness appropriate to the job: a passphrase for something you must type, a long random password or token for API secrets, and UUIDs only as identifiers — never as access credentials.",
    ],
    toolSlugs: ["password-generator", "passphrase-generator", "secure-token-generator", "uuid-generator", "username-generator", "random-number-generator", "random-choice-picker", "random-team-generator"],
    popular: true,
  },
  {
    slug: "student-productivity",
    name: "Student & Productivity",
    shortName: "Student",
    tagline: "Focus sessions, exam planning, flashcards, checklists and chess study.",
    description:
      "Five tools for study, personal organisation and opening practice, with local saving where it helps and no account required. Not decorative widgets: each one keeps state and works.",
    metaTitle: "Student & Productivity — Pomodoro, Flashcards & Chess | Toolsy",
    metaDescription:
      "A Pomodoro study timer, exam countdown, flashcard study deck, checklist maker and an interactive chess opening explorer. Local saving, no account, clear explanations.",
    icon: "checkCircle",
    accent: "amber",
    about: [
      "The study timer counts focus sessions for the current visit; the exam countdown, flashcard deck and checklist save locally in your browser so they survive reloads on the same device. Nothing syncs across devices and nothing is uploaded.",
      "The Chess Playground is a study board, not a game: explore legal moves and recognised openings against a real opening database, with no opponent, clocks or ranking. Use the Text Studio for longer writing and the Markdown editor for formatted notes with preview.",
    ],
    toolSlugs: ["study-pomodoro-timer", "exam-countdown", "flashcard-creator", "checklist-maker", "chess-playground"],
    popular: true,
  },
];

export function getSuite(slug: string): Suite | undefined {
  return suites.find((suite) => suite.slug === slug);
}

export function suiteTools(suite: Suite): Tool[] {
  return suite.toolSlugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function suiteForTool(slug: string): Suite | undefined {
  return suites.find((suite) => suite.toolSlugs.includes(slug));
}

const groupedSlugs = new Set(suites.flatMap((suite) => suite.toolSlugs));

/** Tools that intentionally live outside the suites (generators, timers, guides…). */
export const standaloneTools: Tool[] = tools.filter((tool) => !groupedSlugs.has(tool.slug));

export const suiteAccentClasses: Record<SuiteAccent, string> = {
  amber: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
  sky: "border-sky-400/20 bg-sky-400/[0.08] text-sky-300",
  cyan: "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300",
  emerald: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
  rose: "border-rose-400/20 bg-rose-400/[0.08] text-rose-300",
  pink: "border-pink-400/20 bg-pink-400/[0.08] text-pink-300",
  violet: "border-violet-400/20 bg-violet-400/[0.08] text-violet-300",
};

export const suiteGlowClasses: Record<SuiteAccent, string> = {
  amber: "from-amber-400/[0.07]",
  sky: "from-sky-400/[0.07]",
  cyan: "from-cyan-400/[0.07]",
  emerald: "from-emerald-400/[0.07]",
  rose: "from-rose-400/[0.07]",
  pink: "from-pink-400/[0.07]",
  violet: "from-violet-400/[0.07]",
};
