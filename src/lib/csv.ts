export type CsvParseResult =
  | { ok: true; rows: string[][]; delimiter: string; errors: string[] }
  | { ok: false; error: string };

/** RFC 4180-style parser: quotes, escaped quotes and newlines inside quoted fields. */
export function parseCsv(text: string, forcedDelimiter?: string): CsvParseResult {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!input.trim()) return { ok: false, error: "The CSV is empty." };
  const delimiter = forcedDelimiter || detectDelimiter(input);
  const rows: string[][] = [];
  const errors: string[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = false;
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }
    if (char === '"') {
      if (field.trim() !== "") {
        errors.push(`Line ${line}: a quote starts inside an unquoted field. The quote was kept literally.`);
        field += char;
      } else {
        quoted = true;
      }
      continue;
    }
    if (char === delimiter) { row.push(field); field = ""; continue; }
    if (char === "\n") {
      row.push(field); rows.push(row); row = []; field = ""; line += 1; continue;
    }
    field += char;
  }
  if (quoted) errors.push("The file ends inside a quoted field. The last value may be truncated.");
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  const cleaned = rows.filter((entry) => entry.length > 1 || (entry[0] ?? "").trim() !== "");
  if (cleaned.length === 0) return { ok: false, error: "No data rows were found." };
  const width = cleaned[0].length;
  cleaned.forEach((entry, index) => {
    if (entry.length !== width) errors.push(`Row ${index + 1} has ${entry.length} fields but the header has ${width}. Columns may be misaligned.`);
  });
  return { ok: true, rows: cleaned, delimiter, errors };
}

export function detectDelimiter(text: string): string {
  const sample = text.split("\n").slice(0, 10).join("\n");
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  let quoted = false;
  for (const char of sample) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char] += 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function toCsv(rows: string[][], delimiter = ","): string {
  return rows
    .map((row) => row.map((cell) => {
      const value = cell ?? "";
      return /["\n\r]|^\s|\s$/.test(value) || value.includes(delimiter) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(delimiter))
    .join("\r\n");
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((name, index) => name.trim() || `column_${index + 1}`);
  return rows.slice(1).map((row) => Object.fromEntries(header.map((name, index) => [name, row[index] ?? ""])));
}

export function flatten(value: unknown, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  if (value === null || value === undefined) { result[prefix || "value"] = ""; return result; }
  if (Array.isArray(value)) {
    result[prefix || "value"] = value.map((entry) => (typeof entry === "object" ? JSON.stringify(entry) : String(entry))).join("; ");
    return result;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      Object.assign(result, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return result;
  }
  result[prefix || "value"] = String(value);
  return result;
}

export function downloadText(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
